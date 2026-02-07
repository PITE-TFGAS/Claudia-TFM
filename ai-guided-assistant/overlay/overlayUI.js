// overlay/overlayUI.js

let isMounting = false; 

// ---------------------------------------------------------
// FUNCIÓN QUE MONTA EL CHAT
// ---------------------------------------------------------
function montarOverlay() {
  return new Promise((resolve) => {
    
    // si existe no hago nada
    if (document.getElementById("asistente-overlay")) {
      if (window.iniciarChat) window.iniciarChat();
      if (window.hacerDraggable) window.hacerDraggable();
      resolve();
      return;
    }

    // si se está montando espero
    if (isMounting) {
      console.log("Ya se está montando el overlay, ignorando llamada duplicada.");
      resolve();
      return;
    }

    // semáforo rojo
    isMounting = true;

    fetch(chrome.runtime.getURL("overlay/overlay.html"))
      .then((res) => res.text())
      .then((html) => {
        if (!document.getElementById("asistente-overlay")) {
             document.body.insertAdjacentHTML("beforeend", html);
             inyectarCSS();
        }

        setTimeout(() => {
          if (window.iniciarChat) {
            window.iniciarChat();
          }
          if (window.hacerDraggable) {
            window.hacerDraggable();
          }
          // semáforo verde
          isMounting = false;
          resolve();
        }, 100);
      })
      .catch(err => {
        console.error("Error montando overlay:", err);
        isMounting = false;
        resolve();
      });
  });
}

// ---------------------------------------------------------
// FUNCIÓN QUE DESMONTA EL CHAT
// ---------------------------------------------------------
function desmontarOverlay() {
  document.getElementById("asistente-overlay")?.remove();
  isMounting = false;
}

// ---------------------------------------------------------
// FUNCIÓN QUE CARGA EL CSS
// ---------------------------------------------------------
function inyectarCSS() {
  if (document.getElementById("asistente-overlay-css")) return;

  const link = document.createElement("link");
  link.id = "asistente-overlay-css";
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("overlay/overlay.css");
  document.head.appendChild(link);
}

window.montarOverlay = montarOverlay;
window.desmontarOverlay = desmontarOverlay;