import express from "express";
import cors from "cors";
import aiRoutes from "./routes/ai.routes.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || origin === `chrome-extension://${process.env.EXTENSION_ID}`) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors());

app.use(express.json({ limit: "5mb" }));

// Ruta para mantener el servidor despierto
app.get("/ping", (req, res) => {
  res.status(200).send("Servidor despierto y listo");
});

app.use("/ai", aiRoutes);

app.listen(PORT, () => {
  console.log(`Backend AI escuchando en http://localhost:${PORT}`);
});
