const Analisis = require("../../../shared/models/analisisModel");
const { handleError } = require("../../../shared/utils/errorHandler");
const { ResponseHandler } = require("../../../shared/utils/responseHandler");
const { 
    analisisDisponibles, 
    getAnalisisPorTipoAgua 
} = require("../../../shared/data/analisisData");
const mongoose = require("mongoose");

// Función para formatear precio con separadores de miles
const formatearPrecio = (precio) => {
    return precio.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Obtener lista simplificada de análisis (solo nombre y unidad)
const getAnalisisSimplificado = async (req, res) => {
    try {
        const { tipoAnalisis } = req.query;
        
        if (!tipoAnalisis || !analisisDisponibles[tipoAnalisis]) {
            return ResponseHandler.error(res, {
                statusCode: 400,
                message: 'El tipo de análisis es requerido (fisicoquimico o microbiologico)',
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // Solo devolver los análisis del tipo solicitado
        const analisisFiltrados = analisisDisponibles[tipoAnalisis].map(analisis => ({
            nombre: analisis.nombre,
            unidad: analisis.unidad || obtenerUnidadPorDefecto(analisis.nombre),
            precio: formatearPrecio(analisis.precio)
        }));
        
        return ResponseHandler.success(res, analisisFiltrados);
    } catch (error) {
        handleError(res, error);
    }
};

// Obtener detalles completos de un análisis específico
const getDetalleAnalisis = async (req, res) => {
    try {
        const { nombre, tipoAgua, subtipoResidual } = req.query;
        const analisisCompletos = getAnalisisPorTipoAgua(tipoAgua, subtipoResidual);
        
        // Buscar en ambos tipos de análisis
        const analisis = 
            analisisCompletos.fisicoquimico.find(a => a.nombre === nombre) ||
            analisisCompletos.microbiologico.find(a => a.nombre === nombre);
        
        if (!analisis) {
            return ResponseHandler.error(res, {
                statusCode: 404,
                message: 'Análisis no encontrado',
                errorCode: 'NOT_FOUND'
            });
        }
        
        // Formatear el precio antes de enviar la respuesta
        const analisisFormateado = {
            ...analisis,
            precio: formatearPrecio(analisis.precio)
        };
        
        return ResponseHandler.success(res, analisisFormateado);
    } catch (error) {
        handleError(res, error);
    }
};

// Función auxiliar para obtener la unidad por defecto según el nombre del análisis
const obtenerUnidadPorDefecto = (nombreAnalisis) => {
    // Mapeo de unidades por defecto según el nombre del análisis
    const unidadesPorDefecto = {
        "pH": "Und. pH",
        "Conductividad": "µS/cm",
        "Turbiedad": "UNT",
        "Color aparente": "UPC",
        "Alcalinidad": "mg/L CaCO3",
        "Dureza total": "mg/L CaCO3",
        "Dureza cálcica": "mg/L CaCO3",
        "Calcio": "mg/L Ca",
        "Magnesio": "mg/L Mg",
        "Cloro libre (residual)": "mg/L Cl2",
        "Cloruros": "mg/L Cl-",
        "Fluoruros": "mg/L F-",
        "Nitratos": "mg/L NO3",
        "Nitritos": "mg/L NO2",
        "Sulfatos": "mg/L SO4",
        "Fosfatos": "mg/L PO4",
        "Manganeso": "mg/L Mn",
        "Hierro": "mg/L Fe",
        "Mercurio total": "µg/L Hg",
        "Cadmio": "mg/L Cd",
        "Oxígeno Disuelto": "mg/L O2",
        "Demanda Bioquímica de Oxígeno (DBO5)": "mg/L O2",
        "Demanda Química de Oxígeno (DQO)": "mg/L",
        "Sólidos Sedimentables (SSED)": "mL/L",
        "Sólidos Suspendidos Totales (SST)": "mg/L",
        "Coliformes totales y E. coli (Cualitativa)": "Presencia/Ausencia",
        "Coliformes totales y E. coli (Cuantitativa)": "UFC/100mL",
        "Níquel": "mg/L"
    };
    
    return unidadesPorDefecto[nombreAnalisis] || "N/A";
};

// Función para limpiar el precio (remover comas y convertir a número)
const limpiarPrecio = (precio) => {
    if (typeof precio === 'string') {
        return parseInt(precio.replace(/,/g, ''), 10);
    }
    return precio;
};

// Crear un nuevo análisis
const crearAnalisis = async (req, res) => {
    try {
        // Limpiar el precio antes de crear el análisis
        const datosAnalisis = {
            ...req.body,
            precio: limpiarPrecio(req.body.precio)
        };
        
        // Verificar si ya existe un análisis con el mismo nombre
        const analisisExistente = await Analisis.findOne({ nombre: datosAnalisis.nombre });
        if (analisisExistente) {
            return ResponseHandler.error(res, {
                statusCode: 409,
                message: `Ya existe un análisis con el nombre "${datosAnalisis.nombre}"`,
                errorCode: "DUPLICATE_ENTRY"
            });
        }
        
        const nuevoAnalisis = new Analisis(datosAnalisis);
        const analisisGuardado = await nuevoAnalisis.save();
        
        // Formatear el precio para la respuesta
        const respuesta = {
            ...analisisGuardado.toObject(),
            precio: formatearPrecio(analisisGuardado.precio)
        };
        
        return ResponseHandler.created(res, respuesta, "Análisis creado exitosamente");
    } catch (error) {
        // Manejar específicamente el error de duplicado si la verificación previa falla
        if (error.code === 11000) {
            return ResponseHandler.error(res, {
                statusCode: 409,
                message: `Ya existe un análisis con el nombre "${req.body.nombre}"`,
                errorCode: "DUPLICATE_ENTRY"
            });
        }
        handleError(res, error);
    }
};

// Obtener todos los análisis
const obtenerAnalisis = async (req, res) => {
    try {
        const analisis = await Analisis.find();
        return ResponseHandler.success(res, analisis, "Análisis obtenidos exitosamente");
    } catch (error) {
        handleError(res, error);
    }
};

// Obtener un análisis por ID
const obtenerAnalisisPorId = async (req, res) => {
    try {
        const analisis = await Analisis.findById(req.params.id);
        if (!analisis) {
            return ResponseHandler.error(res, {
                statusCode: 404,
                message: "Análisis no encontrado",
                errorCode: "NOT_FOUND"
            });
        }
        return ResponseHandler.success(res, analisis, "Análisis obtenido exitosamente");
    } catch (error) {
        handleError(res, error);
    }
};

// Actualizar un análisis
const actualizarAnalisis = async (req, res) => {
    try {
        // Limpiar el precio si está presente en la actualización
        const datosActualizacion = {
            ...req.body,
            precio: req.body.precio ? limpiarPrecio(req.body.precio) : undefined
        };
        
        const analisis = await Analisis.findByIdAndUpdate(
            req.params.id,
            datosActualizacion,
            { new: true, runValidators: true }
        );
        
        if (!analisis) {
            return ResponseHandler.error(res, {
                statusCode: 404,
                message: "Análisis no encontrado",
                errorCode: "NOT_FOUND"
            });
        }
        
        // Formatear el precio para la respuesta
        const respuesta = {
            ...analisis.toObject(),
            precio: formatearPrecio(analisis.precio)
        };
        
        return ResponseHandler.success(res, respuesta, "Análisis actualizado exitosamente");
    } catch (error) {
        handleError(res, error);
    }
};

// Cambiar estado de un análisis (activar/desactivar)
const cambiarEstadoAnalisis = async (req, res) => {
    try {
        const { id } = req.params;
        const { activo } = req.body;

        // Validar que se proporcione el estado
        if (typeof activo !== 'boolean') {
            return ResponseHandler.error(res, {
                statusCode: 400,
                message: "Debe especificar el estado 'activo' como true o false",
                errorCode: "VALIDATION_ERROR"
            });
        }

        const analisis = await Analisis.findByIdAndUpdate(
            id,
            { activo },
            { new: true }
        );

        if (!analisis) {
            return ResponseHandler.error(res, {
                statusCode: 404,
                message: "Análisis no encontrado",
                errorCode: "NOT_FOUND"
            });
        }

        const mensaje = activo ? "Análisis activado correctamente" : "Análisis desactivado correctamente";
        return ResponseHandler.success(res, analisis, mensaje);
    } catch (error) {
        handleError(res, error);
    }
};

// Obtener análisis por tipo (fisicoquimico o microbiologico)
const obtenerAnalisisPorTipo = async (req, res) => {
    try {
        const { tipo } = req.params;
        console.log('Tipo solicitado original:', tipo);

        // Normalizar el tipo (quitar tildes, convertir a minúsculas)
        const tipoNormalizado = tipo.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/s$/, ''); // Remover 's' final si existe

        console.log('Tipo normalizado:', tipoNormalizado);

        // Validar el tipo de análisis normalizado
        if (!['fisicoquimico', 'microbiologico'].includes(tipoNormalizado)) {
            return ResponseHandler.error(res, {
                statusCode: 400,
                message: 'Tipo de análisis inválido. Debe ser "fisicoquimico" o "microbiologico"',
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // Primero, buscar todos los documentos para debug
        const todosLosAnalisis = await Analisis.find({}).lean();
        console.log('Total de análisis en la BD:', todosLosAnalisis.length);
        console.log('Tipos únicos encontrados:', [...new Set(todosLosAnalisis.map(a => a.tipo))]);
        
        // Construir el query con regex para hacer la búsqueda más flexible
        const query = {
            tipo: {
                $regex: new RegExp(`^${tipoNormalizado}`, 'i') // Coincidencia insensible a mayúsculas/minúsculas
            }
        };

        console.log('Query a ejecutar:', JSON.stringify(query));

        // Obtener los análisis del tipo especificado
        const analisis = await Analisis.find(query).lean();
        console.log('Análisis encontrados:', analisis.length);

        if (!analisis || analisis.length === 0) {
            return ResponseHandler.success(res, [], `No se encontraron análisis de tipo ${tipo}`);
        }

        // Formatear los precios en la respuesta
        const analisisFormateados = analisis.map(item => ({
            ...item,
            precio: item.precio ? item.precio.toString() : '0'
        }));

        return ResponseHandler.success(res, analisisFormateados, `Análisis ${tipo} obtenidos exitosamente`);
    } catch (error) {
        console.error('Error en obtenerAnalisisPorTipo:', error);
        handleError(res, error);
    }
};

module.exports = {
    getAnalisisSimplificado,
    getDetalleAnalisis,
    crearAnalisis,
    obtenerAnalisis,
    obtenerAnalisisPorId,
    actualizarAnalisis,
    cambiarEstadoAnalisis,
    obtenerAnalisisPorTipo
}; 