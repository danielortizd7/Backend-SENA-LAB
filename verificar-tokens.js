const axios = require('axios');

async function verificarTokenRegistrado() {
    try {
        console.log('🔍 Verificando tokens registrados...\n');
        
        const response = await axios.get('https://backend-registro-muestras.onrender.com/api/notificaciones/diagnostico-produccion');
        
        if (response.data.success) {
            console.log(`📱 TOKENS REGISTRADOS: ${response.data.tokensCount}`);
            console.log('='.repeat(50));
            
            response.data.tokens.forEach((token, index) => {
                console.log(`Token ${index + 1}:`);
                console.log(`  Cliente: ${token.clienteDocumento}`);
                console.log(`  Plataforma: ${token.platform}`);
                console.log(`  Longitud: ${token.tokenLength} chars`);
                console.log(`  Formato válido: ${token.hasAPA91b ? '✅' : '❌'}`);
                console.log(`  Completo: ${token.isComplete ? '✅' : '❌'}`);
                console.log(`  Creado: ${token.createdAt}`);
                console.log('');
            });
            
            if (response.data.tokensCount > 0) {
                console.log('✅ HAY TOKENS REGISTRADOS - Las notificaciones deberían funcionar');
                console.log('📱 Puedes probar cambiando el estado de una muestra');
            } else {
                console.log('❌ NO HAY TOKENS REGISTRADOS - Necesitas registrar la app móvil primero');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verificarTokenRegistrado();
