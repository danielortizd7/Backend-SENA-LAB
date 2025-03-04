const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config(); 

let connectionAttempts = 0;

const connectDB = async () => {
  try {
    connectionAttempts++;
    console.log(`Intento de conexión #${connectionAttempts}`);

    // Si ya está conectado, no intenta de nuevo
    if (mongoose.connection.readyState === 1) {
      console.log("Ya conectado a MongoDB");
      return;
    }

    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB conectado con éxito");
  } catch (error) {
    console.error("Error de conexión:", error.message);
    process.exit(1); //Cerrar la aplicación si no se puede conectar
  }
};

module.exports = connectDB;
