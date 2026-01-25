import { connectDB } from "@/lib/mongodb";
import SystemLog from "@/models/SystemLog";

interface LogParams {
  action: string;
  description: string;
  user: { name: string; id: string; email?: string };
  level?: "info" | "warning" | "critical";
  metadata?: any;
}

export async function logSystemAction({
  action,
  description,
  user,
  level = "info",
  metadata,
}: LogParams) {
  try {
    await connectDB();
    await SystemLog.create({
      action,
      description,
      userId: user.id || user.email, // Fallback se não tiver ID
      userName: user.name,
      level,
      metadata,
    });
    console.log(`🛡️ SYSTEM LOG: [${action}] ${description}`);
  } catch (error) {
    console.error("Falha ao gravar log de sistema:", error);
  }
}
