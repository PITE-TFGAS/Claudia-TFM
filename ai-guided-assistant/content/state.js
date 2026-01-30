// SCRIPT ENCARGADO DE GESTIONAR LAS VARIABLES Y LA SINCRONIZACIÓN CON chrome.storage

console.log("State manager loaded");

window.AsistenteState = {
    currentGoal: null,
    lastSuggestedId: null,
    lastSuggestedText: "",
    actionHistory: [],
    debounceTimer: null,
    DEBOUNCE_DELAY: 2000,

    // Inicializar estado desde storage
    async loadFromStorage() {
        return new Promise((resolve) => {
            chrome.storage.local.get(["asistente_goal", "asistente_status", "asistente_history"], (res) => {
                if (res.asistente_goal && res.asistente_status === "active") {
                    this.currentGoal = res.asistente_goal;
                    this.actionHistory = res.asistente_history || [];
                    resolve(true); // Sesión activa restaurada
                } else {
                    resolve(false);
                }
            });
        });
    },

    // Guardar estado completo
    saveToStorage() {
        chrome.storage.local.set({
            asistente_goal: this.currentGoal,
            asistente_status: "active",
            asistente_history: this.actionHistory
        });
    },

    // Añadir entrada al historial
    addToHistory(entry) {
        this.actionHistory.push(entry);
        chrome.storage.local.set({ asistente_history: this.actionHistory });
    },

    // Resetear todo (al terminar o empezar nueva meta)
    reset() {
        this.currentGoal = null;
        this.lastSuggestedId = null;
        this.lastSuggestedText = "";
        this.actionHistory = [];
        this.debounceTimer = null;
        
        chrome.storage.local.remove(["asistente_goal", "asistente_status", "asistente_history"]);
    }
};