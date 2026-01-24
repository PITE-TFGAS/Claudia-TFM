import fetch from "node-fetch";

export async function callGemini(intent, dom) {
  const body = {
    contents: [{
      parts: [{
        text: `
Eres un asistente experto en accesibilidad.
Tarea: "${intent}"

DOM:
${dom}

Devuelve SOLO JSON:
{
  "descripcion": "",
  "selector": ""
}
`
      }]
    }]
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  return res.json();
}
