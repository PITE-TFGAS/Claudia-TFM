console.log("Background loaded");

let esperandoSaludo = false;

// Esto se ejecuta al abrir el navegador de 0
chrome.runtime.onStartup.addListener(() => {
  console.log(
    "Navegador iniciado: Limpiando metas antiguas para evitar bucles.",
  );
  esperandoSaludo = true;
  chrome.storage.local.remove(
    [
      "asistente_goal",
      "asistente_status",
      "asistente_history",
      "asistente_chat_history",
      "ia_original_host",
    ],
    () => {
      console.log("Memoria limpia. Listo para una nueva sesión.");
    },
  );
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Gestión de pestañas
  if (message.type === "CLOSE_CURRENT_TAB") {
    if (sender.tab && sender.tab.id) {
      chrome.tabs.remove(sender.tab.id);

      // avisar a content
      setTimeout(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            // reaundar
            chrome.tabs.sendMessage(tabs[0].id, {
              type: "TAB_KILLED_RESUME",
              descripcion:
                "🛡️ He cerrado una ventana emergente irrelevante. Continuamos aquí.",
            });
          }
        });
      }, 500);
    }
  }

  // Reenviar meta al content
  if (message.type === "USER_GOAL") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, message);
    });
    sendResponse({ ok: true });
    return;
  }

  // Reenviar descripción al overlay
  if (message.type === "SHOW_DESCRIPTION_OVERLAY") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
    return;
  }

  // Llamar al backend (IA real)
  if (message.type === "CALL_AI") {
    fetch("http://localhost:3000/ai/intentGemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: message.intent,
        dom: message.dom,
      }),
    })
      .then((res) => res.json())
      .then((data) => sendResponse(data))
      .catch((err) => {
        console.error("Backend error:", err);
        sendResponse(err);
      });

    return true; // async
  }

  // Llamar al backend (nuevo método paso a paso)
  if (message.type === "CALL_AI_STEP") {
    fetch("http://localhost:3000/ai/stepGroq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.payload),
    })
      .then((res) => res.json())
      .then((data) => sendResponse(data))
      .catch((err) => {
        console.error("Backend error:", err);
        sendResponse({ feedback: "Error de conexión con el cerebro." });
      });

    return true; // async
  }

  // Reinicio Global (Sincronizar pestañas)
  if (message.type === "BROADCAST_RESET") {
    // Borrar memoria central
    chrome.storage.local.remove([
      "asistente_goal",
      "asistente_status",
      "asistente_history",
      "asistente_chat_history",
      "ia_original_host",
    ]);

    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { type: "RESET_SESSION" }).catch(() => {});
      });
    });
  }
});

// VIGILANTE DE PESTAÑAS (Cierre por dominio)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // solo ocurre una vez
  if (esperandoSaludo && changeInfo.status === "complete" && tab.active) {
    if (!tab.url.startsWith("chrome://")) {
      console.log("👋 Enviando saludo inicial (Modo Primera Vez) a:", tab.url);

      chrome.tabs
        .sendMessage(tabId, {
          type: "SHOW_INITIAL_GREETING",
          text: "¡Hola! He reiniciado mi memoria. ¿Cuál es tu objetivo para hoy?",
        })
        .catch(() => console.log("Pestaña no lista para recibir saludo."));

      esperandoSaludo = false;
      return;
    }
  }
  // Escuchamos el cambio de URL o cuando se completa la carga
  if (changeInfo.url || changeInfo.status === "complete") {
    const data = await chrome.storage.local.get([
      "ia_original_host",
      "asistente_goal",
    ]);

    if (!data.ia_original_host || !data.asistente_goal) return;

    const urlStr = changeInfo.url || tab.url;
    if (!urlStr) return;

    const url = new URL(urlStr);
    const currentHost = url.hostname.toLowerCase();
    const originalHost = data.ia_original_host.toLowerCase();
    const goal = data.asistente_goal.toLowerCase();

    // Excepciones (mismo dominio, google, pagos...)
    if (currentHost.includes(originalHost.replace("www.", ""))) return;
    if (["google.", "bing.", "yahoo."].some((se) => currentHost.includes(se)))
      return;
    if (/pay|secure|auth|login/i.test(urlStr)) return;

    const currentDomainBrand = currentHost.split(".").reverse()[1];

    // LÓGICA DE CIERRE
    if (currentHost !== originalHost && !goal.includes(currentDomainBrand)) {
      console.error(`Sheriff: Matando pestaña extraña: ${currentHost}`);

      chrome.tabs.remove(tabId);

      setTimeout(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabViva = tabs[0];
          if (tabViva) {
            console.log("Avisando a la pestaña original para que continúe...");
            chrome.tabs.sendMessage(tabViva.id, {
              type: "TAB_KILLED_RESUME",
              descripcion:
                "🛡️ He cerrado una ventana para ayudarte a cumplir tu objetivo.",
            });
          }
        });
      }, 500);
    }
  }
});
