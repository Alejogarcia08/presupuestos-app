import React from "react";
import { Link } from "react-router-dom";
import { Truck, Route, ArrowRight } from "lucide-react";

var INK = "#1E2A38";
var PAPER = "#F4F2ED";
var BRASS = "#B08650";
var SLATE = "#8A8371";
var LINE = "#D9D2C2";

export default function SeleccionLogistica({ demoFlotaSlug }) {
  var opciones = [
    {
      id: "flota",
      titulo: "Flota y conductores",
      subtitulo: "Vehiculos, choferes, VTV, seguro y checklist semanal",
      icon: Truck,
      disponible: true,
      to: demoFlotaSlug ? "/flota/" + demoFlotaSlug : "#",
    },
    {
      id: "recorridos",
      titulo: "Optimizacion de recorridos",
      subtitulo: "Armar circuitos de entrega eficientes",
      icon: Route,
      disponible: true,
      to: "/recorridos",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F2ED] flex items-center justify-center px-5" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-2xl w-full">
        <p className="text-[11px] tracking-[0.18em] uppercase font-semibold mb-2 text-center" style={{ color: SLATE }}>
          Logistica y flota
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
            var Contenido = (
              <div
                className="h-full rounded-lg border p-6 flex flex-col bg-white"
                style={{ borderColor: LINE }}
              >
                <div className="flex items-start justify-between mb-1">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center mb-2"
                    style={{ backgroundColor: PAPER, color: BRASS }}
                  >
                    <Icon size={20} />
                  </div>
                  {!o.disponible && (
                    <span
                      className="text-[10px] tracking-wide uppercase font-semibold px-2 py-1 rounded shrink-0"
                      style={{ backgroundColor: PAPER, color: SLATE }}
                    >
                      Proximamente
                    </span>
                  )}
                </div>
                <h3 className="text-[17px] font-bold mb-1" style={{ color: INK }}>
                  {o.titulo}
                </h3>
                <p className="text-[13px] mb-4" style={{ color: SLATE }}>
                  {o.subtitulo}
                </p>
                <div
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold mt-auto"
                  style={{ color: o.disponible ? INK : SLATE }}
                >
                  {o.disponible ? "Entrar" : "En construccion"}
                  {o.disponible && <ArrowRight size={14} />}
                </div>
              </div>
            );

            if (o.disponible) {
              return (
                <Link key={o.id} to={o.to} className="block hover:-translate-y-0.5 transition-transform">
                  {Contenido}
                </Link>
              );
            }
            return (
              <div key={o.id} className="opacity-70 cursor-default">
                {Contenido}
              </div>
            );
          })}
        </div>

        <Link to="/" className="block text-center text-[13px] mt-10 underline" style={{ color: SLATE }}>
          Volver a la landing
        </Link>
      </div>
    </div>
  );
}
