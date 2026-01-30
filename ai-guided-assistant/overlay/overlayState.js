// ESTE SCRIPT GESTIONA LOS ESTADOS (META FIJADA, RESET)
let metaFijada = false;

function isMetaFijada() {
  return metaFijada;
}

function fijarMeta() {
  metaFijada = true;
}

function resetMeta() {
  metaFijada = false;
}

window.isMetaFijada = isMetaFijada;
window.fijarMeta = fijarMeta;
window.resetMeta = resetMeta;