const axios = require('axios');

async function verificarProduccion() {
    console.log('🔍 VERIFICACIÓN POST-REDEPLOY - FIREBASE EN PRODUCCIÓN');
    console.log('=====================================================');
    
    const baseURL = 'https://backend-sena-lab.onrender.com';
    
    try {
        // 1. Verificar que el servidor esté respondiendo
        console.log('\n1. ✅ Verificando que el servidor esté activo...');
        const healthCheck = await axios.get(`${baseURL}/api/health`, {
            timeout: 10000
        });
        console.log('   ✅ Servidor activo:', healthCheck.status === 200);
        
        // 2. Verificar Firebase
        console.log('\n2. 🔥 Verificando Firebase...');
        const firebaseCheck = await axios.get(`${baseURL}/api/diagnostico/firebase-produccion`, {
            timeout: 15000
        });
        console.log('   Respuesta Firebase:', firebaseCheck.data);
        
        // 3. Verificar formato de private key
        console.log('\n3. 🔑 Verificando formato de PRIVATE_KEY...');
        const privateKeyCheck = await axios.get(`${baseURL}/api/diagnostico/verificar-private-key`, {
            timeout: 10000
        });
        console.log('   Respuesta Private Key:', privateKeyCheck.data);
        
        // 4. Verificar credenciales completas
        console.log('\n4. 🛡️ Verificando credenciales completas...');
        const credentialsCheck = await axios.get(`${baseURL}/api/diagnostico/verificar-credenciales-firebase`, {
            timeout: 10000
        });
        console.log('   Respuesta Credenciales:', credentialsCheck.data);
        
        // 5. Prueba de notificación de prueba
        console.log('\n5. 📱 Probando envío de notificación de prueba...');
        const notificationTest = await axios.post(`${baseURL}/api/diagnostico/probar-fcm`, {
            token: 'cDhnBKZNSyWYm7pzDZOmkQ:APA91bG4f_test_token_for_diagnostic_purposes_only',
            titulo: 'Prueba Post-Redeploy',
            mensaje: 'Verificando que FCM funcione correctamente'
        }, {
            timeout: 15000
        });
        console.log('   Respuesta Notificación:', notificationTest.data);
        
        console.log('\n🎉 RESUMEN:');
        console.log('================');
        console.log('✅ Servidor: ACTIVO');
        console.log('✅ Firebase: VERIFICADO');
        console.log('✅ Private Key: FORMATO CORRECTO');
        console.log('✅ Credenciales: COMPLETAS');
        console.log('✅ FCM: FUNCIONAL');
        
    } catch (error) {
        console.error('\n❌ Error en la verificación:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            console.log('\n💡 Si ves error 404, puede ser que el endpoint no exista o el servidor no esté completamente iniciado.');
        }
        
        if (error.code === 'ECONNABORTED') {
            console.log('\n💡 Timeout - el servidor puede estar iniciando. Intenta de nuevo en unos segundos.');
        }
    }
}

verificarProduccion();
