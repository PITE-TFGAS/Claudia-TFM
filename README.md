# 🚀 Asistente de Navegación IA (Chromium) - Guía de Instalación

Este proyecto consta de dos partes que deben funcionar simultáneamente:

1. **Backend (Servidor):** El cerebro que conecta con la API de Gemini/Groq.
2. **Frontend (Extensión):** La interfaz que vive en tu navegador Google Chrome.

---

## 1. Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

* [Node.js](https://nodejs.org/) (Versión usada en este proyecto v24.13.0).
* Google Chrome o cualquier otro navegador chromium.
* Una API Key de **Google Gemini** o **Groq**.

---

## 2. Configuración del Backend (Servidor)

1. Abre una terminal y navega a la carpeta del servidor (ej. `backend` o `server`):
```bash
cd backend

```

2. Instala las dependencias necesarias:
```bash
npm install

```

3. **Configura las Variables de Entorno (.env):**
Crea un archivo llamado `.env` en la raíz de la carpeta `backend` y añade tus claves:
```env
# Puerto del servidor
PORT=3000

# Claves de Google Gemini (Puedes poner varias separadas por coma para rotación)
GEMINI_API_KEYS=tu_clave_gemini_1,tu_clave_gemini_2

# Clave de Groq (Opcional si usas Gemini)
GROQ_API_KEY=tu_clave_groq

```

4. Inicia el servidor:
```bash
npm start

```
> Deberías ver un mensaje como: `Backend AI escuchando en http://localhost:3000`

---

## 3. Instalación de la Extensión (Chrome)

Una vez que el servidor está corriendo, carga la extensión en el navegador:

1. Abre Google Chrome y ve a la dirección:
> **`chrome://extensions/`**
2. En la esquina superior derecha, activa el interruptor **"Modo de desarrollador"** (Developer mode).
3. Haz clic en el botón **"Cargar extensión sin empaquetar"** (Load unpacked) que aparecerá a la izquierda.
4. Selecciona la **carpeta raíz** de este proyecto (donde está el archivo `manifest.json`).
5. La extensión aparecerá en tu barra de tareas.

---

## ¿Cómo usar?

1. Asegúrate de que tu **terminal con el backend sigue abierta**.
2. Ve a cualquier página web (ej: Google, Vueling, Amazon).
3. Abre la extensión y escribe tu objetivo (ej: *"Búscame vuelos baratos a Londres"*).
4. Observa cómo la IA analiza la página y te guía.

---