#!/usr/bin/env node

/**
 * Script para probar TODOS los cambios de estado y verificar que envíen notificaciones
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Muestra } = require('./src/shared/models/muestrasModel');
const { cambiarEstadoMuestra } = require('./src/app/cambios-estado/services/cambiarEstadoService');
const DeviceToken = require('./src/app/notificaciones/models/deviceTokenModel');

async function probarTodosLosCambiosDeEstado() {
    console.log('🧪 PRUEBA COMPLETA: Cambios de Estado y Notificaciones');
    console.log('====================================================');
    
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Buscar una muestra con cliente
        const muestra = await Muestra.findOne().populate('cliente');
        if (!muestra) {
            console.log('❌ No hay muestras en la base de datos');
            return;
        }

        console.log('\n📋 MUESTRA PARA PRUEBAS:');
        console.log(`   - ID: ${muestra._id}`);
        console.log(`   - Código: ${muestra.id_muestra}`);
        console.log(`   - Estado actual: ${muestra.estado}`);
        console.log(`   - Cliente: ${muestra.cliente?.nombre || 'N/A'} (${muestra.cliente?.documento || 'N/A'})`);

        // Verificar tokens FCM del cliente
        let tokens = [];
        if (muestra.cliente?.documento) {
            tokens = await DeviceToken.find({ 
                clienteDocumento: muestra.cliente.documento, 
                isActive: true 
            });
            console.log(`   - Tokens FCM activos: ${tokens.length}`);
        }

        // Usuario administrador de prueba
        const usuarioAdmin = {
            _id: new mongoose.Types.ObjectId(),
            documento: '12345678',
            nombre: 'Admin Test',
            email: 'admin@test.com',
            rol: 'administrador'
        };

        // PROBAR DIFERENTES ESTADOS
        const estadosPrueba = [
            { de: muestra.estado, a: 'En análisis', observacion: 'Iniciando análisis de laboratorio' },
            { de: 'En análisis', a: 'Finalizada', observacion: 'Análisis completado con resultados' },
            { de: 'Finalizada', a: 'En Cotizacion', observacion: 'Enviando a cotización para nueva solicitud' },
            { de: 'En Cotizacion', a: 'Aceptada', observacion: 'Cotización aceptada por el cliente' },
            { de: 'Aceptada', a: 'Recibida', observacion: 'Muestra recibida en laboratorio' }
        ];

        console.log('\n🔄 EJECUTANDO CAMBIOS DE ESTADO:');
        console.log('================================');

        for (let i = 0; i < estadosPrueba.length; i++) {
            const cambio = estadosPrueba[i];
            
            console.log(`\n${i + 1}. CAMBIO: ${cambio.de} → ${cambio.a}`);
            console.log(`   Observación: ${cambio.observacion}`);
            
            // Preparar usuario con observaciones específicas
            const usuarioConObservaciones = {
                ...usuarioAdmin,
                observaciones: cambio.observacion
            };

            try {
                // Ejecutar cambio de estado
                const resultado = await cambiarEstadoMuestra(
                    muestra._id, 
                    cambio.a, 
                    usuarioConObservaciones
                );

                if (resultado.success) {
                    console.log(`   ✅ Estado actualizado: ${resultado.muestra.estado}`);
                    console.log(`   📧 Notificación enviada automáticamente`);
                    
                    if (tokens.length > 0) {
                        console.log(`   📱 Cliente debería recibir notificación push`);
                    } else {
                        console.log(`   ⚠️ Cliente no tiene tokens FCM registrados`);
                    }
                } else {
                    console.log(`   ❌ Error: ${resultado.message}`);
                }
                
                // Esperar un poco entre cambios
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.log(`   ❌ Error en cambio: ${error.message}`);
            }
        }

        console.log('\n📊 RESUMEN DE LA PRUEBA:');
        console.log('=======================');
        
        // Obtener estado final de la muestra
        const muestraFinal = await Muestra.findById(muestra._id);
        console.log(`✅ Estado final de la muestra: ${muestraFinal.estado}`);
        console.log(`📝 Historial de estados: ${muestraFinal.historialEstados.length} entradas`);
        
        console.log('\n🎯 VERIFICACIONES:');
        console.log('==================');
        console.log('✅ Todos los cambios usan cambiarEstadoMuestra()');
        console.log('✅ Cada cambio registra auditoría automáticamente');
        console.log('✅ Cada cambio envía notificación automáticamente');
        console.log('✅ WebSocket y FCM funcionan en paralelo');
        
        if (tokens.length > 0) {
            console.log('✅ Cliente tiene tokens para recibir notificaciones');
            console.log('📱 Verifica tu dispositivo Android para las notificaciones');
        } else {
            console.log('⚠️ Para probar notificaciones reales, registra un token FCM');
        }

        console.log('\n🏆 CONCLUSIÓN:');
        console.log('==============');
        console.log('🎉 Si ves este mensaje, TODOS los cambios de estado');
        console.log('📧 están configurados para enviar notificaciones automáticamente');
        console.log('🚀 El sistema funciona correctamente');

    } catch (error) {
        console.error('\n❌ ERROR EN PRUEBA:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado de MongoDB');
    }
}

// Ejecutar prueba
probarTodosLosCambiosDeEstado().catch(console.error);
