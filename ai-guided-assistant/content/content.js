// content/content.js
// SCRIPT PRINCIPAL DE INICIALIZACIÓN

console.log("Asistente Content Script Orchestrator Loaded");

// ---------------------------------------------------------
// INICIALIZACIÓN AL CARGAR
// ---------------------------------------------------------
(async function init() {
    const State = window.AsistenteState;
    
    // Cargar estado
    const sessionRestored = await State.loadFromStorage();

    if (sessionRestored) {
        console.log("Sesión restaurada. Objetivo:", State.currentGoal);
        
        if (window.montarOverlay) await window.montarOverlay();
        
        // Ejecutar ciclo de navegación
        await window.ejecutarCicloIA("navigation_completed", null);
    } else {
        // Chequeo por si la extensión está habilitada pero sin misión activa
        chrome.storage.local.get(["asistenteEnabled"], (res) => {
            if (res.asistenteEnabled && window.montarOverlay) {
                window.montarOverlay();
            }
        });
    }
})();

// ---------------------------------------------------------
// LISTENER DE MENSAJES (USER_GOAL)
// ---------------------------------------------------------
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type === "USER_GOAL") {
        const State = window.AsistenteState;
        
        // Resetear y setear nueva meta
        State.reset();
        State.currentGoal = message.goal;
        State.saveToStorage(); // Guardar "active"

        if (window.montarOverlay) await window.montarOverlay();
        await window.ejecutarCicloIA("start", null);
    }
});

// ---------------------------------------------------------
// UI TOGGLES (Listener de cambios en configuración)
// ---------------------------------------------------------
chrome.storage.onChanged.addListener((changes) => {
    if ("asistenteEnabled" in changes) {
        if (changes.asistenteEnabled.newValue && window.montarOverlay) {
            window.montarOverlay();
        } else if (window.desmontarOverlay) {
            window.desmontarOverlay();
            limpiarResaltado();
        }
    }
});