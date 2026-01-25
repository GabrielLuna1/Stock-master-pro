import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SystemLog from "@/models/SystemLog";

// BUSCAR LOGS (Para a tela de Auditoria)
export async function GET(request: Request) {
  try {
    await connectDB();
    const logs = await SystemLog.find().sort({ createdAt: -1 }).limit(100);
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar logs" }, { status: 500 });
  }
}

// CRIAR LOG (Para o botão de PDF)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectDB();
    await SystemLog.create(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar log" }, { status: 500 });
  }
}
