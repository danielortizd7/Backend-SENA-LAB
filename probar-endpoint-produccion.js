/**
 * PROBAR ENDPOINT EXISTENTE EN PRODUCCIÓN
 * Script para verificar tokens usando endpoints que ya existen
 */

const https = require('https');

const RENDER_URL = 'https://backend-registro-muestras.onrender.com';

async function probarEndpointExistente() {
    try {
        console.log('🔍 === PROBANDO ENDPOINT EXISTENTE EN PRODUCCIÓN ===');
        console.log('==================================================');
        
        // Usar el endpoint que sabemos que existe
        console.log('\n📋 Probando endpoint debug/token-completo...');
        
        // Probar con Felipe
        const felipeUrl = `${RENDER_URL}/api/notifications/debug/token-completo/1235467890`;
        console.log('🔍 URL Felipe:', felipeUrl);
        
        const felipeResponse = await makeRequest(felipeUrl);
        
        if (felipeResponse.success) {
            console.log('✅ Token de Felipe encontrado:');
            console.log('   - Tokens count:', felipeResponse.data.tokensCount);
            
            felipeResponse.data.tokens.forEach((token, index) => {
                console.log(`\n🔑 TOKEN ${index + 1}:`);
                console.log('   - ID:', token.id);
                console.log('   - Documento:', token.clienteDocumento);
                console.log('   - Platform:', token.platform);
                console.log('   - Longitud:', token.tokenLength);
                console.log('   - Formato válido:', token.validFormat ? '✅ Sí' : '❌ No');
                console.log('   - Activo:', token.isActive ? '✅ Sí' : '❌ No');
                console.log('   - Creado:', token.createdAt);
                console.log('   - Token completo:', token.tokenCompleto);
            });
        } else {
            console.log('❌ Error:', felipeResponse.message);
        }
        
        // Probar con Daniela
        console.log('\n📋 Probando con Daniela...');
        const danielaUrl = `${RENDER_URL}/api/notifications/debug/token-completo/2129239233`;
        console.log('🔍 URL Daniela:', danielaUrl);
        
        const danielaResponse = await makeRequest(danielaUrl);
        
        if (danielaResponse.success) {
            console.log('✅ Token de Daniela encontrado:');
            console.log('   - Tokens count:', danielaResponse.data.tokensCount);
            
            danielaResponse.data.tokens.forEach((token, index) => {
                console.log(`\n🔑 TOKEN ${index + 1}:`);
                console.log('   - ID:', token.id);
                console.log('   - Documento:', token.clienteDocumento);
                console.log('   - Platform:', token.platform);
                console.log('   - Longitud:', token.tokenLength);
                console.log('   - Formato válido:', token.validFormat ? '✅ Sí' : '❌ No');
                console.log('   - Activo:', token.isActive ? '✅ Sí' : '❌ No');
                console.log('   - Creado:', token.createdAt);
                console.log('   - Token completo:', token.tokenCompleto);
            });
        } else {
            console.log('❌ Error:', danielaResponse.message);
        }
        
        console.log('\n🎯 === ANÁLISIS ===');
        console.log('==================');
        
        if (felipeResponse.success && danielaResponse.success) {
            const felipeToken = felipeResponse.data.tokens[0];
            const danielaToken = danielaResponse.data.tokens[0];
            
            console.log('📊 Comparación de tokens:');
            console.log('   - Felipe longitud:', felipeToken.tokenLength);
            console.log('   - Daniela longitud:', danielaToken.tokenLength);
            console.log('   - Felipe válido:', felipeToken.validFormat ? '✅' : '❌');
            console.log('   - Daniela válido:', danielaToken.validFormat ? '✅' : '❌');
            
            if (felipeToken.tokenLength < 140 || danielaToken.tokenLength < 140) {
                console.log('\n⚠️  TOKENS INCOMPLETOS DETECTADOS');
                console.log('🔧 Esto explica el error FCM 404 en producción');
                console.log('📱 Necesario regenerar tokens en la app Android');
            } else {
                console.log('\n✅ TOKENS COMPLETOS - Buscar otra causa del error');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'GET' }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve(parsedData);
                } catch (e) {
                    console.log('Raw response:', data);
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.end();
    });
}

// Ejecutar prueba
probarEndpointExistente().catch(console.error);
