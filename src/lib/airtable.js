// -----------------------------------------------------------------------
// CAPA DE DATOS — habla con el servidor real (presupuestos-server)
// -----------------------------------------------------------------------
// En desarrollo local, habla con el servidor en la misma red (mismo host,
// puerto 3001). Cuando esto esté desplegado de verdad (Netlify + Render),
// usamos la variable de entorno VITE_API_URL que configuramos en Netlify,
// apuntando a la URL real del servidor en Render.
const SERVIDOR = import.meta.env.VITE_API_URL || ("http://" + window.location.hostname + ":3001");

// === Clientes (modulo Presupuestos) ===

export async function listarClientes(airtableBaseId) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/clientes`);
  if (!res.ok) throw new Error("No se pudieron cargar los clientes");
  const data = await res.json();
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

// === Productos / catalogo ===

export async function listarProductos(airtableBaseId) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/productos`);
  if (!res.ok) throw new Error("No se pudo cargar el catálogo");
  return res.json();
}

export async function eliminarProducto(airtableBaseId, productoId) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/productos/${productoId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("No se pudo eliminar el producto");
  return res.json();
}

// === Presupuestos ===

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

export async function registrarCobro(airtableBaseId, presupuestoId, incremento) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/presupuestos/${presupuestoId}/cobro`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incremento }),
  });
  if (!res.ok) throw new Error("No se pudo registrar el cobro");
  return res.json();
}

// === Turnos (base separada "Sistema Turnos") ===

export async function listarPacientes(airtableBaseId) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/pacientes`);
  if (!res.ok) throw new Error("No se pudieron cargar los pacientes");
  return res.json();
}

export async function crearPaciente(airtableBaseId, { nombre, telefono, email, notas }) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/pacientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, telefono, email, notas }),
  });
  if (!res.ok) throw new Error("No se pudo crear el paciente");
  return res.json();
}

export async function actualizarPaciente(airtableBaseId, pacienteId, { nombre, telefono, email, notas }) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/pacientes/${pacienteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, telefono, email, notas }),
  });
  if (!res.ok) throw new Error("No se pudo actualizar el paciente");
  return res.json();
}

export async function eliminarPaciente(airtableBaseId, pacienteId) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/pacientes/${pacienteId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("No se pudo eliminar el paciente");
  return res.json();
}

export async function listarTurnos(airtableBaseId) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/turnos`);
  if (!res.ok) throw new Error("No se pudieron cargar los turnos");
  return res.json();
}

export async function crearTurno(airtableBaseId, { pacienteId, fecha, hora, notas }) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/turnos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pacienteId, fecha, hora, notas }),
  });
  if (!res.ok) throw new Error("No se pudo crear el turno");
  return res.json();
}

export async function actualizarEstadoTurno(airtableBaseId, turnoId, estado) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/turnos/${turnoId}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) throw new Error("No se pudo actualizar el turno");
  return res.json();
}

export async function reprogramarTurno(airtableBaseId, turnoId, { fecha, hora }) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/turnos/${turnoId}/reprogramar`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fecha, hora }),
  });
  if (!res.ok) throw new Error("No se pudo reprogramar el turno");
  return res.json();
}

export async function eliminarTurno(airtableBaseId, turnoId) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/turnos/${turnoId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("No se pudo eliminar el turno");
  return res.json();
}

// === Turnos recurrentes ===

export async function listarTurnosRecurrentes(airtableBaseId) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/turnos-recurrentes`);
  if (!res.ok) throw new Error("No se pudieron cargar las repeticiones");
  return res.json();
}

export async function crearTurnoRecurrente(airtableBaseId, { pacienteId, diaSemana, hora, fechaInicio, notas }) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/turnos-recurrentes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pacienteId, diaSemana, hora, fechaInicio, notas }),
  });
  if (!res.ok) throw new Error("No se pudo activar la repeticion");
  return res.json();
}

export async function actualizarActivoTurnoRecurrente(airtableBaseId, reglaId, activo) {
  const res = await fetch(`${SERVIDOR}/api/${airtableBaseId}/turnos-recurrentes/${reglaId}/activo`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activo }),
  });
  if (!res.ok) throw new Error("No se pudo actualizar");
  return res.json();
}
