"use client";

import { useState, useEffect } from "react";
import { X, Loader2, ChevronDown, Info } from "lucide-react";

export default function EditProductModal({
  product,
  onClose,
  onRefresh,
}: {
  product: any;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: product.name,
    sku: product.sku,
    quantity: product.quantity,
    category: product.category,
    minStock: product.minStock || 15,
    location: product.location || "", // Adicionei caso queira salvar localização
    price: product.price || 0, // Adicionei caso queira salvar preço
    status: product.status || "ESTÁVEL",
  });

  // Busca categorias
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Erro ao carregar categorias:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 🛡️ A CORREÇÃO: Pegamos o ID de forma segura
    const id = product._id || product.id;

    if (!id) {
      alert("Erro: Produto sem ID.");
      setLoading(false);
      return;
    }

    try {
      // 🛣️ A ROTA EXPRESSA: Usamos 'manage-product' para evitar o erro 404 da pasta
      const res = await fetch(`/api/manage-product?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        const err = await res.json();
        alert("Erro ao salvar: " + err.error);
      }
    } catch (err) {
      console.error("Erro na atualização:", err);
      alert("Erro de conexão.");
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
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                Editar Item <span className="text-brand-red">Master</span>
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-1">
                <Info size={10} /> SKU: {product.sku}
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
                className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none font-bold transition-all text-gray-900"
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
                  className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:border-brand-red outline-none font-bold appearance-none cursor-pointer text-gray-900 uppercase truncate pr-10"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="">Selecione...</option>
                  {categories.length === 0 ? (
                    <option disabled>Carregando...</option>
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
                <div className="p-4 bg-gray-100 border border-gray-100 rounded-2xl font-mono text-xs text-gray-500 flex items-center justify-center italic">
                  {formData.sku}
                </div>
              </div>

              <div className="space-y-2 col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Estoque
                </label>
                <input
                  type="number"
                  className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:border-brand-red outline-none font-bold text-center text-gray-900"
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
                  className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:border-brand-red outline-none font-bold text-center text-brand-red"
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
              className="w-full bg-brand-red text-white font-black py-5 rounded-2xl hover:bg-brand-dark-red transition-all shadow-xl shadow-red-100 mt-4 flex justify-center items-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                "SALVAR ALTERAÇÕES"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
