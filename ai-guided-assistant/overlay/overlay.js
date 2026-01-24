console.log("overlay script loaded");

let metaFijada = false;

// Listener global para mensajes del content
chrome.runtime.onMessage.addListener((message) => {
  console.log("Overlay recibió mensaje:", message);
  if (message.type === "SHOW_DESCRIPTION_OVERLAY") {
    añadirMensaje("assistant", message.descripcion);
  }
});

function montarOverlay() {
  if (document.getElementById("asistente-overlay")) return;

  fetch(chrome.runtime.getURL("overlay/overlay.html"))
    .then((res) => res.text())
    .then((html) => {
      document.body.insertAdjacentHTML("beforeend", html);
      inyectarCSS();
      iniciarChat();
    })
    .catch((err) => console.error("No se pudo cargar overlay.html:", err));
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

  input.placeholder =
    "Escribe lo que quieres hacer… Ej: reservar un vuelo, iniciar sesión";

  añadirMensaje("assistant", "Hola ✨ ¿Qué quieres hacer en esta página?");

  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const texto = input.value.trim();
    if (!texto) return;

    input.value = "";
    añadirMensaje("user", texto);

    if (!metaFijada) {
      metaFijada = true;
      // Enviar intención al content
      chrome.runtime.sendMessage({ type: "USER_GOAL", goal: texto }, (resp) => {
        console.log("Meta enviada al content:", resp);
      });
    } else {
      // Chat general posterior
      chrome.runtime.sendMessage(
        { type: "USER_CHAT", message: texto },
        (respuesta) => {
          if (respuesta) añadirMensaje("assistant", respuesta.text || "…");
        },
      );
    }
  });
}

function añadirMensaje(tipo, texto) {
  const container = document.querySelector(".asistente-messages");
  if (!container) {
    console.warn("Contenedor .asistente-messages no encontrado, reintentando...");
    setTimeout(() => añadirMensaje(tipo, texto), 100);
    return;
  }

  const msg = document.createElement("div");
  msg.textContent = texto;
  msg.style.marginBottom = "8px";
  msg.style.opacity = tipo === "assistant" ? 0.8 : 1;

  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}


// Funciones globales
window.montarOverlay = montarOverlay;
window.desmontarOverlay = desmontarOverlay;
