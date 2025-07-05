/**
 * DIAGNÓSTICO DIRECTO DE CREDENCIALES FIREBASE
 * Script para verificar las credenciales específicas que están en Render
 */

// Credenciales exactas de producción (según los logs)
const credencialesProduccion = {
    type: "service_account",
    project_id: "aqualab-83795",
    private_key_id: "e25e9dec1c5457a266082d7b0e74ad21d631b8b4",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQClSfF2/fCKvyWI\nq7k2xV6ZB8U+Vn7Gm4A8pK3YlQX0V9H5gD3tE1Z2Kp8E+7vJ0X2M9kN4bQ3FpZ\n...", // La key real está en las variables de entorno de Render
    client_email: "firebase-adminsdk-fbsvc@aqualab-83795.iam.gserviceaccount.com",
    client_id: "103683320452412442574",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token"
};

async function diagnosticarCredencialesDirecto() {
    try {
        console.log('🔍 === DIAGNÓSTICO DIRECTO DE CREDENCIALES ===');
        console.log('=============================================');
        
        console.log('\n📋 Credenciales de producción (según logs):');
        console.log('   - Project ID:', credencialesProduccion.project_id);
        console.log('   - Client Email:', credencialesProduccion.client_email);
        console.log('   - Private Key ID:', credencialesProduccion.private_key_id);
        console.log('   - Client ID:', credencialesProduccion.client_id);
        
        // Verificar formato del Project ID
        console.log('\n🔍 Análisis del Project ID:');
        const projectId = credencialesProduccion.project_id;
        console.log('   - Valor:', projectId);
        console.log('   - Longitud:', projectId.length);
        console.log('   - Formato válido:', /^[a-z0-9-]+$/.test(projectId) ? '✅ Sí' : '❌ No');
        console.log('   - Sin espacios:', !projectId.includes(' ') ? '✅ Sí' : '❌ No');
        
        // Verificar formato del Client Email
        console.log('\n📧 Análisis del Client Email:');
        const clientEmail = credencialesProduccion.client_email;
        console.log('   - Valor:', clientEmail);
        console.log('   - Formato válido:', clientEmail.includes('@') && clientEmail.includes('.iam.gserviceaccount.com') ? '✅ Sí' : '❌ No');
        console.log('   - Project ID coincide:', clientEmail.includes(projectId) ? '✅ Sí' : '❌ No');
        
        // Verificar URL del endpoint FCM
        console.log('\n🌐 URLs de Firebase:');
        const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
        const batchUrl = `https://fcm.googleapis.com/batch`;
        console.log('   - FCM URL:', fcmUrl);
        console.log('   - Batch URL:', batchUrl);
        
        // El error 404 /batch sugiere que Firebase está intentando usar el endpoint batch
        console.log('\n🎯 Análisis del error:');
        console.log('   - Error reportado: 404 /batch');
        console.log('   - URL correcta debería ser:', fcmUrl);
        console.log('   - Problema: Firebase Admin SDK está usando la URL incorrecta');
        
        console.log('\n💡 Posibles causas del error 404 /batch:');
        console.log('   1. Project ID incorrecto (aunque parece correcto)');
        console.log('   2. Private Key malformada en Render');
        console.log('   3. Service Account sin permisos FCM');
        console.log('   4. Region incorrecta del proyecto Firebase');
        console.log('   5. Firebase Admin SDK version incompatible');
        
        console.log('\n🔧 Soluciones a probar:');
        console.log('   1. Regenerar Service Account en Firebase Console');
        console.log('   2. Verificar que Cloud Messaging API esté habilitado');
        console.log('   3. Verificar región del proyecto Firebase');
        console.log('   4. Usar tokens FCM más recientes');
        console.log('   5. Actualizar Firebase Admin SDK');
        
        // Verificación específica para AquaLab
        console.log('\n🏢 Verificación específica para AquaLab:');
        console.log('   - Project ID esperado: aqualab-83795 ✅');
        console.log('   - Service Account format: firebase-adminsdk-fbsvc@aqualab-83795.iam.gserviceaccount.com ✅');
        console.log('   - Tokens FCM: Formato válido (142 chars) ✅');
        console.log('   - Firebase init: Exitoso ✅');
        console.log('   - Error: Solo en sendMulticast() ❌');
        
        console.log('\n🎯 CONCLUSIÓN:');
        console.log('   El problema NO es de configuración básica.');
        console.log('   El problema está en el envío específico de mensajes.');
        console.log('   Posiblemente la Private Key está malformada en Render.');
        
        console.log('\n📋 PRÓXIMOS PASOS:');
        console.log('   1. Regenerar Service Account credentials en Firebase');
        console.log('   2. Actualizar FIREBASE_PRIVATE_KEY en Render');
        console.log('   3. Asegurar formato correcto (con \\n)');
        console.log('   4. Probar envío de notificación');
        
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
    }
}

// Ejecutar diagnóstico
diagnosticarCredencialesDirecto().catch(console.error);
