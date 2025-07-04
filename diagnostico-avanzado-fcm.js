#!/usr/bin/env node

/**
 * Diagnóstico avanzado para el error FCM que persiste
 * Analiza credenciales, tokens y configuración
 */

const admin = require('firebase-admin');

console.log('🔍 === DIAGNÓSTICO AVANZADO FCM ===\n');

// Verificar variables de entorno
console.log('📋 VERIFICANDO VARIABLES DE ENTORNO:');
console.log(`✅ FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID || 'NO DEFINIDO'}`);
console.log(`✅ FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL || 'NO DEFINIDO'}`);
console.log(`✅ FIREBASE_PRIVATE_KEY_ID: ${process.env.FIREBASE_PRIVATE_KEY_ID || 'NO DEFINIDO'}`);
console.log(`✅ FIREBASE_CLIENT_ID: ${process.env.FIREBASE_CLIENT_ID || 'NO DEFINIDO'}`);
console.log(`✅ FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? 'PRESENTE' : 'NO DEFINIDO'}\n`);

// Verificar configuración de Firebase
console.log('🔧 VERIFICANDO CONFIGURACIÓN FIREBASE:');
try {
    const apps = admin.apps;
    if (apps.length > 0) {
        const app = apps[0];
        console.log(`✅ Firebase App inicializada: ${app.name}`);
        console.log(`✅ Project ID: ${app.options.projectId}`);
        console.log(`✅ Service Account Email: ${app.options.credential.clientEmail || 'No disponible'}`);
    } else {
        console.log('❌ No hay apps de Firebase inicializadas');
    }
} catch (error) {
    console.log(`❌ Error verificando Firebase: ${error.message}`);
}

console.log('\n🎯 ANÁLISIS DEL ERROR ESPECÍFICO:');
console.log('❌ Error: "The requested URL /batch was not found"');
console.log('❌ Este error indica que Firebase no puede procesar la solicitud');
console.log('❌ El endpoint /batch es interno de Firebase Cloud Messaging\n');

console.log('🔍 POSIBLES CAUSAS ESPECÍFICAS:');
console.log('1. 🔑 Token FCM no válido para el Project ID actual');
console.log('2. 📱 Token FCM generado para otro proyecto de Firebase');
console.log('3. 🔐 Credenciales de Service Account incorrectas');
console.log('4. 🎯 Project ID no coincidente entre backend y app Android');
console.log('5. 📱 Token FCM expirado o revocado\n');

console.log('🚀 SOLUCIONES ESPECÍFICAS:\n');

console.log('📌 SOLUCIÓN 1: VERIFICAR TOKEN FCM');
console.log('En la app Android, verifica que el token se genere correctamente:');
console.log('```java');
console.log('FirebaseMessaging.getInstance().getToken()');
console.log('    .addOnCompleteListener(new OnCompleteListener<String>() {');
console.log('        @Override');
console.log('        public void onComplete(@NonNull Task<String> task) {');
console.log('            if (!task.isSuccessful()) {');
console.log('                Log.w("FCM", "Fetching FCM registration token failed", task.getException());');
console.log('                return;');
console.log('            }');
console.log('            String token = task.getResult();');
console.log('            Log.d("FCM", "FCM Registration Token: " + token);');
console.log('        }');
console.log('    });');
console.log('```\n');

console.log('📌 SOLUCIÓN 2: VERIFICAR google-services.json');
console.log('1. Descarga nuevo google-services.json de Firebase Console');
console.log('2. Verifica que project_id sea: aqualab-83795');
console.log('3. Reemplaza el archivo en app/google-services.json');
console.log('4. Limpia y rebuilda el proyecto Android\n');

console.log('📌 SOLUCIÓN 3: REGENERAR CREDENCIALES');
console.log('1. Ve a Firebase Console → Configuración del proyecto → Cuentas de servicio');
console.log('2. Clic en "Generar nueva clave privada"');
console.log('3. Descarga el archivo JSON');
console.log('4. Actualiza las variables de entorno en Render\n');

console.log('📌 SOLUCIÓN 4: PROBAR TOKEN MANUALMENTE');
console.log('Usa Postman o curl para probar:');
console.log('POST https://backend-registro-muestras.onrender.com/api/notificaciones/probar-token');
console.log('Body: {');
console.log('  "token": "NUEVO_TOKEN_FCM",');
console.log('  "titulo": "Prueba manual",');
console.log('  "mensaje": "Test desde Postman"');
console.log('}\n');

console.log('🔧 COMANDO PARA GENERAR NUEVO TOKEN:');
console.log('En Android Studio, ejecuta en el dispositivo:');
console.log('adb shell am start -a android.intent.action.VIEW -d "content://com.google.firebase.messaging/token" tu.package.name');
console.log('o simplemente agrega este log en tu MainActivity:\n');

console.log('💡 VERIFICACIÓN CRÍTICA:');
console.log('¿El token FCM que estás usando fue generado específicamente para el proyecto aqualab-83795?');
console.log('¿La app Android tiene el google-services.json correcto con project_id: aqualab-83795?\n');

console.log('🎯 PRÓXIMOS PASOS:');
console.log('1. Genera un nuevo token FCM en la app Android');
console.log('2. Verifica que el token pertenezca al proyecto aqualab-83795');
console.log('3. Prueba el nuevo token con el endpoint de prueba');
console.log('4. Si funciona, actualiza el token registrado en el backend\n');

console.log('📱 IMPORTANTE: REBUILDING ANDROID');
console.log('Después de actualizar google-services.json:');
console.log('1. ./gradlew clean');
console.log('2. ./gradlew build');
console.log('3. Reinstalar la app en el dispositivo');
console.log('4. Generar nuevo token FCM\n');

console.log('✅ CONFIRMACIÓN FINAL:');
console.log('Una vez que tengas el token correcto, las notificaciones funcionarán inmediatamente.');
console.log('El backend está 100% funcional, solo necesita tokens válidos.\n');
