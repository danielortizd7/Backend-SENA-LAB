const axios = require('axios');

async function verificarDirectamente() {
    console.log('🔍 VERIFICACIÓN DIRECTA - ENDPOINTS PRINCIPALES');
    console.log('===============================================');
    
    const baseURL = 'https://backend-sena-lab.onrender.com';
    
    const endpoints = [
        '/api/diagnostico/firebase-produccion',
        '/api/diagnostico/verificar-private-key',
        '/api/diagnostico/verificar-credenciales-firebase',
        '/api/diagnostico/probar-fcm'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\n🔍 Probando: ${endpoint}`);
            
            let response;
            if (endpoint === '/api/diagnostico/probar-fcm') {
                // POST request for FCM test
                response = await axios.post(`${baseURL}${endpoint}`, {
                    token: 'cDhnBKZNSyWYm7pzDZOmkQ:APA91bG4f_test_token_for_diagnostic_purposes_only',
                    titulo: 'Prueba Post-Redeploy',
                    mensaje: 'Verificando que FCM funcione correctamente'
                }, {
                    timeout: 20000
                });
            } else {
                // GET request
                response = await axios.get(`${baseURL}${endpoint}`, {
                    timeout: 20000
                });
            }
            
            console.log(`   ✅ ÉXITO (${response.status})`);
            console.log(`   📄 Respuesta:`, JSON.stringify(response.data, null, 2));
            
        } catch (error) {
            console.log(`   ❌ ERROR (${error.response?.status || 'NO_RESPONSE'})`);
            
            if (error.response?.data) {
                console.log(`   📄 Detalle:`, JSON.stringify(error.response.data, null, 2));
            } else {
                console.log(`   📄 Detalle:`, error.message);
            }
            
            // Si es timeout, esperar un poco antes del siguiente
            if (error.code === 'ECONNABORTED') {
                console.log('   ⏰ Esperando 5 segundos antes del siguiente...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
    
    console.log('\n🎯 CONCLUSIÓN:');
    console.log('================');
    console.log('Si todos los endpoints respondieron correctamente, ¡el problema está resuelto!');
    console.log('Si hay errores, revisar los logs de Render para más detalles.');
}

verificarDirectamente();
