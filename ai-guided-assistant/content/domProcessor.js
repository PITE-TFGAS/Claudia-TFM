// ESTE SCRIPT HACE TODO LO QUE TIENE QUE VER CON EL DOM

// Variable global para guardar las "huellas digitales" de los elementos
window.mapaIA = new Map();

// ---------------------------------------------------------
// OBTENER EL DOM LIMPIO CON IDS OPTIMIZADOS Y ELEMENTOS RELEVANTES
// ---------------------------------------------------------
function obtenerDOM() {
  window.mapaIA.clear(); // Limpiar el mapa anterior
  let idCounter = 1;
  const elementosParaGemini = [];

  // Función para limpiar Ids antiguos
  const idsAntiguos = document.querySelectorAll("[data-ia-id]");
  idsAntiguos.forEach((el) => el.removeAttribute("data-ia-id"));

  // Recorrer todos los elementos
  const todos = document.body.querySelectorAll("*");

  // Identificar overlay para ignorarlo
  const overlay = document.getElementById("asistente-overlay");

  todos.forEach((el) => {
    // Si el elemento es parte del contenedor se ignora
    if (overlay && overlay.contains(el)) return;
    if (el.id === "asistente-overlay") return;

    // Se ignora el cuadro de resaltado de elementos
    if (el.id === "ia-highlighter-overlay") return;

    if (!esVisible(el)) return;

    const tag = el.tagName.toLowerCase();
    // Elementos que no importan
    if (["script", "style", "noscript", "meta"].includes(tag)) return;

    // Selector elementos usualmente interactivos
    const esInteractivo =
      tag === "a" ||
      tag === "button" ||
      tag === "input" ||
      tag === "select" ||
      tag === "textarea" ||
      el.getAttribute("role") === "button" ||
      el.onclick != null ||
      // SPAs
      window.getComputedStyle(el).cursor === "pointer";

    if (esInteractivo) {
      const id = idCounter++;
      el.setAttribute("data-ia-id", id);

      // Textos limpios
      let texto =
        el.innerText ||
        el.getAttribute("aria-label") ||
        el.getAttribute("placeholder") ||
        "";
      texto = texto.replace(/\s+/g, " ").trim().substring(0, 60);

      // Detectar si el elemento ya está activo/seleccionado ---
      const esActivo =
        el.getAttribute("aria-current") === "page" ||
        el.classList.contains("active") ||
        el.classList.contains("selected");

      if (esActivo) texto += " (SELECCIONADO ACTUALMENTE)";

      // Guardar la "Huella Digital" en memoria por si el DOM cambia
      window.mapaIA.set(id, {
        referencia: el,
        tag: tag,
        texto: texto,
        clases: el.className,
      });

      elementosParaGemini.push({
        id: id,
        tag: tag,
        text: texto || "Elemento interactivo",
      });
    }
  });

  return JSON.stringify(elementosParaGemini);
}

// ---------------------------------------------------------
// BUSCAR EL ELEMENTO DADO EL ID DE GEMINI (IDS OPTIMIZADOS)
// ---------------------------------------------------------
function buscarElementoRobusto(idGemini) {
  // Limpieza del ID: solo me quedo con "10"
  let id = idGemini.toString().replace(/[^0-9]/g, "");
  id = parseInt(id, 10);

  if (!id) {
    console.error("ID inválido recibido:", idGemini);
    return null;
  }

  // INTENTO 1: Búsqueda rápida por atributo
  let el = document.querySelector(`[data-ia-id="${id}"]`);
  if (el && document.body.contains(el)) {
    console.log(`Encontrado por ID directo: ${id}`);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    return el;
  }

  console.warn(
    `ID ${id} perdido (React refrescó el DOM). Iniciando protocolo de recuperación...`,
  );

  // INTENTO 2: Usar el mapa de seguridad (fallback)
  const datosBackup = window.mapaIA.get(id);

  if (!datosBackup) {
    console.error("No hay datos de respaldo para este ID.");
    return null;
  }

  // Buscar un elemento que se parezca al original (mismo Tag y mismo Texto)
  const candidatos = Array.from(document.querySelectorAll(datosBackup.tag));

  // Filtrar el candidato que tenga el mismo texto y clases
  el = candidatos.find((c) => {
    const textoC = (c.innerText || c.getAttribute("aria-label") || "")
      .replace(/\s+/g, " ")
      .trim();
    return textoC.includes(datosBackup.texto) && esVisible(c);
  });

  if (el) {
    console.log("Elemento recuperado por huella digital (texto/tag).");
    el.setAttribute("data-ia-id", id);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    return el;
  }

  console.error("Imposible recuperar el elemento. La página cambió demasiado.");
  return null;
}

// ---------------------------------------------------------
// FUNCIÓN AUXILIAR SIMPLE PARA SABER SI ES VISIBLE (PARA EL FALLBACK)
// ---------------------------------------------------------
function esVisible(el) {
  const style = window.getComputedStyle(el);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    el.offsetWidth > 0 &&
    el.offsetHeight > 0
  );
}
