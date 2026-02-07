// SCRIPT ENCARGADO DE GESTIONAR LAS VARIABLES Y LA SINCRONIZACIÓN CON chrome.storage

console.log("State manager loaded");

window.AsistenteState = {
    currentGoal: null,
    lastSuggestedId: null,
    lastSuggestedText: "",
    actionHistory: [],
    debounceTimer: null,
    DEBOUNCE_DELAY: 5000,

    // Inicializar estado desde el storage
    async loadFromStorage() {
        return new Promise((resolve) => {
            chrome.storage.local.get(["asistente_goal", "asistente_status", "asistente_history"], (res) => {
                if (res.asistente_goal && res.asistente_status === "active") {
                    this.currentGoal = res.asistente_goal;
                    this.actionHistory = res.asistente_history || [];
                    resolve(true); 
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
    }
};