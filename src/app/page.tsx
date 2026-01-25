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
  CalendarDays,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Bibliotecas Excel
import ExcelJS from "exceljs";
import FileSaver from "file-saver";

export default function Dashboard() {
  const { data: session } = useSession();

  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalEntries: 0,
    totalExits: 0,
    chartData: [],
    loading: true,
  });

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthName = now.toLocaleDateString("pt-BR", { month: "long" });
  const formattedMonthName =
    currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [prodRes, chartRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/dashboard/chart"),
        ]);

        const products = await prodRes.json();
        const chartData = await chartRes.json();

        // 1. Totais Produtos
        let totalProds = 0;
        let lowStock = 0;

        if (Array.isArray(products)) {
          totalProds = products.length;
          lowStock = products.filter(
            (p: any) => Number(p.quantity) <= Number(p.minStock || 15),
          ).length;
        }

        // 2. Totais do Mês
        let entries = 0;
        let exits = 0;

        if (Array.isArray(chartData)) {
          chartData.forEach((day: any) => {
            const dayDate = new Date(day.fullDate);
            if (
              dayDate.getMonth() === currentMonthIdx &&
              dayDate.getFullYear() === currentYear
            ) {
              entries += day.entradas || 0;
              exits += day.saidas || 0;
            }
          });
        }

        setStats({
          totalProducts: totalProds,
          lowStock: lowStock,
          totalEntries: entries,
          totalExits: exits,
          chartData: chartData,
          loading: false,
        });
      } catch (error) {
        console.error("Erro dashboard:", error);
        toast.error("Erro ao carregar dados.");
        setStats((prev) => ({ ...prev, loading: false }));
      }
    }

    fetchDashboardData();
  }, [currentMonthIdx, currentYear]);

  // --- 💎 FUNÇÃO EXCEL "RED BANNER DESIGN" (Baseado na sua imagem) ---
  const handleDownloadExcel = async () => {
    if (!stats.chartData.length) {
      toast.error("Sem dados para exportar.");
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Relatório Mensal", {
        views: [{ showGridLines: false }], // Remove grades do fundo
      });

      // 1. FILTRAR DADOS (Mês Atual)
      const currentMonthData = stats.chartData.filter((item: any) => {
        const d = new Date(item.fullDate);
        return (
          d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear
        );
      });

      if (currentMonthData.length === 0) {
        toast.warning("Sem dados neste mês para exportar.");
        return;
      }

      // 2. CONFIGURAR COLUNAS (Sem Saldo, layout espaçado)
      worksheet.columns = [
        { key: "margin", width: 2 }, // A: Margem
        { key: "date", width: 15 }, // B: Data
        { key: "spacer1", width: 5 }, // C: Espaço
        { key: "in", width: 20 }, // D: Entradas
        { key: "spacer2", width: 5 }, // E: Espaço
        { key: "out", width: 20 }, // F: Saídas
      ];

      // --- 🎨 3. CABEÇALHO (BANNER VERMELHO) ---

      // Pinta o fundo vermelho nas linhas 2 a 5, colunas B a F
      for (let r = 2; r <= 5; r++) {
        for (let c = 2; c <= 6; c++) {
          worksheet.getCell(r, c).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFDC2626" }, // Vermelho Brand
          };
        }
      }

      // -- LOGO (Quadrado Branco com S Vermelho) --
      worksheet.mergeCells("B3:B4");
      const logoCell = worksheet.getCell("B3");
      logoCell.value = "S";
      logoCell.font = {
        name: "Arial",
        family: 4,
        size: 28,
        bold: true,
        color: { argb: "FFDC2626" }, // Texto Vermelho
      };
      logoCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" }, // Fundo Branco
      };
      logoCell.alignment = { vertical: "middle", horizontal: "center" };

      // -- TÍTULO (Texto Branco) --
      worksheet.mergeCells("D3:F3");
      const titleCell = worksheet.getCell("D3");
      titleCell.value = "STOCKMASTER";
      titleCell.font = {
        name: "Segoe UI",
        size: 18,
        bold: true,
        color: { argb: "FFFFFFFF" }, // Branco
      };
      titleCell.alignment = { vertical: "bottom", horizontal: "left" };

      // -- SUBTÍTULO (Texto Branco) --
      worksheet.mergeCells("D4:F4");
      const subCell = worksheet.getCell("D4");
      subCell.value = `RELATÓRIO DE ${formattedMonthName.toUpperCase()} ${currentYear}`;
      subCell.font = {
        name: "Segoe UI",
        size: 10,
        bold: true,
        color: { argb: "FFFEE2E2" }, // Branco levemente rosado (Red-100)
      };
      subCell.alignment = { vertical: "top", horizontal: "left" };

      // Espaço
      worksheet.addRow([]);
      worksheet.addRow([]);

      // --- 4. CABEÇALHO DA TABELA (Minimalista) ---
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
          color: { argb: "FF000000" }, // Preto
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        // Borda grossa vermelha apenas embaixo
        cell.border = {
          bottom: { style: "thick", color: { argb: "FFDC2626" } },
        };
      });

      // --- 5. DADOS ---
      let totalIn = 0;
      let totalOut = 0;

      currentMonthData.forEach((item: any) => {
        totalIn += item.entradas;
        totalOut += item.saidas;

        const row = worksheet.addRow([
          "", // Margem
          item.name,
          "", // Espaço
          item.entradas === 0 ? "-" : item.entradas,
          "", // Espaço
          item.saidas === 0 ? "-" : item.saidas,
        ]);

        row.height = 22;

        [2, 4, 6].forEach((col) => {
          const cell = row.getCell(col);
          cell.font = {
            name: "Segoe UI",
            size: 10,
            color: { argb: "FF374151" },
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          // Linha pontilhada cinza embaixo
          cell.border = {
            bottom: { style: "dotted", color: { argb: "FFD1D5DB" } },
          };
        });
      });

      // Espaço antes do total
      worksheet.addRow([]);

      // --- 6. TOTAIS (Blocos Coloridos) ---
      const totalRow = worksheet.addRow([
        "",
        "TOTAL GERAL",
        "",
        totalIn,
        "",
        totalOut,
      ]);
      totalRow.height = 30;

      // Label "TOTAL GERAL"
      const labelCell = totalRow.getCell(2);
      labelCell.font = { name: "Segoe UI", bold: true, size: 10 };
      labelCell.alignment = { horizontal: "left", vertical: "middle" };

      // Total Entradas (VERDE SÓLIDO)
      const inCell = totalRow.getCell(4);
      inCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF10B981" }, // Emerald 500
      };
      inCell.font = {
        name: "Segoe UI",
        bold: true,
        color: { argb: "FFFFFFFF" },
      }; // Branco
      inCell.alignment = { horizontal: "center", vertical: "middle" };

      // Total Saídas (VERMELHO SÓLIDO)
      const outCell = totalRow.getCell(6);
      outCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDC2626" }, // Red 600
      };
      outCell.font = {
        name: "Segoe UI",
        bold: true,
        color: { argb: "FFFFFFFF" },
      }; // Branco
      outCell.alignment = { horizontal: "center", vertical: "middle" };

      // --- 7. RODAPÉ ---
      worksheet.addRow([]);
      const footerRow = worksheet.addRow([
        "",
        `Gerado em ${new Date().toLocaleDateString()} por ${session?.user?.name || "Sistema"}.`,
      ]);
      footerRow.getCell(2).font = {
        size: 8,
        italic: true,
        color: { argb: "FF9CA3AF" },
      };

      // Gera o arquivo
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `Relatorio_${formattedMonthName}_${currentYear}.xlsx`;

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      FileSaver.saveAs(blob, fileName);

      toast.success("Relatório baixado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar Excel.");
    }
  };

  const todayStr = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="p-8 md:p-12 min-h-screen bg-gray-50/50">
      {/* HEADER */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Olá,{" "}
            <span className="text-red-600">
              {session?.user?.name || "Visitante"}
            </span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Visão geral estratégica de{" "}
            <span className="capitalize font-bold text-gray-700">
              {formattedMonthName}
            </span>
            .
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {/* BOTÃO EXCEL */}
          <button
            onClick={handleDownloadExcel}
            disabled={stats.loading}
            className="bg-white text-red-600 border border-red-200 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-50 hover:border-red-300 transition-all shadow-sm text-xs active:scale-95 disabled:opacity-50 uppercase tracking-wide"
          >
            <FileSpreadsheet size={18} />
            {`Relatório de ${formattedMonthName}`}
          </button>

          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-red-50 p-2 rounded-lg text-red-600">
              <CalendarDays size={20} />
            </div>
            <span className="text-sm font-black text-gray-800 capitalize leading-tight">
              {todayStr}
            </span>
          </div>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* CARD 1 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Total SKUs
              </p>
              <h3 className="text-3xl font-black text-gray-800 mt-1">
                {stats.loading ? "..." : stats.totalProducts}
              </h3>
            </div>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Package size={20} />
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-1 text-xs font-bold text-emerald-600 w-fit rounded-md mt-auto">
            <TrendingUp size={12} /> Base ativa
          </div>
        </div>

        {/* CARD 2 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          {stats.lowStock > 0 && (
            <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500"></div>
          )}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Reposição
              </p>
              <h3
                className={`text-3xl font-black mt-1 ${
                  stats.lowStock > 0 ? "text-red-600" : "text-gray-800"
                }`}
              >
                {stats.loading ? "..." : stats.lowStock}
              </h3>
            </div>
            <div
              className={`p-2 rounded-lg ${
                stats.lowStock > 0
                  ? "bg-red-50 text-red-600 animate-pulse"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 font-medium mt-auto">
            Itens abaixo do mínimo
          </p>
        </div>

        {/* CARD 3 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Entradas ({formattedMonthName})
              </p>
              <h3 className="text-3xl font-black text-gray-800 mt-1">
                {stats.loading ? "..." : stats.totalEntries}
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-bold mt-auto flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>{" "}
            Acumulado
          </p>
        </div>

        {/* CARD 4 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Saídas ({formattedMonthName})
              </p>
              <h3 className="text-3xl font-black text-gray-800 mt-1">
                {stats.loading ? "..." : stats.totalExits}
              </h3>
            </div>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <p className="text-xs text-red-500 font-bold mt-auto flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block"></span>{" "}
            Acumulado
          </p>
        </div>
      </div>

      {/* ÁREA CENTRAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <OverviewChart data={stats.chartData} />
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
                className="group w-full py-3 px-4 bg-gray-50 hover:bg-red-50 hover:text-red-700 rounded-xl text-sm font-bold text-gray-700 transition-all flex items-center justify-between border border-gray-100 hover:border-red-100"
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
                className="group w-full py-3 px-4 bg-gray-50 hover:bg-red-50 hover:text-red-700 rounded-xl text-sm font-bold text-gray-700 transition-all flex items-center justify-between border border-gray-100 hover:border-red-100"
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
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer border border-transparent hover:border-gray-100"
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
