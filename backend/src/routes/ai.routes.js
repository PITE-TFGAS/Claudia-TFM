import express from "express";
import { callGemini, callGeminiStep } from "../services/gemini.service.js";
import { callGroqIntent, callGroqStep} from "../services/groq.service.js"
import { parseGeminiJSON, parseGroqJSON } from "../utils/jsonParser.js";

const router = express.Router();

// ---------------------------------------------------------
// GEMINI
// ---------------------------------------------------------
router.post("/intentGemini", async (req, res) => {
  const { intent, dom } = req.body;
  console.log(dom);

  try {
    const raw = await callGemini(intent, dom);
    const parsed = parseGeminiJSON(raw);
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI error" });
  }
});

router.post("/stepGemini", async (req, res) => {
  const { goal, dom, phase, lastSuggestedId, lastSuggestedText, clickedInfo, history, url, title } =
    req.body;

  try {
    const raw = await callGeminiStep({
      goal,
      dom,
      phase,
      lastSuggestedId,
      lastSuggestedText,
      clickedInfo,
      history,
      url, 
      title
    });
    const parsed = parseGeminiJSON(raw);
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ feedback: "Tuve un error interno. Intenta de nuevo." });
  }
});

// ---------------------------------------------------------
// GROQ
// ---------------------------------------------------------

router.post("/intentGroq", async (req, res) => {
  const { intent, dom } = req.body;

  try {
    const raw = await callGroqIntent(intent, dom);
    const parsed = parseGroqJSON(raw);
    
    if (!parsed) {
      throw new Error("Groq devolvió un formato JSON inválido o vacío.");
    }

    res.json(parsed);
  } catch (e) {
    console.error("Error en /intent con Groq:", e.message);
    res.status(500).json({ error: "Error en el motor de IA (Groq)." });
  }
});

// Ruta para el razonamiento paso a paso de navegación
router.post("/stepGroq", async (req, res) => {
  const { 
    goal, 
    dom, 
    phase, 
    lastSuggestedId, 
    lastSuggestedText, 
    clickedInfo, 
    history, 
    url, 
    title 
  } = req.body;

  try {
    // modelo 70b para razonamiento complejo
    const raw = await callGroqStep({
      goal,
      dom,
      phase,
      lastSuggestedId,
      lastSuggestedText,
      clickedInfo,
      history,
      url, 
      title
    });

    const parsed = parseGroqJSON(raw);

    if (!parsed) {
      return res.status(500).json({ 
        feedback: "No pude procesar la respuesta de la IA. Intenta de nuevo.",
        status: "in_progress" 
      });
    }

    res.json(parsed);
  } catch (e) {
    console.error("Error en /step con Groq:", e.message);
    
    // Manejo específico para el límite de tokens de Groq (Error 429)
    if (e.message.includes("429")) {
        return res.status(429).json({
            feedback: "Estoy recibiendo demasiadas peticiones. Espera un momento.",
            status: "in_progress"
        });
    }

    res.status(500).json({ 
      feedback: "Tuve un error interno al conectar con Groq. Intenta de nuevo.",
      status: "in_progress"
    });
  }
});

export default router;
