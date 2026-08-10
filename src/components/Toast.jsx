import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function Toast({ mensaje, visible, colorPrimario }) {
  if (!visible) return null;

  var color = colorPrimario || "#1E2A38";

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-white border rounded-lg shadow-lg px-5 py-4 flex items-center gap-3 max-w-md"
      style={{ borderColor: color }}
    >
      <CheckCircle2 size={22} style={{ color: "#3C7A5C" }} className="shrink-0" />
      <span className="text-[14px] font-medium text-[#1E2A38]">{mensaje}</span>
    </div>
  );
}