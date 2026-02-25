"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  FileText,
  Filter,
  Loader2,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  History,
  CheckSquare,
  Square,
  X,
  Truck,
  Printer, // ✨ 1. ÍCONE DE IMPRESSORA ADICIONADO
} from "lucide-react";

// Componentes
import EditProductModal from "../../components/inventory/EditProductModal";
import DeleteConfirmModal from "../../components/inventory/DeleteConfirmModal";
import AddProductModal from "../../components/inventory/AddProductModal";
import HistoryModal from "../../components/inventory/HistoryModal";
import BatchDeleteModal from "../../components/inventory/BatchDeleteModal";
import PrintLabelModal from "../../components/inventory/PrintLabelModal"; // ✨ 2. MODAL IMPORTADO
import { DataDisplay } from "@/components/ui/DataDisplay";
import ImportCSVButton from "@/components/inventory/ImportCSVButton";

// Libs
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { useDashboard } from "@/providers/DashboardContext";

export default function InventoryPage() {
  const { data: session } = useSession();
  const { refreshDashboard } = useDashboard();

  // Estados de Dados
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "STABLE" | "CRITICAL"
  >("ALL");

  const [productToPrint, setProductToPrint] = useState<any>(null); // ✨ Já estava aqui, show!

  // Estado de Seleção em Massa
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Estados dos Modais
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);

  // Estado da Linha do Tempo
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyMovements, setHistoryMovements] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 1. Carregar Dados Iniciais
  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, supRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/suppliers", { cache: "no-store" }),
      ]);

      const prods = await prodRes.json();
      const cats = await catRes.json();
      const sups = await supRes.json();

      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setSuppliers(Array.isArray(sups) ? sups : []);

      setSelectedIds([]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar estoque.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Resetar página ao filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, filterStatus]);

  const getCategoryColor = (categoryName: string) => {
    if (!categoryName) return "#94a3b8";
    const found = categories.find(
      (c) =>
        c.name.toString().trim().toLowerCase() ===
        categoryName.toString().trim().toLowerCase(),
    );
    return found ? found.color : "#94a3b8";
  };

  // --- LÓGICA DE FILTRAGEM ---
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const productCat = p.category
      ? p.category.toString().trim().toLowerCase()
      : "";
    const selectedCat = selectedCategory.toString().trim().toLowerCase();
    const matchesCategory =
      selectedCategory === "TODAS" || productCat === selectedCat;

    const minQty = Number(p.minStock || p.minQuantity || 15);
    let matchesStatus = true;

    if (filterStatus === "CRITICAL")
      matchesStatus = Number(p.quantity) <= minQty;
    else if (filterStatus === "STABLE")
      matchesStatus = Number(p.quantity) > minQty;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Paginação
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // --- AÇÕES DE MASSA ---
  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const executeBatchDelete = async () => {
    setIsBatchDeleting(true);
    try {
      const res = await fetch("/api/products/batch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (res.ok) {
        toast.success(`${selectedIds.length} produtos excluídos!`);
        await refreshDashboard();
        fetchData();
        setIsBatchModalOpen(false);
        setSelectedIds([]);
      } else {
        toast.error("Erro ao excluir itens.");
      }
    } catch (error) {
      toast.error("Erro de comunicação.");
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // --- AÇÕES INDIVIDUAIS ---
  const handleDeleteRequest = (product: any) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        const res = await fetch(
          `/api/manage-product?id=${productToDelete._id || productToDelete.id}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          toast.success("Produto excluído.");
          await refreshDashboard();
          fetchData();
          setIsDeleteModalOpen(false);
        }
      } catch (error) {
        toast.error("Erro ao excluir.");
      }
    }
  };

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleHistory = async (product: any) => {
    setSelectedProduct(product);
    setHistoryMovements([]);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/movements", { cache: "no-store" });
      const data = await res.json();
      const allMovements = Array.isArray(data) ? data : data.data || [];
      const filtered = allMovements.filter(
        (m: any) => m.productId === product._id || m.productId === product.id,
      );
      filtered.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setHistoryMovements(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 💎 EXPORTAÇÃO PREMIUM
  const exportToPDF = () => {
    const doc = new jsPDF();
    const brandRed: [number, number, number] = [220, 38, 38];
    const brandDark: [number, number, number] = [17, 24, 39];
    const brandGray: [number, number, number] = [107, 114, 128];

    doc.setFillColor(...brandRed);
    doc.roundedRect(14, 15, 12, 12, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("S", 17.5, 22.5);

    doc.setTextColor(...brandDark);
    doc.setFontSize(16);
    doc.text("STOCK", 30, 23);
    doc.setTextColor(...brandRed);
    doc.text("MASTER", 51, 23);

    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(10);
    doc.setTextColor(...brandDark);
    doc.setFont("helvetica", "normal");
    doc.text("RELATÓRIO DE INVENTÁRIO FÍSICO", pageWidth - 14, 20, {
      align: "right",
    });

    doc.setFontSize(8);
    doc.setTextColor(...brandGray);
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString()}`,
      pageWidth - 14,
      25,
      { align: "right" },
    );

    const tableData = filteredProducts.map((p) => [
      p.sku.toUpperCase(),
      p.name,
      p.category || "Geral",
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(p.price || 0),
      p.quantity,
      Number(p.quantity) <= Number(p.minStock || 15) ? "BAIXO" : "OK",
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["SKU", "PRODUTO", "CATEGORIA", "PREÇO UN.", "QTD", "STATUS"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: brandRed,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold" },
        4: { halign: "center", fontStyle: "bold" },
      },
    });

    doc.save(`inventario_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const countCritical = products.filter(
    (p) => Number(p.quantity) <= Number(p.minStock || 15),
  ).length;
  const countStable = products.length - countCritical;

  const getSupplierName = (supplierVal: any) => {
    if (!supplierVal)
      return <span className="text-gray-300 text-[10px]">-</span>;

    if (typeof supplierVal === "object" && supplierVal.name) {
      return supplierVal.name;
    }

    if (Array.isArray(suppliers)) {
      const found = suppliers.find((s) => s._id === supplierVal);
      if (found) return found.name;
    }

    return <span className="text-gray-300 text-[10px]">N/A</span>;
  };

  // 👇 CONFIGURAÇÃO DAS COLUNAS PARA O DataDisplay
  const columns = [
    {
      header: "Select",
      accessorKey: "_id" as keyof any,
      cell: (item: any) => {
        const isSelected = selectedIds.includes(item._id);
        return (
          <button
            onClick={() => handleSelectOne(item._id)}
            className="hover:text-red-500"
          >
            {isSelected ? (
              <CheckSquare size={18} className="text-red-600" />
            ) : (
              <Square size={18} />
            )}
          </button>
        );
      },
    },
    {
      header: "SKU",
      accessorKey: "sku" as keyof any,
      cell: (item: any) => (
        <span className="font-bold text-gray-400 font-mono text-xs">
          {item.sku}
        </span>
      ),
    },
    {
      header: "Produto",
      accessorKey: "name" as keyof any,
      cell: (item: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 text-sm">{item.name}</span>
          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-0.5">
            <Truck size={10} />
            {getSupplierName(item.supplier)}
          </div>
        </div>
      ),
    },
    {
      header: "Categoria",
      accessorKey: "category" as keyof any,
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getCategoryColor(item.category) }}
          />
          <span className="text-[10px] font-black text-gray-500 uppercase">
            {item.category}
          </span>
        </div>
      ),
    },
    {
      header: "Custo",
      accessorKey: "costPrice" as keyof any,
      cell: (item: any) => (
        <div className="text-xs font-medium text-gray-400">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(item.costPrice || 0)}
        </div>
      ),
    },
    {
      header: "Venda",
      accessorKey: "price" as keyof any,
      cell: (item: any) => (
        <div className="font-bold text-sm text-emerald-700">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(item.price || 0)}
        </div>
      ),
    },
    {
      header: "Qtd",
      accessorKey: "quantity" as keyof any,
      cell: (item: any) => {
        const isLow = Number(item.quantity) <= Number(item.minStock || 15);
        return (
          <div className="flex flex-col">
            <span
              className={`font-black text-sm ${isLow ? "text-red-600" : "text-gray-800"}`}
            >
              {item.quantity} un
            </span>
            {isLow && (
              <span className="text-[9px] font-bold text-red-500 flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded w-fit mt-1">
                <AlertTriangle size={8} /> REPOSIÇÃO
              </span>
            )}
          </div>
        );
      },
    },
    // ✨ 3. COLUNA DE ETIQUETA ADICIONADA AQUI
    {
      header: "Etiqueta",
      accessorKey: "_id" as keyof any,
      cell: (item: any) => (
        <button
          onClick={() => setProductToPrint(item)}
          className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-xl transition-all"
          title="Imprimir Etiqueta"
        >
          <Printer size={18} />
        </button>
      ),
    },
    {
      header: "Histórico",
      accessorKey: "_id" as keyof any,
      cell: (item: any) => (
        <button
          onClick={() => handleHistory(item)}
          className="p-2 hover:bg-purple-50 text-gray-400 hover:text-purple-600 rounded-xl transition-all"
          title="Ver Movimentações"
        >
          <History size={18} />
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-12 min-h-screen flex flex-col relative pb-24">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg text-red-600 bg-red-50">
              <Search size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Gerencia de <span className="text-red-600">Estoque</span>
            </h1>
          </div>
          <p className="text-sm text-gray-500 font-medium ml-12">
            Exibindo {filteredProducts.length} registros.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={exportToPDF}
            className="flex-1 md:flex-none justify-center bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 hover:text-red-600 transition-all text-xs"
          >
            <FileText size={18} />{" "}
            <span className="hidden md:inline">EXPORTAR PDF</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 md:flex-none justify-center bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-200 text-xs"
          >
            <Plus size={20} />{" "}
            <span className="hidden md:inline">ADICIONAR ITEM</span>
          </button>
          <ImportCSVButton />
        </div>
      </header>

      {/* ÁREA DE FILTROS */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Pesquisar por Nome ou SKU..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative min-w-[240px]">
            <div
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="pl-4 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 cursor-pointer flex items-center justify-between hover:border-red-500 transition-all"
            >
              <span className="flex items-center gap-2">
                <Filter size={16} />{" "}
                {selectedCategory === "TODAS"
                  ? "Todas Categorias"
                  : selectedCategory}
              </span>
              <div
                className={`transition-transform ${isFilterOpen ? "rotate-180" : ""}`}
              >
                ▼
              </div>
            </div>
            {isFilterOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                <div
                  onClick={() => {
                    setSelectedCategory("TODAS");
                    setIsFilterOpen(false);
                  }}
                  className="px-6 py-3 hover:bg-gray-50 cursor-pointer font-bold text-xs text-gray-500 border-b border-gray-50"
                >
                  📑 TODAS CATEGORIAS
                </div>
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setIsFilterOpen(false);
                    }}
                    className="px-6 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-black text-xs text-gray-700 uppercase">
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterStatus === "ALL" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-400 border-gray-200"}`}
          >
            <Layers size={14} /> Todos
          </button>
          <button
            onClick={() => setFilterStatus("STABLE")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterStatus === "STABLE" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white text-gray-400 border-gray-200"}`}
          >
            <CheckCircle2 size={14} /> Estáveis{" "}
            <span className="bg-emerald-200 text-emerald-800 px-1.5 rounded text-[9px]">
              {countStable}
            </span>
          </button>
          <button
            onClick={() => setFilterStatus("CRITICAL")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterStatus === "CRITICAL" ? "bg-red-50 text-red-600 border-red-200" : "bg-white text-gray-400 border-gray-200"}`}
          >
            <AlertTriangle size={14} /> Reposição{" "}
            <span className="bg-red-200 text-red-800 px-1.5 rounded text-[9px]">
              {countCritical}
            </span>
          </button>
        </div>
      </div>

      {/* TABELA */}
      <div className="flex-1">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-gray-200" size={40} />
          </div>
        ) : (
          <DataDisplay
            data={currentProducts}
            columns={columns}
            titleField="name"
            subtitleField="sku"
            onEdit={handleEdit}
            onDelete={
              (session?.user as any)?.role === "admin"
                ? handleDeleteRequest
                : undefined
            }
          />
        )}
      </div>

      {/* BARRA FLUTUANTE DE SELEÇÃO */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-5 z-50 border border-gray-800 w-[90%] md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3 pl-2">
            <div className="bg-red-600 text-white font-black w-8 h-8 rounded-lg flex items-center justify-center text-sm">
              {selectedIds.length}
            </div>
            <span className="font-bold text-sm text-gray-300 hidden md:inline">
              Itens selecionados
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
            >
              <Trash2 size={16} /> Excluir
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* PAGINAÇÃO */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl font-bold text-gray-600 disabled:opacity-50 text-sm"
        >
          <ChevronLeft size={16} /> Anterior
        </button>
        <span className="font-bold text-gray-500 text-sm">
          Página {currentPage} de {totalPages || 1}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl font-bold text-gray-600 disabled:opacity-50 text-sm"
        >
          Próxima <ChevronRight size={16} />
        </button>
      </div>

      {/* MODAIS */}
      {isAddModalOpen && (
        <AddProductModal
          onClose={() => setIsAddModalOpen(false)}
          onRefresh={fetchData}
          categories={categories}
          suppliers={suppliers}
        />
      )}
      {isEditModalOpen && selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          onClose={() => setIsEditModalOpen(false)}
          onRefresh={fetchData}
          categories={categories}
          suppliers={suppliers}
        />
      )}
      {isDeleteModalOpen && (
        <DeleteConfirmModal
          productName={productToDelete?.name}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
        />
      )}
      {isHistoryOpen && selectedProduct && (
        <HistoryModal
          product={selectedProduct}
          onClose={() => setIsHistoryOpen(false)}
          movements={historyMovements}
          loading={historyLoading}
        />
      )}
      <BatchDeleteModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onConfirm={executeBatchDelete}
        count={selectedIds.length}
        isDeleting={isBatchDeleting}
      />

      {/* ✨ 4. MODAL DE IMPRESSÃO AQUI NO FINAL */}
      {productToPrint && (
        <PrintLabelModal
          product={productToPrint}
          onClose={() => setProductToPrint(null)}
        />
      )}
    </div>
  );
}
