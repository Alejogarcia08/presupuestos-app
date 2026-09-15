import React from "react";
import { Route } from "lucide-react";

export default function OptimizacionRecorridos() {
  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#1E2A38] flex items-center justify-center px-5" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-md text-center bg-white border border-[#D9D2C2] rounded-xl px-8 py-12">
        <Route size={32} className="mx-auto mb-4" style={{ color: "#B08650" }} />
        <h1 className="text-[22px] font-bold mb-2" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
          Optimizacion de recorridos
        </h1>
        <p className="text-[14px] text-[#8A8371]">
          En construccion. Va a ordenar las paradas de reparto por distancia y
          prioridad, y proponer el recorrido mas eficiente para cada conductor.
        </p>
      </div>
    </div>
  );
}
