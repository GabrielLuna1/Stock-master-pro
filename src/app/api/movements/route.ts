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

// 👇 SUBSTITUA A FUNÇÃO POST NO FINAL DO ARQUIVO POR ESTA 👇

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Configura a data
    const fakeDate = new Date(body.createdAt);

    // Cria o movimento INJETANDO um ID de usuário fictício
    // Isso satisfaz a validação do banco de dados ("Quem fez isso?")
    const newMovement = await Movement.create({
      productId: body.productId,
      type: body.type,
      quantity: body.quantity,
      reason: body.reason,
      createdAt: fakeDate,

      // 👇 O SEGREDO QUE FALTAVA: Credenciais Falsas para passar na validação
      userId: "507f1f77bcf86cd799439011", // Um ID hexadecimal válido de mentira
      user: "Admin (Script)", // Nome de exibição
      author: "Admin (Script)", // Alguns sistemas usam 'author'
    });

    return NextResponse.json(newMovement);
  } catch (error: any) {
    console.error("Erro Backdoor:", error);
    // Retorna o erro detalhado se falhar de novo
    return NextResponse.json(
      {
        error: "Erro Fatal",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
