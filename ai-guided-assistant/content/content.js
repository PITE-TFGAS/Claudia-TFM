// SCRIPT PRINCIPAL DE INICIALIZACIÓN

console.log("Asistente Content Script Orchestrator Loaded");

// ---------------------------------------------------------
// INICIALIZACIÓN AL CARGAR
// ---------------------------------------------------------
(async function init() {
  const State = window.AsistenteState;

  // Cargar estado de la sesión
  const sessionRestored = await State.loadFromStorage();

  if (sessionRestored && State.currentGoal) {
    console.log("Sesión activa. Objetivo:", State.currentGoal);

    // TabKeeper
    if (window.TabKeeper) {
      let decision = await window.TabKeeper.evaluate(State.currentGoal);
      if (decision === "KILL") {
          matarPestana(); 
          return;
      }

      // Buffer de seguridad
      console.log("⏳ Esperando veredicto del Sheriff antes de gastar tokens...");
      
      // Feedback visual
      if (document.body) {
        const aviso = document.createElement('div');
        aviso.id = 'ia-safety-check';
        aviso.style.cssText = "position:fixed; top:0; left:0; width:100%; height:4px; background:gold; z-index:999999;";
        document.body.appendChild(aviso);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aviso = document.getElementById('ia-safety-check');
      if (aviso) aviso.remove();

      decision = await window.TabKeeper.evaluate(State.currentGoal);
      
      if (decision === "KILL") {
          console.warn("🚫 TabKeeper: Detectado tras espera. Ahorrando tokens.");
          matarPestana();
          return
      }
    }

    // Si se pasan los anteriores métodos se llama a la IA
    console.log("Pestaña segura. Iniciando IA...");
    if (window.montarOverlay) await window.montarOverlay();
    
    if (window.ejecutarCicloIA) {
      await window.ejecutarCicloIA("navigation_completed", null);
    }
    
  } else {
    // Caso sin sesión activa
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
  // --- REACTIVACIÓN TRAS CIERRE DE PESTAÑA ---
  if (message.type === "TAB_KILLED_RESUME") {
    console.log("Recibida orden de reanudar tras limpieza de pestañas.");
    
    // Feedback
    if (message.descripcion) {
      chrome.runtime.sendMessage({
         type: "SHOW_DESCRIPTION_OVERLAY",
         descripcion: message.descripcion
      });
    }

    // Forzar análisis del DOM
    if (window.ejecutarCicloIA) {
      await window.ejecutarCicloIA("navigation_completed", null);
    }
  }

  // --- ESCUCHAR CUÁNDO SE ESTABLECE GOAL ---
  if (message.type === "USER_GOAL") {
    const State = window.AsistenteState;

    // Resetear y setear nueva meta
    State.reset();
    State.currentGoal = message.goal;
    State.saveToStorage();

    if (window.montarOverlay) await window.montarOverlay();
    await window.ejecutarCicloIA("start", null);
  }
  // --- ESCUCHAR ORDEN DE REINICIO ---
  if (message.type === "RESET_SESSION") {
    console.log("Orden de reinicio recibida. Limpiando estado...");
    const State = window.AsistenteState;
    State.reset();
    limpiarResaltado();
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

// ---------------------------------------------------------
// FUNCIÓN AUXILIAR PARA LIMPIAR
// ---------------------------------------------------------
function matarPestana() {
    console.error("🚫 EJECUTANDO CIERRE...");
    document.documentElement.innerHTML = "";
    chrome.runtime.sendMessage({ type: "CLOSE_CURRENT_TAB" });
}

