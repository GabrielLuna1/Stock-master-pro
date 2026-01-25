import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectDB();

    const email = "admin@stockmaster.com";
    const senhaTentada = "123456";

    // 1. Busca o usuário
    // IMPORTANTE: Adicionei .select('+password') para garantir que a senha venha
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return NextResponse.json({
        status: "FALHA",
        motivo: "Usuário não encontrado no banco pelo Mongoose.",
      });
    }

    // 2. Analisa a senha salva
    const senhaNoBanco = user.password;

    if (!senhaNoBanco) {
      return NextResponse.json({
        status: "FALHA CRÍTICA",
        motivo:
          "O campo 'password' existe no banco mas veio VAZIO/UNDEFINED na busca. O Schema do Mongoose pode estar bloqueando.",
      });
    }

    // 3. Tenta comparar
    const bateu = await bcrypt.compare(senhaTentada, senhaNoBanco);

    return NextResponse.json({
      status: bateu ? "SUCESSO TOTAL" : "SENHA INCORRETA",
      analise: {
        email_encontrado: user.email,
        senha_no_banco_comeca_com: senhaNoBanco.substring(0, 10) + "...",
        comparacao_bcrypt: bateu ? "BATEU! ✅" : "NÃO BATEU ❌",
        dica: bateu
          ? "Se deu TRUE aqui, o erro está no arquivo src/lib/auth.ts"
          : "A senha no banco está errada.",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ status: "ERRO DE CÓDIGO", erro: error.message });
  }
}
