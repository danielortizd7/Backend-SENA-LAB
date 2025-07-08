const axios = require('axios');

async function probarNotificacionAppCerrada() {
    try {
        console.log('🧪 Probando notificación optimizada para app cerrada...\n');
        
        const response = await axios.post('https://backend-registro-muestras.onrender.com/api/notificaciones/probar-notificacion-app-cerrada', {
            clienteDocumento: '1235467890',
            mensaje: '🚨 PRUEBA: Esta notificación debe aparecer incluso si la app está cerrada'
        });
        
        if (response.data.success) {
            console.log('✅ NOTIFICACIÓN ENVIADA CORRECTAMENTE');
            console.log('📱 Características de la notificación:');
            
            response.data.data.caracteristicas.forEach((caracteristica, index) => {
                console.log(`   ${index + 1}. ${caracteristica}`);
            });
            
            console.log('\n📋 INSTRUCCIONES PARA PRUEBA:');
            console.log('1. 🔒 Cierra completamente la app móvil');
            console.log('2. 🔕 Opcionalmente pon el teléfono en modo silencioso');
            console.log('3. ⏰ Espera unos segundos');
            console.log('4. 🔔 Deberías ver la notificación en la barra de estado');
            console.log('5. 🖱️ Toca la notificación para abrir la app');
            console.log('6. ✅ Verifica que te lleve a la pantalla correcta');
            
            console.log('\n🔧 CONFIGURACIÓN APLICADA:');
            console.log(`   - Configuración: ${response.data.data.configuracion}`);
            console.log(`   - Cliente: ${response.data.data.clienteDocumento}`);
            
        } else {
            console.log('❌ Error al enviar notificación:', response.data.message);
        }
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        if (error.response) {
            console.error('📄 Respuesta del servidor:', error.response.data);
        }
    }
}

// Ejecutar la prueba
probarNotificacionAppCerrada();
