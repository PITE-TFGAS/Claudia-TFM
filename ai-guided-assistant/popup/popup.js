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
// LÓGICA DE IAS EXPERTAS (AÑADIR, LISTAR, EDITAR, BORRAR)
// ---------------------------------------------------------
const btnSaveExpert = document.getElementById("btn-save-expert");
const expertStatus = document.getElementById("expert-status");
const savedExpertsList = document.getElementById("saved-experts-list");
const detailsAddExpert = document.getElementById("details-add-expert");

// Función para pintar la lista de IAs guardadas
function renderSavedExperts() {
  chrome.storage.local.get(["user_custom_ais"], (res) => {
    const ais = res.user_custom_ais || [];
    savedExpertsList.innerHTML = "";

    if (ais.length === 0) {
      savedExpertsList.innerHTML = '<div class="empty-list">No hay IAs expertas guardadas.</div>';
      return;
    }

    ais.forEach((ai) => {
      const div = document.createElement("div");
      div.className = "expert-item";
      
      div.innerHTML = `
        <span class="expert-item-domain">${ai.domain}</span>
        <span class="expert-item-endpoint">${ai.endpoint}</span>
        <div class="expert-actions">
          <button class="btn-edit" data-domain="${ai.domain}">Editar</button>
          <button class="btn-delete" data-domain="${ai.domain}">Borrar</button>
        </div>
      `;
      savedExpertsList.appendChild(div);
    });

    // Listener de Eliminar
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", (e) => deleteExpert(e.target.dataset.domain));
    });

    // Listener de Editar
    document.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", (e) => editExpert(e.target.dataset.domain));
    });
  });
}

// Función para borrar una IA
function deleteExpert(domain) {
  chrome.storage.local.get(["user_custom_ais"], (res) => {
    let ais = res.user_custom_ais || [];
    ais = ais.filter(ai => ai.domain !== domain); 
    
    chrome.storage.local.set({ user_custom_ais: ais }, () => {
      renderSavedExperts();
    });
  });
}

// Función para editar
function editExpert(domain) {
  chrome.storage.local.get(["user_custom_ais"], (res) => {
    const ais = res.user_custom_ais || [];
    const aiToEdit = ais.find(ai => ai.domain === domain);
    
    if (aiToEdit) {
      // Rellenar formulario
      document.getElementById("expert-domain").value = aiToEdit.domain;
      document.getElementById("expert-endpoint").value = aiToEdit.endpoint;
      document.getElementById("expert-apikey").value = aiToEdit.apiKey || "";
      
      detailsAddExpert.open = true;
      document.getElementById("details-manage-experts").open = false;
      
      // Feedback visual
      expertStatus.textContent = "Editando IA existente...";
      expertStatus.style.color = "#000";
    }
  });
}

// Listener de Guardar
btnSaveExpert.addEventListener("click", () => {
  const domain = document.getElementById("expert-domain").value.trim().toLowerCase();
  const endpoint = document.getElementById("expert-endpoint").value.trim();
  const apikey = document.getElementById("expert-apikey").value.trim();

  if (!domain || !endpoint) {
    expertStatus.textContent = "❌ Dominio y Endpoint obligatorios";
    expertStatus.style.color = "#8B0000";
    return;
  }

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
      
      renderSavedExperts();

      chrome.storage.local.remove(["expert_form_draft", "expert_menu_open"]);
      
      setTimeout(() => {
        expertStatus.textContent = "";
      }, 3000);
    });
  });
});

// ---------------------------------------------------------
// SISTEMA DE BORRADOR AUTOMÁTICO
// ---------------------------------------------------------
const domainInput = document.getElementById("expert-domain");
const endpointInput = document.getElementById("expert-endpoint");
const apikeyInput = document.getElementById("expert-apikey");

// Cargar el borrador si existe al abrir el popup
chrome.storage.local.get(["expert_form_draft", "expert_menu_open"], (res) => {
  if (res.expert_form_draft) {
    domainInput.value = res.expert_form_draft.domain || "";
    endpointInput.value = res.expert_form_draft.endpoint || "";
    apikeyInput.value = res.expert_form_draft.apikey || "";
  }
  if (res.expert_menu_open) {
    detailsAddExpert.open = true;
  }
});

// Guardar cada vez que escribe el usuario
function saveDraft() {
  const draft = {
    domain: domainInput.value,
    endpoint: endpointInput.value,
    apikey: apikeyInput.value
  };
  chrome.storage.local.set({ expert_form_draft: draft });
}

domainInput.addEventListener("input", saveDraft);
endpointInput.addEventListener("input", saveDraft);
apikeyInput.addEventListener("input", saveDraft);

detailsAddExpert.addEventListener("toggle", () => {
  chrome.storage.local.set({ expert_menu_open: detailsAddExpert.open });
});


renderSavedExperts();