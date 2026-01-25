import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Movement from "@/models/Movement";
import SystemLog from "@/models/SystemLog";
import { authOptions } from "@/lib/auth";

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    // 🔒 1. Verifica se está logado e é Admin
    if (!session || user.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    // 👑 2. TRAVA SUPREMA: Verifica o E-mail Exato
    const SUPREME_EMAIL = "admin@stockmaster.com";

    if (user.email !== SUPREME_EMAIL) {
      return NextResponse.json(
        {
          error:
            "PERIGO: Apenas o Admin Supremo tem permissão para resetar o sistema.",
        },
        { status: 403 },
      );
    }

    await connectDB();

    // ... (Código de apagar movements e logs continua igual)
    const movementsResult = await Movement.deleteMany({});
    const logsResult = await SystemLog.deleteMany({});

    // Log do evento
    await SystemLog.create({
      action: "SYSTEM_RESET",
      description: `O SUPREMO RESETOU O SISTEMA. Histórico apagado.`,
      userId: user.id,
      userName: user.name,
      level: "critical",
    });

    return NextResponse.json({
      success: true,
      message: "Sistema limpo com sucesso.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Falha ao resetar sistema." },
      { status: 500 },
    );
  }
}
