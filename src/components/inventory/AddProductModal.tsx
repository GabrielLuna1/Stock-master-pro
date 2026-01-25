"use client";

import { useState, useEffect } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
// 👇 1. Imports essenciais para reatividade e feedback
import { toast } from "sonner";
import { useDashboard } from "@/providers/DashboardContext";

export default function AddProductModal({ onClose, onRefresh }: any) {
  // 👇 2. Pegamos a função mágica do contexto
  const { refreshDashboard } = useDashboard();

  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    sku: `MASTER-${Math.floor(1000 + Math.random() * 9000)}`,
    quantity: 0,
    minStock: 15,
  });
  const [loading, setLoading] = useState(false);

  // 🔄 1. BUSCAR CATEGORIAS REAIS DO BANCO
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        const cats = Array.isArray(data) ? data : [];
        setCategories(cats);
        // Se houver categorias, seleciona a primeira automaticamente
        if (cats.length > 0) {
          setFormData((prev) => ({ ...prev, category: cats[0].name }));
        } else {
          // Fallback se não tiver categorias cadastradas
          setFormData((prev) => ({ ...prev, category: "Geral" }));
        }
      })
      .catch((err) => console.error("Erro ao carregar categorias:", err));
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // 👇 3. AQUI ESTÁ A MÁGICA!
        // Avisa todo o sistema que os números mudaram
        refreshDashboard();

        toast.success("Produto criado com sucesso!");
        onRefresh(); // Atualiza a tabela local
        onClose(); // Fecha o modal
      } else {
        toast.error(data.error || "Erro ao criar produto.");
      }
    } catch (err) {
      toast.error("Erro de comunicação com o servidor.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10">
          <header className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                Novo Item <span className="text-red-600">Master</span>
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
                StockMaster System v1.0
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. NOME */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Descrição do Produto
              </label>
              <input
                className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-red-500/5 focus:border-red-500 outline-none font-bold transition-all text-gray-900"
                placeholder="Ex: Caixa Master de Papelão"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {/* 2. CATEGORIA */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Categoria
              </label>
              <div className="relative">
                <select
                  className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:border-red-500 outline-none font-bold appearance-none cursor-pointer text-gray-900 uppercase truncate pr-10"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  {categories.length === 0 ? (
                    <option value="Geral">GERAL (PADRÃO)</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name.toUpperCase()}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={18}
                />
              </div>
            </div>

            {/* 3. GRID TRIPLO (SKU, QTD, MIN) */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  SKU
                </label>
                <div className="p-4 bg-gray-100 border border-gray-100 rounded-2xl font-mono text-xs text-gray-500 flex items-center justify-center italic truncate">
                  {formData.sku}
                </div>
              </div>

              <div className="space-y-2 col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Estoque
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:border-red-500 outline-none font-bold text-center text-gray-900"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2 col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Mínimo
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:border-red-500 outline-none font-bold text-center text-red-500"
                  value={formData.minStock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minStock: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white font-black py-5 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 mt-4 flex justify-center items-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                "CONFIRMAR ENTRADA"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
