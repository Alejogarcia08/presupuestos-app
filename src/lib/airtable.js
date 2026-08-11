// -----------------------------------------------------------------------
// CAPA DE DATOS — ahora habla con el servidor real (presupuestos-server)
// -----------------------------------------------------------------------
// El servidor tiene que estar corriendo en paralelo (npm run dev, desde
// la carpeta presupuestos-server) en http://localhost:3001
// -----------------------------------------------------------------------

// En desarrollo local, habla con el servidor en la misma red (mismo host,
// puerto 3001). Cuando esto esté desplegado de verdad (Netlify + Render),
// usamos la variable de entorno VITE_API_URL que configuramos en Netlify,
// apuntando a la URL real del servidor en Render.
const SERVIDOR = import.meta.env.VITE_API_URL || ("http://" + window.location.hostname + ":3001");

export async function listarClientes(airtableBaseId) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/clientes`);
  if (!res.ok) throw new Error("No se pudieron cargar los clientes");
  const data = await res.json();
  // Alias: el formulario muestra "direccion", tu tabla real usa "Empresa"
  return data.map((c) => ({ ...c, direccion: c.empresa }));
}

export async function crearCliente(airtableBaseId, { nombre, direccion, telefono, email }) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/clientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, empresa: direccion, telefono, email }),
  });
  if (!res.ok) throw new Error("No se pudo crear el cliente");
  return res.json();
}

export async function listarProductos(airtableBaseId) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/productos`);
  if (!res.ok) throw new Error("No se pudo cargar el catálogo");
  return res.json();
}

export async function enviarPresupuesto(airtableBaseId, { clienteId, lineas, total }) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/presupuestos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clienteId, lineas }),
  });
  if (!res.ok) throw new Error("No se pudo enviar el presupuesto");
  return res.json();
}

export async function listarPresupuestos(airtableBaseId) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/presupuestos`);
  if (!res.ok) throw new Error("No se pudieron cargar los presupuestos");
  return res.json();
}

export async function listarItemsPresupuesto(airtableBaseId, presupuestoId) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/presupuestos/${presupuestoId}/items`);
  if (!res.ok) throw new Error("No se pudo cargar el detalle");
  return res.json();
}

export async function marcarCobrado(airtableBaseId, presupuestoId, cobrado) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/presupuestos/${presupuestoId}/cobrado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cobrado }),
  });
  if (!res.ok) throw new Error("No se pudo actualizar");
  return res.json();
}

export async function eliminarPresupuesto(airtableBaseId, presupuestoId) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/presupuestos/${presupuestoId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("No se pudo eliminar el presupuesto");
  return res.json();
}

export async function eliminarProducto(airtableBaseId, productoId) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/productos/${productoId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("No se pudo eliminar el producto");
  return res.json();
}

export async function registrarCobro(airtableBaseId, presupuestoId, incremento) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/presupuestos/${presupuestoId}/cobro`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incremento }),
  });
  if (!res.ok) throw new Error("No se pudo registrar el cobro");
  return res.json();
}
