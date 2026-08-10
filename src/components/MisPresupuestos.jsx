import React, { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { listarPresupuestos, listarClientes, marcarCobrado, listarItemsPresupuesto } from "../lib/airtable.js";
import Toast from "./Toast.jsx";

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

  async function toggleCobrado(p) {
    const nuevoValor = !p.cobrado;
    const nombreCliente = clientesPorId[p.clienteId] || "el cliente";
    setPresupuestos(function (prev) {
      return prev.map(function (x) {
        return x.id === p.id ? Object.assign({}, x, { cobrado: nuevoValor }) : x;
      });
    });
    try {
      await marcarCobrado(airtableBaseId, p.id, nuevoValor);
      if (nuevoValor) {
        mostrarConfirmacion("Presupuesto N. " + p.numero + " (" + nombreCliente + ") marcado como cobrado");
      } else {
        mostrarConfirmacion("Presupuesto N. " + p.numero + " desmarcado");
      }
    } catch (err) {
      setPresupuestos(function (prev) {
        return prev.map(function (x) {
          return x.id === p.id ? Object.assign({}, x, { cobrado: p.cobrado }) : x;
        });
      });
      mostrarConfirmacion("No se pudo actualizar, intenta de nuevo");
    }
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
      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-10">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#8A8371] font-semibold mb-1">
          {nombrePyme}
        </p>
        <h1 className="text-[26px] sm:text-[28px] leading-tight font-bold mb-8" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
          Mis presupuestos
        </h1>

        {cargando ? (
          <p className="text-[14px] text-[#8A8371]">Cargando...</p>
        ) : presupuestos.length === 0 ? (
          <p className="text-[14px] text-[#8A8371]">Todavia no hay presupuestos mandados.</p>
        ) : (
          <div className="space-y-2.5">
            {presupuestos.map(function (p) {
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
                    <button
                      onClick={function () {
                        toggleCobrado(p);
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-md py-2 text-[12px] font-semibold px-3 shrink-0 transition-colors"
                      style={
                        p.cobrado
                          ? { backgroundColor: "#E4F0EA", color: "#3C7A5C" }
                          : { backgroundColor: "#F4F2ED", color: "#8A8371" }
                      }
                    >
                      {p.cobrado && <Check size={13} />}
                      {p.cobrado ? "Cobrado" : "Marcar"}
                    </button>
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
    </div>
  );
}
