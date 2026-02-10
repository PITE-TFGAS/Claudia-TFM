// SCRIPT ENCARGADO DE LA SÍNTESIS DE VOZ (TEXT-TO-SPEECH)

console.log("Speech Module loaded");

window.SpeechModule = {
  synthesis: window.speechSynthesis,
  vozSeleccionada: null,

  // Cargar voces
  init() {
    if (!this.synthesis) {
      console.warn("Este navegador no soporta SpeechSynthesis");
      return;
    }
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.cargarVoces();
    } else {
      this.cargarVoces();
    }
  },

  cargarVoces() {
    const voces = this.synthesis.getVoices();
    this.vozSeleccionada =
      voces.find((v) => v.name.includes("Google") && v.lang.startsWith("es")) ||
      voces.find((v) => v.lang.startsWith("es")) ||
      voces[0];
  },

  leer(texto) {
    const State = window.AsistenteState;
    if (!State || !State.ttsEnabled) return;

    const utter = new SpeechSynthesisUtterance(texto);

    if (this.vozSeleccionada) {
      utter.voice = this.vozSeleccionada;
    }

    utter.lang = "es-ES";
    this.synthesis.speak(utter);
  },

  cancelar() {
    if (this.synthesis) this.synthesis.cancel();
  },
};

window.SpeechModule.init();
