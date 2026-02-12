import { useState } from "react";
import { X, Loader2, DollarSign, Package, Truck, Layers } from "lucide-react";
import { toast } from "sonner";

interface AddProductModalProps {
  onClose: () => void;
  onRefresh: () => void;
  categories: any[]; // Recebe categorias do pai
  suppliers: any[]; // Recebe fornecedores do pai
}

export default function AddProductModal({
  onClose,
  onRefresh,
  categories,
  suppliers,
}: AddProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "", // Vai guardar o Nome ou ID
    supplier: "", // Vai guardar o ID do fornecedor
    quantity: "",
    minStock: "15",
    price: "", // Preço de Venda
    costPrice: "", // Preço de Custo
    location: "ALMOXARIFADO",
  });

  // Gera SKU ao abrir, se estiver vazio
  useState(() => {
    const random = Math.floor(Math.random() * 9000) + 1000;
    setFormData((prev) => ({ ...prev, sku: `MASTER-${random}` }));
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações básicas
      if (!formData.category) return toast.warning("Selecione uma categoria.");

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity),
          minStock: Number(formData.minStock),
          price: Number(formData.price),
          costPrice: Number(formData.costPrice),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao criar produto");

      toast.success("Produto adicionado com sucesso!");
      onRefresh();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
              NOVO ITEM <span className="text-red-600">MASTER</span>
            </h2>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
              Cadastro de Inventário
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* FORM COM SCROLL */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <form
            id="add-product-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* 1. DADOS BÁSICOS */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                <Package size={14} /> Identificação
              </h3>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Nome do Produto *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Caixa Master de Papelão"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-bold text-gray-900 text-sm"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Layers size={10} /> Categoria *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all text-sm font-medium text-gray-700 appearance-none"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    <option value="">Selecione...</option>
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all text-sm font-medium text-gray-700 appearance-none"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                  >
                    <option value="">Sem vínculo (Próprio)</option>
                    {suppliers.map((sup) => (
                      <option key={sup._id} value={sup._id}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. DADOS FINANCEIROS & ESTOQUE */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                <DollarSign size={14} /> Valores & Estoque
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
                    placeholder="0,00"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all font-medium text-gray-900 text-sm"
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
                    placeholder="0,00"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all font-medium text-gray-900 text-sm"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    SKU (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Gerado Auto"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all font-mono text-xs text-gray-600"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Qtd Inicial
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all font-bold text-gray-900 text-center"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Mínimo
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all font-bold text-gray-900 text-center"
                    value={formData.minStock}
                    onChange={(e) =>
                      setFormData({ ...formData, minStock: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER FIXO */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <button
            type="submit"
            form="add-product-form"
            disabled={loading}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 uppercase tracking-wide text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Confirmar Entrada"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
