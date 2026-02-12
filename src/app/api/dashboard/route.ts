import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Movement from "@/models/Movement";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const queryMonth = searchParams.get("month");
    const queryYear = searchParams.get("year");

    const now = new Date();
    const month = queryMonth ? parseInt(queryMonth) : now.getMonth();
    const year = queryYear ? parseInt(queryYear) : now.getFullYear();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // 1. BUSCA PRODUTOS (Para calcular valor atual do estoque)
    const allProducts = await Product.find({}).lean();
    const totalProducts = allProducts.length;

    // 💰 CÁLCULOS PATRIMONIAIS (Status Atual)
    let totalStockValue = 0; // Valor de Custo (Dinheiro parado)
    let potentialRevenue = 0; // Valor de Venda (Potencial)

    // Mapa de Preços para usar nas movimentações (O(1) lookup)
    const productPriceMap: Record<string, { cost: number; sell: number }> = {};

    let lowStockProducts = 0;

    allProducts.forEach((p: any) => {
      const qty = Number(p.quantity || 0);
      const cost = Number(p.costPrice || 0);
      const price = Number(p.price || 0);
      const min = Number(p.minStock || p.minQuantity || 15);

      // Preenche mapa para usar no histórico depois
      productPriceMap[p._id.toString()] = { cost, sell: price };

      // Somas Patrimoniais
      totalStockValue += qty * cost;
      potentialRevenue += qty * price;

      if (qty <= min) lowStockProducts++;
    });

    // 2. BUSCA MOVIMENTAÇÕES (Para calcular fluxo do mês)
    const movementsInPeriod = await Movement.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    // 3. PROCESSAMENTO FINANCEIRO E OPERACIONAL
    let entriesCount = 0; // Quantidade física
    let exitsCount = 0; // Quantidade física

    let entriesValue = 0; // R$ Gasto em compras
    let exitsValue = 0; // R$ Ganho em vendas (Revenue)

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dayStr = String(d).padStart(2, "0");
      const monthStr = String(month + 1).padStart(2, "0");

      return {
        day: d,
        name: `${dayStr}/${monthStr}`,
        // Dados Estoque
        entradas: 0,
        saidas: 0,
        // Dados Financeiros
        receita: 0, // Vendas (Saída de estoque = Entrada de dinheiro)
        despesa: 0, // Compras (Entrada de estoque = Saída de dinheiro)
      };
    });

    movementsInPeriod.forEach((mov: any) => {
      const qty = Number(mov.quantity) || 0;
      const type = (mov.type || "").toLowerCase().trim();
      const prodId = mov.productId ? mov.productId.toString() : "";

      // Pega os preços deste produto (Usamos o preço atual como referência)
      const prices = productPriceMap[prodId] || { cost: 0, sell: 0 };

      const isEntry = ["entrada", "ajuste_entrada", "criacao"].includes(type);
      const isExit = ["saida", "ajuste_saida", "exclusao"].includes(type);

      const day = new Date(mov.createdAt).getDate();
      const dayIndex = day - 1;

      if (dayIndex >= 0 && dayIndex < daysInMonth) {
        if (isEntry) {
          // Operacional
          entriesCount += qty;
          dailyData[dayIndex].entradas += qty;

          // Financeiro (Entrada de estoque = Gasto/Investimento)
          const operationValue = qty * prices.cost;
          entriesValue += operationValue;
          dailyData[dayIndex].despesa += operationValue;
        }
        if (isExit) {
          // Operacional
          exitsCount += qty;
          dailyData[dayIndex].saidas += qty;

          // Financeiro (Saída de estoque = Faturamento)
          const operationValue = qty * prices.sell;
          exitsValue += operationValue;
          dailyData[dayIndex].receita += operationValue;
        }
      }
    });

    return NextResponse.json({
      summary: {
        // Operacional
        totalSkus: totalProducts,
        lowStock: lowStockProducts,
        monthlyEntries: entriesCount,
        monthlyExits: exitsCount,
        // Financeiro
        totalStockValue, // Total investido em estoque hoje
        potentialRevenue, // Quanto vale se vender tudo
        monthlyCost: entriesValue, // Quanto gastou repondo este mês
        monthlyRevenue: exitsValue, // Quanto faturou este mês
      },
      chartData: dailyData,
      meta: { month, year },
    });
  } catch (error: any) {
    console.error("❌ ERRO API:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
