import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// 👇 O Espião de Segurança
import SystemLog from "@/models/SystemLog";

// PUT: Editar Usuário (Com Auditoria e Criptografia)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }, // ⚡️ Padrão Next.js 15
) {
  try {
    const session = await getServerSession(authOptions);
    const adminUser = session?.user as any;

    // 1. Trava de Segurança: Só Admin edita
    if (adminUser?.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params; // ⚡️ Await no params
    const data = await request.json();

    // 2. Prepara o objeto de atualização
    const updateData: any = {
      name: data.name,
      email: data.email,
      role: data.role,
      active: data.active,
    };

    // 3. 🔒 Se vier senha nova, criptografa
    if (data.password && data.password.trim() !== "") {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // 4. Atualiza o usuário
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-password");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // 5. 🕵️‍♂️ LOG DE AUDITORIA (Edição)
    await SystemLog.create({
      action: "USER_UPDATE", // Vamos usar o ícone genérico ou criar um novo se quiser
      description: `Editou perfil de: ${updatedUser.name} (${updatedUser.role})`,
      userId: adminUser.id || adminUser.email,
      userName: adminUser.name,
      level: "warning", // Amarelo, pois é uma ação administrativa sensível
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Excluir Usuário (Com Auditoria)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }, // ⚡️ Padrão Next.js 15
) {
  try {
    const session = await getServerSession(authOptions);
    const adminUser = session?.user as any;
    const currentUserId = adminUser?.id;

    // 1. Trava: Só Admin deleta
    if (adminUser?.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await params; // ⚡️ Await no params

    // 2. Trava: Não pode se deletar
    if (id === currentUserId) {
      return NextResponse.json(
        { error: "Você não pode excluir a si mesmo." },
        { status: 400 },
      );
    }

    await connectDB();

    // 3. Busca o alvo antes de deletar (para pegar o nome pro log)
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // 4. Deleta
    await User.findByIdAndDelete(id);

    // 5. 🕵️‍♂️ LOG DE AUDITORIA (Exclusão)
    await SystemLog.create({
      action: "USER_DELETE",
      description: `Excluiu o usuário: ${targetUser.name} (${targetUser.email})`,
      userId: adminUser.id || adminUser.email,
      userName: adminUser.name,
      level: "critical", // 🔴 Vermelho Crítico
    });

    return NextResponse.json({ message: "Usuário excluído" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
