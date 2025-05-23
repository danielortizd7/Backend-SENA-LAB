const mongoose = require("mongoose");

// Constantes para validación
const TIPOS_ANALISIS = {
    FISICOQUIMICO: "fisicoquimico",
    MICROBIOLOGICO: "microbiologico"
};

const MATRICES = {
    AP: "AP",   // Agua Potable
    AS: "AS",   // Agua Superficial
    ARnD: "ARnD", // Agua Residual no Doméstica
    ARD: "ARD"  // Agua Residual Doméstica
};

// Enums para validación
const NOMBRES_FISICOQUIMICOS = [
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
    "Oxígeno Disuelto",
    "Demanda Bioquímica de Oxígeno (DBO5)",
    "Demanda Química de Oxígeno (DQO)",
    "Sólidos Sedimentables (SSED)",
    "Sólidos Suspendidos Totales (SST)"
];

const NOMBRES_MICROBIOLOGICOS = [
    "Coliformes totales - E.coli (Cualitativo)",
    "Coliformes totales - E.coli (Cuantitativo)"
];

const UNIDADES_MEDIDA = [
    "Und. pH",
    "µS/cm",
    "UNT",
    "UPC",
    "mg/L CaCO3",
    "mg/L Ca",
    "mg/L Mg",
    "mg/L Cl2",
    "mg/L Cl-",
    "mg/L F",
    "mg/L NO3",
    "mg/L NO2",
    "mg/L SO4",
    "mg/L PO4",
    "mg/L Mn",
    "mg/L Fe",
    "µg/L Hg",
    "mg/L O2",
    "mL/L",
    "mg/L",
    "UFC/100mL",
    "Ausencia/Presencia"
];

