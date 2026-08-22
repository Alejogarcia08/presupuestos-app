import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserRound, ChevronRight, Trash2 } from "lucide-react";
import { listarPacientes, listarTurnos, eliminarPaciente } from "../lib/airtable.js";
import Toast from "./Toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

function fmtFecha(iso) {
  if (!iso) return "";
  var d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Pacientes({ airtableBaseId, turnoSlug, nombrePyme, colorPrimario = "#1E2A38" }) {
  const [pacientes, setPacientes] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeToast, setMensajeToast] = useState("");
  const [mostrarToast, setMostrarToast] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);

  async function cargarTodo() {
    setCargando(true);
    var [pac, tur] = await Promise.all([listarPacientes(airtableBaseId), listarTurnos(airtableBaseId)]);
    setPacientes(pac);
    setTurnos(tur);
    setCargando(false);
  }

  useEffect(function () {
    cargarTodo();
  }, [airtableBaseId]);

  function mostrarConfirmacion(texto) {
    setMensajeToast(texto);
    setMostrarToast(true);
    setTimeout(function () {
      setMostrarToast(false);
    }, 3000);
  }

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

  function pedirEliminar(p, e) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmacion({
      titulo: "Eliminar paciente",
      mensaje:
        '"' +
        p.nombre +
        '" se va a borrar de forma permanente. Si tiene turnos cargados, quedan sin paciente asociado.',
      onConfirmar: async function () {
        setConfirmacion(null);
        try {
          await eliminarPaciente(airtableBaseId, p.id);
          setPacientes(function (prev) {
            return prev.filter(function (x) {
              return x.id !== p.id;
            });
          });
          mostrarConfirmacion('"' + p.nombre + '" eliminado');
        } catch (err) {
          mostrarConfirmacion("No se pudo eliminar, intenta de nuevo");
        }
      },
    });
  }

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
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={function (e) {
                        pedirEliminar(p, e);
                      }}
                      className="p-2 rounded-md text-[#B0876B] hover:bg-[#F4F2ED]"
                      aria-label="Eliminar paciente"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} className="text-[#8A8371]" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Toast mensaje={mensajeToast} visible={mostrarToast} colorPrimario={colorPrimario} />
      <ConfirmDialog
        abierto={!!confirmacion}
        titulo={confirmacion ? confirmacion.titulo : ""}
        mensaje={confirmacion ? confirmacion.mensaje : ""}
        colorPrimario={colorPrimario}
        onConfirmar={confirmacion ? confirmacion.onConfirmar : function () {}}
        onCancelar={function () {
          setConfirmacion(null);
        }}
      />
    </div>
  );
}