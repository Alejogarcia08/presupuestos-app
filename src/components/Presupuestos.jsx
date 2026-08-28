import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  PenLine,
  DollarSign,
} from "lucide-react";
import {
  listarClientes,
  crearCliente,
  enviarPresupuesto,
  listarProductos,
  eliminarProducto,
  listarPresupuestos,
  registrarCobro,
  listarItemsPresupuesto,
} from "../lib/airtable.js";
import Toast from "./Toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

const fmtARS = (n) =>
  Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

function fmtFechaCorta(iso) {
  if (!iso) return "";
  var d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Pantalla "Presupuestos": formulario para cargar uno nuevo (arriba) y
 * lista de "Presupuestos a cobrar" (abajo) — mismo patron que la pantalla
 * de Turnos (formulario + calendario juntos), para no saltar entre
 * pestañas separadas para dos tareas que van de la mano.
 */
export default function Presupuestos({
  airtableBaseId,
  nombrePyme,
  modoDefault = "ambos",
  colorPrimario = "#1E2A38",
}) {
  // ---------------- Estado: formulario de nuevo presupuesto ----------------
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(null);
  const [clientePickerOpen, setClientePickerOpen] = useState(false);
  const [nuevoClienteModo, setNuevoClienteModo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoDireccion, setNuevoDireccion] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [cargandoClientes, setCargandoClientes] = useState(true);

  const [catalogo, setCatalogo] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [buscadorOpen, setBuscadorOpen] = useState(false);
  const [lineas, setLineas] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [mensajeToast, setMensajeToast] = useState("");
  const [confirmacion, setConfirmacion] = useState(null);

  const mostrarPestañas = modoDefault === "ambos";
  const [modo, setModo] = useState(modoDefault === "ambos" ? "catalogo" : modoDefault);
  const [itemNombre, setItemNombre] = useState("");
  const [itemPrecio, setItemPrecio] = useState("");
  const [itemCantidad, setItemCantidad] = useState(1);

  const buscadorRef = useRef(null);

  // ---------------- Estado: lista "Presupuestos a cobrar" ----------------
  const [presupuestosPendientes, setPresupuestosPendientes] = useState([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(true);
  const [nuevoPago, setNuevoPago] = useState({});
  const [busquedaCobros, setBusquedaCobros] = useState("");
  const [guardandoPago, setGuardandoPago] = useState({});
  const [detalleAbierto, setDetalleAbierto] = useState({});
  const [itemsPorPresupuesto, setItemsPorPresupuesto] = useState({});
  const [cargandoDetalle, setCargandoDetalle] = useState({});

  // Carga inicial de clientes de esta PyME
  useEffect(() => {
    let activo = true;
    setCargandoClientes(true);
    listarClientes(airtableBaseId).then((data) => {
      if (!activo) return;
      setClientes(data);
      if (data.length > 0) setClienteId(data[0].id);
      setCargandoClientes(false);
    });
    return () => {
      activo = false;
    };
  }, [airtableBaseId]);

  // Carga inicial del catálogo real de esta PyME
  useEffect(() => {
    let activo = true;
    listarProductos(airtableBaseId).then((data) => {
      if (!activo) return;
      setCatalogo(data);
    });
    return () => {
      activo = false;
    };
  }, [airtableBaseId]);

  useEffect(() => {
    function onClickFuera(e) {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target)) {
        setBuscadorOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  async function cargarPendientes() {
    setCargandoPendientes(true);
    const pres = await listarPresupuestos(airtableBaseId);
    setPresupuestosPendientes(pres);
    setCargandoPendientes(false);
  }

  useEffect(() => {
    cargarPendientes();
  }, [airtableBaseId]);

  // Reusamos el listado de clientes del formulario para armar el mapa
  // id -> nombre que necesita la lista de "a cobrar" (no hace falta pedirlo
  // dos veces al servidor).
  const clientesPorId = useMemo(() => {
    const mapa = {};
    clientes.forEach((c) => {
      mapa[c.id] = c.nombre;
    });
    return mapa;
  }, [clientes]);

  const cliente = clientes.find((c) => c.id === clienteId);

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return catalogo.slice(0, 6);
    const q = busqueda.toLowerCase();
    return catalogo.filter((p) => p.nombre.toLowerCase().includes(q)).slice(0, 8);
  }, [busqueda, catalogo]);

  function agregarProducto(producto) {
    setLineas((prev) => {
      const existe = prev.find((l) => l.id === producto.id);
      if (existe) {
        return prev.map((l) => (l.id === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l));
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
    setBusqueda("");
    setBuscadorOpen(false);
  }

  function pedirEliminarProducto(producto) {
    setConfirmacion({
      titulo: "Eliminar del catalogo",
      mensaje:
        '"' +
        producto.nombre +
        '" se va a borrar del catalogo de forma permanente. Los presupuestos que ya lo usaron no se ven afectados.',
      onConfirmar: async function () {
        setConfirmacion(null);
        try {
          await eliminarProducto(airtableBaseId, producto.id);
          setCatalogo(function (prev) {
            return prev.filter(function (x) {
              return x.id !== producto.id;
            });
          });
          mostrarToast('"' + producto.nombre + '" eliminado del catalogo');
        } catch (err) {
          mostrarToast("No se pudo eliminar, intenta de nuevo");
        }
      },
    });
  }

  function actualizarCantidad(id, cantidad) {
    const c = Math.max(1, Number(cantidad) || 1);
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, cantidad: c } : l)));
  }

  function actualizarPrecio(id, precio) {
    const p = Math.max(0, Number(precio) || 0);
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, precio: p } : l)));
  }

  function quitarLinea(id) {
    setLineas((prev) => prev.filter((l) => l.id !== id));
  }

  function agregarItemPersonalizado() {
    const precio = Number(itemPrecio);
    const cantidad = Math.max(1, Number(itemCantidad) || 1);
    if (!itemNombre.trim() || !precio || precio <= 0) return;
    setLineas((prev) => [
      ...prev,
      { id: "manual-" + Date.now(), nombre: itemNombre.trim(), precio, cantidad, unidad: "manual" },
    ]);
    setItemNombre("");
    setItemPrecio("");
    setItemCantidad(1);
  }

  async function crearClienteNuevo() {
    if (!nuevoNombre.trim()) return;
    const nuevo = await crearCliente(airtableBaseId, {
      nombre: nuevoNombre.trim(),
      direccion: nuevoDireccion.trim(),
      telefono: nuevoTelefono.trim(),
      email: nuevoEmail.trim(),
    });
    setClientes((prev) => [...prev, nuevo]);
    setClienteId(nuevo.id);
    setNuevoNombre("");
    setNuevoDireccion("");
    setNuevoTelefono("");
    setNuevoEmail("");
    setNuevoClienteModo(false);
    setClientePickerOpen(false);
  }

  const total = lineas.reduce((acc, l) => acc + l.cantidad * l.precio, 0);

  function mostrarToast(texto) {
    setMensajeToast(texto);
    setEnviado(true);
    setTimeout(function () {
      setEnviado(false);
    }, 4000);
  }

  async function generarPresupuesto() {
    setEnviando(true);
    const lineasParaEnviar = lineas.map((l) => ({
      productoId: l.id.startsWith("manual-") ? undefined : l.id,
      nombre: l.nombre,
      precio: l.precio,
      cantidad: l.cantidad,
    }));
    await enviarPresupuesto(airtableBaseId, { clienteId, lineas: lineasParaEnviar, total });

    var nombreParaMensaje = cliente ? cliente.nombre : "el cliente";
    var totalParaMensaje = total;

    setLineas([]);
    setBusqueda("");
    setItemNombre("");
    setItemPrecio("");
    setItemCantidad(1);
    setClienteId(null);
    setClientePickerOpen(false);

    listarProductos(airtableBaseId).then(setCatalogo);
    // El presupuesto recien creado aparece de inmediato en la lista de
    // "Presupuestos a cobrar", de abajo, sin recargar la pagina.
    cargarPendientes();

    setEnviando(false);
    mostrarToast("Presupuesto enviado a " + nombreParaMensaje + " por " + fmtARS(totalParaMensaje));
  }

  // ---------------- Logica de la lista "Presupuestos a cobrar" ----------------

  var conSaldo = presupuestosPendientes.filter(function (p) {
    return (p.saldoPendiente || 0) > 0;
  });
  conSaldo.sort(function (a, b) {
    return (b.saldoPendiente || 0) - (a.saldoPendiente || 0);
  });

  var totalPendiente = conSaldo.reduce(function (acc, p) {
    return acc + (p.saldoPendiente || 0);
  }, 0);

  var conSaldoFiltrado = !busquedaCobros.trim()
    ? conSaldo
    : conSaldo.filter(function (p) {
        var nombreCliente = (clientesPorId[p.clienteId] || "").toLowerCase();
        return nombreCliente.includes(busquedaCobros.toLowerCase());
      });

  async function toggleDetalle(p) {
    var estaAbierto = !!detalleAbierto[p.id];
    setDetalleAbierto(function (prev) {
      var copia = Object.assign({}, prev);
      copia[p.id] = !estaAbierto;
      return copia;
    });

    if (!estaAbierto && !itemsPorPresupuesto[p.id]) {
      setCargandoDetalle(function (prev) {
        var copia = Object.assign({}, prev);
        copia[p.id] = true;
        return copia;
      });
      var data = await listarItemsPresupuesto(airtableBaseId, p.id);
      setItemsPorPresupuesto(function (prev) {
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

    setGuardandoPago(function (prev) {
      var copia = Object.assign({}, prev);
      copia[p.id] = true;
      return copia;
    });

    var resultado = await registrarCobro(airtableBaseId, p.id, Number(valor));
    var saldoRestante = p.total - resultado.montoCobrado;

    await cargarPendientes();

    setNuevoPago(function (prev) {
      var copia = Object.assign({}, prev);
      copia[p.id] = "";
      return copia;
    });
    setGuardandoPago(function (prev) {
      var copia = Object.assign({}, prev);
      copia[p.id] = false;
      return copia;
    });

    var mensaje =
      saldoRestante <= 0
        ? "Cobro registrado. Presupuesto N. " + p.numero + " quedo saldado."
        : "Cobro de " + fmtARS(valor) + " registrado. Faltan " + fmtARS(saldoRestante) + ".";
    mostrarToast(mensaje);
  }

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#1E2A38]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-8 sm:py-10 lg:max-w-5xl lg:my-14 lg:bg-white lg:border lg:border-[#D9D2C2] lg:rounded-xl lg:shadow-sm lg:px-10 lg:py-12">
        {/* Encabezado */}
        <div className="mb-8">
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#8A8371] font-semibold mb-1 pr-14 sm:pr-0">
            {nombrePyme}
          </p>
          <h1 className="text-[28px] leading-tight font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Presupuestos
          </h1>
        </div>

        <div className="lg:max-w-xl lg:mx-auto">
          {/* Selector de cliente */}
          <div className="mb-6 relative">
            <label className="text-[11px] tracking-[0.12em] uppercase text-[#8A8371] font-semibold block mb-2">
              Cliente
            </label>
            <button
              onClick={() => {
                setClientePickerOpen((v) => !v);
                setNuevoClienteModo(false);
              }}
              className="w-full flex items-center justify-between bg-white border border-[#D9D2C2] rounded-md px-4 py-3.5 text-left hover:border-[#B08650] transition-colors"
            >
              <div>
                <div className="font-semibold text-[15px]">
                  {cargandoClientes ? "Cargando…" : cliente?.nombre || "Seleccionar cliente"}
                </div>
                {cliente?.direccion && <div className="text-[13px] text-[#8A8371]">{cliente.direccion}</div>}
              </div>
              <ChevronDown
                size={18}
                className={`text-[#8A8371] transition-transform ${clientePickerOpen ? "rotate-180" : ""}`}
              />
            </button>

            {clientePickerOpen && (
              <div className="absolute z-20 mt-1.5 w-full bg-white border border-[#D9D2C2] rounded-md shadow-lg overflow-hidden">
                {!nuevoClienteModo ? (
                  <>
                    <div className="max-h-52 overflow-y-auto">
                      {clientes.length === 0 && (
                        <div className="px-4 py-3 text-[13px] text-[#8A8371]">Todavía no hay clientes cargados.</div>
                      )}
                      {clientes.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setClienteId(c.id);
                            setClientePickerOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F4F2ED] text-left"
                        >
                          <div>
                            <div className="text-[14px] font-medium">{c.nombre}</div>
                            {c.direccion && <div className="text-[12px] text-[#8A8371]">{c.direccion}</div>}
                          </div>
                          {c.id === clienteId && <Check size={16} className="text-[#3C7A5C]" />}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setNuevoClienteModo(true)}
                      className="w-full flex items-center gap-2 px-4 py-3 border-t border-[#EAE5D9] font-semibold text-[14px] hover:bg-[#FBF7EE]"
                      style={{ color: colorPrimario }}
                    >
                      <UserPlus size={16} />
                      Crear cliente nuevo
                    </button>
                  </>
                ) : (
                  <div className="p-4 space-y-2.5">
                    <input
                      autoFocus
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      placeholder="Nombre del cliente"
                      className="w-full border border-[#D9D2C2] rounded px-3 py-2 text-[14px] outline-none focus:border-[#B08650]"
                    />
                    <input
                      value={nuevoDireccion}
                      onChange={(e) => setNuevoDireccion(e.target.value)}
                      placeholder="Empresa (opcional)"
                      className="w-full border border-[#D9D2C2] rounded px-3 py-2 text-[14px] outline-none focus:border-[#B08650]"
                    />
                    <input
                      type="tel"
                      value={nuevoTelefono}
                      onChange={(e) => setNuevoTelefono(e.target.value)}
                      placeholder="Teléfono (opcional)"
                      className="w-full border border-[#D9D2C2] rounded px-3 py-2 text-[14px] outline-none focus:border-[#B08650]"
                    />
                    <input
                      type="email"
                      value={nuevoEmail}
                      onChange={(e) => setNuevoEmail(e.target.value)}
                      placeholder="Email (opcional)"
                      className="w-full border border-[#D9D2C2] rounded px-3 py-2 text-[14px] outline-none focus:border-[#B08650]"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={crearClienteNuevo}
                        className="flex-1 text-white rounded px-3 py-2 text-[13px] font-semibold"
                        style={{ backgroundColor: colorPrimario }}
                      >
                        Guardar cliente
                      </button>
                      <button
                        onClick={() => setNuevoClienteModo(false)}
                        className="px-3 py-2 text-[13px] text-[#8A8371] hover:text-[#1E2A38]"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selector de modo de carga */}
          <div className="mb-4">
            <label className="text-[11px] tracking-[0.12em] uppercase text-[#8A8371] font-semibold block mb-2">
              Agregar ítem
            </label>

            {mostrarPestañas && (
              <div className="flex gap-1.5 bg-[#EAE5D9] rounded-md p-1 mb-3">
                <button
                  onClick={() => setModo("catalogo")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded py-2 text-[13px] font-semibold transition-colors ${
                    modo === "catalogo" ? "bg-white text-[#1E2A38] shadow-sm" : "text-[#8A8371]"
                  }`}
                >
                  <Search size={14} /> Desde catálogo
                </button>
                <button
                  onClick={() => setModo("personalizado")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded py-2 text-[13px] font-semibold transition-colors ${
                    modo === "personalizado" ? "bg-white text-[#1E2A38] shadow-sm" : "text-[#8A8371]"
                  }`}
                >
                  <PenLine size={14} /> Ítem personalizado
                </button>
              </div>
            )}

            {modo === "catalogo" ? (
              <div className="relative" ref={buscadorRef}>
                <div className="relative">
                  <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8371]" />
                  <input
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value);
                      setBuscadorOpen(true);
                    }}
                    onFocus={() => setBuscadorOpen(true)}
                    placeholder="Buscar en el catálogo…"
                    className="w-full bg-white border border-[#D9D2C2] rounded-md pl-10 pr-4 py-3.5 text-[15px] outline-none focus:border-[#B08650] transition-colors"
                  />
                </div>

                {buscadorOpen && (
                  <div className="absolute z-10 mt-1.5 w-full bg-white border border-[#D9D2C2] rounded-md shadow-lg max-h-64 overflow-y-auto">
                    {resultados.length === 0 ? (
                      <div className="px-4 py-3 text-[13px] text-[#8A8371]">Sin resultados</div>
                    ) : (
                      resultados.map((p) => (
                        <div key={p.id} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F4F2ED]">
                          <button
                            onClick={() => agregarProducto(p)}
                            className="flex-1 flex items-center justify-between text-left min-w-0"
                          >
                            <div className="min-w-0">
                              <div className="text-[14px] font-medium truncate">{p.nombre}</div>
                              <div className="text-[12px] text-[#8A8371]">{fmtARS(p.precio)} / {p.unidad}</div>
                            </div>
                            <Plus size={16} style={{ color: colorPrimario }} className="shrink-0 ml-2" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              pedirEliminarProducto(p);
                            }}
                            className="p-2 ml-1 rounded text-[#B0876B] hover:bg-white shrink-0"
                            aria-label="Eliminar del catalogo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-[#D9D2C2] rounded-md p-3.5">
                <p className="text-[12px] text-[#8A8371] mb-2.5 leading-snug">
                  Para materiales cotizados por trabajo o para cargar tu mano de obra.
                </p>
                <div className="grid grid-cols-[1fr_92px] gap-2 mb-2">
                  <input
                    value={itemNombre}
                    onChange={(e) => setItemNombre(e.target.value)}
                    placeholder='Ej: Mano de obra, Codo 1/2"…'
                    className="border border-[#D9D2C2] rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#B08650]"
                  />
                  <input
                    type="number"
                    min={1}
                    value={itemCantidad}
                    onChange={(e) => setItemCantidad(e.target.value)}
                    placeholder="Cant."
                    className="border border-[#D9D2C2] rounded px-2 py-2.5 text-[14px] text-center outline-none focus:border-[#B08650]"
                  />
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    type="number"
                    min={0}
                    value={itemPrecio}
                    onChange={(e) => setItemPrecio(e.target.value)}
                    placeholder="Precio unitario ($)"
                    className="border border-[#D9D2C2] rounded px-3 py-2.5 text-[14px] outline-none focus:border-[#B08650]"
                  />
                  <button
                    onClick={agregarItemPersonalizado}
                    className="flex items-center gap-1.5 text-white rounded px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap"
                    style={{ backgroundColor: colorPrimario }}
                  >
                    <Plus size={15} /> Agregar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Líneas del presupuesto */}
          <div className="border border-[#D9D2C2] rounded-md bg-white overflow-hidden mb-6">
            {lineas.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] text-[#8A8371]">
                Todavía no agregaste productos. Buscá arriba para empezar.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[1fr_72px_92px_92px_32px] gap-2 px-5 py-2.5 border-b border-[#EAE5D9] text-[10px] tracking-[0.1em] uppercase text-[#8A8371] font-semibold">
                  <span>Producto</span>
                  <span className="text-center">Cant.</span>
                  <span className="text-right">P. unit.</span>
                  <span className="text-right">Subtotal</span>
                  <span />
                </div>
                {lineas.map((l) => (
                  <div
                    key={l.id}
                    className="grid grid-cols-[1fr_72px_92px_92px_32px] gap-2 px-5 py-3 items-center border-b border-[#F1EEE6] last:border-b-0"
                  >
                    <span className="text-[14px] font-medium">{l.nombre}</span>
                    <input
                      type="number"
                      min={1}
                      value={l.cantidad}
                      onChange={(e) => actualizarCantidad(l.id, e.target.value)}
                      className="w-full text-center border border-[#D9D2C2] rounded px-1 py-1 text-[13px] outline-none focus:border-[#B08650]"
                    />
                    <input
                      type="number"
                      min={0}
                      value={l.precio}
                      onChange={(e) => actualizarPrecio(l.id, e.target.value)}
                      className="w-full text-right border border-[#D9D2C2] rounded px-1 py-1 text-[13px] outline-none focus:border-[#B08650]"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    />
                    <span className="text-[13px] text-right font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {fmtARS(l.cantidad * l.precio)}
                    </span>
                    <button onClick={() => quitarLinea(l.id)} className="text-[#B0876B] hover:text-[#A0432E] justify-self-center">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between border-t-2 pt-4 mb-8" style={{ borderColor: colorPrimario }}>
            <span className="text-[13px] tracking-[0.1em] uppercase text-[#8A8371] font-semibold">Total presupuesto</span>
            <span className="text-[26px] font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {fmtARS(total)}
            </span>
          </div>

          <button
            onClick={generarPresupuesto}
            disabled={lineas.length === 0 || !clienteId || enviando}
            className="w-full text-white rounded-md py-3.5 text-[14px] font-semibold tracking-[0.02em] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: colorPrimario }}
          >
            {enviando ? "Enviando…" : "Generar y enviar presupuesto"}
          </button>
        </div>

        {/* ---------------- Presupuestos a cobrar ---------------- */}
        <div className="border-t pt-6 mt-10" style={{ borderColor: "#D9D2C2" }}>
          <h2 className="text-[18px] font-bold mb-1 flex items-center gap-2">
            <DollarSign size={17} style={{ color: colorPrimario }} />
            Presupuestos a cobrar
          </h2>
          <p className="text-[13px] text-[#8A8371] mb-4">
            Presupuestos nuevos o con pago parcial. Cobra todo de una vez o de a poco.
          </p>

          {conSaldo.length > 0 && (
            <div
              className="rounded-md px-4 py-3 mb-4 flex items-center justify-between"
              style={{ backgroundColor: "#F4F2ED" }}
            >
              <span className="text-[13px] font-medium text-[#5A5647]">
                Total pendiente de cobrar ({conSaldo.length} {conSaldo.length === 1 ? "presupuesto" : "presupuestos"})
              </span>
              <span
                className="text-[18px] font-bold"
                style={{ fontFamily: "IBM Plex Mono, monospace", color: colorPrimario }}
              >
                {fmtARS(totalPendiente)}
              </span>
            </div>
          )}

          {conSaldo.length > 0 && (
            <input
              value={busquedaCobros}
              onChange={function (e) {
                setBusquedaCobros(e.target.value);
              }}
              placeholder="Buscar por cliente..."
              className="w-full border border-[#D9D2C2] rounded-md px-3.5 py-2.5 text-[13px] outline-none focus:border-[#B08650] mb-4"
            />
          )}

          {cargandoPendientes ? (
            <p className="text-[14px] text-[#8A8371]">Cargando...</p>
          ) : conSaldo.length === 0 ? (
            <div className="bg-white border border-[#D9D2C2] rounded-md px-5 py-8 text-center">
              <p className="text-[14px] text-[#8A8371]">No hay saldos pendientes por ahora.</p>
            </div>
          ) : conSaldoFiltrado.length === 0 ? (
            <div className="bg-white border border-[#D9D2C2] rounded-md px-5 py-8 text-center">
              <p className="text-[14px] text-[#8A8371]">Ningun cliente coincide con "{busquedaCobros}".</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-3">
              {conSaldoFiltrado.map(function (p) {
                var valorNuevo = nuevoPago[p.id] !== undefined ? nuevoPago[p.id] : "";
                var abierto = !!detalleAbierto[p.id];
                var listaItems = itemsPorPresupuesto[p.id] || [];

                return (
                  <div key={p.id} className="bg-white border border-[#D9D2C2] rounded-md px-4 sm:px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <DollarSign size={18} className="mt-0.5 text-[#B0876B] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[15px] font-semibold truncate">
                            {clientesPorId[p.clienteId] || "(sin cliente)"}
                          </div>
                          <div className="text-[12px] text-[#8A8371]">
                            Presupuesto N. {p.numero}
                            {p.fecha && " · Creado: " + fmtFechaCorta(p.fecha)}
                            {p.fechaUltimoCobro && p.montoCobrado > 0 && " · Último cobro: " + fmtFechaCorta(p.fechaUltimoCobro)}
                          </div>
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
                                <div key={it.id} className="flex items-center justify-between text-[12px] gap-2">
                                  <span className="text-[#1E2A38]">
                                    {it.cantidad}x {it.nombre}
                                  </span>
                                  <span className="text-[#5A5647] shrink-0" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
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
                        disabled={!!guardandoPago[p.id]}
                        className="rounded-md px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: colorPrimario }}
                      >
                        {guardandoPago[p.id] ? "..." : "Agregar cobro"}
                      </button>
                    </div>
                    <button
                      onClick={function () {
                        agregarCobro(p, p.saldoPendiente);
                      }}
                      disabled={!!guardandoPago[p.id]}
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

        <p className="text-[11px] text-[#8A8371] text-center mt-8 leading-relaxed">
          Base: {airtableBaseId || "(sin configurar)"}
        </p>
      </div>
      <Toast mensaje={mensajeToast} visible={enviado} colorPrimario={colorPrimario} />
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
