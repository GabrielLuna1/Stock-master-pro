"use client";

import React from "react";
import { Edit, Trash2, Eye } from "lucide-react";

interface Column<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (item: T) => React.ReactNode;
}

interface DataDisplayProps<T> {
  data: T[];
  columns: Column<T>[];
  titleField: keyof T;
  subtitleField?: keyof T;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
}

export function DataDisplay<T extends { _id: string }>({
  data,
  columns,
  titleField,
  subtitleField,
  onEdit,
  onDelete,
  onView,
}: DataDisplayProps<T>) {
  // 👇 VERIFICAÇÃO INTELIGENTE: Só mostra a coluna de ações se houver alguma função passada
  const hasActions = Boolean(onEdit || onDelete || onView);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-dashed">
        Nenhum registro encontrado.
      </div>
    );
  }

  return (
    <>
      {/* 🖥️ VISÃO DESKTOP */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 whitespace-nowrap">
                  {col.header}
                </th>
              ))}
              {/* 👇 Só renderiza o cabeçalho "Ações" se tiver ações */}
              {hasActions && <th className="px-6 py-4 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                {columns.map((col, idx) => (
                  <td key={idx} className="px-6 py-4 text-gray-700">
                    {col.cell ? col.cell(item) : String(item[col.accessorKey])}
                  </td>
                ))}

                {/* 👇 Só renderiza a célula de botões se tiver ações */}
                {hasActions && (
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    {onView && (
                      <button
                        onClick={() => onView(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📱 VISÃO MOBILE */}
      <div className="md:hidden flex flex-col gap-4">
        {data.map((item) => (
          <div
            key={item._id}
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg break-words">
                  {String(item[titleField])}
                </h3>
                {subtitleField && (
                  <p className="text-sm text-gray-500 font-mono break-all">
                    {String(item[subtitleField])}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {columns.map((col, idx) => {
                if (
                  col.accessorKey === titleField ||
                  col.accessorKey === subtitleField
                )
                  return null;

                return (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-sm border-b border-gray-50 pb-1 last:border-0"
                  >
                    <span className="text-gray-500 mr-2">{col.header}:</span>
                    <span className="font-medium text-gray-900 text-right">
                      {col.cell
                        ? col.cell(item)
                        : String(item[col.accessorKey])}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 👇 Só renderiza a barra de botões mobile se tiver ações */}
            {hasActions && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                {onView && (
                  <button
                    onClick={() => onView(item)}
                    className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg"
                  >
                    <Eye size={16} /> Ver
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(item)}
                    className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg"
                  >
                    <Edit size={16} /> Editar
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(item)}
                    className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} /> Excluir
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
