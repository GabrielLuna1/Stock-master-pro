import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SystemLog from "@/models/SystemLog";
import { getServerSession } from "next-auth"; // 👈 Import necessário
import { authOptions } from "@/lib/auth"; // 👈 Import necessário

// BUSCAR LOGS (Para a tela de Auditoria)
export async function GET(request: Request) {
  try {
    await connectDB();
    const logs = await SystemLog.find().sort({ createdAt: -1 }).limit(100);
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar logs" }, { status: 500 });
  }
}

// CRIAR LOG (Para o botão de PDF e outras ações manuais)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectDB();
    await SystemLog.create(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar log" }, { status: 500 });
  }
}

// 👇 O PODER DE DEUS (EXCLUSÃO SILENCIOSA) 🤫
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // 1. Autenticação
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;

    // 2. Trava de Segurança: Só o Admin Principal pode apagar a história
    // Coloque aqui o SEU email de admin
    const MASTER_ADMIN_EMAIL = "admin@stockmaster.com";

    if (user.email !== MASTER_ADMIN_EMAIL && user.role !== "admin") {
      return NextResponse.json(
        { error: "Sem permissão para apagar a história." },
        { status: 403 },
      );
    }

    if (!id)
      return NextResponse.json({ error: "ID necessário" }, { status: 400 });

    await connectDB();

    // 3. O Ato Final: Exclusão sem gerar novo log
    await SystemLog.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Log apagado da existência.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao apagar log" }, { status: 500 });
  }
}
