"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Package, Layers, Truck, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface EditProductModalProps {
  product: any;
  onClose: () => void;
  onRefresh: () => void;
  categories: any[]; // ✨ Agora aceita categorias
  suppliers: any[]; // ✨ Agora aceita fornecedores
}

export default function EditProductModal({
  product,
  onClose,
  onRefresh,
  categories,
  suppliers,
}: EditProductModalProps) {
  const [loading, setLoading] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    supplier: "",
    minStock: "",
    price: "",
    costPrice: "",
    location: "",
  });

  // Preenche os dados quando o produto muda (ao abrir o modal)
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        category: product.category || "",
        // Lógica inteligente: Se o supplier vier populado (objeto), pega o _id. Se vier só ID (string), usa direto.
        supplier:
          typeof product.supplier === "object" && product.supplier !== null
            ? product.supplier._id
            : product.supplier || "",

        // Pega minStock (antigo) ou minQuantity (novo)
        minStock: String(product.minStock || product.minQuantity || "15"),

        price: String(product.price || "0"),
        costPrice: String(product.costPrice || "0"),
        location: product.location || "",
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: product._id, // Importante enviar o ID para saber quem atualizar
          ...formData,
          minStock: Number(formData.minStock),
          price: Number(formData.price),
          costPrice: Number(formData.costPrice),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar");

      toast.success("Produto atualizado com sucesso!");
      onRefresh();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
              EDITAR ITEM <span className="text-red-600">MASTER</span>
            </h2>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
              SKU: {product.sku}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* FORMULÁRIO COM SCROLL */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <form
            id="edit-product-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* 1. DADOS GERAIS */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                <Package size={14} /> Dados Gerais
              </h3>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Nome do Produto
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-bold text-gray-900 text-sm"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Layers size={10} /> Categoria
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm font-medium text-gray-700 appearance-none"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    <option value="">Selecione...</option>
                    {/* Mapeia as categorias recebidas via PROPS */}
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Truck size={10} /> Fornecedor
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm font-medium text-gray-700 appearance-none"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                  >
                    <option value="">Sem vínculo (Próprio)</option>
                    {/* Mapeia os fornecedores recebidos via PROPS */}
                    {suppliers.map((sup) => (
                      <option key={sup._id} value={sup._id}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. FINANCEIRO & CONFIG */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                <DollarSign size={14} /> Ajustes & Valores
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-medium text-gray-900 text-sm"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Venda (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-medium text-gray-900 text-sm"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-bold text-gray-900 text-center"
                    value={formData.minStock}
                    onChange={(e) =>
                      setFormData({ ...formData, minStock: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Localização
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Corredor A"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-medium text-gray-700 text-center"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <button
            type="submit"
            form="edit-product-form"
            disabled={loading}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 uppercase tracking-wide text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Salvar Alterações"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
