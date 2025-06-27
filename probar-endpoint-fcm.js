const https = require('https');

async function probarEndpointFCMAPI() {
    console.log('🧪 === PROBANDO ENDPOINT FCM API EN PRODUCCIÓN ===\n');
    
    const options = {
        hostname: 'backend-sena-lab.onrender.com',
        port: 443,
        path: '/api/notificaciones/verificar-fcm-api',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'FCM-Test-Script/1.0'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            console.log(`📋 Status Code: ${res.statusCode}`);
            console.log(`📋 Headers:`, res.headers);
            
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('\n✅ RESPUESTA DEL SERVIDOR:');
                    console.log(JSON.stringify(response, null, 2));
                    resolve(response);
                } catch (error) {
                    console.log('\n📄 RESPUESTA RAW (no JSON):');
                    console.log(data);
                    resolve({ raw: data });
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Error en la petición:', error);
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            console.error('❌ Timeout - El servidor no respondió en 10 segundos');
            req.destroy();
            reject(new Error('Timeout'));
        });
        
        req.end();
    });
}

// Ejecutar la prueba
probarEndpointFCMAPI()
    .then(() => {
        console.log('\n🏁 Prueba completada');
    })
    .catch((error) => {
        console.error('\n❌ Error en la prueba:', error.message);
    });
