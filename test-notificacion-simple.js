const axios = require('axios');

async function probarNotificacionAppCerrada() {
    try {
        console.log('🔔 Probando notificación optimizada para app cerrada...\n');
        
        const response = await axios.post('https://backend-registro-muestras.onrender.com/api/notificaciones-test/local', {
            clienteDocumento: '1235467890',
            mensaje: 'Prueba de notificación para app cerrada - ' + new Date().toLocaleTimeString()
        });
        
        if (response.data.success) {
            console.log('✅ NOTIFICACIÓN ENVIADA EXITOSAMENTE');
            console.log(`📱 Dispositivos alcanzados: ${response.data.data.devicesSent || 0}`);
            console.log(`❌ Dispositivos fallidos: ${response.data.data.devicesFailed || 0}`);
            console.log(`💬 Mensaje: ${response.data.message}`);
        } else {
            console.log('❌ ERROR AL ENVIAR NOTIFICACIÓN');
            console.log(`Mensaje: ${response.data.message}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Respuesta del servidor:', error.response.data);
        }
    }
}

probarNotificacionAppCerrada();
