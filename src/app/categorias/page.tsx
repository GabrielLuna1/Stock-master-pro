"use client";

import { useEffect, useState } from "react";
import {
  Tag,
  Edit3,
  Trash2,
  Loader2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSession } from "next-auth/react";
import DeleteCategoryModal from "../../components/categories/DeleteCategoryModal";

export default function CategoriasPage() {
  const { data: session } = useSession();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estados do Modal de Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pesquisa e Paginação
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 🔄 1. RESETAR PÁGINA AO PESQUISAR
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 👇 2. CORREÇÃO DO BUG DO "SUMIÇO"
  // Toda vez que a lista mudar (ex: deletou algo), verificamos se a página atual ainda existe.
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
    // Se estou na página 2, mas agora só existe página 1... volte para a 1.
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredCategories.length, itemsPerPage, currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("saving");

    const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });

      if (res.ok) {
        resetForm();
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || "Erro no servidor");
      }
    } catch (err) {
      alert("Erro de comunicação");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setActionLoading("deleting");
    setDeleteError(null);

    try {
      const res = await fetch(`/api/categories?id=${categoryToDelete._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        setIsDeleteModalOpen(false);
        fetchCategories();
      } else {
        setDeleteError(data.error || "Erro desconhecido ao deletar.");
      }
    } catch (err) {
      setDeleteError("Falha na conexão com o servidor.");
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (cat: any) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setEditingId(cat._id);
    setName(cat.name);
    setColor(cat.color);
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setColor("#3b82f6");
  };

  // Cálculos de Paginação
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCategories = filteredCategories.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="p-8 md:p-12 min-h-screen bg-white">
      {/* Header */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg text-brand-red">
            <Tag size={24} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Gestão de <span className="text-brand-red">Categorias</span>
          </h1>
        </div>
        <p className="text-sm text-gray-500 font-medium ml-12">
          Configure a taxonomia visual do seu inventário master.
        </p>
      </header>

      <main className="max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* FORMULÁRIO (Sticky) */}
          <div className="lg:col-span-4 h-fit sticky top-8">
            <div
              className={`p-8 rounded-3xl border transition-all duration-300 ${
                editingId
                  ? "border-brand-red bg-red-50/30 shadow-xl shadow-red-100"
                  : "border-gray-100 bg-gray-50/50"
              }`}
            >
              <h2 className="text-xs font-black text-gray-400 mb-8 flex items-center gap-2 uppercase tracking-[0.2em]">
                {editingId ? "Modo de Edição" : "Nova Categoria"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                    Identificador
                  </label>
                  <input
                    className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none font-bold transition-all shadow-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ex: Eletrônicos"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                    Cor de Referência
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      "#3b82f6",
                      "#ef4444",
                      "#10b981",
                      "#f59e0b",
                      "#8b5cf6",
                      "#ec4899",
                      "#1e293b",
                      "#94a3b8",
                    ].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`h-10 rounded-xl border-2 transition-all ${
                          color === c
                            ? "border-gray-900 scale-105 shadow-md"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={!!actionLoading}
                    className="flex-1 bg-brand-red text-white font-black py-4 rounded-2xl hover:bg-brand-dark-red transition-all shadow-lg disabled:opacity-50 shadow-red-100"
                  >
                    {actionLoading === "saving" ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : editingId ? (
                      "ATUALIZAR"
                    ) : (
                      "CRIAR"
                    )}
                  </button>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      type="button"
                      className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:bg-gray-100 transition-all"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* LISTA */}
          <div className="lg:col-span-8 flex flex-col h-full">
            <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm mb-6 flex items-center sticky top-0 z-10">
              <div className="relative w-full">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Pesquisar categoria..."
                  className="w-full pl-11 pr-4 py-3 bg-white outline-none font-bold text-gray-600 placeholder:text-gray-300 rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-gray-200" size={40} />
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-20 text-gray-400 font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                Nenhuma categoria encontrada.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 content-start">
                  {currentCategories.map((cat) => (
                    <div
                      key={cat._id}
                      className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-gray-300 transition-all shadow-sm h-fit"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-1.5 h-8 rounded-full shadow-sm"
                          style={{ backgroundColor: cat.color }}
                        />
                        <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight">
                          {cat.name}
                        </h3>
                      </div>

                      <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit3 size={18} />
                        </button>

                        {(session?.user as any)?.role === "admin" && (
                          <button
                            onClick={() => {
                              setCategoryToDelete(cat);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 👇 3. PAGINAÇÃO MELHORADA VISUALMENTE */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wide text-gray-900 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronLeft size={16} /> Anterior
                    </button>

                    <span className="text-xs font-black text-gray-300 uppercase tracking-widest">
                      Página{" "}
                      <span className="text-brand-red text-sm">
                        {currentPage}
                      </span>{" "}
                      de {totalPages}
                    </span>

                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wide text-gray-900 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      Próxima <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <DeleteCategoryModal
        isOpen={isDeleteModalOpen}
        categoryName={categoryToDelete?.name || ""}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={actionLoading === "deleting"}
        error={deleteError}
      />
    </div>
  );
}
