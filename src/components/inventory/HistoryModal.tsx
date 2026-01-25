"use client";

import {
  X,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  PackagePlus,
  ArrowRightLeft,
  Loader2,
  Calendar,
} from "lucide-react";

interface HistoryModalProps {
  product: any;
  onClose: () => void;
  movements: any[];
  loading: boolean;
}

export default function HistoryModal({
  product,
  onClose,
  movements,
  loading,
}: HistoryModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "entrada":
      case "ajuste_entrada":
        return {
          icon: <ArrowUpRight size={14} />,
          color: "text-emerald-700 bg-emerald-50 border-emerald-100",
          label: "Entrada",
        };
      case "saida":
      case "ajuste_saida":
        return {
          icon: <ArrowDownLeft size={14} />,
          color: "text-amber-700 bg-amber-50 border-amber-100",
          label: "Saída",
        };
      case "exclusao":
        return {
          icon: <Trash2 size={14} />,
          color: "text-red-700 bg-red-50 border-red-100",
          label: "Exclusão",
        };
      case "criacao":
        return {
          icon: <PackagePlus size={14} />,
          color: "text-blue-700 bg-blue-50 border-blue-100",
          label: "Criação",
        };
      default:
        return {
          icon: <ArrowRightLeft size={14} />,
          color: "text-gray-700 bg-gray-50 border-gray-100",
          label: "Ajuste",
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-gray-100">
        {/* HEADER PADRONIZADO (Branco + Vermelho Brand) */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-red-50 p-2 rounded-lg text-red-600 border border-red-100">
                <History size={20} />
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                Histórico de Movimentações
              </h2>
            </div>
            <p className="text-sm text-gray-500 font-medium ml-11">
              Rastreando item:{" "}
              <span className="text-gray-900 font-bold">{product?.name}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY (LISTA CLEAN) */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-60 space-y-4">
              <Loader2 className="animate-spin text-red-600" size={32} />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Carregando dados...
              </p>
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 space-y-4 opacity-60">
              <div className="bg-gray-100 p-4 rounded-full">
                <History size={32} className="text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-600">
                  Nenhum registro encontrado.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Este produto ainda não tem histórico.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-gray-200 space-y-8 my-2 ml-2">
              {movements.map((mov, index) => {
                const style = getTypeStyle(mov.type);
                return (
                  <div key={index} className="relative group">
                    {/* BOLINHA DA LINHA DO TEMPO (Estilo Clean) */}
                    <div
                      className={`absolute -left-[31px] top-5 w-4 h-4 rounded-full border-[3px] border-white shadow-sm ring-1 ring-gray-200 transition-colors bg-gray-200 group-hover:bg-red-500 group-hover:ring-red-200`}
                    ></div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group-hover:border-red-100 group-hover:shadow-md transition-all">
                      {/* TOPO: DATA E TIPO */}
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${style.color}`}
                        >
                          {style.icon}
                          {style.label}
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-medium bg-gray-50 px-2 py-1 rounded-md">
                          <Calendar size={12} />
                          {formatDate(mov.createdAt)}
                        </div>
                      </div>

                      {/* CONTEÚDO */}
                      <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
                            {mov.userName ? mov.userName.substring(0, 2) : "SY"}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              Responsável
                            </p>
                            <p className="text-sm font-bold text-gray-700">
                              {mov.userName || "Sistema"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                            Quantidade
                          </p>
                          <div className="flex items-center justify-end gap-2">
                            <span
                              className={`text-xl font-black ${["entrada", "criacao", "ajuste_entrada"].includes(mov.type) ? "text-emerald-600" : "text-amber-600"}`}
                            >
                              {[
                                "entrada",
                                "criacao",
                                "ajuste_entrada",
                              ].includes(mov.type)
                                ? "+"
                                : "-"}
                              {mov.quantity}
                            </span>
                            <span className="text-xs font-bold text-gray-400">
                              UN
                            </span>
                          </div>
                          {mov.oldStock !== undefined && (
                            <p className="text-[10px] text-gray-400 font-mono mt-1 bg-gray-50 px-2 py-0.5 rounded inline-block">
                              Saldo: {mov.oldStock} ➝ {mov.newStock}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-white border-t border-gray-100 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Exibindo {movements.length} registros
          </p>
        </div>
      </div>
    </div>
  );
}
