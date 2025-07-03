#!/usr/bin/env node

/**
 * Script para diagnosticar problemas específicos de Firebase FCM
 * Ejecutar con: node diagnosticar-firebase.js
 */

require('dotenv').config();
const admin = require('firebase-admin');

console.log('🔥 === DIAGNÓSTICO DE FIREBASE FCM ===\n');

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
        
        console.log('✅ Variables de entorno presentes');
        console.log(`   Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
        console.log(`   Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);
        console.log(`   Private Key ID: ${process.env.FIREBASE_PRIVATE_KEY_ID}`);
        console.log(`   Client ID: ${process.env.FIREBASE_CLIENT_ID}`);
        console.log(`   Private Key: ${process.env.FIREBASE_PRIVATE_KEY ? 'Presente' : 'Faltante'}`);
        
        console.log('\n2️⃣ Inicializando Firebase Admin SDK...');
        
        // Configurar Firebase
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
        
        console.log('🔧 Service Account configurado');
        
        // Inicializar Firebase
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        }
        
        console.log('✅ Firebase Admin SDK inicializado');
        
        console.log('\n3️⃣ Probando conexión a FCM...');
        
        // Crear un mensaje de prueba con token dummy
        const testMessage = {
            notification: {
                title: 'Test',
                body: 'Prueba de conectividad FCM'
            },
            data: {
                test: 'true'
            },
            token: 'dummy_token_for_connection_test'
        };
        
        try {
            await admin.messaging().send(testMessage);
            console.log('✅ Conexión a FCM exitosa');
        } catch (fcmError) {
            console.log('⚠️ Error esperado con token dummy:', fcmError.code);
            
            if (fcmError.code === 'messaging/invalid-registration-token') {
                console.log('✅ Firebase funciona correctamente (error esperado con token dummy)');
            } else if (fcmError.code === 'messaging/project-not-found') {
                console.log('❌ Error: Proyecto Firebase no encontrado');
                console.log('   Verifica que FIREBASE_PROJECT_ID sea correcto');
                return false;
            } else if (fcmError.code === 'messaging/invalid-credential') {
                console.log('❌ Error: Credenciales inválidas');
                console.log('   Verifica que las credenciales de Firebase sean correctas');
                return false;
            } else {
                console.log('❌ Error inesperado de FCM:', fcmError.message);
                console.log('   Código:', fcmError.code);
                return false;
            }
        }
        
        console.log('\n4️⃣ Verificando formato de clave privada...');
        
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey.includes('\\n')) {
            console.log('⚠️ Clave privada contiene \\n literales');
            console.log('   Esto puede causar problemas en algunos entornos');
        }
        
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
            console.log('❌ Formato de clave privada incorrecto');
            console.log('   Debe comenzar con -----BEGIN PRIVATE KEY-----');
            return false;
        }
        
        console.log('✅ Formato de clave privada correcto');
        
        return true;
        
    } catch (error) {
        console.error('💥 Error durante el diagnóstico:', error.message);
        console.error('   Stack:', error.stack);
        return false;
    }
}

async function mostrarSolucion() {
    console.log('\n' + '='.repeat(60));
    console.log('🛠️ POSIBLES SOLUCIONES AL ERROR 404:\n');
    
    console.log('1️⃣ REGENERAR CREDENCIALES FIREBASE:');
    console.log('   • Ve a Firebase Console: https://console.firebase.google.com');
    console.log('   • Selecciona tu proyecto: aqualab-83795');
    console.log('   • Ve a Project Settings > Service Accounts');
    console.log('   • Genera nueva clave privada');
    console.log('   • Actualiza las variables en Render\n');
    
    console.log('2️⃣ VERIFICAR PROYECTO FCM:');
    console.log('   • Asegúrate de que el proyecto tenga Cloud Messaging habilitado');
    console.log('   • Ve a Firebase Console > Cloud Messaging');
    console.log('   • Verifica que esté configurado correctamente\n');
    
    console.log('3️⃣ OBTENER TOKEN FCM REAL:');
    console.log('   • El token actual parece ser inválido o expirado');
    console.log('   • Genera un nuevo token desde tu app Android');
    console.log('   • Usa ese token real para probar las notificaciones\n');
    
    console.log('4️⃣ CONFIGURACIÓN EN RENDER:');
    console.log('   • Verifica que todas las variables FIREBASE_* estén configuradas');
    console.log('   • La clave privada debe estar entre comillas dobles');
    console.log('   • Ejemplo: FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n..."');
}

async function main() {
    const success = await diagnosticarFirebase();
    await mostrarSolucion();
    
    if (success) {
        console.log('\n✅ DIAGNÓSTICO COMPLETADO - Firebase configurado correctamente');
        console.log('🔍 El error 404 probablemente se debe a tokens FCM inválidos');
    } else {
        console.log('\n❌ DIAGNÓSTICO FALLIDO - Hay problemas con la configuración Firebase');
    }
}

main();
