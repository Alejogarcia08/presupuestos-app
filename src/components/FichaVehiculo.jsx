import React, { useEffect, useState } from "react";
import { Truck, Pencil, Check, X, ClipboardList } from "lucide-react";
import {
  listarVehiculos,
  actualizarVehiculo,
  listarConductores,
  listarChecklists,
  crearChecklist,
} from "../lib/airtable.js";
import Toast from "./Toast.jsx";

var ITEMS_CHECKLIST = [
  { key: "presionNeumaticos", label: "Presion de neumaticos" },
  { key: "aceite", label: "Nivel de aceite" },
  { key: "luces", label: "Luces y balizas" },
  { key: "toldo", label: "Toldo / lona" },
  { key: "fugas", label: "Fugas visibles" },
  { key: "espejosVidrios", label: "Espejos y vidrios" },
];

function fmtFecha(iso) {
  if (!iso) return "Sin cargar";
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

function colorPorDias(dias) {
  if (dias === null) return "#8A8371";
  if (dias < 0) return "#A0432E";
  if (dias <= 15) return "#A0432E";
  if (dias <= 30) return "#8A6423";
  return "#3C7A5C";
}

export default function FichaVehiculo({ airtableBaseId, vehiculoId, nombrePyme, colorPrimario = "#1E2A38" }) {
  const [vehiculo, setVehiculo] = useState(null);
  const [conductores, setConductores] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [editandoFechas, setEditandoFechas] = useState(false);
  const [vtv, setVtv] = useState("");
  const [seguro, setSeguro] = useState("");
  const [service, setService] = useState("");
  const [conductorId, setConductorId] = useState("");

  const [formChecklistAbierto, setFormChecklistAbierto] = useState(false);
  const [itemsMarcados, setItemsMarcados] = useState({});
  const [observaciones, setObservaciones] = useState("");
  const [requiereAtencion, setRequiereAtencion] = useState(false);
  const [guardandoChecklist, setGuardandoChecklist] = useState(false);

  const [mensajeToast, setMensajeToast] = useState("");
  const [mostrarToast, setMostrarToast] = useState(false);

  async function cargarTodo() {
    setCargando(true);
    var [vehiculos, conds, cks] = await Promise.all([
      listarVehiculos(airtableBaseId),
      listarConductores(airtableBaseId),
      listarChecklists(airtableBaseId),
    ]);
    var encontrado = vehiculos.find(function (v) {
      return v.id === vehiculoId;
    });
    setVehiculo(encontrado || null);
    setConductores(conds);
    if (encontrado) {
      setVtv(encontrado.vtvVencimiento || "");
      setSeguro(encontrado.seguroVencimiento || "");
      setService(encontrado.serviceProximo || "");
      setConductorId(encontrado.conductorId || "");
    }
    setChecklists(
      cks
        .filter(function (c) {
          return c.vehiculoId === vehiculoId;
        })
        .sort(function (a, b) {
          return b.fecha.localeCompare(a.fecha);
        })
    );
    setCargando(false);
  }

  useEffect(function () {
    cargarTodo();
  }, [airtableBaseId, vehiculoId]);

  function mostrarConfirmacion(texto) {
    setMensajeToast(texto);
    setMostrarToast(true);
    setTimeout(function () {
      setMostrarToast(false);
    }, 3000);
  }

  async function guardarFechas() {
    await actualizarVehiculo(airtableBaseId, vehiculoId, {
      vtvVencimiento: vtv,
      seguroVencimiento: seguro,
      serviceProximo: service,
      conductorId: conductorId || null,
    });
    await cargarTodo();
    setEditandoFechas(false);
    mostrarConfirmacion("Datos actualizados");
  }

  function toggleItem(key) {
    setItemsMarcados(function (prev) {
      var copia = Object.assign({}, prev);
      copia[key] = !copia[key];
      return copia;
    });
  }

  async function guardarChecklist() {
    setGuardandoChecklist(true);
    var hoy = new Date().toISOString().slice(0, 10);
    await crearChecklist(airtableBaseId, {
      vehiculoId,
      fecha: hoy,
      presionNeumaticos: !!itemsMarcados.presionNeumaticos,
      aceite: !!itemsMarcados.aceite,
      luces: !!itemsMarcados.luces,
      toldo: !!itemsMarcados.toldo,
      fugas: !!itemsMarcados.fugas,
      espejosVidrios: !!itemsMarcados.espejosVidrios,
      observaciones,
      requiereAtencion,
    });
    await cargarTodo();
    setItemsMarcados({});
    setObservaciones("");
    setRequiereAtencion(false);
    setFormChecklistAbierto(false);
    setGuardandoChecklist(false);
    mostrarConfirmacion("Checklist guardado");
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#F4F2ED] flex items-center justify-center">
        <p className="text-[13px] text-[#8A8371]">Cargando...</p>
      </div>
    );
  }

  if (!vehiculo) {
    return (
      <div className="min-h-screen bg-[#F4F2ED] flex items-center justify-center px-6">
        <p className="text-[14px] text-[#8A8371]">No se encontro este vehiculo.</p>
      </div>
    );
  }

  var conductorAsignado = conductores.find(function (c) {
    return c.id === vehiculo.conductorId;
  });

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
            <Truck size={22} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
              {vehiculo.patente}
            </h1>
            <div className="text-[13px] text-[#8A8371]">{vehiculo.marcaModelo || vehiculo.tipo}</div>
          </div>
        </div>

        {/* Fechas de vencimiento */}
        <div className="bg-[#F4F2ED] rounded-md p-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-semibold" style={{ color: colorPrimario }}>
              Vencimientos
            </p>
            {!editandoFechas && (
              <button
                onClick={function () {
                  setEditandoFechas(true);
                }}
                className="flex items-center gap-1 text-[11px] font-semibold"
                style={{ color: colorPrimario }}
              >
                <Pencil size={11} /> Editar
              </button>
            )}
          </div>

          {!editandoFechas ? (
            <div className="space-y-2">
              {[
                { label: "VTV", fecha: vehiculo.vtvVencimiento },
                { label: "Seguro", fecha: vehiculo.seguroVencimiento },
                { label: "Service", fecha: vehiculo.serviceProximo },
              ].map(function (item) {
                var dias = diasHasta(item.fecha);
                return (
                  <div key={item.label} className="flex items-center justify-between bg-white rounded px-3 py-2">
                    <span className="text-[13px] font-medium">{item.label}</span>
                    <span className="text-[13px] font-semibold" style={{ color: colorPorDias(dias) }}>
                      {fmtFecha(item.fecha)}
                      {dias !== null && (dias < 0 ? " (vencido)" : " (" + dias + " dias)")}
                    </span>
                  </div>
                );
              })}
              {conductorAsignado && (
                <div className="flex items-center justify-between bg-white rounded px-3 py-2">
                  <span className="text-[13px] font-medium">Conductor</span>
                  <span className="text-[13px] font-semibold">{conductorAsignado.nombre}</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-[10px] uppercase tracking-wide text-[#8A8371] font-semibold block mb-1">
                VTV vence
              </label>
              <input
                type="date"
                value={vtv}
                onChange={function (e) {
                  setVtv(e.target.value);
                }}
                className="w-full border border-[#D9D2C2] rounded px-3 py-2 text-[13px] outline-none bg-white mb-2"
              />
              <label className="text-[10px] uppercase tracking-wide text-[#8A8371] font-semibold block mb-1">
                Seguro vence
              </label>
              <input
                type="date"
                value={seguro}
                onChange={function (e) {
                  setSeguro(e.target.value);
                }}
                className="w-full border border-[#D9D2C2] rounded px-3 py-2 text-[13px] outline-none bg-white mb-2"
              />
              <label className="text-[10px] uppercase tracking-wide text-[#8A8371] font-semibold block mb-1">
                Proximo service
              </label>
              <input
                type="date"
                value={service}
                onChange={function (e) {
                  setService(e.target.value);
                }}
                className="w-full border border-[#D9D2C2] rounded px-3 py-2 text-[13px] outline-none bg-white mb-2"
              />
              <label className="text-[10px] uppercase tracking-wide text-[#8A8371] font-semibold block mb-1">
                Conductor asignado
              </label>
              <select
                value={conductorId}
                onChange={function (e) {
                  setConductorId(e.target.value);
                }}
                className="w-full border border-[#D9D2C2] rounded px-3 py-2 text-[13px] outline-none bg-white mb-3"
              >
                <option value="">Sin asignar</option>
                {conductores.map(function (c) {
                  return (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  );
                })}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={guardarFechas}
                  className="flex-1 rounded py-2 text-[13px] font-semibold text-white"
                  style={{ backgroundColor: colorPrimario }}
                >
                  Guardar
                </button>
                <button
                  onClick={function () {
                    setEditandoFechas(false);
                  }}
                  className="px-3 py-2 text-[13px] text-[#8A8371]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Checklist semanal */}
        <div className="mb-8">
          {!formChecklistAbierto ? (
            <button
              onClick={function () {
                setFormChecklistAbierto(true);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-md py-3 text-[13px] font-semibold border-2 border-dashed"
              style={{ borderColor: "#B08650", color: "#B08650" }}
            >
              <ClipboardList size={15} />
              Cargar checklist de hoy
            </button>
          ) : (
            <div className="bg-[#F4F2ED] rounded-md p-4">
              <p className="text-[12px] font-bold mb-3" style={{ color: "#B08650" }}>
                Checklist de hoy
              </p>
              <div className="space-y-2 mb-3">
                {ITEMS_CHECKLIST.map(function (item) {
                  var marcado = !!itemsMarcados[item.key];
                  return (
                    <button
                      key={item.key}
                      onClick={function () {
                        toggleItem(item.key);
                      }}
                      className="w-full flex items-center gap-2.5 bg-white rounded px-3 py-2.5 text-left"
                    >
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center shrink-0 border-2"
                        style={{
                          borderColor: marcado ? "#3C7A5C" : "#D9D2C2",
                          backgroundColor: marcado ? "#3C7A5C" : "white",
                        }}
                      >
                        {marcado && <Check size={13} color="white" />}
                      </div>
                      <span className="text-[13px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <textarea
                value={observaciones}
                onChange={function (e) {
                  setObservaciones(e.target.value);
                }}
                placeholder="Observaciones (ej: revisar el toldo, ruido raro en el freno...)"
                rows={3}
                className="w-full border border-[#D9D2C2] rounded px-3 py-2.5 text-[13px] outline-none bg-white mb-2 resize-none"
              />
              <button
                onClick={function () {
                  setRequiereAtencion(function (v) {
                    return !v;
                  });
                }}
                className="w-full flex items-center gap-2.5 bg-white rounded px-3 py-2.5 text-left mb-3"
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center shrink-0 border-2"
                  style={{
                    borderColor: requiereAtencion ? "#A0432E" : "#D9D2C2",
                    backgroundColor: requiereAtencion ? "#A0432E" : "white",
                  }}
                >
                  {requiereAtencion && <Check size={13} color="white" />}
                </div>
                <span className="text-[13px]" style={{ color: requiereAtencion ? "#A0432E" : "#1E2A38" }}>
                  Requiere atencion urgente
                </span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={guardarChecklist}
                  disabled={guardandoChecklist}
                  className="flex-1 rounded py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
                  style={{ backgroundColor: colorPrimario }}
                >
                  {guardandoChecklist ? "..." : "Guardar checklist"}
                </button>
                <button
                  onClick={function () {
                    setFormChecklistAbierto(false);
                  }}
                  className="px-3 py-2.5 text-[13px] text-[#8A8371]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Historial de checklists */}
        <h2 className="text-[15px] font-bold mb-4">Historial de checklists</h2>
        {checklists.length === 0 ? (
          <p className="text-[13px] text-[#8A8371]">Todavia no hay checklists cargados.</p>
        ) : (
          <div className="space-y-2.5">
            {checklists.map(function (c) {
              var itemsOk = ITEMS_CHECKLIST.filter(function (i) {
                return c[i.key];
              });
              return (
                <div key={c.id} className="bg-white border border-[#D9D2C2] rounded-md px-4 py-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-semibold">{fmtFecha(c.fecha)}</span>
                    {c.requiereAtencion && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded"
                        style={{ backgroundColor: "#F7E9E6", color: "#A0432E" }}
                      >
                        Requiere atencion
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#8A8371]">
                    {itemsOk.length} de {ITEMS_CHECKLIST.length} items revisados
                  </div>
                  {c.observaciones && <p className="text-[12px] text-[#5A5647] mt-1.5">{c.observaciones}</p>}
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
