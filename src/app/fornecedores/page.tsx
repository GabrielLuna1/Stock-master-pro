"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; // 👈 1. Importação da Sessão adicionada
import {
  Plus,
  Search,
  Truck,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface Supplier {
  _id: string;
  name: string;
  corporateName?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export default function SuppliersPage() {
  // 👈 2. Pegando os dados do usuário logado
  const { data: session } = useSession();
  const amIAdmin = (session?.user as any)?.role === "admin";

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal e Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Estados para o Modal de Exclusão
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados do Formulário
  const [formData, setFormData] = useState({
    name: "",
    corporateName: "",
    cnpj: "",
    email: "",
    phone: "",
  });

  // Estados de Endereço
  const [addressData, setAddressData] = useState({
    cep: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    number: "",
  });

  const [cepLoading, setCepLoading] = useState(false);

  // 1. CARREGAR DADOS
  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      if (Array.isArray(data)) setSuppliers(data);
    } catch (error) {
      toast.error("Erro ao carregar fornecedores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // 2. MÁSCARAS DE INPUT (CNPJ & TELEFONE)
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove tudo que não é número

    if (value.length > 14) value = value.slice(0, 14);

    // Máscara CNPJ: 00.000.000/0000-00
    value = value
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");

    setFormData({ ...formData, cnpj: value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    // Máscara Telefone: (11) 99999-9999
    value = value
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2");

    setFormData({ ...formData, phone: value });
  };

  // 3. BUSCA DE CEP INTELIGENTE
  useEffect(() => {
    const cleanCep = addressData.cep.replace(/\D/g, "");

    if (cleanCep.length < 8) {
      // Se apagou, limpa campos (exceto se estiver editando e não mexeu no cep)
      return;
    }

    if (cleanCep.length === 8) {
      const fetchCep = async () => {
        setCepLoading(true);
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await res.json();

          if (data.erro) {
            toast.error("CEP não encontrado.");
            document.getElementById("cepInput")?.focus();
          } else {
            setAddressData((prev) => ({
              ...prev,
              street: data.logradouro || "",
              neighborhood: data.bairro || "",
              city: data.localidade || "",
              state: data.uf || "",
              number: "", // Limpa número para forçar digitação
            }));
            document.getElementById("numInput")?.focus();
          }
        } catch (error) {
          toast.error("Erro ao consultar CEP.");
        } finally {
          setCepLoading(false);
        }
      };
      fetchCep();
    }
  }, [addressData.cep]);

  // 4. ABRIR MODAL (COM PARSER DE ENDEREÇO)
  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);

      setFormData({
        name: supplier.name,
        corporateName: supplier.corporateName || "",
        cnpj: supplier.cnpj || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
      });

      // PARSER REVERSO DE ENDEREÇO
      // Formato salvo: "Rua X, 10 - Bairro Y - Cidade/UF - CEP: 00000-000"
      let parsedAddress = {
        cep: "",
        street: "",
        neighborhood: "",
        city: "",
        state: "",
        number: "",
      };

      if (supplier.address && supplier.address.includes("CEP:")) {
        try {
          // 1. Separa o CEP do resto
          const [restAddress, cepPart] = supplier.address.split(" - CEP: ");
          parsedAddress.cep = cepPart || "";

          // 2. Separa Cidade/UF e Bairro
          const parts = restAddress.split(" - ");
          // A estrutura esperada é: [Rua+Num, Bairro, Cidade/UF]

          if (parts.length >= 3) {
            const cityState = parts[parts.length - 1]; // "Poá/SP"
            parsedAddress.neighborhood = parts[parts.length - 2]; // "Centro"

            const [city, state] = cityState.split("/");
            parsedAddress.city = city || "";
            parsedAddress.state = state || "";

            // 3. Separa Rua e Número
            const streetNumPart = parts.slice(0, parts.length - 2).join(" - ");

            const lastCommaIndex = streetNumPart.lastIndexOf(",");
            if (lastCommaIndex !== -1) {
              parsedAddress.street = streetNumPart
                .substring(0, lastCommaIndex)
                .trim();
              parsedAddress.number = streetNumPart
                .substring(lastCommaIndex + 1)
                .trim();
            } else {
              parsedAddress.street = streetNumPart;
            }
          } else {
            // Fallback se o formato estiver estranho, joga tudo na rua
            parsedAddress.street = parts[0];
          }
        } catch (e) {
          parsedAddress.street = supplier.address;
        }
      } else {
        // Se não tiver CEP salvo no formato padrão, joga tudo na rua
        parsedAddress.street = supplier.address || "";
      }

      setAddressData(parsedAddress);
    } else {
      setEditingSupplier(null);
      setFormData({
        name: "",
        corporateName: "",
        cnpj: "",
        email: "",
        phone: "",
      });
      setAddressData({
        cep: "",
        street: "",
        neighborhood: "",
        city: "",
        state: "",
        number: "",
      });
    }
    setIsModalOpen(true);
  };

  // 5. SALVAR
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.warning("Nome Fantasia é obrigatório.");
      return;
    }

    // Monta o endereço completo para salvar
    const fullAddress = addressData.cep
      ? `${addressData.street}, ${addressData.number} - ${addressData.neighborhood} - ${addressData.city}/${addressData.state} - CEP: ${addressData.cep}`
      : addressData.street;

    const payload = {
      ...formData,
      address: fullAddress,
      _id: editingSupplier ? editingSupplier._id : undefined,
    };

    const method = editingSupplier ? "PUT" : "POST";

    try {
      const res = await fetch("/api/suppliers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");

      toast.success(
        editingSupplier ? "Parceiro atualizado!" : "Parceiro cadastrado!",
      );
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // NOVA FUNÇÃO DE EXCLUSÃO
  const executeDelete = async () => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/suppliers?id=${supplierToDelete._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error); // Vai mostrar o erro do Safe Delete se houver
        setIsDeleting(false);
        return;
      }
      toast.success("Fornecedor excluído com sucesso.");
      setSupplierToDelete(null); // Fecha o modal
      fetchSuppliers(); // Atualiza a lista
    } catch (error) {
      toast.error("Erro ao excluir.");
      setIsDeleting(false);
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.cnpj && s.cnpj.includes(searchTerm)),
  );

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50/50 pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Truck className="text-red-600" /> Fornecedores
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Gerencie seus parceiros de negócio.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-red-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-md shadow-red-200 active:scale-95 text-sm uppercase tracking-wide"
        >
          <Plus size={18} /> Novo Parceiro
        </button>
      </div>

      {/* BUSCA */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-md flex items-center gap-2">
        <div className="p-2 text-gray-400">
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome ou CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400"
        />
      </div>

      {/* GRID */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          Carregando parceiros...
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <Truck size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">
            Nenhum parceiro encontrado
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier._id}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative"
            >
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => handleOpenModal(supplier)}
                  className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition-colors"
                  title="Editar Parceiro"
                >
                  <Edit size={16} />
                </button>

                {/* 👈 3. TRAVA DE SEGURANÇA: Só Admin vê o botão de excluir */}
                {amIAdmin && (
                  <button
                    onClick={() => setSupplierToDelete(supplier)}
                    className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors"
                    title="Excluir Parceiro"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 font-bold text-lg">
                  {supplier.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">
                    {supplier.name}
                  </h3>
                  {supplier.corporateName && (
                    <p className="text-xs text-gray-400 font-medium truncate max-w-[200px]">
                      {supplier.corporateName}
                    </p>
                  )}
                  <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded uppercase tracking-wide">
                    {supplier.cnpj || "CNPJ N/A"}
                  </span>
                </div>
              </div>
              <hr className="border-gray-50 my-4" />
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail size={16} className="text-gray-300" />
                  <span className="truncate">{supplier.email || "-"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={16} className="text-gray-300" />
                  <span>{supplier.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin size={16} className="text-gray-300" />
                  <span className="truncate">{supplier.address || "-"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL PADRONIZADO (CADASTRO/EDIÇÃO) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/30">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">
                  NOVO PARCEIRO <span className="text-red-600">MASTER</span>
                </h2>
                <p className="text-xs font-bold text-gray-400 mt-1 tracking-wider uppercase">
                  STOCKMASTER SYSTEM V1.0
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-8 space-y-5">
              {/* Nome Fantasia */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wide">
                  Nome Fantasia *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Coca Cola Distribuidora"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium text-gray-900 text-sm placeholder:text-gray-400"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              {/* Razão Social + CNPJ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wide">
                    Razão Social
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all text-sm font-medium text-gray-900"
                    value={formData.corporateName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        corporateName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wide">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    maxLength={18}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all text-sm font-medium text-gray-900"
                    value={formData.cnpj}
                    onChange={handleCnpjChange}
                  />
                </div>
              </div>

              {/* Contato */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wide">
                    E-mail
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all text-sm font-medium text-gray-900"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wide">
                    Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 transition-all text-sm font-medium text-gray-900"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                  />
                </div>
              </div>

              <div className="h-px bg-gray-100 my-2"></div>

              {/* ENDEREÇO */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <MapPin size={12} /> Endereço de Entrega
                  </label>
                  {cepLoading && (
                    <span className="text-xs text-red-500 flex items-center gap-1 font-bold">
                      <Loader2 size={12} className="animate-spin" /> Buscando...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="col-span-1">
                    <input
                      id="cepInput"
                      type="text"
                      maxLength={9}
                      placeholder="CEP"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-sm font-bold text-gray-900 text-center shadow-sm placeholder:font-normal"
                      value={addressData.cep}
                      onChange={(e) =>
                        setAddressData({ ...addressData, cep: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Rua / Avenida"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 transition-all text-sm font-medium text-gray-900 shadow-sm"
                      value={addressData.street}
                      onChange={(e) =>
                        setAddressData({
                          ...addressData,
                          street: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-3">
                    <input
                      id="numInput"
                      type="text"
                      placeholder="Nº"
                      className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-sm font-bold text-gray-900 text-center shadow-sm"
                      value={addressData.number}
                      onChange={(e) =>
                        setAddressData({
                          ...addressData,
                          number: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Bairro"
                      className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 transition-all text-sm font-medium text-gray-900 shadow-sm"
                      value={addressData.neighborhood}
                      onChange={(e) =>
                        setAddressData({
                          ...addressData,
                          neighborhood: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Cidade"
                      className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 transition-all text-sm font-medium text-gray-900 shadow-sm"
                      value={addressData.city}
                      onChange={(e) =>
                        setAddressData({ ...addressData, city: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="UF"
                      maxLength={2}
                      className="w-full px-2 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 transition-all text-sm font-medium text-gray-900 text-center shadow-sm"
                      value={addressData.state}
                      onChange={(e) =>
                        setAddressData({
                          ...addressData,
                          state: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 uppercase tracking-wide text-sm mt-4"
              >
                {editingSupplier ? "Salvar Alterações" : "Cadastrar Parceiro"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">
                Excluir Parceiro?
              </h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Você está prestes a excluir o fornecedor <br />
                <span className="font-bold text-gray-900">
                  {supplierToDelete.name}
                </span>
                .<br />
                Esta ação é irreversível.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setSupplierToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-red-200"
                >
                  {isDeleting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Excluir"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
