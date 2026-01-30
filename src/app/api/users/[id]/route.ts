import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SystemLog from "@/models/SystemLog"; // ✅ Importação correta

// PUT: Editar Usuário (Com Trava de Segurança e Log Blindado)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const adminUser = session?.user as any;

    // 1. Trava Básica
    if (adminUser?.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const data = await request.json();

    // 2. Busca o alvo antes (para travar o Super Admin)
    const targetUser = await User.findById(id);

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // 🛡️ TRAVA SUPREMA
    if (targetUser.email === "admin@stockmaster.com") {
      if (adminUser.email !== "admin@stockmaster.com") {
        return NextResponse.json(
          { error: "🚫 AÇÃO NEGADA: Você não pode modificar o Super Admin." },
          { status: 403 },
        );
      }
    }

    // 3. Prepara dados
    const updateData: any = {
      name: data.name,
      role: data.role,
      active: data.active,
      email:
        targetUser.email === "admin@stockmaster.com"
          ? targetUser.email
          : data.email,
    };

    if (data.password && data.password.trim() !== "") {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // 4. Executa atualização
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-password");

    // 👇 CORREÇÃO AQUI: Verificamos se a atualização funcionou antes de logar
    if (!updatedUser) {
      return NextResponse.json(
        { error: "Erro ao atualizar usuário" },
        { status: 404 },
      );
    }

    // 5. Log Blindado
    try {
      await SystemLog.create({
        action: "USER_UPDATE",
        // 👇 Usamos ?. para evitar o erro se algo vier nulo
        description: `Editou perfil de: ${updatedUser?.name} (${updatedUser?.role})`,
        userId: adminUser?.id || adminUser?.email || "unknown_admin",
        userName: adminUser?.name || "Admin",
        level: "warning",
      });
    } catch (logError) {
      console.error("Erro de log ignorado:", logError);
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Excluir Usuário (Com Proteção)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const adminUser = session?.user as any;
    const currentUserId = adminUser?.id;

    if (adminUser?.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await params;

    if (id === currentUserId) {
      return NextResponse.json(
        { error: "Você não pode excluir a si mesmo." },
        { status: 400 },
      );
    }

    await connectDB();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // 🛡️ TRAVA DE SEGURANÇA SUPREMA NO DELETE 🛡️
    if (targetUser.email === "admin@stockmaster.com") {
      return NextResponse.json(
        { error: "🚫 CRÍTICO: O Super Admin nunca pode ser excluído." },
        { status: 403 },
      );
    }

    await User.findByIdAndDelete(id);

    // LOG DE EXCLUSÃO BLINDADO
    try {
      await SystemLog.create({
        action: "USER_DELETE",
        description: `Excluiu o usuário: ${targetUser.name} (${targetUser.email})`,
        userId: adminUser?.id || adminUser?.email || "unknown_admin",
        userName: adminUser?.name || "Admin",
        level: "critical",
      });
    } catch (logError) {
      console.error("Erro ao salvar log de delete:", logError);
    }

    return NextResponse.json({ message: "Usuário excluído" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
