import React, { useEffect, useState } from "react";
import { DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { listarPresupuestos, listarClientes, registrarCobro, listarItemsPresupuesto } from "../lib/airtable.js";
import Toast from "./Toast.jsx";

function fmtARS(n) {
  return Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export default function CobrosPendientes({ airtableBaseId, nombrePyme, colorPrimario = "#1E2A38" }) {
  const [presupuestos, setPresupuestos] = useState([]);
  const [clientesPorId, setClientesPorId] = useState({});
  const [cargando, setCargando] = useState(true);
  const [nuevoPago, setNuevoPago] = useState({});
  const [guardando, setGuardando] = useState({});
  const [mensajeToast, setMensajeToast] = useState("");
  const [mostrarToast, setMostrarToast] = useState(false);

  // Detalle (items) de cada presupuesto, cargado solo cuando se despliega
  const [detalleAbierto, setDetalleAbierto] = useState({}); // { [id]: true/false }
  const [items, setItems] = useState({}); // { [id]: [items...] }
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

  var conSaldo = presupuestos.filter(function (p) {
    return (p.saldoPendiente || 0) > 0;
  });

  conSaldo.sort(function (a, b) {
    return (b.saldoPendiente || 0) - (a.saldoPendiente || 0);
  });

  async function toggleDetalle(p) {
    var estaAbierto = !!detalleAbierto[p.id];

    setDetalleAbierto(function (prev) {
      var copia = Object.assign({}, prev);
      copia[p.id] = !estaAbierto;
      return copia;
    });

    // Si lo estamos abriendo por primera vez, pedimos los items al servidor
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

  async function agregarCobro(p, montoDirecto) {
    var valor = montoDirecto !== undefined ? montoDirecto : nuevoPago[p.id];
    if (!valor || Number(valor) <= 0) return;

    setGuardando(function (prev) {
      var copia = Object.assign({}, prev);
      copia[p.id] = true;
      return copia;
    });

    var resultado = await registrarCobro(airtableBaseId, p.id, Number(valor));
    var saldoRestante = p.total - resultado.montoCobrado;

    await cargarTodo();

    setNuevoPago(function (prev) {
      var copia = Object.assign({}, prev);
      copia[p.id] = "";
      return copia;
    });
    setGuardando(function (prev) {
      var copia = Object.assign({}, prev);
      copia[p.id] = false;
      return copia;
    });

    var mensaje =
      saldoRestante <= 0
        ? "Cobro registrado. Presupuesto N. " + p.numero + " quedo saldado."
        : "Cobro de " + fmtARS(valor) + " registrado. Faltan " + fmtARS(saldoRestante) + ".";
    setMensajeToast(mensaje);
    setMostrarToast(true);
    setTimeout(function () {
      setMostrarToast(false);
    }, 4000);
  }

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#1E2A38]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-10 lg:max-w-3xl lg:my-14 lg:bg-white lg:border lg:border-[#D9D2C2] lg:rounded-xl lg:shadow-sm lg:px-14 lg:py-12">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#8A8371] font-semibold mb-1">
          {nombrePyme}
        </p>
        <h1 className="text-[26px] sm:text-[28px] leading-tight font-bold mb-2" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
          Cobros pendientes
        </h1>
        <p className="text-[13px] text-[#8A8371] mb-8">
          Presupuestos nuevos o con pago parcial. Cobra todo de una vez o de a poco.
        </p>

        {cargando ? (
          <p className="text-[14px] text-[#8A8371]">Cargando...</p>
        ) : conSaldo.length === 0 ? (
          <div className="bg-white border border-[#D9D2C2] rounded-md px-5 py-8 text-center">
            <p className="text-[14px] text-[#8A8371]">No hay saldos pendientes por ahora.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conSaldo.map(function (p) {
              var valorNuevo = nuevoPago[p.id] !== undefined ? nuevoPago[p.id] : "";
              var abierto = !!detalleAbierto[p.id];
              var listaItems = items[p.id] || [];

              return (
                <div key={p.id} className="bg-white border border-[#D9D2C2] rounded-md px-4 sm:px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <DollarSign size={18} className="mt-0.5 text-[#B0876B] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold truncate">
                          {clientesPorId[p.clienteId] || "(sin cliente)"}
                        </div>
                        <div className="text-[12px] text-[#8A8371]">Presupuesto N. {p.numero}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] uppercase tracking-wide text-[#8A8371]">Saldo</div>
                      <div
                        className="text-[17px] sm:text-[18px] font-bold"
                        style={{ fontFamily: "IBM Plex Mono, monospace", color: colorPrimario }}
                      >
                        {fmtARS(p.saldoPendiente)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#8A8371] border-t border-[#F1EEE6] pt-3 mb-2">
                    <span>Total: <strong className="text-[#1E2A38]">{fmtARS(p.total)}</strong></span>
                    <span>Ya cobrado: <strong className="text-[#1E2A38]">{fmtARS(p.montoCobrado)}</strong></span>
                  </div>

                  {/* Botón para desplegar el detalle de qué incluye este presupuesto */}
                  <button
                    onClick={function () {
                      toggleDetalle(p);
                    }}
                    className="flex items-center gap-1 text-[12px] font-semibold mb-3"
                    style={{ color: colorPrimario }}
                  >
                    {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {abierto ? "Ocultar detalle" : "Ver detalle del presupuesto"}
                  </button>

                  {abierto && (
                    <div className="bg-[#F4F2ED] rounded-md px-3 py-2.5 mb-3">
                      {cargandoDetalle[p.id] ? (
                        <p className="text-[12px] text-[#8A8371]">Cargando detalle...</p>
                      ) : listaItems.length === 0 ? (
                        <p className="text-[12px] text-[#8A8371]">Sin items cargados.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {listaItems.map(function (it) {
                            return (
                              <div
                                key={it.id}
                                className="flex items-center justify-between text-[12px] gap-2"
                              >
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

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                    <input
                      type="number"
                      min={0}
                      placeholder="Cuanto cobraste ahora ($)"
                      value={valorNuevo}
                      onChange={function (e) {
                        var v = e.target.value;
                        setNuevoPago(function (prev) {
                          var copia = Object.assign({}, prev);
                          copia[p.id] = v;
                          return copia;
                        });
                      }}
                      className="border border-[#D9D2C2] rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#B08650]"
                    />
                    <button
                      onClick={function () {
                        agregarCobro(p);
                      }}
                      disabled={!!guardando[p.id]}
                      className="rounded-md px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
                      style={{ backgroundColor: colorPrimario }}
                    >
                      {guardando[p.id] ? "..." : "Agregar cobro"}
                    </button>
                  </div>
                  <button
                    onClick={function () {
                      setNuevoPago(function (prev) {
                        var copia = Object.assign({}, prev);
                        copia[p.id] = String(p.saldoPendiente);
                        return copia;
                      });
                      agregarCobro(p, p.saldoPendiente);
                    }}
                    disabled={!!guardando[p.id]}
                    className="w-full mt-2 rounded-md px-4 py-2 text-[12px] font-semibold border disabled:opacity-50"
                    style={{ borderColor: colorPrimario, color: colorPrimario }}
                  >
                    Cobrar todo ({fmtARS(p.saldoPendiente)})
                  </button>
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
