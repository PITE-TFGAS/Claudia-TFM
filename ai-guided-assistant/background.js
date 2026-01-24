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
// Listener principal
//-------------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CALL_GEMINI") {
    llamarGemini(message.intent, message.dom)
      .then(sendResponse)
      .catch(err => {
        console.error("Error llamando a Gemini:", err);
        sendResponse(null);
      });

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
