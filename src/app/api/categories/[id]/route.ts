import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";
// 👇 Importações de Segurança e Auditoria
import SystemLog from "@/models/SystemLog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 📝 PUT: EDITAR CATEGORIA (Com Auditoria)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Segurança: Verifica quem está tentando editar
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 });
    }
    const user = session.user as any;

    await connectDB();

    // ⚡️ Mantendo sua correção mágica do Next.js 15
    const { id } = await params;

    const { name, color } = await req.json();
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");

    const updated = await Category.findByIdAndUpdate(
      id,
      { name: name.trim(), color, slug },
      { new: true, runValidators: true },
    );

    if (!updated)
      return NextResponse.json({ error: "ID não encontrado" }, { status: 404 });

    // 🕵️‍♂️ 2. O ESPIÃO: Grava Log de Edição
    await SystemLog.create({
      action: "CATEGORY_UPDATE",
      description: `Editou categoria: ${updated.name}`,
      userId: user.id || user.email,
      userName: user.name,
      level: "info",
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }
}

// 🗑️ DELETE: EXCLUIR CATEGORIA (Com Auditoria e Trava de Segurança)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Segurança: Verifica quem está tentando excluir
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 });
    }
    const user = session.user as any;

    await connectDB();

    // ⚡️ Mantendo sua correção mágica do Next.js 15
    const { id } = await params;

    const category = await Category.findById(id);
    if (!category)
      return NextResponse.json(
        { error: "Categoria não existe." },
        { status: 404 },
      );

    // 2. Trava de Segurança (Produtos Vinculados) - Mantida!
    const hasLinkedProducts = await Product.findOne({
      $or: [{ category: id }, { category: category.name }],
    });

    if (hasLinkedProducts) {
      // Opcional: Logar tentativa falha de exclusão (Warning)
      await SystemLog.create({
        action: "CATEGORY_DELETE_FAIL",
        description: `Tentou excluir categoria vinculada: ${category.name}`,
        userId: user.id || user.email,
        userName: user.name,
        level: "warning",
      });

      return NextResponse.json(
        { error: "Bloqueado: Existem produtos vinculados a esta categoria." },
        { status: 400 },
      );
    }

    // 3. Exclusão Real
    await Category.findByIdAndDelete(id);

    // 🕵️‍♂️ 4. O ESPIÃO: Grava Log de Exclusão (Crítico)
    await SystemLog.create({
      action: "CATEGORY_DELETE",
      description: `Excluiu categoria: ${category.name}`,
      userId: user.id || user.email,
      userName: user.name,
      level: "critical", // 🔴 Alerta Vermelho
    });

    return NextResponse.json({ message: "Sucesso!" });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
