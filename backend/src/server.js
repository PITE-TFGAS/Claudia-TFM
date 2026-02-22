import express from "express";
import cors from "cors";
import aiRoutes from "./routes/ai.routes.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/ai", aiRoutes);

app.listen(PORT, () => {
  console.log(`Backend AI escuchando en http://localhost:${PORT}`);
});
