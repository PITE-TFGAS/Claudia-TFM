// SCRIPT ENCARGADO DE PINTAR MENSAJES EN EL CHAT

console.log("Chat UI loaded - Senior Accessible Mode Ready");

// ---------------------------------------------------------
// APLICAR TEMA DESDE STORAGE
// ---------------------------------------------------------
function applyTheme(isAesthetic) {
  const overlay = document.getElementById("asistente-overlay");
  if (!overlay) return;

  if (isAesthetic) {
    overlay.classList.add("aesthetic-mode");
  } else {
    overlay.classList.remove("aesthetic-mode");
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateTheme") {
    applyTheme(request.aestheticMode);
  }
});

chrome.storage.local.get("aestheticMode", (res) => {
  applyTheme(!!res.aestheticMode);
});

window.ChatUI = {
  // ---------------------------------------------------------
  // REFERENCIAS A ELEMENTOS
  // ---------------------------------------------------------
  get refs() {
    return {
      container: document.querySelector(".asistente-messages"),
      input: document.querySelector(".asistente-input"),
      inputContainer: document.querySelector(".asistente-input-container"),
      btnReset: document.querySelector("#btn-nueva-tarea"),
      headerActions: document.querySelector(".asistente-header-actions"),
    };
  },

  // ---------------------------------------------------------
  // LIMPIAR CHAT VISUALMENTE
  // ---------------------------------------------------------
  clear() {
    const { container } = this.refs;
    if (container) container.innerHTML = "";
  },

  // ---------------------------------------------------------
  // RESETEAR EL INPUT
  // ---------------------------------------------------------
  clearInput() {
    const { input } = this.refs;
    if (input) input.value = "";
  },

  // ---------------------------------------------------------
  // MENSJAES NUEVOS EN EL CHAT
  // ---------------------------------------------------------
  addMessage(tipo, texto, leerEnVozAlta = true) {
    const { container } = this.refs;
    console.log(texto)

    // Mecanismo de reintento si el DOM no está listo
    if (!container) {
      setTimeout(() => this.addMessage(tipo, texto), 100);
      return;
    }

    const msg = document.createElement("div");
    msg.textContent = texto;
    // Usamos clases CSS en lugar de estilos inline
    msg.classList.add("asistente-message", `asistente-message-${tipo}`);

    // Accesibilidad
    msg.setAttribute("role", "article");

    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;

    // Frases que no va a leer
    const frasesSilenciosas = [
      "Observando navegación",
      "Analizando la nueva página",
      "Procesando escritura",
      "Escribe lo que quieres hacer",
    ];

    const esRuido = frasesSilenciosas.some((frase) => texto.includes(frase));

    if (
      tipo === "assistant" &&
      window.SpeechModule &&
      !esRuido &&
      leerEnVozAlta
    ) {
      window.SpeechModule.leer(texto);
    }
  },

  // ---------------------------------------------------------
  // BOTÓN DE AUDIO
  // ---------------------------------------------------------
  injectAudioToggle() {
    const { headerActions } = this.refs;
    if (!headerActions || document.getElementById("btn-audio-toggle")) return;

    const btnAudio = document.createElement("button");
    btnAudio.id = "btn-audio-toggle";
    btnAudio.title = "Activar o desactivar voz";

    // Función visual: Icono + Texto
    const updateVisuals = () => {
      // Estado global
      const isEnabled = window.AsistenteState
        ? window.AsistenteState.ttsEnabled
        : true;

      const icon = isEnabled ? "🔊" : "🔇";
      const text = isEnabled ? "VOZ ON" : "SILENCIO";

      btnAudio.innerHTML = `<span class="btn-icon">${icon}</span><span class="btn-label">${text}</span>`;

      btnAudio.setAttribute(
        "aria-label",
        isEnabled ? "Desactivar lectura de voz" : "Activar lectura de voz",
      );
    };

    // Render inicial
    updateVisuals();

    btnAudio.addEventListener("click", () => {
      if (window.AsistenteState) {
        window.AsistenteState.toggleTTS();
        updateVisuals();
      }
    });

    headerActions.insertBefore(btnAudio, headerActions.firstChild);
  },

  // ---------------------------------------------------------
  // BOTÓN MICRÓFONO ESTADO
  // ---------------------------------------------------------
  setMicState(isActive) {
    const btnMic = document.getElementById("btn-mic-toggle");
    if (!btnMic) return;
    const { input } = this.refs;

    if (isActive) {
      btnMic.innerHTML = `<span class="icon">🛑</span>`;
      btnMic.classList.add("mic-active");
      btnMic.setAttribute("aria-label", "Detener escucha");
      if (input) {
        input.placeholder = "Escuchando...";
        input.style.backgroundColor = "#fff3e0";
      }
    } else {
      btnMic.innerHTML = `<span class="icon">🎙️</span>`;
      btnMic.classList.remove("mic-active");
      btnMic.setAttribute("aria-label", "Activar micrófono");
      if (input) {
        input.placeholder = "Escribe o habla aquí...";
        input.style.backgroundColor = "transparent";
      }
    }
  },

  // ---------------------------------------------------------
  // INYECTAR BOTÓN MICRÓFONO
  // ---------------------------------------------------------
  injectMicButton() {
    const { input } = this.refs;
    if (!input || document.getElementById("btn-mic-toggle")) return;

    const btnMic = document.createElement("button");
    btnMic.id = "btn-mic-toggle";
    btnMic.innerHTML = `<span class="icon">🎙️</span>`;
    btnMic.title = "Hablar al asistente";

    btnMic.addEventListener("click", () => {
      if (window.SpeechModule) {
        window.SpeechModule.toggleEscucha((textoDetectado) => {
          input.value = textoDetectado;

          // simular enter
          const enterEvent = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: "Enter",
            code: "Enter",
            keyCode: 13,
          });

          input.dispatchEvent(enterEvent);
        });
      }
    });

    input.parentNode.insertBefore(btnMic, input.nextSibling);
  },
};

setTimeout(() => {
  if (window.ChatUI.injectAudioToggle) window.ChatUI.injectAudioToggle();
  if (window.ChatUI.injectMicButton) window.ChatUI.injectMicButton();
}, 1000);
