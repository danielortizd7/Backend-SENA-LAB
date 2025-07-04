#!/usr/bin/env node

/**
 * Script para probar un token FCM específico contra el backend en producción
 * Uso: node probar-token-produccion.js [TOKEN_FCM]
 */

const axios = require('axios');

const token = process.argv[2];
const urlProduccion = 'https://backend-registro-muestras.onrender.com';

if (!token) {
    console.log('❌ Uso: node probar-token-produccion.js [TOKEN_FCM]');
    console.log('\n📱 Para obtener un token FCM desde Android:');
    console.log('FirebaseMessaging.getInstance().getToken()');
    console.log('  .addOnCompleteListener(task -> {');
    console.log('    String token = task.getResult();');
    console.log('    Log.d("FCM_TOKEN", token);');
    console.log('  });');
    process.exit(1);
}

console.log('🧪 === PRUEBA DE TOKEN FCM EN PRODUCCIÓN ===\n');
console.log(`🎯 URL Producción: ${urlProduccion}`);
console.log(`📱 Token a probar: ${token.substring(0, 20)}...`);
console.log(`⏰ Timestamp: ${new Date().toISOString()}\n`);

async function probarToken() {
    try {
        console.log('🚀 Enviando notificación de prueba...');
        
        const response = await axios.post(`${urlProduccion}/api/notificaciones/probar-token`, {
            token: token,
            titulo: '🧪 Prueba desde Script',
            mensaje: `Prueba de conectividad FCM - ${new Date().toLocaleTimeString()}`
        }, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`✅ Respuesta HTTP: ${response.status}`);
        console.log('📋 Datos de respuesta:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('\n🎉 ¡ÉXITO! La notificación se envió correctamente');
            console.log('📱 Verifica tu dispositivo Android para confirmar recepción');
        } else {
            console.log('\n⚠️ La respuesta indica un problema:');
            console.log(`   Mensaje: ${response.data.message}`);
            if (response.data.error) {
                console.log(`   Error: ${response.data.error}`);
            }
        }
        
    } catch (error) {
        console.error('\n❌ Error al enviar notificación:');
        
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
            
            if (error.response.status === 404) {
                console.error('\n🚨 ERROR 404: Endpoint no encontrado');
                console.error('💡 Posibles causas:');
                console.error('   1. URL incorrecta');
                console.error('   2. Servicio no desplegado correctamente');
            }
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n🚨 ERROR DE CONEXIÓN: No se puede conectar al servidor');
            console.error('💡 El servicio puede estar caído o la URL es incorrecta');
        } else if (error.code === 'ENOTFOUND') {
            console.error('\n🚨 ERROR DNS: No se puede resolver la URL');
            console.error('💡 Verifica que la URL esté correcta');
        } else {
            console.error(`   Message: ${error.message}`);
        }
        
        console.error('\n🔧 Soluciones:');
        console.error('1. Verifica que el backend esté ejecutándose en Render');
        console.error('2. Confirma la URL del backend');
        console.error('3. Verifica que Firebase Cloud Messaging API esté habilitada');
    }
}

// Función adicional para verificar estado del backend
async function verificarBackend() {
    try {
        console.log('🔍 Verificando estado del backend...');
        const response = await axios.get(`${urlProduccion}/api/notificaciones/diagnostico`, {
            timeout: 10000
        });
        
        console.log('✅ Backend respondiendo correctamente');
        console.log(`📊 Firebase configurado: ${response.data.data?.firebase_configurado ? 'SÍ' : 'NO'}`);
        console.log(`📊 Project ID: ${response.data.data?.project_id || 'No disponible'}`);
        
        return true;
    } catch (error) {
        console.error('❌ Backend no responde correctamente');
        console.error(`   Error: ${error.message}`);
        return false;
    }
}

async function main() {
    // Verificar backend primero
    const backendOk = await verificarBackend();
    
    if (!backendOk) {
        console.error('\n🚨 El backend no está funcionando. Abortando prueba.');
        process.exit(1);
    }
    
    console.log('');
    await probarToken();
}

main();
