console.log("Background loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
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
    fetch("http://localhost:3000/ai/intent", {
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
    fetch("http://localhost:3000/ai/step", { 
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
