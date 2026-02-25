"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Loader2, FileSpreadsheet } from "lucide-react";
import Papa from "papaparse";

export default function ImportCSVButton() {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verifica se é CSV mesmo
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast.error("Por favor, selecione um arquivo .csv válido.");
      return;
    }

    setIsImporting(true);
    toast.info("Lendo arquivo CSV...");

    // O PapaParse lê o arquivo direto no navegador
    Papa.parse(file, {
      header: true, // Diz que a primeira linha tem os nomes das colunas
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Formata os dados para o padrão do nosso Banco de Dados
          const formattedProducts = results.data.map((row: any) => ({
            name: row.Nome || row.name,
            sku: row.SKU || row.sku,
            category: row.Categoria || row.category || "Geral",
            quantity: Number(row.Quantidade || row.quantity) || 0,
            costPrice: Number(row.Custo || row.costPrice) || 0,
            price: Number(row.Preço || row.price) || 0,
            minQuantity: Number(row.EstoqueMinimo || row.minQuantity) || 5,
            location: row.Localizacao || row.location || "Armazém Principal",
          }));

          // Envia para a nossa nova API
          const res = await fetch("/api/products/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ products: formattedProducts }),
          });

          const data = await res.json();

          if (!res.ok) throw new Error(data.error);

          toast.success(data.message);
          router.refresh(); // Atualiza a tabela de produtos na tela
        } catch (error: any) {
          toast.error(error.message || "Erro ao processar o arquivo.");
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = ""; // Limpa o input
        }
      },
      error: (error) => {
        toast.error(`Erro ao ler o arquivo: ${error.message}`);
        setIsImporting(false);
      },
    });
  };

  return (
    <>
      {/* Input invisível que o botão vai "clicar" */}
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
        className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-70"
      >
        {isImporting ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <FileSpreadsheet size={18} />
        )}
        <span className="hidden sm:inline">
          {isImporting ? "Importando..." : "Importar CSV"}
        </span>
      </button>
    </>
  );
}
