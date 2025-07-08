#!/usr/bin/env node

/**
 * Script para verificar el estado de las credenciales Firebase actuales
 */

console.log('🔍 VERIFICACIÓN DE CREDENCIALES FIREBASE');
console.log('========================================');
console.log('');

// Verificar variables de entorno
const firebaseVars = {
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
    HAS_PRIVATE_KEY_BASE64: !!process.env.FIREBASE_PRIVATE_KEY_BASE64,
    CLIENT_ID: process.env.FIREBASE_CLIENT_ID
};

console.log('📋 VARIABLES DE ENTORNO:');
console.log('========================');

Object.entries(firebaseVars).forEach(([key, value]) => {
    if (key === 'HAS_PRIVATE_KEY_BASE64') {
        console.log(`   ${key}: ${value ? '✅ SÍ' : '❌ NO'}`);
    } else if (value) {
        const display = value.length > 50 ? `${value.substring(0, 50)}...` : value;
        console.log(`   ${key}: ${display}`);
    } else {
        console.log(`   ${key}: ❌ NO CONFIGURADA`);
    }
});

console.log('');

// Verificar formato de la clave privada si existe
if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
    try {
        const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
        const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8');
        
        console.log('🔑 ANÁLISIS DE CLAVE PRIVADA:');
        console.log('=============================');
        console.log(`   📏 Longitud Base64: ${privateKeyBase64.length} caracteres`);
        console.log(`   📄 Longitud decodificada: ${privateKey.length} caracteres`);
        console.log(`   🏁 Empieza con BEGIN: ${privateKey.startsWith('-----BEGIN') ? '✅' : '❌'}`);
        console.log(`   🔚 Termina con END: ${privateKey.endsWith('-----') ? '✅' : '❌'}`);
        console.log(`   🔤 Contiene PRIVATE KEY: ${privateKey.includes('PRIVATE KEY') ? '✅' : '❌'}`);
        
        // Mostrar primeros y últimos caracteres
        console.log(`   👀 Primeros 50 chars: ${privateKey.substring(0, 50)}`);
        console.log(`   👀 Últimos 30 chars: ${privateKey.substring(privateKey.length - 30)}`);
        
    } catch (error) {
        console.log('❌ ERROR AL DECODIFICAR CLAVE PRIVADA:');
        console.log(`   ${error.message}`);
    }
} else {
    console.log('❌ NO HAY CLAVE PRIVADA PARA ANALIZAR');
}

console.log('');

// Verificar inicialización de Firebase
try {
    const admin = require('firebase-admin');
    const isInitialized = admin.apps.length > 0;
    
    console.log('🔥 ESTADO DE FIREBASE:');
    console.log('======================');
    console.log(`   📊 Inicializado: ${isInitialized ? '✅' : '❌'}`);
    
    if (isInitialized) {
        const app = admin.app();
        console.log(`   📱 Apps activas: ${admin.apps.length}`);
        console.log(`   🏷️ Nombre de app: ${app.name}`);
    }
    
} catch (error) {
    console.log('❌ ERROR AL VERIFICAR FIREBASE:');
    console.log(`   ${error.message}`);
}

console.log('');

console.log('🎯 CONCLUSIONES:');
console.log('================');

const missingVars = Object.entries(firebaseVars)
    .filter(([key, value]) => !value && key !== 'CLIENT_ID')
    .map(([key]) => key);

if (missingVars.length > 0) {
    console.log('❌ Variables faltantes:');
    missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
    });
} else {
    console.log('✅ Todas las variables están configuradas');
}

console.log('');

console.log('🔧 PRÓXIMOS PASOS:');
console.log('==================');
console.log('1. 🔍 Si hay errores en la clave privada → Regenerar desde Firebase Console');
console.log('2. 🔄 Si variables faltan → Configurar en Render');
console.log('3. 🧪 Una vez corregido → Probar notificación');
console.log('4. 📱 Verificar que llegue al móvil');
