#!/usr/bin/env node

/**
 * Script para diagnosticar problemas específicos de Firebase
 * Ejecutar con: node diagnostico-firebase.js
 */

require('dotenv').config();
const admin = require('firebase-admin');

console.log('🔥 === DIAGNÓSTICO DE FIREBASE ===\n');

async function diagnosticarFirebase() {
    try {
        console.log('1️⃣ Verificando variables de entorno...');
        
        const requiredVars = [
            'FIREBASE_PROJECT_ID',
            'FIREBASE_PRIVATE_KEY',
            'FIREBASE_CLIENT_EMAIL',
            'FIREBASE_PRIVATE_KEY_ID',
            'FIREBASE_CLIENT_ID'
        ];
        
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.error(`❌ Variables faltantes: ${missingVars.join(', ')}`);
            return false;
        }
        
        console.log('✅ Todas las variables de Firebase presentes');
        console.log(`   Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
        console.log(`   Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);
        console.log(`   Private Key ID: ${process.env.FIREBASE_PRIVATE_KEY_ID}`);
        console.log(`   Client ID: ${process.env.FIREBASE_CLIENT_ID}`);
        console.log(`   Private Key: ${process.env.FIREBASE_PRIVATE_KEY ? 'Presente' : 'Faltante'}`);
        
        console.log('\n2️⃣ Inicializando Firebase Admin SDK...');
        
        if (admin.apps.length > 0) {
            console.log('🔄 Firebase ya inicializado, eliminando instancia...');
            admin.app().delete();
        }
        
        const serviceAccount = {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token"
        };
        
        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID
        });
        
        console.log('✅ Firebase Admin SDK inicializado');
        
        console.log('\n3️⃣ Probando conexión con Cloud Messaging...');
        
        // Probar con un token de prueba conocido como inválido
        const testToken = 'INVALID_TOKEN_FOR_TESTING_12345';
        
        try {
            const message = {
                notification: {
                    title: 'Test',
                    body: 'Mensaje de prueba'
                },
                data: {
                    test: 'true'
                },
                token: testToken
            };
            
            await admin.messaging().send(message);
            console.log('⚠️ Inesperado: El token de prueba funcionó (no debería)');
            
        } catch (testError) {
            console.log('✅ Firebase respondió al token de prueba (esperado)');
            console.log(`   Código de error: ${testError.code}`);
            console.log(`   Mensaje: ${testError.message}`);
            
            // Verificar si el error indica que Firebase está funcionando
            if (testError.code === 'messaging/invalid-registration-token' ||
                testError.code === 'messaging/registration-token-not-registered') {
                console.log('✅ Firebase Cloud Messaging está funcionando correctamente');
                return true;
            } else if (testError.message.includes('404') || testError.message.includes('/batch')) {
                console.error('❌ Error 404/batch - Problema con configuración Firebase');
                console.error('🔧 Verifica:');
                console.error('   1. Project ID es correcto en Firebase Console');
                console.error('   2. Cloud Messaging está habilitado');
                console.error('   3. Service Account tiene permisos correctos');
                return false;
            } else {
                console.error(`❌ Error inesperado: ${testError.message}`);
                return false;
            }
        }
        
    } catch (error) {
        console.error('💥 Error general:', error.message);
        console.error('🔍 Stack:', error.stack);
        return false;
    }
}

async function mostrarRecomendaciones() {
    console.log('\n' + '='.repeat(60));
    console.log('💡 RECOMENDACIONES:\n');
    
    console.log('🔧 Si tienes error 404/batch:');
    console.log('1. Ve a Firebase Console: https://console.firebase.google.com/');
    console.log('2. Selecciona proyecto "aqualab-83795"');
    console.log('3. Ve a Build → Cloud Messaging');
    console.log('4. Asegúrate de que esté habilitado');
    console.log('5. Verifica que el Project ID sea exactamente el mismo\n');
    
    console.log('📱 Para tokens FCM inválidos:');
    console.log('1. En tu app Android, regenera el token FCM');
    console.log('2. Registra el nuevo token usando el endpoint del backend');
    console.log('3. Prueba enviar notificación nuevamente\n');
    
    console.log('🔑 Para problemas de credenciales:');
    console.log('1. Descarga nuevamente el service account key');
    console.log('2. Actualiza las variables de entorno en Render');
    console.log('3. Redeploy el servicio');
}

async function main() {
    const success = await diagnosticarFirebase();
    await mostrarRecomendaciones();
    
    if (success) {
        console.log('\n✅ Firebase está configurado correctamente');
        console.log('💡 El problema probablemente son tokens FCM inválidos');
    } else {
        console.log('\n❌ Hay problemas con la configuración de Firebase');
    }
}

main();
