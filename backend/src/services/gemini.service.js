import fetch from "node-fetch";

export async function callGemini(intent, dom) {
  const body = {
    contents: [{
      parts: [{
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
  
  console.log(historyText)

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
  Eres un asistente de navegación web experto para personas mayores. Tu trabajo es ayudar al usuario a completar CUALQUIER objetivo en CUALQUIER sitio web.
  OBJETIVO DEL USUARIO: "${goal}"
  
  CONTEXTO:
  ${contextInfo}

  DOM ACTUAL (i=id, t=tag, x=texto):
  ${dom}

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