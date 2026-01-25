import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Movement from "@/models/Movement";
import SystemLog from "@/models/SystemLog";
import { authOptions } from "@/lib/auth";

// 1. GET SIMPLIFICADO
export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({}).sort({ createdAt: -1 });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Erro no GET Products:", error);
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 });
  }
}

// 2. POST COM REGRA DE NEGÓCIO AJUSTADA (Histórico Completo)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();

    // Dados do usuário logado
    const user = session.user as any;
    const userId = user.id || user.email;

    // 1. Cria o Produto
    const newProduct = await Product.create({
      ...data,
      createdBy: userId,
      lastModifiedBy: userId,
    });

    // 2. Gera Movimentação de Estoque (SEMPRE GERA, MESMO SE FOR 0)
    // Regra: Todo nascimento de produto deve constar na linha do tempo
    await Movement.create({
      productId: newProduct._id,
      // Usamos "criacao" para aparecer no filtro de Cadastros e na Linha do Tempo como azul
      type: "criacao",
      quantity: newProduct.quantity, // Pode ser 0, sem problemas
      oldStock: 0,
      newStock: newProduct.quantity,
      userName: user.name,
      userId: userId,
      productName: newProduct.name,
    });

    // 3. O ESPIÃO (Grava na Auditoria Geral)
    await SystemLog.create({
      action: "PRODUCT_CREATE",
      description: `Cadastrou novo produto: ${newProduct.name} (SKU: ${newProduct.sku})`,
      userId: userId,
      userName: user.name,
      level: "info",
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
