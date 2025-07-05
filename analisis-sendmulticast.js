console.log('🔧 PRUEBA DE ENVÍO FCM INDIVIDUAL VS MULTICAST');
console.log('===============================================');

// Simular el problema con sendMulticast vs send
const admin = require('firebase-admin');

async function probarEnvioFCM() {
    try {
        console.log('\n1. ANÁLISIS DEL PROBLEMA:');
        console.log('❌ Error 404 /batch sugiere problema con sendMulticast()');
        console.log('💡 Posible solución: usar send() individual en lugar de sendMulticast()');
        
        console.log('\n2. DIFERENCIAS DE MÉTODOS:');
        console.log('📦 sendMulticast() → Usa endpoint /batch (puede dar 404)');
        console.log('📧 send() → Usa endpoint individual (más confiable)');
        
        console.log('\n3. RECOMENDACIÓN:');
        console.log('Cambiar de sendMulticast() a send() individual para cada token');
        
        console.log('\n4. CÓDIGO MEJORADO:');
        console.log('// En lugar de:');
        console.log('// response = await admin.messaging().sendMulticast(message);');
        console.log('');
        console.log('// Usar:');
        console.log('// const responses = [];');
        console.log('// for (const token of tokens) {');
        console.log('//   const singleMessage = { ...message, token };');
        console.log('//   delete singleMessage.tokens;');
        console.log('//   const response = await admin.messaging().send(singleMessage);');
        console.log('//   responses.push(response);');
        console.log('// }');
        
        console.log('\n5. VENTAJAS DEL CAMBIO:');
        console.log('✅ Evita el endpoint /batch problemático');
        console.log('✅ Mejor manejo de errores por token individual');
        console.log('✅ Mayor compatibilidad con diferentes versiones de FCM');
        console.log('✅ Logging más detallado por dispositivo');
        
        console.log('\n6. IMPLEMENTACIÓN:');
        console.log('Voy a modificar el notificationService.js para usar send() individual');
        
    } catch (error) {
        console.error('❌ Error en análisis:', error.message);
    }
}

probarEnvioFCM();
