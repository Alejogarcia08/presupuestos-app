import React, { useEffect, useState } from "react";
import { Calendar, Plus, UserPlus, MessageCircle, Check, X, Trash2, Pencil } from "lucide-react";
import {
  listarPacientes,
  crearPaciente,
  actualizarPaciente,
  eliminarPaciente,
  listarTurnos,
  crearTurno,
  actualizarEstadoTurno,
  eliminarTurno,
  listarTurnosRecurrentes,
} from "../lib/airtable.js";
import Toast from "./Toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import CalendarioSemanal from "./CalendarioSemanal.jsx";

function fmtFecha(iso) {
  if (!iso) return "";
  var d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function urlWhatsapp(telefono, mensaje) {
  var soloNumeros = (telefono || "").replace(/[^0-9]/g, "");
  return "https://wa.me/" + soloNumeros + "?text=" + encodeURIComponent(mensaje || "");
}

export default function Turnos({ airtableBaseId, turnoSlug, nombrePyme, colorPrimario = "#1E2A38" }) {
  const [pacientes, setPacientes] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [pacienteId, setPacienteId] = useState("");
  const [pickerAbierto, setPickerAbierto] = useState(false);

  // formPaciente: null (lista) | "nuevo" | { id, ... } (editando uno existente)
  const [formPaciente, setFormPaciente] = useState(null);
  const [formNombre, setFormNombre] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formEmail, setFormEmail] = useState("");

  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [mensajeToast, setMensajeToast] = useState("");
  const [mostrarToast, setMostrarToast] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);

  async function cargarTodo() {
    setCargando(true);
    var [pac, tur, reglas] = await Promise.all([
      listarPacientes(airtableBaseId),
      listarTurnos(airtableBaseId),
      listarTurnosRecurrentes(airtableBaseId),
    ]);
    setPacientes(pac);

    // Reglas activas: si un paciente tiene alguna, se pinta distinto en
    // TODOS sus turnos (no hace falta que coincida dia/hora exacto).
    var reglasActivas = reglas.filter(function (r) {
      return r.activo;
    });
    var pacientesConRecurrenciaActiva = {};
    reglasActivas.forEach(function (r) {
      pacientesConRecurrenciaActiva[r.pacienteId] = true;
    });

    tur = tur.map(function (t) {
      var coincide = !!pacientesConRecurrenciaActiva[t.pacienteId];
      return Object.assign({}, t, { esRecurrente: coincide });
    });

    // Si un turno confirmado ya paso de horario, lo marcamos solo como
    // Realizado (asumimos que se hizo, salvo que alguien lo haya
    // cancelado a mano antes). Esto pasa en silencio, sin pedir nada.
    var ahora = new Date();
    var vencidos = tur.filter(function (t) {
      if (t.estado !== "Confirmado") return false;
      var fechaHora = new Date(t.fecha + "T" + (t.hora || "00:00") + ":00");
      return fechaHora < ahora;
    });

    if (vencidos.length > 0) {
      await Promise.all(
        vencidos.map(function (t) {
          return actualizarEstadoTurno(airtableBaseId, t.id, "Realizado");
        })
      );
      tur = tur.map(function (t) {
        var estabaVencido = vencidos.some(function (v) {
          return v.id === t.id;
        });
        return estabaVencido ? Object.assign({}, t, { estado: "Realizado" }) : t;
      });
    }

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

  var pacientesPorId = {};
  pacientes.forEach(function (p) {
    pacientesPorId[p.id] = p;
  });

  var pacienteSeleccionado = pacientesPorId[pacienteId];

  function abrirNuevoPaciente() {
    setFormPaciente("nuevo");
    setFormNombre("");
    setFormTelefono("");
    setFormEmail("");
  }

  function abrirEditarPaciente(p) {
    setFormPaciente(p);
    setFormNombre(p.nombre || "");
    setFormTelefono(p.telefono || "");
    setFormEmail(p.email || "");
  }

  async function guardarFormPaciente() {
    if (!formNombre.trim()) return;

    if (formPaciente === "nuevo") {
      var nuevo = await crearPaciente(airtableBaseId, {
        nombre: formNombre.trim(),
        telefono: formTelefono.trim(),
        email: formEmail.trim(),
      });
      setPacientes(function (prev) {
        return [...prev, nuevo];
      });
      setPacienteId(nuevo.id);
      mostrarConfirmacion("Paciente creado");
    } else {
      var actualizado = await actualizarPaciente(airtableBaseId, formPaciente.id, {
        nombre: formNombre.trim(),
        telefono: formTelefono.trim(),
        email: formEmail.trim(),
      });
      setPacientes(function (prev) {
        return prev.map(function (x) {
          return x.id === actualizado.id ? actualizado : x;
        });
      });
      mostrarConfirmacion("Paciente actualizado");
    }

    setFormPaciente(null);
    setPickerAbierto(false);
  }

  function pedirEliminarPaciente(p) {
    setConfirmacion({
      titulo: "Eliminar paciente",
      mensaje:
        '"' +
        p.nombre +
        '" se va a borrar de forma permanente. Si tiene turnos cargados, quedan sin paciente asociado.',
      onConfirmar: async function () {
        setConfirmacion(null);
        await eliminarPaciente(airtableBaseId, p.id);
        setPacientes(function (prev) {
          return prev.filter(function (x) {
            return x.id !== p.id;
          });
        });
        if (pacienteId === p.id) setPacienteId("");
        mostrarConfirmacion('"' + p.nombre + '" eliminado');
      },
    });
  }

  async function guardarTurno() {
    if (!pacienteId || !fecha || !hora) return;
    setGuardando(true);
    await crearTurno(airtableBaseId, { pacienteId, fecha, hora, notas });
    await cargarTodo();
    setPacienteId("");
    setFecha("");
    setHora("");
    setNotas("");
    setGuardando(false);
    mostrarConfirmacion("Turno guardado para " + fmtFecha(fecha) + " a las " + hora);
  }

  function pedirCambioEstado(t, nuevoEstado) {
    var paciente = pacientesPorId[t.pacienteId];
    var nombrePaciente = paciente ? paciente.nombre : "el paciente";
    setConfirmacion({
      titulo: nuevoEstado === "Cancelado" ? "Cancelar turno" : "Marcar como realizado",
      mensaje:
        "Turno de " +
        nombrePaciente +
        " el " +
        fmtFecha(t.fecha) +
        " a las " +
        t.hora +
        " — ¿confirmás el cambio a " +
        nuevoEstado.toLowerCase() +
        "?",
      onConfirmar: async function () {
        setConfirmacion(null);
        await actualizarEstadoTurno(airtableBaseId, t.id, nuevoEstado);
        await cargarTodo();
        mostrarConfirmacion("Turno actualizado a " + nuevoEstado.toLowerCase());
      },
    });
  }

  function pedirEliminarTurno(t) {
    var paciente = pacientesPorId[t.pacienteId];
    var nombrePaciente = paciente ? paciente.nombre : "el paciente";
    setConfirmacion({
      titulo: "Eliminar turno",
      mensaje: "Se va a borrar el turno de " + nombrePaciente + " (" + fmtFecha(t.fecha) + ") de forma permanente.",
      onConfirmar: async function () {
        setConfirmacion(null);
        await eliminarTurno(airtableBaseId, t.id);
        await cargarTodo();
        mostrarConfirmacion("Turno eliminado");
      },
    });
  }

  var turnosVisibles = turnos.filter(function (t) {
    return t.estado !== "Cancelado" && t.estado !== "Realizado";
  });

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#1E2A38]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-8 sm:py-10 lg:max-w-5xl lg:my-14 lg:bg-white lg:border lg:border-[#D9D2C2] lg:rounded-xl lg:shadow-sm lg:px-10 lg:py-12">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#8A8371] font-semibold mb-1 pr-14 sm:pr-0">
          {nombrePyme}
        </p>
        <h1 className="text-[26px] sm:text-[28px] leading-tight font-bold mb-2" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
          Nuevo turno
        </h1>
        <p className="text-[13px] text-[#8A8371] mb-8">
          Cargalo despues de hablar con el paciente y decidir la fecha entre los dos.
        </p>

        <div className="lg:max-w-xl lg:mx-auto">
        <label className="text-[11px] tracking-[0.12em] uppercase text-[#8A8371] font-semibold block mb-2">
          Paciente
        </label>
        <div className="relative mb-5">
          <button
            onClick={function () {
              setPickerAbierto(function (v) {
                return !v;
              });
              setFormPaciente(null);
            }}
            className="w-full flex items-center justify-between bg-white border border-[#D9D2C2] rounded-md px-4 py-3.5 text-left hover:border-[#B08650] transition-colors"
          >
            <span className="text-[15px] font-medium">
              {pacienteSeleccionado ? pacienteSeleccionado.nombre : "Seleccionar paciente"}
            </span>
          </button>

          {pickerAbierto && (
            <div className="absolute z-20 mt-1.5 w-full bg-white border border-[#D9D2C2] rounded-md shadow-lg overflow-hidden">
              {formPaciente === null ? (
                <>
                  <div className="max-h-52 overflow-y-auto">
                    {pacientes.length === 0 && (
                      <div className="px-4 py-3 text-[13px] text-[#8A8371]">Todavia no hay pacientes cargados.</div>
                    )}
                    {pacientes.map(function (p) {
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between px-4 py-2.5 hover:bg-[#F4F2ED]"
                        >
                          <button
                            onClick={function () {
                              setPacienteId(p.id);
                              setPickerAbierto(false);
                            }}
                            className="flex-1 flex items-center gap-2 text-left min-w-0"
                          >
                            <span className="text-[14px] font-medium truncate">{p.nombre}</span>
                            {p.id === pacienteId && <Check size={15} className="text-[#3C7A5C] shrink-0" />}
                          </button>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              onClick={function (e) {
                                e.stopPropagation();
                                abrirEditarPaciente(p);
                              }}
                              className="p-1.5 rounded text-[#8A8371] hover:bg-white"
                              aria-label="Editar paciente"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={function (e) {
                                e.stopPropagation();
                                pedirEliminarPaciente(p);
                              }}
                              className="p-1.5 rounded text-[#B0876B] hover:bg-white"
                              aria-label="Eliminar paciente"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={abrirNuevoPaciente}
                    className="w-full flex items-center gap-2 px-4 py-3 border-t border-[#EAE5D9] font-semibold text-[14px] hover:bg-[#FBF7EE]"
                    style={{ color: colorPrimario }}
                  >
                    <UserPlus size={16} />
                    Crear paciente nuevo
                  </button>
                </>
              ) : (
                <div className="p-4 space-y-2.5">
                  <p className="text-[12px] font-semibold" style={{ color: colorPrimario }}>
                    {formPaciente === "nuevo" ? "Paciente nuevo" : "Editar paciente"}
                  </p>
                  <input
                    autoFocus
                    value={formNombre}
                    onChange={function (e) {
                      setFormNombre(e.target.value);
                    }}
                    placeholder="Nombre del paciente"
                    className="w-full border border-[#D9D2C2] rounded px-3 py-2 text-[14px] outline-none focus:border-[#B08650]"
                  />
                  <input
                    type="tel"
                    value={formTelefono}
                    onChange={function (e) {
                      setFormTelefono(e.target.value);
                    }}
                    placeholder="Telefono (para el recordatorio)"
                    className="w-full border border-[#D9D2C2] rounded px-3 py-2 text-[14px] outline-none focus:border-[#B08650]"
                  />
                  <input
                    type="email"
                    value={formEmail}
                    onChange={function (e) {
                      setFormEmail(e.target.value);
                    }}
                    placeholder="Email (opcional)"
                    className="w-full border border-[#D9D2C2] rounded px-3 py-2 text-[14px] outline-none focus:border-[#B08650]"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={guardarFormPaciente}
                      className="flex-1 text-white rounded px-3 py-2 text-[13px] font-semibold"
                      style={{ backgroundColor: colorPrimario }}
                    >
                      Guardar
                    </button>
                    <button
                      onClick={function () {
                        setFormPaciente(null);
                      }}
                      className="px-3 py-2 text-[13px] text-[#8A8371]"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-[11px] tracking-[0.12em] uppercase text-[#8A8371] font-semibold block mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={function (e) {
                setFecha(e.target.value);
              }}
              className="w-full border border-[#D9D2C2] rounded-md px-3 py-3 text-[14px] outline-none focus:border-[#B08650]"
            />
          </div>
          <div>
            <label className="text-[11px] tracking-[0.12em] uppercase text-[#8A8371] font-semibold block mb-2">
              Hora
            </label>
            <input
              type="time"
              value={hora}
              onChange={function (e) {
                setHora(e.target.value);
              }}
              className="w-full border border-[#D9D2C2] rounded-md px-3 py-3 text-[14px] outline-none focus:border-[#B08650]"
            />
          </div>
        </div>

        <label className="text-[11px] tracking-[0.12em] uppercase text-[#8A8371] font-semibold block mb-2">
          Notas (opcional)
        </label>
        <input
          value={notas}
          onChange={function (e) {
            setNotas(e.target.value);
          }}
          placeholder="Ej: primera consulta"
          className="w-full border border-[#D9D2C2] rounded-md px-3 py-3 text-[14px] outline-none focus:border-[#B08650] mb-6"
        />

        <button
          onClick={guardarTurno}
          disabled={!pacienteId || !fecha || !hora || guardando}
          className="w-full flex items-center justify-center gap-2 rounded-md py-3.5 text-[14px] font-semibold text-white disabled:opacity-40 mb-10"
          style={{ backgroundColor: colorPrimario }}
        >
          <Plus size={16} />
          {guardando ? "Guardando..." : "Guardar turno"}
        </button>
        </div>

        <div className="border-t pt-6" style={{ borderColor: "#D9D2C2" }}>
          <h2 className="text-[15px] font-bold mb-4 flex items-center gap-2">
            <Calendar size={16} style={{ color: colorPrimario }} />
            Calendario de la semana
          </h2>

          {cargando ? (
            <p className="text-[13px] text-[#8A8371]">Cargando...</p>
          ) : (
            <CalendarioSemanal
              turnos={turnos}
              pacientesPorId={pacientesPorId}
              colorPrimario={colorPrimario}
              turnoSlug={turnoSlug}
            />
          )}
        </div>
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