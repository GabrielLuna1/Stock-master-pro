import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // ⚡ Garante que não faça cache dessa resposta

export async function GET() {
  return NextResponse.json({
    // Se estiver na Vercel, usa o Hash do Commit. Se for local, usa um timestamp ou 'dev'.
    version: process.env.VERCEL_GIT_COMMIT_SHA || "dev-mode",
    timestamp: new Date().toISOString(),
  });
}
