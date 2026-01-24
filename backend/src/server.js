import express from "express";
import cors from "cors";
import aiRoutes from "./routes/ai.routes.js";
import dotenv from "dotenv";

dotenv.config(); // <--- esto carga las variables de .env

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/ai", aiRoutes);

app.listen(3000, () => {
  console.log("Backend AI escuchando en http://localhost:3000");
  console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "OK" : "MISSING");
});
