#!/usr/bin/env node

/**
 * Prueba el nuevo token FCM usando el endpoint correcto
 */

const axios = require('axios');

const nuevoToken = "eDURHfaySAuSKX9h2_hQp9w"; // Solo la primera parte del token del log
const urlProduccion = 'https://backend-registro-muestras.onrender.com';

console.log('🧪 === PRUEBA NUEVO TOKEN FCM (PARCIAL) ===\n');
console.log(`📱 Token (parcial): ${nuevoToken}...`);
console.log(`🎯 URL: ${urlProduccion}\n`);

async function probarNuevoToken() {
    try {
        // Primero registrar el token
        console.log('1️⃣ Registrando token en el backend...');
        
        const registroResponse = await axios.post(`${urlProduccion}/api/notificaciones-test/register-device`, {
            deviceToken: nuevoToken + "...", // Usamos el token parcial
            platform: "android",
            clienteDocumento: "1235467890",
            deviceInfo: {
                modelo: "Test Device",
                version: "Android 12"
            }
        }, {
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`✅ Registro exitoso: ${registroResponse.status}`);
        console.log('📋 Respuesta del registro:');
        console.log(JSON.stringify(registroResponse.data, null, 2));
        
        // Ahora probar envío
        console.log('\n2️⃣ Enviando notificación de prueba...');
        
        const notifResponse = await axios.post(`${urlProduccion}/api/notificaciones-test/local`, {
            clienteDocumento: "1235467890",
            titulo: '🎉 PRUEBA NUEVO TOKEN',
            mensaje: `Token actualizado después de cambios Android - ${new Date().toLocaleTimeString()}`
        }, {
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`✅ Notificación enviada: ${notifResponse.status}`);
        console.log('📋 Respuesta de notificación:');
        console.log(JSON.stringify(notifResponse.data, null, 2));
        
        if (notifResponse.data.success) {
            console.log('\n🎉 ¡ÉXITO! Notificación procesada correctamente');
            console.log('📱 Verifica tu dispositivo Android AHORA');
        } else {
            console.log('\n⚠️ Advertencia en la respuesta');
        }
        
    } catch (error) {
        console.error('\n❌ Error en la prueba:');
        
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(`   Error: ${error.message}`);
        }
    }
}

probarNuevoToken();

console.log('💡 NOTA IMPORTANTE:');
console.log('Si ves el error 404 de nuevo, significa que el problema persiste');
console.log('incluso con el nuevo token. Esto sugiere un problema más profundo');
console.log('con las credenciales de Firebase o la configuración del proyecto.\n');
