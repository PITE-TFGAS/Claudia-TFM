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
            btnReset: document.querySelector("#btn-nueva-tarea")
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
    addMessage(tipo, texto) {
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
    },

    // ---------------------------------------------------------
    // RESETEAR INPUT
    // ---------------------------------------------------------
    clearInput() {
        const { input } = this.refs;
        if (input) input.value = "";
    }
};