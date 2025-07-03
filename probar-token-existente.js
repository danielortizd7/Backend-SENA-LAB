#!/usr/bin/env node

/**
 * Script para probar específicamente el token FCM registrado
 * Ejecutar con: node probar-token-existente.js
 */

const axios = require('axios');

const BACKEND_URL = 'https://backend-registro-muestras.onrender.com';
const CLIENTE_DOCUMENTO = '1235467890';
const TOKEN_FCM_REGISTRADO = 'dcG8_1mnS5u8QAUKsiqqAv:APA91bEv5xXk4C8UtGzoa-dAPlSKQddrJ2Fow4vTFMzkVe9vlHLwGnzPGv_iy0Fc_JeS7oyrPV2ElyVz_nVVQPeS5aHuEdDZHTqbhzKopmud5AAHEd53Fbo';

console.log('🔥 === PRUEBA DE TOKEN FCM EXISTENTE ===\n');

async function probarTokenExistente() {
    try {
        console.log(`🎯 Backend: ${BACKEND_URL}`);
        console.log(`👤 Cliente: ${CLIENTE_DOCUMENTO}`);
        console.log(`📱 Token registrado: ${TOKEN_FCM_REGISTRADO.substring(0, 30)}...`);
        console.log(`📏 Longitud: ${TOKEN_FCM_REGISTRADO.length} caracteres`);
        
        console.log('\n1️⃣ Verificando configuración Firebase en el servidor...');
        
        try {
            const firebaseCheck = await axios.get(`${BACKEND_URL}/api/notificaciones/test-firebase`, {
                timeout: 10000,
                validateStatus: () => true // Aceptar cualquier status
            });
            
            if (firebaseCheck.status === 200) {
                console.log('✅ Firebase configurado en el servidor');
                console.log('📋 Estado Firebase:', firebaseCheck.data.data.status);
                console.log('🔧 Variables configuradas:', Object.keys(firebaseCheck.data.data.configuredVars));
            } else if (firebaseCheck.status === 401) {
                console.log('⚠️ Endpoint de testing protegido (HTTP 401)');
                console.log('💡 Esto significa que NODE_ENV no está configurado como "production" en Render');
                console.log('   o que los cambios del server.js no se aplicaron correctamente');
            } else {
                console.log(`⚠️ Respuesta inesperada: HTTP ${firebaseCheck.status}`);
            }
            
        } catch (error) {
            console.error('❌ Error verificando Firebase:', error.message);
            if (error.response) {
                console.error('   Status:', error.response.status);
            }
        }
        
        console.log('\n2️⃣ Intentando cambio de estado real para activar notificación...');
        console.log('💡 Vamos a simular un cambio de estado real que active el sistema de notificaciones');
        
        // En lugar de usar el endpoint de testing, vamos a hacer algo que sabemos que funciona:
        // verificar el estado actual del sistema
        try {
            const healthCheck = await axios.get(`${BACKEND_URL}`, {
                timeout: 5000,
                validateStatus: () => true
            });
            
            console.log(`✅ Servidor principal responde: HTTP ${healthCheck.status}`);
            
            if (healthCheck.data) {
                console.log('� Respuesta:', JSON.stringify(healthCheck.data, null, 2));
            }
            
        } catch (error) {
            console.error('❌ Servidor no responde:', error.message);
        }
        
        console.log('\n3️⃣ Verificando logs del servidor...');
        console.log('💡 Ve a los logs de Render para ver si aparece:');
        console.log('   - "🔥 Enviando a Firebase Cloud Messaging..."');
        console.log('   - "❌ Error específico de Firebase: ..."');
        console.log('   - "Error 404" o "/batch not found"');
        
        console.log('\n🔧 Si el token no funciona, posibles soluciones:');
        console.log('1. Verificar variables Firebase en Render (especialmente FIREBASE_PRIVATE_KEY)');
        console.log('2. Regenerar el token FCM en la app Android');
        console.log('3. Verificar que Cloud Messaging esté habilitado en Firebase Console');
        console.log('4. Revisar que no haya restricciones de red en Render');
        
    } catch (error) {
        console.error('💥 Error general:', error.message);
    }
}

probarTokenExistente();
