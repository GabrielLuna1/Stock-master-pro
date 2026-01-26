"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  FileText,
  UserPlus,
  UserMinus,
  Activity,
  Calendar,
  User,
  ShieldAlert,
  Tag,
  PackagePlus,
  Trash2,
  AlertTriangle,
  Edit,
  Filter,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";

// 👇 Importação do Componente Híbrido
import { DataDisplay } from "@/components/ui/DataDisplay";

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros e Paginação
  const [filterDate, setFilterDate] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<string[]>([
    "info",
    "warning",
    "critical",
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetch("/api/system-logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Resetar página quando mudar filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, selectedLevels]);

  const toggleLevel = (level: string) => {
    if (selectedLevels.includes(level)) {
      setSelectedLevels(selectedLevels.filter((l) => l !== level));
    } else {
      setSelectedLevels([...selectedLevels, level]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 🧠 LÓGICA DE FILTRAGEM
  const filteredLogs = logs.filter((log) => {
    if (filterDate) {
      const logDate = new Date(log.createdAt).toISOString().split("T")[0];
      if (logDate !== filterDate) return false;
    }
    if (!selectedLevels.includes(log.level)) return false;
    return true;
  });

  // 🧠 LÓGICA DE PAGINAÇÃO
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  // 👇 HELPER VISUAL (Mantido da sua versão original)
  const getActionStyle = (action: string) => {
    switch (action) {
      case "PDF_EXPORT":
        return {
          icon: <FileText size={14} />,
          color: "bg-blue-50 text-blue-700 border-blue-100",
          label: "Exportação PDF",
        };
      case "USER_CREATE":
        return {
          icon: <UserPlus size={14} />,
          color: "bg-emerald-50 text-emerald-700 border-emerald-100",
          label: "Usuário Criado",
        };
      case "USER_UPDATE":
        return {
          icon: <Edit size={14} />,
          color: "bg-amber-50 text-amber-700 border-amber-100",
          label: "Usuário Editado",
        };
      case "USER_DELETE":
        return {
          icon: <UserMinus size={14} />,
          color: "bg-red-50 text-red-700 border-red-100",
          label: "Usuário Removido",
        };
      case "CATEGORY_CREATE":
        return {
          icon: <Tag size={14} />,
          color: "bg-purple-50 text-purple-700 border-purple-100",
          label: "Nova Categoria",
        };
      case "CATEGORY_UPDATE":
        return {
          icon: <Edit size={14} />,
          color: "bg-purple-50 text-purple-700 border-purple-100",
          label: "Categoria Editada",
        };
      case "CATEGORY_DELETE":
        return {
          icon: <Trash2 size={14} />,
          color: "bg-red-50 text-red-700 border-red-100",
          label: "Categoria Excluída",
        };
      case "CATEGORY_DELETE_FAIL":
        return {
          icon: <AlertTriangle size={14} />,
          color: "bg-orange-50 text-orange-700 border-orange-100",
          label: "Exclusão Bloqueada",
        };
      case "PRODUCT_CREATE":
        return {
          icon: <PackagePlus size={14} />,
          color: "bg-indigo-50 text-indigo-700 border-indigo-100",
          label: "Produto Cadastrado",
        };
      case "PRODUCT_UPDATE":
        return {
          icon: <Edit size={14} />,
          color: "bg-indigo-50 text-indigo-700 border-indigo-100",
          label: "Produto Editado",
        };
      case "PRODUCT_DELETE":
        return {
          icon: <Trash2 size={14} />,
          color: "bg-red-50 text-red-700 border-red-100",
          label: "Produto Excluído",
        };
      default:
        return {
          icon: <Activity size={14} />,
          color: "bg-gray-50 text-gray-700 border-gray-100",
          label: action,
        };
    }
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
      header: "Ação",
      accessorKey: "action" as keyof any,
      cell: (log: any) => {
        const style = getActionStyle(log.action);
        return (
          <div
            className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-tight border ${style.color}`}
          >
            {style.icon} {style.label}
          </div>
        );
      },
    },
    {
      header: "Descrição",
      accessorKey: "description" as keyof any,
      cell: (log: any) => (
        <span className="text-sm font-medium text-gray-700">
          {log.description}
        </span>
      ),
    },
    {
      header: "Executado Por",
      accessorKey: "userName" as keyof any,
      cell: (log: any) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
            <User size={12} />
          </div>
          <span className="text-xs font-bold text-gray-900">
            {log.userName || "Sistema"}
          </span>
        </div>
      ),
    },
    {
      header: "Nível",
      accessorKey: "level" as keyof any,
      cell: (log: any) => {
        if (log.level === "critical")
          return (
            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-wide">
              CRÍTICO
            </span>
          );
        if (log.level === "warning")
          return (
            <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-wide">
              ALERTA
            </span>
          );
        return (
          <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-wide">
            INFO
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-4 md:p-12 min-h-screen bg-gray-50/50 flex flex-col pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg text-red-600 bg-red-50 border border-red-100 shadow-sm">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Auditoria <span className="text-red-600">Geral</span>
            </h1>
          </div>
          <p className="text-sm text-gray-500 font-medium md:ml-12">
            Monitoramento de segurança. Total de {filteredLogs.length} registros
            encontrados.
          </p>
        </div>
      </div>

      {/* ÁREA DE FILTROS */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Filtro de Data */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 w-full md:w-auto">
            <Filter size={16} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">
              Filtrar Dia:
            </span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent outline-none text-sm font-bold text-gray-700 cursor-pointer w-full"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="ml-2 text-gray-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Botões de Nível */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
          <span className="text-[10px] font-bold text-gray-400 uppercase mr-2 flex items-center">
            Exibir:
          </span>

          <button
            onClick={() => toggleLevel("info")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all border ${selectedLevels.includes("info") ? "bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-200" : "bg-white text-gray-400 border-gray-200"}`}
          >
            {selectedLevels.includes("info") && <Check size={12} />} INFO
          </button>

          <button
            onClick={() => toggleLevel("warning")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all border ${selectedLevels.includes("warning") ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-200" : "bg-white text-gray-400 border-gray-200"}`}
          >
            {selectedLevels.includes("warning") && <Check size={12} />} ALERTA
          </button>

          <button
            onClick={() => toggleLevel("critical")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all border ${selectedLevels.includes("critical") ? "bg-red-600 text-white border-red-700 shadow-md shadow-red-200" : "bg-white text-gray-400 border-gray-200"}`}
          >
            {selectedLevels.includes("critical") && <Check size={12} />} CRÍTICO
          </button>
        </div>
      </div>

      {/* ⚡ TABELA RESPONSIVA (DataDisplay) */}
      <div className="flex-1">
        {loading ? (
          <div className="p-20 text-center animate-pulse text-gray-400 font-bold flex flex-col items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            Carregando registros...
          </div>
        ) : (
          <DataDisplay
            data={currentLogs}
            columns={columns}
            titleField="description"
            subtitleField="userName"
          />
        )}
      </div>

      {/* PAGINAÇÃO */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1 || loading}
          className="group flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm font-bold text-gray-600 hover:border-red-500 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
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
            <span className="font-black text-red-600 text-lg">
              {currentPage}
            </span>
            <span className="text-gray-300 font-light">/</span>
            <span className="font-bold text-gray-500">{totalPages || 1}</span>
          </div>
        </div>

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || loading || totalPages === 0}
          className="group flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm font-bold text-gray-600 hover:border-red-500 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
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
