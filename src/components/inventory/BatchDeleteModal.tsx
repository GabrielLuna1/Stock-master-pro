"use client";

import { X, AlertTriangle, Trash2, Loader2 } from "lucide-react";

interface BatchDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  isDeleting: boolean;
}

export default function BatchDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  count,
  isDeleting,
}: BatchDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        {/* CORPO DO MODAL */}
        <div className="p-8 flex flex-col items-center text-center">
          {/* Ícone de Alerta */}
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 border border-red-100 shadow-sm">
            <AlertTriangle className="text-red-600" size={32} />
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2">
            Excluir {count} Itens?
          </h2>

          <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
            Você está prestes a remover{" "}
            <strong className="text-gray-900">{count} produtos</strong> do
            estoque permanentemente. <br />
            <span className="text-red-500 font-bold block mt-2">
              Essa ação não pode ser desfeita.
            </span>
          </p>

          {/* BOTÕES */}
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              CANCELAR
            </button>

            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 py-3.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  EXCLUINDO...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  CONFIRMAR
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
