// SCRIPT ENCARGADO DE PINTAR MENSAJES EN EL CHAT

console.log("Chat UI loaded");

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
      headerActions:
        document.querySelector(".asistente-header-actions") ||
        document.querySelector(".asistente-header"),
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
  // AÑADIR MENSAJE
  // ---------------------------------------------------------
  addMessage(tipo, texto, leerEnVozAlta = true) {
    const { container } = this.refs;

    // Mecanismo de reintento si el DOM no está listo
    if (!container) {
      setTimeout(() => this.addMessage(tipo, texto), 100);
      return;
    }

    const msg = document.createElement("div");
    msg.textContent = texto;
    // Usamos clases CSS en lugar de estilos inline
    msg.classList.add("asistente-message", `asistente-message-${tipo}`);

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
  // RESETEAR INPUT
  // ---------------------------------------------------------
  clearInput() {
    const { input } = this.refs;
    if (input) input.value = "";
  },

  // ---------------------------------------------------------
  // BOTÓN DE AUDIO
  // ---------------------------------------------------------
  injectAudioToggle() {
    const { headerActions } = this.refs;
    if (!headerActions || document.getElementById("btn-audio-toggle")) return;

    const btnAudio = document.createElement("button");
    btnAudio.id = "btn-audio-toggle";
    btnAudio.style.cssText =
      "background:none; border:none; cursor:pointer; font-size:16px; margin-right:8px;";

    const updateIcon = () => {
      const isEnabled = window.AsistenteState
        ? window.AsistenteState.ttsEnabled
        : false;
      btnAudio.innerText = isEnabled ? "🔊" : "🔇";
      btnAudio.title = isEnabled ? "Desactivar voz" : "Activar voz";
    };

    setTimeout(updateIcon, 500);

    btnAudio.addEventListener("click", () => {
      if (window.AsistenteState) {
        window.AsistenteState.toggleTTS();
        updateIcon();
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

    if (isActive) {
      btnMic.innerText = "🛑";
      btnMic.style.backgroundColor = "#ffcccc";
      btnMic.classList.add("mic-active");
      const { input } = this.refs;
      if (input) input.placeholder = "Escuchando... habla ahora";
    } else {
      btnMic.innerText = "🎙️";
      btnMic.style.backgroundColor = "transparent";
      btnMic.classList.remove("mic-active");
      const { input } = this.refs;
      if (input) input.placeholder = "Escribe lo que quieres hacer…";
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
    btnMic.innerText = "🎙️";
    btnMic.style.cssText = `
            background: none; 
            border: none; 
            cursor: pointer; 
            font-size: 20px; 
            margin-left: 5px;
            padding: 5px;
            border-radius: 50%;
            transition: all 0.2s;
        `;

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
}, 1000);
