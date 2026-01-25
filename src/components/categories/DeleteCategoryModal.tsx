"use client";

import { X, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteCategoryModalProps {
  categoryName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  error?: string | null; // Nova prop para capturar o erro da API
}

export default function DeleteCategoryModal({
  categoryName,
  isOpen,
  onClose,
  onConfirm,
  loading,
  error, // Recebendo o erro aqui
}: DeleteCategoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-red-50 p-3 rounded-2xl text-red-600">
              <AlertTriangle size={24} />
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <h3 className="text-xl font-black text-gray-900 mb-2 uppercase">
            Excluir Categoria?
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Você está prestes a remover{" "}
            <span className="font-bold text-gray-900">"{categoryName}"</span>.
            Esta ação não pode ser desfeita e pode afetar produtos vinculados.
          </p>

          {/* BOX DE ERRO: Aparece apenas se a API retornar um impedimento */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in shake-1">
              <AlertTriangle size={18} className="flex-shrink-0" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase text-xs tracking-widest"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-6 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 uppercase text-xs tracking-widest flex justify-center items-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Sim, Excluir"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
