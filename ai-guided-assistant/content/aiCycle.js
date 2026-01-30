// SCRIPT ENCARGADO DE GESTIONAR LA LÓGICA DEL NEGOCIO

console.log("AI Cycle loaded");

// ---------------------------------------------------------
// FUNCIÓN CENTRAL DE COMUNICACIÓN
// ---------------------------------------------------------

async function ejecutarCicloIA(phase, clickedData) {
    const State = window.AsistenteState;
    const dom = obtenerDOM(); 
  
    // Registrar cambios de navegación
    if (phase === "navigation_completed") {
        State.addToHistory("Navegador: Página recargada/cambiada.");
    }

    // Feedback visual
    if (phase === "navigation_completed") {
        chrome.runtime.sendMessage({
            type: "SHOW_DESCRIPTION_OVERLAY",
            descripcion: "Analizando la nueva página... 🧐",
        });
    }

    try {
        const respuesta = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
                type: "CALL_AI_STEP",
                payload: {
                    goal: State.currentGoal,
                    dom: dom,
                    phase: phase, 
                    lastSuggestedId: State.lastSuggestedId,
                    lastSuggestedText: State.lastSuggestedText,
                    clickedInfo: clickedData,
                    history: State.actionHistory,
                    url: window.location.href,
                    title: document.title
                },
            }, resolve);
        });
        procesarRespuestaIA(respuesta);
    } catch (err) {
        console.error("Error ciclo IA", err);
    }
}

// ---------------------------------------------------------
// PROCESAR RESPUESTA
// ---------------------------------------------------------
function procesarRespuestaIA(respuesta) {
    if (!respuesta) return;
    const State = window.AsistenteState;

    if (respuesta.feedback) {
        chrome.runtime.sendMessage({
            type: "SHOW_DESCRIPTION_OVERLAY",
            descripcion: respuesta.feedback,
        });
        
        if (respuesta.target_id) {
            const info = window.mapaIA.get(parseInt(respuesta.target_id));
            const textoSugerido = info ? info.texto : "un elemento";
            State.addToHistory(`IA sugirió: Pulsar "${textoSugerido}" (${respuesta.feedback})`);
        }
    }

    if (respuesta.status === "completed") {
        State.reset();
        limpiarResaltado();
        chrome.runtime.sendMessage({
            type: "SHOW_DESCRIPTION_OVERLAY",
            descripcion: "¡Objetivo completado! 🎉",
        });
        return;
    }

    if (respuesta.target_id) {
        State.lastSuggestedId = respuesta.target_id;
        const elementoInfo = window.mapaIA.get(parseInt(respuesta.target_id));
        State.lastSuggestedText = elementoInfo ? elementoInfo.texto : "Desconocido";

        const el = buscarElementoRobusto(respuesta.target_id);
        if (el) resaltarElemento(el);
    }
}


window.ejecutarCicloIA = ejecutarCicloIA;