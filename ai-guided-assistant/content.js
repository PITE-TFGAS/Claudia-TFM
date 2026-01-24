console.log("content script loaded");

//-------------------------------------------
// HELPERS: limpiar y extraer JSON
//-------------------------------------------
function limpiarJSON(texto) {
  if (!texto) return "{}";
  return texto.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function extraerJSON(texto) {
  const match = texto.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

//-------------------------------------------
// Extraer DOM visible
//-------------------------------------------
function obtenerDOM() {
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll("script, style, noscript").forEach(e => e.remove());
  let html = clone.innerHTML;
  if (html.length > 10000) html = html.slice(0, 10000);
  return html;
}

//-------------------------------------------
// Resolver selector robusto
//-------------------------------------------
function buscarElementoRobusto(selector, descripcion) {
  if (!selector) selector = "";
  selector = selector.trim();

  try {
    if (selector.startsWith("#") || selector.startsWith(".")) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
  } catch (_) {}

  const keywords = ["accede","acceder","iniciar","login","entrar","perfil","account"];
  const textoReferencia = (selector + " " + (descripcion || "")).toLowerCase();
  const elementos = document.querySelectorAll("a, button, [role=button], input[type=submit], input[type=button]");

  let mejorMatch = null;
  let mejorScore = 0;

  for (const el of elementos) {
    const t = (el.textContent || "").toLowerCase().trim();
    const aria = (el.getAttribute("aria-label") || "").toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (t.includes(kw)) score += 3;
      if (aria.includes(kw)) score += 2;
      if (textoReferencia.includes(kw)) score += 1;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.width < 400 && rect.height < 200) score += 1;
    if (score > mejorScore) {
      mejorScore = score;
      mejorMatch = el;
    }
  }
  return mejorMatch;
}

//-------------------------------------------
// Llamada a Gemini desde el background
//-------------------------------------------
async function pedirAIAQueEncuentreElemento(intent, dom) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: "CALL_GEMINI", intent, dom }, resolve);
  });
}

//-------------------------------------------
// Resaltar elemento
//-------------------------------------------
function resaltarElemento(el) {
  const rect = el.getBoundingClientRect();
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = rect.top + "px";
  overlay.style.left = rect.left + "px";
  overlay.style.width = rect.width + "px";
  overlay.style.height = rect.height + "px";
  overlay.style.border = "4px solid #ffd700";
  overlay.style.boxShadow = "0 0 20px #ffdf00";
  overlay.style.zIndex = 999999;
  overlay.style.pointerEvents = "none";
  overlay.style.borderRadius = "6px";
  document.body.appendChild(overlay);
}

//-------------------------------------------
// Ejecutar función
//-------------------------------------------
async function ejecutarDOM(intencionUsuario) {
  console.log("Intención:", intencionUsuario);
  const dom = obtenerDOM();
  const respuesta = await pedirAIAQueEncuentreElemento(intencionUsuario, dom);
  if (!respuesta) return console.log("IA no devolvió nada usable");

  const el = buscarElementoRobusto(respuesta.selector, respuesta.descripcion);
  if (el) {
    resaltarElemento(el);
    console.log("Instrucción:", respuesta.descripcion);
  } else {
    console.log("No se encontró el elemento");
  }
}

//-------------------------------------------
// Escuchar mensajes del popup
//-------------------------------------------
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "USER_GOAL") {
    ejecutarDOM(message.goal);
  }
});

//-------------------------------------------
// Escuchar cambios en toggle asistente
//-------------------------------------------
chrome.storage.onChanged.addListener(changes => {
  if ("asistenteEnabled" in changes) {
    if (changes.asistenteEnabled.newValue && window.montarOverlay) {
      window.montarOverlay();
    } else if (window.desmontarOverlay) {
      window.desmontarOverlay();
    }
  }
});

// Inicializar overlay si estaba activo
chrome.storage.local.get("asistenteEnabled", res => {
  if (res.asistenteEnabled && window.montarOverlay) {
    window.montarOverlay();
  }
});
