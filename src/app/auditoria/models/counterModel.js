const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    seq: {
        type: Number,
        default: 0
    },
    mes: {
        type: Number,
        required: true
    },
    anio: {
        type: Number,
        required: true
    }
});

// Ensure unique combination of sequence, month and year
counterSchema.index({ seq: 1, mes: 1, anio: 1 }, { unique: true });

// Initialize counter if it doesn't exist
counterSchema.statics.initializeCounter = async function(id) {
    const now = new Date();
    const mesActual = now.getMonth() + 1;
    const anioActual = now.getFullYear();
    
    try {
        // Try to create a new counter only if it doesn't exist
        await this.findOneAndUpdate(
            { _id: id },
            {
                $setOnInsert: {
                    seq: 0,
                    mes: mesActual,
                    anio: anioActual
                }
            },
            {
                upsert: true,
                new: true
            }
        );
        
        console.log('Contador inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar contador:', error);
        if (error.code !== 11000) {
            throw error;
        }
    }
};

// Method to get next sequence with retry logic
counterSchema.statics.getNextSequence = async function(id, maxRetries = 5) {
    const now = new Date();
    const mesActual = now.getMonth() + 1;
    const anioActual = now.getFullYear();

    try {
        // Ensure counter exists
        await this.initializeCounter(id).catch(error => {
            if (error.code !== 11000) {
                throw error;
            }
        });

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const result = await this.findOneAndUpdate(
                    { 
                        _id: id,
                        mes: mesActual,
                        anio: anioActual
                    },
                    { 
                        $inc: { seq: 1 },
                        $setOnInsert: {
                            mes: mesActual,
                            anio: anioActual
                        }
                    },
                    { 
                        new: true,
                        upsert: true,
                        setDefaultsOnInsert: true
                    }
                );

                // If month/year changed, reset sequence
                if (result.mes !== mesActual || result.anio !== anioActual) {
                    try {
                        const resetResult = await this.findOneAndUpdate(
                            { 
                                _id: id,
                                mes: { $ne: mesActual },
                                anio: { $ne: anioActual }
                            },
                            {
                                seq: 1,
                                mes: mesActual,
                                anio: anioActual
                            },
                            { 
                                new: true,
                                runValidators: true 
                            }
                        );
                        return resetResult ? resetResult.seq : 1;
                    } catch (resetError) {
                        console.error('Error resetting counter:', resetError);
                        throw resetError;
                    }
                }

                return result.seq;
            } catch (error) {
                console.error(`Intento ${attempt + 1} fallido al generar secuencia:`, error.message);
                
                if ((error.code === 11000 || error.name === 'MongoServerError') && attempt < maxRetries - 1) {
                    const delay = Math.min(100 * Math.pow(2, attempt) + Math.random() * 100, 1000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                
                if (attempt === maxRetries - 1) {
                    throw new Error(`No se pudo generar secuencia después de ${maxRetries} intentos: ${error.message}`);
                }
            }
        }

        throw new Error('Failed to generate sequence after maximum retries');
    } catch (error) {
        console.error('Error in getNextSequence:', error);
        throw error;
    }
};

// Inicializar el modelo
const Counter = mongoose.model('Counter', counterSchema);

// Asegurar que el contador existe al iniciar la aplicación
Counter.initializeCounter('auditoriaId').catch(console.error);

module.exports = Counter;
