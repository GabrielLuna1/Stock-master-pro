import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    await connectDB();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "E-mail é obrigatório." },
        { status: 400 },
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({
        message: "Se o e-mail existir, um link será enviado.",
      });
    }

    // 1. Gera o Token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hora de validade

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // 2. Configura o "Carteiro" com as senhas do seu .env
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 3. Monta o visual do e-mail
    const mailOptions = {
      from: `"StockMaster Pro" <${process.env.EMAIL_USER}>`,
      to: email, // Vai enviar para o gabriellunajob@gmail.com
      subject: "🔒 Recuperação de Senha - StockMaster",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #111827;">Recuperação de Acesso</h2>
          <p style="color: #4b5563; line-height: 1.6;">Olá, <strong>${user.name}</strong>!</p>
          <p style="color: #4b5563; line-height: 1.6;">Recebemos uma solicitação para redefinir a senha da sua conta no StockMaster. Se foi você, clique no botão abaixo:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Criar Nova Senha
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 14px;">Este link é válido por apenas 1 hora.</p>
        </div>
      `,
    };

    // 4. Envia o E-mail de verdade!
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      message: "Se o e-mail existir, um link será enviado.",
    });
  } catch (error: any) {
    console.error("Erro no forgot-password:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 },
    );
  }
}
