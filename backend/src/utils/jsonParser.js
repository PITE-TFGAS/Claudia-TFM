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

export function parseGroqJSON(data) {
  // En Groq la respuesta está en: choices[0].message.content
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error parseando JSON de Groq:", e);
    // Fallback por si acaso el modelo ignora el modo JSON
    const match = raw.match(/\{[^]*\}/);
    if (match) return JSON.parse(match[0]);
    return null;
  }
}
