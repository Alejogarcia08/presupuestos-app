import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Plus, Trash2, UserPlus, ChevronDown, Check, X, PenLine } from "lucide-react";
import { listarClientes, crearCliente, enviarPresupuesto, listarProductos, eliminarProducto } from "../lib/airtable.js";
import Toast from "./Toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

const fmtARS = (n) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

/**
 * Formulario de presupuesto, parametrizado por PyME.
 *
 * Props:
 * - airtableBaseId: string  -> qué base de Airtable usar (vía src/lib/airtable.js)
 * - nombrePyme: string      -> se muestra en el encabezado
 * - catalogo: array         -> catálogo fijo de esa PyME (vacío si no usa catálogo)
 * - modoDefault: "catalogo" | "personalizado" | "ambos"
 * - colorPrimario: string   -> color de acento (hex) de esa PyME
 */
export default function PresupuestoForm({
  airtableBaseId,
  nombrePyme,
  modoDefault = "ambos",
  colorPrimario = "#1E2A38",
}) {
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

  // Carga inicial del catálogo real de esta PyME (productos ya guardados
  // en Airtable, incluyendo los que se fueron cargando como "ítem
  // personalizado" en presupuestos anteriores)
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
          setMensajeToast('"' + producto.nombre + '" eliminado del catalogo');
          setEnviado(true);
          setTimeout(function () {
            setEnviado(false);
          }, 2500);
        } catch (err) {
          setMensajeToast("No se pudo eliminar, intenta de nuevo");
          setEnviado(true);
          setTimeout(function () {
            setEnviado(false);
          }, 2500);
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

  async function generarPresupuesto() {
    setEnviando(true);
    const lineasParaEnviar = lineas.map((l) => ({
      // Si el id empieza con "manual-" es un ítem cargado a mano (todavía
      // no existe en el catálogo de Airtable) — no le pasamos productoId,
      // así el servidor lo crea. Si viene del catálogo, su id YA es el
      // record id real de Airtable, así que se lo pasamos como productoId.
      productoId: l.id.startsWith("manual-") ? undefined : l.id,
      nombre: l.nombre,
      precio: l.precio,
      cantidad: l.cantidad,
    }));
    await enviarPresupuesto(airtableBaseId, { clienteId, lineas: lineasParaEnviar, total });

    // Guardamos estos datos ANTES de limpiar el formulario, para poder
    // mostrarlos en el mensaje de confirmación.
    var nombreParaMensaje = cliente ? cliente.nombre : "el cliente";
    var totalParaMensaje = total;

    // Limpiamos el formulario para poder mandar el próximo presupuesto sin
    // tener que borrar nada a mano.
    setLineas([]);
    setBusqueda("");
    setItemNombre("");
    setItemPrecio("");
    setItemCantidad(1);
    setClienteId(null);
    setClientePickerOpen(false);

    // Refrescamos el catálogo: si se crearon productos nuevos (ítems
    // personalizados), ya quedan disponibles para buscar la próxima vez.
    listarProductos(airtableBaseId).then(setCatalogo);

    setEnviando(false);
    setEnviado(true);
    setMensajeToast(
      "Presupuesto enviado a " + nombreParaMensaje + " por " + fmtARS(totalParaMensaje)
    );
    setTimeout(function () {
      setEnviado(false);
    }, 4000);
  }

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#1E2A38]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-8 sm:py-10 lg:max-w-3xl lg:my-14 lg:bg-white lg:border lg:border-[#D9D2C2] lg:rounded-xl lg:shadow-sm lg:px-14 lg:py-12">
        {/* Encabezado */}
        <div className="mb-8">
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#8A8371] font-semibold mb-1">
            {nombrePyme}
          </p>
          <h1 className="text-[28px] leading-tight font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Nuevo presupuesto
          </h1>
        </div>

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
              {cliente?.direccion && (
                <div className="text-[13px] text-[#8A8371]">{cliente.direccion}</div>
              )}
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
                      <div className="px-4 py-3 text-[13px] text-[#8A8371]">
                        Todavía no hay clientes cargados.
                      </div>
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
                      <div
                        key={p.id}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F4F2ED]"
                      >
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
                  placeholder="Ej: Mano de obra, Codo 1/2&quot;…"
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
          {enviando ? "Enviando…" : enviado ? "✓ Presupuesto enviado" : "Generar y enviar presupuesto"}
        </button>

        <p className="text-[11px] text-[#8A8371] text-center mt-4 leading-relaxed">
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
