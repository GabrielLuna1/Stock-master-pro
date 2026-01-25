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

// Interface para tipar os dados que vêm do Pai
interface OverviewChartProps {
  data: any[]; // Array com { name, entradas, saidas }
}

export function OverviewChart({ data }: OverviewChartProps) {
  // Se não tiver dados (ex: carregando ou vazio), mostra skeleton
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

  return (
    <div className="h-[400px] w-full bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Fluxo de Movimentação
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Comparativo de Entradas vs. Saídas (Últimos 30 dias)
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barGap={4} // Espaço entre as barras do mesmo dia
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
              interval="preserveStartEnd" // Evita encavalar datas se tiver muitas
              minTickGap={15}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
            />

            <Tooltip
              cursor={{ fill: "#f9fafb" }}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                padding: "12px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            />

            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
              iconSize={8}
            />

            {/* BARRA DE ENTRADAS (VERDE ESMERALDA) */}
            <Bar
              dataKey="entradas"
              name="Entradas"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              barSize={8} // Barras mais finas e elegantes para caber 30 dias
            />

            {/* BARRA DE SAÍDAS (VERMELHO BRAND) */}
            <Bar
              dataKey="saidas"
              name="Saídas"
              fill="#dc2626"
              radius={[4, 4, 0, 0]}
              barSize={8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
