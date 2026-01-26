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
  X,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// 👇 IMPORT NOVO
import { DataDisplay } from "@/components/ui/DataDisplay";

export default function MovimentacoesPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Paginação
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterType, setFilterType] = useState<
    "ALL" | "ENTRY" | "EXIT" | "CREATE" | "AUDIT"
  >("ALL");

  const fetchLogs = () => {
    setLoading(true);
    fetch(`/api/movements`)
      .then((res) => res.json())
      .then((data) => {
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

  // Lógica de Filtragem
  const filteredLogs = logs.filter((log) => {
    if (startDate || endDate) {
      const logDate = new Date(log.createdAt);
      const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
      const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;
      if (start && logDate < start) return false;
      if (end && logDate > end) return false;
    }

    if (filterType === "ENTRY")
      return log.type === "entrada" || log.type === "ajuste_entrada";
    if (filterType === "EXIT")
      return log.type === "saida" || log.type === "ajuste_saida";
    if (filterType === "CREATE") return log.type === "criacao";
    if (filterType === "AUDIT")
      return log.type === "exclusao" || log.type === "ajuste";

    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

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

  // 👇 DEFINIÇÃO DAS COLUNAS PARA O DataDisplay
  const columns = [
    {
      header: "Data/Hora",
      accessorKey: "createdAt" as keyof any,
      cell: (log: any) => (
        <div className="flex items-center gap-2 text-gray-500 font-medium text-xs">
          <Calendar size={14} className="text-gray-300" />
          {formatDate(log.createdAt)}
        </div>
      ),
    },
    {
      header: "Produto",
      accessorKey: "productName" as keyof any,
      cell: (log: any) => (
        <span className="font-bold text-gray-900 text-sm">
          {log.productName}
        </span>
      ),
    },
    {
      header: "Tipo",
      accessorKey: "type" as keyof any,
      cell: (log: any) => {
        const styleInfo = getTypeStyle(log.type);
        return (
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${styleInfo.style}`}
          >
            {styleInfo.icon} {styleInfo.label}
          </div>
        );
      },
    },
    {
      header: "Responsável",
      accessorKey: "userName" as keyof any,
      cell: (log: any) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
            <User size={12} />
          </div>
          <span className="text-xs font-bold text-gray-600">
            {log.userName || "Sistema"}
          </span>
        </div>
      ),
    },
    {
      header: "Qtd",
      accessorKey: "quantity" as keyof any,
      cell: (log: any) => {
        const isPositive = ["entrada", "criacao", "ajuste_entrada"].includes(
          log.type,
        );
        const isNegative = ["saida", "exclusao", "ajuste_saida"].includes(
          log.type,
        );
        return (
          <span
            className={`font-black text-sm ${isPositive ? "text-emerald-600" : isNegative ? "text-amber-600" : "text-gray-800"}`}
          >
            {isPositive ? "+" : isNegative ? "-" : ""} {log.quantity}
          </span>
        );
      },
    },
    {
      header: "Detalhe",
      accessorKey: "oldStock" as keyof any,
      cell: (log: any) =>
        log.oldStock !== undefined && (
          <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100">
            {log.oldStock} ➝ {log.newStock}
          </span>
        ),
    },
  ];

  return (
    <div className="p-4 md:p-12 min-h-screen bg-gray-50/50 flex flex-col pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg text-brand-red bg-red-50 border border-red-100">
              <ArrowRightLeft size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Central de <span className="text-brand-red">Movimentações</span>
            </h1>
          </div>
          <p className="text-sm text-gray-500 font-medium md:ml-12">
            Visualizando {filteredLogs.length} registros no total.
          </p>
        </div>

        <button
          onClick={exportToPDF}
          className="w-full md:w-auto justify-center bg-brand-red text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-dark-red transition-all shadow-lg shadow-red-200 active:scale-95"
        >
          <FileText size={18} /> EXPORTAR PDF
        </button>
      </div>

      {/* PAINEL DE FILTROS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4">
        {/* Filtro de Data */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-wider">
            <Filter size={16} /> Data:
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400">DE</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent outline-none text-xs font-bold text-gray-800 cursor-pointer w-full"
              />
            </div>
            <div className="flex-1 md:flex-none flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400">ATÉ</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent outline-none text-xs font-bold text-gray-800 cursor-pointer w-full"
              />
            </div>
          </div>
        </div>

        {/* Botões de Tipo (Scroll Horizontal no Mobile) */}
        <div className="flex gap-2 pt-4 border-t border-gray-50 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button
            onClick={() => {
              setFilterType("ALL");
              setPage(1);
            }}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterType === "ALL" ? "bg-gray-900 text-white border-gray-900 shadow-md" : "bg-white text-gray-400 border-gray-200"}`}
          >
            <Layers size={14} /> Todos
          </button>
          <button
            onClick={() => {
              setFilterType("ENTRY");
              setPage(1);
            }}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterType === "ENTRY" ? "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm" : "bg-white text-gray-400 border-gray-200"}`}
          >
            <ArrowUpRight size={14} /> Entradas{" "}
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
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterType === "EXIT" ? "bg-amber-50 text-amber-600 border-amber-200 shadow-sm" : "bg-white text-gray-400 border-gray-200"}`}
          >
            <ArrowDownLeft size={14} /> Saídas{" "}
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
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterType === "CREATE" ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm" : "bg-white text-gray-400 border-gray-200"}`}
          >
            <PackagePlus size={14} /> Cadastros{" "}
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
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterType === "AUDIT" ? "bg-red-50 text-red-600 border-red-200 shadow-sm" : "bg-white text-gray-400 border-gray-200"}`}
          >
            <ShieldAlert size={14} /> Auditoria{" "}
            {countAudit > 0 && (
              <span className="bg-red-200 text-red-800 px-1.5 rounded text-[9px]">
                {countAudit}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ⚡ TABELA RESPONSIVA (DataDisplay) */}
      <div className="flex-1">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-gray-400 animate-pulse">
            <div className="h-8 w-8 bg-gray-200 rounded-full mb-2"></div>
            <span className="font-bold text-sm">Carregando dados...</span>
          </div>
        ) : (
          <DataDisplay
            data={currentLogs}
            columns={columns}
            titleField="productName"
            subtitleField="type" // Tipo aparecerá abaixo do nome no card
          />
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
          <span className="hidden md:inline">Anterior</span>
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
          <span className="hidden md:inline">Próxima</span>
          <div className="bg-gray-50 p-1.5 rounded-lg group-hover:bg-red-50 transition-colors">
            <ChevronRight size={18} />
          </div>
        </button>
      </div>
    </div>
  );
}
