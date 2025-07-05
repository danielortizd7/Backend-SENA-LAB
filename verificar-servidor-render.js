const https = require('https');

console.log('🔍 VERIFICACIÓN DEL SERVIDOR DE RENDER');
console.log('=====================================');

const BACKEND_URL = 'https://backend-sena-lab.onrender.com';

function makeRequest(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        
        req.on('error', reject);
        req.setTimeout(timeout, () => {
            req.abort();
            reject(new Error('Timeout'));
        });
    });
}

async function verificarServidor() {
    try {
        console.log('\n1. VERIFICANDO CONECTIVIDAD BÁSICA:');
        console.log(`   URL: ${BACKEND_URL}`);
        
        const response = await makeRequest(BACKEND_URL);
        
        console.log('✅ Respuesta del servidor:');
        console.log('   Status Code:', response.status);
        console.log('   Headers:', JSON.stringify(response.headers, null, 2));
        console.log('   Body (primeros 500 chars):', response.body.substring(0, 500));
        
        // Verificar si es un error de configuración
        if (response.status === 404) {
            console.log('\n❌ PROBLEMA DETECTADO:');
            console.log('   - El servidor devuelve 404 para todas las rutas');
            console.log('   - Esto indica que el servidor NO se está iniciando correctamente');
            console.log('   - Probable causa: Error en la inicialización debido a Firebase');
        } else if (response.status >= 200 && response.status < 300) {
            console.log('\n✅ SERVIDOR FUNCIONANDO:');
            console.log('   - El servidor responde correctamente');
            console.log('   - Problema puede estar en las rutas específicas');
        } else {
            console.log('\n⚠️  SERVIDOR CON PROBLEMAS:');
            console.log('   - Status code no esperado:', response.status);
        }
        
        console.log('\n2. VERIFICANDO SI HAY CONTENIDO HTML (ERROR PAGE):');
        if (response.body.includes('<html>') || response.body.includes('<!DOCTYPE')) {
            console.log('❌ El servidor devuelve una página HTML de error');
            console.log('   Esto confirma que hay un problema en la inicialización');
        } else {
            console.log('✅ No es una página de error HTML');
        }
        
    } catch (error) {
        console.log('❌ ERROR DE CONECTIVIDAD:', error.message);
        console.log('   - El servidor puede estar completamente inactivo');
        console.log('   - O puede estar en proceso de inicialización');
    }
}

console.log('\n🔧 PASOS PARA RESOLVER:');
console.log('1. Ve a tu panel de Render y revisa los LOGS del servicio');
console.log('2. Busca errores relacionados con Firebase o variables de entorno');
console.log('3. Si hay errores, es probable que sea por la configuración de FIREBASE_PRIVATE_KEY');
console.log('4. Asegúrate de que la variable tenga EXACTAMENTE este formato:');
console.log('   "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
console.log('   (CON comillas dobles al principio y al final)');

verificarServidor();
