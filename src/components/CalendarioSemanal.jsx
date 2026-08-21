import React from "react";
import { Link } from "react-router-dom";
import { Repeat } from "lucide-react";

var DIAS_CORTO = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
var HORA_INICIO = 8; // 08:00
var HORA_FIN = 20; // 20:00
var ALTO_HORA = 68; // px por cada hora en la grilla

function lunesDeEstaSemana() {
  var hoy = new Date();
  var diaSemana = hoy.getDay();
  var offset = diaSemana === 0 ? -6 : 1 - diaSemana;
  var lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + offset);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

function formatoFechaISO(d) {
  return d.toISOString().slice(0, 10);
}

function horaAMinutos(horaStr) {
  var partes = (horaStr || "0:0").split(":");
  return parseInt(partes[0], 10) * 60 + parseInt(partes[1] || "0", 10);
}

export default function CalendarioSemanal({ turnos, pacientesPorId, colorPrimario, turnoSlug }) {
  var lunes = lunesDeEstaSemana();
  var hoyISO = formatoFechaISO(new Date());

  var diasDeLaSemana = DIAS_CORTO.map(function (corto, i) {
    var fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    return { corto, iso: formatoFechaISO(fecha), numero: fecha.getDate() };
  });

  var horas = [];
  for (var h = HORA_INICIO; h <= HORA_FIN; h++) {
    horas.push(h);
  }
  var alturaTotal = (HORA_FIN - HORA_INICIO) * ALTO_HORA;

  function turnosDelDia(iso) {
    return turnos.filter(function (t) {
      return t.fecha === iso && t.estado !== "Cancelado" && t.estado !== "Realizado";
    });
  }

  function Bloque({ t }) {
    var paciente = pacientesPorId[t.pacienteId];
    if (!paciente) return null;
    var minutos = horaAMinutos(t.hora);
    var minutosDesdeInicio = minutos - HORA_INICIO * 60;
    var top = (minutosDesdeInicio / 60) * ALTO_HORA;
    if (top < 0 || top > alturaTotal) return null;

    return (
      <Link
        to={"/turnos/" + turnoSlug + "/pacientes/" + paciente.id}
        title={t.esRecurrente ? paciente.nombre + " — se repite todas las semanas a esta hora" : paciente.nombre}
        className="absolute left-0.5 right-0.5 rounded-md px-2 py-1.5 overflow-hidden hover:brightness-95 transition shadow-sm"
        style={{
          top: top + 2,
          height: 58,
          backgroundColor: t.esRecurrente ? "#F0DFC0" : "#DEE6EE",
          borderLeft: "4px solid " + (t.esRecurrente ? "#B08650" : colorPrimario),
          zIndex: 5,
        }}
      >
        <div className="flex items-center justify-between gap-1">
          <div
            className="text-[11px] font-bold leading-tight"
            style={{ fontFamily: "IBM Plex Mono, monospace", color: colorPrimario }}
          >
            {t.hora}
          </div>
          {t.esRecurrente && <Repeat size={12} className="shrink-0" style={{ color: "#8A6423" }} />}
        </div>
        <div className="text-[13px] font-semibold leading-tight truncate mt-0.5">{paciente.nombre}</div>
      </Link>
    );
  }

  return (
    <div>
      {/* DESKTOP / TABLET: grilla horaria tradicional */}
      <div className="hidden md:block border border-[#D9D2C2] rounded-lg overflow-hidden bg-white">
        <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
          <div className="border-b border-r border-[#D9D2C2]" />
          {diasDeLaSemana.map(function (dia) {
            var esHoy = dia.iso === hoyISO;
            return (
              <div
                key={dia.iso}
                className="text-center py-2 border-b border-r last:border-r-0 border-[#D9D2C2]"
                style={{ backgroundColor: esHoy ? "#FBF7EE" : "#F4F2ED" }}
              >
                <div
                  className="text-[13px] font-bold uppercase tracking-wide"
                  style={{ color: esHoy ? "#B08650" : "#1E2A38" }}
                >
                  {dia.corto} {dia.numero}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
          {/* Columna de horas */}
          <div className="relative border-r border-[#D9D2C2]" style={{ height: alturaTotal }}>
            {horas.slice(0, -1).map(function (h, i) {
              return (
                <div
                  key={h}
                  className="absolute right-1 text-[12px] font-semibold text-[#8A8371]"
                  style={{ top: i * ALTO_HORA - 6 }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              );
            })}
          </div>

          {/* Columnas de dias */}
          {diasDeLaSemana.map(function (dia) {
            var esHoy = dia.iso === hoyISO;
            var turnosDia = turnosDelDia(dia.iso);
            return (
              <div
                key={dia.iso}
                className="relative border-r last:border-r-0 border-[#D9D2C2]"
                style={{ height: alturaTotal, backgroundColor: esHoy ? "#FBF7EE" : "white" }}
              >
                {horas.slice(0, -1).map(function (h, i) {
                  return (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-[#F1EEE6]"
                      style={{ top: i * ALTO_HORA }}
                    />
                  );
                })}
                {turnosDia.map(function (t) {
                  return <Bloque key={t.id} t={t} />;
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE: lista de dias plegable (la grilla horaria no entra comoda en pantalla chica) */}
      <div className="md:hidden space-y-2">
        {diasDeLaSemana.map(function (dia) {
          var esHoy = dia.iso === hoyISO;
          var turnosDia = turnosDelDia(dia.iso).sort(function (a, b) {
            return a.hora.localeCompare(b.hora);
          });
          if (turnosDia.length === 0) return null;
          return (
            <div
              key={dia.iso}
              className="rounded-lg overflow-hidden"
              style={{ border: esHoy ? "1.5px solid #B08650" : "1px solid #D9D2C2" }}
            >
              <div
                className="px-4 py-2.5 text-[13px] font-bold"
                style={{ backgroundColor: esHoy ? "#FBF7EE" : "#F4F2ED", color: esHoy ? "#B08650" : "#1E2A38" }}
              >
                {dia.corto} {dia.numero}
                {esHoy ? " — Hoy" : ""}
              </div>
              {turnosDia.map(function (t) {
                var paciente = pacientesPorId[t.pacienteId];
                if (!paciente) return null;
                return (
                  <Link
                    key={t.id}
                    to={"/turnos/" + turnoSlug + "/pacientes/" + paciente.id}
                    className="flex items-center gap-3 px-4 py-3 hover:brightness-95 transition-colors border-t border-[#F1EEE6]"
                    style={{ backgroundColor: t.esRecurrente ? "#F0DFC0" : "transparent" }}
                  >
                    <span
                      className="text-[13px] font-bold shrink-0 w-12"
                      style={{ fontFamily: "IBM Plex Mono, monospace", color: colorPrimario }}
                    >
                      {t.hora}
                    </span>
                    <span className="text-[14px] font-medium truncate flex-1">{paciente.nombre}</span>
                    {t.esRecurrente && <Repeat size={13} className="shrink-0" style={{ color: "#8A6423" }} />}
                  </Link>
                );
              })}
            </div>
          );
        })}
        {diasDeLaSemana.every(function (d) {
          return turnosDelDia(d.iso).length === 0;
        }) && <p className="text-[13px] text-[#8A8371]">No hay turnos esta semana.</p>}
      </div>
    </div>
  );
}
