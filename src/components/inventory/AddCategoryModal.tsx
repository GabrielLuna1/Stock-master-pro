"use client";

import { useState } from "react";
import { X, Loader2, Palette } from "lucide-react";

export default function AddCategoryModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3b82f6");

  // Presets de cores "Premium" 🎨
  const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color: selectedColor }),
    });

    // Tentamos ler o JSON. Se a API enviou erro, ele cai aqui.
    const data = await res.json();

    if (res.ok) {
      onRefresh();
      onClose();
    } else {
      // Aqui tratamos a duplicidade sem travar o sistema!
      alert(data.error || "Erro ao salvar categoria");
    }
  } catch (err) {
    console.error("Erro crítico:", err);
    alert("Erro de conexão com o servidor.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Nova Categoria</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome da Categoria</label>
            <input 
              type="text" required value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-900"
              placeholder="Ex: Eletrônicos"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identidade Visual</label>
            <div className="flex gap-3 justify-between">
              {colors.map((color) => (
                <button
                  key={color} type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${selectedColor === color ? 'ring-4 ring-offset-2 ring-gray-200 scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white font-black py-4 rounded-xl hover:bg-black transition-all flex justify-center items-center gap-2 shadow-xl disabled:bg-gray-200"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "CRIAR CATEGORIA"}
          </button>
        </form>
      </div>
    </div>
  );
}