import mongoose from "mongoose";

const opcionesAnalisis = [
    "Aluminio", "Arsénico", "Bromo", "Cadmio", "Carbono Orgánico Total", 
    "Cloro Residual", "Cloro Total", "Cloruros", "Cobalto", "Cobre", 
    "Color Aparente", "Color Real", "Conductividad", "Cromo", 
    "Demanda Química De Oxígeno", "Dureza Cálcica", "Dureza Magnésica", "Dureza Total",
    "pH","Ortofosfatos", "Fósforo Total","Hierro","Magnesio","Manganeso","Mercurio","Molibdeno",
    "Níquel","Nitratos", "Nitritos", "Nitrógeno Amoniacal","Nitrógeno Total","Oxígeno Disuelto",
    "Plata","Plomo","Potasio", "Sólidos Sedimentables","Sólidos Suspendidos", "Sólidos Totales",
    "Sulfatos", "Turbiedad","Yodo","Zinc", "OTRO"
];

const opcionesMuestreo = ["simple", "compuesto", "residual", "OTRO"];
const opcionesTipoMuestra = ["agua", "suelo"];

const MuestraSchema = new mongoose.Schema({
    id_muestra: { type: String, unique: true },
    fechaHora: { type: Date, required: true },
    planMuestreo: { type: String, required: true},
    lugarMuestreo: { type: String, required: true},
    condicionesAmbientales: {
        type: {
            temperatura: {type: Number, required: true},
            humedad: {type: Number, required: true}
            
        },
        required: true
    },
    preservacionMuestra: {type: String, required: true},
    tipoMuestra: { 
        type: String,
        required: true,
        enum: opcionesTipoMuestra, // Solo permite "agua" o "suelo"
        message: "El tipo de muestra debe ser 'agua' o 'suelo'."
    },
    tipoMuestreo: {
        type: [String],
        required: true,
        validate: {
            validator: function(val) {
                return val.every(v => {
                    if (typeof v !== 'string') return false; 
                    return opcionesMuestreo.includes(v) || v.startsWith("OTRO:");
                });
            },
            message: "El tipo de muestreo no es válido."
        }
    },
    analisisSeleccionados: {
        type: [String], 
        required: true,
        validate: {
            validator: function(val) {
                return Array.isArray(val) && val.every(a => opcionesAnalisis.includes(a) || a.startsWith("OTRO:"));
            },
            message: "Uno o más valores de análisis no son válidos."
        }
    }
});

// Genera un ID único automáticamente antes de guardar
MuestraSchema.pre('save', async function(next) {
    try {
        if (!this.id_muestra) {
            let nuevoId;
            let existe;
            let contador = 1;

            do {
                nuevoId = `MUESTRA-H${String(contador).padStart(2, '0')}`;
                existe = await mongoose.model('Muestra').findOne({ id_muestra: nuevoId });
                contador++;
            } while (existe);

            this.id_muestra = nuevoId;
        }
        next();
    } catch (error) {
        next(error);
    }
});

export default mongoose.model("Muestra", MuestraSchema);