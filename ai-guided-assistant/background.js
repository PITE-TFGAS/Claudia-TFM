//-------------------------------------------
// CONFIG
//-------------------------------------------
const API_KEY = "AIzaSyC05B_bUsgP2FgRDcMHhv-Hl5jxGRQejWM";

//-------------------------------------------
// HELPERS: limpiar y extraer JSON
//-------------------------------------------
function limpiarJSON(texto) {
  if (!texto) return "{}";

  return texto
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function extraerJSON(texto) {
  const match = texto.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

//-------------------------------------------
// Escucha el overlay y el content
//-------------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "USER_GOAL") {
    // Enviar al content de la pestaña activa
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "USER_GOAL", goal: message.goal });
      }
    });
    sendResponse({ ok: true });
  }
  if (message.type === "SHOW_DESCRIPTION_OVERLAY") {
    // Enviar al overlay
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "SHOW_DESCRIPTION_OVERLAY",
        descripcion: message.descripcion
      });
    });
  }
});



//-------------------------------------------
// Listener principal
//-------------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CALL_GEMINI") {
    llamarGemini(message.intent, message.dom)
      .then(json => {
        // Devolver la respuesta al overlay
        sendResponse(json);
      })
      .catch(err => {
        console.error("Error llamando a Gemini:", err);
        sendResponse(null);
      });
    return true;
  }

  // Mensajes de chat general
  if (message.type === "USER_CHAT") {
    // TO DO: integrar un chat general con Gemini
    // Por ahora devuelvo mensaje fijo para pruebas
    sendResponse({ text: "Estoy aquí para ayudarte con tu meta" });
    return true;
  }
});

//-------------------------------------------
// Llamada a Gemini + PARSING
//-------------------------------------------
async function llamarGemini(intent, dom) {
  const body = {
    contents: [{
      parts: [{
        text: `
Eres un asistente experto en accesibilidad para personas mayores.
Tarea del usuario: "${intent}"

DOM parcial:
${dom}

Devuelve SOLO un JSON válido:
{
  "descripcion": "Instrucción simple",
  "selector": "Selector CSS"
}
`
      }]
    }]
  };

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  const data = await res.json();

  // PARSER
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) {
    console.error("Gemini no devolvió texto.");
    return null;
  }

  let limpio = limpiarJSON(raw);
  let jsonStr = extraerJSON(limpio);

  if (!jsonStr) {
    console.error("No se encontró JSON en la respuesta:", limpio);
    return null;
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Error parseando JSON limpio:", jsonStr);
    return null;
  }
}
