import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useParams, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import PresupuestoForm from "./components/PresupuestoForm.jsx";
import MisPresupuestos from "./components/MisPresupuestos.jsx";
import ClientesARevisar from "./components/ClientesARevisar.jsx";
import CobrosPendientes from "./components/CobrosPendientes.jsx";
import { CLIENTES, CLIENTE_NO_ENCONTRADO } from "./config/clientes.js";

// Menu hamburguesa: un boton fijo arriba a la derecha (comodo para tocar
// con el dedo en un celular) que despliega la lista de pantallas.
function MenuNavegacion({ clienteSlug, colorPrimario, activa }) {
  const [abierto, setAbierto] = useState(false);

  var links = [
    { to: "/" + clienteSlug, label: "Nuevo presupuesto", key: "form" },
    { to: "/" + clienteSlug + "/presupuestos", label: "Mis presupuestos", key: "presupuestos" },
    { to: "/" + clienteSlug + "/clientes-a-revisar", label: "Clientes a revisar", key: "clientes" },
    { to: "/" + clienteSlug + "/cobros-pendientes", label: "Cobros pendientes", key: "cobros" },
  ];

  return (
    <div className="fixed top-3 right-3 z-[100]">
      <button
        onClick={function () {
          setAbierto(function (v) {
            return !v;
          });
        }}
        className="bg-white border rounded-full w-11 h-11 flex items-center justify-center shadow"
        style={{ borderColor: "#D9D2C2", color: colorPrimario }}
        aria-label="Abrir menu"
      >
        {abierto ? <X size={22} /> : <Menu size={22} />}
      </button>

      {abierto && (
        <div
          className="absolute top-13 right-0 mt-2 bg-white border rounded-lg shadow-lg overflow-hidden w-56"
          style={{ borderColor: "#D9D2C2" }}
        >
          {links.map(function (l) {
            var esActiva = l.key === activa;
            return (
              <Link
                key={l.key}
                to={l.to}
                onClick={function () {
                  setAbierto(false);
                }}
                className="block px-4 py-3.5 text-[15px] font-medium border-b last:border-b-0"
                style={{
                  borderColor: "#F1EEE6",
                  color: esActiva ? colorPrimario : "#1E2A38",
                  backgroundColor: esActiva ? "#F4F2ED" : "white",
                  fontWeight: esActiva ? 700 : 500,
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PaginaCliente() {
  const { clienteSlug } = useParams();
  const config = CLIENTES[clienteSlug] || CLIENTE_NO_ENCONTRADO;

  if (!CLIENTES[clienteSlug]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F2ED] text-[#1E2A38] px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2">Página no encontrada</h1>
          <p className="text-[14px] text-[#8A8371]">
            No hay ningún cliente configurado en la ruta "/{clienteSlug}". Revisá
            src/config/clientes.js.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MenuNavegacion clienteSlug={clienteSlug} colorPrimario={config.colorPrimario} activa="form" />
      <PresupuestoForm
        airtableBaseId={config.airtableBaseId}
        nombrePyme={config.nombrePyme}
        modoDefault={config.modoDefault}
        colorPrimario={config.colorPrimario}
      />
    </div>
  );
}

function PaginaMisPresupuestos() {
  const { clienteSlug } = useParams();
  const config = CLIENTES[clienteSlug] || CLIENTE_NO_ENCONTRADO;

  return (
    <div>
      <MenuNavegacion clienteSlug={clienteSlug} colorPrimario={config.colorPrimario} activa="presupuestos" />
      <MisPresupuestos
        airtableBaseId={config.airtableBaseId}
        nombrePyme={config.nombrePyme}
        colorPrimario={config.colorPrimario}
      />
    </div>
  );
}

function PaginaClientesARevisar() {
  const { clienteSlug } = useParams();
  const config = CLIENTES[clienteSlug] || CLIENTE_NO_ENCONTRADO;

  return (
    <div>
      <MenuNavegacion clienteSlug={clienteSlug} colorPrimario={config.colorPrimario} activa="clientes" />
      <ClientesARevisar
        airtableBaseId={config.airtableBaseId}
        nombrePyme={config.nombrePyme}
        colorPrimario={config.colorPrimario}
      />
    </div>
  );
}

function PaginaCobrosPendientes() {
  const { clienteSlug } = useParams();
  const config = CLIENTES[clienteSlug] || CLIENTE_NO_ENCONTRADO;

  return (
    <div>
      <MenuNavegacion clienteSlug={clienteSlug} colorPrimario={config.colorPrimario} activa="cobros" />
      <CobrosPendientes
        airtableBaseId={config.airtableBaseId}
        nombrePyme={config.nombrePyme}
        colorPrimario={config.colorPrimario}
      />
    </div>
  );
}

function Inicio() {
  const slugs = Object.keys(CLIENTES);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F2ED] text-[#1E2A38] px-6">
      <div className="max-w-sm w-full">
        <h1 className="text-xl font-bold mb-4">Clientes configurados</h1>
        <div className="space-y-2">
          {slugs.map((slug) => (
            <Link
              key={slug}
              to={"/" + slug}
              className="block bg-white border border-[#D9D2C2] rounded-md px-4 py-3 hover:border-[#B08650]"
            >
              <div className="font-medium text-[14px]">{CLIENTES[slug].nombrePyme}</div>
              <div className="text-[12px] text-[#8A8371]">/{slug}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/:clienteSlug" element={<PaginaCliente />} />
        <Route path="/:clienteSlug/presupuestos" element={<PaginaMisPresupuestos />} />
        <Route path="/:clienteSlug/clientes-a-revisar" element={<PaginaClientesARevisar />} />
        <Route path="/:clienteSlug/cobros-pendientes" element={<PaginaCobrosPendientes />} />
      </Routes>
    </BrowserRouter>
  );
}
