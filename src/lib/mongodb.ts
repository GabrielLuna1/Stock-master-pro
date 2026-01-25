import mongoose from "mongoose";

// Pegamos a URL que você colocou no .env.local
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Por favor, defina a variável MONGODB_URI dentro do arquivo .env.local"
  );
}



let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  // 1. Se já estiver conectado, apenas retorne a conexão existente
  if (cached.conn) {
    return cached.conn;
  }

  // 2. Se for a primeira vez, criamos uma nova "promessa" de conexão
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Desativa o buffer para erros aparecerem rápido
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log("🚀 Conectado ao MongoDB com sucesso!");
      return mongoose;
    });
  }

  // 3. Aguardamos a conexão finalizar e guardamos no cache
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}