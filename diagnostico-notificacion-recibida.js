#!/usr/bin/env node

/**
 * Diagnóstico: ¿Por qué la notificación de "Recibida" no llegó al móvil?
 */

console.log('🔍 DIAGNÓSTICO: Notificación "Recibida" no llegó al móvil');
console.log('======================================================');
console.log('');

console.log('📊 ANÁLISIS DE LOGS:');
console.log('===================');
console.log('');

console.log('✅ CAMBIO 1: "En Cotización" → "Aceptada"');
console.log('   🔔 Notificación enviada: ✅ SÍ');
console.log('   📱 Llegó al móvil: ✅ SÍ');
console.log('   🎯 FCM Response: projects/aqualab-83795/messages/0:1751685296962142%19820fae19820fae');
console.log('');

console.log('❓ CAMBIO 2: "Aceptada" → "Recibida"');
console.log('   🔔 Notificación procesada: ✅ SÍ (se ve en logs)');
console.log('   📱 Llegó al móvil: ❌ NO');
console.log('   🎯 FCM Response: ???');
console.log('');

console.log('🔍 POSIBLES CAUSAS:');
console.log('==================');
console.log('');

console.log('1. 🚫 NO SE ENVIÓ LA NOTIFICACIÓN FCM:');
console.log('   - El cambio de estado se procesó');
console.log('   - Pero no se llamó a enviarNotificacionCambioEstado()');
console.log('   - O falló silenciosamente');
console.log('');

console.log('2. 🔄 DIFERENTE RUTA USADA:');
console.log('   - Para "Aceptada": /api/cambios-estado/:id/aceptar-cotizacion');
console.log('   - Para "Recibida": /api/muestras/:id/estado');
console.log('   - Posible diferencia en el flow de notificaciones');
console.log('');

console.log('3. 🎯 CONFIGURACIÓN DE NOTIFICACIÓN:');
console.log('   - Título/mensaje específico para "Recibida"');
console.log('   - Posible error en la construcción del mensaje');
console.log('');

console.log('4. 📱 PROBLEMA DEL DISPOSITIVO:');
console.log('   - Token FCM cambió entre las dos notificaciones');
console.log('   - Dispositivo se desconectó temporalmente');
console.log('   - Filtro de notificaciones en el dispositivo');
console.log('');

console.log('🔧 PASOS PARA DIAGNOSTICAR:');
console.log('===========================');
console.log('');

console.log('1. 📋 REVISAR LOGS COMPLETOS:');
console.log('   - Buscar mensajes de notificación para "Recibida"');
console.log('   - Verificar si aparece "Enviando notificación de cambio de estado"');
console.log('   - Buscar FCM response para el segundo cambio');
console.log('');

console.log('2. 🧪 PROBAR MANUALMENTE:');
console.log('   - Cambiar una muestra a "Recibida" usando curl');
console.log('   - Verificar que aparezca en logs de Render');
console.log('   - Confirmar que llegue la notificación');
console.log('');

console.log('3. 🔍 VERIFICAR CONFIGURACIÓN:');
console.log('   - Comprobar que ambas rutas usen cambiarEstadoMuestra()');
console.log('   - Verificar que se llame a enviarNotificacionCambioEstado()');
console.log('');

console.log('🎯 COMANDOS DE PRUEBA:');
console.log('=====================');
console.log('');

console.log('# Probar cambio a "Recibida" (ruta muestras):');
console.log('curl -X PUT "https://backend-registro-muestras.onrender.com/api/muestras/PF250705008/estado" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"estado": "En análisis"}\'');
console.log('');

console.log('# Probar cambio a "En análisis" (ruta cambios-estado):');
console.log('curl -X PUT "https://backend-registro-muestras.onrender.com/api/cambios-estado/PF250705008" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"nuevoEstado": "Finalizada"}\'');
console.log('');

console.log('📊 QUÉ BUSCAR EN LOGS:');
console.log('=====================');
console.log('');

console.log('✅ PARA NOTIFICACIÓN EXITOSA (como "Aceptada"):');
console.log('   📨 "Enviando notificación de cambio de estado:"');
console.log('   📱 "Encontrados X dispositivos activos"');
console.log('   🚀 "Enviando mensaje FCM:"');
console.log('   📧 "Enviando notificaciones individuales"');
console.log('   ✅ "Enviado exitosamente: projects/aqualab-83795/messages/..."');
console.log('   🎯 "Push notification enviada a X/X dispositivos"');
console.log('');

console.log('❌ PARA NOTIFICACIÓN FALLIDA:');
console.log('   📨 "Enviando notificación de cambio de estado:" → ❌ NO APARECE');
console.log('   🚫 O aparece pero falla en algún paso');
console.log('   📱 O no encuentra dispositivos activos');
console.log('   🔴 O FCM devuelve error');
console.log('');

console.log('🔍 PRÓXIMA ACCIÓN:');
console.log('==================');
console.log('');

console.log('1. 📋 Revisa los logs completos de Render');
console.log('2. 🔍 Busca específicamente el momento del cambio a "Recibida"');
console.log('3. 📱 Verifica si aparecen mensajes de notificación FCM');
console.log('4. 🧪 Prueba manualmente otro cambio de estado');
console.log('5. 📊 Compara los logs entre "Aceptada" (exitosa) y "Recibida" (fallida)');
console.log('');

console.log('🎯 HIPÓTESIS PRINCIPAL:');
console.log('=======================');
console.log('');

console.log('🤔 La ruta /api/muestras/:id/estado podría tener un problema');
console.log('   en el flow de notificaciones que no está presente en');
console.log('   /api/cambios-estado/:id/aceptar-cotizacion');
console.log('');

console.log('📋 NECESITAMOS VER:');
console.log('   - ¿Aparece "Enviando notificación de cambio de estado" para Recibida?');
console.log('   - ¿Se encontró el dispositivo activo?');
console.log('   - ¿Se envió el mensaje FCM?');
console.log('   - ¿Hubo algún error en el proceso?');
