console.log("overlay script loaded");

function montarOverlay() {
  if (document.getElementById("asistente-overlay")) return;

  fetch(chrome.runtime.getURL("overlay/overlay.html"))
    .then(res => res.text())
    .then(html => {
      document.body.insertAdjacentHTML("beforeend", html);
      inyectarCSS();
      iniciarChat();
    })
    .catch(err => console.error("No se pudo cargar overlay.html:", err));
}

function desmontarOverlay() {
  document.getElementById("asistente-overlay")?.remove();
}

function inyectarCSS() {
  if (!document.getElementById("asistente-overlay-css")) {
    const link = document.createElement("link");
    link.id = "asistente-overlay-css";
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("overlay/overlay.css");
    document.head.appendChild(link);
  }
}

function iniciarChat() {
  const input = document.querySelector(".asistente-input");
  const messages = document.querySelector(".asistente-messages");

  input.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;

    const texto = input.value.trim();
    if (!texto) return;

    input.value = "";
    añadirMensaje("user", texto);

    chrome.runtime.sendMessage({
      type: "USER_GOAL",
      goal: texto
    });
  });

  añadirMensaje("assistant", "Hola ✨ ¿Qué quieres hacer en esta página?");
}

function añadirMensaje(tipo, texto) {
  const msg = document.createElement("div");
  msg.textContent = texto;
  msg.style.marginBottom = "8px";
  msg.style.opacity = tipo === "assistant" ? 0.8 : 1;

  document.querySelector(".asistente-messages")?.appendChild(msg);
}

// Funciones globales
window.montarOverlay = montarOverlay;
window.desmontarOverlay = desmontarOverlay;
