import mongoose from "mongoose";

const AuditoriaSchema = new mongoose.Schema({
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    accion: { type: String, required: true }, // Ejemplo: "Actualización", "Eliminación"
    tabla: { type: String, required: true },
    cambios: { type: Object, required: true }, // Guarda los cambios realizados
    fecha: { type: Date, default: Date.now }
});

export default mongoose.model("Auditoria", AuditoriaSchema);
