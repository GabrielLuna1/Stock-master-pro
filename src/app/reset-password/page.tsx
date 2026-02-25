"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      return toast.error("Token de recuperação ausente.");
    }
    if (password !== confirmPassword) {
      return toast.error("As senhas não coincidem.");
    }
    if (password.length < 6) {
      return toast.error("A senha deve ter pelo menos 6 caracteres.");
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      // Aqui era onde dava o erro! Agora ele lê o JSON protegido.
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao redefinir a senha.");
      }

      setIsSuccess(true);
      toast.success("Senha alterada com sucesso!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Se o usuário entrar na página sem o "?token=" na URL
  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-black text-gray-900 mb-4">Link Inválido</h2>
        <p className="text-gray-500 mb-6">
          O link de recuperação está incompleto.
        </p>
        <Link
          href="/forgot-password"
          className="text-red-600 font-bold hover:underline"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  // Se a senha foi alterada com sucesso
  if (isSuccess) {
    return (
      <div className="text-center animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          Senha Atualizada!
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          Sua senha foi redefinida com sucesso. Você já pode acessar o sistema.
        </p>
        <Link
          href="/login"
          className="w-full flex justify-center py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all active:scale-[0.98]"
        >
          Fazer Login Agora
        </Link>
      </div>
    );
  }

  // O Formulário Padrão
  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">
          Criar Nova Senha
        </h2>
        <p className="text-sm font-medium text-gray-400 mt-2">
          Digite e confirme sua nova senha de acesso.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
            Nova Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={20} className="text-gray-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
            Confirmar Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={20} className="text-gray-400" />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            "Salvar Nova Senha"
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-2 rounded-xl">
              <span className="text-white font-black text-xl leading-none block">
                S
              </span>
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              STOCK<span className="text-red-600">MASTER</span>
            </span>
          </div>
        </div>
        {/* O Next.js exige o Suspense para ler parâmetros da URL na versão App Router */}
        <Suspense
          fallback={
            <div className="text-center py-4">
              <Loader2 className="animate-spin mx-auto text-red-600" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
