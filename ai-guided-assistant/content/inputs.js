// SCRIPT ENCARGADO DE ESCUCHAR LOS LISTENERS DE LOS INPUTS DEL USUARIO

console.log("Input listeners loaded");

let lastHistoryEntry = "";
let typingBuffer = null;

// ---------------------------------------------------------
// FUNCIÓN MANEJA EL DEBOUNCE
// ---------------------------------------------------------
function gestionarInteraccionUsuario(clickedInfo, tipoAccion) {
  const State = window.AsistenteState;

  if (tipoAccion === "escribiendo") {
    typingBuffer = `Usuario escribió: "${clickedInfo.text}" (<${clickedInfo.tag}>)`;
    console.log(`Borrador actualizado: ${clickedInfo.text}`);
  } else {
    if (typingBuffer) {
      State.addToHistory(typingBuffer);
      typingBuffer = null;
    }

    const entry = `Usuario ${tipoAccion}: "${clickedInfo.text}" (<${clickedInfo.tag}>)`;
    if (entry !== lastHistoryEntry || tipoAccion === "pulsó" || tipoAccion === "pulsó ENTER") {
      State.addToHistory(entry);
      lastHistoryEntry = entry;
      console.log(`${tipoAccion} registrado: ${clickedInfo.text}`);
    }
  }

  // Resetear timer si existe
  if (State.debounceTimer) {
    clearTimeout(State.debounceTimer);
  }

  // Iniciar nuevo timer
  State.debounceTimer = setTimeout(() => {
    if (typingBuffer) {
      State.addToHistory(typingBuffer);
      typingBuffer = null;
    }

    console.log("Usuario detenido. Enviando historial a la IA.");
    State.debounceTimer = null;
    window.ejecutarCicloIA("follow_up", clickedInfo);
  }, State.DEBOUNCE_DELAY);
}

// ---------------------------------------------------------
// LISTENER DE ESCRITURA DINÁMICA
// ---------------------------------------------------------
document.addEventListener(
  "input",
  (e) => {
    const State = window.AsistenteState;
    if (!State.currentGoal) return;
    if (e.target.closest("#asistente-overlay")) return;

    const el = e.target.closest("[data-ia-id]");
    if (!el) return;

    if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") return;

    const id = parseInt(el.getAttribute("data-ia-id"));
    const infoMapa = window.mapaIA ? window.mapaIA.get(id) : null;
    const valorEscrito = el.value || "";

    const clickedInfo = {
      id: id,
      text: (infoMapa ? infoMapa.texto : "") + ` [Valor final: "${valorEscrito}"]`,
      tag: infoMapa ? infoMapa.tag : el.tagName.toLowerCase(),
    };

    gestionarInteraccionUsuario(clickedInfo, "escribiendo");
  },
  true,
);

// ---------------------------------------------------------
// LISTENER DE CLICKS
// ---------------------------------------------------------
document.addEventListener(
  "click",
  (e) => {
    const State = window.AsistenteState;

    if (e.target.closest("#asistente-overlay")) return;
    if (!State.currentGoal) return;

    const el = e.target.closest("[data-ia-id]");
    if (!el) {
      console.log("Click en zona vacía ignorado.");
      return;
    }

    limpiarResaltado();

    const id = parseInt(el.getAttribute("data-ia-id"));

    if (State.lastSuggestedId && id === parseInt(State.lastSuggestedId)) {
      console.log("¡Clic correcto detectado!");
      if (window.SFX) window.SFX.playClickSuccess();
    }

    const infoMapa = window.mapaIA ? window.mapaIA.get(id) : null;

    const clickedInfo = {
      id: id,
      text: infoMapa ? infoMapa.texto : (el.innerText || "").substring(0, 50),
      tag: infoMapa ? infoMapa.tag : el.tagName.toLowerCase(),
    };

    gestionarInteraccionUsuario(clickedInfo, "pulsó");
  },
  true,
);

// ---------------------------------------------------------
// LISTENER DE ENTER
// ---------------------------------------------------------
document.addEventListener(
  "keydown",
  (e) => {
    if (e.key !== "Enter") return;

    if (e.target.closest("#asistente-overlay")) return;

    const State = window.AsistenteState;
    if (!State.currentGoal) return;

    const el = e.target.closest("[data-ia-id]");
    let clickedInfo = null;

    if (el) {
      const id = parseInt(el.getAttribute("data-ia-id"));

      if (State.lastSuggestedId && id === parseInt(State.lastSuggestedId)) {
        console.log("¡Clic correcto detectado!");
        if (window.SFX) window.SFX.playClickSuccess();
      }

      const infoMapa = window.mapaIA ? window.mapaIA.get(id) : null;
      const valorEscrito = el.value || "";

      clickedInfo = {
        id: id,
        text: (infoMapa ? infoMapa.texto : "") + ` (Escribió: "${valorEscrito}")`,
        tag: infoMapa ? infoMapa.tag : el.tagName.toLowerCase(),
      };
    } else {
      clickedInfo = { id: null, text: "Enter global", tag: "body" };
    }

    gestionarInteraccionUsuario(clickedInfo, "pulsó ENTER");
  },
  true,
);