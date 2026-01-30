import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Movement from "@/models/Movement";
import SystemLog from "@/models/SystemLog";
import { authOptions } from "@/lib/auth";

// 1. GET OMNIPOTENTE (Traz tudo por padrão para não falhar o alerta)
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    // 👇 A MUDANÇA: Se o Sidebar pedir 1000, usa 1000.
    // Se a tabela não pedir nada (undefined), usamos 10000 (TUDO).
    // Só usamos limite pequeno se for explicitamente pedido.
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 10000;

    // Filtros de busca
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

    // Busca no banco
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    // Retorna Array direto (para não quebrar sua tabela)
    return NextResponse.json(products);
  } catch (error) {
    console.error("Erro no GET Products:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 },
    );
  }
}

// 2. POST (Mantido igual)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
    }

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
