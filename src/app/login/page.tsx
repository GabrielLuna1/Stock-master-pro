"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [data, setData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Tenta logar usando as credenciais
      const result = await signIn("credentials", {
        redirect: false, // Não redireciona automático para podermos controlar o erro
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError("Email ou senha inválidos. Tente novamente.");
        setLoading(false);
      } else {
        // Sucesso! Redireciona para o Dashboard
        router.push("/");
        router.refresh(); // Garante que a sessão atualize
      }
    } catch (err) {
      setError("Erro ao tentar fazer login.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* CABEÇALHO */}
        <div className="p-8 text-center bg-white border-b border-gray-50">
          <div className="inline-flex items-center gap-2 mb-4 justify-center">
            <div className="bg-brand-red w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-red-100">
              <span className="text-white font-black text-xl leading-none">
                S
              </span>
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tighter uppercase">
              STOCK<span className="text-brand-red">MASTER</span>
            </span>
          </div>
          <p className="text-gray-500 font-medium text-sm">
            Acesse o painel de controle logístico.
          </p>
        </div>

        {/* FORMULÁRIO */}
        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mensagem de Erro */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold text-center animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Email Corporativo
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-red transition-colors"
                  size={20}
                />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold text-gray-900 transition-all"
                  placeholder="admin@stockmaster.com"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Senha de Acesso
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-red transition-colors"
                  size={20}
                />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red outline-none font-bold text-gray-900 transition-all"
                  placeholder="••••••••"
                  value={data.password}
                  onChange={(e) =>
                    setData({ ...data, password: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red text-white font-black py-4 rounded-2xl hover:bg-brand-dark-red transition-all shadow-lg shadow-red-100 flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  ENTRAR NO SISTEMA
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              StockMaster Pro v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
