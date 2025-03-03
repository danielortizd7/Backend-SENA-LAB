const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI); // ❌ SIN opciones
        console.log("🔌 URI:", process.env.MONGO_URI);
        console.log("✅ Conectado a MongoDB Atlas");
    } catch (err) {
        console.error("❌ Error al conectar a MongoDB:", err);
        process.exit(1);
    }
};

module.exports = connectDB;
