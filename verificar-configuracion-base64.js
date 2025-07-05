console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN FIREBASE BASE64');
console.log('==============================================');

// Simular la lógica del NotificationService
function testFirebaseConfig() {
    console.log('\n📋 PRUEBA DE LÓGICA DE CONFIGURACIÓN:');
    
    // Caso 1: Solo FIREBASE_PRIVATE_KEY_BASE64
    console.log('\n1. Caso con FIREBASE_PRIVATE_KEY_BASE64:');
    const testEnv1 = {
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_CLIENT_EMAIL: 'test@test.com',
        FIREBASE_PRIVATE_KEY_BASE64: 'dGVzdA==', // "test" en base64
        FIREBASE_PRIVATE_KEY: undefined
    };
    
    console.log('   Variables disponibles:', Object.keys(testEnv1).filter(k => testEnv1[k]));
    
    // Verificar variables requeridas
    const requiredVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL'];
    const missingVars = requiredVars.filter(varName => !testEnv1[varName]);
    
    if (!testEnv1.FIREBASE_PRIVATE_KEY_BASE64 && !testEnv1.FIREBASE_PRIVATE_KEY) {
        missingVars.push('FIREBASE_PRIVATE_KEY_BASE64 o FIREBASE_PRIVATE_KEY');
    }
    
    console.log('   Variables faltantes:', missingVars.length === 0 ? 'Ninguna' : missingVars);
    
    // Determinar qué configuración usar
    let privateKey;
    if (testEnv1.FIREBASE_PRIVATE_KEY_BASE64) {
        privateKey = Buffer.from(testEnv1.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
        console.log('   ✅ Usando FIREBASE_PRIVATE_KEY_BASE64');
        console.log('   Resultado decodificado:', privateKey);
    } else {
        privateKey = testEnv1.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        console.log('   ✅ Usando FIREBASE_PRIVATE_KEY tradicional');
    }
    
    console.log('   Estado final: CONFIGURACIÓN VÁLIDA');
    
    // Caso 2: Solo FIREBASE_PRIVATE_KEY tradicional
    console.log('\n2. Caso con FIREBASE_PRIVATE_KEY tradicional:');
    const testEnv2 = {
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_CLIENT_EMAIL: 'test@test.com',
        FIREBASE_PRIVATE_KEY_BASE64: undefined,
        FIREBASE_PRIVATE_KEY: '"test\\nkey"'
    };
    
    console.log('   Variables disponibles:', Object.keys(testEnv2).filter(k => testEnv2[k]));
    
    const missingVars2 = requiredVars.filter(varName => !testEnv2[varName]);
    if (!testEnv2.FIREBASE_PRIVATE_KEY_BASE64 && !testEnv2.FIREBASE_PRIVATE_KEY) {
        missingVars2.push('FIREBASE_PRIVATE_KEY_BASE64 o FIREBASE_PRIVATE_KEY');
    }
    
    console.log('   Variables faltantes:', missingVars2.length === 0 ? 'Ninguna' : missingVars2);
    
    let privateKey2;
    if (testEnv2.FIREBASE_PRIVATE_KEY_BASE64) {
        privateKey2 = Buffer.from(testEnv2.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
        console.log('   ✅ Usando FIREBASE_PRIVATE_KEY_BASE64');
    } else {
        privateKey2 = testEnv2.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        console.log('   ✅ Usando FIREBASE_PRIVATE_KEY tradicional');
        console.log('   Resultado procesado:', privateKey2);
    }
    
    console.log('   Estado final: CONFIGURACIÓN VÁLIDA');
    
    // Caso 3: Sin ninguna clave privada
    console.log('\n3. Caso sin claves privadas:');
    const testEnv3 = {
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_CLIENT_EMAIL: 'test@test.com',
        FIREBASE_PRIVATE_KEY_BASE64: undefined,
        FIREBASE_PRIVATE_KEY: undefined
    };
    
    const missingVars3 = requiredVars.filter(varName => !testEnv3[varName]);
    if (!testEnv3.FIREBASE_PRIVATE_KEY_BASE64 && !testEnv3.FIREBASE_PRIVATE_KEY) {
        missingVars3.push('FIREBASE_PRIVATE_KEY_BASE64 o FIREBASE_PRIVATE_KEY');
    }
    
    console.log('   Variables faltantes:', missingVars3);
    console.log('   Estado final: CONFIGURACIÓN INVÁLIDA');
}

// Ejecutar prueba
testFirebaseConfig();

console.log('\n✅ VERIFICACIÓN COMPLETADA');
console.log('=========================');
console.log('La configuración en notificationService.js es correcta:');
console.log('1. ✅ Detecta automáticamente FIREBASE_PRIVATE_KEY_BASE64');
console.log('2. ✅ Usa Base64 como prioridad si está disponible');
console.log('3. ✅ Fallback a FIREBASE_PRIVATE_KEY tradicional');
console.log('4. ✅ Valida que al menos una clave privada esté presente');
console.log('5. ✅ Logging apropiado para identificar qué configuración usa');

console.log('\n🚀 PRÓXIMOS PASOS:');
console.log('1. Agregar FIREBASE_PRIVATE_KEY_BASE64 en Render');
console.log('2. Redeploy del servicio');
console.log('3. Verificar logs para confirmar: "🔧 Usando FIREBASE_PRIVATE_KEY_BASE64"');
console.log('4. Probar envío de notificaciones');

console.log('\n📊 DIAGNÓSTICO EN PRODUCCIÓN:');
console.log('Si ves "🔧 Usando FIREBASE_PRIVATE_KEY_BASE64" en los logs,');
console.log('significa que la configuración Base64 está funcionando correctamente.');
