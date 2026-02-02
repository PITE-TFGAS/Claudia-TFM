// SCRIPT PRINCIPAL DE INICIALIZACIÓN

console.log("Asistente Content Script Orchestrator Loaded");

// ---------------------------------------------------------
// INICIALIZACIÓN AL CARGAR
// ---------------------------------------------------------
(async function init() {
  const State = window.AsistenteState;

  // 1. Cargar estado de la sesión
  const sessionRestored = await State.loadFromStorage();

  if (sessionRestored && State.currentGoal) {
    console.log("Sesión activa detectada. Objetivo:", State.currentGoal);

    // --- LÓGICA AGRESIVA DE TABKEEPER ---
    if (window.TabKeeper) {
      let attempts = 0;
      const maxAttempts = 4; // Re-evaluar durante 4 segundos

      const checkAndKill = async () => {
        attempts++;
        const decision = await window.TabKeeper.evaluate(State.currentGoal);

        if (decision === "KILL") {
          console.error("🚫 TabKeeper: Desviación detectada. Ejecutando cierre...");
          
          // Bloqueo visual inmediato para que el usuario no interactúe
          document.documentElement.innerHTML = `
            <div style="background:#f8f9fa; height:100vh; display:flex; align-items:center; justify-content:center; font-family:system-ui, sans-serif; color: #333;">
                <div style="text-align:center; max-width: 400px; padding: 20px;">
                    <div style="font-size: 50px; margin-bottom: 20px;">🛡️</div>
                    <h1 style="color:#d32f2f; margin-bottom: 10px;">Pestaña no necesaria</h1>
                    <p style="font-size:1.1em; line-height: 1.5;">He cerrado esta pestaña porque parece publicidad o no tiene relación con tu objetivo actual.</p>
                </div>
            </div>`;

          // Orden real de cierre al background script
          chrome.runtime.sendMessage({ type: "CLOSE_CURRENT_TAB" });
          return true; // Fue aniquilada
        }
        return false;
      };

      // Primer chequeo inmediato
      const isKilled = await checkAndKill();
      
      if (isKilled) return; // Detener ejecución si se cerró

      // Bucle de vigilancia: Booking a veces carga el contenido relevante 1 o 2 segundos tarde
      const monitor = setInterval(async () => {
        const killed = await checkAndKill();
        if (killed || attempts >= maxAttempts) {
          clearInterval(monitor);
        }
      }, 1000);
    }

    // --- CONTINUAR CON LA UI SI LA PESTAÑA SOBREVIVIÓ ---
    if (window.montarOverlay) await window.montarOverlay();

    // Ejecutar ciclo de navegación (IA analiza el DOM actual)
    if (window.ejecutarCicloIA) {
      await window.ejecutarCicloIA("navigation_completed", null);
    }
    
  } else {
    // Caso: Extensión habilitada pero sin un objetivo (Goal) activo
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
