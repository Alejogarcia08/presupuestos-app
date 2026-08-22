import React, { useEffect, useState } from "react";
import { AlertCircle, MessageCircle, Mail } from "lucide-react";
import { listarClientes } from "../lib/airtable.js";

function formatearFecha(iso) {
  if (!iso) return "Sin presupuestos todavía";
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Devuelve el link completo de WhatsApp (wa.me) a partir del teléfono,
// quitando espacios, guiones y paréntesis. No agrega código de país
// automático — asume que el teléfono ya está guardado con el formato que
// use tu padre.
function urlWhatsapp(telefono) {
  var soloNumeros = telefono.replace(/[^0-9]/g, "");
  return "https://wa.me/" + soloNumeros;
}

function urlMail(email) {
  return "mailto:" + email;
}

export default function ClientesARevisar({ airtableBaseId, nombrePyme, colorPrimario = "#1E2A38" }) {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    listarClientes(airtableBaseId).then((data) => {
      if (!activo) return;
      setClientes(data);
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [airtableBaseId]);

  const paraRevisar = clientes.filter((c) => c.estadoCliente === "Inactivo");

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#1E2A38]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-10 lg:max-w-3xl lg:my-14 lg:bg-white lg:border lg:border-[#D9D2C2] lg:rounded-xl lg:shadow-sm lg:px-14 lg:py-12">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#8A8371] font-semibold mb-1 pr-14 sm:pr-0">
          {nombrePyme}
        </p>
        <h1 className="text-[28px] leading-tight font-bold mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Clientes a revisar
        </h1>
        <p className="text-[13px] text-[#8A8371] mb-8">
          Clientes sin trabajos nuevos hace más de 3 meses — capaz les convenga escribirles.
        </p>

        {cargando ? (
          <p className="text-[14px] text-[#8A8371]">Cargando…</p>
        ) : paraRevisar.length === 0 ? (
          <div className="bg-white border border-[#D9D2C2] rounded-md px-5 py-8 text-center">
            <p className="text-[14px] text-[#8A8371]">
              Por ahora no hay clientes para revisar. 👍
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paraRevisar.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-[#D9D2C2] rounded-md px-4 sm:px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="mt-0.5 text-[#B0876B]" />
                  <div>
                    <div className="text-[15px] font-semibold">{c.nombre}</div>
                    {c.empresa && <div className="text-[12px] text-[#8A8371]">{c.empresa}</div>}
                    <div className="text-[12px] text-[#8A8371] mt-0.5">
                      Último trabajo: {formatearFecha(c.ultimaInteraccion)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {c.telefono && (
                    <a
                      href={urlWhatsapp(c.telefono)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-semibold bg-[#E4F0EA] text-[#3C7A5C]"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  )}
                  {c.email && (
                    <a
                      href={urlMail(c.email)}
                      className="flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-semibold"
                      style={{ backgroundColor: "#F4F2ED", color: colorPrimario }}
                    >
                      <Mail size={14} /> Mail
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
