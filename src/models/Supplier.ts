import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupplier {
  name: string; // Nome Fantasia
  corporateName?: string; // Razão Social (Opcional)
  cnpj?: string; // CNPJ ou CPF
  email?: string; // Para contato financeiro
  phone?: string; // Contato rápido
  address?: string; // Endereço (Útil para frete)
  active: boolean; // Soft Delete (Nunca apagamos histórico)
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierDocument extends ISupplier, Document {}

const SupplierSchema = new Schema<SupplierDocument>(
  {
    name: {
      type: String,
      required: [true, "Nome do fornecedor é obrigatório"],
      trim: true,
    },
    corporateName: { type: String, trim: true },
    cnpj: { type: String, trim: true, unique: true, sparse: true }, // Sparse permite nulls, mas se tiver valor, deve ser único
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Evita re-compilação do model no Next.js
const Supplier =
  (mongoose.models.Supplier as Model<SupplierDocument>) ||
  mongoose.model<SupplierDocument>("Supplier", SupplierSchema);

export default Supplier;
