/**
 * SCRIPT PARA ACTUALIZAR CREDENCIALES DE FIREBASE
 * Este script te ayuda a configurar las nuevas credenciales de Firebase
 * en tu servicio de hosting (Render, Heroku, etc.)
 */

console.log('🔥 NUEVAS CREDENCIALES DE FIREBASE PARA ACTUALIZAR 🔥');
console.log('=====================================');

// Nuevas credenciales desde el archivo JSON descargado
const nuevasCredenciales = {
    FIREBASE_PROJECT_ID: "aqualab-83795",
    FIREBASE_PRIVATE_KEY_ID: "e25e9dec1c5457a266082d7b0e74ad21d631b8b4",
    FIREBASE_CLIENT_EMAIL: "firebase-adminsdk-fbsvc@aqualab-83795.iam.gserviceaccount.com",
    FIREBASE_CLIENT_ID: "103683320452412442574",
    FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCSnWRAQOvkFCPg\\nITC7DZtIFT0iRPRF6SZTdIcC/8sjiqxW/uKgsiiuOjiBhcWJGQcJUwQAYRvC+J/7\\nbKlTGKPJ+UFObVeXJfDclBDgCcALCaOApyp2h7TB7nCOXMigR2JHQQzpNfe1V1Sk\\nlYI2QczkrDJpDa2bn457pmvIlHbl0JmFIMdlNERWzgdFS1+ibIUKMP7HN1eSsxa2\\nxNQTgxHCClzJ4STkEfSLl6YpYo5E/k9l7fwHrh+XcdYEQazClCxJwEnMVgtf46e4\\nSaFEFiIwiFkHGHLhLhh1SUCbORz+gt/YjQBOzKeZE0fPrx3YAwdXJ/kFb9SmvKCW\\ns/sbdgjZAgMBAAECggEAIvtk0SPsZMYdbTveGbN8am2O4Z9cPVYM6/qwwBlySa+r\\nwTIdtsPriu6fTuAxKq4LDMF/AewpqJKT8XSSzh3h7q4HVAQo0wqddrPpdts8tCV/\\nmpHIQvHMQj13I7ClugBuRZwSzY4v5VfJ/V8i63k1vxYLDR/TXX9rirtBmmE6IUkQ\\n5xirIsABXbGJbL54Ne3cj820tRVY9gL6uDI7/5hE+X/IE2eFmlMHav2oKFKgVSM7\\nylmHYjIRqL9FiswysI1WeAdr0WQ8Bbn3j82hPOlxPoLA1l6QH0Mo2mgK8vbdAJVo\\nezT66ldFtRnrXGUs7NDAuGu14+jpzH6NEFqVaOpPUQKBgQDIbcYB1NH79qb7Yl1Z\\nF37dAKfo/WLz802C1/KwAGR9eaevM8sp6+c4oqDGVgYaMEvvoux7chvvKkufYYyW\\nu1KHAVsi8TQdBjis1eAlVC2jUEsp1qzg9NOHP3tXJyQcwUFGHSaJHCTqnLf3F5zU\\nhrLc2c4ohASRZms9Ew1L8OiWlQKBgQC7Q/UVwsGpJutrdU72JfsfPjsRIEDl8x8J\\nnF64G6DSK6hYb3jleeqgs0wu8vYnbwZo52DBb51bWvIEPkGtBq7Xu8hhqku0Q9x/\\ntaZBEq+zWN0ccR0PnAwdC66vkF/7jLuZbWICtbz4nuoqMSEdGTrbpFtdWuqnToXI\\n1q0noqhsNQKBgQCwaMY2CG6GGfOhIVPOPbrgpFol3RhCZaycdJvbw4yvT+uCbtDr\\n5gHOvH1L9J1MYaQEmN8STD5ABHcpIkAOz3N09oGTwL9AqKArp9ewo2XD78EoYxYo\\nrfScfwh9jirf0E02fCPV3Fq10RiuuC7GdIRrlJ061e/7Vi0fRWyXocPl/QKBgAF1\\nyzBrP1VRT16cIIx8yVN6Cb3dcYQZfDF3/akT1hItcveVjuzDIZg1La/kBxVRoUwq\\nGbAIbcKrl91+msZ9mdlmxm40hLiYGt0IDo7NVX9hfv/cxew8PD/xul/2ETmF5GSS\\n3MPGpP2PR6Yike6HJtVVl7zHm7LIQvTI77qyYvvNAoGATpraeP+xGZpk/vSTE9Et\\ntLAebnAThfJd2oeaB08mIedNG1lbTPQ8KhMEPQnzUulkJbJkmBoPVFhHax/zwGGV\\nZWdI1kVXo+d151xs1hWq/6wKwhE02S4Vur5uh2dHCmmGhoKP3IWnzOuMo1lX531A\\nW89V9CEiIJt+dIXxaXT/y18=\\n-----END PRIVATE KEY-----\\n"
};

console.log('\n📋 VARIABLES DE ENTORNO PARA ACTUALIZAR EN RENDER:');
console.log('================================================');

Object.entries(nuevasCredenciales).forEach(([key, value]) => {
    console.log(`${key}:`);
    console.log(`${value}`);
    console.log('---');
});

console.log('\n🎯 INSTRUCCIONES PARA ACTUALIZAR EN RENDER:');
console.log('==========================================');
console.log('1. Ve a tu dashboard de Render');
console.log('2. Selecciona tu servicio backend');
console.log('3. Ve a la pestaña "Environment"');
console.log('4. Actualiza CADA una de las variables mostradas arriba');
console.log('5. IMPORTANTE: Para FIREBASE_PRIVATE_KEY, asegúrate de que los \\n sean literales');
console.log('6. Guarda los cambios');
console.log('7. Render automáticamente redespliegará el servicio');

console.log('\n⚠️  NOTAS IMPORTANTES:');
console.log('=====================');
console.log('• La FIREBASE_PRIVATE_KEY debe mantener los \\n como texto literal');
console.log('• NO conviertas los \\n en saltos de línea reales');
console.log('• Copia y pega exactamente como se muestra arriba');
console.log('• Después del redespliegue, prueba las notificaciones');

console.log('\n🔍 VERIFICACIÓN POST-ACTUALIZACIÓN:');
console.log('==================================');
console.log('Después de actualizar, ejecuta:');
console.log('node validar-produccion.js');
console.log('node probar-nuevo-token.js');

// Función para verificar que las variables estén correctas
function verificarCredenciales() {
    console.log('\n🔍 VERIFICANDO CREDENCIALES ACTUALES...');
    
    const requiredVars = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_PRIVATE_KEY_ID', 
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_CLIENT_ID',
        'FIREBASE_PRIVATE_KEY'
    ];
    
    const missing = [];
    const incorrect = [];
    
    requiredVars.forEach(varName => {
        const currentValue = process.env[varName];
        const expectedValue = nuevasCredenciales[varName];
        
        if (!currentValue) {
            missing.push(varName);
        } else if (currentValue !== expectedValue) {
            incorrect.push(varName);
        }
    });
    
    if (missing.length > 0) {
        console.log('❌ Variables faltantes:', missing.join(', '));
    }
    
    if (incorrect.length > 0) {
        console.log('❌ Variables incorrectas:', incorrect.join(', '));
    }
    
    if (missing.length === 0 && incorrect.length === 0) {
        console.log('✅ Todas las credenciales están correctas');
        return true;
    }
    
    return false;
}

// Solo verificar si estamos en un entorno que tiene las variables
if (process.env.NODE_ENV) {
    verificarCredenciales();
}
