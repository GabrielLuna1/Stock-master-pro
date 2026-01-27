import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Movement from "@/models/Movement";

// --- MÉTODO EXISTENTE (NÃO MEXEMOS) ---
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    // Parâmetros de Paginação
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Filtros
    const productId = searchParams.get("productId");
    const filter = productId ? { productId } : {};

    // 1. Busca o total
    const totalDocs = await Movement.countDocuments(filter);

    // 2. Busca a fatia
    const history = await Movement.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 3. Retorna
    return NextResponse.json({
      data: history,
      pagination: {
        total: totalDocs,
        page: page,
        pages: Math.ceil(totalDocs / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar histórico" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // 1. TRADUÇÃO DE TIPOS (Inglês -> Português do Banco)
    let finalType = body.type;
    if (body.type === "IN") finalType = "ENTRADA";
    if (body.type === "OUT") finalType = "SAIDA";

    // 2. DATA
    const fakeDate = new Date(body.createdAt);

    // 3. CRIAÇÃO COM TODOS OS CAMPOS OBRIGATÓRIOS
    const newMovement = await Movement.create({
      productId: body.productId,
      type: finalType, // Agora vai em Português
      quantity: body.quantity,
      reason: body.reason,
      createdAt: fakeDate,

      // Dados de Estoque (Dummy para passar na validação)
      // O gráfico usa a movimentação, não o newStock, então 100 funciona
      newStock: 100,

      // Dados de Usuário
      userId: "507f1f77bcf86cd799439011",
      user: "Admin (Script)",
      author: "Admin (Script)",
    });

    return NextResponse.json(newMovement);
  } catch (error: any) {
    console.error("Erro Backdoor:", error);
    return NextResponse.json(
      {
        error: "Erro Fatal",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
