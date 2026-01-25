"use client";

import { AlertTriangle } from "lucide-react";

interface DeleteUserModalProps {
  userName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteUserModal({
  userName,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] max-w-sm w-full p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-center relative overflow-hidden">
        {/* Decoração Superior */}
        <div className="absolute top-0 left-0 w-full h-2 bg-brand-red"></div>

        {/* Ícone de Alerta */}
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-red">
          <AlertTriangle size={32} />
        </div>

        {/* Título */}
        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">
          Excluir Membro?
        </h3>

        {/* Texto Descritivo */}
        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
          Você está prestes a remover o acesso de <br />
          <span className="text-gray-900 font-black text-base">
            "{userName}"
          </span>
          .
          <br />
          <span className="text-xs text-red-400 mt-2 block">
            Isso não pode ser desfeito.
          </span>
        </p>

        {/* Botões */}
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
