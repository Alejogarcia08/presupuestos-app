// -----------------------------------------------------------------------
// TABLA DE CONFIGURACIÓN — MÓDULO FLOTA Y CONDUCTORES
// -----------------------------------------------------------------------
// Mismo patrón que clientes.js y clientesTurnos.js. Cuando crees la base
// "Sistema Flota" en Airtable, reemplazá "PENDIENTE" por el Base ID real
// (lo encontrás en la URL de la base, el codigo que empieza con "app...").
// -----------------------------------------------------------------------

export const CLIENTES_FLOTA = {
  "demo-flota": {
    nombrePyme: "Demo — Flota y conductores",
    airtableBaseId: "app3pfdo52PJfNfnV",
    colorPrimario: "#1E2A38",
  },
};

export const CLIENTE_FLOTA_NO_ENCONTRADO = {
  nombrePyme: "Cliente no encontrado",
  airtableBaseId: null,
  colorPrimario: "#1E2A38",
};
