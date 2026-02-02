/**
 * Recorta el DOM si excede el límite de caracteres para evitar el error 429 de Groq.
 * @param {string} domJSON - El DOM stringificado que viene del frontend.
 * @param {number} maxChars - Límite máximo de caracteres (aprox 4 chars por token).
 */
export function truncateDOM(domJSON, maxChars = 32000) {
  if (domJSON.length <= maxChars) return domJSON;

  console.warn(
    `⚠️ DOM demasiado grande (${domJSON.length} chars). Recortando...`,
  );

  try {
    const array = JSON.parse(domJSON);
    const result = [];
    let currentLength = 2; // Por los corchetes []

    for (const el of array) {
      const elString = JSON.stringify(el);
      // +1 por la coma
      if (currentLength + elString.length + 1 > maxChars) break;
      result.push(el);
      currentLength += elString.length + 1;
    }

    return JSON.stringify(result);
  } catch (e) {
    return domJSON.substring(0, maxChars);
  }
}
