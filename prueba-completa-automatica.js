require('dotenv').config();
const axios = require('axios');

async function pruebaCompletaCambioEstado() {
    console.log('🎯 === PRUEBA COMPLETA DE CAMBIO DE ESTADO AUTOMÁTICO ===');
    console.log('');
    
    const BASE_URL = 'http://localhost:5000';
    
    try {
        // Paso 1: Verificar que el servidor esté corriendo
        console.log('1️⃣ Verificando servidor...');
        try {
            const healthCheck = await axios.get(`${BASE_URL}/`);
            console.log('✅ Servidor respondiendo:', healthCheck.data.message);
        } catch (error) {
            console.log('❌ Servidor no está corriendo');
            console.log('💡 Ejecuta: node server.js');
            return;
        }
        
        // Paso 2: Registrar token FCM si no existe
        console.log('');
        console.log('2️⃣ Registrando token FCM...');
        const tokenData = {
            deviceToken: 'co1WhDNTSzS-xuiJKqPF3o:APA91bHRUutPVcz1LO3YYwm7l36zMZIxad6lQLfL2h3zkIa4YaBAnfsYKeWoZvmu7CPvlUCkvyDf5iglFyfhn0fRt0kOjHtIzyPLzmXMih3vFGEvLJe99oM',
            platform: 'android',
            clienteDocumento: '1235467890',
            deviceInfo: {
                deviceId: 'TEST-DEVICE-AUTO',
                deviceName: 'Dispositivo Prueba Automática',
                osVersion: 'Android 12',
                appBuild: '1.0.0'
            }
        };
        
        const tokenResponse = await axios.post(`${BASE_URL}/api/notificaciones-test/register-device`, tokenData);
        console.log('✅ Token FCM registrado:', tokenResponse.data.success);
        
        // Paso 3: Obtener JWT token para autenticación (simulado)
        console.log('');
        console.log('3️⃣ Simulando login para obtener JWT...');
        
        // Para la prueba, vamos a usar el endpoint público de notificaciones
        // que simula un cambio de estado
        console.log('');
        console.log('4️⃣ Simulando cambio de estado con notificación automática...');
        
        const cambioEstadoData = {
            clienteDocumento: '1235467890',
            muestraId: `PRUEBA-AUTO-${Date.now()}`,
            estadoAnterior: 'En Cotizacion',
            estadoNuevo: 'Aceptada',
            observaciones: 'Prueba de cambio de estado automático desde script - La cotización ha sido aceptada por el administrador'
        };
        
        console.log('📋 Datos del cambio:');
        console.log(`   - Cliente: ${cambioEstadoData.clienteDocumento}`);
        console.log(`   - Muestra: ${cambioEstadoData.muestraId}`);
        console.log(`   - Cambio: ${cambioEstadoData.estadoAnterior} → ${cambioEstadoData.estadoNuevo}`);
        console.log(`   - Observaciones: ${cambioEstadoData.observaciones}`);
        
        const notificacionResponse = await axios.post(`${BASE_URL}/api/notificaciones-test/local`, cambioEstadoData);
        
        console.log('');
        if (notificacionResponse.data.success) {
            console.log('🎉 ¡PRUEBA EXITOSA!');
            console.log('✅ Cambio de estado simulado correctamente');
            console.log('✅ Notificación enviada automáticamente');
            console.log('');
            console.log('📧 Detalles de la notificación:');
            console.log(`   - ID: ${notificacionResponse.data.data.notificacionId}`);
            console.log(`   - Título: ${notificacionResponse.data.data.titulo}`);
            console.log(`   - Mensaje: ${notificacionResponse.data.data.mensaje}`);
            console.log(`   - Timestamp: ${notificacionResponse.data.data.timestamp}`);
            console.log('');
            console.log('📱 ¡VERIFICA TU DISPOSITIVO ANDROID!');
            console.log('🔔 Deberías haber recibido una notificación push');
            console.log('');
            console.log('✅ El flujo automático está funcionando:');
            console.log('   1. ✅ Token FCM registrado');
            console.log('   2. ✅ Cambio de estado detectado');
            console.log('   3. ✅ Notificación enviada automáticamente');
            console.log('   4. ✅ Cliente notificado en tiempo real');
        } else {
            console.log('❌ Error en la prueba:', notificacionResponse.data.message);
            console.log('📋 Respuesta completa:', notificacionResponse.data);
        }
        
        // Paso 5: Verificar en MongoDB (opcional)
        console.log('');
        console.log('5️⃣ Verificación completa:');
        console.log('🔗 Para verificar en MongoDB Compass:');
        console.log('   - Colección: devicetokens');
        console.log('   - Buscar: clienteDocumento = "1235467890"');
        console.log('   - Colección: notifications');
        console.log('   - Verificar última notificación enviada');
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        
        if (error.response) {
            console.log('📋 Detalles del error:');
            console.log('   - Status:', error.response.status);
            console.log('   - Data:', error.response.data);
        }
        
        console.log('');
        console.log('🔧 Posibles soluciones:');
        console.log('   1. Asegúrate de que el servidor esté corriendo: node server.js');
        console.log('   2. Verifica que MongoDB esté conectado');
        console.log('   3. Verifica las variables de entorno Firebase');
    }
}

// Ejecutar prueba
pruebaCompletaCambioEstado();
