const toggleEnable = document.getElementById("toggle-enable");
const toggleDesign = document.getElementById("toggle-design");
const statusText = document.getElementById("status");

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab.url.startsWith("chrome://") || activeTab.url === "about:blank") {
        // Si está en blanco, se manda a google para que el script funcione
        chrome.tabs.update(activeTab.id, { url: "https://www.google.com" });
    }
});

// Inicializar estado
chrome.storage.local.get(["asistenteEnabled", "aestheticMode"], res => {
  toggleEnable.checked = !!res.asistenteEnabled;
  updateStatus(toggleEnable.checked);
  toggleDesign.checked = !!res.aestheticMode;
});

// Listener Activar/Desactivar
toggleEnable.addEventListener("change", () => {
  const isEnabled = toggleEnable.checked;
  chrome.storage.local.set({ asistenteEnabled: isEnabled });
  updateStatus(isEnabled);
});

// Listener Cambio de Diseño
toggleDesign.addEventListener("change", () => {
  const isAesthetic = toggleDesign.checked;
  chrome.storage.local.set({ aestheticMode: isAesthetic });
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { 
            action: "updateTheme", 
            aestheticMode: isAesthetic 
        });
    }
  });
});

function updateStatus(active) {
  statusText.textContent = active ? "ESTADO: ACTIVO" : "ESTADO: INACTIVO";
  statusText.style.color = active ? "#006400" : "#8B0000";
}

// ---------------------------------------------------------
// LÓGICA PARA GUARDAR IA EXPERTA
// ---------------------------------------------------------
const btnSaveExpert = document.getElementById("btn-save-expert");
const expertStatus = document.getElementById("expert-status");

btnSaveExpert.addEventListener("click", () => {
  const domain = document.getElementById("expert-domain").value.trim().toLowerCase();
  const endpoint = document.getElementById("expert-endpoint").value.trim();
  const apikey = document.getElementById("expert-apikey").value.trim();

  if (!domain || !endpoint) {
    expertStatus.textContent = "❌ Dominio y Endpoint obligatorios";
    expertStatus.style.color = "#8B0000";
    return;
  }

  // Obtener las IAs ya guardadas
  chrome.storage.local.get(["user_custom_ais"], (res) => {
    let ais = res.user_custom_ais || [];
    ais = ais.filter(ai => ai.domain !== domain);
    
    ais.push({ domain, endpoint, apiKey: apikey });

    chrome.storage.local.set({ user_custom_ais: ais }, () => {
      expertStatus.textContent = "✅ IA Experta guardada con éxito";
      expertStatus.style.color = "#006400";
      
      document.getElementById("expert-domain").value = "";
      document.getElementById("expert-endpoint").value = "";
      document.getElementById("expert-apikey").value = "";
      
      setTimeout(() => {
        expertStatus.textContent = "";
      }, 3000);
    });
  });
});