"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { Menu, X } from "lucide-react";
import React from "react";

// Mapeamento simples para mostrar títulos bonitos no Mobile
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Visão Geral",
  "/inventory": "Gerenciar Estoque",
  "/movements": "Movimentações",
  "/users": "Equipe",
  "/audit": "Auditoria",
  "/settings": "Configurações",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // 🛡️ TRAVA DE SEGURANÇA
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Descobre o título atual ou usa o padrão
  const currentTitle = PAGE_TITLES[pathname] || "StockMaster";

  return (
    <div className="h-screen bg-gray-50 flex flex-col lg:flex-row overflow-hidden">
      {/* --- SIDEBAR (Desktop & Mobile Wrapper) --- */}
      {/* No mobile, usamos z-50 para ficar ACIMA de tudo */}
      <div
        className={`
        fixed inset-0 z-50 lg:static lg:z-auto lg:block
        ${isSidebarOpen ? "block" : "hidden"}
      `}
      >
        {/* Fundo Escuro (Backdrop) só no mobile */}
        <div
          className="absolute inset-0 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* A Sidebar em si */}
        <div className="absolute left-0 top-0 bottom-0 lg:static w-72 h-full bg-white shadow-2xl lg:shadow-none z-10">
          <Sidebar isOpen={true} onClose={() => setIsSidebarOpen(false)} />
        </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-gray-50/50">
        {/* HEADER MOBILE (Sticky/Grudado no topo) */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm transition-all">
          {/* 👇 AQUI ESTÁ A MUDANÇA: Logo igual ao da Sidebar */}
          <div className="flex items-center gap-2">
            <div className="bg-red-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shadow-red-200">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <span className="font-black text-gray-900 text-xl tracking-tighter">
              STOCK<span className="text-red-600">MASTER</span>
            </span>
          </div>

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 hover:text-red-600 rounded-lg transition-all active:scale-95"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
        </header>

        {/* ÁREA DE SCROLL (Main) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 scroll-smooth pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto h-full animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
