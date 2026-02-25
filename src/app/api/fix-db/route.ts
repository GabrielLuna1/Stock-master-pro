import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();

    // 1. Transforma todos os EANs que estão como "" (texto vazio) em nulos/apagados
    await Product.updateMany({ ean: "" }, { $unset: { ean: 1 } });
    await Product.updateMany({ barcode: "" }, { $unset: { barcode: 1 } }); // Caso você use a palavra barcode

    // 2. Destrói o índice travado direto no motor do banco de dados
    try {
      await mongoose.connection.collection("products").dropIndex("ean_1");
    } catch (e) {
      console.log("O índice ean_1 já foi removido.");
    }

    return NextResponse.json({
      message:
        "✅ BANCO DE DADOS CONSERTADO! Os fantasmas do EAN foram removidos com sucesso.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
