const mongoose = require("mongoose");
const { TIPOS_ANALISIS, MATRICES, UNIDADES_MEDIDA, METODOS_ANALISIS } = require("../data/analisisData");

// Función para limpiar el precio (remover comas y convertir a número)
const limpiarPrecio = (precio) => {
    if (!precio) return '';
    // Si es string, remover comas existentes
    const precioStr = precio.toString().replace(/,/g, '');
    // Convertir a número y luego a string nuevamente con el formato deseado
    const precioNum = parseInt(precioStr);
    if (isNaN(precioNum)) return '';
    return precioNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const analisisSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: function() {
            // Convertir el nombre a minúsculas, reemplazar espacios con guiones
            // y eliminar caracteres especiales
            return this.nombre
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
                .replace(/[^a-z0-9]+/g, '-')     // Reemplazar caracteres especiales con guiones
                .replace(/^-+|-+$/g, '');        // Eliminar guiones al inicio y final
        }
    },
    nombre: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    tipo: {
        type: String,
        required: true,
        enum: Object.values(TIPOS_ANALISIS),
        default: TIPOS_ANALISIS.FISICOQUIMICO,
        index: true
    },
    metodo: {
        type: String,
        required: true,
        enum: METODOS_ANALISIS
    },
    unidad: {
        type: String,
        required: true,
        enum: UNIDADES_MEDIDA
    },
    rango: {
        type: String,
        required: true
    },
    precio: {
        type: String,
        required: true,
        set: function(precio) {
            return limpiarPrecio(precio);
        }
    },
    matriz: {
        type: [{
            type: String,
            enum: Object.values(MATRICES)
        }],
        required: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0;
            },
            message: 'Debe especificar al menos una matriz'
        }
    },
    activo: {
        type: Boolean,
        default: true,
        index: true
    },
    version: {
        type: String,
        default: '1.0'
    }
}, {
    timestamps: true,
    versionKey: false,
    collection: 'analisis',
    _id: false, // Importante para permitir IDs personalizados
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Middleware pre-save para asegurar formato de precio
analisisSchema.pre('save', function(next) {
    if (this.precio) {
        this.precio = limpiarPrecio(this.precio);
    }
    next();
});

// Verificar si el modelo ya existe antes de crearlo
mongoose.deleteModel('Analisis'); // Eliminar el modelo si existe
const Analisis = mongoose.model("Analisis", analisisSchema, 'analisis'); // Forzar el nombre de la colección

module.exports = Analisis; 
