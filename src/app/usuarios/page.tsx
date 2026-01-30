"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Search,
  ShieldAlert,
  CheckCircle2,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Briefcase,
  CheckSquare,
  Square,
  X,
  Shield,
  ChevronLeft, // 👈 Novo ícone
  ChevronRight, // 👈 Novo ícone
} from "lucide-react";
import { toast } from "sonner";

// Modais
import EditUserModal from "@/components/users/EditUserModal";
import AddUserModal from "@/components/users/AddUserModal";
import DeleteUserModal from "@/components/users/DeleteUserModal";
import BatchDeleteModal from "@/components/inventory/BatchDeleteModal";

import { DataDisplay } from "@/components/ui/DataDisplay";

interface IUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "operador";
  active: boolean;
}

const ITEMS_PER_PAGE = 20; // ⚡️ Limite fixo por página

export default function UsersPage() {
  const { data: session } = useSession();
  const currentUserEmail = session?.user?.email;
  const currentUserId = (session?.user as any)?.id;

  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Paginação
  const [currentPage, setCurrentPage] = useState(1); // 📄 Página Atual

  // Filtros e Seleção
  const [filterRole, setFilterRole] = useState<"ALL" | "admin" | "operador">(
    "ALL",
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Modais
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
      setSelectedIds([]);
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

  // 👇 RESETA A PÁGINA AO FILTRAR
  // Se eu buscar algo, tenho que voltar para a página 1 para ver o resultado
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole]);

  // --- LÓGICA DE FILTRAGEM ---
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "ALL" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // --- LÓGICA DE PAGINAÇÃO (Corte do Array) ---
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // --- LÓGICA DE SELEÇÃO ---
  const isSelectable = (user: IUser) => {
    const isSupreme = user.email === "admin@stockmaster.com";
    const isMe = currentUserId === user._id;
    return !isSupreme && !isMe;
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // --- AÇÕES ---
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

  const handleDeleteClick = (user: IUser) => {
    if (user.email === "admin@stockmaster.com") {
      toast.error("Ação Proibida: O Admin Supremo não pode ser excluído.");
      return;
    }
    if (user._id === currentUserId) {
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

  const countAdmin = users.filter((u) => u.role === "admin").length;
  const countOperador = users.filter((u) => u.role === "operador").length;

  const columns = [
    {
      header: "Select",
      accessorKey: "_id" as keyof IUser,
      cell: (user: IUser) => {
        const canSelect = isSelectable(user);
        const isSelected = selectedIds.includes(user._id);
        return (
          <button
            onClick={() => canSelect && handleSelectOne(user._id)}
            disabled={!canSelect}
            className={`transition-colors ${!canSelect ? "text-gray-200 cursor-not-allowed" : "hover:text-red-500"}`}
          >
            {isSelected ? (
              <CheckSquare size={18} className="text-red-600" />
            ) : (
              <Square size={18} className="text-gray-300" />
            )}
          </button>
        );
      },
    },
    {
      header: "Usuário",
      accessorKey: "name" as keyof IUser,
      cell: (user: IUser) => {
        const isSupreme = user.email === "admin@stockmaster.com";
        const isMe = currentUserId === user._id;
        return (
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
              <p className="font-bold text-gray-900 text-sm">{user.name}</p>
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
        );
      },
    },
    {
      header: "Email",
      accessorKey: "email" as keyof IUser,
      cell: (user: IUser) => (
        <span className="text-sm font-medium text-gray-600">{user.email}</span>
      ),
    },
    {
      header: "Cargo",
      accessorKey: "role" as keyof IUser,
      cell: (user: IUser) => (
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
      ),
    },
    {
      header: "Status",
      accessorKey: "active" as keyof IUser,
      cell: (user: IUser) => (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          <CheckCircle2 size={10} /> ATIVO
        </span>
      ),
    },
    {
      header: "Ações",
      accessorKey: "actions" as keyof IUser,
      cell: (user: IUser) => {
        const isTargetSupreme = user.email === "admin@stockmaster.com";
        const amISupreme = currentUserEmail === "admin@stockmaster.com";
        const isMe = user._id === currentUserId;

        const canEdit = !isTargetSupreme || amISupreme;
        const canDelete = !isTargetSupreme && !isMe;

        if (!canEdit) {
          return (
            <div
              className="flex items-center gap-2 text-gray-300 select-none cursor-not-allowed"
              title="Apenas o Super Admin pode modificar este usuário."
            >
              <Shield size={18} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Intocável
              </span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(user)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar usuário"
            >
              <Pencil size={18} />
            </button>

            {canDelete && (
              <button
                onClick={() => handleDeleteClick(user)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir usuário"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 md:p-12 min-h-screen pb-24 relative">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg text-brand-red bg-red-50">
              <Users size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Gestão de <span className="text-brand-red">Time</span>
            </h1>
          </div>
          <p className="text-sm text-gray-500 font-medium md:ml-12">
            Controle de acesso, cargos e segurança.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full md:w-auto justify-center bg-brand-red text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-gray-200 active:scale-95 hover:bg-red-700"
        >
          <Plus size={20} /> <span className="truncate">NOVO MEMBRO</span>
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
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

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <button
              onClick={() => setFilterRole("ALL")}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterRole === "ALL" ? "bg-gray-900 text-white border-gray-900 shadow-md" : "bg-white text-gray-400 border-gray-200"}`}
            >
              Todos{" "}
              <span className="bg-gray-700 text-white px-1.5 rounded text-[9px]">
                {users.length}
              </span>
            </button>
            <button
              onClick={() => setFilterRole("admin")}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterRole === "admin" ? "bg-red-50 text-red-600 border-red-200 shadow-sm" : "bg-white text-gray-400 border-gray-200"}`}
            >
              <ShieldAlert size={14} /> Admins{" "}
              <span className="bg-red-200 text-red-800 px-1.5 rounded text-[9px]">
                {countAdmin}
              </span>
            </button>
            <button
              onClick={() => setFilterRole("operador")}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 border ${filterRole === "operador" ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm" : "bg-white text-gray-400 border-gray-200"}`}
            >
              <Briefcase size={14} /> Operadores{" "}
              <span className="bg-blue-200 text-blue-800 px-1.5 rounded text-[9px]">
                {countOperador}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ⚡ LISTAGEM RESPONSIVA (DataDisplay) */}
      <div className="flex-1 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-gray-200" size={40} />
          </div>
        ) : (
          <>
            {/* ⚡️ Passamos os dados PAGINADOS aqui */}
            <DataDisplay
              data={paginatedUsers}
              columns={columns}
              titleField="name"
              subtitleField="email"
            />

            {/* 👇 RODAPÉ DE PAGINAÇÃO */}
            {filteredUsers.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">
                  Mostrando{" "}
                  <span className="font-bold text-gray-900">
                    {startIndex + 1}
                  </span>{" "}
                  a{" "}
                  <span className="font-bold text-gray-900">
                    {Math.min(
                      startIndex + ITEMS_PER_PAGE,
                      filteredUsers.length,
                    )}
                  </span>{" "}
                  de{" "}
                  <span className="font-bold text-gray-900">
                    {filteredUsers.length}
                  </span>{" "}
                  usuários
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} className="text-gray-600" />
                  </button>
                  <span className="text-sm font-bold text-gray-900 px-2">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* BARRA FLUTUANTE */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 md:gap-6 animate-in slide-in-from-bottom-5 z-50 border border-gray-800 w-[90%] md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3 pl-2">
            <div className="bg-red-600 text-white font-black w-8 h-8 rounded-lg flex items-center justify-center text-sm">
              {selectedIds.length}
            </div>
            <span className="font-bold text-sm text-gray-300 hidden md:inline">
              Usuários selecionados
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
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

      {/* MODAIS */}
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
