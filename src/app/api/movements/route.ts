import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Movement from "@/models/Movement";
import Product from "@/models/Product"; // Importante!

// GET (Mantém igual)
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const productId = searchParams.get("productId");
    const filter = productId ? { productId } : {};
    const totalDocs = await Movement.countDocuments(filter);
    const history = await Movement.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return NextResponse.json({
      data: history,
      pagination: {
        total: totalDocs,
        page,
        pages: Math.ceil(totalDocs / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro GET" }, { status: 500 });
  }
}

// 👇 POST BLINDADO V4 👇
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // 1. Pega o Produto para preencher productName e oldStock
    const product = await Product.findById(body.productId);
    if (!product)
      return NextResponse.json(
        { error: "Produto não achado" },
        { status: 404 },
      );

    // 2. Descobre os ENUMS válidos (O Pulo do Gato 🐱)
    // Se o banco recusar, vamos saber exatamente o que ele aceita
    const validTypes = (Movement.schema.path("type") as any).enumValues || [];

    // Tenta adivinhar o tipo correto baseado no que o banco aceita
    let finalType = body.type; // Começa com o que veio (ENTRADA/SAIDA)

    // Se o banco aceita 'input'/'output' (inglês minúsculo)
    if (validTypes.includes("input"))
      finalType = body.type === "ENTRADA" ? "input" : "output";
    // Se o banco aceita 'IN'/'OUT' (inglês maiúsculo)
    if (validTypes.includes("IN"))
      finalType = body.type === "ENTRADA" ? "IN" : "OUT";
    // Se o banco aceita 'Entrada'/'Saida' (Capitalizado)
    if (validTypes.includes("Entrada"))
      finalType = body.type === "ENTRADA" ? "Entrada" : "Saida";

    // 3. Monta o Objeto Completo
    const payload = {
      productId: body.productId,
      productName: product.name, // Preenchendo o que faltava

      type: finalType,
      quantity: Number(body.quantity),
      reason: body.reason,

      // Dados de Estoque (Inventados mas válidos)
      oldStock: product.quantity || 0,
      newStock: product.quantity || 0,

      // Dados de Usuário
      userId: "507f1f77bcf86cd799439011",
      userName: "Admin Script",
      user: "Admin Script",

      createdAt: new Date(body.createdAt),
    };

    const newMovement = await Movement.create(payload);
    return NextResponse.json(newMovement);
  } catch (error: any) {
    console.error("Erro Backdoor:", error);

    // 👇 RETORNA OS TIPOS VÁLIDOS PARA A GENTE VER NO CONSOLE
    const validTypes = (Movement.schema.path("type") as any).enumValues;

    return NextResponse.json(
      {
        error: "Erro de Validação",
        details: error.message,
        ACCEPTED_TYPES: validTypes, // <--- Isso vai nos salvar!
      },
      { status: 500 },
    );
  }
}
