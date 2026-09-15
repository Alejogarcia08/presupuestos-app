import React, { useEffect, useState } from "react";
import { UserRound, Plus, Pencil, Trash2, X, Phone, Mail } from "lucide-react";
import { listarConductores, crearConductor, actualizarConductor, eliminarConductor } from "../lib/airtable.js";
import Toast from "./Toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

function fmtFecha(iso) {
  if (!iso) return "";
  var d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function diasHasta(iso) {
  if (!iso) return null;
  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  var fecha = new Date(iso + "T00:00:00");
  return Math.round((fecha - hoy) / (1000 * 60 * 60 * 24));
}

export default function Conductores({ airtableBaseId, nombrePyme, colorPrimario = "#1E2A38" }) {
  const [conductores, setConductores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeToast, setMensajeToast] = useState("");
  const [mostrarToast, setMostrarToast] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);

  // formConductor: null | "nuevo" | { id, ... }
  const [formConductor, setFormConductor] = useState(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [licenciaNumero, setLicenciaNumero] = useState("");
  const [licenciaVencimiento, setLicenciaVencimiento] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargarTodo() {
    setCargando(true);
    var data = await listarConductores(airtableBaseId);
    setConductores(data);
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

  function abrirNuevo() {
    setFormConductor("nuevo");
    setNombre("");
    setTelefono("");
    setEmail("");
    setLicenciaNumero("");
    setLicenciaVencimiento("");
  }

  function abrirEditar(c) {
    setFormConductor(c);
    setNombre(c.nombre || "");
    setTelefono(c.telefono || "");
    setEmail(c.email || "");
    setLicenciaNumero(c.licenciaNumero || "");
    setLicenciaVencimiento(c.licenciaVencimiento || "");
  }

  async function guardarForm() {
    if (!nombre.trim()) return;
    setGuardando(true);
    var datos = {
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      licenciaNumero: licenciaNumero.trim(),
      licenciaVencimiento,
    };

    if (formConductor === "nuevo") {
      await crearConductor(airtableBaseId, datos);
      mostrarConfirmacion("Conductor creado");
    } else {
      await actualizarConductor(airtableBaseId, formConductor.id, datos);
      mostrarConfirmacion("Conductor actualizado");
    }
    await cargarTodo();
    setFormConductor(null);
    setGuardando(false);
  }

  function pedirEliminar(c) {
    setConfirmacion({
      titulo: "Eliminar conductor",
      mensaje: '"' + c.nombre + '" se va a borrar de forma permanente.',
      onConfirmar: async function () {
        setConfirmacion(null);
        await eliminarConductor(airtableBaseId, c.id);
        await cargarTodo();
        mostrarConfirmacion('"' + c.nombre + '" eliminado');
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
          Conductores
        </h1>
        <p className="text-[13px] text-[#8A8371] mb-6">Choferes y su documentacion.</p>

        {formConductor === null ? (
          <button
            onClick={abrirNuevo}
            className="w-full flex items-center justify-center gap-2 rounded-md py-3 text-[13px] font-semibold border-2 border-dashed mb-6"
            style={{ borderColor: colorPrimario, color: colorPrimario }}
          >
            <Plus size={16} />
            Agregar conductor
          </button>
        ) : (
          <div className="bg-[#F4F2ED] rounded-md p-4 mb-6">
            <p className="text-[12px] font-semibold mb-3" style={{ color: colorPrimario }}>
              {formConductor === "nuevo" ? "Conductor nuevo" : "Editar conductor"}
            </p>
            <input
              autoFocus
              value={nombre}
              onChange={function (e) {
                setNombre(e.target.value);
              }}
              placeholder="Nombre"
              className="w-full border border-[#D9D2C2] rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#B08650] mb-2 bg-white"
            />
            <input
              type="tel"
              value={telefono}
              onChange={function (e) {
                setTelefono(e.target.value);
              }}
              placeholder="Telefono"
              className="w-full border border-[#D9D2C2] rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#B08650] mb-2 bg-white"
            />
            <input
              type="email"
              value={email}
              onChange={function (e) {
                setEmail(e.target.value);
              }}
              placeholder="Email (opcional)"
              className="w-full border border-[#D9D2C2] rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#B08650] mb-2 bg-white"
            />
            <input
              value={licenciaNumero}
              onChange={function (e) {
                setLicenciaNumero(e.target.value);
              }}
              placeholder="N. de licencia (opcional)"
              className="w-full border border-[#D9D2C2] rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#B08650] mb-2 bg-white"
            />
            <label className="text-[10px] uppercase tracking-wide text-[#8A8371] font-semibold block mb-1">
              Licencia vence
            </label>
            <input
              type="date"
              value={licenciaVencimiento}
              onChange={function (e) {
                setLicenciaVencimiento(e.target.value);
              }}
              className="w-full border border-[#D9D2C2] rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#B08650] mb-3 bg-white"
            />
            <div className="flex gap-2">
              <button
                onClick={guardarForm}
                disabled={!nombre.trim() || guardando}
                className="flex-1 rounded py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: colorPrimario }}
              >
                {guardando ? "..." : "Guardar"}
              </button>
              <button
                onClick={function () {
                  setFormConductor(null);
                }}
                className="px-3 py-2.5 text-[13px] text-[#8A8371]"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {cargando ? (
          <p className="text-[13px] text-[#8A8371]">Cargando...</p>
        ) : conductores.length === 0 ? (
          <div className="bg-white border border-[#D9D2C2] rounded-md px-5 py-8 text-center">
            <p className="text-[14px] text-[#8A8371]">Todavia no hay conductores cargados.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {conductores.map(function (c) {
              var diasLicencia = diasHasta(c.licenciaVencimiento);
              return (
                <div key={c.id} className="bg-white border border-[#D9D2C2] rounded-md px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "#F4F2ED", color: colorPrimario }}
                      >
                        <UserRound size={17} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold truncate">{c.nombre}</div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {c.telefono && (
                            <span className="flex items-center gap-1 text-[11px] text-[#8A8371]">
                              <Phone size={10} /> {c.telefono}
                            </span>
                          )}
                          {c.email && (
                            <span className="flex items-center gap-1 text-[11px] text-[#8A8371]">
                              <Mail size={10} /> {c.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={function () {
                          abrirEditar(c);
                        }}
                        className="p-2 rounded-md text-[#8A8371] hover:bg-[#F4F2ED]"
                        aria-label="Editar conductor"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={function () {
                          pedirEliminar(c);
                        }}
                        className="p-2 rounded-md text-[#B0876B] hover:bg-[#F4F2ED]"
                        aria-label="Eliminar conductor"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  {c.licenciaVencimiento && (
                    <div className="mt-2.5 pt-2.5 border-t border-[#F1EEE6] text-[12px]">
                      <span className="text-[#8A8371]">Licencia vence: </span>
                      <span
                        className="font-semibold"
                        style={{
                          color:
                            diasLicencia !== null && diasLicencia <= 30 ? "#A0432E" : "#1E2A38",
                        }}
                      >
                        {fmtFecha(c.licenciaVencimiento)}
                        {diasLicencia !== null && diasLicencia < 0 && " (vencida)"}
                      </span>
                    </div>
                  )}
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
