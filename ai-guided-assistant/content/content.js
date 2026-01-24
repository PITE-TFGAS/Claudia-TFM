// ESTE SCRIPT FUNCIONA COMO ORQUESTADOR

console.log("content script loaded");

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type !== "USER_GOAL") return;

  const intent = parseIntent(message.goal);
  const dom = obtenerDOM();

  const respuesta = await resolverIntencion(intent, dom);

  if (respuesta.descripcion) {
    chrome.runtime.sendMessage({
      type: "SHOW_DESCRIPTION_OVERLAY",
      descripcion: respuesta.descripcion,
    });
  }

  if (!respuesta) {
    console.log("IA no devolvió nada usable");
    return;
  }

  const el = buscarElementoRobusto(respuesta.selector, respuesta.descripcion);

  if (el) {
    resaltarElemento(el);
  } else {
    console.log("No se encontró el elemento");
  }
});

// Toggle overlay
chrome.storage.onChanged.addListener((changes) => {
  if ("asistenteEnabled" in changes) {
    if (changes.asistenteEnabled.newValue && window.montarOverlay) {
      window.montarOverlay();
    } else if (window.desmontarOverlay) {
      window.desmontarOverlay();
    }
  }
});

chrome.storage.local.get("asistenteEnabled", (res) => {
  if (res.asistenteEnabled && window.montarOverlay) {
    window.montarOverlay();
  }
});
