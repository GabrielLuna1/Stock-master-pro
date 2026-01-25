"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { Menu } from "lucide-react";
import React from "react"; // <--- ✅ AQUI ESTÁ A CORREÇÃO (O TypeScript precisa disso)

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // 🛡️ TRAVA DE SEGURANÇA (Login sem layout)
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    // 1️⃣ 'h-screen' trava a altura total e 'overflow-hidden' remove scroll da janela
    <div className="h-screen bg-gray-50/30 flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar (Fica fixa naturalmente pois o container pai não rola) */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Container da Direita (Cabeçalho Mobile + Conteúdo) */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Header Mobile */}
        <header className="lg:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-brand-red w-6 h-6 rounded flex items-center justify-center">
              <span className="text-white font-black text-xs">S</span>
            </div>
            <span className="font-black text-gray-900 tracking-tight">
              STOCKMASTER
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* 2️⃣ 'overflow-y-auto' faz SÓ este conteúdo rolar */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
