import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Conectado a MongoDB Atlas");
    } catch (err) {
        console.error(" Error al conectar a MongoDB:", err);
        process.exit(1); // Detiene la ejecución si hay un error
    }
};

export default connectDB;


