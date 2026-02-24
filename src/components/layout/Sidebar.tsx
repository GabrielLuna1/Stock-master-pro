"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import ResetHistoryModal from "@/components/admin/ResetHistoryModal";
import {
  LayoutDashboard,
  Tag,
  Search,
  ChevronRight,
  ChevronDown,
  X,
  LogOut,
  Users,
  ClipboardList,
  ArrowLeftRight,
  ShieldCheck,
  ShieldAlert,
  Truck,
  Zap,
} from "lucide-react";

import { useDashboard } from "@/providers/DashboardContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { criticalCount } = useDashboard();

  const [isLogMenuOpen, setIsLogMenuOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/log")) {
      setIsLogMenuOpen(true);
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/log-exit", { method: "POST" });
    } catch (error) {
      console.error("Erro silencioso ao registrar log de saída.");
    } finally {
      signOut({ callbackUrl: "/login" });
    }
  };

  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "SM";
  };

  const userRole = (session?.user as any)?.role || "Membro";
  const isAdmin = userRole === "admin";
  const isSupreme = session?.user?.email === "admin@stockmaster.com";
  const isLogActive = pathname.startsWith("/log");

  // 👇 MENU 100% PADRONIZADO (Sem highlights)
  const menuItems = [
    { name: "Painel", href: "/", icon: LayoutDashboard },
    { name: "Saída Expressa", href: "/saida", icon: Zap },
    {
      name: "Gerencia de Estoque",
      href: "/inventory",
      icon: Search,
      badge: criticalCount,
    },
    { name: "Categorias", href: "/categorias", icon: Tag },
    { name: "Fornecedores", href: "/fornecedores", icon: Truck },
    ...(isAdmin ? [{ name: "Usuários", href: "/usuarios", icon: Users }] : []),
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`
          fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0 lg:static justify-between
        `}
      >
        <div className="flex-1 overflow-y-auto">
          {/* LOGO */}
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-brand-red w-8 h-8 rounded-lg flex items-center justify-center shadow-md shadow-red-100">
                <span className="text-white font-black text-xl leading-none">
                  S
                </span>
              </div>
              <h1 className="text-lg font-black text-gray-900 tracking-tighter uppercase">
                STOCK<span className="text-brand-red">MASTER</span>
              </h1>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-brand-red"
            >
              <X size={24} />
            </button>
          </div>

          {/* MENU */}
          <nav className="px-4 mt-2 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between p-3.5 rounded-xl transition-all group ${
                    isActive
                      ? "bg-red-50 text-red-600 shadow-sm font-black"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-900 font-bold"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      size={20}
                      className={
                        isActive
                          ? "text-red-600"
                          : "text-gray-400 group-hover:text-gray-600"
                      }
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 ? (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                      {item.badge}
                    </span>
                  ) : (
                    isActive && (
                      <ChevronRight size={14} className="opacity-40" />
                    )
                  )}
                </Link>
              );
            })}

            {/* SUBMENU LOGS (ADMIN) */}
            {isAdmin && (
              <div className="pt-2">
                <button
                  onClick={() => setIsLogMenuOpen(!isLogMenuOpen)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all group ${
                    isLogActive
                      ? "bg-red-50 text-brand-red shadow-sm font-black"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-900 font-bold"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList
                      size={20}
                      className={
                        isLogActive
                          ? "text-brand-red"
                          : "text-gray-400 group-hover:text-gray-600"
                      }
                    />
                    <span className="text-sm">LOGS & AUDITORIA</span>
                  </div>
                  {isLogMenuOpen ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>

                {isLogMenuOpen && (
                  <div className="mt-1 space-y-1 relative animate-in slide-in-from-top-2 duration-200">
                    <div className="absolute left-[26px] top-0 bottom-0 w-px bg-gray-100"></div>
                    <Link
                      href="/log/movimentacoes"
                      onClick={onClose}
                      className={`flex items-center gap-3 p-3 pl-14 rounded-xl text-xs font-bold transition-all relative ${
                        pathname === "/log/movimentacoes"
                          ? "text-brand-red bg-red-50/50"
                          : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <ArrowLeftRight size={16} /> Movimentações
                    </Link>
                    <Link
                      href="/log/auditoria"
                      onClick={onClose}
                      className={`flex items-center gap-3 p-3 pl-14 rounded-xl text-xs font-bold transition-all relative ${
                        pathname === "/log/auditoria"
                          ? "text-brand-red bg-red-50/50"
                          : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <ShieldCheck size={16} /> Auditoria Geral
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* RODAPÉ */}
        <div className="p-4 border-t border-gray-50">
          {isSupreme && (
            <div className="mb-3 px-1">
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 hover:bg-red-100 transition-all border border-red-100 hover:border-red-200 group"
              >
                <ShieldAlert
                  size={14}
                  className="group-hover:scale-110 transition-transform"
                />
                Limpar Histórico
              </button>
            </div>
          )}

          {session?.user && (
            <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 transition-all hover:bg-white hover:shadow-lg hover:shadow-gray-100 hover:border-gray-200 group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-red to-red-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-red-100 shrink-0 ring-2 ring-white">
                  {getInitials(session.user.name || "")}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-black text-gray-900 truncate">
                    {session.user.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isAdmin ? "bg-purple-500" : "bg-emerald-500"
                      }`}
                    ></span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {userRole}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all font-bold text-xs uppercase tracking-wide shadow-sm"
              >
                <LogOut size={14} />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      <ResetHistoryModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />
    </>
  );
}
