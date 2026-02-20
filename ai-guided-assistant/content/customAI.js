// SCRIPT ENCARGADO DE GESTIONAR LAS IAS EXPERTAS QUE EL USUARIO PUEDA TENER

window.CustomAIManager = {
    // Busca en la memoria local si el usuario guardó una IA para esta web
    async getExpertForCurrentPage() {
        const currentUrl = window.location.href.toLowerCase();

        return new Promise((resolve) => {
            chrome.storage.local.get(["user_custom_ais"], (result) => {
                const ais = result.user_custom_ais || [];
                const experto = ais.find(ai => currentUrl.includes(ai.domain.toLowerCase()));
                resolve(experto || null);
            });
        });
    },

    // Esta función llama a la IA privada del usuario
    async callExpert(experto, payload) {
        console.log(`🧠 Usando IA Experta del usuario para: ${experto.domain}`);
        
        try {
            const response = await fetch(experto.endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": experto.apiKey ? `Bearer ${experto.apiKey}` : ""
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Fallo en la IA Experta");
            
            return await response.json();
        } catch (error) {
            console.error("Error contactando a la IA experta:", error);
            return null;
        }
    }
};