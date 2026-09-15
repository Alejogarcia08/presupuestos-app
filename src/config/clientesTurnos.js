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
    // Pegá acá el link de "Escribir una reseña" de Google del negocio.
    // Si lo dejas vacio, el botón de pedir reseña igual funciona, solo
    // que el mensaje no va a incluir el link.
    linkResenaGoogle: "",
  },
};

export const CLIENTE_TURNOS_NO_ENCONTRADO = {
  nombrePyme: "Cliente no encontrado",
  airtableBaseId: null,
  colorPrimario: "#1E2A38",
};
