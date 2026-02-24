import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Movement from "@/models/Movement";
import SystemLog from "@/models/SystemLog";
import { authOptions } from "@/lib/auth";

// 1. GET - Busca de Produtos
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 10000;

    const filter: any = {};
    const query = searchParams.get("query");
    const category = searchParams.get("category");

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { sku: { $regex: query, $options: "i" } },
      ];
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json(products);
  } catch (error) {
    console.error("Erro no GET Products:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 },
    );
  }
}

// 2. POST - Cadastro de novo produto
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Acesso negado." }, { status: 401 });

    await connectDB();
    const data = await request.json();
    const user = session.user as any;
    const userId = user.id || user.email;

    const newProduct = await Product.create({
      ...data,
      createdBy: userId,
      lastModifiedBy: userId,
    });

    await Movement.create({
      productId: newProduct._id,
      type: "criacao",
      quantity: newProduct.quantity,
      oldStock: 0,
      newStock: newProduct.quantity,
      userName: user.name,
      userId: userId,
      productName: newProduct.name,
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// 3. ✨ A CORREÇÃO: PUT - Atualização e Baixa de Estoque
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Acesso negado." }, { status: 401 });

    await connectDB();
    const data = await request.json();
    const { _id, ...updateData } = data;

    if (!_id)
      return NextResponse.json({ error: "ID não fornecido." }, { status: 400 });

    const user = session.user as any;
    const userId = user.id || user.email;

    // Busca o estado anterior do produto para auditoria
    const oldProduct = await Product.findById(_id);
    if (!oldProduct)
      return NextResponse.json(
        { error: "Produto não encontrado." },
        { status: 404 },
      );

    const oldQty = Number(oldProduct.quantity);
    const newQty = Number(updateData.quantity);

    // Executa a atualização no banco
    const updatedProduct = await Product.findByIdAndUpdate(
      _id,
      { ...updateData, lastModifiedBy: userId },
      { new: true },
    );

    // Se houve mudança na quantidade, registra a movimentação
    if (oldQty !== newQty) {
      await Movement.create({
        productId: _id,
        type: newQty < oldQty ? "saida" : "entrada",
        quantity: Math.abs(newQty - oldQty),
        oldStock: oldQty,
        newStock: newQty,
        userName: user.name,
        userId: userId,
        productName: updatedProduct.name,
      });

      // Log de Sistema
      await SystemLog.create({
        action: "PRODUCT_UPDATE",
        description: `Movimentação de estoque: ${updatedProduct.name} (De ${oldQty} para ${newQty})`,
        userId: userId,
        userName: user.name,
        level: "info",
      });
    }

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error("Erro no PUT Products:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
