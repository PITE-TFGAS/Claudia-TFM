// ESTE SCRIPT GESTIONA EL CHAT = INPUTS Y MENSAJES

// ---------------------------------------------------------
// LISTENER DE MENSAJES NUEVOS
// ---------------------------------------------------------
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SHOW_DESCRIPTION_OVERLAY") {
    // 'true' indica que este mensaje debe guardarse en el historial
    añadirMensaje("assistant", message.descripcion, true);
  }
});

// ---------------------------------------------------------
// FUNCIÓN QUE RENDERIZA EL CHAT Y MIRA EL INPUT DEL USER
// ---------------------------------------------------------
function iniciarChat() {
  // Intenta buscar los elementos clave
  const input = document.querySelector(".asistente-input");
  const messagesContainer = document.querySelector(".asistente-messages");

  // Si el HTML aún no está listo, espera 100ms.
  if (!input || !messagesContainer) {
    // console.log("DOM del chat no listo todavía. Reintentando...");
    setTimeout(iniciarChat, 100);
    return;
  }

  input.placeholder = "Escribe lo que quieres hacer…";

  // Si hay historial y meta
  chrome.storage.local.get(
    ["asistente_chat_history", "asistente_goal"],
    (result) => {
      // Limpieza visual
      messagesContainer.innerHTML = "";

      const history = result.asistente_chat_history || [];
      const hayMisionActiva = !!result.asistente_goal;

      // Lógica del Saludo, si NO hay historial Y TAMPOCO misión activa
      if (history.length === 0 && !hayMisionActiva) {
        añadirMensaje(
          "assistant",
          "Hola ✨ ¿Qué quieres hacer en esta página?",
          false,
        );
      } else {
        // Restauramos historial si existe
        if (history.length > 0) {
          // console.log("Restaurando historial...");
          history.forEach((msg) => {
            añadirMensaje(msg.tipo, msg.text, false);
          });
        }

        // Scroll al final
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 50);
      }
    },
  );
  // ----------------------------------
  // LISTENER DEL INPUT DEL USUARIO
  // ----------------------------------
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;

    const texto = input.value.trim();
    if (!texto) return;

    // --- COMANDO SECRETO DE REINICIO ---
    if (
      texto.toLowerCase() === "reiniciar" ||
      texto.toLowerCase() === "salir"
    ) {
      input.value = "";
      añadirMensaje("user", texto, false);
      añadirMensaje("assistant", "Reiniciando sistema... 🔄", false);

      // Borra storage
      chrome.storage.local.clear(() => {
        // Recarga la página para matar variables en memoria
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      });
      return;
    }
    // -----------------------------------

    input.value = "";
    // Mensaje del usuario
    añadirMensaje("user", texto, true);

    if (!isMetaFijada()) {
      fijarMeta();
      // Guardamos el estado activo de la misión
      chrome.storage.local.set({
        asistente_goal: texto,
        asistente_status: "active",
      });
      chrome.runtime.sendMessage({ type: "USER_GOAL", goal: texto });
    } else {
      // Si ya hay meta, es una charla normal
      // TO DO: charla normal
      chrome.runtime.sendMessage(
        { type: "USER_CHAT", message: texto },
        (respuesta) => {
          if (respuesta)
            añadirMensaje("assistant", respuesta.text || "…", true);
        },
      );
    }
  });
}

// ---------------------------------------------------------
/**
 * Función para añadir mensajes visualmente y al storage.
 * @param {'user'|'assistant'} tipo - Quién envía el mensaje.
 * @param {string} texto - El contenido.
 * @param {boolean} guardar - Si debe persistir en chrome.storage.
 */
// ---------------------------------------------------------
function añadirMensaje(tipo, texto, guardar = true) {
  const container = document.querySelector(".asistente-messages");

  // Si el contenedor no está listo, espera.
  if (!container) {
    // console.warn("Contenedor de chat no listo. Reintentando en 100ms...");
    setTimeout(() => añadirMensaje(tipo, texto, guardar), 100);
    return;
  }

  // Renderizado Visual
  const msg = document.createElement("div");
  msg.textContent = texto;
  msg.className = `asistente-message asistente-message-${tipo}`;

  // Estilos
  msg.style.marginBottom = "8px";
  msg.style.padding = "8px";
  msg.style.borderRadius = "8px";
  msg.style.maxWidth = "80%";
  msg.style.wordWrap = "break-word";

  if (tipo === "assistant") {
    msg.style.backgroundColor = "#f0f0f0";
    msg.style.alignSelf = "flex-start";
    msg.style.color = "#333";
    msg.style.marginRight = "auto";
  } else {
    msg.style.backgroundColor = "#d1e7dd";
    msg.style.alignSelf = "flex-end";
    msg.style.color = "#0f5132";
    msg.style.marginLeft = "auto";
  }

  container.appendChild(msg);
  // Scroll automático hacia abajo
  container.scrollTop = container.scrollHeight;

  // Guardado en Storage
  if (guardar) {
    chrome.storage.local.get("asistente_chat_history", (result) => {
      const history = result.asistente_chat_history || [];
      history.push({ tipo: tipo, text: texto });
      chrome.storage.local.set({ asistente_chat_history: history });
    });
  }
}
