#!/usr/bin/env node

/**
 * DIAGNÓSTICO PARA ERROR 404 DE FIREBASE CLOUD MESSAGING
 * 
 * Este script ayuda a diagnosticar y solucionar el error 404 cuando
 * Firebase intenta enviar notificaciones push.
 */

const fetch = require('node-fetch');

async function diagnosticarError404FCM() {
    console.log('🚨 === DIAGNÓSTICO ERROR 404 FCM ===\n');
    
    // 1. Verificar variables de entorno
    console.log('1️⃣ Verificando variables de entorno...');
    const requiredVars = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_PRIVATE_KEY_ID',
        'FIREBASE_PRIVATE_KEY'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.log('❌ Variables faltantes:', missingVars);
        return;
    }
    
    console.log('✅ Todas las variables de entorno están configuradas');
    console.log(`📋 Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
    console.log(`📋 Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);
    
    // 2. Verificar URL de FCM
    console.log('\n2️⃣ Verificando URL de FCM...');
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    console.log(`🔗 URL FCM: ${fcmUrl}`);
    
    // 3. Verificar si FCM API está habilitada
    console.log('\n3️⃣ Verificando si FCM API está habilitada...');
    console.log('📍 Para habilitar FCM API, ve a:');
    console.log(`🔗 https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=${projectId}`);
    
    // 4. Probar endpoint del backend
    console.log('\n4️⃣ Probando endpoint de diagnóstico...');
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const diagnosticUrl = `${backendUrl}/api/notificaciones/diagnostico-error-404`;
    
    try {
        console.log(`🔍 Probando: ${diagnosticUrl}`);
        const response = await fetch(diagnosticUrl);
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Diagnóstico exitoso');
        } else {
            console.log('❌ Error en diagnóstico:', data.message);
            if (data.data && data.data.solution) {
                console.log('\n💡 Solución sugerida:');
                data.data.solution.forEach(step => console.log(`   ${step}`));
            }
        }
    } catch (error) {
        console.log('❌ Error conectando al backend:', error.message);
    }
    
    // 5. Guía de solución
    console.log('\n5️⃣ GUÍA DE SOLUCIÓN:');
    console.log('───────────────────────');
    console.log('🔧 Paso 1: Habilitar FCM API');
    console.log(`   URL: https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=${projectId}`);
    console.log('   Acción: Haz click en "HABILITAR"');
    console.log('');
    console.log('🔧 Paso 2: Verificar credenciales');
    console.log('   - Descarga un nuevo service account key desde Firebase Console');
    console.log('   - Actualiza las variables de entorno en .env');
    console.log('');
    console.log('🔧 Paso 3: Esperar propagación (5-10 minutos)');
    console.log('');
    console.log('🔧 Paso 4: Probar nuevamente');
    console.log(`   URL: ${backendUrl}/api/notificaciones/prueba-local`);
    
    console.log('\n🚨 === FIN DEL DIAGNÓSTICO ===');
}

// Ejecutar diagnóstico
if (require.main === module) {
    require('dotenv').config();
    diagnosticarError404FCM().catch(console.error);
}

module.exports = { diagnosticarError404FCM };
