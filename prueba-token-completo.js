/**
 * PRUEBA DIRECTA CON TOKEN COMPLETO
 * Prueba el token FCM directamente usando Firebase Admin SDK
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Token completo desde la base de datos
const TOKEN_COMPLETO = "cA-mT5H_Sy2m371lXP9xkY:APA91bEmiLq4ugDx-DpNgk_4Lzz088jrNgkJJ9K6oqAv_bOy26tJ3Jft24Qs2R0Bh0t5P47r9DI2LVefbozuMZF3DHlb3TyU6IiVJJEqBsh8HuImlmtbKb4";

console.log('🚀 === PRUEBA DIRECTA CON TOKEN COMPLETO ===');
console.log('===========================================');

// Configurar Firebase si no está inicializado
if (admin.apps.length === 0) {
    const firebaseConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID
    };

    admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
        projectId: firebaseConfig.projectId
    });
    
    console.log('✅ Firebase Admin SDK inicializado');
} else {
    console.log('✅ Firebase Admin SDK ya inicializado');
}

// Función para probar el token
async function probarTokenDirecto() {
    console.log('\n📱 INFORMACIÓN DEL TOKEN:');
    console.log('=========================');
    console.log('🔑 Token (primeros 30 chars):', TOKEN_COMPLETO.substring(0, 30) + '...');
    console.log('📏 Longitud del token:', TOKEN_COMPLETO.length);
    console.log('🔍 Formato válido:', TOKEN_COMPLETO.includes(':APA91b') ? '✅ Sí' : '❌ No');
    
    try {
        console.log('\n🚀 ENVIANDO NOTIFICACIÓN DE PRUEBA:');
        console.log('===================================');
        
        const message = {
            notification: {
                title: '🎉 ¡Prueba Exitosa!',
                body: 'Las notificaciones FCM están funcionando correctamente con el token completo.'
            },
            data: {
                tipo: 'prueba_directa',
                timestamp: new Date().toISOString(),
                clienteDocumento: '1235467890'
            },
            token: TOKEN_COMPLETO
        };
        
        console.log('📤 Enviando mensaje...');
        const response = await admin.messaging().send(message);
        
        console.log('✅ ¡MENSAJE ENVIADO EXITOSAMENTE!');
        console.log('📋 Response ID:', response);
        console.log('🎯 Revisa tu dispositivo Android ahora');
        
        return true;
        
    } catch (error) {
        console.log('❌ ERROR AL ENVIAR MENSAJE:');
        console.log('===========================');
        console.log('🔍 Error Code:', error.code);
        console.log('🔍 Error Message:', error.message);
        
        // Análisis detallado del error
        if (error.code === 'messaging/registration-token-not-registered') {
            console.log('\n💡 DIAGNÓSTICO:');
            console.log('- El token FCM no está registrado o ha expirado');
            console.log('- Regenera el token en la aplicación Android');
            console.log('- Verifica que la aplicación esté conectada a Internet');
            
        } else if (error.code === 'messaging/invalid-argument') {
            console.log('\n💡 DIAGNÓSTICO:');
            console.log('- El token tiene un formato inválido');
            console.log('- Verifica que el token esté completo y correcto');
            
        } else if (error.code === 'messaging/invalid-registration-token') {
            console.log('\n💡 DIAGNÓSTICO:');
            console.log('- El token FCM es inválido');
            console.log('- Regenera el token en la aplicación Android');
            
        } else if (error.code === 'messaging/unknown-error') {
            console.log('\n💡 DIAGNÓSTICO:');
            console.log('- Error desconocido de Firebase');
            console.log('- Posible problema con las credenciales o configuración');
            console.log('- Verifica la configuración del proyecto Firebase');
            
        } else {
            console.log('\n💡 DIAGNÓSTICO:');
            console.log('- Error no documentado:', error.code);
            console.log('- Detalles:', error.details || 'No hay detalles adicionales');
        }
        
        return false;
    }
}

// Función para verificar configuración
function verificarConfiguracion() {
    console.log('\n🔧 VERIFICANDO CONFIGURACIÓN:');
    console.log('=============================');
    
    const config = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
    };
    
    Object.entries(config).forEach(([key, value]) => {
        if (value) {
            if (key === 'privateKey') {
                console.log(`✅ ${key}: Presente (${value.length} chars)`);
            } else {
                console.log(`✅ ${key}: ${value}`);
            }
        } else {
            console.log(`❌ ${key}: FALTANTE`);
        }
    });
}

// Ejecutar prueba
async function ejecutarPrueba() {
    verificarConfiguracion();
    
    console.log('\n🚀 Iniciando prueba directa...');
    const exito = await probarTokenDirecto();
    
    if (exito) {
        console.log('\n🎉 ¡PRUEBA EXITOSA!');
        console.log('==================');
        console.log('✅ Token FCM válido y funcional');
        console.log('✅ Firebase configurado correctamente');
        console.log('✅ Notificación enviada exitosamente');
        console.log('📱 Deberías ver la notificación en tu dispositivo Android');
    } else {
        console.log('\n❌ PRUEBA FALLIDA');
        console.log('================');
        console.log('🔧 Revisa los diagnósticos mostrados arriba');
        console.log('🔧 Considera regenerar el token FCM');
    }
}

ejecutarPrueba().catch(console.error);
