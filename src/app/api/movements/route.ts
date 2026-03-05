import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import Movement from "@/models/Movement";

// 👇 NOVOS IMPORTS NECESSÁRIOS PARA SEGURANÇA

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

// GET: Buscar Histórico (Paginado)

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

// 👇 DELETE: O "MODO DEUS" PARA MOVIMENTAÇÕES

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");

    // 1. Autenticação

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as any;

    // 2. Trava de Segurança Suprema

    // Apenas o seu email pode apagar registros financeiros/estoque

    if (user.email !== "admin@stockmaster.com") {
      return NextResponse.json(
        { error: "Apenas o Admin Supremo pode alterar a linha do tempo." },

        { status: 403 },
      );
    }

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    await connectDB();

    // 3. Exclusão Silenciosa (Sem gerar log de exclusão)

    await Movement.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,

      message: "Registro de movimentação apagado.",
    });
  } catch (error) {
    console.error("Erro ao excluir movimentação:", error);

    return NextResponse.json(
      { error: "Erro interno ao excluir" },

      { status: 500 },
    );
  }
}
