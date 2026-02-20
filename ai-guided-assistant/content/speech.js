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

  initRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = "es-ES";
    this.recognition.continuous = false;
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.cancelar();
      if (window.ChatUI) window.ChatUI.setMicState(true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (window.ChatUI) window.ChatUI.setMicState(false);
    };

    this.recognition.onerror = (event) => {
      if (event.error !== "no-speech") console.error("Error STT:", event.error);
      this.isListening = false;
      if (window.ChatUI) window.ChatUI.setMicState(false);
    };
  },

  toggleEscucha(onResultCallback) {
    if (!this.recognition) this.initRecognition();
    if (!this.recognition) return;

    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (event.results[0].isFinal) {
          onResultCallback(transcript);
        }
      };
      this.recognition.start();
    }
  },

  init() {
    this.cancelar();
    this.initRecognition();
    window.addEventListener("beforeunload", () => {
      this.cancelar();
    });
  },
};

window.SpeechModule.init();
