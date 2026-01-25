// ESTE SCRIPT FUNCIONA COMO ORQUESTADOR

console.log("content script loaded");

// Estado local para mantener el hilo de la conversación
let currentGoal = null;
let lastSuggestedId = null; 
let lastSuggestedText = ""; 
let actionHistory = [];

// Comprobar si hay una sesión pendiente (se ejecuta al cargar una pág nueva)
chrome.storage.local.get(["asistente_goal", "asistente_status"], async (res) => {
  if (res.asistente_goal && res.asistente_status === "active") {
    console.log("Sesión restaurada tras navegación. Objetivo:", res.asistente_goal);
    
    currentGoal = res.asistente_goal;
    actionHistory = res.asistente_history || [];

    // Recuperar el chat
    if (window.montarOverlay) {
        await window.montarOverlay(); 
    }
    
    // Decirle a la IA que es una pág nueva
    await ejecutarCicloIA("navigation_completed", null);
  }
});

// ---------------------------------------------------------
// LISTENER DE MENSAJES
// ---------------------------------------------------------
chrome.runtime.onMessage.addListener(async (message) => {
  // definir la meta del usuario
  if (message.type === "USER_GOAL") {
    currentGoal = message.goal;
    lastSuggestedId = null;
    lastSuggestedText = "";
    actionHistory = [];

    // Guardar en storage
    chrome.storage.local.set({
      asistente_goal: currentGoal,
      asistente_status: "active",
      asistente_history: actionHistory
    });

    // Decirle a la IA que es el principio de la interacción
    await ejecutarCicloIA("start", null);
  }
});

// ---------------------------------------------------------
// FUNCIÓN CENTRAL DE LA COMUNICACIÓN
// ---------------------------------------------------------
async function ejecutarCicloIA(phase, clickedData) {
  const dom = obtenerDOM();

  // Si hubo una acción del usuario (click), la añadimos al historial antes de llamar a la IA
  if (clickedData) {
      const entry = `Usuario pulsó: "${clickedData.text}" (<${clickedData.tag}>)`;
      actionHistory.push(entry);
      chrome.storage.local.set({ asistente_history: actionHistory });
  } else if (phase === "navigation_completed") {
      actionHistory.push("Navegador: Página recargada/cambiada.");
  }

  // Feedback visual
  if (phase === "navigation_completed") {
    chrome.runtime.sendMessage({
      type: "SHOW_DESCRIPTION_OVERLAY",
      descripcion: "Analizando la nueva página... 🧐",
    });
  }

  // Intentar llamada a la IA
  try {
    const respuesta = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "CALL_AI_STEP",
          payload: {
            goal: currentGoal,
            dom: dom,
            phase: phase, 
            lastSuggestedId: lastSuggestedId,
            lastSuggestedText: lastSuggestedText,
            clickedInfo: clickedData,
            history: actionHistory,
            url: window.location.href,
            title: document.title
          },
        },
        resolve
      );
    });

    procesarRespuestaIA(respuesta);
  } catch (err) {
    console.error("Error ciclo IA", err);
  }
}

// ---------------------------------------------------------
// REALIZAR ACCIONES SEGÚN RESPUESTA
// ---------------------------------------------------------
function procesarRespuestaIA(respuesta) {
  if (!respuesta) return;

  // Feedback al usuario
  if (respuesta.feedback) {
    chrome.runtime.sendMessage({
      type: "SHOW_DESCRIPTION_OVERLAY",
      descripcion: respuesta.feedback,
    });
    // Guardar lo que la IA sugirió en el historial
    if (respuesta.target_id) {
        const info = window.mapaIA.get(parseInt(respuesta.target_id));
        const textoSugerido = info ? info.texto : "un elemento";
        actionHistory.push(`IA sugirió: Pulsar "${textoSugerido}" (${respuesta.feedback})`);
    }
  }

  // SI LA TAREA TERMINÓ
  if (respuesta.status === "completed") {
    currentGoal = null;
    lastSuggestedId = null;
    lastSuggestedText = "";
    actionHistory = [];
    
    // Limpiar
    limpiarResaltado();
    chrome.storage.local.remove([
      "asistente_goal",
      "asistente_status",
      "asistente_chat_history",
    ]);
    
    // Feedback
    chrome.runtime.sendMessage({
      type: "SHOW_DESCRIPTION_OVERLAY",
      descripcion: "¡Objetivo completado! 🎉",
    });
    return;
  }

  // SI HAY UN SIGUIENTE PASO
  if (respuesta.target_id) {
    lastSuggestedId = respuesta.target_id;

    // Buscar el elemento para tenerlo de referencia
    const elementoInfo = window.mapaIA.get(parseInt(respuesta.target_id));
    lastSuggestedText = elementoInfo ? elementoInfo.texto : "Desconocido";

    const el = buscarElementoRobusto(respuesta.target_id);
    if (el) resaltarElemento(el);
  }
}

// ---------------------------------------------------------
// UI Toggles
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

// Solo se monta aquí si NO hay una meta activa
chrome.storage.local.get(["asistenteEnabled", "asistente_status"], (res) => {
  // Extensión habilitada Y NO hay un objetivo activo
  if (res.asistenteEnabled && res.asistente_status !== "active") {
    if (window.montarOverlay) window.montarOverlay();
  }
});

// ---------------------------------------------------------
// DETECTOR DE CLICKS
// ---------------------------------------------------------
document.addEventListener("click", (e) => {
    // Solo actuamos si hay una meta activa
    if (!currentGoal) return;

    limpiarResaltado();

    const el = e.target.closest("[data-ia-id]");
    let clickedInfo = null;

    if (el) {
      const id = parseInt(el.getAttribute("data-ia-id"));
      
      // Intentamos sacar la info del mapa (más seguro) o del elemento directo
      const infoMapa = window.mapaIA ? window.mapaIA.get(id) : null;
      
      clickedInfo = {
        id: id,
        text: infoMapa ? infoMapa.texto : (el.innerText || "").substring(0, 50),
        tag: infoMapa ? infoMapa.tag : el.tagName.toLowerCase()
      };
    } else {
      // Click fuera de elementos controlados
      clickedInfo = { id: null, text: "Zona vacía", tag: "body" };
    }

    // Esperamos 1 segundo para que la web procese el click
    setTimeout(() => {
      console.log(`Usuario pulsó: "${clickedInfo.text}" (ID: ${clickedInfo.id})`);
      ejecutarCicloIA("follow_up", clickedInfo);
    }, 1000);

  }, true); // Capture phase