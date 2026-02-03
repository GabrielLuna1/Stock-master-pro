import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import SystemLog from "@/models/SystemLog";
import { authOptions } from "@/lib/auth";
// O bcrypt não é mais necessário aqui para criar/editar, pois o Model faz isso!

// ----------------------------------------------------------------------
// 1. LISTAR USUÁRIOS (GET)
// ----------------------------------------------------------------------
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await connectDB();
    const users = await User.find().select("-password").sort({ name: 1 });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 },
    );
  }
}

// ----------------------------------------------------------------------
// 2. CRIAR NOVO USUÁRIO (POST) - SEM CRIPTOGRAFIA MANUAL
// ----------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Permissão negada." }, { status: 403 });
    }
    const adminUser = session.user as any;

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios." },
        { status: 400 },
      );
    }

    await connectDB();

    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { error: "Este email já está cadastrado." },
        { status: 400 },
      );
    }

    // ⚠️ MUDANÇA AQUI: Passamos a senha "crua". O User.ts vai criptografar sozinho!
    const newUser = await User.create({
      name,
      email,
      password: password, // <-- Texto puro aqui
      role,
      active: true,
    });

    // LOG
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
    console.error("Erro POST /users:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 },
    );
  }
}

// ----------------------------------------------------------------------
// 3. ATUALIZAR USUÁRIO (PUT) - SEM CRIPTOGRAFIA MANUAL
// ----------------------------------------------------------------------
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    const adminUser = session.user as any;

    const body = await req.json();
    const { id, name, email, role, password } = body;

    if (!id)
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

    await connectDB();
    const userToUpdate = await User.findById(id);

    if (!userToUpdate)
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 },
      );

    // Regras de Proteção do Admin Supremo
    if (userToUpdate.email === "admin@stockmaster.com") {
      if (email !== "admin@stockmaster.com" || role !== "admin") {
        return NextResponse.json(
          { error: "O Admin Supremo é imutável." },
          { status: 403 },
        );
      }
    }

    // Atualiza campos
    userToUpdate.name = name || userToUpdate.name;
    userToUpdate.email = email || userToUpdate.email;
    userToUpdate.role = role || userToUpdate.role;

    // ⚠️ MUDANÇA AQUI: Se tiver senha nova, passa ela "crua". O Model detecta a mudança e criptografa.
    if (password && password.trim() !== "") {
      userToUpdate.password = password;
    }

    await userToUpdate.save(); // O pre('save') do Model roda aqui!

    // LOG
    await SystemLog.create({
      action: "USER_UPDATE",
      description: `Editou usuário: ${userToUpdate.name} (${userToUpdate.email})`,
      userId: adminUser.id || adminUser.email,
      userName: adminUser.name,
      level: "warning",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// 4. EXCLUIR USUÁRIO (DELETE)
// ----------------------------------------------------------------------
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
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

    if (!userToDelete)
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 },
      );
    if (
      userToDelete.email === "admin@stockmaster.com" ||
      userToDelete.email === session.user?.email
    ) {
      return NextResponse.json({ error: "Ação proibida." }, { status: 403 });
    }

    await User.findByIdAndDelete(id);

    await SystemLog.create({
      action: "USER_DELETE",
      description: `EXCLUIU O USUÁRIO: ${userToDelete.name} (${userToDelete.email})`,
      userId: adminUser.id || adminUser.email,
      userName: adminUser.name,
      level: "critical",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao excluir." }, { status: 500 });
  }
}
