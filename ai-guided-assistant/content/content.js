// ESTE SCRIPT FUNCIONA COMO ORQUESTADOR

console.log("content script loaded");

// Estado local para mantener el hilo de la conversación
let currentGoal = null;
let lastSuggestedId = null; 
let lastSuggestedText = ""; 
let actionHistory = [];

// Variable para controlar el "Debounce"
let debounceTimer = null;
const DEBOUNCE_DELAY = 2000; // 2 segundos

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
  
  // Registrar cambios de navegación
  if (phase === "navigation_completed") {
      actionHistory.push("Navegador: Página recargada/cambiada.");
      chrome.storage.local.set({ asistente_history: actionHistory });
  }

  // Feedback visual si estamos cargando página nueva
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
                  goal: currentGoal,
                  dom: dom,
                  phase: phase, 
                  lastSuggestedId: lastSuggestedId,
                  lastSuggestedText: lastSuggestedText,
                  clickedInfo: clickedData,
                  history: actionHistory,
                  // Información de contexto vital
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

    // Comprobar que el click cayó en un elemento
    const el = e.target.closest("[data-ia-id]");

    // Si el click es en un espacio vacío ignoro
    if (!el) {
        console.log("Click en zona vacía ignorado (Protección para mayores).");
        return; 
    }

    limpiarResaltado();

    let clickedInfo = null;
    const id = parseInt(el.getAttribute("data-ia-id"));
    const infoMapa = window.mapaIA ? window.mapaIA.get(id) : null;
      
    clickedInfo = {
        id: id,
        text: infoMapa ? infoMapa.texto : (el.innerText || "").substring(0, 50),
        tag: infoMapa ? infoMapa.tag : el.tagName.toLowerCase()
    };

    // --- LÓGICA DE ACUMULACIÓN (DEBOUNCE) ---
    
    // Registramos el click válido
    const entry = `Usuario pulsó: "${clickedInfo.text}" (<${clickedInfo.tag}>)`;
    actionHistory.push(entry);
    chrome.storage.local.set({ asistente_history: actionHistory });

    console.log(`Click válido: ${clickedInfo.text}. Temporizador iniciado.`);

    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    // Feedback visual
    chrome.runtime.sendMessage({
        type: "SHOW_DESCRIPTION_OVERLAY",
        descripcion: "Observando navegación rápida... 👀"
    });

    debounceTimer = setTimeout(() => {
        console.log("Usuario detenido. Enviando historial acumulado a la IA.");
        debounceTimer = null;
        ejecutarCicloIA("follow_up", clickedInfo); 
    }, DEBOUNCE_DELAY);

}, true); // Capture phase

// ---------------------------------------------------------
// DETECTOR DE TECLA "ENTER"
// ---------------------------------------------------------
document.addEventListener("keydown", (e) => {
    // Solo nos interesa la tecla ENTER
    if (e.key !== "Enter") return;
    
    if (!currentGoal) return;

    // Saber dónde está escribiendo el usuario
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

    // --- LÓGICA COMPARTIDA DE DEBOUNCE ---

    const entry = `Usuario pulsó ENTER en: "${clickedInfo.text}"`;
    actionHistory.push(entry);
    chrome.storage.local.set({ asistente_history: actionHistory });

    console.log(`ENTER registrado: ${clickedInfo.text}. Reiniciando temporizador.`);

    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    // Mostramos feedback
    chrome.runtime.sendMessage({
        type: "SHOW_DESCRIPTION_OVERLAY",
        descripcion: "Procesando escritura... ⌨️"
    });

    // Programamos la llamada a la IA
    debounceTimer = setTimeout(() => {
        console.log("Usuario terminó de escribir/enviar. Llamando a la IA.");
        debounceTimer = null;
        
        ejecutarCicloIA("follow_up", clickedInfo); 
    }, DEBOUNCE_DELAY);

}, true);