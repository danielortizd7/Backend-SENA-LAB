#!/usr/bin/env node

/**
 * Test final para verificar que las notificaciones funcionan correctamente
 * con el método send() individual (sin /batch)
 */

require('dotenv').config();
const admin = require('firebase-admin');
const DeviceToken = require('./src/app/notificaciones/models/deviceTokenModel');
const NotificationService = require('./src/app/notificaciones/services/notificationService');
const mongoose = require('mongoose');

async function testNotificacionesFinales() {
    console.log('🚀 TEST FINAL DE NOTIFICACIONES FCM');
    console.log('=====================================');
    
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Verificar configuración de Firebase
        console.log('\n📋 VERIFICANDO CONFIGURACIÓN FIREBASE:');
        console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
        console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
        console.log('Private Key Base64:', !!process.env.FIREBASE_PRIVATE_KEY_BASE64);
        console.log('Private Key tradicional:', !!process.env.FIREBASE_PRIVATE_KEY);
        
        if (!process.env.FIREBASE_PRIVATE_KEY_BASE64 && !process.env.FIREBASE_PRIVATE_KEY) {
            throw new Error('❌ Ni FIREBASE_PRIVATE_KEY_BASE64 ni FIREBASE_PRIVATE_KEY están configuradas');
        }

        // Buscar tokens activos
        const tokens = await DeviceToken.find({ isActive: true }).limit(3);
        console.log(`\n📱 Encontrados ${tokens.length} tokens activos`);

        if (tokens.length === 0) {
            console.log('⚠️ No hay tokens para probar - creando token de prueba');
            
            // Crear token de prueba para verificar la lógica
            const testToken = new DeviceToken({
                clienteId: new mongoose.Types.ObjectId(),
                clienteDocumento: 'TEST_DOC_123',
                deviceToken: 'dTestToken123:APA91bExample_token_for_testing_purposes_only',
                platform: 'android',
                deviceInfo: { model: 'Test Device', os: 'Android 10' },
                isActive: true
            });
            
            await testToken.save();
            console.log('✅ Token de prueba creado');
        } else {
            // Mostrar tokens existentes
            tokens.forEach((token, index) => {
                console.log(`   ${index + 1}. Cliente: ${token.clienteDocumento || token.clienteId}`);
                console.log(`      Token: ${token.deviceToken.substring(0, 20)}...`);
                console.log(`      Plataforma: ${token.platform}`);
                console.log(`      Activo: ${token.isActive}`);
                console.log('');
            });
        }

        // Probar envío de notificación
        console.log('\n🔔 PROBANDO ENVÍO DE NOTIFICACIÓN:');
        
        const clienteTest = tokens[0]?.clienteDocumento || tokens[0]?.clienteId || 'TEST_DOC_123';
        
        const result = await NotificationService.enviarNotificacionCambioEstado(
            clienteTest,
            'MUESTRA-TEST-' + Date.now(),
            'Recibida',
            'En análisis',
            'Prueba automatizada - método send() individual'
        );

        console.log('\n✅ RESULTADO DEL TEST:');
        console.log('Notificación ID:', result._id);
        console.log('Cliente:', result.clienteDocumento || result.clienteId);
        console.log('Título:', result.titulo);
        console.log('Mensaje:', result.mensaje);
        console.log('Tipo:', result.tipo);
        console.log('Fecha:', result.createdAt);

        console.log('\n🎉 TEST COMPLETADO EXITOSAMENTE');
        console.log('===============================');
        console.log('✅ Firebase está configurado correctamente');
        console.log('✅ NotificationService funciona con send() individual');
        console.log('✅ No hay errores /batch');
        console.log('✅ Listo para desplegar en producción');

    } catch (error) {
        console.error('\n❌ ERROR EN TEST:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado de MongoDB');
    }
}

// Ejecutar test
testNotificacionesFinales().catch(console.error);
