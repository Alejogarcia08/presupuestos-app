import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Truck, Plus, ChevronRight, AlertTriangle } from "lucide-react";
import { listarVehiculos, crearVehiculo } from "../lib/airtable.js";
import Toast from "./Toast.jsx";

function diasHasta(iso) {
  if (!iso) return null;
  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  var fecha = new Date(iso + "T00:00:00");
  return Math.round((fecha - hoy) / (1000 * 60 * 60 * 24));
}

function estadoVencimiento(dias) {
  if (dias === null) return { color: "#8A8371", bg: "#F4F2ED" };
  if (dias < 0) return { color: "#A0432E", bg: "#F7E9E6" };
  if (dias <= 15) return { color: "#A0432E", bg: "#F7E9E6" };
  if (dias <= 30) return { color: "#8A6423", bg: "#FBF7EE" };
  return { color: "#3C7A5C", bg: "#E4F0EA" };
}

export default function Flota({ airtableBaseId, flotaSlug, nombrePyme, colorPrimario = "#1E2A38" }) {
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [formAbierto, setFormAbierto] = useState(false);
  const [patente, setPatente] = useState("");
  const [marcaModelo, setMarcaModelo] = useState("");
  const [tipo, setTipo] = useState("Camion");
  const [guardando, setGuardando] = useState(false);
  const [mensajeToast, setMensajeToast] = useState("");
  const [mostrarToast, setMostrarToast] = useState(false);

  async function cargarTodo() {
    setCargando(true);
    var data = await listarVehiculos(airtableBaseId);
    setVehiculos(data);
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

  async function guardarVehiculo() {
    if (!patente.trim()) return;
    setGuardando(true);
    await crearVehiculo(airtableBaseId, { patente: patente.trim(), marcaModelo: marcaModelo.trim(), tipo });
    await cargarTodo();
    setPatente("");
    setMarcaModelo("");
    setTipo("Camion");
    setFormAbierto(false);
    setGuardando(false);
    mostrarConfirmacion("Vehiculo agregado");
  }

  var vehiculosConUrgencia = vehiculos.map(function (v) {
    var fechas = [v.vtvVencimiento, v.seguroVencimiento, v.serviceProximo].filter(Boolean);
    var diasPorFecha = fechas.map(diasHasta);
    var minDias = diasPorFecha.length > 0 ? Math.min.apply(null, diasPorFecha) : null;
    return Object.assign({}, v, { diasMinimo: minDias });
  });

  vehiculosConUrgencia.sort(function (a, b) {
    if (a.diasMinimo === null) return 1;
    if (b.diasMinimo === null) return -1;
    return a.diasMinimo - b.diasMinimo;
  });

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#1E2A38]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-8 sm:py-10 lg:max-w-3xl lg:my-14 lg:bg-white lg:border lg:border-[#D9D2C2] lg:rounded-xl lg:shadow-sm lg:px-14 lg:py-12">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#8A8371] font-semibold mb-1 pr-14 sm:pr-0">
          {nombrePyme}
        </p>
        <h1 className="text-[26px] sm:text-[28px] leading-tight font-bold mb-2" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
          Tablero de vencimientos
        </h1>
        <p className="text-[13px] text-[#8A8371] mb-6">
          Vehiculos ordenados por el vencimiento mas cercano (VTV, seguro o service).
        </p>

        {!formAbierto ? (
          <button
            onClick={function () {
              setFormAbierto(true);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-md py-3 text-[13px] font-semibold border-2 border-dashed mb-6"
            style={{ borderColor: colorPrimario, color: colorPrimario }}
          >
            <Plus size={16} />
            Agregar vehiculo
          </button>
        ) : (
          <div className="bg-[#F4F2ED] rounded-md p-4 mb-6">
            <p className="text-[12px] font-semibold mb-3" style={{ color: colorPrimario }}>
              Vehiculo nuevo
            </p>
            <input
              autoFocus
              value={patente}
              onChange={function (e) {
                setPatente(e.target.value.toUpperCase());
              }}
              placeholder="Patente"
              className="w-full border border-[#D9D2C2] rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#B08650] mb-2 bg-white"
            />
            <input
              value={marcaModelo}
              onChange={function (e) {
                setMarcaModelo(e.target.value);
              }}
              placeholder="Marca y modelo (ej: Ford Cargo 1517)"
              className="w-full border border-[#D9D2C2] rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#B08650] mb-2 bg-white"
            />
            <select
              value={tipo}
              onChange={function (e) {
                setTipo(e.target.value);
              }}
              className="w-full border border-[#D9D2C2] rounded px-3 py-2.5 text-[14px] outline-none bg-white mb-3"
            >
              <option>Camion</option>
              <option>Camioneta</option>
              <option>Utilitario</option>
              <option>Auto</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={guardarVehiculo}
                disabled={!patente.trim() || guardando}
                className="flex-1 rounded py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: colorPrimario }}
              >
                {guardando ? "..." : "Guardar vehiculo"}
              </button>
              <button
                onClick={function () {
                  setFormAbierto(false);
                }}
                className="px-3 py-2.5 text-[13px] text-[#8A8371]"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {cargando ? (
          <p className="text-[13px] text-[#8A8371]">Cargando...</p>
        ) : vehiculosConUrgencia.length === 0 ? (
          <div className="bg-white border border-[#D9D2C2] rounded-md px-5 py-8 text-center">
            <p className="text-[14px] text-[#8A8371]">Todavia no hay vehiculos cargados.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {vehiculosConUrgencia.map(function (v) {
              var estado = estadoVencimiento(v.diasMinimo);
              return (
                <Link
                  key={v.id}
                  to={"/flota/" + flotaSlug + "/vehiculos/" + v.id}
                  className="flex items-center justify-between bg-white border border-[#D9D2C2] rounded-md px-4 py-3.5 hover:border-[#B08650] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "#F4F2ED", color: colorPrimario }}
                    >
                      <Truck size={17} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold truncate">{v.patente}</div>
                      <div className="text-[12px] text-[#8A8371] truncate">
                        {v.marcaModelo || v.tipo}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={{ backgroundColor: estado.bg, color: estado.color }}
                    >
                      {v.diasMinimo !== null && v.diasMinimo <= 15 && <AlertTriangle size={11} />}
                      {v.diasMinimo === null ? "Sin fechas" : v.diasMinimo < 0 ? "Vencido" : v.diasMinimo + " dias"}
                    </span>
                    <ChevronRight size={16} className="text-[#8A8371]" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Toast mensaje={mensajeToast} visible={mostrarToast} colorPrimario={colorPrimario} />
    </div>
  );
}
