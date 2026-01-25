"use client";

import { useState } from "react";
import { X, Loader2, UserPlus, Mail, Lock, Shield } from "lucide-react";

interface AddUserModalProps {
  onClose: () => void;
  onRefresh: () => void;
}

export default function AddUserModal({
  onClose,
  onRefresh,
}: AddUserModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "operador",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        alert(data.error || "Erro ao criar usuário");
      }
    } catch (error) {
      alert("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10">
          {/* HEADER */}
          <header className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                Novo Membro <span className="text-brand-red">Time</span>
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
                Adicionar acesso ao sistema
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* NOME */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                <UserPlus size={10} /> Nome Completo
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none font-bold transition-all text-gray-900"
                placeholder="Ex: João Silva"
              />
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Mail size={10} /> Email Corporativo
              </label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none font-bold transition-all text-gray-900"
                placeholder="joao@stockmaster.com"
              />
            </div>

            {/* SENHA */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Lock size={10} /> Senha Inicial
              </label>
              <input
                required
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none font-bold transition-all text-gray-900"
                placeholder="••••••••"
              />
            </div>

            {/* CARGO (SELECT ESTILIZADO) */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Shield size={10} /> Nível de Acesso
              </label>
              <div className="relative">
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:border-brand-red outline-none font-bold appearance-none cursor-pointer text-gray-900 uppercase"
                >
                  <option value="operador">Operador (Básico)</option>
                  <option value="admin">Administrador (Total)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  ▼
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-red text-white font-black py-5 rounded-2xl hover:bg-brand-dark-red transition-all shadow-xl shadow-red-100 mt-4 flex justify-center items-center gap-2 active:scale-[0.98]"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                "CADASTRAR MEMBRO"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
