"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Edit,
  Calendar,
  User,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  Layers,
  PackagePlus,
  ShieldAlert,
  ArrowRightLeft,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function MovimentacoesPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 📄 PAGINAÇÃO (Limite de 20 itens)
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // FILTROS
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterType, setFilterType] = useState<
    "ALL" | "ENTRY" | "EXIT" | "CREATE" | "AUDIT"
  >("ALL");

  // 1. BUSCA DADOS (Traz tudo e pagina no front para garantir performance visual)
  const fetchLogs = () => {
    setLoading(true);
    // Removemos limit=50 para trazer o histórico completo e paginar aqui
    fetch(`/api/movements`)
      .then((res) => res.json())
      .then((data) => {
        // Garante que é array, independente do formato da API
        const movements = Array.isArray(data) ? data : data.data || [];
        setLogs(movements);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // 2. LÓGICA DE FILTRAGEM
  const filteredLogs = logs.filter((log) => {
    // Filtro de Data
    if (startDate || endDate) {
      const logDate = new Date(log.createdAt);
      const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
      const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;
      if (start && logDate < start) return false;
      if (end && logDate > end) return false;
    }

    // Filtro de Tipo
    if (filterType === "ENTRY")
      return log.type === "entrada" || log.type === "ajuste_entrada";
    if (filterType === "EXIT")
      return log.type === "saida" || log.type === "ajuste_saida";
    if (filterType === "CREATE") return log.type === "criacao"; // Legado
    if (filterType === "AUDIT")
      return log.type === "exclusao" || log.type === "ajuste";

    return true;
  });

  // 3. CÁLCULO DA PAGINAÇÃO
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  // Contadores para os Botões de Filtro
  const countEntry = logs.filter((l) =>
    ["entrada", "ajuste_entrada"].includes(l.type),
  ).length;
  const countExit = logs.filter((l) =>
    ["saida", "ajuste_saida"].includes(l.type),
  ).length;
  const countCreate = logs.filter((l) => l.type === "criacao").length;
  const countAudit = logs.filter((l) =>
    ["exclusao", "ajuste"].includes(l.type),
  ).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper de Estilos (Padronizado com o Sistema)
  const getTypeStyle = (type: string) => {
    switch (type) {
      case "entrada":
      case "ajuste_entrada":
        return {
          icon: <ArrowUpRight size={12} />,
          style: "bg-emerald-50 text-emerald-700 border-emerald-100",
          label: "ENTRADA",
        };
      case "saida":
      case "ajuste_saida":
        return {
          icon: <ArrowDownLeft size={12} />,
          style: "bg-amber-50 text-amber-700 border-amber-100",
          label: "SAÍDA",
        };
      case "exclusao":
        return {
          icon: <Trash2 size={12} />,
          style: "bg-red-50 text-red-700 border-red-100",
          label: "EXCLUSÃO",
        };
      case "criacao":
        return {
          icon: <PackagePlus size={12} />,
          style: "bg-blue-50 text-blue-700 border-blue-100",
          label: "CRIAÇÃO",
        };
      case "ajuste":
        return {
          icon: <Edit size={12} />,
          style: "bg-purple-50 text-purple-700 border-purple-100",
          label: "AJUSTE",
        };
      default:
        return {
          icon: <ArrowRightLeft size={12} />,
          style: "bg-gray-50 text-gray-700 border-gray-100",
          label: type,
        };
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(220, 38, 38);
    doc.text("STOCKMASTER - Relatório de Movimentações", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    const tipoLabel = filterType === "ALL" ? "Geral" : filterType;
    doc.text(`Filtro: ${tipoLabel}`, 14, 28);

    const tableData = filteredLogs.map((log) => [
      new Date(log.createdAt).toLocaleString("pt-BR"),
      log.productName,
      log.type.toUpperCase(),
      log.userName || "Sistema",
      (log.type === "entrada" ? "+" : log.type === "saida" ? "-" : "") +
        log.quantity,
      log.oldStock !== undefined ? `${log.oldStock} -> ${log.newStock}` : "-",
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Data/Hora", "Produto", "Tipo", "Responsável", "Qtd", "Detalhe"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38] },
      styles: { fontSize: 8 },
    });

    doc.save(`movimentacoes-${filterType.toLowerCase()}.pdf`);
  };

  return (
    <div className="p-8 md:p-12 min-h-screen bg-gray-50/50 flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg text-brand-red bg-red-50 border border-red-100">
              <ArrowRightLeft size={24} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Central de <span className="text-brand-red">Movimentações</span>
            </h1>
          </div>
          <p className="text-sm text-gray-500 font-medium ml-12">
            Visualizando {filteredLogs.length} registros no total.
          </p>
        </div>

        <button
          onClick={exportToPDF}
          className="bg-brand-red text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-dark-red transition-all shadow-lg shadow-red-200 active:scale-95"
        >
          <FileText size={18} /> EXPORTAR FILTRADO
        </button>
      </div>

      {/* PAINEL DE FILTROS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4">
        {/* Filtro de Data */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-wider">
            <Filter size={16} /> Data:
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400">DE</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent outline-none text-xs font-bold text-gray-800 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400">ATÉ</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent outline-none text-xs font-bold text-gray-800 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Botões de Tipo */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
          <button
            onClick={() => {
              setFilterType("ALL");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterType === "ALL" ? "bg-gray-900 text-white border-gray-900 shadow-md" : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"}`}
          >
            <Layers size={14} /> Todos
          </button>

          <button
            onClick={() => {
              setFilterType("ENTRY");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterType === "ENTRY" ? "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm" : "bg-white text-gray-400 border-gray-200 hover:text-emerald-500 hover:border-emerald-100"}`}
          >
            <ArrowUpRight size={14} /> Entradas
            {countEntry > 0 && (
              <span className="bg-emerald-200 text-emerald-800 px-1.5 rounded text-[9px]">
                {countEntry}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setFilterType("EXIT");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterType === "EXIT" ? "bg-amber-50 text-amber-600 border-amber-200 shadow-sm" : "bg-white text-gray-400 border-gray-200 hover:text-amber-500 hover:border-amber-100"}`}
          >
            <ArrowDownLeft size={14} /> Saídas
            {countExit > 0 && (
              <span className="bg-amber-200 text-amber-800 px-1.5 rounded text-[9px]">
                {countExit}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setFilterType("CREATE");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterType === "CREATE" ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm" : "bg-white text-gray-400 border-gray-200 hover:text-blue-500 hover:border-blue-100"}`}
          >
            <PackagePlus size={14} /> Cadastros
            {countCreate > 0 && (
              <span className="bg-blue-200 text-blue-800 px-1.5 rounded text-[9px]">
                {countCreate}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setFilterType("AUDIT");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterType === "AUDIT" ? "bg-red-50 text-red-600 border-red-200 shadow-sm" : "bg-white text-gray-400 border-gray-200 hover:text-red-500 hover:border-red-100"}`}
          >
            <ShieldAlert size={14} /> Auditoria
            {countAudit > 0 && (
              <span className="bg-red-200 text-red-800 px-1.5 rounded text-[9px]">
                {countAudit}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TABELA DE DADOS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col mb-6 flex-1">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-gray-400 animate-pulse">
            <div className="h-8 w-8 bg-gray-200 rounded-full mb-2"></div>
            <span className="font-bold text-sm">Carregando dados...</span>
          </div>
        ) : currentLogs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center text-gray-400">
            <Filter size={48} className="text-gray-200 mb-4" />
            <p>Nenhum registro encontrado com este filtro.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left min-w-[800px] table-fixed">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4 w-[15%]">Data/Hora</th>
                  <th className="px-6 py-4 w-[25%]">Produto</th>
                  <th className="px-6 py-4 w-[15%]">Tipo</th>
                  <th className="px-6 py-4 w-[20%]">Responsável</th>
                  <th className="px-6 py-4 w-[15%] text-right">Quantidade</th>
                  <th className="px-6 py-4 w-[10%] text-center">Detalhe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentLogs.map((log) => {
                  const styleInfo = getTypeStyle(log.type);
                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-500 font-medium text-xs">
                          <Calendar size={14} className="text-gray-300" />
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 text-sm">
                          {log.productName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${styleInfo.style}`}
                        >
                          {styleInfo.icon}
                          {styleInfo.label}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                            <User size={12} />
                          </div>
                          <span className="text-xs font-bold text-gray-600">
                            {log.userName || "Sistema"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-black text-sm ${
                            ["entrada", "criacao", "ajuste_entrada"].includes(
                              log.type,
                            )
                              ? "text-emerald-600"
                              : ["saida", "exclusao", "ajuste_saida"].includes(
                                    log.type,
                                  )
                                ? "text-amber-600"
                                : "text-gray-800"
                          }`}
                        >
                          {["entrada", "criacao", "ajuste_entrada"].includes(
                            log.type,
                          )
                            ? "+"
                            : ["saida", "exclusao", "ajuste_saida"].includes(
                                  log.type,
                                )
                              ? "-"
                              : ""}
                          {log.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {log.oldStock !== undefined && (
                          <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100">
                            {log.oldStock} ➝ {log.newStock}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONTROLES DE PAGINAÇÃO */}
      <div className="flex items-center justify-between mt-auto pt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          className="group flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm font-bold text-gray-600 hover:border-brand-red hover:text-brand-red disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <div className="bg-gray-50 p-1.5 rounded-lg group-hover:bg-red-50 transition-colors">
            <ChevronLeft size={18} />
          </div>
          <span>Anterior</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Página Atual
          </span>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
            <span className="font-black text-brand-red text-lg">{page}</span>
            <span className="text-gray-300 font-light">/</span>
            <span className="font-bold text-gray-500">{totalPages || 1}</span>
          </div>
        </div>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || loading || totalPages === 0}
          className="group flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm font-bold text-gray-600 hover:border-brand-red hover:text-brand-red disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <span>Próxima</span>
          <div className="bg-gray-50 p-1.5 rounded-lg group-hover:bg-red-50 transition-colors">
            <ChevronRight size={18} />
          </div>
        </button>
      </div>
    </div>
  );
}
