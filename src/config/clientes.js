// -----------------------------------------------------------------------
// TABLA DE CONFIGURACIÓN POR CLIENTE
// -----------------------------------------------------------------------
// Cada entrada de este objeto es una PyME. La "key" (ej: "plomeria-juan")
// es el slug que va en la URL: tudominio.com/plomeria-juan
//
// Por ahora el catálogo está harcodeado acá como ejemplo (mock). Cuando
// conectemos la API real de Airtable, "catalogo" se va a reemplazar por
// una llamada a airtableBaseId usando src/lib/airtable.js — la forma de
// usar el componente <PresupuestoForm /> no cambia.
//
// Para agregar un cliente nuevo: copiá un bloque, cambiá la key y los
// valores. No hay que tocar ningún otro archivo del proyecto.
// -----------------------------------------------------------------------

export const CLIENTES = {
  "plomeria-hernan": {
    nombrePyme: "Hernan Jorge Garcia — Gasista Matriculado y Plomería",
    // Airtable Base ID real (cuando conectemos la API de verdad)
    airtableBaseId: "app9PIKzet7oEn6b8",
    // "catalogo" -> el cliente busca productos de una lista fija
    // "personalizado" -> el cliente carga ítems a mano (sin catálogo fijo)
    // "ambos" -> muestra las dos pestañas, como en el prototipo original
    modoDefault: "ambos",
    colorPrimario: "#1E2A38",
    catalogo: [], // sin catálogo fijo — todo se carga como ítem personalizado
  },

  "ferreteria-lopez": {
    nombrePyme: "Ferretería López",
    airtableBaseId: "REEMPLAZAR_CON_BASE_ID",
    modoDefault: "catalogo",
    colorPrimario: "#1E2A38",
    catalogo: [
      { id: "p1", nombre: "Codo de gas 1/2\"", unidad: "unidad", precio: 850 },
      { id: "p2", nombre: "Codo de gas 3/4\"", unidad: "unidad", precio: 1120 },
      { id: "p3", nombre: "Caño de cobre 1/2\" (barra 6m)", unidad: "barra", precio: 14500 },
      { id: "p4", nombre: "Llave de paso de gas 1/2\"", unidad: "unidad", precio: 3200 },
      { id: "p5", nombre: "Cinta de teflón", unidad: "rollo", precio: 450 },
    ],
  },
};

// Config por defecto si alguien entra a una ruta que no existe en la tabla
export const CLIENTE_NO_ENCONTRADO = {
  nombrePyme: "Cliente no encontrado",
  airtableBaseId: null,
  modoDefault: "ambos",
  colorPrimario: "#1E2A38",
  catalogo: [],
};
