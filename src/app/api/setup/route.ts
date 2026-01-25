import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectDB();

    // ⚠️ Acessamos direto a coleção do MongoDB, ignorando os hooks do Mongoose
    // Isso evita a criptografia dupla acidental
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { error: "Banco não conectado" },
        { status: 500 }
      );
    }

    const collection = db.collection("users"); // Nome padrão da coleção no Mongo
    const email = "admin@stockmaster.com";
    const passwordPlain = "123456";

    // 1. Limpeza
    await collection.deleteOne({ email });

    // 2. Hash Manual ÚNICO
    const hashedPassword = await bcrypt.hash(passwordPlain, 10);

    // 3. Inserção Direta (Raw Insert)
    const result = await collection.insertOne({
      name: "Admin Supremo",
      email: email,
      password: hashedPassword, // Salva o hash correto
      role: "admin",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    });

    return NextResponse.json({
      status: "CORRIGIDO",
      message: "Usuário recriado via Driver Nativo (Sem Hash Duplo)",
      id: result.insertedId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
