// ESTE SCRIPT HACE TODO LO QUE TIENE QUE VER CON EL DOM

// Variable global para guardar las "huellas digitales" de los elementos
window.mapaIA = new Map();

// ---------------------------------------------------------
// OBTENER EL DOM LIMPIO 
// ---------------------------------------------------------
function obtenerDOM() {
  window.mapaIA.clear();
  let idCounter = 1;
  const elementosParaIA = [];

  const idsAntiguos = document.querySelectorAll("[data-ia-id]");
  idsAntiguos.forEach((el) => el.removeAttribute("data-ia-id"));

  // Selectores semánticos
  const selectores = [
    "input:not([type='hidden'])",
    "select",
    "textarea",
    "button",
    "a",
    "[role='button']",
    "[role='combobox']",
    "[role='listbox']",
    "[role='gridcell']",
    "[role='link']",
    "[tabindex='0']",
  ].join(", ");

  const semanticos = Array.from(document.querySelectorAll(selectores));

  // Elementos genéricos clickables 
  const sospechosos = Array.from(
    document.querySelectorAll("div, span, td, li, img, svg"),
  );

  const interactivosOcultos = sospechosos.filter((el) => {
    if (el.matches(selectores)) return false; // Ya capturado
    const estilo = window.getComputedStyle(el);
    return estilo.cursor === "pointer";
  });

  const todos = [...new Set([...semanticos, ...interactivosOcultos])];

  todos.forEach((el) => {
    // Filtros de seguridad
    if (el.closest("#asistente-overlay")) return;
    if (el.id === "ia-highlighter-overlay") return;
    if (!esVisible(el)) return;

    const id = idCounter++;
    el.setAttribute("data-ia-id", id);

    // Análisis del elemento
    let etiquetas = [];
    let textoPrincipal = "";

    // Extracción de contexto
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      let val = el.value;
      const place = el.getAttribute("placeholder") || "";

      // Palabras comunes cuando el campo está vacío
      const valoresPlaceholder = [
        "Origen",
        "Destino",
        "Fecha",
        "Ida",
        "Vuelta",
        "",
        "Buscar",
        "Salida",
        "Llegada",
        "Seleccionar",
      ];
      const valLimpio = (val || "").trim();

      const esGenerico =
        valoresPlaceholder.some(
          (b) => b.toLowerCase() === valLimpio.toLowerCase(),
        ) || val === place;

      if (esGenerico) {
        textoPrincipal = place || "Campo de texto";
        etiquetas.push("VACÍO");
      } else {
        textoPrincipal = `${place} [TIENE VALOR: ${val}]`;
      }

      if ((el.type === "radio" || el.type === "checkbox") && el.checked)
        etiquetas.push("MARCADO");
    } else if (el.tagName === "SELECT") {
      const opt = el.options[el.selectedIndex];
      if (opt && !opt.text.toLowerCase().includes("selec")) {
        textoPrincipal = `Selector [TIENE VALOR: ${opt.text}]`;
      } else {
        textoPrincipal = "Selector [VACÍO]";
      }
    } else {
      textoPrincipal =
        el.innerText || el.getAttribute("aria-label") || el.title || "";
    }

    // fechas
    const identificadores = (
      el.id +
      " " +
      (el.getAttribute("aria-label") || "")
    ).toLowerCase();
    const matchFecha = identificadores.match(/(\d{4}-\d{2}-\d{2})/);

    if (matchFecha) {
      etiquetas.push(`FECHA EXACTA: ${matchFecha[1]}`);
    } else if (/^[0-9]{1,2}$/.test(textoPrincipal.trim())) {
      // Verificar si es un calendario
      const padreEstructural = el.closest("table, [role='grid'], [role='row']");
      if (padreEstructural) {
        etiquetas.push("DÍA CALENDARIO");
      }
    }

    // Detección de precios
    if (textoPrincipal.includes("€") || textoPrincipal.includes("$")) {
      if (/\d/.test(textoPrincipal)) {
        etiquetas.push("BOTÓN TARIFA");
      }
    }

    // Detección del foco
    if (el === document.activeElement) {
      etiquetas.push("FOCO ACTUAL / ESCRIBIENDO");
    }

    // Detección del estado
    if (
      el.getAttribute("aria-selected") === "true" ||
      el.getAttribute("aria-current") === "true" ||
      el.getAttribute("aria-checked") === "true"
    ) {
      etiquetas.push("SELECCIONADO");
    }

    // Fallback a clases genéricas
    else if (
      el.classList.contains("active") ||
      el.classList.contains("selected") ||
      el.classList.contains("checked") ||
      el.classList.contains("activo")
    ) {
      etiquetas.push("SELECCIONADO");
    }

    if (!textoPrincipal && etiquetas.length === 0) {
      textoPrincipal = "Elemento interactivo";
    }

    const tagsStr = etiquetas.length > 0 ? `[${etiquetas.join(" | ")}]` : "";
    let textoFinal = `${tagsStr} ${textoPrincipal}`.trim();
    textoFinal = textoFinal.replace(/\s+/g, " ").substring(0, 100);

    window.mapaIA.set(id, {
      referencia: el,
      tag: el.tagName.toLowerCase(),
      texto: textoFinal,
    });

    elementosParaIA.push({
      i: id,
      t: el.tagName.toLowerCase(),
      x: textoFinal,
    });
  });

  // ---------------------------------------------------------
  // LOG PARA DEPURAR
  // ---------------------------------------------------------
  console.log("🔍 SNAPSHOT PARA IA:", JSON.stringify(elementosParaIA, null, 2));
  // ---------------------------------------------------------

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
  const rect = el.getBoundingClientRect();
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top < window.innerHeight &&
    rect.bottom > 0
  );
}

window.obtenerDOM = obtenerDOM;
window.buscarElementoRobusto = buscarElementoRobusto;
