// SCRIPT ENCARGADO DE GESTIONAR EL CHAT

console.log("Chat Handler loaded");

// ---------------------------------------------------------
// LISTENER GLOBAL DE MENSAJES (Feedback IA)
// ---------------------------------------------------------
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "SHOW_DESCRIPTION_OVERLAY") {
        guardarYMostrarMensaje("assistant", message.descripcion);
    }
});

// ---------------------------------------------------------
// FUNCIÓN PRINCIPAL DE INICIO
// ---------------------------------------------------------
function iniciarChat() {
    // Esperar a que el UI exista
    if (!document.querySelector(".asistente-input")) {
        setTimeout(iniciarChat, 100);
        return;
    }

    const { input } = window.ChatUI.refs;
    input.placeholder = "Escribe lo que quieres hacer…";

    // Configuramos las 3 partes clave por separado
    setupResetButton();
    setupInputListener(input);
    restoreChatHistory();
}

// ---------------------------------------------------------
// BOTÓN DE REINICIO
// ---------------------------------------------------------
function setupResetButton() {
    const { btnReset } = window.ChatUI.refs;
    if (!btnReset) return;

    const newBtn = btnReset.cloneNode(true);
    btnReset.parentNode.replaceChild(newBtn, btnReset);

    newBtn.addEventListener("click", () => {
        window.ChatUI.clear();
        guardarYMostrarMensaje("assistant", "¡Vale! Empezamos de cero. ✨ ¿Qué quieres hacer ahora?", false);

        if (window.resetMeta) window.resetMeta();

        if (window.AsistenteState) {
            console.log("Forzando reset directo del State...");
            window.AsistenteState.reset(); 
        }
        
        if (window.limpiarResaltado) window.limpiarResaltado();

        chrome.runtime.sendMessage({ type: "BROADCAST_RESET" });
    });
}

// ---------------------------------------------------------
// RESTAURAR HISTORIAL
// ---------------------------------------------------------
function restoreChatHistory() {
    chrome.storage.local.get(["asistente_chat_history", "asistente_goal"], (result) => {
        window.ChatUI.clear();
        
        const history = result.asistente_chat_history || [];
        const hayMision = !!result.asistente_goal;

        if (hayMision && window.fijarMeta) {
            window.fijarMeta();
        }

        if (history.length === 0 && !hayMision) {
            window.ChatUI.addMessage("assistant", "Hola ✨ ¿Qué quieres hacer en esta página?");
        } else {
            history.forEach(msg => window.ChatUI.addMessage(msg.tipo, msg.text));
        }
    });
}

// ---------------------------------------------------------
// LISTENER DE ESCRIBIR
// ---------------------------------------------------------
function setupInputListener(originalInput) {
    // Clonar para limpiar listeners viejos
    const input = originalInput.cloneNode(true);
    originalInput.parentNode.replaceChild(input, originalInput);
    
    // Foco automático (opcional, ayuda accesibilidad)
    input.focus();

    input.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        
        const texto = input.value.trim();
        if (!texto) return;

        // Comandos de sistema
        if (texto.toLowerCase() === "reiniciar" || texto.toLowerCase() === "salir") {
            ejecutarReinicioTotal();
            return;
        }

        window.ChatUI.clearInput();
        guardarYMostrarMensaje("user", texto);

        procesarInputUsuario(texto);
    });
}

// ---------------------------------------------------------
// LÓGICA DE NEGOCIO
// ---------------------------------------------------------
function procesarInputUsuario(texto) {
    // Si no hay meta fijada es el objetivo principal
    if (!window.isMetaFijada()) {
        window.fijarMeta();
        chrome.storage.local.set({ asistente_goal: texto, asistente_status: "active" });
        chrome.runtime.sendMessage({ type: "USER_GOAL", goal: texto });
    } 
    // Si hay meta el usuario puede seguir dando instrucciones
    else {
        console.log("Enviando dato al cerebro:", texto);
        if (window.ejecutarCicloIA) {
            window.ejecutarCicloIA("follow_up", { 
                type: "chat_response",
                text: texto,
                tag: "chat-input"
            });
        }
    }
}

// ---------------------------------------------------------
// FUNCIÓN PARA REINICIAR TOTALMENTE EL PROGRAMA
// ---------------------------------------------------------
function ejecutarReinicioTotal() {
    window.ChatUI.clearInput();
    window.ChatUI.addMessage("assistant", "Reiniciando sistema... 🔄");
    chrome.storage.local.clear(() => {
        setTimeout(() => window.location.reload(), 1000);
    });
}

// ---------------------------------------------------------
// FUNCIÓN QUE PINTA Y GUARDA
// ---------------------------------------------------------
function guardarYMostrarMensaje(tipo, texto, guardar = true) {
    window.ChatUI.addMessage(tipo, texto);
    
    if (guardar) {
        chrome.storage.local.get("asistente_chat_history", (result) => {
            const history = result.asistente_chat_history || [];
            history.push({ tipo, text: texto });
            chrome.storage.local.set({ asistente_chat_history: history });
        });
    }
}

window.iniciarChat = iniciarChat;