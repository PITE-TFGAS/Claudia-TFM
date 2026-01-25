// ESTE SCRIPT TIENE QUE VER CON EL RESALTADO DE ELEMENTOS

function resaltarElemento(el) {
  const r = el.getBoundingClientRect();
  const padding = 5;

  const o = document.createElement("div");

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
    borderRadius: "6px"
  });

  document.body.appendChild(o);
}

