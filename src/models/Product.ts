import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  sku: string;
  ean?: string;
  category: string;
  quantity: number;
  minStock: number;

  // 💰 Financeiro
  price: number; // Preço de VENDA (O que entra no caixa)
  costPrice: number; // ✨ NOVO: Preço de CUSTO (O que sai do caixa)

  location: string;

  // 🔗 Relacionamentos
  supplier?: mongoose.Types.ObjectId; // ✨ NOVO: Fornecedor vinculado

  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
  lastModifiedBy?: mongoose.Types.ObjectId;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: [true, "Nome é obrigatório"], trim: true },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      default: () => `MASTER-${Math.floor(1000 + Math.random() * 9000)}`,
    },
    ean: {
      type: String,
      unique: true,
      sparse: true,
    },
    category: { type: String, default: "Geral" },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    minStock: { type: Number, default: 15 },

    // 💰 FINANCEIRO
    price: { type: Number, min: 0, default: 0 }, // Venda (Mantivemos o nome 'price' para não quebrar o front)
    costPrice: { type: Number, min: 0, default: 0 }, // Custo (Para cálculo de lucro)

    location: { type: String, uppercase: true, default: "ALMOXARIFADO" },

    // 🔗 FORNECEDOR (Ponte para a Fase 2)
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier" }, // Vai apontar para o model que criaremos a seguir

    // 🛡️ AUDITORIA
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastModifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const Product =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
