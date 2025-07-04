/**
 * PROBAR REGISTRO DE TOKEN COMPLETO EN PRODUCCIÓN
 * Script para enviar un token completo a producción y verificar si se trunca
 */

const https = require('https');

const RENDER_URL = 'https://backend-registro-muestras.onrender.com';

async function probarTokenCompleto() {
    try {
        console.log('🔍 === PROBANDO TOKEN COMPLETO EN PRODUCCIÓN ===');
        console.log('===============================================');
        
        // Token completo conocido de prueba (de Felipe local)
        const tokenCompleto = 'clxt-wClQo6EsGVzopfQAA:APA91bE0Mb3BPfhiYf3uPP0tKxxvFcq03ydMIAhzFQ3WC21AIcr3fo5wh0ra7IRStVDU86Q_i0Gd0areMPd9uqbVLsYadReYL_r_OOMg9ir9NPCbHi0Ze9c';
        
        console.log('📋 Token a enviar:');
        console.log('   - Longitud:', tokenCompleto.length);
        console.log('   - Inicio:', tokenCompleto.substring(0, 30));
        console.log('   - Final:', tokenCompleto.substring(tokenCompleto.length - 30));
        console.log('   - Formato válido:', tokenCompleto.includes(':APA91b') ? '✅ Sí' : '❌ No');
        
        // Datos para el registro
        const datosRegistro = {
            token: tokenCompleto,
            clienteDocumento: 'TEST-COMPLETO-123',
            platform: 'android'
        };
        
        console.log('\n📤 Enviando token completo a producción...');
        
        const response = await makePostRequest(
            `${RENDER_URL}/api/notifications/registrar-token`,
            datosRegistro
        );
        
        if (response.success) {
            console.log('✅ Token registrado exitosamente en producción');
            console.log('📋 Respuesta:', response.message);
            
            // Esperar un poco para que se guarde
            console.log('\n⏳ Esperando 3 segundos para verificar...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Ahora probar enviar una notificación de prueba
            console.log('\n📱 Probando envío de notificación...');
            
            const notificacionData = {
                deviceToken: tokenCompleto
            };
            
            const testResponse = await makePostRequest(
                `${RENDER_URL}/api/notifications/probar-token`,
                notificacionData
            );
            
            if (testResponse.success) {
                console.log('✅ Notificación enviada exitosamente');
                console.log('📋 Respuesta:', testResponse.message);
            } else {
                console.log('❌ Error enviando notificación:', testResponse.message);
                console.log('🔍 Detalles:', testResponse.error);
            }
            
        } else {
            console.log('❌ Error registrando token:', response.message);
            console.log('🔍 Detalles:', response.error);
        }
        
        console.log('\n🎯 === ANÁLISIS ===');
        console.log('==================');
        console.log('📊 Este test verificará si:');
        console.log('   1. El token completo llega a producción');
        console.log('   2. Se guarda correctamente en la base de datos');
        console.log('   3. Se puede usar para enviar notificaciones');
        console.log('   4. Los logs muestran el token completo o truncado');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

function makePostRequest(url, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length,
                'User-Agent': 'Test-Token-Complete'
            }
        };
        
        const req = https.request(url, options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve(parsedData);
                } catch (e) {
                    console.log('Raw response:', responseData);
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

// Ejecutar prueba
probarTokenCompleto().catch(console.error);
