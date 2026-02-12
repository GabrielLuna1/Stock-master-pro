"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// 1. ATUALIZAMOS A INTERFACE PARA ACEITAR 'isFinancial'
interface OverviewChartProps {
  data: any[];
  isFinancial?: boolean; // ✨ Nova prop opcional (se não vier, assume false)
}

export function OverviewChart({
  data,
  isFinancial = false,
}: OverviewChartProps) {
  // Se não tiver dados
  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] w-full bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-4 bg-gray-200 rounded-full mb-2"></div>
          <span className="text-xs text-gray-400 font-bold">
            Aguardando dados...
          </span>
        </div>
      </div>
    );
  }

  // 2. COMPONENTE DE TOOLTIP CUSTOMIZADO (Para mostrar R$ ou Unidades)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-4 rounded-xl shadow-xl text-xs border border-gray-700">
          <p className="font-bold mb-2 text-gray-400 border-b border-gray-700 pb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 mb-1"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="capitalize text-gray-300">{entry.name}:</span>
              </div>
              <span className="font-bold text-white">
                {isFinancial
                  ? new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(entry.value)
                  : `${entry.value} un`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[400px] w-full bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {isFinancial
              ? "Fluxo de Caixa (Estimado)"
              : "Fluxo de Movimentação"}
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1">
            {isFinancial
              ? "Comparativo de Receitas (Vendas) vs Despesas (Compras)"
              : "Comparativo de Entradas Físicas vs Saídas Físicas"}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            barGap={2}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f3f4f6"
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: 600 }}
              dy={10}
              interval="preserveStartEnd"
              minTickGap={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              // Formata eixo Y (Ex: "1k", "R$5k")
              tickFormatter={(value) => {
                if (value === 0) return "0";
                if (isFinancial) return `R$${(value / 1000).toFixed(0)}k`; // R$10k
                return `${value}`;
              }}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />

            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-gray-500 text-xs font-bold uppercase">
                  {value}
                </span>
              )}
            />

            {/* 3. BARRAS DINÂMICAS:
               Se for financeiro, lê 'receita' e 'despesa'.
               Se for estoque, lê 'entradas' e 'saidas'.
            */}
            <Bar
              dataKey={isFinancial ? "receita" : "entradas"}
              name={isFinancial ? "Receita" : "Entradas"}
              fill="#10b981" // Verde
              radius={[4, 4, 0, 0]}
              barSize={12} // Levemente mais larga que o anterior
            />

            <Bar
              dataKey={isFinancial ? "despesa" : "saidas"}
              name={isFinancial ? "Despesa" : "Saídas"}
              fill="#ef4444" // Vermelho
              radius={[4, 4, 0, 0]}
              barSize={12}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
