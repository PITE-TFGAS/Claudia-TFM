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
  // Aumentamos un poco el límite si usas Llama 3 70b, soporta bastante contexto.
  const domSeguro = truncateDOM(dom, 20000); 
  // -------------------------------
  
  const historyText = history && history.length > 0 ? history.slice(-5).join("\n") : "Inicio de sesión."; // Solo los últimos 5 pasos para no saturar
  
  let contextInfo = `
  - URL ACTUAL: "${url}"
  - TÍTULO: "${title}"
  - HISTORIAL RECIENTE:
  ${historyText}
  `;

  if (phase === "start") {
    contextInfo += `\nESTADO: Acabamos de entrar. Analiza qué sitio es y cómo empezar.`;
  } else if (phase === "navigation_completed") {
    contextInfo += `\nESTADO: La página ha cambiado. Re-evalúa la situación.`;
  } else {
    const clickStatus = clickedInfo 
        ? `ÉXITO (El usuario clickó ID ${clickedInfo.id}: "${clickedInfo.text}")` 
        : `FALLO/INCERTIDUMBRE (El usuario clickó algo desconocido)`;
    
    contextInfo += `
    ESTADO: Seguimos en la misma página tras una acción.
    ACCIÓN ANTERIOR TUYA: Sugeriste ID ${lastSuggestedId} ("${lastSuggestedText}")
    RESULTADO REAL: ${clickStatus}
    `;
  }

  const prompt = `
  Eres un Agente de Navegación Web Autónomo. Tu misión es cumplir el OBJETIVO del usuario paso a paso.
  
  OBJETIVO FINAL: "${goal}"
  
  CONTEXTO DE NAVEGACIÓN:
  ${contextInfo}

  DOM ACTUAL (i=id, t=tag, x=texto):
  ---------------------------------------------------
  ${domSeguro}
  ---------------------------------------------------

  INTERPRETACIÓN DE ETIQUETAS DEL DOM:
  - [OFERTA_VUELO]: Botón para **seleccionar un vuelo**. Prioridad alta.
  - [CALENDARIO_PRECIO]: Botón para cambiar de día. NO CLICAR salvo que la fecha sea incorrecta.
  - [INFO_PASO]: Barra de progreso (ej: "Pago"). NO CLICAR, es solo información.
  - [ACCION]: Elemento interactivo (Botón, Link, Input). Prioridad alta.
  - [SELECCIONADO]: Elemento ya activo (Radio button marcado, Tab activa).
  - [PRECIO]: Información económica crítica.
  - [VACÍO]: Input que necesita ser rellenado.

  PROCESO DE RAZONAMIENTO OBLIGATORIO:
  1. **LOCALIZACIÓN:** ¿En qué paso del proceso estamos? ¿Estamos eligiendo vuelos?
     - Si ves tarjetas con [OFERTA_VUELO], sí.
  2. **FILTRO DE FUTURO:** Si ves textos como "Pago", "Datos Pasajero" en una barra superior [NAV_STATUS], **IGNÓRALOS**. No puedes saltar al futuro. Céntrate en el formulario central actual.
  3. **REGLA DE IDA Y VUELTA (CRÍTICO):**
     - Si el usuario pidió "Ida y Vuelta", debes seleccionar **DOS** vuelos antes de pulsar "Continuar".
     - **Paso 1:** Busca una tarjeta [OFERTA_VUELO] que parezca la IDA (mira las horas, suele estar arriba).
     - **Paso 2:** Si el historial muestra que ya clicaste un vuelo (y la página no cambió mucho), busca otro [OFERTA_VUELO] (suele estar más abajo, puede requerir scroll).
     - **Solo pulsa "Continuar"** cuando hayas seleccionado ambos.
  4. **EVITA TRAMPAS:**
     - Ignora [INFO_PASO] (Pestañas de "Pago" o "Datos").
     - Ignora [CALENDARIO_PRECIO] si ya estás en el día correcto. Céntrate en [OFERTA_VUELO].
     - Una vez seleccionados los vuelos hay que elegir la tarifa.
  5. **VALIDACIÓN:** ¿Hay campos [VACÍO] requeridos para avanzar? Si es así, tu "feedback" debe pedir al usuario que los rellene.
  6. **SELECCIÓN:** Busca el siguiente elemento lógico [ACCION] que nos acerque al objetivo.
     - Si es un vuelo: Busca el precio o el botón de seleccionar dentro de la tarjeta del vuelo. Recuerda que debe elegir un precio tanto de ida como de vuelta.
     - Si es un formulario: Busca el botón "Continuar", "Buscar" o "Siguiente" **SOLO SI** los datos están rellenos, en casos de vuelos pasajeros o descuentos de residencias si aplica.

  SALIDA JSON REQUERIDA:
  {
    "thought": "Breve análisis interno: Dónde estoy, qué veo, qué ignoro (ej: ignoro 'Pago' porque estoy en 'Vuelos') y por qué elijo este elemento.",
    "feedback": "Mensaje corto y natural para el usuario indicando qué hacer.",
    "target_id": number // ID del elemento a clicar
    "status": "in_progress" | "completed"
  }
  `;

  const messages = [
    { 
      role: "system", 
      content: "Eres una IA precisa que analiza DOMs web. No alucinas acciones. Priorizas avanzar paso a paso sin saltarte formularios." 
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
