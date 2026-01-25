"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
}

// Função para resumir números (Ex: 224332 -> 224.3K) ✅
const formatNumber = (num: string | number) => {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(n) || n < 1000) return num; // Retorna normal se não for número ou for pequeno
  
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  }
  
  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  }
  
  return n;
};

export default function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div 
     className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 duration-300 cursor-default"
     title={value.toLocaleString()}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          {/* Aplicamos a formatação aqui ✅ */}
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{formatNumber(value)}</h3>
          {trend && (
            <p className={`text-xs font-bold mt-2 ${trend.includes('OK') ? 'text-green-600' : 'text-brand-red'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className="p-3 bg-brand-gray rounded-full">
          <Icon className="w-6 h-6 text-brand-red" />
        </div>
      </div>
    </div>
  );
}