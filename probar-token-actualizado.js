#!/usr/bin/env node

/**
 * Script para probar token FCM después de actualizar google-services.json
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🎯 === PRUEBA TOKEN FCM ACTUALIZADO ===\n');
console.log('📱 Información del proyecto:');
console.log('   Project ID: aqualab-83795');
console.log('   Package Name: com.example.laboratoriodeagua');
console.log('   App ID: 1:177401135546:android:ca24acc80c4ed8b5c35d83\n');

console.log('📌 PASOS REALIZADOS:');
console.log('✅ google-services.json actualizado');
console.log('✅ Project ID correcto: aqualab-83795');
console.log('✅ Package name identificado: com.example.laboratoriodeagua\n');

console.log('🔄 PRÓXIMO PASO:');
console.log('1. Reemplaza google-services.json en tu proyecto Android');
console.log('2. Haz clean y rebuild del proyecto');
console.log('3. Genera un nuevo token FCM');
console.log('4. Copia el token y pégalo aquí para probarlo\n');

rl.question('📱 Ingresa el nuevo token FCM: ', (token) => {
    if (!token || token.trim().length < 10) {
        console.log('❌ Token inválido. Debe tener al menos 10 caracteres.');
        rl.close();
        return;
    }

    console.log('\n🧪 Probando token FCM...');
    probarToken(token.trim());
});

async function probarToken(token) {
    try {
        const response = await axios.post('https://backend-registro-muestras.onrender.com/api/notificaciones-test/local', {
            deviceToken: token,
            titulo: '🎉 TOKEN ACTUALIZADO',
            mensaje: `Token generado después de actualizar google-services.json - ${new Date().toLocaleTimeString()}`
        }, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ RESPUESTA DEL SERVIDOR:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('\n🎉 ¡ÉXITO! Notificación enviada correctamente');
            console.log('📱 Verifica tu dispositivo Android AHORA');
            console.log('🔍 También revisa los logs en Android Studio (Logcat)');
        } else {
            console.log('\n⚠️ Error en la respuesta del servidor');
        }

    } catch (error) {
        console.error('\n❌ Error al probar token:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        } else {
            console.error(`Error: ${error.message}`);
        }
    }
    
    rl.close();
}

// Información adicional
console.log('💡 TIPS:');
console.log('- El token debe empezar con letras/números seguido de dos puntos');
console.log('- Ejemplo: eWuvUDe6Thmoh17v6Fmr4E:APA91bG_N_IY...');
console.log('- Si no sabes cómo obtener el token, revisa SOLUCION-ANDROID-NOTIFICACIONES.md\n');
