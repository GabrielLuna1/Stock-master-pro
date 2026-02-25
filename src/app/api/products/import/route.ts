import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Movement from "@/models/Movement";
import SystemLog from "@/models/SystemLog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;
    const { products } = await request.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Nenhum produto válido encontrado no CSV." },
        { status: 400 },
      );
    }

    await connectDB();

    // 1. Salva os produtos no catálogo
    const insertedProducts = await Product.insertMany(products);

    // 2. 🛡️ O Histórico de Movimentações (Agora idêntico à criação manual)
    let movementsCount = 0;
    try {
      const movements = insertedProducts
        .filter((p) => p.quantity > 0)
        .map((p) => ({
          productId: p._id, // Vínculo oficial com o ID
          product: p._id, // Backup de vínculo
          productName: p.name, // 👈 MÁGICA 1: Força o nome a aparecer na tabela!
          type: "CRIAÇÃO", // 👈 MÁGICA 2: Usa a exata nomenclatura do seu sistema
          action: "CRIAÇÃO",
          quantity: p.quantity,
          user: user.name || user.email || "Sistema",
          description: "Importação inicial via CSV", // Previne campos vazios
          reason: "Importação de Planilha",
        }));

      if (movements.length > 0) {
        await Movement.insertMany(movements);
        movementsCount = movements.length;
      }
    } catch (movError) {
      console.log("⚠️ Erro ao salvar movimentações:", movError);
    }

    // 3. 🛡️ O Caderno de Auditoria (Agora com os campos corretos)
    try {
      await SystemLog.create({
        user: user.name || user.email || "Sistema",
        action: "IMPORTAÇÃO DE CSV",
        description: `Importou ${insertedProducts.length} produtos em lote via arquivo CSV.`, // 👈 MÁGICA 3: description em vez de details
        level: "INFO", // 👈 MÁGICA 4: O nível obrigatório da sua tabela!
      });
    } catch (logError) {
      console.log("⚠️ Erro ao salvar log:", logError);
    }

    return NextResponse.json(
      {
        success: true,
        message: `${insertedProducts.length} produtos importados com sucesso!`,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Erro fatal na importação:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Erro: O CSV contém SKUs que já existem no sistema." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Erro interno ao importar produtos." },
      { status: 500 },
    );
  }
}
