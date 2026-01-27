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

// 👇 O "PORTAL" TEMPORÁRIO (ADICIONE ISSO PARA O VÍDEO) 👇
export async function POST(req: Request) {
  try {
    await connectDB(); // Garante conexão
    const body = await req.json();

    // Cria a movimentação forçando a data que mandamos no script
    const newMovement = await Movement.create({
      productId: body.productId,
      type: body.type,
      quantity: body.quantity,
      reason: body.reason,
      createdAt: new Date(body.createdAt), // 👈 Aqui está o segredo da viagem no tempo
    });

    return NextResponse.json(newMovement);
  } catch (error) {
    console.error("Erro no Backdoor:", error);
    return NextResponse.json(
      { error: "Erro ao criar histórico" },
      { status: 500 },
    );
  }
}
