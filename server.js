import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

const app = express();

// Conectar a MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Importar rutas
import muestrasRoutes from "./routes/muestras.js";

app.use("/muestras", muestrasRoutes);

// Middleware para manejar errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ mensaje: "Algo salió mal en el servidor", error: err.message });
});

// Ruta de prueba
app.get("/", (req, res) => {
    res.send("API funcionando correctamente");
});

// Inicializar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
