/**
 * PROBAR DIAGNÓSTICO FIREBASE EN PRODUCCIÓN
 * Script para diagnosticar Firebase directamente en Render
 */

const https = require('https');

const RENDER_URL = 'https://backend-registro-muestras.onrender.com';

async function diagnosticarFirebaseProduccion() {
    try {
        console.log('🔍 === DIAGNÓSTICO FIREBASE EN PRODUCCIÓN ===');
        console.log('============================================');
        
        const url = `${RENDER_URL}/api/notifications/diagnostico-firebase-produccion`;
        console.log('🔗 URL:', url);
        
        console.log('\n📤 Enviando request a Render...');
        const response = await makeRequest(url);
        
        if (response.success) {
            console.log('✅ Diagnóstico completado exitosamente');
            
            const data = response.data;
            
            console.log('\n📋 INFORMACIÓN BÁSICA:');
            console.log('   - Timestamp:', data.timestamp);
            console.log('   - Environment:', data.environment);
            console.log('   - Firebase Apps:', data.firebaseApps);
            
            console.log('\n🔑 CREDENCIALES:');
            Object.keys(data.credentials).forEach(key => {
                console.log(`   - ${key}: ${data.credentials[key]}`);
            });
            
            console.log('\n📊 VALORES:');
            console.log('   - Project ID:', data.values.projectId);
            console.log('   - Client Email:', data.values.clientEmail);
            console.log('   - Private Key Length:', data.values.privateKeyLength);
            
            if (data.tokenTest) {
                console.log('\n🔑 PRUEBA DE TOKEN:');
                if (data.tokenTest.found) {
                    console.log('   - Token encontrado: ✅ SÍ');
                    console.log('   - Cliente:', data.tokenTest.clienteDocumento);
                    console.log('   - Longitud:', data.tokenTest.tokenLength);
                    console.log('   - Inicio:', data.tokenTest.tokenStart);
                    console.log('   - Final:', data.tokenTest.tokenEnd);
                } else {
                    console.log('   - Token encontrado: ❌ NO');
                    console.log('   - Mensaje:', data.tokenTest.message);
                }
            }
            
            if (data.fcmTest) {
                console.log('\n📱 PRUEBA FCM:');
                if (data.fcmTest.success) {
                    console.log('   - Resultado: ✅ ÉXITO');
                    console.log('   - Message ID:', data.fcmTest.messageId);
                    console.log('   - Token usado:', data.fcmTest.tokenUsed);
                } else {
                    console.log('   - Resultado: ❌ ERROR');
                    console.log('   - Código error:', data.fcmTest.error);
                    console.log('   - Mensaje:', data.fcmTest.message);
                }
            }
            
            console.log('\n🎯 CONCLUSIONES:');
            if (data.fcmTest && data.fcmTest.success) {
                console.log('✅ Firebase está funcionando correctamente en producción');
                console.log('🔍 El problema puede ser con tokens específicos');
            } else if (data.fcmTest && !data.fcmTest.success) {
                console.log('❌ Firebase tiene problemas en producción');
                console.log('🔧 Revisar configuración de credenciales');
                
                if (data.fcmTest.error === 'messaging/unknown-error') {
                    console.log('💡 Error 404 /batch detectado - problema de credenciales');
                }
            } else {
                console.log('⚠️  No se pudo probar FCM (sin tokens válidos)');
            }
            
        } else {
            console.log('❌ Error en diagnóstico:', response.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'GET' }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve(parsedData);
                } catch (e) {
                    console.log('Raw response:', data);
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.end();
    });
}

// Ejecutar diagnóstico
diagnosticarFirebaseProduccion().catch(console.error);
