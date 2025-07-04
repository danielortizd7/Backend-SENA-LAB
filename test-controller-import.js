// Test de importación del controlador final
try {
    const notificationController = require('./src/app/notificaciones/controllers/notificationController');
    
    console.log('✅ Controlador importado correctamente');
    console.log('📋 Funciones disponibles:');
    
    const functions = Object.getOwnPropertyNames(Object.getPrototypeOf(notificationController))
        .filter(name => name !== 'constructor' && typeof notificationController[name] === 'function');
    
    functions.forEach((func, index) => {
        console.log(`${index + 1}. ${func}`);
    });
    
    // Verificar función específica
    if (typeof notificationController.obtenerTokensCliente === 'function') {
        console.log('✅ obtenerTokensCliente está disponible');
    } else {
        console.log('❌ obtenerTokensCliente NO está disponible');
        console.log('🔍 Tipo:', typeof notificationController.obtenerTokensCliente);
    }
    
} catch (error) {
    console.error('❌ Error importando controlador:', error.message);
    console.error(error.stack);
}
