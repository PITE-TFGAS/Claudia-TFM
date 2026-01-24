// ESTE SCRIPT MONTA Y DESMONTA LA UI DEL OVERLAY

function montarOverlay() {
  if (document.getElementById("asistente-overlay")) return;

  fetch(chrome.runtime.getURL("overlay/overlay.html"))
    .then(res => res.text())
    .then(html => {
      document.body.insertAdjacentHTML("beforeend", html);
      inyectarCSS();
      iniciarChat();
    });
}

function desmontarOverlay() {
  document.getElementById("asistente-overlay")?.remove();
}

function inyectarCSS() {
  if (document.getElementById("asistente-overlay-css")) return;

  const link = document.createElement("link");
  link.id = "asistente-overlay-css";
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("overlay/overlay.css");
  document.head.appendChild(link);
}
