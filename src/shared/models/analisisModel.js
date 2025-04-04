const mongoose = require("mongoose");

// Esquema para Análisis Físico-Químicos
const analisisFisicoQuimicoSchema = new mongoose.Schema({
    rango: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        required: true,
        enum: [
            "pH",
            "Conductividad",
            "Turbiedad",
            "Color aparente",
            "Alcalinidad total",
            "Dureza total",
            "Dureza cálcica",
            "Calcio",
            "Magnesio",
            "Cloro libre (residual)",
            "Cloruros",
            "Fluoruros",
            "Nitratos",
            "Nitritos",
            "Sulfatos",
            "Fosfatos",
            "Manganeso",
            "Hierro",
            "Mercurio total",
            "Análisis de metales en agua",
            "Oxígeno Disuelto",
            "Demanda Bioquímica de Oxígeno (DB05)",
            "Demanda Química de Oxígeno (DQO)",
            "Sólidos Sedimentables (SSED)",
            "Sólidos Suspendidos Totales (SST)"
        ]
    },
    unidad: {
        type: String,
        required: true,
        enum: [
            "Und. pH",
            "uS/cm",
            "UNT",
            "UPC",
            "mg/L CaCO3",
            "mg/L CaCO3",
            "mg/L CaCO3",
            "mg/L Ca",
            "mg/L Mg",
            "mg/L CI2",
            "mg/L CI",
            "mg/L F",
            "mg/L NO3",
            "mg/L NO2",
            "mg/L SO4",
            "mg/L PO4",
            "mg/L Mn",
            "mg/L Fe",
            "ug/L Hg",
            "mg/L",
            "mg/L O2",
            "mL/L Ssed",
            "mg/L SST"
        ]
    }
}, { _id: false });

// Esquema para Análisis Microbiológicos
const analisisMicrobiologicoSchema = new mongoose.Schema({
    rango: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        required: true,
        enum: [
            "Coliformes Totales Cuantitativo",
            "Coliformes Totales Cualitativo"
        ]
    },
    unidad: {
        type: String,
        required: true,
        enum: [
            "UFC/100ml",
            "Ausencia/Presencia"
        ]
    }
}, { _id: false });

// Esquema principal para Tipos de Análisis
const tipoAnalisisSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        enum: ["FisicoQuimico", "Microbiologico"],
        unique: true
    },
    descripcion: {
        type: String,
        required: true
    },
    analisis: {
        type: [mongoose.Schema.Types.Mixed],
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Crear los modelos
const TipoAnalisis = mongoose.models.TipoAnalisis || mongoose.model("TipoAnalisis", tipoAnalisisSchema, "tipos_analisis");

module.exports = {
    TipoAnalisis,
    analisisFisicoQuimicoSchema,
    analisisMicrobiologicoSchema
};
