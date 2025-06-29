const axios = require('axios');

async function probarEndpointCambioEstado() {
    console.log('🧪 === PRUEBA DE ENDPOINT DE CAMBIO DE ESTADO ===');
    
    try {
        // Primero, registrar un token FCM de prueba
        console.log('1️⃣ Registrando token FCM...');
        
        const tokenResponse = await axios.post('http://localhost:5000/api/notificaciones-test/register-device', {
            deviceToken: 'co1WhDNTSzS-xuiJKqPF3o:APA91bHRUutPVcz1LO3YYwm7l36zMZIxad6lQLfL2h3zkIa4YaBAnfsYKeWoZvmu7CPvlUCkvyDf5iglFyfhn0fRt0kOjHtIzyPLzmXMih3vFGEvLJe99oM',
            platform: 'android',
            clienteDocumento: '1235467890',
            deviceInfo: {
                deviceId: 'TEST-DEVICE',
                deviceName: 'Dispositivo de Prueba',
                osVersion: 'Android 12',
                appBuild: '1.0.0'
            }
        });
        
        console.log('✅ Token registrado:', tokenResponse.data.success);
        
        // Ahora simular un cambio de estado que dispare notificación automática
        console.log('');
        console.log('2️⃣ Simulando cambio de estado...');
        console.log('📡 Endpoint: PUT /api/cambios-estado/[muestra_id]');
        console.log('📋 Este endpoint AUTOMÁTICAMENTE enviará notificación');
        console.log('');
        
        // Instrucciones para usar con Postman o desde frontend
        console.log('🎯 PARA PROBAR DESDE POSTMAN:');
        console.log('');
        console.log('PUT http://localhost:5000/api/cambios-estado/PF250629001');
        console.log('Headers:');
        console.log('  Authorization: Bearer [tu_jwt_token]');
        console.log('  Content-Type: application/json');
        console.log('');
        console.log('Body:');
        console.log(JSON.stringify({
            nuevoEstado: 'En análisis'
        }, null, 2));
        console.log('');
        console.log('✅ Esto automáticamente:');
        console.log('   1. Cambiará el estado en la BD');
        console.log('   2. Registrará auditoría');
        console.log('   3. 🔔 ENVIARÁ NOTIFICACIÓN PUSH');
        console.log('   4. 🔗 ENVIARÁ NOTIFICACIÓN WEBSOCKET');
        console.log('');
        console.log('📱 El cliente recibirá la notificación automáticamente');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('');
        console.log('💡 Asegúrate de que el servidor esté corriendo: npm start');
    }
}

probarEndpointCambioEstado();
