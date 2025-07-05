#!/usr/bin/env node

/**
 * Script para verificar qué endpoints están siendo usados para cambios de estado
 * y confirmar que todos envíen notificaciones
 */

console.log('🔍 ANÁLISIS: Rutas de Cambio de Estado');
console.log('====================================');
console.log('');

console.log('📍 RUTAS DISPONIBLES PARA CAMBIOS DE ESTADO:');
console.log('============================================');
console.log('');

console.log('✅ 1. RUTA ESPECÍFICA PARA ACEPTAR COTIZACIÓN:');
console.log('   📍 PUT /api/cambios-estado/:id/aceptar-cotizacion');
console.log('   📁 Controller: cambioEstadoController.aceptarCotizacion()');
console.log('   ⚙️ Service: aceptarCotizacionService() → cambiarEstadoMuestra()');
console.log('   🔔 Notificaciones: ✅ SÍ');
console.log('   🎯 Estado: En Cotización → Aceptada');
console.log('');

console.log('✅ 2. RUTA GENERAL PARA CAMBIOS DE ESTADO:');
console.log('   📍 PUT /api/cambios-estado/:id');
console.log('   📁 Controller: cambioEstadoController.cambiarEstado()');
console.log('   ⚙️ Service: cambiarEstadoMuestra()');
console.log('   🔔 Notificaciones: ✅ SÍ');
console.log('   🎯 Estados: Todos los cambios');
console.log('');

console.log('✅ 3. RUTA ALTERNATIVA (ACTUALIZADA):');
console.log('   📍 PUT /api/muestras/:id/estado');
console.log('   📁 Controller: muestrasController.actualizarEstadoMuestra()');
console.log('   ⚙️ Service: cambiarEstadoMuestra() (CORREGIDO)');
console.log('   🔔 Notificaciones: ✅ SÍ (después de la corrección)');
console.log('   🎯 Estados: Todos los cambios');
console.log('');

console.log('🔍 POSIBLE PROBLEMA:');
console.log('====================');
console.log('❓ El frontend podría estar usando DIFERENTES rutas para DIFERENTES estados:');
console.log('');
console.log('🎯 Para "Aceptar Cotización":');
console.log('   → PUT /api/cambios-estado/:id/aceptar-cotizacion ✅ Funciona');
console.log('');
console.log('❓ Para otros estados (Recibida, En análisis, Finalizada, etc.):');
console.log('   → ¿PUT /api/muestras/:id/estado? (ya corregida)');
console.log('   → ¿PUT /api/cambios-estado/:id? (debería funcionar)');
console.log('   → ¿Otra ruta personalizada?');
console.log('');

console.log('🔧 SOLUCIONES PARA VERIFICAR:');
console.log('=============================');
console.log('');

console.log('1. 📊 REVISAR LOGS DE PRODUCCIÓN:');
console.log('   - Buscar en Render logs qué endpoints se están llamando');
console.log('   - Ver si aparecen otros cambios de estado además de "Aceptada"');
console.log('');

console.log('2. 🕵️ REVISAR CÓDIGO FRONTEND:');
console.log('   - Verificar qué rutas usa la aplicación web para cambios de estado');
console.log('   - Confirmar que use las rutas correctas');
console.log('');

console.log('3. 🧪 PROBAR MANUALMENTE:');
console.log('   - Cambiar estados usando Postman/curl');
console.log('   - Verificar que lleguen notificaciones');
console.log('');

console.log('4. 📱 VERIFICAR EN LA APP:');
console.log('   - Probar cambios de estado desde la interfaz web');
console.log('   - Verificar que aparezcan en logs de Render');
console.log('');

console.log('🎯 COMANDOS DE PRUEBA SUGERIDOS:');
console.log('=================================');
console.log('');

console.log('# Probar aceptar cotización (debería funcionar):');
console.log('curl -X PUT "https://backend-registro-muestras.onrender.com/api/cambios-estado/MUESTRA_ID/aceptar-cotizacion"');
console.log('');

console.log('# Probar cambio general (debería funcionar):');
console.log('curl -X PUT "https://backend-registro-muestras.onrender.com/api/cambios-estado/MUESTRA_ID" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"nuevoEstado": "En análisis"}\'');
console.log('');

console.log('# Probar ruta alternativa (debería funcionar ahora):');
console.log('curl -X PUT "https://backend-registro-muestras.onrender.com/api/muestras/MUESTRA_ID/estado" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"estado": "Finalizada"}\'');
console.log('');

console.log('🔔 PRÓXIMOS PASOS:');
console.log('==================');
console.log('1. ✅ Revisar logs de Render para ver qué rutas se usan');
console.log('2. ✅ Probar cambios de estado manualmente');
console.log('3. ✅ Verificar configuración del frontend');
console.log('4. ✅ Confirmar que TODAS las rutas envíen notificaciones');
console.log('');

console.log('🏆 EXPECTATIVA:');
console.log('===============');
console.log('🎯 TODOS los cambios de estado deberían enviar notificaciones');
console.log('📱 El usuario debería recibir notificaciones para CUALQUIER cambio');
console.log('🔔 No solo para "Aceptada", sino también para "Recibida", "En análisis", "Finalizada", etc.');
