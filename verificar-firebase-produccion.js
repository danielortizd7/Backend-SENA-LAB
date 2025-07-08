const axios = require('axios');

async function verificarFirebaseEnProduccion() {
    try {
        console.log('🔍 Verificando Firebase en producción...\n');
        
        // 1. Verificar diagnóstico público
        console.log('📊 VERIFICANDO CONFIGURACIÓN DE FIREBASE:');
        console.log('='.repeat(60));
        
        const diagResponse = await axios.get('https://backend-registro-muestras.onrender.com/api/notificaciones/diagnostico-publico');
        
        console.log(`🌍 Entorno: ${diagResponse.data.environment}`);
        console.log(`📝 Firebase Project ID: ${diagResponse.data.firebaseConfig?.projectId || 'NO DEFINIDO'}`);
        console.log(`📧 Client Email: ${diagResponse.data.firebaseConfig?.clientEmail || 'NO DEFINIDO'}`);
        console.log(`🔐 Private Key configurada: ${diagResponse.data.firebaseConfig?.hasPrivateKey ? '✅ SÍ' : '❌ NO'}`);
        console.log('');
        
        // 2. Verificar tokens disponibles
        console.log('📱 VERIFICANDO TOKENS FCM:');
        console.log('='.repeat(60));
        
        const tokensResponse = await axios.get('https://backend-registro-muestras.onrender.com/api/notificaciones/diagnostico-produccion');
        
        if (tokensResponse.data.success) {
            console.log(`📊 Tokens encontrados: ${tokensResponse.data.tokensCount}`);
            tokensResponse.data.tokens.forEach((token, index) => {
                console.log(`   Token ${index + 1}:`);
                console.log(`     - Cliente: ${token.clienteDocumento}`);
                console.log(`     - Plataforma: ${token.platform}`);
                console.log(`     - Longitud: ${token.tokenLength} chars`);
                console.log(`     - Formato válido: ${token.hasAPA91b ? '✅' : '❌'}`);
                console.log(`     - Completo: ${token.isComplete ? '✅' : '❌'}`);
            });
        }
        console.log('');
        
        // 3. Probar notificación de prueba
        console.log('🚀 PROBANDO NOTIFICACIÓN FCM:');
        console.log('='.repeat(60));
        
        try {
            const testResponse = await axios.post('https://backend-registro-muestras.onrender.com/api/notificaciones-test/local', {
                clienteDocumento: '1235467890',
                mensaje: 'Prueba de diagnóstico'
            });
            
            console.log('✅ RESULTADO DE PRUEBA FCM:');
            console.log(`   Success: ${testResponse.data.success}`);
            console.log(`   Message: ${testResponse.data.message}`);
            if (testResponse.data.data) {
                console.log(`   Dispositivos enviados: ${testResponse.data.data.devicesSent || 0}`);
                console.log(`   Dispositivos fallidos: ${testResponse.data.data.devicesFailed || 0}`);
            }
            
        } catch (testError) {
            console.log('❌ ERROR EN PRUEBA FCM:');
            if (testError.response) {
                console.log(`   Status: ${testError.response.status}`);
                console.log(`   Message: ${testError.response.data.message || 'Error desconocido'}`);
                if (testError.response.data.error) {
                    console.log(`   Error: ${testError.response.data.error}`);
                }
            } else {
                console.log(`   Error: ${testError.message}`);
            }
        }
        
        console.log('');
        console.log('🔧 SOLUCIONES SUGERIDAS:');
        console.log('='.repeat(60));
        console.log('1. Verifica que Cloud Messaging esté habilitado en Firebase Console');
        console.log('2. Confirma que el Project ID sea exactamente: aqualab-83795');
        console.log('3. Asegúrate de que el service account tenga permisos FCM');
        console.log('4. Regenera el token FCM en la app móvil si es necesario');
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
        if (error.response) {
            console.error('Respuesta del servidor:', error.response.data);
        }
    }
}

verificarFirebaseEnProduccion();
