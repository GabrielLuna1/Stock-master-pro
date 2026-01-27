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

// 👇 SUBSTITUA APENAS A FUNÇÃO POST NO FINAL DO ARQUIVO 👇

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Preparar o objeto com campos extras de segurança
    // Caso seu banco exija saber "quem" fez a ação
    const movementData = {
      productId: body.productId,
      type: body.type,
      quantity: body.quantity,
      reason: body.reason,
      createdAt: new Date(body.createdAt),
      // Adicionamos valores "dummy" para satisfazer validadores comuns
      userId: "SCRIPT-VIDEO",
      user: "Admin (Script)",
    };

    const newMovement = await Movement.create(movementData);

    return NextResponse.json(newMovement);
  } catch (error: any) {
    console.error("Erro Backdoor:", error);
    // 👇 AQUI ESTÁ A SOLUÇÃO: Retornamos o motivo exato do erro
    return NextResponse.json(
      {
        error: "Erro no Banco de Dados",
        details: error.message, // <--- Isso vai nos dizer o que está faltando!
      },
      { status: 500 },
    );
  }
}
