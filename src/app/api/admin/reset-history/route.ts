import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Movement from "@/models/Movement";
import SystemLog from "@/models/SystemLog";
import { authOptions } from "@/lib/auth";

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 🔒 TRAVA DE SEGURANÇA: Só Admin Supremo
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas Admin." },
        { status: 403 },
      );
    }

    await connectDB();

    // 🧹 1. Limpa Movimentações (Histórico de Entrada/Saída)
    const movementsResult = await Movement.deleteMany({});

    // 🧹 2. Limpa Logs de Auditoria (Quem fez o quê)
    const logsResult = await SystemLog.deleteMany({});

    // 📝 3. Opcional: Cria um ÚNICO log dizendo que houve um reset (O marco zero)
    // Se não quiser deixar rastro nenhum, remova estas linhas abaixo.
    await SystemLog.create({
      action: "SYSTEM_RESET",
      description: `O SISTEMA FOI RESETADO. Histórico apagado: ${movementsResult.deletedCount} movs, ${logsResult.deletedCount} logs.`,
      userId: (session.user as any).id,
      userName: session.user?.name || "Admin",
      level: "critical",
    });

    return NextResponse.json({
      success: true,
      message: "Sistema limpo com sucesso.",
      stats: {
        movements: movementsResult.deletedCount,
        logs: logsResult.deletedCount,
      },
    });
  } catch (error: any) {
    console.error("Erro no Reset:", error);
    return NextResponse.json(
      { error: "Falha ao resetar sistema." },
      { status: 500 },
    );
  }
}
