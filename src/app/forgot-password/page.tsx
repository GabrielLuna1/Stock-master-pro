"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Por favor, insira seu e-mail corporativo.");

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar solicitação.");
      }

      setIsSubmitted(true);
      toast.success("Solicitação enviada!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* LOGO */}
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

        {isSubmitted ? (
          // TELA DE SUCESSO
          <div className="text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
              E-mail Enviado!
            </h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Se o e-mail <strong className="text-gray-900">{email}</strong>{" "}
              estiver cadastrado em nosso sistema, você receberá um link de
              recuperação em instantes.
            </p>
            <Link
              href="/login"
              className="w-full flex justify-center py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all active:scale-[0.98]"
            >
              Voltar para o Login
            </Link>
          </div>
        ) : (
          // TELA DO FORMULÁRIO
          <>
            <div className="text-center mb-8">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                Recuperar Acesso
              </h2>
              <p className="text-sm font-medium text-gray-400 mt-2">
                Digite seu e-mail para receber as instruções de redefinição de
                senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all disabled:opacity-50"
                    placeholder="seu.nome@empresa.com.br"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:hover:bg-red-600"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  "Enviar Link de Recuperação"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={16} />
                Voltar para o Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