// Lista predefinida de análisis según la tabla
const analisisDisponibles = {
    fisicoquimico: [
        {
            nombre: "pH",
            metodo: "SM 4500 H+ B",
            unidad: "Und. pH",
            rango: "4.0 - 10.0",
            precio: "6,200",
            matriz: ["AP", "AS", "ARnD", "ARD"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Conductividad",
            metodo: "SM2510 B",
            unidad: "µS/cm",
            rango: "10 - 10000",
            precio: "6,800",
            matriz: ["AP", "AS", "ARnD", "ARD"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Turbiedad",
            metodo: "SM2130 B",
            unidad: "UNT",
            rango: "1.0 - 4000",
            precio: "5,900",
            matriz: ["AP"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Color aparente",
            metodo: "SM2120 C",
            unidad: "UPC",
            rango: "10.0 - 40.0",
            precio: "8,000",
            matriz: ["AP"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Alcalinidad total",
            metodo: "SM2320 B",
            unidad: "mg/L CaCO3",
            rango: "20 - 500",
            precio: "9,900",
            matriz: ["AP", "AS", "ARnD", "ARD"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Dureza total",
            metodo: "SM2340 C",
            unidad: "mg/L CaCO3",
            rango: "20 - 500",
            precio: "12,200",
            matriz: ["AP"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Dureza cálcica",
            metodo: "SM3500CaB",
            unidad: "mg/L CaCO3",
            rango: "5 - 500",
            precio: "11,900",
            matriz: ["AP"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Calcio",
            metodo: "SM 3500CaB",
            unidad: "mg/L Ca",
            rango: "1 - 200",
            precio: "12,900",
            matriz: ["AP"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Magnesio",
            metodo: "SM 3500-MgB",
            unidad: "mg/L Mg",
            rango: "10-500",
            precio: "12,900",
            matriz: ["AP"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Cloro libre (residual)",
            metodo: "SM4500 Cl G",
            unidad: "mg/L Cl2",
            rango: "0.5 - 2.5",
            precio: "12,200",
            matriz: ["AP"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Cloruros",
            metodo: "SM 4500-Cl- B",
            unidad: "mg/L Cl-",
            rango: "10-500",
            precio: "13,500",
            matriz: ["AP", "AS", "ARnD", "ARD"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Fluoruros",
            metodo: "8029 HACH",
            unidad: "mg/L F",
            rango: "0.02 - 2.00",
            precio: "16,900",
            matriz: ["AP", "AS"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Nitratos",
            metodo: "SM 4500 NO3 B",
            unidad: "mg/L NO3",
            rango: "0.5 - 15",
            precio: "26,100",
            matriz: ["AP", "AS"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Nitritos",
            metodo: "SM 4500 NO2 B",
            unidad: "mg/L NO2",
            rango: "0.03 - 0.5",
            precio: "20,800",
            matriz: ["AP", "AS"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Sulfatos",
            metodo: "SM 4500 SO4 E",
            unidad: "mg/L SO4",
            rango: "3.0 - 40.0",
            precio: "18,900",
            matriz: ["AP", "AS"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Fosfatos",
            metodo: "SM4500 P E",
            unidad: "mg/L PO4",
            rango: "0.1 - 2.0",
            precio: "21,100",
            matriz: ["AP"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Manganeso",
            metodo: "SM3111B Abs. Atómica",
            unidad: "mg/L Mn",
            rango: "0.1 - 2",
            precio: "39,900",
            matriz: ["AP", "AS", "ARnD", "ARD"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Hierro",
            metodo: "8008 HACH",
            unidad: "mg/L Fe",
            rango: "0.02-3.00",
            precio: "23,900",
            matriz: ["AP"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Mercurio total",
            metodo: "SM3112B Modificado Abs. Atómica",
            unidad: "µg/L Hg",
            rango: "0.8 - 30",
            precio: "39,900",
            matriz: ["AP", "AS", "ARnD", "ARD"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Oxígeno Disuelto",
            metodo: "10360 HACH",
            unidad: "mg/L",
            rango: "0.1 - 20",
            precio: "7,500",
            matriz: ["AS", "ARnD", "ARD"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Demanda Bioquímica de Oxígeno (DBO5)",
            metodo: "10360 HACH",
            unidad: "mg/L O2",
            rango: "6.0 - 2032",
            precio: "54,300",
            matriz: ["AS", "ARnD", "ARD"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Demanda Química de Oxígeno (DQO)",
            metodo: "8000 HACH",
            unidad: "mg/L O2",
            rango: "3 - 15000",
            precio: "48,500",
            matriz: ["AS", "ARnD", "ARD"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Sólidos Sedimentables (SSED)",
            metodo: "8165 HACH",
            unidad: "mL/L",
            rango: "0.1 - 1000",
            precio: "5,900",
            matriz: ["AS", "ARnD", "ARD"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        },
        {
            nombre: "Sólidos Suspendidos Totales (SST)",
            metodo: "SM2450 D",
            unidad: "mg/L",
            rango: "0.1 - 1000",
            precio: "21,900",
            matriz: ["AS", "ARnD", "ARD"],
            tipo: TIPOS_ANALISIS.FISICOQUIMICO,
            activo: true
        }
    ],
    microbiologico: [
        {
            nombre: "Coliformes totales - E.coli (Cuantitativo)",
            metodo: "1029 HACH",
            unidad: "UFC/100mL",
            rango: "UFC/100ml",
            precio: "49,700",
            matriz: ["AP", "AS", "ARnD", "ARD"],
            tipo: TIPOS_ANALISIS.MICROBIOLOGICO,
            activo: true
        },
        {
            nombre: "Coliformes totales - E.coli (Cualitativo)",
            metodo: "Readycult Merk",
            unidad: "Ausencia/Presencia",
            rango: "Ausencia/Presencia",
            precio: "22,000",
            matriz: ["AP"],
            tipo: TIPOS_ANALISIS.MICROBIOLOGICO,
            activo: true
        }
    ]
};

// Mapeo de matrices
const matrizMap = {
    "AP": "Agua Potable",
    "AS": "Agua Superficial",
    "ARnD": "Agua Residual no Doméstica",
    "ARD": "Agua Residual Doméstica"
};

// Función para obtener análisis disponibles por tipo de agua
const getAnalisisPorTipoAgua = (tipoAgua, subtipoResidual = null) => {
    let matrizBuscar;
    switch(tipoAgua) {
        case 'potable':
            matrizBuscar = MATRICES.AP;
            break;
        case 'natural':
            matrizBuscar = MATRICES.AS;
            break;
        case 'residual':
            matrizBuscar = subtipoResidual === 'domestica' ? MATRICES.ARD : MATRICES.ARnD;
            break;
        case 'otra':
            return {
                fisicoquimico: analisisDisponibles.fisicoquimico,
                microbiologico: analisisDisponibles.microbiologico
            };
        default:
            return {
                fisicoquimico: [],
                microbiologico: []
            };
    }

    return {
        fisicoquimico: analisisDisponibles.fisicoquimico.filter(a => a.matriz.includes(matrizBuscar) && a.activo),
        microbiologico: analisisDisponibles.microbiologico.filter(a => a.matriz.includes(matrizBuscar) && a.activo)
    };
};

module.exports = {
    TIPOS_ANALISIS,
    MATRICES,
    UNIDADES_MEDIDA,
    NOMBRES_FISICOQUIMICOS,
    NOMBRES_MICROBIOLOGICOS,
    analisisDisponibles,
    matrizMap,
    getAnalisisPorTipoAgua
}; 