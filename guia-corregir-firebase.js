#!/usr/bin/env node

/**
 * GUÍA PASO A PASO: Cómo corregir las credenciales de Firebase
 */

console.log('🔧 GUÍA: Corregir Credenciales Firebase');
console.log('======================================');
console.log('');

console.log('🎯 PROBLEMA ACTUAL:');
console.log('===================');
console.log('❌ "secretOrPrivateKey must be an asymmetric key when using RS256"');
console.log('❌ Firebase no puede autenticar');
console.log('❌ Las notificaciones no llegan al móvil');
console.log('');

console.log('🔧 SOLUCIÓN PASO A PASO:');
console.log('========================');
console.log('');

console.log('📍 PASO 1: Ir a Firebase Console');
console.log('   🌐 https://console.firebase.google.com/');
console.log('   🏷️ Selecciona proyecto: aqualab-83795');
console.log('');

console.log('📍 PASO 2: Generar Nueva Clave');
console.log('   ⚙️ Project Settings (ícono de engranaje)');
console.log('   📋 Service Accounts');
console.log('   🔑 Generate New Private Key');
console.log('   💾 Download → aqualab-83795-xxxxxx.json');
console.log('');

console.log('📍 PASO 3: Extraer Datos del JSON');
console.log('   📄 Abre el archivo .json descargado');
console.log('   📝 Copia estos valores:');
console.log('      - "project_id"');
console.log('      - "private_key_id"');
console.log('      - "private_key"');
console.log('      - "client_email"');
console.log('      - "client_id"');
console.log('');

console.log('📍 PASO 4: Convertir Private Key a Base64');
console.log('   🔤 Toma el valor de "private_key" (incluye \\n)');
console.log('   🛠️ Convierte a Base64:');
console.log('');
console.log('   # En Node.js:');
console.log('   const privateKey = "-----BEGIN PRIVATE KEY-----\\nMII...\\n-----END PRIVATE KEY-----\\n";');
console.log('   const base64 = Buffer.from(privateKey).toString("base64");');
console.log('   console.log(base64);');
console.log('');
console.log('   # O usa herramienta online: https://www.base64encode.org/');
console.log('');

console.log('📍 PASO 5: Actualizar Variables en Render');
console.log('   🌐 https://dashboard.render.com/');
console.log('   📱 Selecciona tu servicio: backend-registro-muestras');
console.log('   ⚙️ Environment');
console.log('   🔧 Actualiza estas variables:');
console.log('');
console.log('      FIREBASE_PROJECT_ID = [project_id del JSON]');
console.log('      FIREBASE_PRIVATE_KEY_ID = [private_key_id del JSON]');
console.log('      FIREBASE_CLIENT_EMAIL = [client_email del JSON]');
console.log('      FIREBASE_CLIENT_ID = [client_id del JSON]');
console.log('      FIREBASE_PRIVATE_KEY_BASE64 = [private_key convertida a Base64]');
console.log('');

console.log('📍 PASO 6: Reiniciar Servicio');
console.log('   🔄 En Render → Manual Deploy');
console.log('   ⏳ Esperar que termine el despliegue');
console.log('   ✅ Verificar que inicie sin errores');
console.log('');

console.log('📍 PASO 7: Probar Notificaciones');
console.log('   📱 Cambiar estado de muestra en la web');
console.log('   🔍 Verificar logs de Render');
console.log('   📲 Confirmar que llegue notificación al móvil');
console.log('');

console.log('✅ VERIFICACIÓN DE ÉXITO:');
console.log('=========================');
console.log('En los logs deberías ver:');
console.log('   ✅ "Enviando mensaje FCM:"');
console.log('   ✅ "Enviado exitosamente: projects/aqualab-83795/messages/..."');
console.log('   ❌ NO deberías ver: "secretOrPrivateKey must be an asymmetric key"');
console.log('');

console.log('🚨 IMPORTANTE:');
console.log('==============');
console.log('⚠️ Asegúrate de copiar la private_key COMPLETA');
console.log('⚠️ Incluye los \\n (saltos de línea) en la conversión');
console.log('⚠️ No agregues espacios extra o caracteres');
console.log('⚠️ Usa la clave tal como aparece en el JSON');
console.log('');

console.log('🎯 RESULTADO ESPERADO:');
console.log('======================');
console.log('✅ Firebase autenticará correctamente');
console.log('✅ Notificaciones para "Aceptada" seguirán funcionando');
console.log('✅ Notificaciones para "Recibida" empezarán a funcionar');
console.log('✅ Notificaciones para TODOS los estados funcionarán');
console.log('');

console.log('🏆 ESTO SOLUCIONARÁ EL PROBLEMA COMPLETAMENTE');
