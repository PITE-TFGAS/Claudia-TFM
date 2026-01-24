// ESTE SCRIPT TIENE QUE VER CON EL RESALTADO DE ELEMENTOS

function resaltarElemento(el) {
  const r = el.getBoundingClientRect();
  const o = document.createElement("div");

  Object.assign(o.style, {
    position: "fixed",
    top: r.top + "px",
    left: r.left + "px",
    width: r.width + "px",
    height: r.height + "px",
    border: "4px solid gold",
    boxShadow: "0 0 20px gold",
    zIndex: 999999,
    pointerEvents: "none",
    borderRadius: "6px"
  });

  document.body.appendChild(o);
}
