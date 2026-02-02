import fetch from "node-fetch";
import { truncateDOM } from "../utils/domTruncate.js";

async function requestGroq(messages, model = "llama-3.3-70b-versatile") {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Error en Groq: ${error.error?.message || "Error desconocido"}`,
    );
  }

  return response.json();
}

export async function callGroqStep({
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
  // --- FORZAR RECORTE PLAN GRATIS ---
  const domSeguro = truncateDOM(dom, 20000);
  // -------------------------------

  const historyText =
    history && history.length > 0
      ? history.join("\n")
      : "Sin historial previo.";
  const clickedDesc = clickedInfo
    ? `ID: ${clickedInfo.id}, Texto: "${clickedInfo.text}", Tag: <${clickedInfo.tag}>`
    : "Click en zona vacía o desconocida";

  let contextInfo = `
  DATOS DE NAVEGACIÓN ACTUALES:
  - URL: "${url}"
  - Título de la Página: "${title}"
  HISTORIAL DE LA SESIÓN:
  ${historyText}
  `;

  if (phase === "start") {
    contextInfo += `\nESTADO: Inicio de la tarea. Analiza el DOM y da el primer paso.`;
  } else if (phase === "navigation_completed") {
    contextInfo += `\nESTADO: Navegación completada (Página nueva). Analiza si llegamos al objetivo o cuál es el siguiente paso.`;
  } else {
    contextInfo += `
    ESTADO: Verificación de acción en la misma página.
    COMPARATIVA DE ACCIÓN:
    1. TU INSTRUCCIÓN ANTERIOR: ID Sugerido: ${lastSuggestedId}, Texto esperado: "${lastSuggestedText || "Cualquiera"}"
    2. LO QUE HIZO EL USUARIO REALMENTE: ${clickedDesc}
    `;
  }

  const prompt = `
  Eres un asistente inteligente de navegación web.
  OBJETIVO DEL USUARIO: "${goal}"
  
  ${contextInfo}

  DOM ACTUAL (i=id, t=tag, x=texto):
  ${domSeguro}

  INSTRUCCIONES DE RAZONAMIENTO:
  1. VALIDACIÓN DE ACCIÓN: Si el texto pulsado es semánticamente igual al esperado (ej: "Buscar" e icono "Buscar"), es un ACIERTO.
  2. ANÁLISIS DE FINALIZACIÓN: Si la URL o el Título indican que ya llegamos (ej: objetivo "Ir a Youtube" y url "youtube.com"), pon status: "completed".
  3. GENERACIÓN DE PASOS: Si no hemos terminado, elige el ID más lógico.

  El ID del elemento está en la propiedad "i".
  Responde estrictamente este JSON:
  {
    "feedback": "Mensaje corto y natural.",
    "target_id": number|null,
    "status": "in_progress" | "completed"
  }
  `;

  const messages = [
    {
      role: "system",
      content:
        "Eres un asistente de navegación web experto en accesibilidad para personas con bajas competencias digitales.",
    },
    { role: "user", content: prompt },
  ];

  return requestGroq(messages);
}

// Para el intent inicial
export async function callGroqIntent(intent, dom) {
  const prompt = `Eres un asistente de accesibilidad. Analiza el DOM y la tarea: "${intent}".
  DOM: ${dom}
  Responde JSON: {"descripcion": "...", "selector": "..."}`;

  const messages = [
    { role: "system", content: "Responde solo en JSON." },
    { role: "user", content: prompt },
  ];

  return requestGroq(messages, "llama-3.1-8b-instant");
}
