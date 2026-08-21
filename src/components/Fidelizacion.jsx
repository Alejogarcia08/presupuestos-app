import React from "react";
import { Star } from "lucide-react";

export default function Fidelizacion() {
  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#1E2A38] flex items-center justify-center px-5" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-md text-center bg-white border border-[#D9D2C2] rounded-xl px-8 py-12">
        <Star size={32} className="mx-auto mb-4" style={{ color: "#B08650" }} />
        <h1 className="text-[22px] font-bold mb-2" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
          Fidelizacion y Reseñas
        </h1>
        <p className="text-[14px] text-[#8A8371]">
          En construccion. Va a mandar un pedido de reseña automatico cuando un
          trabajo quede marcado como realizado o cobrado.
        </p>
      </div>
    </div>
  );
}
