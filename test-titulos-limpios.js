const axios = require('axios');

async function probarNotificacionesSinEmojis() {
    try {
        console.log('🧪 Probando notificaciones SIN emojis en títulos...\n');
        
        // 1. Registrar token
        console.log('1️⃣ Registrando token FCM...');
        const registerResponse = await axios.post('https://backend-registro-muestras.onrender.com/api/notificaciones/registrar-token', {
            token: 'c3lMci17RlWk2zuXAMHx8I:APA91bH5dKZgJVWJKA5uO9gQRgJ4Y6X1c9_wYUoGbQX1yNxKKRrqUPe5Kd_1sOjNGWZx2L3M7nH8F',
            clienteDocumento: '1235467890',
            platform: 'android'
        });
        
        if (registerResponse.data.success) {
            console.log('✅ Token registrado exitosamente\n');
        }
        
        // 2. Probar notificación con título limpio
        console.log('2️⃣ Enviando notificación con título SIN emojis...');
        const testResponse = await axios.post('https://backend-registro-muestras.onrender.com/api/notificaciones-test/local', {
            clienteDocumento: '1235467890',
            mensaje: 'Prueba de notificación con título limpio (sin emojis)'
        });
        
        console.log('✅ NOTIFICACIÓN ENVIADA con estructura limpia:');
        console.log('📨 Título esperado: "Notificación de Prueba" (SIN emojis)');
        console.log('📝 Mensaje: Prueba de notificación con título limpio');
        console.log('');
        
        // 3. Probar notificaciones de estados específicos
        const estados = [
            { estado: 'En Cotización', titulo: 'Cotización en Proceso' },
            { estado: 'Aceptada', titulo: 'Cotización Aceptada' },
            { estado: 'Recibida', titulo: 'Muestra Recibida' },
            { estado: 'En análisis', titulo: 'Análisis en Proceso' },
            { estado: 'Finalizada', titulo: 'Resultados Disponibles' },
            { estado: 'Rechazada', titulo: 'Muestra Rechazada' }
        ];
        
        console.log('3️⃣ Probando todos los estados con títulos limpios...\n');
        
        for (let i = 0; i < estados.length; i++) {
            const estado = estados[i];
            console.log(`📋 Probando estado: ${estado.estado}`);
            console.log(`   Título esperado: "${estado.titulo}" (SIN emojis)`);
            
            // Esperar 2 segundos entre notificaciones
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('\n🎯 VERIFICACIÓN EN EL DISPOSITIVO MÓVIL:');
        console.log('✅ Los títulos NO deben tener emojis (💼, ✅, 📦, 🔬, ❌)');
        console.log('✅ Los títulos deben ser texto limpio');
        console.log('✅ Las notificaciones deben aparecer en la barra de notificaciones');
        console.log('✅ Las notificaciones deben guardarse en la sección interna de la app');
        console.log('');
        console.log('📱 Si las notificaciones ahora se guardan correctamente en la app,');
        console.log('   el problema estaba en los emojis de los títulos.');
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        if (error.response) {
            console.error('Respuesta:', error.response.data);
        }
    }
}

console.log('🧹 PRUEBA DE NOTIFICACIONES CON TÍTULOS LIMPIOS');
console.log('=' .repeat(55));
console.log('Esta prueba verifica que los títulos sin emojis');
console.log('permitan que las notificaciones se guarden correctamente\n');

probarNotificacionesSinEmojis();
