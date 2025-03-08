require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js");


connectDB();

const app = express();

app.use(cors());
app.use(express.json());

const tipoAguaRoutes = require("./app/routes/tipoAguaRoutes.js");
const resultadoRoutes = require("./app/routes/resultadoRoutes.js");
const cambiosEstadoRoutes = require("./app/routes/cambioEstadoRoutes.js");
const firmaRoutes = require("./app/routes/firmaRoutes.js");



app.use("/api/tipos-agua", tipoAguaRoutes);
app.use("/api/ingreso-resultados", resultadoRoutes);
app.use("/api/cambio-estado", cambiosEstadoRoutes);
app.use("/pdfs", express.static("pdfs"));
app.use("/api/firmas", firmaRoutes);

 
app.get("/", (req, res) => {
  res.send("API funcionando correctamente con todos los módulos");
});

app.use((err, req, res, next) => {
  console.error("ERROR DETECTADO:", err.stack);
  res.status(500).json({ mensaje: "Algo salió mal en el servidor", error: err.message });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
