import fetch from "node-fetch";

export async function callGemini(intent, dom) {
  const body = {
    contents: [{
      parts: [{
        text: `
Eres un asistente experto en accesibilidad.
Tarea: "${intent}"

DOM:
${dom}

Devuelve SOLO JSON:
{
  "descripcion": "",
  "selector": ""
}
`
      }]
    }]
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  return res.json();
}

export async function callGeminiStep({ goal, dom, phase, lastSuggestedId, lastSuggestedText, clickedInfo, history, url, title }) {
  
  // Preparación de datos legibles
  const historyText = history && history.length > 0 ? history.join("\n") : "Sin historial previo.";
  
  //console.log(historyText)

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
  } 
  else if (phase === "navigation_completed") {
    contextInfo += `
    ESTADO: Navegación completada (Página nueva).
    El usuario realizó una acción y la página cambió. 
    Analiza si hemos llegado al objetivo o cuál es el siguiente paso.
    `;
  } 
  else {
    contextInfo += `
    ESTADO: Verificación de acción en la misma página.
    
    COMPARATIVA DE ACCIÓN:
    -------------------------------------------------
    1. TU INSTRUCCIÓN ANTERIOR:
       - ID Sugerido: ${lastSuggestedId}
       - Texto que esperabas que pulsara: "${lastSuggestedText || 'Cualquiera'}"

    2. LO QUE HIZO EL USUARIO REALMENTE:
       - ${clickedDesc}
    -------------------------------------------------
    `;
  }

  // Prompt
  const prompt = `
  Eres un asistente inteligente de navegación web.
  OBJETIVO DEL USUARIO: "${goal}"
  
  ${contextInfo}

  DOM ACTUAL (Elementos interactivos):
  ${dom}

  ---------------------------------------------------------
  INSTRUCCIONES DE RAZONAMIENTO (CÓMO PENSAR):
  ---------------------------------------------------------
  
  1. **VALIDACIÓN DE ACCIÓN (Solo para fase de verificación):**
     - Si el usuario pulsó un ID diferente al sugerido, pero el TEXTO pulsado es semánticamente igual al esperado (ej: esperabas "Buscar" y pulsó un icono que dice "Buscar"), **ES UN ACIERTO**. Continúa.
     - Si el usuario pulsó algo incorrecto, explícale el error amablemente en el feedback.

  2. **ANÁLISIS DE FINALIZACIÓN (CRÍTICO):**
     - Pregúntate: **"¿El objetivo ya está cumplido con lo que se ve ahora?"**
     - Si el usuario pedía "Buscar X" y el Título de la página es "X - Buscar con Google", TERMINA ("completed").
     - Si el usuario pedía "Ir a Youtube" y la URL es youtube.com, TERMINA.
     - No seas redundante. Si ya estamos ahí, no pidas más clicks.

  3. **GENERACIÓN DE PASOS:**
     - Si NO hemos terminado, selecciona el ID del elemento más lógico para avanzar.
  
  Responde SOLO JSON estricto:
  {
    "feedback": "Mensaje corto y natural.",
    "target_id": 123 (o null si status es completed),
    "status": "in_progress" | "completed"
  }
  `;

  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  return res.json();
}