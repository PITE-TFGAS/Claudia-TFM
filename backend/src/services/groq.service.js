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
  console.log("🔍 SNAPSHOT PARA IA:", JSON.stringify(domSeguro, null, 2));

  const historyText =
    history && history.length > 0
      ? history.join("\n")
      : "Sin historial previo.";
  const clickedDesc = clickedInfo
    ? `ID: ${clickedInfo.id}, Texto: "${clickedInfo.text}", Tag: <${clickedInfo.tag}>`
    : "Click en zona vacía o desconocida";

  console.log(historyText);

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
  Eres un asistente de navegación web experto y generalista. Tu trabajo es ayudar al usuario a completar CUALQUIER objetivo en CUALQUIER sitio web.
  
  OBJETIVO DEL USUARIO: "${goal}"
  
  CONTEXTO:
  ${contextInfo}

  DOM ACTUAL (i=id, t=tag, x=texto):
  ${domSeguro}

REGLAS DE RAZONAMIENTO:
  
  1. **ANÁLISIS DE COMPLETITUD (FORM VALIDATION):**
     - Antes de pulsar botones de avance ("Buscar", "Continuar", "Pagar", "Enviar"), verifica que los campos lógicos necesarios estén rellenos.
     - Si ves campos etiquetados como [VACÍO] que parecen importantes para el objetivo, pide al usuario que los rellene.
     - Si el campo dice [TIENE VALOR: ...], asume que ya está hecho, salvo que sea incoherente con el objetivo.

  2. **DETECCIÓN DE AMBIGÜEDAD (GAP ANALYSIS):**
     - Busca opciones en el DOM que modifiquen el resultado (filtros, tipos de tarifa, variantes de producto, condiciones legales).
     - Si el usuario NO especificó preferencia sobre esa opción en su objetivo, y la opción es crítica (ej: Precios, Tallas, Tipos de usuario), sugiérele que la revise.
     - Ejemplo: Si el objetivo es "Comprar camiseta" y ves "Talla S, M, L", pregunta la talla. No asumas.

  3. **COHERENCIA DE ACCIÓN:**
     - Si la acción anterior del usuario fue exitosa (el historial muestra que rellenó el campo correctamente), PASA AL SIGUIENTE CAMPO. No le pidas repetir lo mismo.
     - Si el usuario pulsó un elemento equivocado, explícale el error amablemente.

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
        "Eres un asistente de usabilidad web. Actúas como los ojos y el sentido común del usuario. Eres preciso, paciente y neutral.",
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
