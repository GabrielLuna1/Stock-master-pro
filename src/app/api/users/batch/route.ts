import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import SystemLog from "@/models/SystemLog";
import { authOptions } from "@/lib/auth";

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;

    // 🔒 Só Admin pode fazer isso
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Nenhum ID fornecido." },
        { status: 400 },
      );
    }

    await connectDB();

    // 🛡️ SEGURANÇA EXTRA: Filtrar IDs proibidos no Backend também
    // Busca os usuários que estão tentando ser deletados
    const usersToDelete = await User.find({ _id: { $in: ids } });

    // Filtra para garantir que não vai deletar o Supremo nem a si mesmo
    const safeIds = usersToDelete
      .filter(
        (u) =>
          u.email !== "admin@stockmaster.com" &&
          u._id.toString() !== currentUser.id,
      )
      .map((u) => u._id);

    if (safeIds.length === 0) {
      return NextResponse.json(
        { error: "Nenhum usuário válido para exclusão." },
        { status: 400 },
      );
    }

    // Deleta
    await User.deleteMany({ _id: { $in: safeIds } });

    // Log
    await SystemLog.create({
      action: "USER_BATCH_DELETE",
      description: `Exclusão em massa de ${safeIds.length} usuários.`,
      userId: currentUser.id,
      userName: currentUser.name,
      level: "critical",
    });

    return NextResponse.json({ success: true, count: safeIds.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
