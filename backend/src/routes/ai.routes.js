import express from "express";
import { callGemini } from "../services/gemini.service.js";
import { parseGeminiJSON } from "../utils/jsonParser.js";

const router = express.Router();

router.post("/intent", async (req, res) => {
  const { intent, dom } = req.body;
  console.log(dom)

  try {
    const raw = await callGemini(intent, dom);
    const parsed = parseGeminiJSON(raw);
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI error" });
  }
});

export default router;
