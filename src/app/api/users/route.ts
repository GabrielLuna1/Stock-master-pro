import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import SystemLog from "@/models/SystemLog"; // 🕵️‍♂️ O Espião
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs"; // 🔐 Criptografia

// ----------------------------------------------------------------------
// 1. LISTAR USUÁRIOS (GET)
// ----------------------------------------------------------------------
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    // Busca usuários ordenados por nome, removendo a senha por segurança
    const users = await User.find().select("-password").sort({ name: 1 });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("❌ Erro na API GET /users:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 },
    );
  }
}

// ----------------------------------------------------------------------
// 2. CRIAR NOVO USUÁRIO (POST)
// ----------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Proteção: Apenas ADMIN cria
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem criar usuários." },
        { status: 403 },
      );
    }
    const adminUser = session.user as any;

    const body = await req.json();
    const { name, email, password, role } = body;

    // Validação
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios." },
        { status: 400 },
      );
    }

    await connectDB();

    // Verifica duplicidade
    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { error: "Este email já está cadastrado." },
        { status: 400 },
      );
    }

    // Criptografa senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      active: true,
    });

    // 🕵️‍♂️ LOG
    await SystemLog.create({
      action: "USER_CREATE",
      description: `Criou usuário: ${newUser.name} (${newUser.email}) - Cargo: ${newUser.role}`,
      userId: adminUser.id || adminUser.email,
      userName: adminUser.name,
      level: "warning",
    });

    return NextResponse.json({
      message: "Usuário criado com sucesso!",
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (error: any) {
    console.error("❌ Erro na API POST /users:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 },
    );
  }
}

// ----------------------------------------------------------------------
// 3. ATUALIZAR USUÁRIO (PUT) - Para editar nome/cargo/senha
// ----------------------------------------------------------------------
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Proteção: Apenas ADMIN edita
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    const adminUser = session.user as any;

    const body = await req.json();
    const { id, name, email, role, password } = body; // Senha é opcional aqui

    if (!id) {
      return NextResponse.json(
        { error: "ID do usuário obrigatório." },
        { status: 400 },
      );
    }

    await connectDB();
    const userToUpdate = await User.findById(id);

    if (!userToUpdate) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 },
      );
    }

    // 🛡️ REGRA: Não pode mudar o email do Admin Supremo
    if (
      userToUpdate.email === "admin@stockmaster.com" &&
      email !== "admin@stockmaster.com"
    ) {
      return NextResponse.json(
        { error: "Não é permitido alterar o email do Admin Supremo." },
        { status: 403 },
      );
    }

    // 🛡️ REGRA: Não pode rebaixar o Admin Supremo para 'Operador'
    if (userToUpdate.email === "admin@stockmaster.com" && role !== "admin") {
      return NextResponse.json(
        { error: "O Admin Supremo deve ser sempre Admin." },
        { status: 403 },
      );
    }

    // Atualiza campos básicos
    userToUpdate.name = name || userToUpdate.name;
    userToUpdate.email = email || userToUpdate.email;
    userToUpdate.role = role || userToUpdate.role;

    // Se mandou senha nova, criptografa e atualiza
    if (password && password.trim() !== "") {
      userToUpdate.password = await bcrypt.hash(password, 10);
    }

    await userToUpdate.save();

    // 🕵️‍♂️ LOG
    await SystemLog.create({
      action: "USER_UPDATE",
      description: `Editou usuário: ${userToUpdate.name} (${userToUpdate.email})`,
      userId: adminUser.id || adminUser.email,
      userName: adminUser.name,
      level: "warning",
    });

    return NextResponse.json({ success: true, message: "Usuário atualizado!" });
  } catch (error: any) {
    console.error("❌ Erro API PUT /users:", error);
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// 4. EXCLUIR USUÁRIO (DELETE) - Com a Regra do Supremo
// ----------------------------------------------------------------------
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Proteção: Apenas ADMIN exclui
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    const adminUser = session.user as any;

    const body = await req.json();
    const { id } = body;

    if (!id)
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    await connectDB();
    const userToDelete = await User.findById(id);

    if (!userToDelete) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 },
      );
    }

    // 🛡️ 1. REGRA DO ADMIN SUPREMO (BLINDAGEM)
    const SUPREME_EMAIL = "admin@stockmaster.com";

    if (userToDelete.email === SUPREME_EMAIL) {
      return NextResponse.json(
        { error: "AÇÃO PROIBIDA: O Admin Supremo é intocável." },
        { status: 403 },
      );
    }

    // 🛡️ 2. Previne Suicídio Digital (Admin deletar a si mesmo)
    if (userToDelete.email === session.user?.email) {
      return NextResponse.json(
        { error: "Você não pode excluir sua própria conta." },
        { status: 403 },
      );
    }

    // Deleta de verdade
    await User.findByIdAndDelete(id);

    // 🕵️‍♂️ LOG DE ALTO RISCO (Critical)
    await SystemLog.create({
      action: "USER_DELETE",
      description: `EXCLUIU O USUÁRIO: ${userToDelete.name} (${userToDelete.email})`,
      userId: adminUser.id || adminUser.email,
      userName: adminUser.name,
      level: "critical", // Nível Crítico (Vermelho)
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Erro API DELETE /users:", error);
    return NextResponse.json({ error: "Erro ao excluir." }, { status: 500 });
  }
}
