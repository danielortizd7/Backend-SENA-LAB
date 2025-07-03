#!/usr/bin/env node

/**
 * DIAGNÓSTICO SIMPLE PARA VERIFICAR POR QUÉ NO LLEGAN LAS NOTIFICACIONES
 */

const fetch = require('node-fetch');

async function diagnosticarProblemaNotificaciones() {
    console.log('🔍 === DIAGNÓSTICO: ¿POR QUÉ NO LLEGAN LAS NOTIFICACIONES? ===\n');
    
    const token = 'f02DbwReS3SDT7on2SRu-0:APA91bGdqjSOiBvWV3x3aT021BfPyCASsJ9pRpN1UxhIPSAPgq6H9sw3VCQvdSPQpOSg4lYuwQWQvJOMUkpE_OF5b5wOAW0OSnUlDu_zkbfIDdF-42XOSFA';
    const backendUrl = 'http://localhost:5000';
    
    console.log('1️⃣ VERIFICANDO BACKEND...');
    
    try {
        // Verificar FCM API
        const fcmResponse = await fetch(`${backendUrl}/api/notificaciones-test/fcm-api`);
        const fcmData = await fcmResponse.json();
        
        if (fcmData.success) {
            console.log('✅ FCM API funciona correctamente');
        } else {
            console.log('❌ Problema con FCM API:', fcmData.message);
            return;
        }
        
        // Enviar notificación de prueba
        console.log('\n2️⃣ ENVIANDO NOTIFICACIÓN DE PRUEBA...');
        const notifResponse = await fetch(`${backendUrl}/api/notificaciones-test/probar-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deviceToken: token,
                titulo: '🧪 DIAGNÓSTICO',
                mensaje: 'Si recibes esto, el backend funciona correctamente'
            })
        });
        
        const notifData = await notifResponse.json();
        
        if (notifData.success) {
            console.log('✅ Backend envió la notificación correctamente');
            console.log(`📱 Message ID: ${notifData.data.messageId}`);
            console.log('\n3️⃣ ANÁLISIS DEL PROBLEMA:');
            console.log('───────────────────────────────');
            console.log('🎯 CONCLUSIÓN: El backend funciona perfectamente');
            console.log('');
            console.log('❗ EL PROBLEMA ESTÁ EN LA APP ANDROID:');
            console.log('');
            console.log('🔧 PASOS PARA SOLUCIONARLO:');
            console.log('');
            console.log('1. 📱 PERMISOS DE NOTIFICACIONES:');
            console.log('   - Ve a Configuración > Apps > [Tu App] > Notificaciones');
            console.log('   - Asegúrate que estén HABILITADAS');
            console.log('');
            console.log('2. 🔧 GOOGLE-SERVICES.JSON:');
            console.log('   - Verifica que esté en app/google-services.json');
            console.log('   - Debe tener project_id: "aqualab-83795"');
            console.log('   - Package name debe coincidir con tu app');
            console.log('');
            console.log('3. 📄 FIREBASE MESSAGING SERVICE:');
            console.log('   - Asegúrate de tener FirebaseMessagingService implementado');
            console.log('   - Debe estar declarado en AndroidManifest.xml');
            console.log('');
            console.log('4. 🔔 CANAL DE NOTIFICACIONES (Android 8+):');
            console.log('   - Crea un NotificationChannel para las notificaciones');
            console.log('');
            console.log('5. 📊 LOGS DE ANDROID:');
            console.log('   - Ejecuta: adb logcat | grep -E "(FCM|Firebase)"');
            console.log('   - Busca errores cuando envíes una notificación');
            console.log('');
            console.log('6. 🧪 PRUEBA EN OTRO DISPOSITIVO:');
            console.log('   - Prueba en otro celular Android');
            console.log('   - Registra su token FCM y envía notificación');
            console.log('');
            console.log('💡 CÓDIGO BÁSICO PARA RECIBIR NOTIFICACIONES:');
            console.log('');
            console.log('public class MyFirebaseMessagingService extends FirebaseMessagingService {');
            console.log('    @Override');
            console.log('    public void onMessageReceived(RemoteMessage remoteMessage) {');
            console.log('        Log.d("FCM", "Mensaje recibido: " + remoteMessage.getNotification().getTitle());');
            console.log('        // Mostrar notificación aquí');
            console.log('    }');
            console.log('}');
            
        } else {
            console.log('❌ Error enviando notificación:', notifData.message);
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    console.log('\n🔍 === FIN DEL DIAGNÓSTICO ===');
}

diagnosticarProblemaNotificaciones();
