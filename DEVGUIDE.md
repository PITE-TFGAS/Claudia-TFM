
# 🧠 Guía para Desarrolladores: Integrar una IA Experta Personalizada

Esta guía explica cómo conectar tu propio servidor de Inteligencia Artificial (Backend) a la extensión del Asistente de Navegación.

El sistema permite configurar **IAs expertas por dominio**. Esto significa que cuando el usuario entra en una web específica (ej: `www.tu-empresa.com`), la extensión dejará de usar la IA generalista por defecto y enviará todo el contexto de navegación directamente a tu servidor. 

También puedes poner "*" y se usará para todas las páginas.

## 1. El Flujo de Trabajo (Arquitectura)

1. El usuario registra tu **Dominio**, la **URL de tu Endpoint** y tu **API Key** (opcional) en las opciones avanzadas de la extensión.
2. Al navegar por ese dominio, la extensión captura el DOM (código de la web), el historial de acciones y la meta del usuario.
3. La extensión realiza una petición `POST` a tu Endpoint con todos estos datos.
4. Tu servidor procesa la información y devuelve un JSON estricto.
5. La extensión lee tu JSON y ejecuta la acción en el navegador del usuario.

---

## 2. La Petición (Request): Lo que recibe tu servidor

Cuando el Asistente solicita ayuda a tu IA, enviará una petición `POST` a tu Endpoint.

**Cabeceras (Headers):**

* `Content-Type: application/json`
* `Authorization: Bearer <TU_API_KEY>` *(Si el usuario la configuró en el popup)*

**Cuerpo (Body):**
El cuerpo incluye dos formatos para máxima compatibilidad: `messages` (estándar de la industria LLM) y `raw_payload` (datos crudos).

```json
{
  "messages": [
    {
      "role": "system",
      "content": "Eres un sistema que responde SOLO en JSON válido."
    },
    {
      "role": "user",
      "content": "Eres un asistente de navegación web experto... [PROMPT COMPLETO GENERADO POR LA EXTENSIÓN INCLUYENDO EL DOM]"
    }
  ],
  "raw_payload": {
    "goal": "Comprar un billete a Madrid",
    "dom": "[<div i=\"1\" t=\"button\" x=\"Buscar Vuelos\">...]",
    "phase": "start",
    "lastSuggestedId": null,
    "lastSuggestedText": "",
    "clickedInfo": null,
    "history": ["Usuario escribió: \"Comprar un billete a Madrid\""],
    "url": "https://www.tu-empresa.com",
    "title": "Inicio - Tu Empresa"
  }
}

```

> **💡 Consejo de Integración:** Puedes usar el array `messages` para pasarlo directamente a servicios como OpenAI/Groq si tu servidor es un simple proxy, o puedes usar `raw_payload` si prefieres construir tu propio prompt desde cero en tu backend.

---

## 3. La Respuesta (Response): Lo que debe devolver tu servidor

Para que la extensión no crashee y pueda guiar al usuario, **tu servidor debe devolver un objeto JSON estricto**.

La extensión es lo suficientemente inteligente como para extraer el JSON incluso si tu modelo de lenguaje lo envuelve en bloques de código Markdown (`json ... `), pero la estructura interna debe ser exactamente esta:

```json
{
  "feedback": "Haz clic en el botón de 'Buscar Vuelos' para ver las opciones disponibles.",
  "target_id": 15,
  "status": "in_progress"
}

```

### Explicación de los campos:

* **`feedback` (String):** El texto que el asistente leerá en voz alta y mostrará en pantalla. Debe ser claro, empático y directo.
* **`target_id` (Number | null):** El ID numérico (propiedad `i` en el DOM enviado) del elemento que el usuario debe pulsar. Si la tarea ha terminado, envía `null`.
* **`status` (String):**
* Usa `"in_progress"` si el usuario aún tiene pasos por completar.
* Usa `"completed"` si el objetivo final (`goal`) se ha cumplido con éxito.