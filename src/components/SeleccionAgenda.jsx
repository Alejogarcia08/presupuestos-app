import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Star, ArrowRight } from "lucide-react";

var INK = "#1E2A38";
var PAPER = "#F4F2ED";
var BRASS = "#B08650";
var SLATE = "#8A8371";
var LINE = "#D9D2C2";

export default function SeleccionAgenda({ demoTurnoSlug }) {
  var opciones = [
    {
      id: "turnos",
      titulo: "Turnos",
      subtitulo: "Calendario semanal, pacientes y repeticiones",
      icon: Calendar,
      disponible: true,
      to: demoTurnoSlug ? "/turnos/" + demoTurnoSlug : "#",
    },
    {
      id: "fidelizacion",
      titulo: "Fidelizacion",
      subtitulo: "Pedido de reseñas despues de cada trabajo",
      icon: Star,
      disponible: true,
      to: demoTurnoSlug ? "/turnos/" + demoTurnoSlug + "/fidelizacion" : "#",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F2ED] flex items-center justify-center px-5" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-2xl w-full">
        <p className="text-[11px] tracking-[0.18em] uppercase font-semibold mb-2 text-center" style={{ color: SLATE }}>
          Negocios que agendan y fidelizan
        </p>
        <h1
          className="text-[26px] sm:text-[30px] font-bold text-center mb-10"
          style={{ fontFamily: "IBM Plex Mono, monospace", color: INK }}
        >
          Elegi que modulo probar
        </h1>

        <div className="grid sm:grid-cols-2 gap-5">
          {opciones.map(function (o) {
            var Icon = o.icon;
            return (
              <Link
                key={o.id}
                to={o.to}
                className="rounded-lg border p-6 flex flex-col hover:-translate-y-0.5 transition-transform bg-white"
                style={{ borderColor: LINE }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: PAPER, color: BRASS }}
                >
                  <Icon size={20} />
                </div>
                <h3 className="text-[18px] font-bold mb-1" style={{ color: INK }}>
                  {o.titulo}
                </h3>
                <p className="text-[13px] mb-4" style={{ color: SLATE }}>
                  {o.subtitulo}
                </p>
                <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold mt-auto" style={{ color: INK }}>
                  Entrar
                  <ArrowRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>

        <Link
          to="/"
          className="block text-center text-[13px] mt-10 underline"
          style={{ color: SLATE }}
        >
          Volver a la landing
        </Link>
      </div>
    </div>
  );
}
