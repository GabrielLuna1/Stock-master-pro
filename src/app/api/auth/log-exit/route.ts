import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import SystemLog from "@/models/SystemLog";
import { authOptions } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user) {
      await connectDB();
      const user = session.user as any;

      await SystemLog.create({
        action: "USER_LOGOUT",
        description: `Usuário realizou logout (Sair).`,
        userId: user.id,
        userName: user.name,
        level: "info",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
