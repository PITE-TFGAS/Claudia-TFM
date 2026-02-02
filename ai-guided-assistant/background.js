console.log("Background loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Gestión de pestañas
  if (message.type === "CLOSE_CURRENT_TAB") {
    if (sender.tab && sender.tab.id) {
      chrome.tabs.remove(sender.tab.id);

      // Notificar
      setTimeout(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: "SHOW_DESCRIPTION_OVERLAY",
              descripcion:
                "🛡️ He cerrado una ventana irrelevante para que no te pierdas.",
            });
          }
        });
      }, 300);
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
    fetch("http://localhost:3000/ai/stepGemini", {
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
});

// VIGILANTE DE PESTAÑAS (Cierre por dominio)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Escuchamos el cambio de URL o cuando se completa la carga
    if (changeInfo.url || changeInfo.status === "complete") {
        const data = await chrome.storage.local.get(["ia_original_host", "asistenteGoal"]);
        
        if (!data.ia_original_host || !data.asistenteGoal) return;

        const urlStr = changeInfo.url || tab.url;
        if (!urlStr) return;

        const url = new URL(urlStr);
        const currentHost = url.hostname.toLowerCase();
        const originalHost = data.ia_original_host.toLowerCase();
        const goal = data.asistenteGoal.toLowerCase();

        if (currentHost.includes(originalHost.replace("www.", ""))) return;
        if (["google.", "bing.", "yahoo."].some(se => currentHost.includes(se))) return;
        if (/pay|secure|auth|login/i.test(urlStr)) return;

        const currentDomainBrand = currentHost.split('.').reverse()[1];

        if (currentHost !== originalHost && !goal.includes(currentDomainBrand)) {
            console.error(`🚫 Sheriff: Matando pestaña extraña: ${currentHost}`);
            chrome.tabs.remove(tabId);
        }
    }
});
