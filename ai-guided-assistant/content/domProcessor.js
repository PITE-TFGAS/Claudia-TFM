// ESTE SCRIPT HACE TODO LO QUE TIENE QUE VER CON EL DOM
function obtenerDOM() {
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll("script, style, noscript").forEach(e => e.remove());
  let html = clone.innerHTML;
  if (html.length > 10000) html = html.slice(0, 10000);
  return html;
}

function buscarElementoRobusto(selector, descripcion) {
  if (!selector) selector = "";
  selector = selector.trim();

  if (selector) {
    try {
      const el = document.querySelector(selector);
      if (el) return el;
    } catch {}
  }

  const keywords = ["accede","acceder","iniciar","login","entrar","perfil","account"];
  const ref = (selector + " " + (descripcion || "")).toLowerCase();
  const elements = document.querySelectorAll(
    "a, button, [role=button], input[type=submit], input[type=button]"
  );

  let best = null, scoreMax = 0;

  for (const el of elements) {
    const t = (el.textContent || "").toLowerCase();
    const aria = (el.getAttribute("aria-label") || "").toLowerCase();
    let score = 0;

    for (const k of keywords) {
      if (t.includes(k)) score += 3;
      if (aria.includes(k)) score += 2;
      if (ref.includes(k)) score += 1;
    }

    if (score > scoreMax) {
      scoreMax = score;
      best = el;
    }
  }
  return best;
}
