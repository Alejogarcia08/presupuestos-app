import React, { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import {
  listarPresupuestos,
  listarClientes,
  marcarCobrado,
  listarItemsPresupuesto,
  eliminarPresupuesto,
} from "../lib/airtable.js";
import Toast from "./Toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

function fmtARS(n) {
  return Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export default function MisPresupuestos({ airtableBaseId, nombrePyme, colorPrimario = "#1E2A38" }) {
  const [presupuestos, setPresupuestos] = useState([]);
  const [clientesPorId, setClientesPorId] = useState({});
  const [cargando, setCargando] = useState(true);
  const [mensajeToast, setMensajeToast] = useState("");
  const [mostrarToast, setMostrarToast] = useState(false);

  const [detalleAbierto, setDetalleAbierto] = useState({});
  const [items, setItems] = useState({});
  const [cargandoDetalle, setCargandoDetalle] = useState({});

  const [confirmacion, setConfirmacion] = useState(null);

  async function cargarTodo() {
    setCargando(true);
    const [pres, clientes] = await Promise.all([
      listarPresupuestos(airtableBaseId),
      listarClientes(airtableBaseId),
    ]);
    const mapa = {};
    clientes.forEach(function (c) {
      mapa[c.id] = c.nombre;
    });
    setClientesPorId(mapa);
    setPresupuestos(pres);
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

  // Esta pantalla es el archivo de los YA cobrados. Los que todavia no se
  // cobraron del todo (nuevos o con pago parcial) viven en "Cobros
  // pendientes", no aca.
  var cobrados = presupuestos.filter(function (p) {
    return p.cobrado;
  });

  function pedirDesmarcar(p) {
    const nombreCliente = clientesPorId[p.clienteId] || "el cliente";
    setConfirmacion({
      titulo: "Desmarcar como cobrado",
      mensaje:
        "El presupuesto N. " +
        p.numero +
        " (" +
        nombreCliente +
        ") va a volver completo a Cobros pendientes, como si no se hubiera cobrado nada. Estas seguro?",
      onConfirmar: async function () {
        setConfirmacion(null);
        setPresupuestos(function (prev) {
          return prev.filter(function (x) {
            return x.id !== p.id;
          });
        });
        try {
          await marcarCobrado(airtableBaseId, p.id, false);
          mostrarConfirmacion("Presupuesto N. " + p.numero + " enviado de nuevo a Cobros pendientes");
        } catch (err) {
          await cargarTodo();
          mostrarConfirmacion("No se pudo actualizar, intenta de nuevo");
        }
      },
    });
  }

  function pedirEliminar(p) {
    const nombreCliente = clientesPorId[p.clienteId] || "el cliente";
    setConfirmacion({
      titulo: "Eliminar presupuesto",
      mensaje:
        "Se va a borrar el presupuesto N. " +
        p.numero +
        " (" +
        nombreCliente +
        ") de forma permanente, junto con sus items. Esto no se puede deshacer.",
      onConfirmar: async function () {
        setConfirmacion(null);
        try {
          await eliminarPresupuesto(airtableBaseId, p.id);
          setPresupuestos(function (prev) {
            return prev.filter(function (x) {
              return x.id !== p.id;
            });
          });
          mostrarConfirmacion("Presupuesto N. " + p.numero + " eliminado");
        } catch (err) {
          mostrarConfirmacion("No se pudo eliminar, intenta de nuevo");
        }
      },
    });
  }

  async function toggleDetalle(p) {
    var estaAbierto = !!detalleAbierto[p.id];

    setDetalleAbierto(function (prev) {
      var copia = Object.assign({}, prev);
      copia[p.id] = !estaAbierto;
      return copia;
    });

    if (!estaAbierto && !items[p.id]) {
      setCargandoDetalle(function (prev) {
        var copia = Object.assign({}, prev);
        copia[p.id] = true;
        return copia;
      });
      var data = await listarItemsPresupuesto(airtableBaseId, p.id);
      setItems(function (prev) {
        var copia = Object.assign({}, prev);
        copia[p.id] = data;
        return copia;
      });
      setCargandoDetalle(function (prev) {
        var copia = Object.assign({}, prev);
        copia[p.id] = false;
        return copia;
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#1E2A38]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-10 lg:max-w-3xl lg:my-14 lg:bg-white lg:border lg:border-[#D9D2C2] lg:rounded-xl lg:shadow-sm lg:px-14 lg:py-12">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#8A8371] font-semibold mb-1 pr-14 sm:pr-0">
          {nombrePyme}
        </p>
        <h1 className="text-[26px] sm:text-[28px] leading-tight font-bold mb-2" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
          Mis presupuestos
        </h1>
        <p className="text-[13px] text-[#8A8371] mb-8">
          Archivo de presupuestos ya cobrados. Los que faltan cobrar estan en "Cobros pendientes".
        </p>

        {cargando ? (
          <p className="text-[14px] text-[#8A8371]">Cargando...</p>
        ) : cobrados.length === 0 ? (
          <p className="text-[14px] text-[#8A8371]">Todavia no hay presupuestos cobrados.</p>
        ) : (
          <div className="space-y-2.5">
            {cobrados.map(function (p) {
              var abierto = !!detalleAbierto[p.id];
              var listaItems = items[p.id] || [];

              return (
                <div key={p.id} className="bg-white border border-[#D9D2C2] rounded-md px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] text-[#8A8371] shrink-0">N.{p.numero}</span>
                        <span className="text-[14px] font-medium truncate">
                          {clientesPorId[p.clienteId] || "(sin cliente)"}
                        </span>
                      </div>
                      <div
                        className="text-[13px] font-semibold mt-0.5"
                        style={{ fontFamily: "IBM Plex Mono, monospace" }}
                      >
                        {fmtARS(p.total)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={function () {
                          pedirEliminar(p);
                        }}
                        className="p-2 rounded-md text-[#B0876B] hover:bg-[#F4F2ED]"
                        aria-label="Eliminar presupuesto"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={function () {
                          pedirDesmarcar(p);
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-md py-2 text-[12px] font-semibold px-3"
                        style={{ backgroundColor: "#E4F0EA", color: "#3C7A5C" }}
                      >
                        <Check size={13} />
                        Cobrado
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={function () {
                      toggleDetalle(p);
                    }}
                    className="flex items-center gap-1 text-[12px] font-semibold mt-2.5"
                    style={{ color: colorPrimario }}
                  >
                    {abierto ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {abierto ? "Ocultar detalle" : "Ver que incluia"}
                  </button>

                  {abierto && (
                    <div className="bg-[#F4F2ED] rounded-md px-3 py-2.5 mt-2">
                      {cargandoDetalle[p.id] ? (
                        <p className="text-[12px] text-[#8A8371]">Cargando detalle...</p>
                      ) : listaItems.length === 0 ? (
                        <p className="text-[12px] text-[#8A8371]">Sin items cargados.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {listaItems.map(function (it) {
                            return (
                              <div key={it.id} className="flex items-center justify-between text-[12px] gap-2">
                                <span className="text-[#1E2A38]">
                                  {it.cantidad}x {it.nombre}
                                </span>
                                <span
                                  className="text-[#5A5647] shrink-0"
                                  style={{ fontFamily: "IBM Plex Mono, monospace" }}
                                >
                                  {fmtARS(it.subtotal)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
