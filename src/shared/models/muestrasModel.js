const mongoose = require("mongoose");

const estadosValidos = ["Recibida", "En análisis", "Pendiente de resultados", "Finalizada", "Rechazada"];

// Esquema de Firmas
const firmasSchema = new mongoose.Schema({
    cedulaAdministrador: {
        type: String,
        required: false
    },
    firmaAdministrador: {
        type: String,
        required: false
    },
    cedulaCliente: {
        type: String,
        required: false
    },
    firmaCliente: {
        type: String,
        required: false
    },
    fechaFirmaAdministrador: {
        type: Date
    },
    fechaFirmaCliente: {
        type: Date
    }
});

// Esquema de Tipos de Agua
const tipoAguaSchema = new mongoose.Schema({
    tipo: {
        type: String,
        required: true,
        unique: true
    },
    descripcion: {
        type: String,
        required: true
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Esquema de Muestras
const muestraSchema = new mongoose.Schema(
  {
    id_muestra: {
      type: String,
      unique: true,
      sparse: true
    },
    documento: { 
      type: String, 
      required: true,
      immutable: true
    },
    tipoDeAgua: {
      type: String,
      enum: ['Residual Domestica','Residual No Domestica','Potable', 'Natural','Otra'],
      required: true
    },
    tipoAnalisis: {
      type: String,
      enum: ['FisicoQuimico', 'Microbiologico', 'Otro'],
      required: true
    },
    analisisSeleccionados: {
      type: [{
        nombre: {
          type: String,
          required: true
        },
        rango: {
          type: String,
          required: false,
          validate: {
            validator: function(value) {
              if (!value) return true;
              if (this.tipoAnalisis === 'FisicoQuimico') {
                return /^[\d,\.]+\s*-\s*[\d,\.]+$/.test(value);
              } else if (this.tipoAnalisis === 'Microbiologico') {
                return /^(UFC\/\d+ml|Ausencia\/Presencia)$/.test(value);
              }
              return true;
            },
            message: function(props) {
              if (this.tipoAnalisis === 'FisicoQuimico') {
                return `Formato de rango inválido para ${props.path.split('.')[1]}. Use "X,X - Y,Y"`;
              } else {
                return `Formato de rango inválido para ${props.path.split('.')[1]}. Use "UFC/Xml" o "Ausencia/Presencia"`;
              }
            }
          }
        },
        unidad: {
          type: String,
          required: false
        }
      }],
      required: true,
      validate: {
        validator: function(arr) {
          return arr.length > 0;
        },
        message: 'Debe seleccionar al menos un análisis'
      }
    },
    tipoMuestreo: { 
      type: String,
      enum: ['Simple', 'Compuesto'],
      required: true 
    },
    fechaMuestreo: {
      type: Date,
      required: true
    },
    fechaHora: { 
      type: Date, 
      required: true,
      default: Date.now,
      immutable: true
    },
    lugarMuestreo: {
      type: String,
      required: false // Cambiado a false para que no sea obligatorio
    },
    planMuestreo: {
      type: String,
      default: ''
    },
    condicionesAmbientales: {
      type: String,
      default: ''
    },
    preservacionMuestra: {
      type: String,
      enum: ['Refrigeración', 'Congelación', 'Acidificación', 'Otra', 'Ninguna'], // Agregada la opción "Ninguna"
      required: true
    },
    identificacionMuestra: {
      type: String,
      default: ''
    },
    aceptada: {
      type: Boolean,
      required: true
    },
    observacionRechazo: {
      type: String,
      default: ''
    },
    estado: {
      type: String,
      enum: estadosValidos,
      default: 'Recibida'
    },
    historial: [{
      estado: {
        type: String,
        enum: estadosValidos,
        required: true
      },
      cedulaadministrador: {
        type: String,
        required: true
      },
      nombreadministrador: {
        type: String,
        required: true
      },
      fechaCambio: {
        type: Date,
        default: Date.now
      },
      observaciones: String
    }],
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    actualizadoPor: [{
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
      },
      nombre: String,
      fecha: {
        type: Date,
        default: Date.now
      },
      accion: String
    }],
    firmas: {
      type: firmasSchema,
      required: false // Inicialmente no es requerido, se puede agregar después
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Middleware para generar el id_muestra antes de guardar
muestraSchema.pre('save', async function(next) {
  if (!this.id_muestra) {
      try {
          // Buscar la última muestra ordenada por id_muestra de forma descendente
          const ultimaMuestra = await mongoose.model('Muestra')
              .findOne({})
              .sort({ id_muestra: -1 })
              .exec();

          let nuevoNumero = 111; // Número inicial si no hay muestras

          if (ultimaMuestra && ultimaMuestra.id_muestra) {
              // Extraer el número del último ID y sumar 1
              const match = ultimaMuestra.id_muestra.match(/H(\d+)/);
              if (match) {
                  const ultimoNumero = parseInt(match[1]);
                  nuevoNumero = Math.max(ultimoNumero + 1, 111);
              }
          }

          // Verificar que el nuevo ID no exista
          let idExists = true;
          while (idExists) {
              const existingMuestra = await mongoose.model('Muestra')
                  .findOne({ id_muestra: `MUESTRA-H${nuevoNumero}` })
                  .exec();
              
              if (!existingMuestra) {
                  idExists = false;
              } else {
                  nuevoNumero++;
              }
          }

          this.id_muestra = `MUESTRA-H${nuevoNumero}`;
      } catch (error) {
          return next(error);
      }
  }
  next();
});

// Crear los modelos
const Muestra = mongoose.models.Muestra || mongoose.model("Muestra", muestraSchema, "muestras");
const TipoAgua = mongoose.models.TipoAgua || mongoose.model('TipoAgua', tipoAguaSchema, 'tipos_agua');

module.exports = {
    Muestra,
    TipoAgua,
    estadosValidos
};
