import fetch from "node-fetch";

// ---------------------------------------------------------
// GESTIÓN DE CLAVES (KEY ROTATION)
// ---------------------------------------------------------

// Cargar claves
const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
const API_KEYS = rawKeys.split(",").map((k) => k.trim()).filter((k) => k);

if (API_KEYS.length === 0) {
  console.error("ERROR CRÍTICO: No hay claves de Gemini configuradas en .env");
} else {
  console.log(`Sistema de rotación cargado con ${API_KEYS.length} claves API.`);
}

let currentKeyIndex = 0;

// Obtener clave actual
function getCurrentKey() {
  return API_KEYS[currentKeyIndex];
}

// Rotar a la siguiente
function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(`Rotando a la clave #${currentKeyIndex + 1} del pool.`);
}

// Hace petición y reintenta si falla
async function makeGeminiRequest(body) {
  let attempts = 0;
  const maxAttempts = API_KEYS.length;

  while (attempts < maxAttempts) {
    const apiKey = getCurrentKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        return res.json();
      }

      // Error de límite
      if (res.status === 429) {
        console.warn(`Clave agotada (429): ...${apiKey.slice(-4)}. Cambiando...`);
        rotateKey();
        attempts++;
        continue;
      }

      // Otros errores
      const errorData = await res.json();
      throw new Error(`Gemini Error ${res.status}: ${errorData.error?.message || res.statusText}`);

    } catch (err) {
      // Error de red
      if (err.message.includes("fetch") || err.message.includes("network")) {
        console.warn("Error de red con Gemini. Rotando clave y reintentando...");
        rotateKey();
        attempts++;
      } else {
        // Error lógico
        throw err;
      }
    }
  }

  throw new Error("Todas las claves API de Gemini se han agotado o fallado.");
}

export async function callGemini(intent, dom) {
  const body = {
    contents: [
      {
        parts: [
          {
            text: `
Eres un asistente de navegación web experto y generalista. Tu trabajo es ayudar al usuario a completar CUALQUIER objetivo en CUALQUIER sitio web.
Tarea: "${intent}"

DOM:
${dom}

Devuelve SOLO JSON:
{
  "descripcion": "",
  "selector": ""
}
`,
          },
        ],
      },
    ],
  };

  // Usamos el sistema de rotación
  return makeGeminiRequest(body);
}

export async function callGeminiStep({
  goal,
  dom,
  phase,
  lastSuggestedId,
  lastSuggestedText,
  clickedInfo,
  history,
  url,
  title,
}) {
  // Preparación de datos legibles
  const historyText =
    history && history.length > 0
      ? history.join("\n")
      : "Sin historial previo.";

  console.log(historyText);

  const clickedDesc = clickedInfo
    ? `ID: ${clickedInfo.id}, Texto: "${clickedInfo.text}", Tag: <${clickedInfo.tag}>`
    : "Click en zona vacía o desconocida";

  // Construcción del Contexto
  let contextInfo = `
  DATOS DE NAVEGACIÓN ACTUALES:
  - URL: "${url}"
  - Título de la Página: "${title}"

  HISTORIAL DE LA SESIÓN:
  ${historyText}
  `;

  // Lógica según la fase
  if (phase === "start") {
    contextInfo += `\nESTADO: Inicio de la tarea. Analiza el DOM y da el primer paso.`;
  } else if (phase === "navigation_completed") {
    contextInfo += `
    ESTADO: Navegación completada (Página nueva).
    El usuario realizó una acción y la página cambió. 
    Analiza si hemos llegado al objetivo o cuál es el siguiente paso.
    `;
  } else {
    contextInfo += `
    ESTADO: Verificación de acción en la misma página.
    
    COMPARATIVA DE ACCIÓN:
    -------------------------------------------------
    1. TU INSTRUCCIÓN ANTERIOR:
       - ID Sugerido: ${lastSuggestedId}
       - Texto que esperabas que pulsara: "${lastSuggestedText || "Cualquiera"}"

    2. LO QUE HIZO EL USUARIO REALMENTE:
       - ${clickedDesc}
    -------------------------------------------------
    `;
  }

  // Prompt
  const prompt = `
  Eres un asistente de navegación web experto para personas mayores. Tu trabajo es ayudar al usuario a completar CUALQUIER objetivo en CUALQUIER sitio web.
  OBJETIVO DEL USUARIO: "${goal}"
  
  CONTEXTO:
  ${contextInfo}

  DOM ACTUAL (i=id, t=tag, x=texto):
  ${dom}

  
  INTERPRETACIÓN DE ETIQUETAS DEL DOM:
  - [OFERTA_VUELO]: Botón para **seleccionar un vuelo**. Prioridad alta.
  - [CALENDARIO_PRECIO]: Botón para cambiar de día. NO CLICAR salvo que la fecha sea incorrecta.
  - [INFO_PASO]: Barra de progreso (ej: "Pago"). NO CLICAR, es solo información.
  - [ACCION]: Elemento interactivo (Botón, Link, Input). Prioridad alta.
  - [SELECCIONADO]: Elemento ya activo (Radio button marcado, Tab activa).
  - [PRECIO]: Información económica crítica.
  - [VACÍO]: Input que necesita ser rellenado.

  REGLAS DE RAZONAMIENTO:

  1. **PRIORIDAD DEL CHAT (CRÍTICO):**
     - Si en el CONTEXTO ves una "INSTRUCCIÓN PRIORITARIA", obedece eso inmediatamente.

  2. **ANÁLISIS DE COMPLETITUD (FORM VALIDATION):**
     - Si ves varias opciones pregúntale al usuario cuál prefiere o selecciona la más barata
     - Antes de pulsar botones de avance ("Buscar", "Continuar", "Pagar", "Enviar"), verifica que los campos lógicos necesarios estén rellenos.
     - Si ves campos etiquetados como [VACÍO] que parecen importantes para el objetivo, pide al usuario que los rellene.
     - Si el campo dice [TIENE VALOR: ...], asume que ya está hecho, salvo que sea incoherente con el objetivo.

  3. **DETECCIÓN DE AMBIGÜEDAD (GAP ANALYSIS):**
     - Busca opciones en el DOM que modifiquen el resultado (filtros, tipos de tarifa, variantes de producto, condiciones legales).
     - Si el usuario NO especificó preferencia sobre esa opción en su objetivo, y la opción es crítica (ej: Precios, Tallas, Tipos de usuario), sugiérele que la revise.
     - Ejemplo: Si el objetivo es "Comprar camiseta" y ves "Talla S, M, L", pregunta la talla. No asumas.

  4. **COHERENCIA DE ACCIÓN:**
     - Si la acción anterior del usuario fue exitosa (el historial muestra que rellenó el campo correctamente), PASA AL SIGUIENTE CAMPO. No le pidas repetir lo mismo.
     - Si tu "Instruction Anterior" fue pulsar X, y en el nuevo DOM ves que X sigue ahí idéntico (sin marcarse como seleccionado), pero en "Lo que hizo realmente el usuario" aparece X, asume que el usuario ya está en ese apartado.
     - Si el usuario pulsó un elemento equivocado, explícale el error amablemente.
  
  El ID del elemento está en la propiedad "i".
  Responde SOLO JSON estricto:
  {
    "feedback": "Mensaje corto y natural de lo que el usuario debe hacer.",
    "target_id": number | null (si status es completed),
    "status": "in_progress" | "completed"
  }
  `;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
        response_mime_type: "application/json"
    }
  };

  // Usamos el sistema de rotación
  return makeGeminiRequest(body);
}
