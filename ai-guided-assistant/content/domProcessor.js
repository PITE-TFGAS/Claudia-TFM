// ESTE SCRIPT HACE TODO LO QUE TIENE QUE VER CON EL DOM

// Variable global para guardar las "huellas digitales" de los elementos
window.mapaIA = new Map();

// ---------------------------------------------------------
// OBTENER EL DOM LIMPIO CON IDS OPTIMIZADOS Y ELEMENTOS RELEVANTES
// ---------------------------------------------------------
function obtenerDOM() {
  window.mapaIA.clear();
  let idCounter = 1;
  const elementosParaIA = [];

  const idsAntiguos = document.querySelectorAll("[data-ia-id]");
  idsAntiguos.forEach((el) => el.removeAttribute("data-ia-id"));

  const todos = document.body.querySelectorAll("a, button, input, select, textarea, [role='button']");

  todos.forEach((el) => {
    if (!esVisible(el)) return;

    const id = idCounter++;
    el.setAttribute("data-ia-id", id);

    // Reducir textos
    let texto = (el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "")
                .replace(/\s+/g, " ")
                .trim()
                .substring(0, 40); 

    const esActivo = el.getAttribute("aria-current") === "page" || el.classList.contains("active");
    if (esActivo) texto += "*";

    // Guardamos la huella digital completa en memoria (local)
    window.mapaIA.set(id, {
      referencia: el,
      tag: el.tagName.toLowerCase(),
      texto: texto
    });

    // Ahorro de tokens enviando al backend mínima info
    elementosParaIA.push({
      i: id,
      t: el.tagName.toLowerCase(),
      x: texto || "btn"
    });
  });

  return JSON.stringify(elementosParaIA);
}

// ---------------------------------------------------------
// BUSCAR EL ELEMENTO DADO EL ID (IDS OPTIMIZADOS)
// ---------------------------------------------------------
function buscarElementoRobusto(idIA) {
  // Limpieza del ID: solo me quedo con "10"
  let id = idIA.toString().replace(/[^0-9]/g, "");
  id = parseInt(id, 10);

  if (!id) {
    console.error("ID inválido recibido:", idIA);
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
