// ESTE SCRIPT HACE TODO LO QUE TIENE QUE VER CON EL DOM

// Variable global para guardar las "huellas digitales" de los elementos
window.mapaIA = new Map();

// ---------------------------------------------------------
// OBTENER EL DOM LIMPIO
// ---------------------------------------------------------
function obtenerDOM() {
  window.mapaIA.clear();
  document.querySelectorAll("[data-ia-id]").forEach((el) => el.removeAttribute("data-ia-id"));

  let idCounter = 1;
  const elementosParaIA = [];
  const nodosIgnorados = new Set(); // evita duplicados

  const limpiarTexto = (txt) => (txt || "").replace(/\s+/g, " ").trim();

  // Exclusión
  const estaEnZonaProhibida = (el) => {
    return el.closest("#asistente-overlay, .asistente-chat, #ia-highlighter-overlay, noscript, script, style");
  };

  // Barra de progreso
  const esBarraDePasos = (el) => {
      return el.closest('nav ul, .steps, .progress, .wizard, .tracker, .breadcrumb, [class*="progress-tracker"], [class*="steps"]');
  };

  // Selectores interactivos comunes
  const selectoresInteractivos = [
    "button", "a[href]", "input", "select", "textarea",
    "[role='button']", "[role='link']", "[role='checkbox']", "[role='radio']",
    ".btn", ".button"
  ].join(", ");

  const interactivos = Array.from(document.querySelectorAll(selectoresInteractivos));

  interactivos.forEach((el) => {
    if (estaEnZonaProhibida(el)) return;
    if (!esVisible(el)) return;

    let texto = "";
    
    // Extracción de texto
// Extracción de texto
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      let labelTxt = "";

      if (el.id) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label) {
          labelTxt = label.innerText;
          nodosIgnorados.add(label); 
        }
      }
      
      if (!labelTxt) {
        const parentLabel = el.closest('label') || el.closest('.input-text, .input-container, .form-group');
        if (parentLabel) {
          labelTxt = parentLabel.innerText;
          nodosIgnorados.add(parentLabel);
          parentLabel.querySelectorAll('label, span, p').forEach(h => nodosIgnorados.add(h));
        }
      }
      
      if (!labelTxt) {
        labelTxt = el.getAttribute("aria-label") || el.name || el.title || "Campo de texto";
      }

      labelTxt = limpiarTexto(labelTxt);

      labelTxt = labelTxt.split('\n')[0];

      if (el.type === "radio" || el.type === "checkbox") {
        texto = `${labelTxt} (${el.checked ? "Marcado" : "Desmarcado"})`;
      } else {
        const placeholderTxt = el.placeholder ? `(Ej: ${el.placeholder})` : "";
        const valorTxt = el.value ? `[TIENE VALOR: ${el.value}]` : "[VACÍO]";
        texto = `${labelTxt} ${placeholderTxt} ${valorTxt}`;
      }
    } else if (el.tagName === "SELECT") {
      texto = `Selección: ${el.options[el.selectedIndex]?.text || ""}`;
    } else {
      texto = el.innerText || el.getAttribute("aria-label") || el.title || "";
    }

    texto = limpiarTexto(texto);

    // Iconos sin texto
    if (!texto) {
      const icon = el.querySelector("svg, img, i");
      if (icon) texto = icon.getAttribute("aria-label") || icon.getAttribute("alt") || "Icono";
    }

    // Etiquetado inteligente
    if (texto.length > 0) {
      let etiquetas = ["ACCION"];
      const lowerTxt = texto.toLowerCase();

      // Detección de Modales/Popups
      if (el.closest('dialog, [role="dialog"], [role="alertdialog"], .modal, .popup, .overlay')) {
        etiquetas.push("MODAL_ABIERTO");
      }

      // Detectar barras de progreso
      if (esBarraDePasos(el)) {
         etiquetas = ["INFO_PASO"];
         if (el.matches('.active, .current, [aria-current]')) etiquetas.push("ACTUAL");
      } 
      // Detección vuelos
      else if (lowerTxt.includes("seleccionar") || el.type === 'radio' || (lowerTxt.includes("€") && !lowerTxt.includes("total"))) {
         etiquetas.push("OFERTA_VUELO");
      }
      // Calendarios
      else if (lowerTxt.includes("€") && !el.type) {
          etiquetas.push("CALENDARIO_PRECIO");
      }

      if (el.matches('.active, .selected, :checked')) etiquetas.push("SELECCIONADO");

      const id = idCounter++;
      el.setAttribute("data-ia-id", id);
      nodosIgnorados.add(el);
      
      const finalStr = `[${etiquetas.join("|")}] ${texto}`;
      
      window.mapaIA.set(id, { referencia: el, texto: finalStr, tag: el.tagName });
      elementosParaIA.push({ i: id, t: el.tagName.toLowerCase(), x: finalStr });
    }
  });

  // Detector de errores
  const esMensajeDeError = (el) => {
    // 1. Detección por accesibilidad (El estándar global)
    if (el.getAttribute("role") === "alert" || el.getAttribute("aria-invalid") === "true") return true;

    // 2. Detección por clases o IDs en el elemento o en sus padres cercanos
    // Buscamos palabras típicas de error en el código fuente
    const contenedorSospechoso = el.closest('[class*="error" i], [class*="invalid" i], [class*="danger" i], [class*="alert" i], [id*="error" i]');
    
    // Si está dentro de una caja de error, es un error
    if (contenedorSospechoso) return true;

    return false;
  };

  // Textos informativos
  const todos = document.querySelectorAll("div, span, p, h1, h2, h3, h4, li, label, td");
  
  todos.forEach((el) => {
    if (estaEnZonaProhibida(el)) return;
    if (nodosIgnorados.has(el)) return;
    if (!esVisible(el)) return;
    if (esBarraDePasos(el)) return; 

    // Si contiene algo dentro es un contenedor
    if (el.querySelector(selectoresInteractivos)) return;

    const hijosBloque = Array.from(el.children).filter(c => ["DIV", "P", "UL", "TABLE"].includes(c.tagName));
    if (hijosBloque.length > 0) return;

    const texto = limpiarTexto(el.innerText);
    
    // Filtros de calidad
    if (texto.length < 2) return;
    if (/^\d{1,2}$/.test(texto)) return;

    let etiquetas = [];
    const esPrecio = /[\d.,]+\s*[$€£¥]/.test(texto);
    if (esPrecio) etiquetas.push("PRECIO");
    
    if (esMensajeDeError(el)) etiquetas.push("ERROR");

    const ultimo = elementosParaIA[elementosParaIA.length - 1];
    if (ultimo && ultimo.x.includes(texto)) return;

    const id = idCounter++;
    el.setAttribute("data-ia-id", id);
    el.querySelectorAll('*').forEach(h => nodosIgnorados.add(h));
    
    const finalStr = (etiquetas.length ? `[${etiquetas.join("|")}] ` : "") + texto;
    
    window.mapaIA.set(id, { referencia: el, texto: finalStr, tag: el.tagName });
    elementosParaIA.push({ i: id, t: el.tagName.toLowerCase(), x: finalStr.substring(0, 150) });
  });

  console.log("🔍 SNAPSHOT PARA IA:", JSON.stringify(elementosParaIA, null, 2));

  return JSON.stringify(elementosParaIA);
}

