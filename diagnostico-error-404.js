#!/usr/bin/env node

/**
 * Script para diagnosticar específicamente el error 404/batch de Firebase
 */

require('dotenv').config();

console.log('🔥 === DIAGNÓSTICO ERROR 404/BATCH FIREBASE ===\n');

async function diagnosticarError404() {
    console.log('📋 Variables Firebase actuales:');
    console.log(`   PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID || 'NO CONFIGURADO'}`);
    console.log(`   CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL || 'NO CONFIGURADO'}`);
    console.log(`   PRIVATE_KEY_ID: ${process.env.FIREBASE_PRIVATE_KEY_ID || 'NO CONFIGURADO'}`);
    console.log(`   HAS_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? 'SÍ' : 'NO'}`);
    
    if (process.env.FIREBASE_PRIVATE_KEY) {
        const key = process.env.FIREBASE_PRIVATE_KEY;
        console.log(`   PRIVATE_KEY_LENGTH: ${key.length} caracteres`);
        console.log(`   STARTS_WITH: ${key.substring(0, 30)}...`);
        console.log(`   HAS_BEGIN_MARKER: ${key.includes('-----BEGIN PRIVATE KEY-----') ? 'SÍ' : 'NO'}`);
        console.log(`   HAS_END_MARKER: ${key.includes('-----END PRIVATE KEY-----') ? 'SÍ' : 'NO'}`);
    }

    console.log('\n🔍 ANÁLISIS DEL ERROR 404/BATCH:');
    console.log('Este error específico indica que Firebase está rechazando la request');
    console.log('Causas más comunes:');
    console.log('');
    console.log('1️⃣ PROJECT_ID INCORRECTO:');
    console.log('   ✓ Verificar en Firebase Console que sea exactamente "aqualab-83795"');
    console.log('');
    console.log('2️⃣ SERVICE ACCOUNT SIN PERMISOS FCM:');
    console.log('   ✓ Ve a Firebase Console → Project Settings → Service Accounts');
    console.log('   ✓ Verifica que firebase-adminsdk-fbsvc@aqualab-83795.iam.gserviceaccount.com esté presente');
    console.log('   ✓ Genera una nueva clave si es necesario');
    console.log('');
    console.log('3️⃣ CLOUD MESSAGING NO HABILITADO:');
    console.log('   ✓ Ve a Firebase Console → Build → Cloud Messaging');
    console.log('   ✓ Asegúrate de que "Firebase Cloud Messaging API (V1)" esté habilitado');
    console.log('');
    console.log('4️⃣ PRIVATE_KEY MAL FORMATEADA EN RENDER:');
    console.log('   ✓ En Render, la FIREBASE_PRIVATE_KEY debe tener exactamente este formato:');
    console.log('   -----BEGIN PRIVATE KEY-----\\nMII...CONTENIDO...E=\\n-----END PRIVATE KEY-----\\n');
    console.log('   ✓ IMPORTANTE: Los \\n deben ser literales, no saltos de línea reales');

    console.log('\n🛠️ SOLUCIÓN RECOMENDADA:');
    console.log('1. Ve a Firebase Console → Project Settings → Service Accounts');
    console.log('2. Haz clic en "Generate new private key"');
    console.log('3. Descarga el archivo JSON');
    console.log('4. Copia EXACTAMENTE los valores del JSON a las variables de entorno en Render');
    console.log('5. Para FIREBASE_PRIVATE_KEY, reemplaza los saltos de línea reales con \\n');

    console.log('\n💡 VERIFICACIÓN RÁPIDA:');
    console.log('Si tu FIREBASE_PRIVATE_KEY en Render se ve así:');
    console.log('-----BEGIN PRIVATE KEY-----');
    console.log('MIIEvQ...');
    console.log('-----END PRIVATE KEY-----');
    console.log('');
    console.log('Cámbialo a esto:');
    console.log('-----BEGIN PRIVATE KEY-----\\nMIIEvQ...\\n-----END PRIVATE KEY-----\\n');
}

diagnosticarError404();
