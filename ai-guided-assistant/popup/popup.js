const toggle = document.getElementById("toggle");
const status_assitant = document.getElementById("status");

chrome.storage.local.get("asistenteEnabled", res => {
  toggle.checked = !!res.asistenteEnabled;
  status_assitant.textContent = toggle.checked ? "Activo" : "Inactivo";
});

toggle.addEventListener("change", () => {
  chrome.storage.local.set({ asistenteEnabled: toggle.checked });
  status_assitant.textContent = toggle.checked ? "Activo" : "Inactivo";
});
