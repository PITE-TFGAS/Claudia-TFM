// SCRIPT ENCARGADO DEL CUADRO AMARILLO QUE RESALTA ELEMENTOS

// ---------------------------------------------------------
// RESALTA EL ELEMENTO PASADO POR PARÁMETRO
// ---------------------------------------------------------
function resaltarElemento(el) {
  // Limpiar cualquier resaltado anterior para que no se acumulen
  limpiarResaltado();

  const r = el.getBoundingClientRect();
  const padding = 5;

  const o = document.createElement("div");
  
  // id para manipularlo luego
  o.id = "ia-highlighter-overlay"; 

  Object.assign(o.style, {
    position: "fixed", 
    top: (r.top - padding) + "px",
    left: (r.left - padding) + "px",
    width: (r.width + padding * 2) + "px",
    height: (r.height + padding * 2) + "px",
    border: "4px solid gold",
    boxShadow: "0 0 20px gold",
    zIndex: 999999,
    pointerEvents: "none",
    borderRadius: "6px",
    transition: "all 0.3s ease"
  });

  document.body.appendChild(o);
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