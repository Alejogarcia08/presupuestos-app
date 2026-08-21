import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useParams, Link } from "react-router-dom";
import { Menu, X, Home, ArrowLeft } from "lucide-react";
import PresupuestoForm from "./components/PresupuestoForm.jsx";
import MisPresupuestos from "./components/MisPresupuestos.jsx";
import ClientesARevisar from "./components/ClientesARevisar.jsx";
import CobrosPendientes from "./components/CobrosPendientes.jsx";
import Turnos from "./components/Turnos.jsx";
import Pacientes from "./components/Pacientes.jsx";
import SeleccionAgenda from "./components/SeleccionAgenda.jsx";
import SeleccionServicios from "./components/SeleccionServicios.jsx";
import PerfilPaciente from "./components/PerfilPaciente.jsx";
import Fidelizacion from "./components/Fidelizacion.jsx";
import LandingPage from "./components/LandingPage.jsx";
import DemoGate from "./components/DemoGate.jsx";
import { CLIENTES, CLIENTE_NO_ENCONTRADO } from "./config/clientes.js";
import { CLIENTES_TURNOS, CLIENTE_TURNOS_NO_ENCONTRADO } from "./config/clientesTurnos.js";

var CLAVE_DEMO = "cambiar-esta-clave";
var MARCA = "Gestion PyME";

function useTitulo(nombrePantalla) {
  useEffect(function () {
    document.title = nombrePantalla + " - " + MARCA;
  }, [nombrePantalla]);
}

