// ESTE SCRIPT SE COMUNICA CON LA API DE LA IA

function pedirAIAQueEncuentreElemento(intent, dom) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(
      { type: "CALL_GEMINI", intent, dom },
      resolve
    );
  });
}
