// SCRIPT ENCARGADO DE ESCUCHAR LOS LISTENERS DE LOS INPUTS DEL USUARIO

console.log("Input listeners loaded");

// ---------------------------------------------------------
// FUNCIÓN MANEJA EL DEBOUNCE
// ---------------------------------------------------------
function gestionarInteraccionUsuario(clickedInfo, tipoAccion) {
    const State = window.AsistenteState;

    // Añadir al historial
    const entry = `Usuario ${tipoAccion}: "${clickedInfo.text}" (<${clickedInfo.tag}>)`;
    State.addToHistory(entry);

    console.log(`${tipoAccion} registrado: ${clickedInfo.text}. Temporizador iniciado.`);

    // Resetear timer si existe
    if (State.debounceTimer) {
        clearTimeout(State.debounceTimer);
    }

    // Feedback visual
    chrome.runtime.sendMessage({
        type: "SHOW_DESCRIPTION_OVERLAY",
        descripcion: tipoAccion === 'escribió' ? "Procesando escritura... ⌨️" : "Observando navegación rápida... 👀"
    });

    // Iniciar nuevo timer
    State.debounceTimer = setTimeout(() => {
        console.log("Usuario detenido. Enviando historial a la IA.");
        State.debounceTimer = null;
        window.ejecutarCicloIA("follow_up", clickedInfo); 
    }, State.DEBOUNCE_DELAY);
}

// ---------------------------------------------------------
// LISTENER DE CLICKS
// ---------------------------------------------------------
document.addEventListener("click", (e) => {
    const State = window.AsistenteState;
    if (!State.currentGoal) return;

    const el = e.target.closest("[data-ia-id]");
    if (!el) {
        console.log("Click en zona vacía ignorado.");
        return; 
    }

    limpiarResaltado();

    const id = parseInt(el.getAttribute("data-ia-id"));
    const infoMapa = window.mapaIA ? window.mapaIA.get(id) : null;
      
    const clickedInfo = {
        id: id,
        text: infoMapa ? infoMapa.texto : (el.innerText || "").substring(0, 50),
        tag: infoMapa ? infoMapa.tag : el.tagName.toLowerCase()
    };

    gestionarInteraccionUsuario(clickedInfo, "pulsó");

}, true);

// ---------------------------------------------------------
// LISTENER DE ENTER
// ---------------------------------------------------------
document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const State = window.AsistenteState;
    if (!State.currentGoal) return;

    const el = e.target.closest("[data-ia-id]");
    let clickedInfo = null;

    if (el) {
        const id = parseInt(el.getAttribute("data-ia-id"));
        const infoMapa = window.mapaIA ? window.mapaIA.get(id) : null;
        const valorEscrito = el.value || ""; 
        
        clickedInfo = {
            id: id,
            text: (infoMapa ? infoMapa.texto : "") + ` (Escribió: "${valorEscrito}")`,
            tag: infoMapa ? infoMapa.tag : el.tagName.toLowerCase()
        };
    } else {
        clickedInfo = { id: null, text: "Enter global", tag: "body" };
    }

    gestionarInteraccionUsuario(clickedInfo, "pulsó ENTER");

}, true);