require('dotenv').config();
const mongoose = require('mongoose');

async function probarCambioEstadoAutomatico() {
    console.log('🧪 === PRUEBA DE CAMBIO DE ESTADO AUTOMÁTICO ===');
    
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');
        
        // Importar modelos y servicios
        const { cambiarEstadoMuestra } = require('./src/app/cambios-estado/services/cambiarEstadoService');
        const { Muestra } = require('./src/shared/models/muestrasModel');
        
        // Buscar una muestra existente que tenga cliente
        const muestra = await Muestra.findOne({ 
            'cliente.documento': '1235467890' 
        });
        
        if (!muestra) {
            console.log('❌ No se encontró muestra con cliente documento 1235467890');
            console.log('💡 Creando muestra de prueba...');
            
            // Crear muestra de prueba
            const nuevaMuestra = new Muestra({
                id_muestra: `TEST-AUTO-${Date.now()}`,
                cliente: {
                    documento: '1235467890',
                    nombre: 'Felipe Suarez',
                    email: 'felipe@test.com'
                },
                estado: 'Pendiente',
                tipoDeAgua: 'Potable',
                lugarMuestreo: 'Laboratorio Test',
                fechaHoraMuestreo: new Date(),
                historialEstados: [{
                    estado: 'Pendiente',
                    fecha: new Date(),
                    observaciones: 'Muestra de prueba creada'
                }]
            });
            
            await nuevaMuestra.save();
            console.log(`✅ Muestra creada: ${nuevaMuestra.id_muestra}`);
            
            // Usar la nueva muestra
            muestra = nuevaMuestra;
        }
        
        console.log(`🔍 Muestra encontrada: ${muestra.id_muestra}`);
        console.log(`📋 Estado actual: ${muestra.estado}`);
        console.log(`👤 Cliente: ${muestra.cliente.nombre} (${muestra.cliente.documento})`);
        
        // Simular usuario admin
        const usuarioAdmin = {
            _id: new mongoose.Types.ObjectId(),
            documento: '12345678',
            nombre: 'Admin Test',
            email: 'admin@test.com',
            rol: 'administrador',
            observaciones: 'Cambio de estado automático desde script de prueba'
        };
        
        // Determinar siguiente estado válido
        let nuevoEstado;
        switch (muestra.estado) {
            case 'Pendiente':
                nuevoEstado = 'Recibida';
                break;
            case 'Recibida':
                nuevoEstado = 'En análisis';
                break;
            case 'En análisis':
                nuevoEstado = 'Finalizada';
                break;
            case 'En Cotizacion':
                nuevoEstado = 'Aceptada';
                break;
            case 'Aceptada':
                nuevoEstado = 'Recibida';
                break;
            default:
                nuevoEstado = 'En Cotizacion';
        }
        
        console.log(`🚀 Cambiando estado: ${muestra.estado} → ${nuevoEstado}`);
        console.log('');
        
        // EJECUTAR CAMBIO DE ESTADO (esto disparará la notificación automática)
        const resultado = await cambiarEstadoMuestra(muestra._id, nuevoEstado, usuarioAdmin);
        
        if (resultado.success) {
            console.log('✅ ¡CAMBIO DE ESTADO EXITOSO!');
            console.log('📧 La notificación debería haberse enviado automáticamente');
            console.log('');
            console.log('📋 Resultado:');
            console.log(`   - Muestra ID: ${resultado.muestra.id_muestra}`);
            console.log(`   - Estado: ${resultado.muestra.estado}`);
            console.log(`   - Cliente: ${resultado.muestra.cliente.nombre}`);
            console.log('');
            console.log('🔔 Verifica tu dispositivo Android para la notificación');
        } else {
            console.log('❌ Error en cambio de estado:', resultado.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔚 Desconectado de MongoDB');
    }
}

// Ejecutar prueba
probarCambioEstadoAutomatico();
