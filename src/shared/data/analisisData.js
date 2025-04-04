const { TipoAnalisis } = require('../models/analisisModel');

const analisisFisicoQuimicos = [
    { nombre: "pH", rango: "4,0 - 10,0", unidad: "Und. pH" },
    { nombre: "Conductividad", rango: "10 - 10000", unidad: "uS/cm" },
    { nombre: "Turbiedad", rango: "1,0 - 40000", unidad: "UNT" },
    { nombre: "Color aparente", rango: "10,0 - 40,0", unidad: "UPC" },
    { nombre: "Alcalinidad total", rango: "20 - 500", unidad: "mg/L CaCO3" },
    { nombre: "Dureza total", rango: "20 - 500", unidad: "mg/L CaCO3" },
    { nombre: "Dureza cálcica", rango: "5 - 500", unidad: "mg/L CaCO3" },
    { nombre: "Calcio", rango: "1 - 200", unidad: "mg/L Ca" },
    { nombre: "Magnesio", rango: "10 - 500", unidad: "mg/L Mg" },
    { nombre: "Cloro libre (residual)", rango: "0,3 - 2,5", unidad: "mg/L CI2" },
    { nombre: "Cloruros", rango: "10 - 500", unidad: "mg/L CI" },
    { nombre: "Fluoruros", rango: "0,02 - 2,00", unidad: "mg/L F" },
    { nombre: "Nitratos", rango: "0,5 - 15", unidad: "mg/L NO3" },
    { nombre: "Nitritos", rango: "0,03 - 0,5", unidad: "mg/L NO2" },
    { nombre: "Sulfatos", rango: "3,0 - 40,0", unidad: "mg/L SO4" },
    { nombre: "Fosfatos", rango: "0,1 - 2,0", unidad: "mg/L PO4" },
    { nombre: "Manganeso", rango: "0,1 - 2", unidad: "mg/L Mn" },
    { nombre: "Hierro", rango: "0,02 - 3,00", unidad: "mg/L Fe" },
    { nombre: "Mercurio total", rango: "0,8 - 30", unidad: "ug/L Hg" },
    { nombre: "Análisis de metales en agua", rango: "0,0008 - 30", unidad: "mg/L" },
    { nombre: "Oxígeno Disuelto", rango: "0,1 - 20", unidad: "mg/L O2" },
    { nombre: "Demanda Bioquímica de Oxígeno (DB05)", rango: "6,0 - 2032", unidad: "mg/L O2" },
    { nombre: "Demanda Química de Oxígeno (DQO)", rango: "3 - 15000", unidad: "mg/L O2" },
    { nombre: "Sólidos Sedimentables (SSED)", rango: "0,1 - 1000", unidad: "mL/L Ssed" },
    { nombre: "Sólidos Suspendidos Totales (SST)", rango: "20 - 2000", unidad: "mg/L SST" }
];

const analisisMicrobiologicos = [
    { nombre: "Coliformes Totales Cuantitativo", rango: "UFC/100ml", unidad: "UFC" },
    { nombre: "Coliformes Totales Cualitativo", rango: "Ausencia/Presencia", unidad: "Ausencia/Presencia" }
];

const tiposAnalisisPredeterminados = [
    {
        nombre: "FisicoQuimico",
        descripcion: "Análisis físico-químico del agua",
        analisis: analisisFisicoQuimicos
    },
    {
        nombre: "Microbiologico",
        descripcion: "Análisis microbiológico del agua",
        analisis: analisisMicrobiologicos
    }
];

async function inicializarAnalisis() {
    try {
        const count = await TipoAnalisis.countDocuments();
        if (count === 0) {
            await TipoAnalisis.insertMany(tiposAnalisisPredeterminados);
            console.log('Datos iniciales de análisis creados exitosamente');
        }
    } catch (error) {
        console.error('Error al inicializar los tipos de análisis:', error);
    }
}

module.exports = {
    inicializarAnalisis,
    tiposAnalisisPredeterminados
};
