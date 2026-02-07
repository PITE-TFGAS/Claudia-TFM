// SCRIPT ENCARGADO DEL CUADRO AMARILLO QUE RESALTA ELEMENTOS

// ---------------------------------------------------------
// RESALTA EL ELEMENTO PASADO POR PARÁMETRO
// ---------------------------------------------------------
function resaltarElemento(el) {
  // Limpiar resaltados anteriores
  limpiarResaltado();

  const r = el.getBoundingClientRect(); // Posición relativa al viewport
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

  gestionarEsquivaChat(r);
}

// ---------------------------------------------------------
// LÓGICA DE DODGING
// ---------------------------------------------------------
function gestionarEsquivaChat(rectElemento) {
  const chat = document.getElementById("asistente-overlay");
  if (!chat) return;

  // coordenadas del chat
  const rectChat = chat.getBoundingClientRect();

  // Si los cuadros se tocan en algún punto
  const hayColision = !(
    rectElemento.right < rectChat.left ||
    rectElemento.left > rectChat.right ||
    rectElemento.bottom < rectChat.top ||
    rectElemento.top > rectChat.bottom
  );

  // Mover el chat
  if (hayColision) {
    console.log("El chat está tapando el elemento. Moviendo...");

    const windowWidth = window.innerWidth;
    const centroElementoX = rectElemento.left + rectElemento.width / 2;

    chat.style.transition = "left 0.3s ease-in-out, top 0.3s ease-in-out";

    // Saltar horizontalmente al lado contrario
    if (centroElementoX > windowWidth / 2) {
      chat.style.left = "20px";
      chat.style.right = "auto";
    } else {
      const nuevaLeft = windowWidth - rectChat.width - 20;
      chat.style.left = `${nuevaLeft}px`;
      chat.style.right = "auto";
    }

    setTimeout(() => {
      chat.style.transition = "";
    }, 300);
  }
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
