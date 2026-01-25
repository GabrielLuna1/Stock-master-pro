"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Lock,
  CheckSquare,
  Square,
  X,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";

// Modais
import EditUserModal from "@/components/users/EditUserModal";
import AddUserModal from "@/components/users/AddUserModal";
import DeleteUserModal from "@/components/users/DeleteUserModal";
// 👇 Reutilizando o modal de massa do inventário (Funciona igual!)
import BatchDeleteModal from "@/components/inventory/BatchDeleteModal";

interface IUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "operador";
  active: boolean;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. NOVOS ESTADOS PARA FILTRO E SELEÇÃO
  const [filterRole, setFilterRole] = useState<"ALL" | "admin" | "operador">(
    "ALL",
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Estados dos Modais Individuais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<IUser | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
      setSelectedIds([]); // Limpa seleção ao recarregar
    } catch (error) {
      console.error("Erro users:", error);
      toast.error("Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- LÓGICA DE FILTRAGEM ATUALIZADA ---
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "ALL" || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  // --- LÓGICA DE SELEÇÃO EM MASSA ---

  // Verifica se um usuário é "selecionável" (Não é Supremo, Não é Eu Mesmo)
  const isSelectable = (user: IUser) => {
    const isSupreme = user.email === "admin@stockmaster.com";
    const isMe = (session?.user as any)?.id === user._id;
    return !isSupreme && !isMe;
  };

  const handleSelectAll = () => {
    // Só seleciona os que aparecem na tela E que são permitidos
    const selectableUsers = filteredUsers.filter(isSelectable);

    // Se já selecionei todos os permitidos da tela, desmarca tudo
    // (Lógica: se a qtd selecionada for igual a qtd de selecionáveis visíveis)
    const selectableIds = selectableUsers.map((u) => u._id);
    const allSelected = selectableIds.every((id) => selectedIds.includes(id));

    if (allSelected && selectableIds.length > 0) {
      // Remove os IDs da tela atual da lista de selecionados
      setSelectedIds((prev) =>
        prev.filter((id) => !selectableIds.includes(id)),
      );
    } else {
      // Adiciona os IDs faltantes
      const newIds = [...new Set([...selectedIds, ...selectableIds])];
      setSelectedIds(newIds);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // --- AÇÃO DE EXCLUSÃO EM MASSA ---
  const executeBatchDelete = async () => {
    setIsBatchDeleting(true);
    try {
      const res = await fetch("/api/users/batch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (res.ok) {
        toast.success(`${selectedIds.length} usuários removidos!`);
        fetchUsers();
        setIsBatchModalOpen(false);
        setSelectedIds([]);
      } else {
        toast.error("Erro ao excluir em massa.");
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // --- AÇÕES INDIVIDUAIS (Mantidas) ---
  const handleDeleteClick = (user: IUser) => {
    if (user.email === "admin@stockmaster.com") {
      toast.error("Ação Proibida: O Admin Supremo não pode ser excluído.");
      return;
    }
    if (user._id === (session?.user as any)?.id) {
      toast.error("Você não pode excluir seu próprio usuário.");
      return;
    }
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userToDelete._id }),
      });

      if (res.ok) {
        toast.success("Usuário excluído com sucesso.");
        setUsers(users.filter((u) => u._id !== userToDelete._id));
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao excluir usuário.");
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    }
  };

  const handleEdit = (user: IUser) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  // Cálculos para os botões de filtro
  const countAdmin = users.filter((u) => u.role === "admin").length;
  const countOperador = users.filter((u) => u.role === "operador").length;

  return (
    <div className="p-8 md:p-12 min-h-screen bg-gray-50/50 pb-24 relative">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg text-brand-red bg-red-50">
              <Users size={24} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Gestão de <span className="text-brand-red">Time</span>
            </h1>
          </div>
          <p className="text-sm text-gray-500 font-medium ml-12">
            Controle de acesso, cargos e segurança.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand-red text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-gray-200 active:scale-95 hover:bg-red-700"
        >
          <Plus size={20} /> NOVO MEMBRO
        </button>
      </div>

      {/* ÁREA DE FILTROS E BUSCA */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Busca */}
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-red outline-none font-medium text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Botões de Filtro */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterRole("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterRole === "ALL" ? "bg-gray-900 text-white border-gray-900 shadow-md" : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"}`}
            >
              Todos{" "}
              <span className="bg-gray-700 text-white px-1.5 rounded text-[9px]">
                {users.length}
              </span>
            </button>
            <button
              onClick={() => setFilterRole("admin")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterRole === "admin" ? "bg-red-50 text-red-600 border-red-200 shadow-sm" : "bg-white text-gray-400 border-gray-200 hover:text-red-500 hover:border-red-100"}`}
            >
              <ShieldAlert size={14} /> Admins{" "}
              <span className="bg-red-200 text-red-800 px-1.5 rounded text-[9px]">
                {countAdmin}
              </span>
            </button>
            <button
              onClick={() => setFilterRole("operador")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterRole === "operador" ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm" : "bg-white text-gray-400 border-gray-200 hover:text-blue-500 hover:border-blue-100"}`}
            >
              <Briefcase size={14} /> Operadores{" "}
              <span className="bg-blue-200 text-blue-800 px-1.5 rounded text-[9px]">
                {countOperador}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* LISTAGEM */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-gray-200" size={40} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[850px] table-fixed">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  {/* Checkbox Cabeçalho */}
                  <th className="px-6 py-4 w-[50px] text-center">
                    <button
                      onClick={handleSelectAll}
                      className="hover:text-red-500 transition-colors"
                    >
                      {/* Lógica Visual: Se tiver selecionado alguns, mostra check */}
                      {selectedIds.length > 0 &&
                      filteredUsers
                        .filter(isSelectable)
                        .every((u) => selectedIds.includes(u._id)) ? (
                        <CheckSquare size={18} className="text-red-600" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="px-8 py-4 w-[35%]">Usuário</th>
                  <th className="px-8 py-4 w-[25%]">Email Corporativo</th>
                  <th className="px-8 py-4 w-[15%]">Cargo</th>
                  <th className="px-8 py-4 w-[10%] text-center">Status</th>
                  <th className="px-8 py-4 w-[15%] text-right px-10">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => {
                  const isSupreme = user.email === "admin@stockmaster.com";
                  const isMe = (session?.user as any)?.id === user._id;
                  const canSelect = isSelectable(user);
                  const isSelected = selectedIds.includes(user._id);

                  return (
                    <tr
                      key={user._id}
                      className={`transition-colors group ${isSelected ? "bg-red-50/50" : "hover:bg-gray-50/50"}`}
                    >
                      {/* Checkbox Linha */}
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => canSelect && handleSelectOne(user._id)}
                          disabled={!canSelect}
                          className={`transition-colors ${!canSelect ? "text-gray-200 cursor-not-allowed" : "text-gray-300 hover:text-red-500"}`}
                        >
                          {isSelected ? (
                            <CheckSquare size={18} className="text-red-600" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>

                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              isSupreme
                                ? "bg-red-600 shadow-md shadow-red-200"
                                : user.role === "admin"
                                  ? "bg-gradient-to-br from-red-500 to-red-600"
                                  : "bg-gray-400"
                            }`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">
                              {user.name}
                            </p>
                            {isMe && (
                              <span className="text-[10px] text-brand-red font-bold uppercase tracking-wide">
                                (Você)
                              </span>
                            )}
                            {isSupreme && !isMe && (
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide ml-2">
                                👑 Dono
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-5 text-sm font-medium text-gray-600">
                        {user.email}
                      </td>

                      <td className="px-8 py-5">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                            user.role === "admin"
                              ? "bg-red-50 text-red-700 border-red-100"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {user.role === "admin" ? (
                            <ShieldAlert size={12} />
                          ) : (
                            <Briefcase size={12} />
                          )}
                          {user.role}
                        </div>
                      </td>

                      <td className="px-8 py-5 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <CheckCircle2 size={10} /> ATIVO
                        </span>
                      </td>

                      <td className="px-8 py-5 text-right px-10">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Pencil size={18} />
                          </button>

                          {isSupreme ? (
                            <div
                              className="p-2 text-gray-300 cursor-not-allowed"
                              title="Admin Supremo não pode ser excluído"
                            >
                              <Lock size={18} />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDeleteClick(user)}
                              disabled={isMe}
                              className={`p-2 rounded-lg transition-all ${isMe ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-red-600 hover:bg-red-50"}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- BARRA FLUTUANTE (SELEÇÃO) --- */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-5 z-50 border border-gray-800">
          <div className="flex items-center gap-3 pl-2">
            <div className="bg-red-600 text-white font-black w-8 h-8 rounded-lg flex items-center justify-center text-sm">
              {selectedIds.length}
            </div>
            <span className="font-bold text-sm text-gray-300">
              Usuários selecionados
            </span>
          </div>
          <div className="h-8 w-px bg-gray-700"></div>
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
          >
            <Trash2 size={16} />
            Excluir Selecionados
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* --- MODAIS --- */}
      {isEditModalOpen && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setIsEditModalOpen(false)}
          onRefresh={fetchUsers}
        />
      )}
      {isAddModalOpen && (
        <AddUserModal
          onClose={() => setIsAddModalOpen(false)}
          onRefresh={fetchUsers}
        />
      )}
      {isDeleteModalOpen && userToDelete && (
        <DeleteUserModal
          userName={userToDelete.name}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
        />
      )}

      {/* Novo Modal de Massa (Reusado do Inventory) */}
      <BatchDeleteModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onConfirm={executeBatchDelete}
        count={selectedIds.length}
        isDeleting={isBatchDeleting}
      />
    </div>
  );
}
