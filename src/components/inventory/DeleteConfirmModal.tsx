"use client";

import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmModalProps {
  productName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  productName,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] max-w-sm w-full p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-center relative overflow-hidden">
        {/* Ícone de Fundo Decorativo */}
        <div className="absolute top-0 left-0 w-full h-2 bg-brand-red"></div>

        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-red">
          <AlertTriangle size={32} />
        </div>

        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">
          Confirmar Exclusão
        </h3>

        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
          Você tem certeza que deseja remover{" "}
          <span className="text-gray-900 font-bold">"{productName}"</span>?
          <br />
          Esta ação é irreversível.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors text-sm uppercase tracking-wider"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 bg-brand-red hover:bg-brand-dark-red text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-all text-sm uppercase tracking-wider"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
