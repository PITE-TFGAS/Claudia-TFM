// SCRIPT ENCARGADO DE GESTIONAR LAS VARIABLES Y LA SINCRONIZACIÓN CON chrome.storage

console.log("State manager loaded");

window.AsistenteState = {
  currentGoal: null,
  lastSuggestedId: null,
  lastSuggestedText: "",
  actionHistory: [],
  debounceTimer: null,
  DEBOUNCE_DELAY: 5000,
  ttsEnabled: false,

  // Inicializar estado desde el storage
  async loadFromStorage() {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        [
          "asistente_goal",
          "asistente_status",
          "asistente_history",
          "asistente_tts"
        ],
        (res) => {
          this.ttsEnabled = res.asistente_tts === true;
          if (res.asistente_goal && res.asistente_status === "active") {
            this.currentGoal = res.asistente_goal;
            this.actionHistory = res.asistente_history || [];
            resolve(true);
          } else {
            resolve(false);
          }
        },
      );
    });
  },

  // Guardar estado completo
  saveToStorage() {
    chrome.storage.local.set({
      asistente_goal: this.currentGoal,
      asistente_status: "active",
      asistente_history: this.actionHistory,
      asistente_tts: this.ttsEnabled,
    });
  },

  // Activar o desactivar TTS
  toggleTTS() {
    this.ttsEnabled = !this.ttsEnabled;
    console.log("Audio cambiado a:", this.ttsEnabled);

    chrome.storage.local.set({ asistente_tts: this.ttsEnabled });

    if (!this.ttsEnabled && window.SpeechModule) {
      window.SpeechModule.cancelar();
    } else if (this.ttsEnabled && window.SpeechModule) {
      window.SpeechModule.leer("Audio activado");
    }

    return this.ttsEnabled;
  },

  // Añadir entrada al historial
  addToHistory(entry) {
    this.actionHistory.push(entry);
    chrome.storage.local.set({ asistente_history: this.actionHistory });
  },

  // Resetear todo
  reset() {
    // Eliminar temporizador
    if (this.debounceTimer) {
      console.log("Cancelando temporizador pendiente por reinicio...");
      clearTimeout(this.debounceTimer);
    }

    // Limpiar variables
    this.currentGoal = null;
    this.lastSuggestedId = null;
    this.lastSuggestedText = "";
    this.actionHistory = [];
    this.debounceTimer = null;

    // Limpiar Storage Lógico (pero no el chat visual)
    chrome.storage.local.remove([
      "asistente_goal",
      "asistente_status",
      "asistente_history",
      "ia_original_host"
    ]);
  },
};
