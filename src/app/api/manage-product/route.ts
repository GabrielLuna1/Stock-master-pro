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

    // ✨ 4. O MODO TANQUE DE GUERRA ($set e $unset) ✨
    const setPayload = { ...data, lastModifiedBy: user.id };
    const unsetPayload: any = {};

    // Removemos os IDs do pacote para o banco não dar erro de "Immutable field"
    delete setPayload._id;
    delete setPayload.id;

    // Se o EAN vier vazio, removemos do "set" e mandamos o banco DESTRUIR com "unset"
    if (
      setPayload.hasOwnProperty("ean") &&
      (!setPayload.ean || String(setPayload.ean).trim() === "")
    ) {
      delete setPayload.ean;
      unsetPayload.ean = 1; // 1 significa "verdadeiro, destrua esse campo"
    }

    // Mesma coisa para o fornecedor
    if (
      setPayload.hasOwnProperty("supplier") &&
      (!setPayload.supplier || String(setPayload.supplier).trim() === "")
    ) {
      delete setPayload.supplier;
      unsetPayload.supplier = 1;
    }

    // Montamos a operação cirúrgica
    const updateOperation: any = { $set: setPayload };

    // Se tiver algo pra destruir, adicionamos na operação
    if (Object.keys(unsetPayload).length > 0) {
      updateOperation.$unset = unsetPayload;
    }

    // 5. Atualiza o Produto (Enviando a operação blindada)
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateOperation,
      { new: true },
    );

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
    console.error("🚨 Erro Crítico no Backend:", error);
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
