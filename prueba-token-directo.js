#!/usr/bin/env node

/**
 * Prueba directa de token FCM sin verificación previa
 */

const axios = require('axios');

const token = "eDURHfaySAuSKX9h2_hQp9w:APA91bG_N_IY_o_B2y0ndUDq3P596hShzdAxBRc4_WHdixa0lyoeIXYFPl1VJb4-fICRegEKU_U5vlQJ0PSCWs28cVoWLqW-0acPToSbNuzizkirusVs5OE"; // Nuevo token
const urlProduccion = 'https://backend-registro-muestras.onrender.com';

console.log('🧪 === PRUEBA DIRECTA DE TOKEN FCM ===\n');
console.log(`📱 Token: ${token.substring(0, 30)}...`);
console.log(`🎯 URL: ${urlProduccion}\n`);

async function probarTokenDirecto() {
    try {
        console.log('🚀 Enviando notificación de prueba...');
        
        const response = await axios.post(`${urlProduccion}/api/notificaciones-test/local`, {
            deviceToken: token,
            titulo: '🧪 Prueba Directa FCM',
            mensaje: `Test ${new Date().toLocaleTimeString()} - Token válido desde MongoDB`
        }, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`✅ Respuesta HTTP: ${response.status}`);
        console.log('📋 Respuesta completa:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('\n🎉 ¡ÉXITO! La notificación se envió correctamente');
            console.log('📱 Verifica tu dispositivo Android ahora');
        } else {
            console.log('\n⚠️ Error en la respuesta:');
            console.log(`   Mensaje: ${response.data.message}`);
            if (response.data.error) {
                console.log(`   Error: ${response.data.error}`);
            }
        }
        
    } catch (error) {
        console.error('\n❌ Error en la prueba:');
        
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
            
            if (error.response.status === 404) {
                console.error('\n🚨 El endpoint no existe o no está disponible');
            } else if (error.response.status === 500) {
                console.error('\n🚨 Error interno del servidor');
            }
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n🚨 No se puede conectar al servidor');
        } else if (error.code === 'ENOTFOUND') {
            console.error('\n🚨 URL no encontrada');
        } else {
            console.error(`   Error: ${error.message}`);
        }
    }
}

probarTokenDirecto();
