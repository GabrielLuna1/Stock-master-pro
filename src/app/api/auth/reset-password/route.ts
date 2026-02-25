import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await connectDB();
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token e senha são obrigatórios." },
        { status: 400 },
      );
    }

    // 1. Procura o usuário que tenha esse token e verifica se ele não venceu
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Este link é inválido ou já expirou." },
        { status: 400 },
      );
    }

    // 2. Criptografa a nova senha UMA ÚNICA VEZ
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🚨 3. A MÁGICA AQUI: Usamos updateOne no lugar de user.save()
    // Isso atualiza direto no banco de dados, evitando a dupla criptografia!
    await User.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
      },
    );

    return NextResponse.json(
      { message: "Senha atualizada com sucesso!" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Erro no reset-password:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 },
    );
  }
}
