#!/usr/bin/env node

/**
 * SCRIPT SIMPLE PARA PROBAR NOTIFICACIÓN
 * 
 * Uso: node probar-notificacion-simple.js TU_TOKEN_FCM_AQUI
 */

const fetch = require('node-fetch');

async function probarNotificacion(token) {
    if (!token) {
        console.log('❌ Error: Debes proporcionar un token FCM');
        console.log('📝 Uso: node probar-notificacion-simple.js TU_TOKEN_FCM_AQUI');
        console.log('📝 Ejemplo: node probar-notificacion-simple.js f02DbwReS3SDT7on2SRu...');
        return;
    }

    console.log('🧪 === PRUEBA SIMPLE DE NOTIFICACIÓN ===');
    console.log(`🔑 Token: ${token.substring(0, 30)}...`);

    const backendUrl = 'http://localhost:5000';
    
    try {
        console.log('🚀 Enviando notificación...');
        const response = await fetch(`${backendUrl}/api/notificaciones-test/probar-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                deviceToken: token,
                clienteDocumento: '1235467890',
                titulo: '🎉 ¡FCM Funciona!',
                mensaje: 'Esta notificación confirma que Firebase Cloud Messaging está funcionando correctamente después de habilitar la API'
            })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('✅ ¡NOTIFICACIÓN ENVIADA EXITOSAMENTE!');
            console.log(`📱 Message ID: ${data.data.messageId}`);
            console.log('🔔 Revisa tu celular - deberías recibir la notificación');
            console.log('');
            console.log('🎯 RESULTADO: El error 404 de FCM está SOLUCIONADO ✅');
        } else {
            console.log('❌ Error enviando notificación:');
            console.log(JSON.stringify(data, null, 2));
            
            if (data.error && data.error.diagnosis) {
                console.log(`\n🔍 Diagnóstico: ${data.error.diagnosis}`);
                if (data.error.solution) {
                    console.log('💡 Solución:');
                    data.error.solution.forEach(step => console.log(`   ${step}`));
                }
            }
        }

    } catch (error) {
        console.log('❌ Error conectando al servidor:', error.message);
    }

    console.log('\n🧪 === FIN DE PRUEBA ===');
}

// Ejecutar prueba
const token = process.argv[2];
probarNotificacion(token);
