"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import {
  Package,
  Minus,
  Plus,
  Check,
  X,
  Camera as CameraIcon,
  Loader2,
  Zap,
  Barcode,
  ArrowRight,
} from "lucide-react";

export default function FastCheckoutPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Estados do Scanner
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Estados da Operação
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [removeQuantity, setRemoveQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error("Erro ao carregar banco de dados.");
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchProducts();
  }, []);

  const startScanner = async () => {
    setIsScanning(true);
    setScannedProduct(null);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("reader-saida");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            stopScanner();
            handleProductScanned(decodedText);
          },
          () => {},
        );
      } catch (err) {
        toast.error("Não foi possível acessar a câmera.");
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

  const handleProductScanned = (idString: string) => {
    const found = products.find((p) => p._id === idString);
    if (found) {
      setScannedProduct(found);
      setRemoveQuantity(1);
      navigator.vibrate?.(200);
    } else {
      toast.error("QR Code não reconhecido no sistema.");
      setTimeout(startScanner, 2000);
    }
  };

  const handleConfirmCheckout = async () => {
    if (!scannedProduct) return;
    if (scannedProduct.quantity < removeQuantity) {
      return toast.warning("Estoque insuficiente para esta saída!");
    }

    setIsProcessing(true);
    try {
      // 1. Montamos o payload EXATAMENTE como o Modal de Edição faz
      const payload = {
        _id: scannedProduct._id,
        name: scannedProduct.name,
        sku: scannedProduct.sku || "",
        ean: scannedProduct.ean || "",
        category: scannedProduct.category || "GERAL",
        location: scannedProduct.location || "ALMOXARIFADO",
        quantity: Number(scannedProduct.quantity) - removeQuantity, // A mágica da baixa aqui
        minStock: Number(scannedProduct.minStock || 0),
        price: Number(scannedProduct.price || 0),
        costPrice: Number(scannedProduct.costPrice || 0),
        // Tratamento do supplier para não enviar objeto inteiro
        supplier:
          scannedProduct.supplier?._id || scannedProduct.supplier || null,
      };

      console.log("🚀 Enviando baixa de estoque:", payload);

      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Erro na API:", errorText);
        throw new Error(errorText || "Erro ao atualizar banco de dados.");
      }

      // SUCESSO!
      toast.success(
        `${removeQuantity}x ${scannedProduct.name} retirado com sucesso!`,
      );

      // Atualiza a lista local para o próximo scan já vir com o número novo
      setProducts((prev) =>
        prev.map((p) =>
          p._id === scannedProduct._id
            ? { ...p, quantity: payload.quantity }
            : p,
        ),
      );

      setScannedProduct(null); // Fecha o card do produto
      // Se não estiver no PC (onde o scanner não liga), volta a escanear
      if (isScanning) startScanner();
    } catch (error: any) {
      console.error("Erro no checkout:", error);
      toast.error(error.message || "Falha ao registrar saída.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <Loader2 className="animate-spin text-red-600" size={48} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-12 min-h-screen flex flex-col relative pb-24">
      {/* HEADER PADRÃO STOCKMASTER */}
      <header className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl text-yellow-500 bg-yellow-50 shadow-sm border border-yellow-100">
          <Zap size={28} className="fill-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">
            Saída <span className="text-red-600">Expressa</span>
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            Leitura Rápida de QR Code
          </p>
        </div>
      </header>

      {/* ÁREA PRINCIPAL CENTRALIZADA */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
        {/* CARD DO SCANNER */}
        {!scannedProduct && (
          <div className="w-full bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 flex flex-col items-center text-center border-b border-gray-50">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">
                Modo de Operação Contínua
              </h2>
              <p className="text-sm font-medium text-gray-500 mt-2">
                Aponte a câmera para a etiqueta gerada pelo sistema para dar
                baixa automática.
              </p>
            </div>

            <div className="p-8 bg-gray-50/50 flex flex-col items-center justify-center min-h-[350px] relative">
              {isScanning ? (
                <div className="w-full max-w-sm rounded-2xl overflow-hidden border-4 border-red-600 shadow-xl relative bg-black aspect-square">
                  <div
                    id="reader-saida"
                    className="w-full h-full object-cover"
                  ></div>
                  {/* Mira do Scanner */}
                  <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-red-500 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                      <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl-lg"></div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr-lg"></div>
                      <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl-lg"></div>
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br-lg"></div>
                    </div>
                  </div>
                  <button
                    onClick={stopScanner}
                    className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full z-20 shadow-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                  <button
                    onClick={startScanner}
                    className="group flex flex-col items-center justify-center gap-4 w-full aspect-square bg-white border-2 border-dashed border-gray-300 rounded-3xl hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <div className="bg-red-100 p-6 rounded-full text-red-600 group-hover:scale-110 transition-transform shadow-inner">
                      <Barcode size={48} />
                    </div>
                    <span className="font-black text-gray-600 uppercase tracking-widest text-sm group-hover:text-red-600">
                      Ativar Leitor
                    </span>
                  </button>

                  {/* 👇 BOTÃO NINJA DE TESTE (Puxa o Produto 1 automaticamente) 👇 
                  {products.length > 0 && (
                    <button
                      onClick={() => handleProductScanned(products[0]._id)}
                      className="mt-2 text-[10px] font-bold text-gray-400 underline hover:text-red-500"
                    >
                      Simular Leitura do 1º Produto (DEV)
                    </button>
                  )}*/}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CARD DO PRODUTO ESCANEADO (Estilo Vivid) */}
        {scannedProduct && (
          <div className="w-full bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/30">
              <div className="flex items-center gap-4">
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100">
                  <Package size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 leading-none uppercase tracking-tight">
                    {scannedProduct.name}
                  </h2>
                  <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-widest font-mono">
                    SKU: {scannedProduct.sku}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setScannedProduct(null);
                  startScanner();
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-red-500"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-center justify-between bg-gray-50 border border-gray-100 p-5 rounded-2xl mb-8">
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                  Estoque Disponível
                </span>
                <span className="text-2xl font-black text-gray-900">
                  {scannedProduct.quantity} un
                </span>
              </div>

              {/* CONTROLE DE QUANTIDADE VIVID */}
              <div className="mb-8">
                <label className="block text-center text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
                  Confirmar Retirada
                </label>
                <div className="flex items-center justify-center gap-6 bg-gray-50 py-6 rounded-3xl border border-gray-100">
                  <button
                    onClick={() =>
                      setRemoveQuantity(Math.max(1, removeQuantity - 1))
                    }
                    className="w-16 h-16 bg-white border border-gray-200 shadow-sm rounded-2xl flex items-center justify-center text-red-600 hover:border-red-500 hover:bg-red-50 active:scale-90 transition-all"
                  >
                    <Minus size={32} />
                  </button>
                  <span className="text-6xl font-black text-gray-900 w-24 text-center">
                    {removeQuantity}
                  </span>
                  <button
                    onClick={() =>
                      setRemoveQuantity(
                        Math.min(scannedProduct.quantity, removeQuantity + 1),
                      )
                    }
                    className="w-16 h-16 bg-white border border-gray-200 shadow-sm rounded-2xl flex items-center justify-center text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 active:scale-90 transition-all"
                  >
                    <Plus size={32} />
                  </button>
                </div>
              </div>
            </div>

            {/* BOTÃO CONFIRMAR GIGANTE */}
            <div className="p-8 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={handleConfirmCheckout}
                disabled={isProcessing}
                className="w-full py-6 bg-red-600 hover:bg-red-700 text-white font-black rounded-[20px] shadow-2xl transition-all active:scale-[0.97] uppercase tracking-[0.2em] text-lg flex items-center justify-center gap-4 disabled:opacity-70"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={28} />
                ) : (
                  <>
                    Registrar Saída <ArrowRight size={24} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
