"use client";

import { useState, useEffect, useRef } from "react";
import { 
  X, Loader2, DollarSign, Package, Truck, Layers, 
  Barcode, Camera, Search, RefreshCw, MapPin 
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
            setFormData(prev => ({ ...prev, ean: decodedText }));
            stopScanner();
            handleSearchEan(decodedText);
            toast.success("Código capturado!");
          },
          () => {}
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

  const handleSearchEan = async (eanToSearch?: string) => {
    const code = eanToSearch || formData.ean;
    if (!code || code.length < 8) {
        return toast.warning("Digite um código válido.");
    }
    setSearchingEan(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const data = await res.json();

      if (data.status === 1 && data.product) {
        const productName = data.product.product_name_pt || data.product.product_name || data.product.generic_name;
        setFormData(prev => ({
          ...prev,
          name: productName.toUpperCase(),
          category: prev.category || "GERAL",
        }));
        toast.success("Produto identificado!");
      } else {
        toast.info("Não encontrado na base global.");
      }
    } catch (error) {
      toast.error("Erro na busca.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white rounded-[20px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">
              Novo Item <span className="text-red-600">Master</span>
            </h2>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
              Cadastro v2.0
            </p>
          </div>
          <button onClick={() => { stopScanner(); onClose(); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {isScanning && (
            <div className="mb-6 bg-black rounded-2xl overflow-hidden relative border-4 border-red-600 shadow-xl">
              <div id="reader" className="w-full"></div>
              <button onClick={stopScanner} className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full z-20">
                <X size={20} />
              </button>
            </div>
          )}

          <form id="add-product-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* 🔴 SEÇÃO EAN (Corrigida para Mobile) */}
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-3">
              <label className="text-[11px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                <Barcode size={14} /> Código de Barras
              </label>
              
              {/* Flex Container que não quebra linha */}
              <div className="flex items-stretch gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Bipe ou digite..."
                    className="w-full pl-9 pr-3 py-3 bg-white border border-red-200 rounded-lg focus:outline-none focus:border-red-500 font-bold text-gray-900 text-sm h-full"
                    value={formData.ean}
                    onChange={(e) => setFormData({ ...formData, ean: e.target.value })}
                  />
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" size={16} />
                </div>
                
                {/* Botões compactos */}
                <button type="button" onClick={startScanner} className="bg-red-600 text-white px-4 rounded-lg hover:bg-red-700 shadow-sm active:scale-95 flex items-center justify-center">
                  <Camera size={20} />
                </button>
                <button 
                    type="button" 
                    onClick={() => handleSearchEan()} 
                    disabled={searchingEan || !formData.ean} 
                    className="bg-white border border-red-200 text-red-600 px-4 rounded-lg hover:bg-red-50 transition-all flex items-center justify-center"
                >
                  {searchingEan ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </button>
              </div>
            </div>

            {/* 📦 IDENTIFICAÇÃO */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
                <Package size={14} /> Identificação
              </h3>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Descrição do Produto *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Coca Cola 350ml (Lata)"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-red-500 outline-none font-bold text-gray-900 text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Categoria *</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-red-500 font-bold text-gray-700 text-xs appearance-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>{cat.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Fornecedor</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-red-500 font-bold text-gray-700 text-xs appearance-none"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  >
                    <option value="">Sem vínculo (Próprio)</option>
                    {suppliers.map((sup) => (
                      <option key={sup._id} value={sup._id}>{sup.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 💰 FINANCEIRO */}
            <div className="space-y-4 pt-2">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
                <DollarSign size={14} /> Financeiro
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Custo</label>
                  <input
                    type="number" step="0.01" placeholder="0.00"
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 text-sm focus:border-red-500 outline-none"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1 ml-1">Venda</label>
                  <input
                    type="number" step="0.01" placeholder="0.00"
                    className="w-full px-3 py-3 bg-emerald-50/50 border border-emerald-100 rounded-xl font-black text-emerald-700 text-sm focus:border-emerald-500 outline-none"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 ml-1 flex items-center gap-1">
                    <MapPin size={10} /> Local
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-gray-700 uppercase text-xs focus:border-red-500 outline-none"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            </div>

            {/* 🔢 ESTOQUE */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase">SKU</label>
                  <button type="button" onClick={generateSku} className="text-red-500 hover:rotate-180 transition-transform">
                    <RefreshCw size={10} />
                  </button>
                </div>
                <input
                  type="text"
                  className="w-full py-3 bg-white border border-dashed border-gray-300 rounded-xl font-mono text-xs text-center font-bold text-gray-500"
                  value={formData.sku}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-600 uppercase mb-1 text-center">Qtd</label>
                <input
                  required type="number"
                  className="w-full py-3 bg-gray-100 border border-gray-200 rounded-xl font-black text-center text-lg text-gray-900"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-red-500 uppercase mb-1 text-center">Mínimo</label>
                <input
                  required type="number"
                  className="w-full py-3 bg-red-50 border border-red-100 rounded-xl font-black text-center text-lg text-red-600"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                />
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <button
            type="submit"
            form="add-product-form"
            disabled={loading}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg transition-all active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Confirmar Cadastro Master"}
          </button>
        </div>
      </div>
    </div>
  );
}