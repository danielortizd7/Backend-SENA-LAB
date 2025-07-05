#!/usr/bin/env node

/**
 * Script para demostrar cómo probar TODAS las rutas de cambio de estado
 * en producción y verificar que envíen notificaciones
 */

console.log('🧪 GUÍA DE PRUEBAS: Cambios de Estado en Producción');
console.log('==================================================');
console.log('');

console.log('🎯 OBJETIVO:');
console.log('Verificar que TODOS los cambios de estado envíen notificaciones automáticamente');
console.log('');

console.log('📱 PROBLEMA OBSERVADO:');
console.log('Solo aparecen notificaciones para "Cotización Aceptada"');
console.log('Faltan notificaciones para otros estados como "Recibida", "En análisis", "Finalizada"');
console.log('');

console.log('🔍 RUTAS A PROBAR:');
console.log('==================');
console.log('');

// Datos de ejemplo (reemplazar con datos reales)
const BASE_URL = 'https://backend-registro-muestras.onrender.com';
const MUESTRA_ID = 'PF250705006'; // ID de muestra real
const TOKEN = 'tu_token_jwt_aqui'; // Token de administrador

console.log('1. ✅ ACEPTAR COTIZACIÓN (ya funciona):');
console.log(`   POST ${BASE_URL}/api/cambios-estado/${MUESTRA_ID}/aceptar-cotizacion`);
console.log('   Headers: { "Authorization": "Bearer ' + TOKEN + '" }');
console.log('   Body: (vacío)');
console.log('   📧 Resultado: Debería enviar notificación "✅ Cotización Aceptada"');
console.log('');

console.log('2. 🔄 CAMBIAR A "RECIBIDA":');
console.log(`   PUT ${BASE_URL}/api/cambios-estado/${MUESTRA_ID}`);
console.log('   Headers: { "Authorization": "Bearer ' + TOKEN + '", "Content-Type": "application/json" }');
console.log('   Body: { "nuevoEstado": "Recibida" }');
console.log('   📧 Resultado: Debería enviar notificación "📦 Muestra Recibida"');
console.log('');

console.log('3. 🔬 CAMBIAR A "EN ANÁLISIS":');
console.log(`   PUT ${BASE_URL}/api/cambios-estado/${MUESTRA_ID}`);
console.log('   Headers: { "Authorization": "Bearer ' + TOKEN + '", "Content-Type": "application/json" }');
console.log('   Body: { "nuevoEstado": "En análisis" }');
console.log('   📧 Resultado: Debería enviar notificación "🔬 Análisis en Proceso"');
console.log('');

console.log('4. ✅ CAMBIAR A "FINALIZADA":');
console.log(`   PUT ${BASE_URL}/api/cambios-estado/${MUESTRA_ID}`);
console.log('   Headers: { "Authorization": "Bearer ' + TOKEN + '", "Content-Type": "application/json" }');
console.log('   Body: { "nuevoEstado": "Finalizada" }');
console.log('   📧 Resultado: Debería enviar notificación "✅ Resultados Disponibles"');
console.log('');

console.log('🔧 COMANDOS CURL LISTOS PARA USAR:');
console.log('==================================');
console.log('');

console.log('# 1. Obtener token de autenticación:');
console.log(`curl -X POST "${BASE_URL}/api/auth/login" \\`);
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"documento": "12345678", "password": "tu_password"}\'');
console.log('');

console.log('# 2. Probar cambio a Recibida:');
console.log(`curl -X PUT "${BASE_URL}/api/cambios-estado/${MUESTRA_ID}" \\`);
console.log('  -H "Authorization: Bearer TU_TOKEN_AQUI" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"nuevoEstado": "Recibida"}\'');
console.log('');

console.log('# 3. Probar cambio a En análisis:');
console.log(`curl -X PUT "${BASE_URL}/api/cambios-estado/${MUESTRA_ID}" \\`);
console.log('  -H "Authorization: Bearer TU_TOKEN_AQUI" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"nuevoEstado": "En análisis"}\'');
console.log('');

console.log('# 4. Probar cambio a Finalizada:');
console.log(`curl -X PUT "${BASE_URL}/api/cambios-estado/${MUESTRA_ID}" \\`);
console.log('  -H "Authorization: Bearer TU_TOKEN_AQUI" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"nuevoEstado": "Finalizada"}\'');
console.log('');

console.log('📊 QUÉ VERIFICAR EN LOS LOGS DE RENDER:');
console.log('======================================');
console.log('Después de cada comando, deberías ver en los logs:');
console.log('');
console.log('✅ 1. Request recibido:');
console.log('   🔄 Cambiando estado de muestra MUESTRA_ID a: NUEVO_ESTADO');
console.log('');
console.log('✅ 2. Notificación enviada:');
console.log('   📨 Enviando notificación de cambio de estado:');
console.log('   📱 Encontrados X dispositivos activos para cliente...');
console.log('   📧 Enviando notificaciones individuales...');
console.log('   ✅ Enviado exitosamente: projects/aqualab-83795/messages/...');
console.log('');
console.log('✅ 3. Respuesta exitosa:');
console.log('   ✅ Estado actualizado exitosamente con notificación automática');
console.log('');

console.log('🎯 RESULTADO ESPERADO:');
console.log('======================');
console.log('📱 En la app Android deberías ver notificaciones para:');
console.log('');
console.log('📦 "Muestra Recibida" - Su muestra PF250705006 ha sido recibida...');
console.log('🔬 "Análisis en Proceso" - Su muestra PF250705006 está siendo analizada...');
console.log('✅ "Resultados Disponibles" - ¡Sus resultados están listos!...');
console.log('');

console.log('🚨 SI NO FUNCIONAN:');
console.log('===================');
console.log('1. ❌ Si no aparecen en logs → El frontend no está usando las rutas correctas');
console.log('2. ❌ Si aparecen en logs pero no llegan notificaciones → Problema de FCM');
console.log('3. ❌ Si da error de autenticación → Token inválido o expirado');
console.log('');

console.log('💡 RECOMENDACIÓN:');
console.log('=================');
console.log('1. 🧪 Prueba estos comandos manualmente con curl/Postman');
console.log('2. 📊 Revisa los logs de Render durante las pruebas');
console.log('3. 🔍 Si funcionan manualmente, el problema está en el frontend');
console.log('4. 🛠️ Si no funcionan, hay que debuggear el backend');
console.log('');

console.log('🔗 FRONTEND QUE DEBERÍA USAR:');
console.log('=============================');
console.log('Para TODOS los cambios de estado (excepto aceptar cotización):');
console.log('   PUT /api/cambios-estado/:id');
console.log('   Body: { "nuevoEstado": "NUEVO_ESTADO" }');
console.log('');
console.log('Solo para aceptar cotizaciones:');
console.log('   PUT /api/cambios-estado/:id/aceptar-cotizacion');
console.log('   Body: (vacío)');
console.log('');

console.log('🎉 ¡ESPERAMOS QUE TODOS LOS CAMBIOS ENVÍEN NOTIFICACIONES!');
console.log('=========================================================');
