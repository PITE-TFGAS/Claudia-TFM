// SCRIPT ENCARGADO DE HABLARLE O ESCUCHAR AL USUARIO

console.log("Speech Module loaded");

window.SpeechModule = {
  // --- SÍNTESIS (HABLAR) ---
  synthesis: window.speechSynthesis,
  vozSeleccionada: null,

  // Cargar voces
  init() {
    // Inicializar TTS
    if (this.synthesis) {
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = () => this.cargarVoces();
      } else {
        this.cargarVoces();
      }
    }
    // Inicializar STT (Reconocimiento)
    this.initRecognition();
  },

  cargarVoces() {
    const voces = this.synthesis.getVoices();
    if (voces.length === 0) return;
    this.vozSeleccionada =
      voces.find((v) => v.name.includes("Google") && v.lang.startsWith("es")) ||
      voces.find((v) => v.lang.startsWith("es")) ||
      voces[0];
  },

  leer(texto) {
    const State = window.AsistenteState;
    if (!State || !State.ttsEnabled) return;

    const textoLimpio = texto.replace(/\p{Extended_Pictographic}/gu, "");

    const utter = new SpeechSynthesisUtterance(textoLimpio);
    if (this.vozSeleccionada) utter.voice = this.vozSeleccionada;
    utter.lang = "es-ES";
    this.synthesis.speak(utter);
  },

  cancelar() {
    if (this.synthesis) this.synthesis.cancel();
  },

  // --- RECONOCIMIENTO (ESCUCHAR) ---
  recognition: null,
  isListening: false,

  initRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition no soportado.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = "es-ES";
    this.recognition.continuous = false;
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (window.ChatUI) window.ChatUI.setMicState(true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (window.ChatUI) window.ChatUI.setMicState(false);
    };

    this.recognition.onerror = (event) => {
      console.error("Error STT:", event.error);
      this.isListening = false;
      if (window.ChatUI) window.ChatUI.setMicState(false);
    };
  },

  toggleEscucha(onResultCallback) {
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
};

window.SpeechModule.init();
