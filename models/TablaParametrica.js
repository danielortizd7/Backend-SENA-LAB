import mongoose from "mongoose";

const TablaParametricaSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    descripcion: { type: String },
    valores: [{ type: String }],  // Array de valores permitidos
    actualizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    actualizadoEn: { type: Date, default: Date.now }
});

export default mongoose.model("TablaParametrica", TablaParametricaSchema);
