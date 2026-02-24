"use client";

import { useRef } from "react";
import { X, Printer, ScanLine } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint } from "react-to-print";

interface PrintLabelModalProps {
  product: any;
  onClose: () => void;
}

export default function PrintLabelModal({
  product,
  onClose,
}: PrintLabelModalProps) {
  // Referência para a div que será impressa
  const componentRef = useRef<HTMLDivElement>(null);

  // Hook que controla a janela de impressão do navegador
  const handlePrint = useReactToPrint({
    contentRef: componentRef, // Atualizado para a versão mais recente da biblioteca
    documentTitle: `Etiqueta_${product.sku}`,
  });

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">
              Imprimir <span className="text-red-600">Etiqueta</span>
            </h2>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
              Geração de QR Code Master
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center justify-center bg-gray-100/50">
          {/* Esta é a DIV que será enviada para a impressora. 
            O CSS dela é pensado para alto contraste (Preto e Branco).
          */}
          <div
            ref={componentRef}
            className="bg-white p-4 w-[60mm] h-[40mm] flex flex-col items-center justify-between border-2 border-dashed border-gray-300 shadow-sm print:border-none print:shadow-none"
            style={{ margin: 0, padding: "10px", boxSizing: "border-box" }}
          >
            {/* Nome do Produto (Trunkado para caber) */}
            <h1 className="text-[12px] font-black text-black text-center uppercase leading-tight line-clamp-2 w-full">
              {product.name}
            </h1>

            {/* O QR Code (O valor lido será o ID do produto para dar baixa depois) */}
            <div className="my-1">
              <QRCodeSVG
                value={product._id}
                size={64}
                level={"H"}
                includeMargin={false}
              />
            </div>

            {/* Preço e SKU */}
            <div className="w-full flex justify-between items-end">
              <span className="text-[8px] font-mono text-black font-bold">
                {product.sku}
              </span>
              <span className="text-[14px] font-black text-black">
                R$ {Number(product.price).toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-6 text-center font-medium flex items-center gap-2">
            <ScanLine size={14} /> Pré-visualização no tamanho 60x40mm
          </p>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <button
            onClick={() => handlePrint()}
            className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black rounded-xl shadow-lg transition-all active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center gap-3"
          >
            <Printer size={20} />
            Mandar para Impressora
          </button>
        </div>
      </div>
    </div>
  );
}
