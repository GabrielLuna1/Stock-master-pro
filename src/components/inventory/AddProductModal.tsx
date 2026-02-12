"use client";

import { useState, useEffect, useRef } from "react";
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
  RefreshCw,
  MapPin,
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
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    ean: "",
    category: "",
    supplier: "",
    quantity: "",
    minStock: "15",
    price: "",
    costPrice: "",
    location: "ALMOXARIFADO",
  });

  const generateSku = () => {
    const random = Math.floor(Math.random() * 9000) + 1000;
    setFormData((prev) => ({ ...prev, sku: `MASTER-${random}` }));
  };

  useEffect(() => {
    generateSku();
  }, []);

  const startScanner = async () => {
    setIsScanning(true);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            setFormData((prev) => ({ ...prev, ean: decodedText }));
            stopScanner();
            handleSearchEan(decodedText);
            toast.success("Código capturado!");
          },
          () => {},
        );
      } catch (err) {
        toast.error("Erro ao acessar câmera.");
        setIsScanning(false);
      }
    }, 300);
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // 🔍 BUSCA GRATUITA E DIRETA (Sem necessidade de Token)
  const handleSearchEan = async (eanToSearch?: string) => {
    const code = eanToSearch || formData.ean;

    // Validação básica de tamanho de código EAN
    if (!code || code.length < 8) {
      return toast.warning("Digite um código de barras válido.");
    }

    setSearchingEan(true);
    try {
      // 🌍 Buscando na OpenFoodFacts (Base que pegava a Oreo antes)
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${code}.json`,
      );
      const data = await res.json();

      if (data.status === 1 && data.product) {
        // Prioriza o nome em português para produtos como Oreo e Coca
        const productName =
          data.product.product_name_pt ||
          data.product.product_name ||
          data.product.generic_name;

        setFormData((prev) => ({
          ...prev,
          name: productName.toUpperCase(), // Mantém o padrão Master em caixa alta
          category: prev.category || "GERAL",
        }));

        toast.success("Produto localizado com sucesso!");
      } else {
        toast.info(
          "Produto não encontrado na base gratuita. Digite o nome manualmente.",
        );
        // Foca no nome para você não perder tempo
        setTimeout(() => {
          const input = document.querySelector(
            'input[placeholder*="Coca Cola"]',
          ) as HTMLInputElement;
          input?.focus();
        }, 500);
      }
    } catch (error) {
      // Se der erro de rede, avisa o usuário
      toast.error("Erro ao conectar com o serviço de busca.");
      console.error("Erro na busca EAN:", error);
    } finally {
      setSearchingEan(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
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
      if (!res.ok) throw new Error("Erro ao salvar");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* HEADER VIVID */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">
              Novo Item <span className="text-red-600">Master</span>
            </h2>
            <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-widest">
              Cadastro de Inventário v2.0
            </p>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={28} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {isScanning && (
            <div className="mb-8 bg-black rounded-2xl overflow-hidden relative border-4 border-red-600 shadow-xl">
              <div id="reader" className="w-full"></div>
              <button
                onClick={stopScanner}
                className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full z-20 shadow-lg"
              >
                <X size={20} />
              </button>
            </div>
          )}

          <form
            id="add-product-form"
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* 🔴 SEÇÃO EAN VIVID */}
            <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 space-y-4">
              <h3 className="text-sm font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                <Barcode size={18} /> Código de Barras
              </h3>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Bipe ou digite o código..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-red-200 rounded-xl focus:outline-none focus:border-red-500 font-bold text-gray-900 text-lg shadow-sm"
                    value={formData.ean}
                    onChange={(e) =>
                      setFormData({ ...formData, ean: e.target.value })
                    }
                  />
                  <Barcode
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400"
                    size={22}
                  />
                </div>
                <button
                  type="button"
                  onClick={startScanner}
                  className="bg-red-600 text-white px-6 rounded-xl hover:bg-red-700 shadow-md active:scale-95"
                >
                  <Camera size={26} />
                </button>
                <button
                  type="button"
                  onClick={() => handleSearchEan()}
                  disabled={searchingEan || !formData.ean}
                  className="bg-white border border-red-200 text-red-600 px-6 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center"
                >
                  {searchingEan ? (
                    <Loader2 size={26} className="animate-spin" />
                  ) : (
                    <Search size={26} />
                  )}
                </button>
              </div>
            </div>

            {/* 📦 IDENTIFICAÇÃO VIVID */}
            <div className="space-y-5">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
                <Package size={18} /> Identificação
              </h3>
              <div>
                <label className="block text-sm font-black text-gray-600 uppercase mb-2 ml-1">
                  Nome do Produto *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Coca Cola 350ml (Lata)"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-red-500 outline-none font-bold text-gray-900 text-lg"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-black text-gray-600 uppercase mb-2 ml-1">
                    Categoria *
                  </label>
                  <select
                    required
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-red-500 font-bold text-gray-800 text-base appearance-none cursor-pointer"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    <option value="">Selecione...</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-600 uppercase mb-2 ml-1">
                    Fornecedor
                  </label>
                  <select
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-red-500 font-bold text-gray-800 text-base appearance-none cursor-pointer"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                  >
                    <option value="">Sem vínculo (Próprio)</option>
                    {suppliers.map((sup) => (
                      <option key={sup._id} value={sup._id}>
                        {sup.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 💰 VALORES VIVID */}
            <div className="space-y-5">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
                <DollarSign size={18} /> Financeiro
              </h3>
              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-black text-gray-600 uppercase mb-2 ml-1">
                    Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 text-lg focus:border-red-500 outline-none"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-emerald-600 uppercase mb-2 ml-1">
                    Venda (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-5 py-4 bg-emerald-50/50 border border-emerald-100 rounded-xl font-black text-emerald-700 text-xl focus:border-emerald-500 outline-none"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-600 uppercase mb-2 ml-1 flex items-center gap-1">
                    <MapPin size={14} /> Local
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl font-black text-gray-700 uppercase text-base focus:border-red-500 outline-none"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* 🔢 ESTOQUE VIVID */}
            <div className="grid grid-cols-3 gap-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black text-gray-400 uppercase">
                    SKU Master
                  </label>
                  <button
                    type="button"
                    onClick={generateSku}
                    className="text-red-500 hover:rotate-180 transition-transform"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  className="w-full py-4 bg-white border-2 border-dashed border-gray-200 rounded-xl font-mono text-base text-center font-black text-gray-800"
                  value={formData.sku}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-600 uppercase mb-2 text-center">
                  Quantidade
                </label>
                <input
                  required
                  type="number"
                  className="w-full py-4 bg-gray-100 border-2 border-gray-200 rounded-xl font-black text-center text-2xl text-gray-900"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-black text-red-500 uppercase mb-2 text-center">
                  Mínimo
                </label>
                <input
                  required
                  type="number"
                  className="w-full py-4 bg-red-50 border-2 border-red-100 rounded-xl font-black text-center text-2xl text-red-600"
                  value={formData.minStock}
                  onChange={(e) =>
                    setFormData({ ...formData, minStock: e.target.value })
                  }
                />
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="p-8 border-t border-gray-100 bg-gray-50/50">
          <button
            type="submit"
            form="add-product-form"
            disabled={loading}
            className="w-full py-6 bg-red-600 hover:bg-red-700 text-white font-black rounded-[20px] shadow-2xl transition-all active:scale-[0.97] uppercase tracking-[0.2em] text-lg flex items-center justify-center gap-4"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={28} />
            ) : (
              "Finalizar Cadastro Master"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
