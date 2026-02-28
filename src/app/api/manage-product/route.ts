import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Movement from "@/models/Movement"; // 👈 Essencial para o fluxo
import SystemLog from "@/models/SystemLog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 📝 PUT: EDITAR PRODUTO (COM CÁLCULO DE MOVIMENTAÇÃO)
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 });

    await connectDB();
    const data = await request.json();
    const user = session.user as any;

    // 1. 🔍 Busca o produto COMO ELE É HOJE (Antes de editar)
    const oldProduct = await Product.findById(id);
    if (!oldProduct)
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );

    // 2. 🧮 Calcula a Diferença de Estoque
    // Se não vier quantidade no payload, assume que não mudou (usa a antiga)
    const newQty =
      data.quantity !== undefined
        ? Number(data.quantity)
        : Number(oldProduct.quantity);
    const oldQty = Number(oldProduct.quantity);
    const diff = newQty - oldQty;

    // 3. ⚡️ GERA MOVIMENTAÇÃO AUTOMÁTICA (O Pulo do Gato)
    if (diff !== 0) {
      await Movement.create({
        productId: oldProduct._id,
        productName: oldProduct.name, // Usa o nome original para consistência
        type: diff > 0 ? "entrada" : "saida", // Define se entrou ou saiu
        quantity: Math.abs(diff), // Salva sempre positivo (ex: -5 vira 5 de saída)
        oldStock: oldQty,
        newStock: newQty,
        userId: user.id || user.email,
        userName: user.name,
      });
    }

    // ✨ 4. O FILTRO BLINDADO GLOBAL (A VACINA) ✨
    // Limpa strings vazias no EAN e no Fornecedor para não dar o erro E11000 no MongoDB
    const updatePayload = { ...data, lastModifiedBy: user.id };

    if (!updatePayload.ean || String(updatePayload.ean).trim() === "") {
      delete updatePayload.ean;
    }

    if (
      !updatePayload.supplier ||
      String(updatePayload.supplier).trim() === ""
    ) {
      delete updatePayload.supplier;
    }

    // 5. Atualiza o Produto (Enviando o pacote blindado)
    const updatedProduct = await Product.findByIdAndUpdate(id, updatePayload, {
      new: true,
    });

    // 6. Auditoria (Mantida)
    await SystemLog.create({
      action: "PRODUCT_UPDATE",
      description: `Editou produto: ${updatedProduct.name}. Estoque: ${oldQty} -> ${newQty}`,
      userId: user.id || user.email,
      userName: user.name,
      level: "info",
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🗑️ DELETE: EXCLUIR PRODUTO (Mantido e revisado)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 });

    await connectDB();
    const user = session.user as any;

    // 1. Busca dados antes de apagar
    const product = await Product.findById(id);
    if (!product)
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );

    // 2. Zera estoque nas Movimentações (Gera Saída Total)
    if (product.quantity > 0) {
      await Movement.create({
        productId: product._id,
        productName: product.name,
        type: "exclusao", // O gráfico vai ler isso como saída se configurarmos, ou podemos mudar para "saida"
        quantity: product.quantity,
        oldStock: product.quantity,
        newStock: 0,
        userId: user.id || user.email,
        userName: user.name,
      });
    }

    // 3. Deleta o produto
    await Product.findByIdAndDelete(id);

    // 4. Log de Segurança
    await SystemLog.create({
      action: "PRODUCT_DELETE",
      description: `Excluiu permanentemente: ${product.name} (SKU: ${product.sku})`,
      userId: user.id || user.email,
      userName: user.name,
      level: "critical",
    });

    return NextResponse.json({ message: "Produto excluído" });
  } catch (error: any) {
    console.error("Erro delete:", error);
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
