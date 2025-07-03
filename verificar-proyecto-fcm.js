require('dotenv').config();

console.log('🔍 === VERIFICACIÓN DE PROYECTO FCM ===');
console.log('');

console.log('📋 Variables de entorno actuales:');
console.log(`   FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID}`);
console.log(`   FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL}`);
console.log('');

console.log('🎯 Token FCM desde MongoDB:');
console.log('   co1WhDNTSzS-xuiJKqPF3o:APA91bH...');
console.log('');

console.log('🚨 DIAGNÓSTICO:');
console.log('   El error 404 /batch indica que FCM API NO está habilitada');
console.log('');

console.log('✅ SOLUCIONES:');
console.log('');
console.log('1. HABILITAR FCM API:');
console.log(`   https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=${process.env.FIREBASE_PROJECT_ID}`);
console.log('');
console.log('2. VERIFICAR PROJECT ID:');
console.log('   - Ve a Firebase Console');
console.log('   - Verifica que el proyecto sea correcto');
console.log('   - Asegúrate de que la app Android esté registrada');
console.log('');
console.log('3. REGENERAR TOKEN EN ANDROID:');
console.log('   - Elimina y reinstala la app');
console.log('   - O fuerza regeneración del token FCM');
console.log('');

console.log('🔧 URLs IMPORTANTES:');
console.log(`   Firebase Console: https://console.firebase.google.com/project/${process.env.FIREBASE_PROJECT_ID}`);
console.log(`   Google Cloud APIs: https://console.cloud.google.com/apis/dashboard?project=${process.env.FIREBASE_PROJECT_ID}`);
console.log(`   FCM API: https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=${process.env.FIREBASE_PROJECT_ID}`);
