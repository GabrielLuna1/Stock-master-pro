import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import Movement from "@/models/Movement";

// APENAS LEITURA PERMITIDA AQUI

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url); // Parâmetros de Paginação

    const page = parseInt(searchParams.get("page") || "1");

    const limit = parseInt(searchParams.get("limit") || "20");

    const skip = (page - 1) * limit; // Filtros

    const productId = searchParams.get("productId");

    const filter = productId ? { productId } : {}; // 1. Busca o total

    const totalDocs = await Movement.countDocuments(filter); // 2. Busca a fatia

    const history = await Movement.find(filter)

      .sort({ createdAt: -1 }) // Mais recentes primeiro

      .skip(skip)

      .limit(limit); // 3. Retorna

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
