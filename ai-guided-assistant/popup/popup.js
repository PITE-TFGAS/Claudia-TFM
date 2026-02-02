const toggle = document.getElementById("toggle");
const status_assitant = document.getElementById("status");

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab.url.startsWith("chrome://") || activeTab.url === "about:blank") {
        // Si está en blanco, se manda a google para que el script funcione
        chrome.tabs.update(activeTab.id, { url: "https://www.google.com" });
    }
});

chrome.storage.local.get("asistenteEnabled", res => {
  toggle.checked = !!res.asistenteEnabled;
  status_assitant.textContent = toggle.checked ? "Activo" : "Inactivo";
});

toggle.addEventListener("change", () => {
  chrome.storage.local.set({ asistenteEnabled: toggle.checked });
  status_assitant.textContent = toggle.checked ? "Activo" : "Inactivo";
});
