console.log('🔧 DIAGNÓSTICO DE CLAVE PRIVADA DE FIREBASE');
console.log('==========================================');

// Basándome en los logs de Render, el problema es:
// "secretOrPrivateKey must be an asymmetric key when using RS256"

console.log('\n📋 ANÁLISIS DEL PROBLEMA:');
console.log('✅ Servidor iniciando correctamente');
console.log('✅ Firebase configurándose con credenciales básicas');
console.log('✅ Private key present: true');
console.log('❌ Error al usar la clave privada para autenticación');

console.log('\n🔍 CAUSAS POSIBLES:');
console.log('1. Los saltos de línea (\\n) no se están interpretando correctamente');
console.log('2. La clave privada tiene espacios o caracteres extra');
console.log('3. Las comillas dobles están mal posicionadas');
console.log('4. Hay caracteres invisible o encoding incorrecto');

console.log('\n🔧 SOLUCIÓN PASO A PASO:');
console.log('1. Ve a tu panel de Render → Variables de entorno');
console.log('2. Busca FIREBASE_PRIVATE_KEY');
console.log('3. Borra completamente el valor actual');
console.log('4. Copia este valor EXACTO (incluyendo las comillas):');

console.log('\n📝 VALOR CORRECTO PARA FIREBASE_PRIVATE_KEY:');
console.log('================================================');

// Usar el valor exacto de tu .env local
const claveCorrecta = `"-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCSnWRAQOvkFCPg\\nITC7DZtIFT0iRPRF6SZTdIcC/8sjiqxW/uKgsiiuOjiBhcWJGQcJUwQAYRvC+J/7\\nbKlTGKPJ+UFObVeXJfDclBDgCcALCaOApyp2h7TB7nCOXMigR2JHQQzpNfe1V1Sk\\nlYI2QczkrDJpDa2bn457pmvIlHbl0JmFIMdlNERWzgdFS1+ibIUKMP7HN1eSsxa2\\nxNQTgxHCClzJ4STkEfSLl6YpYo5E/k9l7fwHrh+XcdYEQazClCxJwEnMVgtf46e4\\nSaFEFiIwiFkHGHLhLhh1SUCbORz+gt/YjQBOzKeZE0fPrx3YAwdXJ/kFb9SmvKCW\\ns/sbdgjZAgMBAAECggEAIvtk0SPsZMYdbTveGbN8am2O4Z9cPVYM6/qwwBlySa+r\\nwTIdtsPriu6fTuAxKq4LDMF/AewpqJKT8XSSzh3h7q4HVAQo0wqddrPpdts8tCV/\\nmpHIQvHMQj13I7ClugBuRZwSzY4v5VfJ/V8i63k1vxYLDR/TXX9rirtBmmE6IUkQ\\n5xirIsABXbGJbL54Ne3cj820tRVY9gL6uDI7/5hE+X/IE2eFmlMHav2oKFKgVSM7\\nylmHYjIRqL9FiswysI1WeAdr0WQ8Bbn3j82hPOlxPoLA1l6QH0Mo2mgK8vbdAJVo\\nezT66ldFtRnrXGUs7NDAuGu14+jpzH6NEFqVaOpPUQKBgQDIbcYB1NH79qb7Yl1Z\\nF37dAKfo/WLz802C1/KwAGR9eaevM8sp6+c4oqDGVgYaMEvvoux7chvvKkufYYyW\\nu1KHAVsi8TQdBjis1eAlVC2jUEsp1qzg9NOHP3tXJyQcwUFGHSaJHCTqnLf3F5zU\\nhrLc2c4ohASRZms9Ew1L8OiWlQKBgQC7Q/UVwsGpJutrdU72JfsfPjsRIEDl8x8J\\nnF64G6DSK6hYb3jleeqgs0wu8vYnbwZo52DBb51bWvIEPkGtBq7Xu8hhqku0Q9x/\\ntaZBEq+zWN0ccR0PnAwdC66vkF/7jLuZbWICtbz4nuoqMSEdGTrbpFtdWuqnToXI\\n1q0noqhsNQKBgQCwaMY2CG6GGfOhIVPOPbrgpFol3RhCZaycdJvbw4yvT+uCbtDr\\n5gHOvH1L9J1MYaQEmN8STD5ABHcpIkAOz3N09oGTwL9AqKArp9ewo2XD78EoYxYo\\nrfScfwh9jirf0E02fCPV3Fq10RiuuC7GdIRrlJ061e/7Vi0fRWyXocPl/QKBgAF1\\nyzBrP1VRT16cIIx8yVN6Cb3dcYQZfDF3/akT1hItcveVjuzDIZg1La/kBxVRoUwq\\nGbAIbcKrl91+msZ9mdlmxm40hLiYGt0IDo7NVX9hfv/cxew8PD/xul/2ETmF5GSS\\n3MPGpP2PR6Yike6HJtVVl7zHm7LIQvTI77qyYvvNAoGATpraeP+xGZpk/vSTE9Et\\ntLAebnAThfJd2oeaB08mIedNG1lbTPQ8KhMEPQnzUulkJbJkmBoPVFhHax/zwGGV\\nZWdI1kVXo+d151xs1hWq/6wKwhE02S4Vur5uh2dHCmmGhoKP3IWnzOuMo1lX531A\\nW89V9CEiIJt+dIXxaXT/y18=\\n-----END PRIVATE KEY-----\\n"`;

console.log(claveCorrecta);

console.log('\n⚠️  IMPORTANTE:');
console.log('- Copia el valor COMPLETO (incluyendo las comillas dobles)');
console.log('- NO agregues espacios extra');
console.log('- NO cambies nada del contenido');
console.log('- Pega exactamente como se muestra arriba');

console.log('\n📝 PASOS DESPUÉS DE ACTUALIZAR:');
console.log('1. Guarda la variable en Render');
console.log('2. Redeploy el servicio');
console.log('3. Revisa los logs para confirmar que no hay errores');
console.log('4. Prueba enviar una notificación');

console.log('\n🔄 VERIFICACIÓN RÁPIDA:');
console.log('URL del backend: https://backend-registro-muestras.onrender.com');
console.log('Si el problema persiste, el error podría estar en otro lugar.');

console.log('\n📊 ESTADO ACTUAL:');
console.log('✅ Servidor iniciado correctamente');
console.log('✅ MongoDB conectado');
console.log('✅ CORS configurado');
console.log('✅ Tokens FCM válidos (142 chars)');
console.log('❌ Firebase Admin SDK failing en autenticación');
console.log('❌ Notificaciones no llegando por error de clave privada');

console.log('\n🎯 PRÓXIMOS PASOS:');
console.log('1. Actualiza la variable con el valor exacto mostrado arriba');
console.log('2. Redeploy');
console.log('3. Si funciona, las notificaciones deberían llegar inmediatamente');
console.log('4. Prueba con Felipe y Daniela para confirmar');
