import React, { useState, useEffect } from "react";
import { Lock } from "lucide-react";

var CLAVE_STORAGE = "demo_desbloqueado";

export default function DemoGate({ children, clave, colorPrimario }) {
  var color = colorPrimario || "#1E2A38";
  var [desbloqueado, setDesbloqueado] = useState(false);
  var [intento, setIntento] = useState("");
  var [error, setError] = useState(false);
  var [listo, setListo] = useState(false);

  useEffect(function () {
    var guardado = sessionStorage.getItem(CLAVE_STORAGE);
    if (guardado === "si") {
      setDesbloqueado(true);
    }
    setListo(true);
  }, []);

  function intentar(e) {
    e.preventDefault();
    if (intento === clave) {
      sessionStorage.setItem(CLAVE_STORAGE, "si");
      setDesbloqueado(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (!listo) return null;

  if (desbloqueado) {
    return children;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F2ED] px-5">
      <form onSubmit={intentar} className="max-w-sm w-full bg-white border border-[#D9D2C2] rounded-lg p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Lock size={20} style={{ color: color }} />
          <h1 className="text-[17px] font-bold text-[#1E2A38]">Demo protegido</h1>
        </div>
        <p className="text-[13px] text-[#8A8371] mb-5">
          Este es un demo publico, para no mezclar pruebas de otras personas con
          datos reales. Pedile la clave a quien te compartio el link.
        </p>
        <input
          type="password"
          autoFocus
          value={intento}
          onChange={function (e) {
            setIntento(e.target.value);
            setError(false);
          }}
          placeholder="Clave de acceso"
          className="w-full border rounded px-3 py-2.5 text-[14px] outline-none mb-2"
          style={{ borderColor: error ? "#A0432E" : "#D9D2C2" }}
        />
        {error && (
          <p className="text-[12px] mb-3" style={{ color: "#A0432E" }}>
            Esa clave no es correcta.
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-md py-2.5 text-[14px] font-semibold text-white mt-2"
          style={{ backgroundColor: color }}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
