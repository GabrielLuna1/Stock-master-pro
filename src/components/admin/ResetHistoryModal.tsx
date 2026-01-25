"use client";

import { AlertOctagon, Trash2, Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ResetHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResetHistoryModal({
  isOpen,
  onClose,
}: ResetHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen) return null;

  const handleReset = async () => {
    if (confirmText !== "RESETAR") return; // Trava extra de segurança

    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-history", {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Histórico limpo com sucesso!");
        onClose();
        // Opcional: Recarregar a página para limpar visualmente
        window.location.reload();
      } else {
        toast.error(data.error || "Erro ao limpar histórico.");
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-2 border-red-100">
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <AlertOctagon className="text-red-600" size={40} />
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
            Zona de Perigo
          </h2>

          <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
            Você está prestes a apagar <strong>TODO</strong> o histórico de
            movimentações e logs de auditoria. <br />
            <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded mt-2 inline-block">
              Produtos e Usuários SERÃO MANTIDOS.
            </span>
          </p>

          {/* Input de Confirmação */}
          <div className="w-full mb-6">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Digite "RESETAR" para confirmar
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="RESETAR"
              className="w-full text-center border-2 border-gray-200 rounded-xl p-3 font-black text-gray-900 focus:border-red-500 focus:outline-none placeholder:text-gray-300 transition-all uppercase"
            />
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
            >
              CANCELAR
            </button>

            <button
              onClick={handleReset}
              disabled={loading || confirmText !== "RESETAR"}
              className="flex-1 py-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Trash2 size={20} />
              )}
              APAGAR TUDO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
