// SCRIPT ENCARGADO DE GESTIONAR LOS CAMBIOS DE PESTAÑA DEL USUARIO

window.TabKeeper = {
    isSearchEngine(host) {
        const engines = ["google.", "bing.", "yahoo.", "duckduckgo.", "ecosia.", "baidu."];
        return engines.some(se => host.includes(se));
    },

    async evaluate(goal) {
        if (!goal) return "GO";
        
        const currentHostname = window.location.hostname.toLowerCase();
        const data = await chrome.storage.local.get(["ia_original_host"]);
        const storedHost = data.ia_original_host;

        // 1. GESTIÓN DEL HOST ORIGINAL
        if (!storedHost || this.isSearchEngine(storedHost)) {
            if (!this.isSearchEngine(currentHostname)) {
                await chrome.storage.local.set({ 
                    ia_original_host: currentHostname,
                    asistenteGoal: goal 
                });
                return "GO";
            }
            return "GO";
        }

        const originalHost = storedHost.toLowerCase();

        // Mismo dominio
        if (currentHostname.includes(originalHost.replace("www.", ""))) return "GO";

        // Pasarelas de servicios
        const isService = /login|auth|pay|checkout|secure|verify|captcha/i.test(window.location.href);
        if (isService) return "GO";

        // Filtro semántico
        const brandName = originalHost.split('.')[0]; 
        const stopWords = ["quiero", "ver", "buscar", "comprar", "ir", "a", "en", "el", "la", "los", "las", "un", "una", "de", "del", "mis", "para", "con"];
        
        const coreKeywords = goal.toLowerCase()
            .split(/\s+/)
            .filter(word => 
                word.length > 3 && 
                !stopWords.includes(word) && 
                !word.includes(brandName)
            );

        if (coreKeywords.length === 0) return "GO";

        const pageContent = (document.title + " " + (document.body?.innerText.substring(0, 1500) || "")).toLowerCase();
        const matches = coreKeywords.filter(key => pageContent.includes(key));

        console.log(`TabKeeper: Evaluando ${currentHostname}. Matches: ${matches.length}`);

        if (matches.length === 0) {
            return "KILL";
        }

        return "GO";
    }
};