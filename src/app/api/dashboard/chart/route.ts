import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Movement from "@/models/Movement";
import { subDays, eachDayOfInterval, format } from "date-fns";

export async function GET() {
  try {
    await connectDB();

    // 1. Define o intervalo (Últimos 30 dias)
    // Aumentamos de 7 para 30 para ter histórico mensal e permitir o filtro de "Mês Atual" no front
    const endDate = new Date();
    const startDate = subDays(endDate, 30);

    // 2. Busca TODAS as movimentações do período (sem agrupar no banco ainda)
    const movements = await Movement.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // 3. Gera um array com TODOS os dias do intervalo (para o gráfico não ter buracos de datas)
    const daysInterval = eachDayOfInterval({ start: startDate, end: endDate });

    // 4. Monta o objeto final dia a dia no Javascript
    const chartData = daysInterval.map((date) => {
      const dayStr = format(date, "yyyy-MM-dd");
      const label = format(date, "dd/MM"); // Formato visual do eixo X (Ex: 23/01)

      // Filtra as movimentações que aconteceram NESTE dia específico
      const daysMoves = movements.filter(
        (m) => format(new Date(m.createdAt), "yyyy-MM-dd") === dayStr,
      );

      // SOMA ENTRADAS
      // Mantendo sua lógica original: (entrada + ajuste_entrada + criacao)
      const entradas = daysMoves
        .filter((m) =>
          ["entrada", "ajuste_entrada", "criacao"].includes(m.type),
        )
        .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

      // SOMA SAÍDAS
      // Mantendo sua lógica original: (saida + ajuste_saida + exclusao)
      const saidas = daysMoves
        .filter((m) => ["saida", "ajuste_saida", "exclusao"].includes(m.type))
        .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

      return {
        name: label, // Ex: 23/01
        fullDate: date, // Data completa (usada no frontend para filtrar o mês corrente)
        entradas,
        saidas,
      };
    });

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Erro no gráfico:", error);
    return NextResponse.json(
      { error: "Erro ao gerar gráfico" },
      { status: 500 },
    );
  }
}
