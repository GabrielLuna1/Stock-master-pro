"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { OverviewChart } from "../components/dashboard/OverviewChart";
import {
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ShieldCheck,
  Search,
  History,
  FileSpreadsheet,
  ChevronDown,
  Calendar,
  DollarSign, // ✨ Ícone Financeiro
  Wallet, // ✨ Ícone Financeiro
  PiggyBank, // ✨ Ícone Financeiro
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Bibliotecas Excel
import ExcelJS from "exceljs";
import FileSaver from "file-saver";

// 💰 Função auxiliar para formatar Dinheiro (R$)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function Dashboard() {
  const { data: session } = useSession();

  // 1. CONFIGURAÇÃO DE DATAS 📅
  const now = new Date();
  const currentYear = now.getFullYear();
  const startYear = 2024;

  const years = Array.from(
    { length: currentYear - startYear + 2 },
    (_, i) => startYear + i,
  ).sort((a, b) => b - a);

  const todayFormatted = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const capitalisedDate = todayFormatted.replace(
    /(^\w{1})|(\s+\w{1})/g,
    (letter) => letter.toUpperCase(),
  );

  // 2. ESTADOS
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✨ NOVO: Estado do Toggle (Visão Estoque vs Financeiro)
  const [viewMode, setViewMode] = useState<"stock" | "financial">("stock");

  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  // 4. BUSCA DADOS NA API
  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/dashboard?month=${selectedMonth}&year=${selectedYear}`,
        );

        if (!res.ok) throw new Error("Falha na API");

        const data = await res.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Erro dashboard:", error);
        toast.error("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  // --- 💎 FUNÇÃO EXCEL (Mantida Igual) ---
  const handleDownloadExcel = async () => {
    if (!dashboardData?.chartData?.length) {
      toast.error("Sem dados para exportar.");
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Relatório Mensal", {
        views: [{ showGridLines: false }],
      });

      const reportData = dashboardData.chartData;
      const reportMonthName = months[selectedMonth];

      // Configuração Colunas
      worksheet.columns = [
        { key: "margin", width: 2 },
        { key: "date", width: 15 },
        { key: "spacer1", width: 5 },
        { key: "in", width: 20 },
        { key: "spacer2", width: 5 },
        { key: "out", width: 20 },
      ];

      // Cabeçalho Vermelho
      for (let r = 2; r <= 5; r++) {
        for (let c = 2; c <= 6; c++) {
          worksheet.getCell(r, c).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFDC2626" },
          };
        }
      }

      // Logo e Títulos
      worksheet.mergeCells("B3:B4");
      const logoCell = worksheet.getCell("B3");
      logoCell.value = "S";
      logoCell.font = {
        name: "Arial",
        family: 4,
        size: 28,
        bold: true,
        color: { argb: "FFDC2626" },
      };
      logoCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
      logoCell.alignment = { vertical: "middle", horizontal: "center" };

      worksheet.mergeCells("D3:F3");
      const titleCell = worksheet.getCell("D3");
      titleCell.value = "STOCKMASTER";
      titleCell.font = {
        name: "Segoe UI",
        size: 18,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      titleCell.alignment = { vertical: "bottom", horizontal: "left" };

      worksheet.mergeCells("D4:F4");
      const subCell = worksheet.getCell("D4");
      subCell.value = `RELATÓRIO DE ${reportMonthName.toUpperCase()} ${selectedYear}`;
      subCell.font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
        color: { argb: "FFFEE2E2" },
      };
      subCell.alignment = { vertical: "top", horizontal: "left" };

      worksheet.addRow([]);
      worksheet.addRow([]);

      // Tabela
      const headerRow = worksheet.getRow(8);
      headerRow.getCell(2).value = "DATA";
      headerRow.getCell(4).value = "ENTRADAS (UN)";
      headerRow.getCell(6).value = "SAÍDAS (UN)";
      headerRow.height = 25;

      [2, 4, 6].forEach((col) => {
        const cell = headerRow.getCell(col);
        cell.font = {
          name: "Segoe UI",
          bold: true,
          size: 9,
          color: { argb: "FF000000" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          bottom: { style: "thick", color: { argb: "FFDC2626" } },
        };
      });

      let totalIn = 0;
      let totalOut = 0;

      reportData.forEach((item: any) => {
        if (item.entradas === 0 && item.saidas === 0) return;

        totalIn += item.entradas;
        totalOut += item.saidas;
        const dateStr = `${String(item.day).padStart(2, "0")}/${String(selectedMonth + 1).padStart(2, "0")}/${selectedYear}`;

        const row = worksheet.addRow([
          "",
          dateStr,
          "",
          item.entradas === 0 ? "-" : item.entradas,
          "",
          item.saidas === 0 ? "-" : item.saidas,
        ]);
        row.height = 22;

        [2, 4, 6].forEach((col) => {
          const cell = row.getCell(col);
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            bottom: { style: "dotted", color: { argb: "FFD1D5DB" } },
          };
        });
      });

      worksheet.addRow([]);
      const totalRow = worksheet.addRow([
        "",
        "TOTAL GERAL",
        "",
        totalIn,
        "",
        totalOut,
      ]);
      totalRow.height = 30;

      totalRow.getCell(4).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF10B981" },
      };
      totalRow.getCell(4).font = { bold: true, color: { argb: "FFFFFFFF" } };
      totalRow.getCell(4).alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      totalRow.getCell(6).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDC2626" },
      };
      totalRow.getCell(6).font = { bold: true, color: { argb: "FFFFFFFF" } };
      totalRow.getCell(6).alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `Relatorio_${reportMonthName}_${selectedYear}.xlsx`;
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      FileSaver.saveAs(blob, fileName);
      toast.success("Relatório baixado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar Excel.");
    }
  };

  return (
    <div className="p-4 md:p-12 min-h-screen bg-gray-50/50 pb-24">
      {/* HEADER E FILTROS */}
      <div className="mb-6 md:mb-10 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Olá,{" "}
            <span className="text-red-600">
              {session?.user?.name?.split(" ")[0] || "Visitante"}
            </span>
          </h1>
          <p className="text-sm md:text-base text-gray-500 font-medium mt-1">
            Visão{" "}
            {viewMode === "stock"
              ? "operacional de estoque"
              : "financeira estratégica"}{" "}
            de{" "}
            <span className="capitalize font-bold text-gray-700">
              {months[selectedMonth]}
            </span>
            .
          </p>
        </div>

        {/* 🕹️ ÁREA DE CONTROLE */}
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-stretch">
          {/* ✨ NOVO: TOGGLE SWITCH (ESTOQUE vs FINANCEIRO) */}
          <div className="bg-gray-200 p-1 rounded-2xl flex relative h-full">
            <button
              onClick={() => setViewMode("stock")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all z-10 flex-1 justify-center ${
                viewMode === "stock"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Package size={16} /> Estoque
            </button>
            <button
              onClick={() => setViewMode("financial")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all z-10 flex-1 justify-center ${
                viewMode === "financial"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <DollarSign size={16} /> Financeiro
            </button>
          </div>

          {/* 📅 DATA DE HOJE */}
          <div className="bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 min-w-fit justify-center md:justify-start">
            <div className="bg-red-50 p-1.5 rounded-lg text-red-600">
              <Calendar size={18} />
            </div>
            <span className="text-xs font-bold text-gray-800 tracking-wide">
              {capitalisedDate}
            </span>
          </div>

          {/* SELETORES DE DATA */}
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative flex-1 md:flex-none">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full md:w-auto appearance-none bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2.5 pl-4 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-100 transition-all text-xs uppercase tracking-wide h-full"
              >
                {months.map((m, index) => (
                  <option key={index} value={index}>
                    {m.substring(0, 3)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            <div className="relative flex-1 md:flex-none">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full md:w-auto appearance-none bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2.5 pl-4 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-100 transition-all text-xs h-full"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* BOTÃO EXCEL */}
          <button
            onClick={handleDownloadExcel}
            disabled={loading}
            className="justify-center bg-red-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-md shadow-red-200 text-xs active:scale-95 disabled:opacity-50 uppercase tracking-wide"
          >
            <FileSpreadsheet size={18} />
            <span className="hidden md:inline">EXPORTAR</span>
          </button>
        </div>
      </div>

      {/* ✨ RENDERIZAÇÃO CONDICIONAL DOS CARDS */}
      {viewMode === "stock" ? (
        // 📦 MODO ESTOQUE (SEU CÓDIGO ORIGINAL)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Total SKUs */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Total SKUs
                </p>
                <h3 className="text-3xl font-black text-gray-800 mt-1">
                  {loading ? "..." : dashboardData?.summary?.totalSkus || 0}
                </h3>
              </div>
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Package size={20} />
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-1 text-xs font-bold text-emerald-600 w-fit rounded-md mt-auto pt-2">
              <TrendingUp size={12} /> Base ativa
            </div>
          </div>

          {/* Reposição */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden">
            {(dashboardData?.summary?.lowStock || 0) > 0 && (
              <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500"></div>
            )}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Reposição
                </p>
                <h3
                  className={`text-3xl font-black mt-1 ${(dashboardData?.summary?.lowStock || 0) > 0 ? "text-red-600" : "text-gray-800"}`}
                >
                  {loading ? "..." : dashboardData?.summary?.lowStock || 0}
                </h3>
              </div>
              <div
                className={`p-2 rounded-lg ${(dashboardData?.summary?.lowStock || 0) > 0 ? "bg-red-50 text-red-600 animate-pulse" : "bg-gray-50 text-gray-400"}`}
              >
                <AlertTriangle size={20} />
              </div>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-auto pt-2">
              Itens abaixo do mínimo
            </p>
          </div>

          {/* Entradas */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Entradas ({months[selectedMonth].substring(0, 3)})
                </p>
                <h3 className="text-3xl font-black text-gray-800 mt-1">
                  {loading
                    ? "..."
                    : dashboardData?.summary?.monthlyEntries || 0}
                </h3>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <ArrowUpRight size={20} />
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-bold mt-auto pt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>{" "}
              Acumulado
            </p>
          </div>

          {/* Saídas */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Saídas ({months[selectedMonth].substring(0, 3)})
                </p>
                <h3 className="text-3xl font-black text-gray-800 mt-1">
                  {loading ? "..." : dashboardData?.summary?.monthlyExits || 0}
                </h3>
              </div>
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <ArrowDownRight size={20} />
              </div>
            </div>
            <p className="text-xs text-red-500 font-bold mt-auto pt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block"></span>{" "}
              Acumulado
            </p>
          </div>
        </div>
      ) : (
        // 💰 MODO FINANCEIRO (NOVOS CARDS)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Valor em Estoque (Custo) */}
          <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4"></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Patrimônio (Custo)
              </p>
              <h3 className="text-2xl font-black text-emerald-900 mt-1 truncate">
                {loading
                  ? "..."
                  : formatCurrency(
                      dashboardData?.summary?.totalStockValue || 0,
                    )}
              </h3>
            </div>
            <div className="relative z-10 flex items-center gap-1 text-xs font-bold text-emerald-600 mt-auto pt-2">
              <PiggyBank size={14} /> Dinheiro imobilizado
            </div>
          </div>

          {/* Faturamento do Mês */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Faturamento ({months[selectedMonth].substring(0, 3)})
                </p>
                <h3 className="text-2xl font-black text-gray-800 mt-1 truncate">
                  {loading
                    ? "..."
                    : formatCurrency(
                        dashboardData?.summary?.monthlyRevenue || 0,
                      )}
                </h3>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <ArrowUpRight size={20} />
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-bold mt-auto pt-2 flex items-center gap-1">
              Receita de Vendas
            </p>
          </div>

          {/* Despesas do Mês */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Compras ({months[selectedMonth].substring(0, 3)})
                </p>
                <h3 className="text-2xl font-black text-gray-800 mt-1 truncate">
                  {loading
                    ? "..."
                    : formatCurrency(dashboardData?.summary?.monthlyCost || 0)}
                </h3>
              </div>
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <ArrowDownRight size={20} />
              </div>
            </div>
            <p className="text-xs text-red-500 font-bold mt-auto pt-2 flex items-center gap-1">
              Custo de Reposição
            </p>
          </div>

          {/* Potencial de Lucro */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Potencial de Venda
                </p>
                <h3 className="text-2xl font-black text-gray-800 mt-1 truncate">
                  {loading
                    ? "..."
                    : formatCurrency(
                        dashboardData?.summary?.potentialRevenue || 0,
                      )}
                </h3>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Wallet size={20} />
              </div>
            </div>
            <p className="text-xs text-blue-500 font-bold mt-auto pt-2 flex items-center gap-1">
              Previsão Total
            </p>
          </div>
        </div>
      )}

      {/* ÁREA CENTRAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* ✨ GRÁFICO AGORA RECEBE A PROP DE MODO FINANCEIRO */}
          <OverviewChart
            data={dashboardData?.chartData || []}
            isFinancial={viewMode === "financial"}
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-red-600 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-50 p-2 rounded-lg text-red-600">
                <Package size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Acesso Operacional
              </h3>
            </div>
            <p className="text-gray-500 text-xs mb-6 font-medium">
              Ferramentas de gestão diária do estoque.
            </p>
            <div className="space-y-3">
              <Link
                href="/inventory"
                className="group w-full py-3 px-4 bg-gray-50 hover:bg-red-50 hover:text-red-700 rounded-xl text-sm font-bold text-gray-700 transition-all flex items-center justify-between border border-gray-100 hover:border-red-100 active:scale-95"
              >
                <span className="flex items-center gap-3">
                  <Search size={16} /> Gerenciar Estoque
                </span>
                <ArrowUpRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                />
              </Link>
              <Link
                href="/log/movimentacoes"
                className="group w-full py-3 px-4 bg-gray-50 hover:bg-red-50 hover:text-red-700 rounded-xl text-sm font-bold text-gray-700 transition-all flex items-center justify-between border border-gray-100 hover:border-red-100 active:scale-95"
              >
                <span className="flex items-center gap-3">
                  <History size={16} /> Ver Movimentações
                </span>
                <ArrowUpRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                />
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
              Segurança
            </h3>
            <Link
              href="/log/auditoria"
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer border border-transparent hover:border-gray-100 active:scale-95"
            >
              <div className="bg-gray-100 text-gray-500 p-3 rounded-lg group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm group-hover:text-red-700 transition-colors">
                  Auditoria Geral
                </h4>
                <p className="text-xs text-gray-500">Logs de risco e acesso</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
