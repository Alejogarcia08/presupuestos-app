# Presupuestos — proyecto base

## Cómo levantarlo la primera vez

1. Instalá [Node.js](https://nodejs.org) si todavía no lo tenés (versión 18 o superior).
2. Abrí una terminal dentro de esta carpeta y corré:
   ```
   npm install
   ```
   (esto baja todas las librerías que usa el proyecto — React, Tailwind, etc.)
3. Levantalo en modo desarrollo:
   ```
   npm run dev
   ```
4. Abrí en el navegador la URL que te muestra la terminal (normalmente `http://localhost:5173`).

## Cómo probar los distintos clientes

- `http://localhost:5173/` → lista los clientes configurados (solo para desarrollo).
- `http://localhost:5173/plomeria-juan` → formulario en modo "ítem personalizado".
- `http://localhost:5173/ferreteria-lopez` → formulario en modo "catálogo".

## Estructura del proyecto

```
src/
  config/
    clientes.js        <- ACÁ agregás un cliente nuevo (una entrada por PyME)
  components/
    PresupuestoForm.jsx <- el formulario en sí, no se toca por cliente
  lib/
    airtable.js         <- acá se conecta la API real de Airtable más adelante
  App.jsx                <- define las rutas (una por cliente)
  main.jsx                <- punto de entrada
```

## Para agregar un cliente nuevo

Editá `src/config/clientes.js` y agregá un bloque nuevo copiando uno existente.
No hace falta tocar ningún otro archivo.

## Para desplegarlo (cuando esté listo)

```
npm run build
```
Esto genera una carpeta `dist/` lista para subir a Netlify (o el hosting que
elijas). El plan gratuito de Netlify permite uso comercial.

## Próximos pasos (cuando conectemos la API real)

Todo lo que hoy está simulado vive en `src/lib/airtable.js` — ahí hay que
reemplazar las funciones mock por llamadas reales a una función serverless
de Netlify (para no exponer el API Key de Airtable en el navegador). Los
componentes no necesitan cambios cuando eso pase.
