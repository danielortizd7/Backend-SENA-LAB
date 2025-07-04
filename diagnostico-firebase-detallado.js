/**
 * DIAGNÓSTICO DETALLADO DE FIREBASE
 * Este script ayuda a identificar por qué las notificaciones FCM no llegan
 */

const admin = require('firebase-admin');
const axios = require('axios');

console.log('🔍 === DIAGNÓSTICO DETALLADO DE FIREBASE === 🔍');
console.log('=============================================');

// Cargar variables de entorno
require('dotenv').config();

const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_CLIENT_ID
};

console.log('\n📋 CONFIGURACIÓN FIREBASE:');
console.log('==========================');
console.log('✅ Project ID:', firebaseConfig.projectId);
console.log('✅ Private Key ID:', firebaseConfig.privateKeyId);
console.log('✅ Client Email:', firebaseConfig.clientEmail);
console.log('✅ Client ID:', firebaseConfig.clientId);
console.log('✅ Private Key Present:', !!firebaseConfig.privateKey);
console.log('✅ Private Key Length:', firebaseConfig.privateKey?.length || 0);

// Función para verificar si Firebase está inicializado
function verificarFirebaseAdmin() {
    console.log('\n🔧 VERIFICANDO FIREBASE ADMIN SDK:');
    console.log('===================================');
    
    try {
        // Verificar si ya está inicializado
        if (admin.apps.length === 0) {
            console.log('🔄 Inicializando Firebase Admin SDK...');
            admin.initializeApp({
                credential: admin.credential.cert(firebaseConfig),
                projectId: firebaseConfig.projectId
            });
            console.log('✅ Firebase Admin SDK inicializado exitosamente');
        } else {
            console.log('✅ Firebase Admin SDK ya está inicializado');
        }
        
        // Verificar la configuración
        const app = admin.app();
        console.log('✅ App Name:', app.name);
        console.log('✅ Project ID desde app:', app.options.projectId);
        
        return true;
    } catch (error) {
        console.log('❌ Error al inicializar Firebase Admin SDK:');
        console.log('   Error:', error.message);
        console.log('   Code:', error.code);
        return false;
    }
}

