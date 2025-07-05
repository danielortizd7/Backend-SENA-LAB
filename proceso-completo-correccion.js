require('dotenv').config();
const https = require('https');

console.log('🔧 PROCESO COMPLETO DE CORRECCIÓN DE CLAVE FIREBASE');
console.log('==================================================');

const BACKEND_URL = 'https://backend-sena-lab.onrender.com';

// Función para hacer petición HTTP
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    resolve({ error: 'Respuesta no válida', rawData: data });
                }
            });
        }).on('error', reject);
    });
}

async function procesarCorreccionCompleta() {
    console.log('\n📋 PASO 1: MOSTRAR FORMATO CORRECTO DE CLAVE');
    console.log('='.repeat(50));
    
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey) {
        console.log('❌ ERROR: No se puede cargar FIREBASE_PRIVATE_KEY del archivo .env');
        console.log('Asegúrate de que el archivo .env esté presente y configurado');
        return;
    }
    
    const cleanedKey = privateKey.trim();
    console.log('✅ Clave privada cargada correctamente');
    console.log(`Longitud: ${cleanedKey.length} caracteres`);
    console.log(`Líneas: ${cleanedKey.split('\n').length}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('COPIA ESTA CLAVE PARA RENDER (SIN COMILLAS):');
    console.log('='.repeat(60));
    console.log(cleanedKey);
    console.log('='.repeat(60));
    
    console.log('\n📋 PASO 2: INSTRUCCIONES PARA ACTUALIZAR EN RENDER');
    console.log('='.repeat(50));
    console.log('1. Abre tu dashboard de Render: https://dashboard.render.com/');
    console.log('2. Selecciona tu servicio "Backend-SENA-LAB"');
    console.log('3. Ve a "Environment" en el menú lateral');
    console.log('4. Busca la variable "FIREBASE_PRIVATE_KEY"');
    console.log('5. Haz clic en "Edit" junto a esa variable');
    console.log('6. Borra el contenido actual completamente');
    console.log('7. Copia y pega EXACTAMENTE la clave de arriba (SIN COMILLAS)');
    console.log('8. Haz clic en "Save Changes"');
    console.log('9. Espera a que se complete el redespliegue automático');
    console.log('10. Vuelve a ejecutar este script para verificar');
    
    console.log('\n📋 PASO 3: VERIFICANDO ESTADO ACTUAL EN PRODUCCIÓN');
    console.log('='.repeat(50));
    
    try {
        const response = await makeRequest(`${BACKEND_URL}/api/debug/diagnostico-fcm`);
        
        if (response.error) {
            console.log('❌ No se pudo conectar al servidor de producción');
            console.log('Error:', response.error);
            console.log('Esto puede indicar que el servidor está reiniciando después de la actualización');
        } else {
            console.log('✅ Servidor de producción respondiendo');
            console.log('\nEstado de Firebase:');
            console.log('- Firebase inicializado:', response.firebaseInitialized ? '✅' : '❌');
            console.log('- FCM disponible:', response.fcmAvailable ? '✅' : '❌');
            console.log('- Estado general:', response.status);
            
            if (response.privateKeyFormat) {
                console.log('\nFormato de clave privada:');
                console.log('- Existe:', response.privateKeyFormat.exists ? '✅' : '❌');
                console.log('- Longitud:', response.privateKeyFormat.length);
                console.log('- Marcador BEGIN:', response.privateKeyFormat.hasBeginMarker ? '✅' : '❌');
                console.log('- Marcador END:', response.privateKeyFormat.hasEndMarker ? '✅' : '❌');
                console.log('- Saltos de línea:', response.privateKeyFormat.hasNewlines ? '✅' : '❌');
                console.log('- Número de líneas:', response.privateKeyFormat.lineCount);
                console.log('- Número de \\n:', response.privateKeyFormat.newlineCount);
                
                // Validar formato
                const formatoValido = response.privateKeyFormat.exists &&
                                    response.privateKeyFormat.length > 1600 &&
                                    response.privateKeyFormat.hasBeginMarker &&
                                    response.privateKeyFormat.hasEndMarker &&
                                    response.privateKeyFormat.hasNewlines &&
                                    response.privateKeyFormat.lineCount >= 27 &&
                                    response.privateKeyFormat.newlineCount >= 26;
                
                console.log('- Formato válido:', formatoValido ? '✅' : '❌');
                
                if (!formatoValido) {
                    console.log('\n⚠️  FORMATO DE CLAVE INVÁLIDO - REQUIERE ACTUALIZACIÓN');
                } else {
                    console.log('\n✅ FORMATO DE CLAVE CORRECTO');
                }
            }
        }
    } catch (error) {
        console.log('❌ Error al verificar producción:', error.message);
    }
    
    console.log('\n📋 PASO 4: PRÓXIMOS PASOS');
    console.log('='.repeat(50));
    console.log('Después de actualizar la clave en Render:');
    console.log('1. Espera 2-3 minutos a que se complete el redespliegue');
    console.log('2. Ejecuta este script nuevamente para verificar');
    console.log('3. Si todo está ✅, prueba enviar notificaciones');
    console.log('4. Usa el script: node probar-token-completo-produccion.js');
    
    console.log('\n📞 SOPORTE ADICIONAL:');
    console.log('- Si aún hay problemas, revisa los logs en Render');
    console.log('- Verifica que la clave se copió sin caracteres extra');
    console.log('- Asegúrate de que no hay espacios al inicio o final');
}

// Ejecutar proceso completo
procesarCorreccionCompleta().catch(error => {
    console.error('❌ Error en proceso:', error);
});
