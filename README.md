# 🚀 Asistente de Navegación IA (Chromium) - Guía de Instalación

Este proyecto consta de dos partes que pueden funcionar simultáneamente:

1. **Backend (Servidor):** El cerebro generalista por defecto que conecta con la API de Gemini.
2. **Frontend (Extensión):** La interfaz que se muestra en tu navegador Google Chrome.

> **💡 Novedad:** El sistema ahora permite el enrutamiento inteligente (Bring Your Own Model). Puedes usar el backend por defecto o conectar tus propias IAs expertas para sitios web específicos.

---

## 1. Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (Versión usada en este proyecto v24.13.0).
- Google Chrome o cualquier otro navegador basado en Chromium (Edge, Brave, etc.).
- Una API Key de **Google Gemini**.

---

### 2. Configuración del Frontend (URL del Servidor)

Por defecto, la extensión está configurada para conectarse al servidor local. Si necesitas cambiar esta dirección (por ejemplo, si subes tu backend a un servidor real en la nube):

1. Abre la carpeta raíz de la extensión.
2. Localiza el archivo `config.js`.
3. Edita la variable `API_URL` para que apunte a tu nuevo dominio:
   ```javascript
   const ENV = {
     API_URL: "https://mi-servidor-en-la-nube.com/ai/stepGemini",
   };
   ```

## 3. Configuración del Backend (Servidor Generalista)

1. Abre una terminal y navega a la carpeta del servidor:

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

```

4. Inicia el servidor:

```bash
npm start

```

> Deberías ver un mensaje como: `Backend AI escuchando en http://localhost:3000`

---

## 4. Instalación de la Extensión (Chrome)

Una vez que el servidor está corriendo, carga la extensión en el navegador:

1. Abre Google Chrome y ve a la dirección:

> **`chrome://extensions/`**

2. En la esquina superior derecha, activa el interruptor **"Modo de desarrollador"** (Developer mode).
3. Haz clic en el botón **"Cargar extensión sin empaquetar"** (Load unpacked) que aparecerá a la izquierda.
4. Selecciona la **carpeta raíz** de este proyecto (donde está el archivo `manifest.json`).
5. La extensión aparecerá en tu barra de tareas.

---

## 5. 🧠 Conectar IAs Expertas (Avanzado)

La extensión incluye un **Router Inteligente** que te permite saltarte el backend generalista y enviar el contexto de navegación a un servidor propio o a una IA especializada.

Puedes configurar desde el popup de la extensión un dominio específico (ej: `google.com`) o un comodín (`*` para todas las páginas) y apuntarlo a tu propio Endpoint.

👉 **[Haz clic aquí para leer la Guía de Integración para Desarrolladores](./DEVGUIDE.md)** para aprender a formatear las peticiones y construir tu propio servidor experto.

---

## 6. 🛠️ Características y Accesibilidad

Este asistente ha sido diseñado pensando especialmente en personas mayores, con poca soltura tecnológica. Por ello, el sistema va mucho más allá de un simple chat:

### 🎙️ Interacción por Voz y Audio

- **Dictado por Micrófono:** El usuario no necesita usar el teclado; puede pulsar el botón del micrófono y pedir su objetivo en voz alta (ej: _"Quiero ver los horarios de la línea 026 de titsa"_).
- **Lectura en Voz Alta (Altavoz):** Al activar el icono del altavoz, la extensión leerá con voz natural las instrucciones de la IA y reproducirá sonidos de confirmación al completar tareas.

### 🎨 Diseño Adaptable (Modo Minimalista)

- **Guía Visual en Pantalla:** La IA no solo te dice qué hacer, sino que dibuja un recuadro resaltado exactamente sobre el botón o enlace que debes pulsar en la página web.
- **Modo Minimalista:** Desde el menú emergente (popup) de la extensión, el usuario puede alternar entre el diseño estándar, que elimina iconos decorativos, aumenta el tamaño de la letra y maximiza el contraste para facilitar la lectura y un **Modo Minimalista**, adecuándose así a todo tipo de usuarios.

### 🔄 Control Total de la Sesión

- **Botón de Reinicio:** Si el usuario se atasca, cambia de idea o quiere hacer otra tarea distinta en la misma web, el botón de "Reiniciar" limpia la memoria de la IA al instante para empezar desde cero sin confusiones.

---

## 7. ¿Cómo usar el Asistente?

1. Asegúrate de que tu **terminal con el backend sigue abierta** (salvo que uses exclusivamente una IA experta configurada en el paso anterior).
2. Ve a cualquier página web (ej: Google, Vueling, Amazon).
3. Abre la extensión haciendo clic en el icono.
4. _(Opcional)_ Ve a "Configurar IA Experta" en el popup si deseas sobreescribir el servidor por defecto para esa web.
5. Escribe tu objetivo (ej: _"Quiero ver imágenes de tigres"_).
6. Observa cómo la IA analiza la página y te guía paso a paso.
