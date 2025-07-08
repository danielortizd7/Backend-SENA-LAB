const axios = require('axios');

async function probarNotificacionConAppCerrada() {
    try {
        console.log('🔔 Probando notificación optimizada para app cerrada...\n');
        
        const response = await axios.post('https://backend-registro-muestras.onrender.com/api/notificaciones/registrar-token', {
            token: 'c3lMci17RlWk2zuXAMHx8I:APA91bH5dKZgJVWJKA5uO9gQRgJ4Y6X1c9_wYUoGbQX1yNxKKRrqUPe5Kd_1sOjNGWZx2L3M7nH8F',
            clienteDocumento: '1235467890',
            platform: 'android'
        });

        if (response.data.success) {
            console.log('✅ Token registrado exitosamente');
            console.log('📱 Ahora cierra la app móvil completamente');
            console.log('⏰ Esperando 5 segundos para asegurar que la app esté cerrada...\n');
            
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Simular cambio de estado que debe llegar con app cerrada
            const testResponse = await axios.post('https://backend-registro-muestras.onrender.com/api/notificaciones-test/local', {
                clienteDocumento: '1235467890',
                mensaje: '🔔 Prueba de notificación con app cerrada - ¿La recibiste en la barra de notificaciones?'
            });
            
            console.log('🚀 NOTIFICACIÓN ENVIADA con estructura optimizada:');
            console.log('📨 Título: Notificación de Prueba');
            console.log('📝 Mensaje: Prueba de notificación con app cerrada');
            console.log('📱 Debe aparecer en la barra de notificaciones del dispositivo');
            console.log('');
            console.log('✅ Estructura del mensaje FCM enviada:');
            console.log(JSON.stringify({
                notification: {
                    title: "Título de ejemplo",
                    body: "Mensaje de ejemplo"
                },
                data: {
                    tipo: "cambio_estado",
                    id_muestra: "ejemplo",
                    clickAction: "OPEN_MUESTRA_DETAIL"
                }
            }, null, 2));
            
            console.log('\n🔍 VERIFICACIÓN:');
            console.log('1. ¿Aparece la notificación en la barra de notificaciones?');
            console.log('2. ¿Al tocar la notificación se abre la app?');
            console.log('3. ¿Funciona aunque la app esté completamente cerrada?');
            
        } else {
            console.error('❌ Error registrando token:', response.data.message);
        }
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        if (error.response) {
            console.error('Respuesta:', error.response.data);
        }
    }
}

console.log('🎯 PRUEBA DE NOTIFICACIONES CON APP CERRADA');
console.log('=' .repeat(50));
console.log('Esta prueba verificará que las notificaciones lleguen');
console.log('correctamente cuando la app móvil esté cerrada.\n');

probarNotificacionConAppCerrada();
