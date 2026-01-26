import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // 👇 ADICIONE ESTE BLOCO 'env':
  env: {
    // Isso pega a variável secreta da Vercel (backend)
    // e "tatua" ela no código do Frontend para o navegador ler.
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
  },
};

export default nextConfig;
