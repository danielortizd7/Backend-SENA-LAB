/**
 * PROBAR VALIDACIÓN DE TOKENS
 * Script para probar la validación de tokens FCM
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function probarValidacionTokens() {
    try {
        console.log('🔍 === PROBANDO VALIDACIÓN DE TOKENS FCM ===');
        console.log('=============================================');
        
        // 1. Probar token incompleto
        console.log('\n📋 1. Probando token incompleto...');
        const tokenIncompleto = 'fIRcsE-HT8SNvFwfv5CE';
        
        try {
            const response1 = await axios.post(`${BASE_URL}/api/notifications/registrar-token`, {
                token: tokenIncompleto,
                clienteDocumento: 'TEST-INCOMPLETO',
                platform: 'android'
            });
            console.log('❌ ERROR: Token incompleto fue aceptado');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Token incompleto correctamente rechazado');
                console.log('📋 Mensaje:', error.response.data.message);
                console.log('📊 Longitud:', error.response.data.data.tokenLength);
            } else {
                console.log('❌ Error inesperado:', error.message);
            }
        }
        
        // 2. Probar token con formato inválido
        console.log('\n📋 2. Probando token con formato inválido...');
        const tokenFormatoInvalido = 'este-es-un-token-fake-muy-largo-pero-sin-formato-correcto-que-deberia-ser-rechazado-por-el-sistema-de-validacion-porque-no-tiene-el-formato-correcto-de-fcm';
        
        try {
            const response2 = await axios.post(`${BASE_URL}/api/notifications/registrar-token`, {
                token: tokenFormatoInvalido,
                clienteDocumento: 'TEST-FORMATO',
                platform: 'android'
            });
            console.log('❌ ERROR: Token con formato inválido fue aceptado');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Token con formato inválido correctamente rechazado');
                console.log('📋 Mensaje:', error.response.data.message);
            } else {
                console.log('❌ Error inesperado:', error.message);
            }
        }
        
        // 3. Probar token válido
        console.log('\n📋 3. Probando token válido...');
        const tokenValido = 'clxt-wClQo6EsGVzopfQAA:APA91bE0Mb3BPfhiYf3uPP0tKxxvFcq03ydMIAhzFQ3WC21AIcr3fo5wh0ra7IRStVDU86Q_i0Gd0areMPd9uqbVLsYadReYL_r_OOMg9ir9NPCbHi0Ze9c';
        
        try {
            const response3 = await axios.post(`${BASE_URL}/api/notifications/registrar-token`, {
                token: tokenValido,
                clienteDocumento: 'TEST-VALIDO',
                platform: 'android'
            });
            console.log('✅ Token válido correctamente aceptado');
            console.log('📋 Mensaje:', response3.data.message);
        } catch (error) {
            if (error.response) {
                console.log('❌ Token válido fue rechazado:', error.response.data.message);
            } else {
                console.log('❌ Error de conexión:', error.message);
            }
        }
        
        console.log('\n🎯 === CONCLUSIONES ===');
        console.log('======================');
        console.log('✅ La validación debe:');
        console.log('   - Rechazar tokens < 140 caracteres');
        console.log('   - Rechazar tokens sin ":APA91b"');
        console.log('   - Aceptar tokens válidos');
        console.log('   - Mostrar mensajes informativos');
        console.log('');
        console.log('🚀 Después de implementar esta validación:');
        console.log('   - Desplegar a producción');
        console.log('   - Los tokens incompletos serán rechazados');
        console.log('   - Los usuarios tendrán que regenerar tokens válidos');
        console.log('   - Las notificaciones funcionarán correctamente');
        
    } catch (error) {
        console.error('❌ Error en las pruebas:', error.message);
    }
}

// Ejecutar pruebas
probarValidacionTokens().catch(console.error);
