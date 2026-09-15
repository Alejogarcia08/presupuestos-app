import React, { useEffect, useState } from "react";
import { Star, MessageCircle, Mail, Check } from "lucide-react";
import { listarPacientes, listarTurnos, marcarResenaSolicitada } from "../lib/airtable.js";
import Toast from "./Toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

function fmtFecha(iso) {
  if (!iso) return "";
  var d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function urlWhatsapp(telefono, mensaje) {
  var soloNumeros = (telefono || "").replace(/[^0-9]/g, "");
  return "https://wa.me/" + soloNumeros + "?text=" + encodeURIComponent(mensaje || "");
}

export default function Fidelizacion({ airtableBaseId, nombrePyme, colorPrimario = "#1E2A38", linkResenaGoogle }) {
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

  var pacientesPorId = {};
  pacientes.forEach(function (p) {
    pacientesPorId[p.id] = p;
  });

  var pendientes = turnos
    .filter(function (t) {
      return t.estado === "Realizado" && !t.resenaSolicitada;
    })
    .sort(function (a, b) {
      return b.fecha.localeCompare(a.fecha);
    });

  async function marcarPedida(t) {
    await marcarResenaSolicitada(airtableBaseId, t.id);
    setTurnos(function (prev) {
      return prev.map(function (x) {
        return x.id === t.id ? Object.assign({}, x, { resenaSolicitada: true }) : x;
      });
    });
    mostrarConfirmacion("Marcado como pedido");
  }

  function armarMensaje(paciente) {
    var base = "Hola " + paciente.nombre + "! Espero que haya salido todo bien. Si tenes un minuto, nos ayudaria muchisimo que nos dejes una reseña.";
    if (linkResenaGoogle) {
      base += " " + linkResenaGoogle;
    }
    return base;
  }

  function pedirConfirmacionWhatsapp(t, paciente, mensaje) {
    setConfirmacion({
      titulo: "Pedir reseña por WhatsApp",
      mensaje: "Se va a abrir WhatsApp para escribirle a " + paciente.nombre + ", y va a quedar marcado como ya pedido. Continuar?",
      onConfirmar: function () {
        setConfirmacion(null);
        window.open(urlWhatsapp(paciente.telefono, mensaje), "_blank");
        marcarPedida(t);
      },
    });
  }

  function pedirConfirmacionMail(t, paciente, mensaje) {
    setConfirmacion({
      titulo: "Pedir reseña por mail",
      mensaje: "Se va a abrir tu programa de mail para escribirle a " + paciente.nombre + ", y va a quedar marcado como ya pedido. Continuar?",
      onConfirmar: function () {
        setConfirmacion(null);
        window.location.href =
          "mailto:" +
          paciente.email +
          "?subject=" +
          encodeURIComponent("Que tal fue tu sesion?") +
          "&body=" +
          encodeURIComponent(mensaje);
        marcarPedida(t);
      },
    });
  }

  function pedirConfirmacionManual(t, paciente) {
    setConfirmacion({
      titulo: "Marcar como ya pedido",
      mensaje: "Vas a marcar que ya le pediste la reseña a " + paciente.nombre + " en persona. Esto no se puede deshacer. Continuar?",
      onConfirmar: function () {
        setConfirmacion(null);
        marcarPedida(t);
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
          Fidelizacion
        </h1>
        <p className="text-[13px] text-[#8A8371] mb-8">
          Sesiones terminadas a las que todavia no les pediste una reseña.
        </p>

        {!linkResenaGoogle && (
          <div className="bg-[#FBF7EE] border border-[#E4D3B8] rounded-md px-4 py-3 mb-6">
            <p className="text-[12px] text-[#8A6423]">
              Todavia no configuraste el link de reseña en clientesTurnos.js. Los mensajes van a
              salir sin el link hasta que lo agregues.
            </p>
          </div>
        )}

        {cargando ? (
          <p className="text-[13px] text-[#8A8371]">Cargando...</p>
        ) : pendientes.length === 0 ? (
          <div className="bg-white border border-[#D9D2C2] rounded-md px-5 py-8 text-center">
            <p className="text-[14px] text-[#8A8371]">Por ahora no hay nadie pendiente de pedirle reseña.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendientes.map(function (t) {
              var paciente = pacientesPorId[t.pacienteId];
              if (!paciente) return null;
              var mensaje = armarMensaje(paciente);

              return (
                <div key={t.id} className="bg-white border border-[#D9D2C2] rounded-md px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="text-[14px] font-semibold">{paciente.nombre}</div>
                      <div className="text-[12px] text-[#8A8371]">Sesion del {fmtFecha(t.fecha)}</div>
                    </div>
                    <Star size={16} style={{ color: "#B08650" }} className="shrink-0 mt-0.5" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {paciente.telefono && (
                      <button
                        onClick={function () {
                          pedirConfirmacionWhatsapp(t, paciente, mensaje);
                        }}
                        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold bg-[#E4F0EA] text-[#3C7A5C]"
                      >
                        <MessageCircle size={13} /> Pedir por WhatsApp
                      </button>
                    )}
                    {paciente.email && (
                      <button
                        onClick={function () {
                          pedirConfirmacionMail(t, paciente, mensaje);
                        }}
                        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold"
                        style={{ backgroundColor: "#F4F2ED", color: colorPrimario }}
                      >
                        <Mail size={13} /> Pedir por mail
                      </button>
                    )}
                    <button
                      onClick={function () {
                        pedirConfirmacionManual(t, paciente);
                      }}
                      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold"
                      style={{ backgroundColor: "#F4F2ED", color: "#8A8371" }}
                    >
                      <Check size={13} /> Ya se lo pedi (en persona)
                    </button>
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
