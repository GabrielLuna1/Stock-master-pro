import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Movement from "@/models/Movement";
import SystemLog from "@/models/SystemLog";
import { authOptions } from "@/lib/auth";

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // Só Admin pode fazer extermínio em massa
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Nenhum ID fornecido." },
        { status: 400 },
      );
    }

    await connectDB();

    // 1. Apaga os Produtos
    await Product.deleteMany({ _id: { $in: ids } });

    // 2. Apaga as Movimentações órfãs (Opcional, mas bom para limpar o banco)
    await Movement.deleteMany({ productId: { $in: ids } });

    // 3. Gera Log de Auditoria (Um log só para não spamar)
    const user = session.user as any;
    await SystemLog.create({
      action: "BATCH_DELETE",
      description: `Executou exclusão em massa de ${ids.length} produtos.`,
      userId: user.id || user.email,
      userName: user.name,
      level: "critical",
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