// ---------------------------------------------------------
// BUSCAR ELEMENTO (SIMILITUD)
// ---------------------------------------------------------
function buscarElementoRobusto(idIA) {
  let id = parseInt(idIA.toString().replace(/[^0-9]/g, ""), 10);
  if (!id) return null;

  // Intento Directo
  let el = document.querySelector(`[data-ia-id="${id}"]`);
  if (el && document.body.contains(el)) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    return el;
  }

  // Fallback
  const datos = window.mapaIA.get(id);
  if (!datos) return null;

  const candidatos = Array.from(document.querySelectorAll(datos.tag));
  el = candidatos.find((c) => {
    if (!esVisible(c)) return false;

    let textoC = (c.innerText || "").toLowerCase();
    if (c.value) textoC += " " + c.value.toLowerCase();
    if (c.getAttribute("aria-label"))
      textoC += " " + c.getAttribute("aria-label").toLowerCase();
    const originalLimpio = datos.texto
      .toLowerCase()
      .replace(/\[.*?\]/g, "")
      .trim();
    return textoC.includes(originalLimpio) || originalLimpio.includes(textoC);
  });

  if (el) {
    el.setAttribute("data-ia-id", id);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    return el;
  }
  return null;
}

// ---------------------------------------------------------
// HELPER: VISIBILIDAD REAL
// ---------------------------------------------------------
function esVisible(el) {
  const style = window.getComputedStyle(el);
  if (!el) return false;

  if (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") {
    if (el.type === "hidden" || style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    return true; 
  }
  
  if (el.getAttribute("aria-hidden") === "true") return false;
  if (el.offsetParent === null && el.tagName !== "BODY") return false;
  
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (style.opacity === "0" && el.tagName !== "INPUT") return false;

  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

window.obtenerDOM = obtenerDOM;
window.buscarElementoRobusto = buscarElementoRobusto;
