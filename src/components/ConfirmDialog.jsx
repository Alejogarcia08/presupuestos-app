import React from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ abierto, titulo, mensaje, colorPrimario, onConfirmar, onCancelar }) {
  if (!abierto) return null;

  var color = colorPrimario || "#1E2A38";

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center px-5">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={22} className="text-[#B0876B] shrink-0 mt-0.5" />
          <div>
            <div className="text-[16px] font-bold text-[#1E2A38] mb-1">{titulo}</div>
            <div className="text-[14px] text-[#5A5647]">{mensaje}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onCancelar}
            className="rounded-md py-2.5 text-[14px] font-semibold border"
            style={{ borderColor: "#D9D2C2", color: "#5A5647" }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="rounded-md py-2.5 text-[14px] font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
