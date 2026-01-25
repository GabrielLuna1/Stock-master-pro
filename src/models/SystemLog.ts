import mongoose, { Schema, model, models } from "mongoose";

const SystemLogSchema = new Schema(
  {
    action: { type: String, required: true }, // Ex: "PRODUCT_DELETE"
    description: { type: String, required: true },

    // 👇 Mudança 1: Removemos a obrigatoriedade (required) caso venha vazio
    userId: { type: String },
    userName: { type: String },

    // 👇 Mudança 2: REMOVEMOS O ENUM. Agora aceita qualquer texto.
    // Isso evita erro de validação se mandarmos "CRITICAL" ou "critical".
    level: {
      type: String,
      default: "info",
    },

    // 👇 Mudança 3: Campo extra para garantir flexibilidade futura
    metadata: { type: Object },
  },
  { timestamps: true },
);

// Evita erro de recompilação ao salvar o arquivo
const SystemLog = models.SystemLog || model("SystemLog", SystemLogSchema);

export default SystemLog;
