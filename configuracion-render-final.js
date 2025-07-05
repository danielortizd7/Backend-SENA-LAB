console.log('🔧 CONFIGURACIÓN DEFINITIVA PARA RENDER');
console.log('=====================================');

// Usar la clave privada real de tu archivo .env
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCSnWRAQOvkFCPg
ITC7DZtIFT0iRPRF6SZTdIcC/8sjiqxW/uKgsiiuOjiBhcWJGQcJUwQAYRvC+J/7
bKlTGKPJ+UFObVeXJfDclBDgCcALCaOApyp2h7TB7nCOXMigR2JHQQzpNfe1V1Sk
lYI2QczkrDJpDa2bn457pmvIlHbl0JmFIMdlNERWzgdFS1+ibIUKMP7HN1eSsxa2
xNQTgxHCClzJ4STkEfSLl6YpYo5E/k9l7fwHrh+XcdYEQazClCxJwEnMVgtf46e4
SaFEFiIwiFkHGHLhLhh1SUCbORz+gt/YjQBOzKeZE0fPrx3YAwdXJ/kFb9SmvKCW
s/sbdgjZAgMBAAECggEAIvtk0SPsZMYdbTveGbN8am2O4Z9cPVYM6/qwwBlySa+r
wTIdtsPriu6fTuAxKq4LDMF/AewpqJKT8XSSzh3h7q4HVAQo0wqddrPpdts8tCV/
mpHIQvHMQj13I7ClugBuRZwSzY4v5VfJ/V8i63k1vxYLDR/TXX9rirtBmmE6IUkQ
5xirIsABXbGJbL54Ne3cj820tRVY9gL6uDI7/5hE+X/IE2eFmlMHav2oKFKgVSM7
ylmHYjIRqL9FiswysI1WeAdr0WQ8Bbn3j82hPOlxPoLA1l6QH0Mo2mgK8vbdAJVo
ezT66ldFtRnrXGUs7NDAuGu14+jpzH6NEFqVaOpPUQKBgQDIbcYB1NH79qb7Yl1Z
F37dAKfo/WLz802C1/KwAGR9eaevM8sp6+c4oqDGVgYaMEvvoux7chvvKkufYYyW
u1KHAVsi8TQdBjis1eAlVC2jUEsp1qzg9NOHP3tXJyQcwUFGHSaJHCTqnLf3F5zU
hrLc2c4ohASRZms9Ew1L8OiWlQKBgQC7Q/UVwsGpJutrdU72JfsfPjsRIEDl8x8J
nF64G6DSK6hYb3jleeqgs0wu8vYnbwZo52DBb51bWvIEPkGtBq7Xu8hhqku0Q9x/
taZBEq+zWN0ccR0PnAwdC66vkF/7jLuZbWICtbz4nuoqMSEdGTrbpFtdWuqnToXI
1q0noqhsNQKBgQCwaMY2CG6GGfOhIVPOPbrgpFol3RhCZaycdJvbw4yvT+uCbtDr
5gHOvH1L9J1MYaQEmN8STD5ABHcpIkAOz3N09oGTwL9AqKArp9ewo2XD78EoYxYo
rfScfwh9jirf0E02fCPV3Fq10RiuuC7GdIRrlJ061e/7Vi0fRWyXocPl/QKBgAF1
yzBrP1VRT16cIIx8yVN6Cb3dcYQZfDF3/akT1hItcveVjuzDIZg1La/kBxVRoUwq
GbAIbcKrl91+msZ9mdlmxm40hLiYGt0IDo7NVX9hfv/cxew8PD/xul/2ETmF5GSS
3MPGpP2PR6Yike6HJtVVl7zHm7LIQvTI77qyYvvNAoGATpraeP+xGZpk/vSTE9Et
tLAebnAThfJd2oeaB08mIedNG1lbTPQ8KhMEPQnzUulkJbJkmBoPVFhHax/zwGGV
ZWdI1kVXo+d151xs1hWq/6wKwhE02S4Vur5uh2dHCmmGhoKP3IWnzOuMo1lX531A
W89V9CEiIJt+dIXxaXT/y18=
-----END PRIVATE KEY-----`;

const privateKeyBase64 = Buffer.from(privateKey).toString('base64');

console.log('\n📋 NUEVA VARIABLE PARA RENDER:');
console.log('==============================');
console.log('Nombre: FIREBASE_PRIVATE_KEY_BASE64');
console.log('Valor:');
console.log(privateKeyBase64);

console.log('\n📝 PASOS PARA CONFIGURAR EN RENDER:');
console.log('1. Ve a tu panel de Render → Environment Variables');
console.log('2. AGREGAR nueva variable:');
console.log('   - Name: FIREBASE_PRIVATE_KEY_BASE64');
console.log('   - Value: (copia el valor de arriba)');
console.log('3. Guarda los cambios');
console.log('4. Redeploy el servicio');

console.log('\n🔍 VERIFICACIÓN:');
console.log('- Longitud de la clave privada:', privateKey.length);
console.log('- Longitud del Base64:', privateKeyBase64.length);
console.log('- Clave privada válida:', privateKey.includes('BEGIN PRIVATE KEY'));

console.log('\n🚀 DESPUÉS DEL DEPLOY:');
console.log('- El código detectará automáticamente FIREBASE_PRIVATE_KEY_BASE64');
console.log('- Convertirá la clave de Base64 a texto');
console.log('- Debería eliminar el error de RS256');
console.log('- Las notificaciones funcionarán correctamente');

console.log('\n📊 ESTADO ESPERADO EN LOGS:');
console.log('✅ 🔧 Usando FIREBASE_PRIVATE_KEY_BASE64');
console.log('✅ 🔧 Private key length: 1704');
console.log('✅ 🔧 Private key starts with BEGIN: true');
console.log('✅ 🔧 Private key ends with END: true');
console.log('✅ Firebase Admin SDK inicializado exitosamente');
console.log('✅ 🚀 Mensaje FCM enviado exitosamente');

console.log('\n⚡ PRUEBA INMEDIATA:');
console.log('Una vez deployado, cambia el estado de una muestra');
console.log('y confirma que no hay errores en los logs.');
