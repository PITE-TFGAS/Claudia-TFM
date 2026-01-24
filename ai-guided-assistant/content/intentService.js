// SERVICIO QUE SE ENCARGA DE GESTIONAR LA INTENCIÓN DEL USUARIO

// LLAMAR A LA IA
function resolverIntencion(intent, dom) {
  console.log(dom)
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "CALL_AI", intent, dom },
      resolve
    );
  });
}


// PARSEAR LA ENTRADA DEL USUARIO
function parseIntent(texto) {
  return texto.trim();
}