"use client";

import { useState, useEffect } from "react";
import { X, Loader2, ChevronDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "@/providers/DashboardContext";

export default function AddProductModal({ onClose, onRefresh }: any) {
  const { refreshDashboard } = useDashboard();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    sku: "", // Começa vazio e gera no useEffect
    quantity: 0,
    minStock: 15,
    price: "", // Adicionado campo de preço caso queira usar futuramente
  });

  // 1. Carregar Categorias e Gerar SKU
  useEffect(() => {
    // Busca categorias
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        const cats = Array.isArray(data) ? data : [];
        setCategories(cats);
        // Seleciona a primeira categoria por padrão
        if (cats.length > 0) {
          setFormData((prev) => ({ ...prev, category: cats[0].name }));
        } else {
          setFormData((prev) => ({ ...prev, category: "Geral" }));
        }
      })
      .catch((err) => console.error("Erro ao carregar categorias:", err));

    // Gera o SKU inicial
    generateSku();
  }, []);

  // Função para gerar SKU aleatório
  const generateSku = () => {
    const random = Math.floor(Math.random() * 9000) + 1000;
    setFormData((prev) => ({ ...prev, sku: `MASTER-${random}` }));
  };

  // Função genérica de mudança nos inputs
  const handleChange = (e: any) => {
    const { name, value } = e.target;

    // Se for SKU, força maiúsculo e sem espaços
    if (name === "sku") {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase().trim() }));
    }
    // Se forem números
    else if (name === "quantity" || name === "minStock") {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!formData.name || !formData.sku) {
      toast.warning("Nome e SKU são obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        refreshDashboard(); // Atualiza os KPIs
        toast.success("Produto criado com sucesso!");
        onRefresh(); // Atualiza a tabela
        onClose(); // Fecha modal
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
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
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
                name="name"
                className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-red-500/5 focus:border-red-500 outline-none font-bold transition-all text-gray-900"
                placeholder="Ex: Caixa Master de Papelão"
                value={formData.name}
                onChange={handleChange}
                autoFocus
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
                  name="category"
                  className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:border-red-500 outline-none font-bold appearance-none cursor-pointer text-gray-900 uppercase truncate pr-10"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Selecione...</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name.toUpperCase()}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={18}
                />
              </div>
            </div>

            {/* 3. GRID TRIPLO (SKU LIBERADO, QTD, MIN) */}
            <div className="grid grid-cols-3 gap-4">
              {/* SKU AGORA É INPUT */}
              <div className="space-y-2 col-span-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    SKU
                  </label>
                  <button
                    type="button"
                    onClick={generateSku}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Gerar código aleatório"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>

                <input
                  name="sku"
                  className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:border-red-500 outline-none font-black text-xs text-gray-600 uppercase text-center tracking-wider placeholder:text-gray-300"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="CÓDIGO"
                />
              </div>

              <div className="space-y-2 col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Estoque
                </label>
                <input
                  type="number"
                  name="quantity"
                  min="0"
                  className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:border-red-500 outline-none font-bold text-center text-gray-900"
                  value={formData.quantity}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Mínimo
                </label>
                <input
                  type="number"
                  name="minStock"
                  min="1"
                  className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:border-red-500 outline-none font-bold text-center text-red-500"
                  value={formData.minStock}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white font-black py-5 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 mt-4 flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
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
