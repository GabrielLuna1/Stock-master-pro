import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  color: string; // Para badges coloridos no Dashboard 🎨
  slug: string;  // Para buscas e URLs limpas
}

const CategorySchema: Schema = new Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Nome da categoria é obrigatório'], 
      unique: true,
      trim: true 
    },
    color: { 
      type: String, 
      default: '#3b82f6' // Azul padrão do Tailwind
    },
    slug: { 
      type: String, 
      lowercase: true, 
      unique: true 
    }
  },
  { timestamps: true }
);

// Adicionamos 'this: ICategory' para o TS reconhecer os campos ✅
CategorySchema.pre<ICategory>('save', async function() {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Substitui espaços por hífens
      .replace(/[^\w-]+/g, '')         // Remove caracteres especiais
      .replace(/--+/g, '-');          // Evita hífens duplos
  }
});

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);