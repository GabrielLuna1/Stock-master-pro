import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Movement from "@/models/Movement";

// APENAS LEITURA PERMITIDA AQUI (Sem POST)
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
