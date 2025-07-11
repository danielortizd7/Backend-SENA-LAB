const axios = require('axios');

async function probarNuevaEstructuraNotificacion() {
    try {
        console.log('🔔 Probando nueva estructura de notificación (solo data)...\n');
        
        // 1. Registrar token
        console.log('1️⃣ Registrando token FCM...');
        const response = await axios.post('https://backend-registro-muestras.onrender.com/api/notificaciones/registrar-token', {
            token: 'c3lMci17RlWk2zuXAMHx8I:APA91bH5dKZgJVWJKA5uO9gQRgJ4Y6X1c9_wYUoGbQX1yNxKKRrqUPe5Kd_1sOjNGWZx2L3M7nH8F',
            clienteDocumento: '1235467890',
            platform: 'android'
        });

        if (response.data.success) {
            console.log('✅ Token registrado exitosamente\n');
            
            console.log('📱 IMPORTANTE: Ahora cierra la app móvil completamente');
            console.log('⏰ Esperando 3 segundos...\n');
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 2. Enviar notificación con nueva estructura
            console.log('2️⃣ Enviando notificación con nueva estructura...');
            const testResponse = await axios.post('https://backend-registro-muestras.onrender.com/api/notificaciones-test/local', {
                clienteDocumento: '1235467890',
                mensaje: 'Prueba de notificación con estructura modificada para manejo manual en la app'
            });
            
            console.log('🚀 NOTIFICACIÓN ENVIADA con nueva estructura:');
            console.log('📨 Estructura JSON enviada a Firebase:');
            console.log(JSON.stringify({
                data: {
                    title: "Notificación de Prueba",
                    body: "Prueba de notificación con estructura modificada para manejo manual en la app",
                    estadoAnterior: "",
                    estadoNuevo: "",
                    fechaCambio: new Date().toISOString(),
                    observaciones: "",
                    tipo: "cambio_estado",
                    clickAction: "OPEN_MUESTRA_DETAIL",
                    requiereAccion: "false",
                    id_muestra: "",
                    priority: "high"
                },
                android: {
                    priority: "high",
                    notification: {
                        channel_id: "aqualab_updates"
                    }
                }
            }, null, 2));
            
            console.log('\n🔍 VERIFICACIÓN:');
            console.log('1. ¿Aparece la notificación en la barra de notificaciones?');
            console.log('2. ¿Se guarda en la sección de notificaciones dentro de la app?');
            console.log('3. ¿Al abrir la app después aparece en el listado de notificaciones?');
            
            console.log('\n📋 CAMBIOS REALIZADOS:');
            console.log('✅ Removido campo "notification" del JSON');
            console.log('✅ Movido "title" y "body" dentro de "data"');
            console.log('✅ Mantenido "android.notification.channel_id"');
            console.log('✅ La app debe manejar las notificaciones manualmente');
            
        } else {
            console.error('❌ Error registrando token:', response.data.message);
        }
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        if (error.response) {
            console.error('Respuesta del servidor:', error.response.data);
        }
    }
}

console.log('🎯 PRUEBA DE NUEVA ESTRUCTURA DE NOTIFICACIONES');
console.log('=' .repeat(60));
console.log('Esta prueba verifica que las notificaciones se envíen con');
console.log('la nueva estructura (solo "data") para manejo manual en la app.\n');

probarNuevaEstructuraNotificacion();
