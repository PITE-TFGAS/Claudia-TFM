export function parseGeminiJSON(data) {

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) return null;

  const limpio = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  console.log("Raw text limpio:", limpio);

  const match = limpio.match(/\{[^]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch (e) {
    console.error("Error parseando JSON:", e);
    return null;
  }
}
