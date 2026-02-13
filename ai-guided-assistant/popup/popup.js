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