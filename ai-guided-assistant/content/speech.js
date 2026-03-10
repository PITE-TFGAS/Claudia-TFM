// SCRIPT ENCARGADO DE HABLARLE O ESCUCHAR AL USUARIO

console.log("Speech Module loaded");

window.SpeechModule = {
  // --- SÍNTESIS ---
  leer(texto, enCola = true) {
    const State = window.AsistenteState;
    if (!State || !State.ttsEnabled) return;

    const textoLimpio = texto.replace(/\p{Extended_Pictographic}/gu, "");

    if (!enCola) {
    }

    try {
      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          type: "TTS_SPEAK",
          text: textoLimpio,
          lang: "es-ES",
          enqueue: enCola,
        });
      }
    } catch (e) {
      if (!e.message.includes("Extension context invalidated")) {
        console.warn("Error enviando TTS_SPEAK:", e);
      }
    }
  },

  cancelar() {
    try {
      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({ type: "TTS_STOP" });
      }
    } catch (e) {
      if (!e.message.includes("Extension context invalidated")) {
        console.warn("Error enviando TTS_STOP:", e);
      }
    }
  },

  // --- RECONOCIMIENTO ---
  recognition: null,
  isListening: false,
  silenceTimer: null,
  textoAcumulado: "",

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = "es-ES";
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.textoAcumulado = ""; // Reseteamos al empezar
      if (typeof this.cancelar === 'function') this.cancelar();
      if (window.ChatUI) window.ChatUI.setMicState(true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      clearTimeout(this.silenceTimer);
      if (window.ChatUI) window.ChatUI.setMicState(false);
    };

    this.recognition.onerror = (event) => {
      if (event.error !== "no-speech") console.error("Error STT:", event.error);
      this.isListening = false;
      clearTimeout(this.silenceTimer);
      if (window.ChatUI) window.ChatUI.setMicState(false);
    };
  },

  toggleEscucha(onResultCallback) {
    if (!this.recognition) this.initRecognition();
    if (!this.recognition) return;

    if (this.isListening) {
      this.recognition.stop();
      clearTimeout(this.silenceTimer);

      const textoFinal = this.textoAcumulado.trim();
      if (textoFinal.length > 0) {
        onResultCallback(textoFinal);
      }
    } else {
      this.recognition.onresult = (event) => {
        let textoFinalChunk = "";
        let textoProvisional = "";

        // En modo "continuous", tenemos que recorrer los resultados para unirlos
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            textoFinalChunk += event.results[i][0].transcript;
          } else {
            textoProvisional += event.results[i][0].transcript;
          }
        }

        // Añadimos el trozo final a nuestra memoria
        if (textoFinalChunk) {
           this.textoAcumulado += textoFinalChunk + " ";
        }

        // El texto total es lo que ya dijo + lo que está dudando ahora
        const textoActual = (this.textoAcumulado + textoProvisional).trim();

        clearTimeout(this.silenceTimer);
        
        // Si pasan 4 segundos en silencio se envía
        this.silenceTimer = setTimeout(() => {
          this.recognition.stop();
          if (textoActual.length > 0) {
            onResultCallback(textoActual);
          }
        }, 3000);
      };
      
      this.recognition.start();
    }
  },

  init() {
    if (typeof this.cancelar === 'function') this.cancelar();
    this.initRecognition();
    window.addEventListener("beforeunload", () => {
      if (typeof this.cancelar === 'function') this.cancelar();
    });
  },
};

window.SpeechModule.init();
