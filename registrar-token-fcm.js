#!/usr/bin/env node

/**
 * Script para registrar un token FCM real en el backend
 * Ejecutar con: node registrar-token-fcm.js "TU_TOKEN_FCM_AQUI"
 */

require('dotenv').config();
const axios = require('axios');

// Configuración
const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-registro-muestras.onrender.com';
const FCM_TOKEN = process.argv[2];

if (!FCM_TOKEN) {
    console.log('🔥 === REGISTRO DE TOKEN FCM ===\n');
    console.log('❌ Error: Token FCM requerido');
    console.log('\n📱 PASOS PARA OBTENER UN TOKEN FCM REAL:');
    console.log('');
    console.log('1️⃣ En tu app Android, agrega este código:');
    console.log('');
    console.log('   FirebaseMessaging.getInstance().getToken()');
    console.log('       .addOnCompleteListener(new OnCompleteListener<String>() {');
    console.log('           @Override');
    console.log('           public void onComplete(@NonNull Task<String> task) {');
    console.log('               if (!task.isSuccessful()) {');
    console.log('                   Log.w("FCM", "Fetching FCM registration token failed", task.getException());');
    console.log('                   return;');
    console.log('               }');
    console.log('');
    console.log('               // Get new FCM registration token');
    console.log('               String token = task.getResult();');
    console.log('               Log.d("FCM", "Token: " + token);');
    console.log('               Toast.makeText(MainActivity.this, "Token: " + token, Toast.LENGTH_LONG).show();');
    console.log('           }');
    console.log('       });');
    console.log('');
    console.log('2️⃣ Ejecuta la app y copia el token que aparece');
    console.log('');
    console.log('3️⃣ Luego ejecuta:');
    console.log('   node registrar-token-fcm.js "EL_TOKEN_QUE_COPIASTE"');
    console.log('');
    console.log('💡 También puedes usar el endpoint directamente:');
    console.log(`   POST ${BACKEND_URL}/api/notificaciones/register-device`);
    process.exit(1);
}

console.log('🔥 === REGISTRO DE TOKEN FCM ===\n');

async function registrarToken() {
    try {
        console.log(`🎯 Backend: ${BACKEND_URL}`);
        console.log(`📱 Token FCM: ${FCM_TOKEN.substring(0, 30)}...`);
        console.log(`📏 Longitud del token: ${FCM_TOKEN.length} caracteres`);
        
        // Validar que el token tenga formato FCM válido
        if (FCM_TOKEN.length < 140 || !FCM_TOKEN.includes(':')) {
            console.error('⚠️ ADVERTENCIA: El token no parece ser un token FCM válido');
            console.error('   Los tokens FCM reales tienen ~152+ caracteres y contienen ":"');
            console.error('   ¿Estás seguro de que este es un token real de Firebase?');
        }

        console.log('\n1️⃣ Primero vamos a autenticarnos...');
        
        // Primero hacer login para obtener JWT token
        const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
            documento: '1235467890', // Cliente de prueba
            password: 'password123' // Cambia por la contraseña real
        });
        
        if (loginResponse.data.success) {
            const jwtToken = loginResponse.data.token;
            console.log('✅ Autenticación exitosa');
            
            console.log('\n2️⃣ Registrando token FCM...');
            
            // Registrar el token FCM
            const registerResponse = await axios.post(
                `${BACKEND_URL}/api/notificaciones/register-device`,
                {
                    deviceToken: FCM_TOKEN,
                    platform: 'android',
                    deviceInfo: {
                        model: 'Manual Registration',
                        version: 'Script v1.0',
                        registeredAt: new Date().toISOString()
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${jwtToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (registerResponse.data.success) {
                console.log('✅ Token FCM registrado exitosamente!');
                console.log('\n📋 Detalles:');
                console.log(`   - ID del token: ${registerResponse.data.data.tokenId}`);
                console.log(`   - Plataforma: ${registerResponse.data.data.platform}`);
                console.log(`   - Estado: ${registerResponse.data.data.isActive ? 'Activo' : 'Inactivo'}`);
                
                console.log('\n3️⃣ Probando notificación...');
                
                // Probar enviando una notificación
                const testResponse = await axios.post(
                    `${BACKEND_URL}/api/notificaciones/test`,
                    {
                        titulo: 'Prueba de Token FCM',
                        mensaje: 'Si recibes esta notificación, el token funciona correctamente!',
                        data: { test: true }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${jwtToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (testResponse.data.success) {
                    console.log('✅ Notificación de prueba enviada!');
                    console.log('📱 Revisa tu dispositivo Android para ver si llegó la notificación');
                } else {
                    console.log('⚠️ Notificación registrada pero falló el envío de prueba');
                    console.log('   Esto es normal si el token no es válido o el dispositivo está offline');
                }
                
            } else {
                console.error('❌ Error registrando token:', registerResponse.data.message);
            }
            
        } else {
            console.error('❌ Error de autenticación:', loginResponse.data.message);
            console.error('\n🔧 Posibles soluciones:');
            console.error('1. Verifica que el usuario 1235467890 exista en la base de datos');
            console.error('2. Verifica que la contraseña sea correcta');
            console.error('3. Cambia las credenciales en el script si usas otras');
        }
        
    } catch (error) {
        console.error('💥 Error durante el registro:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
        
        console.error('\n🔧 Pasos para resolver:');
        console.error('1. Verifica que el backend esté funcionando');
        console.error('2. Verifica que el token FCM sea real y válido');
        console.error('3. Verifica las credenciales de login');
    }
}

registrarToken();
