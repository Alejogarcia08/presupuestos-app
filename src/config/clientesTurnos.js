// -----------------------------------------------------------------------
// TABLA DE CONFIGURACIÓN — MÓDULO TURNOS
// -----------------------------------------------------------------------
// Mismo patrón que src/config/clientes.js, pero separado porque este
// módulo usa bases de Airtable con otra estructura (Pacientes/Turnos, no
// Clientes/Productos/Presupuestos).
// -----------------------------------------------------------------------

export const CLIENTES_TURNOS = {
  "demo-turnos": {
    nombrePyme: "Demo — Turnos y agenda",
    airtableBaseId: "app4NnTVjUbsVFAD9",
    colorPrimario: "#1E2A38",
  },
};

export const CLIENTE_TURNOS_NO_ENCONTRADO = {
  nombrePyme: "Cliente no encontrado",
  airtableBaseId: null,
  colorPrimario: "#1E2A38",
};
