import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
// 👇 Importação NOVA necessária para verificar dependências
import Product from "@/models/Product";
import SystemLog from "@/models/SystemLog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Listar Categorias (Público/Logado)
export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({}).sort({ name: 1 });
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Falha ao buscar categorias" },
      { status: 500 },
    );
  }
}

// POST: Criar Categoria (Qualquer logado pode, ou você pode restringir)
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 },
      );
    }

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 });

    const user = session.user as any;

    const newCategory = await Category.create({
      name: body.name.trim(),
      color: body.color || "#3b82f6",
    });

    // 🕵️‍♂️ LOG: Criação
    await SystemLog.create({
      action: "CATEGORY_CREATE",
      description: `Criou nova categoria: ${newCategory.name}`,
      userId: user.id || user.email,
      userName: user.name,
      level: "info",
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Esta categoria já existe" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 },
    );
  }
}

// 👇👇👇 AQUI ESTÁ A NOVA LÓGICA DE EXCLUSÃO SEGURA 👇👇👇
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 });

    const user = session.user as any;

    // 🛑 1. TRAVA DE SEGURANÇA: SÓ ADMIN PODE EXCLUIR
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Permissão negada. Apenas Admins podem excluir categorias." },
        { status: 403 },
      );
    }

    await connectDB();

    // 🛡️ 2. TRAVA DE INTEGRIDADE (SAFE DELETE)
    // Busca a categoria para saber o nome
    const categoryToDelete = await Category.findById(id);

    if (!categoryToDelete) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 },
      );
    }

    // Verifica se existe algum produto usando essa categoria
    const productsUsingCategory = await Product.countDocuments({
      category: categoryToDelete.name,
    });

    if (productsUsingCategory > 0) {
      return NextResponse.json(
        {
          error: `Bloqueado: Existem ${productsUsingCategory} produtos nesta categoria.`,
        },
        { status: 400 }, // Bad Request
      );
    }

    // 3. Se passou nas checagens, exclui
    await Category.findByIdAndDelete(id);

    // 4. Auditoria Crítica
    await SystemLog.create({
      action: "CATEGORY_DELETE",
      description: `Excluiu categoria: ${categoryToDelete.name}`,
      userId: user.id || user.email,
      userName: user.name,
      level: "critical",
    });

    return NextResponse.json({ message: "Categoria excluída com sucesso" });
  } catch (error: any) {
    console.error("Erro delete categoria:", error);
    return NextResponse.json(
      { error: "Erro ao excluir categoria" },
      { status: 500 },
    );
  }
}