function MenuNavegacion({ clienteSlug, colorPrimario, activa }) {
  const [abierto, setAbierto] = useState(false);

  var base = [
    { to: "/", label: "Inicio", key: "inicio" },
    { to: "/servicios", label: "Modulos", key: "modulos" },
  ];

  var linksDelGrupo = [];
  if (activa === "form" || activa === "presupuestos" || activa === "cobros") {
    linksDelGrupo = [
      { to: "/" + clienteSlug, label: "Nuevo presupuesto", key: "form" },
      { to: "/" + clienteSlug + "/presupuestos", label: "Presupuestos cobrados", key: "presupuestos" },
      { to: "/" + clienteSlug + "/cobros-pendientes", label: "Presupuestos a cobrar", key: "cobros" },
    ];
  } else if (activa === "clientes") {
    linksDelGrupo = [{ to: "/" + clienteSlug + "/clientes-a-revisar", label: "Clientes a revisar", key: "clientes" }];
  }

  var links = base.concat(linksDelGrupo);

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

// Menu del modulo Turnos: Inicio, Turnos, Fidelizacion
function MenuTurnos({ turnoSlug, colorPrimario, activa }) {
  const [abierto, setAbierto] = useState(false);

  var links = [
    { to: "/", label: "Inicio", key: "inicio" },
    { to: "/agenda", label: "Modulos", key: "modulos" },
    { to: "/turnos/" + turnoSlug, label: "Turnos", key: "turnos" },
    { to: "/turnos/" + turnoSlug + "/pacientes", label: "Pacientes", key: "pacientes" },
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

function ConCandadoSiEsDemo({ config, children }) {
  if (config.esDemoPublico) {
    return (
      <DemoGate clave={CLAVE_DEMO} colorPrimario={config.colorPrimario}>
        {children}
      </DemoGate>
    );
  }
  return children;
}

function PaginaCliente() {
  const { clienteSlug } = useParams();
  const config = CLIENTES[clienteSlug] || CLIENTE_NO_ENCONTRADO;
  useTitulo("Nuevo presupuesto");

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
    <ConCandadoSiEsDemo config={config}>
      <div>
        <MenuNavegacion clienteSlug={clienteSlug} colorPrimario={config.colorPrimario} activa="form" />
        <PresupuestoForm
          airtableBaseId={config.airtableBaseId}
          nombrePyme={config.nombrePyme}
          modoDefault={config.modoDefault}
          colorPrimario={config.colorPrimario}
        />
      </div>
    </ConCandadoSiEsDemo>
  );
}

function PaginaMisPresupuestos() {
  const { clienteSlug } = useParams();
  const config = CLIENTES[clienteSlug] || CLIENTE_NO_ENCONTRADO;
  useTitulo("Presupuestos cobrados");

  return (
    <ConCandadoSiEsDemo config={config}>
      <div>
        <MenuNavegacion clienteSlug={clienteSlug} colorPrimario={config.colorPrimario} activa="presupuestos" />
        <MisPresupuestos
          airtableBaseId={config.airtableBaseId}
          nombrePyme={config.nombrePyme}
          colorPrimario={config.colorPrimario}
        />
      </div>
    </ConCandadoSiEsDemo>
  );
}

function PaginaClientesARevisar() {
  const { clienteSlug } = useParams();
  const config = CLIENTES[clienteSlug] || CLIENTE_NO_ENCONTRADO;
  useTitulo("Clientes a revisar");

  return (
    <ConCandadoSiEsDemo config={config}>
      <div>
        <MenuNavegacion clienteSlug={clienteSlug} colorPrimario={config.colorPrimario} activa="clientes" />
        <ClientesARevisar
          airtableBaseId={config.airtableBaseId}
          nombrePyme={config.nombrePyme}
          colorPrimario={config.colorPrimario}
        />
      </div>
    </ConCandadoSiEsDemo>
  );
}

function PaginaCobrosPendientes() {
  const { clienteSlug } = useParams();
  const config = CLIENTES[clienteSlug] || CLIENTE_NO_ENCONTRADO;
  useTitulo("Presupuestos a cobrar");

  return (
    <ConCandadoSiEsDemo config={config}>
      <div>
        <MenuNavegacion clienteSlug={clienteSlug} colorPrimario={config.colorPrimario} activa="cobros" />
        <CobrosPendientes
          airtableBaseId={config.airtableBaseId}
          nombrePyme={config.nombrePyme}
          colorPrimario={config.colorPrimario}
        />
      </div>
    </ConCandadoSiEsDemo>
  );
}

// Pagina del modulo Turnos (base de Airtable distinta a la de Presupuestos)
function PaginaTurnos() {
  const { turnoSlug } = useParams();
  const config = CLIENTES_TURNOS[turnoSlug] || CLIENTE_TURNOS_NO_ENCONTRADO;
  useTitulo("Turnos");

  if (!CLIENTES_TURNOS[turnoSlug]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F2ED] text-[#1E2A38] px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2">Página no encontrada</h1>
          <p className="text-[14px] text-[#8A8371]">
            No hay ningún cliente configurado en la ruta "/turnos/{turnoSlug}". Revisá
            src/config/clientesTurnos.js.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MenuTurnos turnoSlug={turnoSlug} colorPrimario={config.colorPrimario} activa="turnos" />
      <Turnos
        airtableBaseId={config.airtableBaseId}
        turnoSlug={turnoSlug}
        nombrePyme={config.nombrePyme}
        colorPrimario={config.colorPrimario}
      />
    </div>
  );
}

// Pagina de "Pacientes" — listado completo, cada uno lleva a su perfil
function PaginaPacientes() {
  const { turnoSlug } = useParams();
  const config = CLIENTES_TURNOS[turnoSlug] || CLIENTE_TURNOS_NO_ENCONTRADO;
  useTitulo("Pacientes");

  return (
    <div>
      <MenuTurnos turnoSlug={turnoSlug} colorPrimario={config.colorPrimario} activa="pacientes" />
      <Pacientes
        airtableBaseId={config.airtableBaseId}
        turnoSlug={turnoSlug}
        nombrePyme={config.nombrePyme}
        colorPrimario={config.colorPrimario}
      />
    </div>
  );
}

// Pagina de perfil de un paciente puntual
function PaginaPerfilPaciente() {
  const { turnoSlug, pacienteId } = useParams();
  const config = CLIENTES_TURNOS[turnoSlug] || CLIENTE_TURNOS_NO_ENCONTRADO;
  useTitulo("Perfil de paciente");

  return (
    <div>
      <MenuTurnos turnoSlug={turnoSlug} colorPrimario={config.colorPrimario} activa="pacientes" />
      <PerfilPaciente
        airtableBaseId={config.airtableBaseId}
        pacienteId={pacienteId}
        nombrePyme={config.nombrePyme}
        colorPrimario={config.colorPrimario}
      />
    </div>
  );
}

// Pagina placeholder del modulo Fidelizacion
function PaginaFidelizacion() {
  useTitulo("Fidelizacion");
  return (
    <div>
      <MenuTurnos turnoSlug={Object.keys(CLIENTES_TURNOS)[0]} colorPrimario="#1E2A38" activa="fidelizacion" />
      <Fidelizacion />
    </div>
  );
}

function PanelDev() {
  const slugs = Object.keys(CLIENTES);
  useTitulo("Panel");
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
        <Link to="/" className="block text-center text-[13px] mt-6 underline" style={{ color: "#8A8371" }}>
          Volver a la landing
        </Link>
      </div>
    </div>
  );
}

function Landing() {
  const slugs = Object.keys(CLIENTES);
  const primerSlug = slugs.length > 0 ? slugs[0] : null;
  const turnoSlugs = Object.keys(CLIENTES_TURNOS);
  const primerTurnoSlug = turnoSlugs.length > 0 ? turnoSlugs[0] : null;
  useTitulo("Inicio");

  return (
    <LandingPage
      demoSlug={primerSlug}
      demoTurnoSlug={primerTurnoSlug}
      githubUrl="https://github.com/Alejogarcia08/presupuestos-app"
      contactoEmail="alejogarciacar@gmail.com"
      jiraUrl="https://tu-usuario.atlassian.net/jira/software/projects/TU-PROYECTO/boards/1"
    />
  );
}

// Pagina intermedia: elegir entre Turnos y Fidelizacion
function PaginaSeleccionAgenda() {
  const turnoSlugs = Object.keys(CLIENTES_TURNOS);
  const primerTurnoSlug = turnoSlugs.length > 0 ? turnoSlugs[0] : null;
  useTitulo("Turnos y Fidelizacion");

  return <SeleccionAgenda demoTurnoSlug={primerTurnoSlug} />;
}

// Pagina intermedia: elegir entre Presupuestos, Cobros y Clientes a revisar
function PaginaSeleccionServicios() {
  const slugs = Object.keys(CLIENTES);
  const primerSlug = slugs.length > 0 ? slugs[0] : null;
  useTitulo("Servicios que facturan y cobran");

  return <SeleccionServicios demoSlug={primerSlug} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dev" element={<PanelDev />} />
        <Route path="/:clienteSlug" element={<PaginaCliente />} />
        <Route path="/:clienteSlug/presupuestos" element={<PaginaMisPresupuestos />} />
        <Route path="/:clienteSlug/clientes-a-revisar" element={<PaginaClientesARevisar />} />
        <Route path="/:clienteSlug/cobros-pendientes" element={<PaginaCobrosPendientes />} />
        <Route path="/agenda" element={<PaginaSeleccionAgenda />} />
        <Route path="/servicios" element={<PaginaSeleccionServicios />} />
        <Route path="/turnos/:turnoSlug" element={<PaginaTurnos />} />
        <Route path="/turnos/:turnoSlug/pacientes" element={<PaginaPacientes />} />
        <Route path="/turnos/:turnoSlug/pacientes/:pacienteId" element={<PaginaPerfilPaciente />} />
        <Route path="/fidelizacion" element={<PaginaFidelizacion />} />
      </Routes>
    </BrowserRouter>
  );
}