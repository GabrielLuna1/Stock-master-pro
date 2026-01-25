import mongoose, { Schema, model, models } from "mongoose";

const MovementSchema = new Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    // Gravamos o nome também, para o histórico não quebrar se o produto for excluído um dia
    productName: { type: String, required: true },

    // Quem fez a alteração?
    userId: { type: String, required: true },
    userName: { type: String, required: true }, // Gravamos o nome para facilitar a leitura na tela

    type: {
      type: String,
      enum: ["entrada", "saida", "ajuste", "criacao", "exclusao"], // Tipos permitidos
      required: true,
    },

    quantity: { type: Number, required: true }, // Quantos itens (ex: 10)
    oldStock: { type: Number, required: true }, // Quanto tinha antes (ex: 50)
    newStock: { type: Number, required: true }, // Quanto tem agora (ex: 60)

    observation: { type: String }, // Motivo (opcional)
  },
  {
    timestamps: true, // Cria automaticamente 'createdAt' (Data da ação)
  },
);

const Movement = models.Movement || model("Movement", MovementSchema);

export default Movement;
