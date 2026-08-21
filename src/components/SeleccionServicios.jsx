import React from "react";
import { Link } from "react-router-dom";
import { FileText, DollarSign, Users, ArrowRight } from "lucide-react";

var INK = "#1E2A38";
var PAPER = "#F4F2ED";
var BRASS = "#B08650";
var SLATE = "#8A8371";
var LINE = "#D9D2C2";

export default function SeleccionServicios({ demoSlug }) {
  var opciones = [
    {
      id: "presupuestos",
      titulo: "Presupuestos",
      subtitulo: "Con catalogo o carga libre",
      icon: FileText,
      to: demoSlug ? "/" + demoSlug : "#",
    },
    {
      id: "cobros",
      titulo: "Cobros pendientes",
      subtitulo: "Cobros parciales y saldo pendiente",
      icon: DollarSign,
      to: demoSlug ? "/" + demoSlug + "/cobros-pendientes" : "#",
    },
    {
      id: "clientes",
      titulo: "Clientes a revisar",
      subtitulo: "Clientes viejos para reactivar",
      icon: Users,
      to: demoSlug ? "/" + demoSlug + "/clientes-a-revisar" : "#",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F2ED] flex items-center justify-center px-5" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-3xl w-full">
        <p className="text-[11px] tracking-[0.18em] uppercase font-semibold mb-2 text-center" style={{ color: SLATE }}>
          Servicios que facturan y cobran
        </p>
        <h1
          className="text-[26px] sm:text-[30px] font-bold text-center mb-10"
          style={{ fontFamily: "IBM Plex Mono, monospace", color: INK }}
        >
          Elegi que modulo probar
        </h1>

        <div className="grid sm:grid-cols-3 gap-5">
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
                <h3 className="text-[17px] font-bold mb-1" style={{ color: INK }}>
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

        <Link to="/" className="block text-center text-[13px] mt-10 underline" style={{ color: SLATE }}>
          Volver a la landing
        </Link>
      </div>
    </div>
  );
}
