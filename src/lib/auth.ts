import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
// 👇 1. Importar o Model de Log
import SystemLog from "@/models/SystemLog";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Dados de login incompletos");
        }

        await connectDB();

        // Busca o usuário com a senha
        const user = await User.findOne({ email: credentials.email }).select(
          "+password",
        );

        if (!user) {
          throw new Error("Usuário não encontrado");
        }

        // Valida a senha
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isValid) {
          throw new Error("Senha incorreta");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },

  // 👇 2. EVENTOS: É aqui que a mágica do Log de Login acontece
  events: {
    async signIn({ user }) {
      try {
        await connectDB();
        await SystemLog.create({
          action: "USER_LOGIN",
          description: `Login realizado com sucesso.`,
          userId: user.id, // O ID vem do retorno do authorize acima
          userName: user.name,
          level: "info",
        });
      } catch (error) {
        console.error("Erro ao registrar log de login:", error);
        // Não lançamos erro aqui para não bloquear o login se o log falhar
      }
    },
  },

  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
