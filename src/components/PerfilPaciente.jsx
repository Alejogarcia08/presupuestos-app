import React, { useEffect, useState } from "react";
import { UserRound, Plus, Phone, Mail, Repeat, Pencil, X, Trash2, CheckSquare, Square } from "lucide-react";
import {
  listarPacientes,
  listarTurnos,
  crearTurno,
  actualizarEstadoTurno,
  reprogramarTurno,
  eliminarTurno,
  listarTurnosRecurrentes,
  crearTurnoRecurrente,
  actualizarActivoTurnoRecurrente,
} from "../lib/airtable.js";
import Toast from "./Toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

var DIAS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

function fmtFecha(iso) {
  if (!iso) return "";
  var d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function diaSemanaDeFecha(iso) {
  if (!iso) return DIAS[0];
  var d = new Date(iso + "T00:00:00");
  var idx = (d.getDay() + 6) % 7; // 0=lunes
  return DIAS[idx];
}

var COLOR_ESTADO = {
  Realizado: { bg: "#E4F0EA", color: "#3C7A5C" },
  Confirmado: { bg: "#F4F2ED", color: "#8A8371" },
  Cancelado: { bg: "#F7E9E6", color: "#A0432E" },
};

export default function PerfilPaciente({ airtableBaseId, pacienteId, nombrePyme, colorPrimario = "#1E2A38" }) {
  const [paciente, setPaciente] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [reglaRecurrente, setReglaRecurrente] = useState(null);
  const [cargando, setCargando] = useState(true);

  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [formRecurrenteAbierto, setFormRecurrenteAbierto] = useState(false);
  const [diaRecurrente, setDiaRecurrente] = useState(DIAS[0]);
  const [horaRecurrente, setHoraRecurrente] = useState("18:00");
  const [desdeRecurrente, setDesdeRecurrente] = useState("");
  const [guardandoRecurrente, setGuardandoRecurrente] = useState(false);

  const [mensajeToast, setMensajeToast] = useState("");
  const [mostrarToast, setMostrarToast] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  const [editandoTurnoId, setEditandoTurnoId] = useState(null);
  const [fechaEdicion, setFechaEdicion] = useState("");
  const [horaEdicion, setHoraEdicion] = useState("");
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionados, setSeleccionados] = useState({});

  async function cargarTodo() {
    setCargando(true);
    var [pacientes, todosTurnos, reglas] = await Promise.all([
      listarPacientes(airtableBaseId),
      listarTurnos(airtableBaseId),
      listarTurnosRecurrentes(airtableBaseId),
    ]);
    var encontrado = pacientes.find(function (p) {
      return p.id === pacienteId;
    });
    setPaciente(encontrado || null);

    var deEstePaciente = todosTurnos
      .filter(function (t) {
        return t.pacienteId === pacienteId;
      })
      .sort(function (a, b) {
        return b.fecha.localeCompare(a.fecha);
      });

    // Mismo auto-marcado que en la pantalla de Turnos: si una sesion
    // confirmada ya paso de horario, la damos por realizada sola.
    var ahora = new Date();
    var vencidos = deEstePaciente.filter(function (t) {
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
      deEstePaciente = deEstePaciente.map(function (t) {
        var estabaVencido = vencidos.some(function (v) {
          return v.id === t.id;
        });
        return estabaVencido ? Object.assign({}, t, { estado: "Realizado" }) : t;
      });
    }

    setTurnos(deEstePaciente);

    var reglaDeEstePaciente = reglas.find(function (r) {
      return r.pacienteId === pacienteId && r.activo;
    });
    setReglaRecurrente(reglaDeEstePaciente || null);

    // Precompletamos el form de recurrencia con el dia/hora de la ultima sesion
    if (deEstePaciente.length > 0) {
      setDiaRecurrente(diaSemanaDeFecha(deEstePaciente[0].fecha));
      setHoraRecurrente(deEstePaciente[0].hora || "18:00");
    }

    setCargando(false);
  }

  useEffect(function () {
    cargarTodo();
  }, [airtableBaseId, pacienteId]);

  function mostrarConfirmacion(texto) {
    setMensajeToast(texto);
    setMostrarToast(true);
    setTimeout(function () {
      setMostrarToast(false);
    }, 3000);
  }

  async function agendarSesion() {
    if (!fecha || !hora) return;
    setGuardando(true);
    await crearTurno(airtableBaseId, { pacienteId, fecha, hora, notas });
    await cargarTodo();
    setFecha("");
    setHora("");
    setNotas("");
    setGuardando(false);
    mostrarConfirmacion("Sesion agendada");
  }

  async function activarRecurrencia() {
    if (!desdeRecurrente) return;
    setGuardandoRecurrente(true);
    await crearTurnoRecurrente(airtableBaseId, {
      pacienteId,
      diaSemana: diaRecurrente,
      hora: horaRecurrente,
      fechaInicio: desdeRecurrente,
    });
    await cargarTodo();
    setFormRecurrenteAbierto(false);
    setGuardandoRecurrente(false);
    mostrarConfirmacion("Repeticion semanal activada");
  }

  async function desactivarRecurrencia() {
    if (!reglaRecurrente) return;
    await actualizarActivoTurnoRecurrente(airtableBaseId, reglaRecurrente.id, false);
    await cargarTodo();
    mostrarConfirmacion("Repeticion desactivada");
  }

  function pedirCancelarSesion(t) {
    setConfirmacion({
      titulo: "Cancelar sesion",
      mensaje: "La sesion del " + fmtFecha(t.fecha) + " a las " + t.hora + " va a quedar marcada como cancelada. Estas seguro?",
      onConfirmar: async function () {
        setConfirmacion(null);
        await actualizarEstadoTurno(airtableBaseId, t.id, "Cancelado");
        await cargarTodo();
        mostrarConfirmacion("Sesion cancelada");
      },
    });
  }

  function abrirEdicionFecha(t) {
    setEditandoTurnoId(t.id);
    setFechaEdicion(t.fecha);
    setHoraEdicion(t.hora);
  }

  async function guardarNuevaFecha(t) {
    if (!fechaEdicion || !horaEdicion) return;
    await reprogramarTurno(airtableBaseId, t.id, { fecha: fechaEdicion, hora: horaEdicion });
    await cargarTodo();
    setEditandoTurnoId(null);
    mostrarConfirmacion("Sesion reprogramada");
  }

  function toggleSeleccion(id) {
    setSeleccionados(function (prev) {
      var copia = Object.assign({}, prev);
      if (copia[id]) {
        delete copia[id];
      } else {
        copia[id] = true;
      }
      return copia;
    });
  }

  function cantidadSeleccionados() {
    return Object.keys(seleccionados).length;
  }

  function pedirBorrarSeleccionados() {
    var cantidad = cantidadSeleccionados();
    if (cantidad === 0) return;
    setConfirmacion({
      titulo: "Eliminar sesiones",
      mensaje:
        "Se van a borrar " +
        cantidad +
        (cantidad === 1 ? " sesion" : " sesiones") +
        " del historial de forma permanente. Esto no se puede deshacer.",
      onConfirmar: async function () {
        setConfirmacion(null);
        var ids = Object.keys(seleccionados);
        await Promise.all(
          ids.map(function (id) {
            return eliminarTurno(airtableBaseId, id);
          })
        );
        setSeleccionados({});
        setModoSeleccion(false);
        await cargarTodo();
        mostrarConfirmacion(cantidad + (cantidad === 1 ? " sesion eliminada" : " sesiones eliminadas"));
      },
    });
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F4F2ED] flex items-center justify-center">
        <p className="text-[13px] text-[#8A8371]">Cargando...</p>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="min-h-screen bg-[#F4F2ED] flex items-center justify-center px-6">
        <p className="text-[14px] text-[#8A8371]">No se encontro este paciente.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#1E2A38]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-8 sm:py-10 lg:max-w-3xl lg:my-14 lg:bg-white lg:border lg:border-[#D9D2C2] lg:rounded-xl lg:shadow-sm lg:px-14 lg:py-12">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#8A8371] font-semibold mb-1 pr-14 sm:pr-0">
          {nombrePyme}
        </p>

        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#F4F2ED", color: colorPrimario }}
          >
            <UserRound size={22} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
              {paciente.nombre}
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              {paciente.telefono && (
                <span className="flex items-center gap-1 text-[12px] text-[#8A8371]">
                  <Phone size={12} /> {paciente.telefono}
                </span>
              )}
              {paciente.email && (
                <span className="flex items-center gap-1 text-[12px] text-[#8A8371]">
                  <Mail size={12} /> {paciente.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bloque de recurrencia: activa, o boton para activarla */}
        {reglaRecurrente ? (
          <div className="bg-[#E4F0EA] rounded-md px-4 py-3.5 mb-6 flex items-center justify-between gap-3">
            <div>
              <div className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: "#3C7A5C" }}>
                <Repeat size={14} />
                Repite todos los {reglaRecurrente.diaSemana.toLowerCase()} a las {reglaRecurrente.hora}
              </div>
              <div className="text-[11px] text-[#8A8371] mt-0.5">
                Se genera un turno nuevo cada semana automaticamente
              </div>
            </div>
            <button
              onClick={desactivarRecurrencia}
              className="text-[11px] font-semibold px-3 py-1.5 rounded shrink-0"
              style={{ backgroundColor: "white", color: "#A0432E" }}
            >
              Desactivar
            </button>
          </div>
        ) : (
          <div className="mb-6">
            {!formRecurrenteAbierto ? (
              <button
                onClick={function () {
                  setFormRecurrenteAbierto(true);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-md py-3 text-[13px] font-semibold border-2 border-dashed"
                style={{ borderColor: "#B08650", color: "#B08650" }}
              >
                <Repeat size={15} />
                Repetir todas las semanas
              </button>
            ) : (
              <div className="bg-[#F4F2ED] rounded-md p-4">
                <p className="text-[12px] font-bold mb-3" style={{ color: "#B08650" }}>
                  Repetir todas las semanas
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-[#8A8371] font-semibold block mb-1">
                      Dia
                    </label>
                    <select
                      value={diaRecurrente}
                      onChange={function (e) {
                        setDiaRecurrente(e.target.value);
                      }}
                      className="w-full border border-[#D9D2C2] rounded px-2.5 py-2 text-[13px] outline-none bg-white"
                    >
                      {DIAS.map(function (d) {
                        return (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wide text-[#8A8371] font-semibold block mb-1">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={horaRecurrente}
                      onChange={function (e) {
                        setHoraRecurrente(e.target.value);
                      }}
                      className="w-full border border-[#D9D2C2] rounded px-2.5 py-2 text-[13px] outline-none bg-white"
                    />
                  </div>
                </div>
                <label className="text-[10px] uppercase tracking-wide text-[#8A8371] font-semibold block mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={desdeRecurrente}
                  onChange={function (e) {
                    setDesdeRecurrente(e.target.value);
                  }}
                  className="w-full border border-[#D9D2C2] rounded px-2.5 py-2 text-[13px] outline-none bg-white mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={activarRecurrencia}
                    disabled={!desdeRecurrente || guardandoRecurrente}
                    className="flex-1 rounded py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
                    style={{ backgroundColor: colorPrimario }}
                  >
                    {guardandoRecurrente ? "..." : "Activar repeticion semanal"}
                  </button>
                  <button
                    onClick={function () {
                      setFormRecurrenteAbierto(false);
                    }}
                    className="px-3 py-2.5 text-[13px] text-[#8A8371]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Agendar una sesion suelta */}
        <div className="bg-[#F4F2ED] rounded-md p-4 mb-8">
          <p className="text-[12px] font-semibold mb-3" style={{ color: colorPrimario }}>
            Agendar sesion puntual
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="date"
              value={fecha}
              onChange={function (e) {
                setFecha(e.target.value);
              }}
              className="border border-[#D9D2C2] rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#B08650] bg-white"
            />
            <input
              type="time"
              value={hora}
              onChange={function (e) {
                setHora(e.target.value);
              }}
              className="border border-[#D9D2C2] rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#B08650] bg-white"
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              value={notas}
              onChange={function (e) {
                setNotas(e.target.value);
              }}
              placeholder="Notas (ej: seguimiento)"
              className="border border-[#D9D2C2] rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#B08650] bg-white"
            />
            <button
              onClick={agendarSesion}
              disabled={!fecha || !hora || guardando}
              className="flex items-center gap-1.5 rounded px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: colorPrimario }}
            >
              <Plus size={15} />
              {guardando ? "..." : "Agendar"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold">Historia de sesiones</h2>
          {turnos.length > 0 && (
            <div className="flex items-center gap-2">
              {modoSeleccion && cantidadSeleccionados() > 0 && (
                <button
                  onClick={pedirBorrarSeleccionados}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded"
                  style={{ backgroundColor: "#F7E9E6", color: "#A0432E" }}
                >
                  <Trash2 size={12} /> Borrar ({cantidadSeleccionados()})
                </button>
              )}
              <button
                onClick={function () {
                  setModoSeleccion(function (v) {
                    return !v;
                  });
                  setSeleccionados({});
                }}
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded"
                style={{ backgroundColor: "#F4F2ED", color: colorPrimario }}
              >
                {modoSeleccion ? "Cancelar" : "Seleccionar"}
              </button>
            </div>
          )}
        </div>
        {turnos.length === 0 ? (
          <p className="text-[13px] text-[#8A8371]">Todavia no hay sesiones registradas.</p>
        ) : (
          <div className="space-y-2.5">
            {turnos.map(function (t) {
              var estilo = COLOR_ESTADO[t.estado] || COLOR_ESTADO.Confirmado;
              var editando = editandoTurnoId === t.id;
              var estaSeleccionado = !!seleccionados[t.id];
              return (
                <div
                  key={t.id}
                  className="bg-white border rounded-md px-4 py-3.5 flex gap-3"
                  style={{ borderColor: estaSeleccionado ? "#B08650" : "#D9D2C2" }}
                >
                  {modoSeleccion && !editando && (
                    <button
                      onClick={function () {
                        toggleSeleccion(t.id);
                      }}
                      className="shrink-0 mt-0.5"
                      style={{ color: estaSeleccionado ? "#B08650" : "#B0AA9A" }}
                    >
                      {estaSeleccionado ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                  {editando ? (
                    <div>
                      <p className="text-[12px] font-semibold mb-2" style={{ color: colorPrimario }}>
                        Cambiar fecha y hora
                      </p>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="date"
                          value={fechaEdicion}
                          onChange={function (e) {
                            setFechaEdicion(e.target.value);
                          }}
                          className="border border-[#D9D2C2] rounded px-2.5 py-2 text-[13px] outline-none"
                        />
                        <input
                          type="time"
                          value={horaEdicion}
                          onChange={function (e) {
                            setHoraEdicion(e.target.value);
                          }}
                          className="border border-[#D9D2C2] rounded px-2.5 py-2 text-[13px] outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={function () {
                            guardarNuevaFecha(t);
                          }}
                          className="flex-1 rounded py-2 text-[12px] font-semibold text-white"
                          style={{ backgroundColor: colorPrimario }}
                        >
                          Guardar
                        </button>
                        <button
                          onClick={function () {
                            setEditandoTurnoId(null);
                          }}
                          className="px-3 py-2 text-[12px] text-[#8A8371]"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="text-[14px] font-semibold capitalize">
                          {fmtFecha(t.fecha)} · {t.hora}
                        </div>
                        <span
                          className="text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded shrink-0"
                          style={{ backgroundColor: estilo.bg, color: estilo.color }}
                        >
                          {t.estado}
                        </span>
                      </div>
                      {t.notas && <p className="text-[13px] text-[#5A5647] mb-2">{t.notas}</p>}

                      {t.estado === "Confirmado" && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={function () {
                              abrirEdicionFecha(t);
                            }}
                            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded"
                            style={{ backgroundColor: "#F4F2ED", color: colorPrimario }}
                          >
                            <Pencil size={11} /> Cambiar fecha
                          </button>
                          <button
                            onClick={function () {
                              pedirCancelarSesion(t);
                            }}
                            className="text-[11px] font-semibold px-2.5 py-1.5 rounded"
                            style={{ backgroundColor: "#F7E9E6", color: "#A0432E" }}
                          >
                            Cancelar sesion
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  </div>
                </div>
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
