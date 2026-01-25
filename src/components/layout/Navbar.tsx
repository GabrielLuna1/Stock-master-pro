"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-red flex items-center justify-center rounded-sm shrink-0">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="font-bold text-gray-800 text-sm md:text-xl whitespace-nowrap tracking-tighter">
            STOCKMASTER
          </span>
        </Link>

        <div className="flex gap-4 md:gap-8">
          <Link
            href="/"
            className={`flex items-center gap-1.5 text-xs md:text-sm font-bold transition-colors ${
              pathname === "/"
                ? "text-brand-red"
                : "text-gray-600 hover:text-brand-red"
            }`}
          >
            <LayoutDashboard
              size={16}
              className={pathname === "/" ? "text-brand-red" : "text-gray-400"}
            />
            PAINEL
          </Link>

          <Link
            href="/inventory"
            className={`flex items-center gap-1.5 text-xs md:text-sm font-bold transition-colors ${
              pathname === "/inventory"
                ? "text-brand-red"
                : "text-gray-600 hover:text-brand-red"
            }`}
          >
            {/* 2. Inserindo a lupa visual aqui ✅ */}
            <Search
              size={16}
              className={
                pathname === "/inventory" ? "text-brand-red" : "text-gray-400"
              }
            />
            CONSULTA
          </Link>
        </div>
      </div>
    </nav>
  );
}
