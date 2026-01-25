// ESTE SCRIPT GESTIONA EL CHAT = INPUTS Y MENSAJES

// LISTENER DE MENSAJES NUEVOS
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SHOW_DESCRIPTION_OVERLAY") {
    añadirMensaje("assistant", message.descripcion);
  }
});

function iniciarChat() {
  const input = document.querySelector(".asistente-input");

  input.placeholder =
    "Escribe lo que quieres hacer…";

  añadirMensaje("assistant", "Hola ✨ ¿Qué quieres hacer en esta página?");

  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;

    const texto = input.value.trim();
    if (!texto) return;

    input.value = "";
    añadirMensaje("user", texto);

    if (!isMetaFijada()) {
      fijarMeta();
      chrome.runtime.sendMessage({ type: "USER_GOAL", goal: texto });
    } else {
      chrome.runtime.sendMessage(
        { type: "USER_CHAT", message: texto },
        (respuesta) => {
          if (respuesta) añadirMensaje("assistant", respuesta.text || "…");
        }
      );
    }
  });
}

function añadirMensaje(tipo, texto) {
  const container = document.querySelector(".asistente-messages");
  if (!container) {
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
