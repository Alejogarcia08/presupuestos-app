import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Users,
  DollarSign,
  Calendar,
  Star,
  Github,
  Mail,
  ArrowRight,
  Trello,
  ExternalLink,
} from "lucide-react";

var INK = "#1E2A38";
var PAPER = "#F4F2ED";
var BRASS = "#B08650";
var SLATE = "#8A8371";
var LINE = "#D9D2C2";

export default function LandingPage({ demoSlug, demoTurnoSlug, githubUrl, contactoEmail, jiraUrl }) {
  return (
    <div style={{ backgroundColor: PAPER, color: INK, fontFamily: "Inter, system-ui, sans-serif" }}>
      <Hero />
      <SelectorRubro demoSlug={demoSlug} demoTurnoSlug={demoTurnoSlug} />
      <ComoFunciona jiraUrl={jiraUrl} githubUrl={githubUrl} />
      <Footer githubUrl={githubUrl} contactoEmail={contactoEmail} />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b" style={{ borderColor: LINE }}>
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(" + INK + " 1px, transparent 1px), linear-gradient(90deg, " + INK + " 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative max-w-4xl lg:max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-16 sm:pt-24 pb-14 sm:pb-20">
        <div
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase font-semibold px-3 py-1.5 rounded-full border mb-6"
          style={{ borderColor: BRASS, color: BRASS }}
        >
          Sistema modular de gestion comercial
        </div>
        <h1
          className="text-[34px] sm:text-[52px] lg:text-[62px] leading-[1.05] font-bold mb-5"
          style={{ fontFamily: "IBM Plex Mono, monospace" }}
        >
          Presupuestos, cobros y clientes,
          <br />
          en un solo lugar.
        </h1>
        <p className="text-[16px] sm:text-[18px] max-w-2xl mb-8" style={{ color: "#5A5647" }}>
          Un sistema armado para PyMEs y monotributistas: elegis los modulos que tu
          rubro necesita, probas cada uno con datos reales, y vez por adentro como
          se conecta todo.
        </p>
        <a
          href="#rubros"
          className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-[14px] font-semibold text-white"
          style={{ backgroundColor: INK }}
        >
          Elegir mi rubro y probar
          <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}

function SelectorRubro({ demoSlug, demoTurnoSlug }) {
  var rubros = [
    {
      id: "comercio",
      titulo: "Servicios que facturan y cobran",
      subtitulo: "Para PyMEs y monotributistas de servicios",
      modulos: [
        { icon: FileText, label: "Presupuestos con catalogo o carga libre" },
        { icon: DollarSign, label: "Cobros parciales y saldo pendiente" },
        { icon: Users, label: "Clientes viejos para reactivar" },
      ],
      disponible: true,
      to: "/servicios",
    },
    {
      id: "turnos",
      titulo: "Negocios que agendan y fidelizan",
      subtitulo: "Para PyMEs que trabajan a base de turnos",
      modulos: [
        { icon: Calendar, label: "Turnos y recordatorios por WhatsApp" },
        { icon: Star, label: "Pedido de reseñas despues del trabajo" },
        { icon: Users, label: "Clientes viejos para reactivar" },
      ],
      disponible: !!demoTurnoSlug,
      to: "/agenda",
    },
  ];

  return (
    <section id="rubros" className="max-w-4xl lg:max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-14 sm:py-20">
      <p className="text-[11px] tracking-[0.18em] uppercase font-semibold mb-2" style={{ color: SLATE }}>
        Paso 1
      </p>
      <h2 className="text-[24px] sm:text-[30px] font-bold mb-10" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
        Elegi tu rubro
      </h2>

      <div className="grid sm:grid-cols-2 gap-5 lg:gap-8">
        {rubros.map(function (r) {
          var Contenido = (
            <div
              className="h-full rounded-lg border p-6 flex flex-col"
              style={{ borderColor: LINE, backgroundColor: "white" }}
            >
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-[19px] font-bold" style={{ color: INK }}>
                  {r.titulo}
                </h3>
                {!r.disponible && (
                  <span
                    className="text-[10px] tracking-wide uppercase font-semibold px-2 py-1 rounded shrink-0 ml-2"
                    style={{ backgroundColor: PAPER, color: SLATE }}
                  >
                    Proximamente
                  </span>
                )}
              </div>
              <p className="text-[13px] mb-5" style={{ color: SLATE }}>
                {r.subtitulo}
              </p>

              <div className="space-y-3 mb-6 flex-1">
                {r.modulos.map(function (m, i) {
                  var Icon = m.icon;
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      <Icon size={16} style={{ color: BRASS }} className="shrink-0" />
                      <span className="text-[13.5px]" style={{ color: "#3A362C" }}>
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
                style={{ color: r.disponible ? INK : SLATE }}
              >
                {r.disponible ? "Probar con datos reales" : "En construccion"}
                {r.disponible && <ArrowRight size={14} />}
              </div>
            </div>
          );

          if (r.disponible) {
            return (
              <Link key={r.id} to={r.to} className="block hover:-translate-y-0.5 transition-transform">
                {Contenido}
              </Link>
            );
          }
          return (
            <div key={r.id} className="opacity-70 cursor-default">
              {Contenido}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ComoFunciona({ jiraUrl, githubUrl }) {
  var [pasoActivo, setPasoActivo] = useState(null);

  var pasos = [
    {
      id: "front",
      label: "Formulario",
      tech: "React + Vite",
      detalle: "Interfaz en React, responsive, desplegada en Netlify. Corre en cualquier navegador, sin instalar nada.",
    },
    {
      id: "server",
      label: "Servidor",
      tech: "Node.js + Express",
      detalle: "API propia en Render. Es el unico lugar que conoce las credenciales de la base — el navegador nunca las ve.",
    },
    {
      id: "db",
      label: "Base de datos",
      tech: "Airtable (API REST)",
      detalle: "Clientes, productos, presupuestos e items, todo enlazado por relaciones. Una base por cliente.",
    },
    {
      id: "auto",
      label: "Automatizacion",
      tech: "Make (webhooks + scenarios)",
      detalle: "Genera el PDF desde una plantilla de Google Slides y decide cuando disparar cada aviso, sin intervencion manual.",
    },
    {
      id: "mail",
      label: "Aviso al cliente",
      tech: "Gmail API",
      detalle: "Mail automatico con el presupuesto adjunto, y el estado del registro se actualiza solo para no duplicar envios.",
    },
  ];

  return (
    <section className="border-t" style={{ borderColor: LINE, backgroundColor: "white" }}>
      <div className="max-w-4xl lg:max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-14 sm:py-20">
        <p className="text-[11px] tracking-[0.18em] uppercase font-semibold mb-2" style={{ color: SLATE }}>
          Paso 2
        </p>
        <h2 className="text-[24px] sm:text-[30px] font-bold mb-3" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
          Como funciona por adentro
        </h2>
        <p className="text-[14px] max-w-xl mb-10" style={{ color: SLATE }}>
          Cada presupuesto recorre esta misma caneria, sin que nadie tenga que
          tocar nada a mano en el medio. Toca cada tramo para ver la pieza tecnica
          que lo resuelve.
        </p>

        <div className="overflow-x-auto pb-2 -mx-5 px-5 sm:mx-0 sm:px-0">
          <div className="flex items-center min-w-[720px] sm:min-w-0">
            {pasos.map(function (paso, i) {
              return (
                <React.Fragment key={paso.id}>
                  <button
                    onClick={function () {
                      setPasoActivo(pasoActivo === paso.id ? null : paso.id);
                    }}
                    className="flex flex-col items-center gap-2 shrink-0 group"
                    style={{ width: 128 }}
                  >
                    <div
                      className="w-16 h-16 rounded-md border-2 flex items-center justify-center text-[11px] font-bold transition-colors"
                      style={{
                        borderColor: pasoActivo === paso.id ? BRASS : INK,
                        backgroundColor: pasoActivo === paso.id ? BRASS : "white",
                        color: pasoActivo === paso.id ? "white" : INK,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <span className="text-[12.5px] font-semibold text-center" style={{ color: INK }}>
                      {paso.label}
                    </span>
                  </button>

                  {i < pasos.length - 1 && <Codo />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="mt-6 min-h-[64px]">
          {pasoActivo ? (
            <div
              className="rounded-md px-4 py-3.5 border-l-4 inline-block max-w-lg"
              style={{ borderColor: BRASS, backgroundColor: PAPER }}
            >
              <div
                className="text-[11px] font-bold uppercase tracking-wide mb-1"
                style={{ color: BRASS, fontFamily: "IBM Plex Mono, monospace" }}
              >
                {pasos.find(function (p) { return p.id === pasoActivo; }).tech}
              </div>
              <div className="text-[14px]" style={{ color: "#3A362C" }}>
                {pasos.find(function (p) { return p.id === pasoActivo; }).detalle}
              </div>
            </div>
          ) : (
            <p className="text-[13px]" style={{ color: SLATE }}>
              Ningun tramo seleccionado todavia — toca uno arriba.
            </p>
          )}
        </div>

        {(jiraUrl || githubUrl) && (
          <div
            className="mt-12 pt-8 border-t flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8"
            style={{ borderColor: LINE }}
          >
            <div>
              <p className="text-[13px] font-bold mb-1" style={{ color: INK }}>
                Seguimiento del desarrollo
              </p>
              <p className="text-[13px]" style={{ color: SLATE }}>
                Planificacion, sprints y decisiones tomadas mientras se armaba el sistema.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {jiraUrl && (
                <a
                  href={jiraUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[13px] font-semibold border"
                  style={{ borderColor: INK, color: INK }}
                >
                  <Trello size={15} />
                  Ver tablero de Jira
                  <ExternalLink size={12} />
                </a>
              )}
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[13px] font-semibold border"
                  style={{ borderColor: INK, color: INK }}
                >
                  <Github size={15} />
                  Ver codigo
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Codo() {
  return (
    <svg width="56" height="20" viewBox="0 0 56 20" className="shrink-0 -mt-6">
      <line x1="0" y1="10" x2="56" y2="10" stroke={SLATE} strokeWidth="4" />
      <circle cx="14" cy="10" r="3.5" fill={SLATE} />
      <circle cx="42" cy="10" r="3.5" fill={SLATE} />
    </svg>
  );
}

function Footer({ githubUrl, contactoEmail }) {
  return (
    <footer className="border-t" style={{ borderColor: LINE }}>
      <div className="max-w-4xl lg:max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-[13px]" style={{ color: SLATE }}>
          Sistema armado a medida, modulo por modulo. Cañuelas, Buenos Aires.
        </p>
        <div className="flex items-center gap-4">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[13px] font-semibold"
              style={{ color: INK }}
            >
              <Github size={16} />
              Codigo
            </a>
          )}
          {contactoEmail && (
            <a
              href={"mailto:" + contactoEmail}
              className="flex items-center gap-1.5 text-[13px] font-semibold"
              style={{ color: INK }}
            >
              <Mail size={16} />
              Contacto
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
