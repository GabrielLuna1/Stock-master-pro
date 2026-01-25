import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import Product from "@/models/Product";
import Movement from "@/models/Movement";
import SystemLog from "@/models/SystemLog";

// ==========================================
// ATENÇÃO: Correção para Next.js 15/16
// params agora é uma Promise e precisa de await
// ==========================================

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }, // <--- MUDANÇA 1: Promise
) {
  const { id } = await params; // <--- MUDANÇA 2: Await

  // ... (Seu código de PUT original viria aqui.
  // Lembre-se de usar a variável 'id' ao invés de 'params.id' se for recuperar o código antigo)

  return NextResponse.json({ ok: true });
}

// 🗑️ DELETE COM RASTREAMENTO DETALHADO
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }, // <--- MUDANÇA 1: Promise
) {
  const { id } = await params; // <--- MUDANÇA 2: Await

  console.log("🔴 [DEBUG] 1. Iniciando Exclusão do ID:", id); // <--- Usa 'id' direto

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log("❌ [DEBUG] Sem sessão.");
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 });
    }

    await connectDB();
    const user = session.user as any;

    // 1. Busca
    const product = await Product.findById(id); // <--- Usa 'id'
    if (!product) {
      console.log("❌ [DEBUG] Produto não encontrado no banco.");
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    console.log("🟢 [DEBUG] 2. Produto encontrado:", product.name);

    // 2. Movimentação
    if (product.quantity > 0) {
      await Movement.create({
        productId: product._id,
        productName: product.name,
        type: "exclusao",
        quantity: product.quantity,
        oldStock: product.quantity,
        newStock: 0,
        userId: user.id || user.email,
        userName: user.name,
      });
      console.log("🟢 [DEBUG] 3. Movimentação criada.");
    }

    // 3. Deleta
    await Product.findByIdAndDelete(id); // <--- Usa 'id'
    console.log("🟢 [DEBUG] 4. Produto deletado.");

    // 4. Auditoria
    console.log("🟡 [DEBUG] 5. Tentando criar SystemLog...");

    try {
      const log = await SystemLog.create({
        action: "PRODUCT_DELETE",
        description: `Excluiu permanentemente: ${product.name} (SKU: ${product.sku})`,
        userId: user.id || user.email,
        userName: user.name,
        level: "critical",
      });
      console.log(
        "✅ [DEBUG] 6. LOG DE AUDITORIA CRIADO COM SUCESSO! ID:",
        log._id,
      );
    } catch (logError) {
      console.error("🔥 [ERRO NO LOG] O banco recusou salvar o log:", logError);
    }

    return NextResponse.json({ message: "Produto excluído" });
  } catch (error: any) {
    console.error("🔥 [ERRO GERAL]:", error);
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }, // <--- MUDANÇA 1: Promise
) {
  const { id } = await params; // <--- MUDANÇA 2: Await

  await connectDB();
  const product = await Product.findById(id); // <--- Usa 'id'
  if (!product)
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(product);
}
