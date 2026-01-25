import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minStock: number;
  price: number;
  location: string;
  createdAt: Date;
  updatedAt: Date;

  // ✨ NOVOS CAMPOS (Opcionais pois produtos antigos não têm)
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
    category: { type: String, default: "Geral" },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    minStock: { type: Number, default: 15 },
    price: { type: Number, min: 0, default: 0 },
    location: { type: String, uppercase: true, default: "ALMOXARIFADO" },

    // ✨ AQUI ESTÁ A MÁGICA:
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastModifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Product =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
