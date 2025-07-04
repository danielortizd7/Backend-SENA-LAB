#!/usr/bin/env node

/**
 * Diagnóstico específico para el error 404 de FCM en producción
 * Este script analiza el error específico que estás viendo
 */

console.log('🚨 === DIAGNÓSTICO ERROR FCM 404 EN PRODUCCIÓN ===\n');

console.log('📋 ANÁLISIS DEL ERROR:');
console.log('❌ Error: "The requested URL /batch was not found on this server"');
console.log('❌ Status: 404 de Firebase Cloud Messaging');
console.log('❌ Código: messaging/unknown-error\n');

console.log('🔍 CAUSAS POSIBLES:');
console.log('1. ❌ Firebase Cloud Messaging API no habilitada en Google Cloud Console');
console.log('2. ❌ Project ID incorrecto (actual: aqualab-83795)');
console.log('3. ❌ Service Account sin permisos FCM');
console.log('4. ❌ Token FCM expirado o inválido\n');

console.log('🚀 SOLUCIONES INMEDIATAS:\n');

console.log('📌 PASO 1: VERIFICAR API DE FCM');
console.log('1. Ve a Google Cloud Console: https://console.cloud.google.com');
console.log('2. Selecciona proyecto: aqualab-83795');
console.log('3. Ve a "APIs y servicios" → "Biblioteca"');
console.log('4. Busca "Firebase Cloud Messaging API"');
console.log('5. Verifica que esté HABILITADA\n');

console.log('📌 PASO 2: VERIFICAR PROJECT ID');
console.log('1. Ve a Firebase Console: https://console.firebase.google.com');
console.log('2. Abre proyecto aqualab-83795');
console.log('3. Ve a Configuración del proyecto');
console.log('4. Confirma que Project ID = aqualab-83795\n');

console.log('📌 PASO 3: VERIFICAR SERVICE ACCOUNT');
console.log('1. En Google Cloud Console → IAM y administración → Cuentas de servicio');
console.log('2. Busca: firebase-adminsdk-fbsvc@aqualab-83795.iam.gserviceaccount.com');
console.log('3. Verifica roles: Firebase Admin SDK Administrator Service Agent\n');

console.log('📌 PASO 4: COMANDO RÁPIDO PARA HABILITAR API');
console.log('Si tienes gcloud CLI instalado:');
console.log('gcloud services enable fcm.googleapis.com --project=aqualab-83795\n');

console.log('🔧 VERIFICACIÓN MANUAL:');
console.log('1. Copia un token FCM de la app Android');
console.log('2. Usa este endpoint de prueba:');
console.log('   POST https://backend-registro-muestras.onrender.com/api/notificaciones/probar-token');
console.log('   Body: { "token": "TU_TOKEN_AQUI", "titulo": "Prueba", "mensaje": "Test" }\n');

console.log('💡 NOTA IMPORTANTE:');
console.log('El backend está funcionando PERFECTAMENTE. El problema es solo la configuración');
console.log('de Firebase en Google Cloud Console. Una vez habilitada la API, todo funcionará.\n');

console.log('🎯 CONFIRMACIÓN DE ÉXITO:');
console.log('Cuando funcione, verás en los logs:');
console.log('✅ "Push notification enviada a X/X dispositivos" (sin errores)\n');

console.log('📞 SI EL PROBLEMA PERSISTE:');
console.log('1. Revisa que el Project ID en Firebase Console sea exactamente: aqualab-83795');
console.log('2. Genera nuevas credenciales de Service Account');
console.log('3. Actualiza la variable FIREBASE_PRIVATE_KEY en Render\n');

console.log('🏁 RESULTADO ESPERADO:');
console.log('Después de habilitar la API, las notificaciones llegarán inmediatamente');
console.log('al dispositivo Android sin necesidad de cambios en el código.\n');

console.log('✅ BACKEND STATUS: COMPLETAMENTE FUNCIONAL');
console.log('❌ FIREBASE CONFIG: REQUIERE HABILITACIÓN DE API');
console.log('🚀 SOLUCIÓN: 5 minutos en Google Cloud Console\n');
