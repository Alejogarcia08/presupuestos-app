import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserRound, ChevronRight } from "lucide-react";
import { listarPacientes, listarTurnos } from "../lib/airtable.js";

function fmtFecha(iso) {
  if (!iso) return "";
  var d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Pacientes({ airtableBaseId, turnoSlug, nombrePyme, colorPrimario = "#1E2A38" }) {
  const [pacientes, setPacientes] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(function () {
    setCargando(true);
    Promise.all([listarPacientes(airtableBaseId), listarTurnos(airtableBaseId)]).then(function (res) {
      setPacientes(res[0]);
      setTurnos(res[1]);
      setCargando(false);
    });
  }, [airtableBaseId]);

  // Para cada paciente: cuantas sesiones tuvo y cual fue la mas reciente
  var resumenPorPaciente = {};
  turnos.forEach(function (t) {
    if (!t.pacienteId) return;
    if (!resumenPorPaciente[t.pacienteId]) {
      resumenPorPaciente[t.pacienteId] = { cantidad: 0, ultimaFecha: "" };
    }
    resumenPorPaciente[t.pacienteId].cantidad += 1;
    if (t.fecha > resumenPorPaciente[t.pacienteId].ultimaFecha) {
      resumenPorPaciente[t.pacienteId].ultimaFecha = t.fecha;
    }
  });

  var pacientesOrdenados = pacientes.slice().sort(function (a, b) {
    var fa = (resumenPorPaciente[a.id] && resumenPorPaciente[a.id].ultimaFecha) || "";
    var fb = (resumenPorPaciente[b.id] && resumenPorPaciente[b.id].ultimaFecha) || "";
    if (fa === fb) return a.nombre.localeCompare(b.nombre);
    return fb.localeCompare(fa);
  });

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#1E2A38]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-8 sm:py-10 lg:max-w-3xl lg:my-14 lg:bg-white lg:border lg:border-[#D9D2C2] lg:rounded-xl lg:shadow-sm lg:px-14 lg:py-12">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#8A8371] font-semibold mb-1 pr-14 sm:pr-0">
          {nombrePyme}
        </p>
        <h1 className="text-[26px] sm:text-[28px] leading-tight font-bold mb-2" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
          Pacientes
        </h1>
        <p className="text-[13px] text-[#8A8371] mb-8">
          Toca un paciente para ver su historial completo de sesiones.
        </p>

        {cargando ? (
          <p className="text-[13px] text-[#8A8371]">Cargando...</p>
        ) : pacientesOrdenados.length === 0 ? (
          <p className="text-[13px] text-[#8A8371]">Todavia no hay pacientes cargados.</p>
        ) : (
          <div className="space-y-2.5">
            {pacientesOrdenados.map(function (p) {
              var resumen = resumenPorPaciente[p.id];
              return (
                <Link
                  key={p.id}
                  to={"/turnos/" + turnoSlug + "/pacientes/" + p.id}
                  className="flex items-center justify-between bg-white border border-[#D9D2C2] rounded-md px-4 py-3.5 hover:border-[#B08650] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "#F4F2ED", color: colorPrimario }}
                    >
                      <UserRound size={17} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold truncate">{p.nombre}</div>
                      <div className="text-[12px] text-[#8A8371]">
                        {resumen
                          ? resumen.cantidad + (resumen.cantidad === 1 ? " sesion" : " sesiones") + " · Ultima: " + fmtFecha(resumen.ultimaFecha)
                          : "Sin sesiones todavia"}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[#8A8371] shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
