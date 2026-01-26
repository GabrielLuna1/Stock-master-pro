"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

// Tenta pegar a versão do build atual (client-side)
// Se não tiver (dev), usa 'dev-mode'
const CURRENT_VERSION =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "dev-mode";

export default function AutoUpdate() {
  useEffect(() => {
    // Se estiver em modo dev, não faz nada para não ficar chato
    if (CURRENT_VERSION === "dev-mode") return;

    const checkVersion = async () => {
      try {
        const res = await fetch("/api/system/version", {
          cache: "no-store", // 🛡️ Evita cache do browser na requisição
          headers: { Pragma: "no-cache" },
        });

        if (!res.ok) return;

        const data = await res.json();
        const serverVersion = data.version;

        // Se a versão do servidor for diferente da minha versão atual
        if (serverVersion && serverVersion !== CURRENT_VERSION) {
          console.log(
            `🆕 Atualização detectada! Atual: ${CURRENT_VERSION} -> Nova: ${serverVersion}`,
          );

          // Mostra o Toast Permanente até o usuário clicar
          toast("Nova atualização disponível!", {
            description:
              "O sistema foi atualizado para melhorar a performance.",
            action: {
              label: "ATUALIZAR AGORA",
              onClick: () => {
                // Limpa caches e recarrega forçado
                if ("serviceWorker" in navigator) {
                  navigator.serviceWorker
                    .getRegistrations()
                    .then(function (registrations) {
                      for (let registration of registrations) {
                        registration.unregister();
                      }
                    });
                }
                window.location.reload();
              },
            },
            duration: Infinity, // Não some sozinho
            icon: <RefreshCw className="animate-spin text-blue-600" />,
          });
        }
      } catch (error) {
        console.error("Erro ao verificar versão:", error);
      }
    };

    // Verifica imediatamente ao carregar
    // checkVersion();

    // E verifica a cada 60 segundos (1 minuto)
    const interval = setInterval(checkVersion, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null; // Componente invisível (Logic Only)
}
