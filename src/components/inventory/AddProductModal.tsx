"use client";

import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  DollarSign,
  Package,
  Truck,
  Layers,
  Barcode,
  Camera,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

interface AddProductModalProps {
  onClose: () => void;
  onRefresh: () => void;
  categories: any[];
  suppliers: any[];
}

export default function AddProductModal({
  onClose,
  onRefresh,
  categories,
  suppliers,
}: AddProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [searchingEan, setSearchingEan] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    ean: "", // ✨ Campo de Código de Barras
    category: "",
    supplier: "",
    quantity: "",
    minStock: "15",
    price: "",
    costPrice: "",
    location: "ALMOXARIFADO",
  });

  // 1. GERA SKU AUTOMÁTICO
  useEffect(() => {
    const random = Math.floor(Math.random() * 9000) + 1000;
    setFormData((prev) => ({ ...prev, sku: `MASTER-${random}` }));
  }, []);

  // 2. LÓGICA DO SCANNER (CÂMERA)
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (isScanning) {
      html5QrCode = new Html5Qrcode("reader");
      const config = { fps: 10, qrbox: { width: 250, height: 150 } };

      html5QrCode
        .start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            setFormData((prev) => ({ ...prev, ean: decodedText }));
            setIsScanning(false);
            handleSearchEan(decodedText);
            toast.success("Código lido com sucesso!");
          },
          () => {},
        )
        .catch((err) => {
          console.error(err);
          toast.error("Permissão de câmera negada ou erro no dispositivo.");
          setIsScanning(false);
        });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch((e) => console.error(e));
      }
    };
  }, [isScanning]);

  // 3. BUSCA INTELIGENTE DE PRODUTO
  const handleSearchEan = async (eanToSearch?: string) => {
    const code = eanToSearch || formData.ean;
    if (!code || code.length < 8) return;

    setSearchingEan(true);
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${code}.json`,
      );
      const data = await res.json();

      if (data.status === 1) {
        setFormData((prev) => ({
          ...prev,
          name: data.product.product_name || prev.name,
          category: prev.category || "Geral",
        }));
        toast.success("Dados importados da base pública!");
      } else {
        toast.info("Produto não encontrado na base externa, mas código salvo.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSearchingEan(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
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

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }

      toast.success("Produto cadastrado!");
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
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
              NOVO ITEM <span className="text-red-600">MASTER</span>
            </h2>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
              Cadastro de Inventário v2.0
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* 📷 SCANNER CONTAINER (Apenas quando ativo) */}
          {isScanning && (
            <div className="mb-6 bg-black rounded-2xl overflow-hidden relative border-4 border-red-600 shadow-xl min-h-[250px]">
              <div id="reader" className="w-full"></div>
              <button
                onClick={() => setIsScanning(false)}
                className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full z-20"
              >
                <X size={20} />
              </button>
            </div>
          )}

          <form
            id="add-product-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* 🔴 SEÇÃO CÓDIGO DE BARRAS (DEVE APARECER AQUI!) */}
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-3">
              <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                <Barcode size={14} /> Identificação EAN
              </h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Escaneie ou digite o EAN..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-red-200 rounded-xl focus:outline-none focus:border-red-500 font-bold text-gray-900 text-sm"
                    value={formData.ean}
                    onChange={(e) =>
                      setFormData({ ...formData, ean: e.target.value })
                    }
                  />
                  <Barcode
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400"
                    size={18}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsScanning(true)}
                  className="bg-red-600 text-white p-3 rounded-xl hover:bg-red-700 active:scale-95 transition-all shadow-md shadow-red-200"
                >
                  <Camera size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => handleSearchEan()}
                  disabled={searchingEan || !formData.ean}
                  className="bg-white border border-red-200 text-red-600 p-3 rounded-xl disabled:opacity-50"
                >
                  {searchingEan ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Search size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* 📦 DADOS BÁSICOS */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
                <Package size={14} /> Descrição do Produto
              </h3>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Nome Completo *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Coca Cola 350ml (Lata)"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-bold text-gray-900 text-sm"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Categoria *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm font-medium text-gray-700"
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
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Fornecedor
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-sm font-medium text-gray-700"
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

            {/* 💰 VALORES E ESTOQUE */}
            <div className="space-y-4 pt-2">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
                <DollarSign size={14} /> Financeiro & Inventário
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
                    placeholder="0,00"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-medium text-gray-900 text-sm"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                    SKU Master
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-mono text-gray-400"
                    value={formData.sku}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1 text-center">
                    Qtd Inicial
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-black text-gray-900 text-center"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1 text-center">
                    Mínimo
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-black text-red-500 text-center"
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

        {/* BOTÃO CONFIRMAR */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <button
            type="submit"
            form="add-product-form"
            disabled={loading}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 uppercase tracking-widest text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Confirmar Cadastro"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
