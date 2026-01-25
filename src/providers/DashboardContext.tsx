"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

interface DashboardContextType {
  criticalCount: number;
  refreshDashboard: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType>({
  criticalCount: 0,
  refreshDashboard: async () => {},
});

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [criticalCount, setCriticalCount] = useState(0);

  // 👇 Usamos useCallback para garantir estabilidade
  const fetchCounts = useCallback(async () => {
    try {
      // 🛑 O SEGREDO ESTÁ AQUI: { cache: "no-store" }
      // Isso obriga o Next.js a ignorar a memória e ir buscar os dados reais no banco
      const res = await fetch("/api/products", { cache: "no-store" });

      if (!res.ok) return;

      const data = await res.json();
      if (Array.isArray(data)) {
        // Conta quantos produtos têm estoque <= estoque mínimo
        const count = data.filter(
          (item: any) => Number(item.quantity) <= Number(item.minStock || 15),
        ).length;

        setCriticalCount(count);

        // 🔥 Log para você ver no console do navegador (F12) quando atualizar
        console.log(`⚡ Dashboard Atualizado! Produtos Críticos: ${count}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar dashboard context", error);
    }
  }, []);

  // 1. Busca inicial ao carregar a página
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return (
    <DashboardContext.Provider
      value={{ criticalCount, refreshDashboard: fetchCounts }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);
