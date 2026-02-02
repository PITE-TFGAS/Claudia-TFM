// SCRIPT ENCARGADO DEL CUADRO AMARILLO QUE RESALTA ELEMENTOS

// ---------------------------------------------------------
// RESALTA EL ELEMENTO PASADO POR PARÁMETRO
// ---------------------------------------------------------
function resaltarElemento(el) {
  // limpiar resaltados anteriores
  limpiarResaltado();

  const r = el.getBoundingClientRect();

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

  const padding = 5;

  const o = document.createElement("div");
  // id para manipularlo
  o.id = "ia-highlighter-overlay";

  Object.assign(o.style, {
    position: "absolute",
    top: r.top + scrollTop - padding + "px",
    left: r.left + scrollLeft - padding + "px",
    width: r.width + padding * 2 + "px",
    height: r.height + padding * 2 + "px",

    // Estilos visuales
    border: "4px solid #FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    boxShadow: "0 0 15px rgba(255, 215, 0, 0.6)",
    zIndex: 999990,
    pointerEvents: "none",
    borderRadius: "6px",
    transition: "all 0.2s ease-out",
  });

  document.body.appendChild(o);

  // Scroll hacia el elemento
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ---------------------------------------------------------
// ELIMINA CUALQUIER CUADRO EXISTENTE
// ---------------------------------------------------------
function limpiarResaltado() {
  const existente = document.getElementById("ia-highlighter-overlay");
  if (existente) {
    existente.remove();
  }
}

// Exponer globalmente
window.limpiarResaltado = limpiarResaltado;
window.resaltarElemento = resaltarElemento;
