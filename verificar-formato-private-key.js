const admin = require('firebase-admin');

console.log('🔍 VERIFICANDO FORMATO DE FIREBASE_PRIVATE_KEY...\n');

// Verificar si la variable existe
if (!process.env.FIREBASE_PRIVATE_KEY) {
    console.error('❌ ERROR: FIREBASE_PRIVATE_KEY no está definida');
    process.exit(1);
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY;

console.log('📋 INFORMACIÓN DE LA CLAVE PRIVADA:');
console.log('- Longitud:', privateKey.length);
console.log('- Comienza con:', privateKey.substring(0, 50) + '...');
console.log('- Termina con:', '...' + privateKey.substring(privateKey.length - 50));

// Verificar formato
const hasBeginMarker = privateKey.includes('-----BEGIN PRIVATE KEY-----');
const hasEndMarker = privateKey.includes('-----END PRIVATE KEY-----');
const hasNewlines = privateKey.includes('\\n');

console.log('\n🔍 VALIDACIONES DE FORMATO:');
console.log('- Contiene BEGIN marker:', hasBeginMarker ? '✅' : '❌');
console.log('- Contiene END marker:', hasEndMarker ? '✅' : '❌');
console.log('- Contiene \\n (newlines):', hasNewlines ? '✅' : '❌');

// Verificar si las \n están siendo interpretadas correctamente
let processedKey = privateKey;
if (hasNewlines) {
    processedKey = privateKey.replace(/\\n/g, '\n');
    console.log('- Newlines procesadas correctamente:', processedKey.includes('\n') ? '✅' : '❌');
}

// Intentar inicializar Firebase Admin
console.log('\n🔥 INTENTANDO INICIALIZAR FIREBASE ADMIN...');

try {
    // Limpiar cualquier inicialización previa
    if (admin.apps.length > 0) {
        admin.apps.forEach(app => app.delete());
    }

    const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: processedKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
    });

    console.log('✅ Firebase Admin inicializado correctamente');
    
    // Probar obtener un token de acceso
    const accessToken = await admin.credential.applicationDefault().getAccessToken();
    console.log('✅ Token de acceso obtenido exitosamente');

} catch (error) {
    console.error('❌ ERROR al inicializar Firebase Admin:');
    console.error('Mensaje:', error.message);
    
    if (error.message.includes('private_key')) {
        console.error('\n💡 POSIBLE SOLUCIÓN:');
        console.error('La clave privada no está en el formato correcto.');
        console.error('En Render, asegúrate de que FIREBASE_PRIVATE_KEY tenga COMILLAS al inicio y final:');
        console.error('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
    }
}

console.log('\n📝 FORMATO CORRECTO PARA RENDER:');
console.log('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCSnWRAQOvkFCPg\\nITC7DZtIFT0iRPRF6SZTdIcC/8sjiqxW/uKgsiiuOjiBhcWJGQcJUwQAYRvC+J/7\\nbKlTGKPJ+UFObVeXJfDclBDgCcALCaOApyp2h7TB7nCOXMigR2JHQQzpNfe1V1Sk\\nlYI2QczkrDJpDa2bn457pmvIlHbl0JmFIMdlNERWzgdFS1+ibIUKMP7HN1eSsxa2\\nxNQTgxHCClzJ4STkEfSLl6YpYo5E/k9l7fwHrh+XcdYEQazClCxJwEnMVgtf46e4\\nSaFEFiIwiFkHGHLhLhh1SUCbORz+gt/YjQBOzKeZE0fPrx3YAwdXJ/kFb9SmvKCW\\ns/sbdgjZAgMBAAECggEAIvtk0SPsZMYdbTveGbN8am2O4Z9cPVYM6/qwwBlySa+r\\nwTIdtsPriu6fTuAxKq4LDMF/AewpqJKT8XSSzh3h7q4HVAQo0wqddrPpdts8tCV/\\nmpHIQvHMQj13I7ClugBuRZwSzY4v5VfJ/V8i63k1vxYLDR/TXX9rirtBmmE6IUkQ\\n5xirIsABXbGJbL54Ne3cj820tRVY9gL6uDI7/5hE+X/IE2eFmlMHav2oKFKgVSM7\\nylmHYjIRqL9FiswysI1WeAdr0WQ8Bbn3j82hPOlxPoLA1l6QH0Mo2mgK8vbdAJVo\\nezT66ldFtRnrXGUs7NDAuGu14+jpzH6NEFqVaOpPUQKBgQDIbcYB1NH79qb7Yl1Z\\nF37dAKfo/WLz802C1/KwAGR9eaevM8sp6+c4oqDGVgYaMEvvoux7chvvKkufYYyW\\nu1KHAVsi8TQdBjis1eAlVC2jUEsp1qzg9NOHP3tXJyQcwUFGHSaJHCTqnLf3F5zU\\nhrLc2c4ohASRZms9Ew1L8OiWlQKBgQC7Q/UVwsGpJutrdU72JfsfPjsRIEDl8x8J\\nnF64G6DSK6hYb3jleeqgs0wu8vYnbwZo52DBb51bWvIEPkGtBq7Xu8hhqku0Q9x/\\ntaZBEq+zWN0ccR0PnAwdC66vkF/7jLuZbWICtbz4nuoqMSEdGTrbpFtdWuqnToXI\\n1q0noqhsNQKBgQCwaMY2CG6GGfOhIVPOPbrgpFol3RhCZaycdJvbw4yvT+uCbtDr\\n5gHOvH1L9J1MYaQEmN8STD5ABHcpIkAOz3N09oGTwL9AqKArp9ewo2XD78EoYxYo\\nrfScfwh9jirf0E02fCPV3Fq10RiuuC7GdIRrlJ061e/7Vi0fRWyXocPl/QKBgAF1\\nyzBrP1VRT16cIIx8yVN6Cb3dcYQZfDF3/akT1hItcveVjuzDIZg1La/kBxVRoUwq\\nGbAIbcKrl91+msZ9mdlmxm40hLiYGt0IDo7NVX9hfv/cxew8PD/xul/2ETmF5GSS\\n3MPGpP2PR6Yike6HJtVVl7zHm7LIQvTI77qyYvvNAoGATpraeP+xGZpk/vSTE9Et\\ntLAebnAThfJd2oeaB08mIedNG1lbTPQ8KhMEPQnzUulkJbJkmBoPVFhHax/zwGGV\\nZWdI1kVXo+d151xs1hWq/6wKwhE02S4Vur5uh2dHCmmGhoKP3IWnzOuMo1lX531A\\nW89V9CEiIJt+dIXxaXT/y18=\\n-----END PRIVATE KEY-----\\n"');

console.log('\n🔧 PASOS PARA CORREGIR EN RENDER:');
console.log('1. Ve a tu dashboard de Render');
console.log('2. Selecciona tu servicio backend');
console.log('3. Ve a Environment');
console.log('4. Encuentra FIREBASE_PRIVATE_KEY');
console.log('5. Cambia el valor para que INCLUYA comillas al inicio y final');
console.log('6. Guarda los cambios');
console.log('7. Redespliega tu aplicación');