// Función para verificar el proyecto en Firebase Console
async function verificarProyectoFirebase() {
    console.log('\n🌐 VERIFICANDO PROYECTO EN FIREBASE:');
    console.log('====================================');
    
    try {
        // Verificar con Google Cloud API
        const projectId = firebaseConfig.projectId;
        const url = `https://firebase.googleapis.com/v1beta1/projects/${projectId}`;
        
        console.log('🔍 Verificando proyecto:', projectId);
        console.log('🔍 URL:', url);
        
        // Crear token de acceso
        const credential = admin.credential.cert(firebaseConfig);
        const accessToken = await credential.getAccessToken();
        
        console.log('✅ Token de acceso obtenido exitosamente');
        
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${accessToken.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Proyecto verificado exitosamente');
        console.log('✅ Display Name:', response.data.displayName);
        console.log('✅ Project Number:', response.data.projectNumber);
        
        return true;
    } catch (error) {
        console.log('❌ Error al verificar proyecto:');
        console.log('   Status:', error.response?.status);
        console.log('   Message:', error.response?.data?.error?.message || error.message);
        console.log('   Code:', error.response?.data?.error?.code || error.code);
        
        if (error.response?.status === 404) {
            console.log('🚨 PROBLEMA: El proyecto no existe o no tienes permisos');
        } else if (error.response?.status === 403) {
            console.log('🚨 PROBLEMA: No tienes permisos para acceder al proyecto');
        }
        
        return false;
    }
}

// Función para verificar Cloud Messaging
async function verificarCloudMessaging() {
    console.log('\n📱 VERIFICANDO CLOUD MESSAGING:');
    console.log('===============================');
    
    try {
        const projectId = firebaseConfig.projectId;
        const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
        
        console.log('🔍 Verificando FCM endpoint:', url);
        
        // Crear token de acceso
        const credential = admin.credential.cert(firebaseConfig);
        const accessToken = await credential.getAccessToken();
        
        // Intentar enviar un mensaje de prueba (fallará pero nos dirá si el endpoint existe)
        const testMessage = {
            message: {
                token: 'test-token-invalid',
                notification: {
                    title: 'Test',
                    body: 'Test'
                }
            }
        };
        
        const response = await axios.post(url, testMessage, {
            headers: {
                'Authorization': `Bearer ${accessToken.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ FCM endpoint accesible');
        return true;
        
    } catch (error) {
        console.log('🔍 Respuesta del FCM endpoint:');
        console.log('   Status:', error.response?.status);
        console.log('   Error:', error.response?.data?.error?.message || error.message);
        
        if (error.response?.status === 400) {
            console.log('✅ FCM endpoint funciona (error 400 es esperado con token inválido)');
            return true;
        } else if (error.response?.status === 404) {
            console.log('❌ FCM endpoint no encontrado - Cloud Messaging no habilitado');
            return false;
        } else {
            console.log('❌ Error inesperado en FCM endpoint');
            return false;
        }
    }
}

// Función para probar envío real con token válido
async function probarEnvioReal() {
    console.log('\n🚀 PROBANDO ENVÍO REAL:');
    console.log('=======================');
    
    try {
        // Token de prueba (debes reemplazarlo con uno real)
        const testToken = 'fH13KRXaQjC4GjV5Ye_r...'; // Token parcial del log
        
        console.log('🔍 Usando token de prueba:', testToken);
        
        const message = {
            notification: {
                title: '🔍 Prueba de Diagnóstico',
                body: 'Este es un mensaje de prueba para verificar FCM'
            },
            data: {
                tipo: 'diagnostico',
                timestamp: new Date().toISOString()
            },
            token: testToken
        };
        
        const response = await admin.messaging().send(message);
        console.log('✅ Mensaje enviado exitosamente:', response);
        
        return true;
    } catch (error) {
        console.log('❌ Error al enviar mensaje:');
        console.log('   Error:', error.message);
        console.log('   Code:', error.code);
        console.log('   Details:', error.details || 'No details');
        
        // Analizar el error
        if (error.code === 'messaging/registration-token-not-registered') {
            console.log('💡 El token FCM no es válido o ha expirado');
        } else if (error.code === 'messaging/invalid-registration-token') {
            console.log('💡 El formato del token FCM es inválido');
        } else if (error.code === 'messaging/unknown-error') {
            console.log('💡 Error desconocido - posible problema de configuración');
        }
        
        return false;
    }
}

// Función principal
async function ejecutarDiagnostico() {
    console.log('🚀 Iniciando diagnóstico completo...\n');
    
    let pasosPasados = 0;
    const totalPasos = 4;
    
    // Paso 1: Verificar Firebase Admin SDK
    if (verificarFirebaseAdmin()) {
        pasosPasados++;
        console.log(`✅ Paso 1/${totalPasos} completado`);
    } else {
        console.log(`❌ Paso 1/${totalPasos} falló - No se puede continuar`);
        return;
    }
    
    // Paso 2: Verificar proyecto
    if (await verificarProyectoFirebase()) {
        pasosPasados++;
        console.log(`✅ Paso 2/${totalPasos} completado`);
    } else {
        console.log(`❌ Paso 2/${totalPasos} falló`);
    }
    
    // Paso 3: Verificar Cloud Messaging
    if (await verificarCloudMessaging()) {
        pasosPasados++;
        console.log(`✅ Paso 3/${totalPasos} completado`);
    } else {
        console.log(`❌ Paso 3/${totalPasos} falló`);
    }
    
    // Paso 4: Probar envío real
    if (await probarEnvioReal()) {
        pasosPasados++;
        console.log(`✅ Paso 4/${totalPasos} completado`);
    } else {
        console.log(`❌ Paso 4/${totalPasos} falló`);
    }
    
    // Resumen final
    console.log('\n🎯 RESUMEN DEL DIAGNÓSTICO:');
    console.log('===========================');
    console.log(`✅ Pasos completados: ${pasosPasados}/${totalPasos}`);
    console.log(`❌ Pasos fallidos: ${totalPasos - pasosPasados}/${totalPasos}`);
    
    if (pasosPasados === totalPasos) {
        console.log('🎉 ¡Todos los pasos completados! FCM debería funcionar correctamente.');
    } else {
        console.log('\n💡 RECOMENDACIONES:');
        console.log('===================');
        
        if (pasosPasados < 2) {
            console.log('1. Verifica que el proyecto "aqualab-83795" existe en Firebase Console');
            console.log('2. Verifica que las credenciales son correctas');
            console.log('3. Considera crear un nuevo proyecto Firebase');
        }
        
        if (pasosPasados < 3) {
            console.log('4. Habilita Cloud Messaging en Firebase Console');
            console.log('5. Verifica la configuración de FCM');
        }
        
        if (pasosPasados < 4) {
            console.log('6. Regenera el token FCM en la aplicación Android');
            console.log('7. Verifica que el token está actualizado');
        }
    }
}

// Ejecutar diagnóstico
ejecutarDiagnostico().catch(console.error);
