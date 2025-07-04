/**
 * PROBAR DIAGNÓSTICO EN PRODUCCIÓN
 * Script para verificar tokens en el servidor de Render
 */

const https = require('https');
const http = require('http');

const RENDER_URL = 'https://backend-registro-muestras.onrender.com';

async function diagnosticoProduccion() {
    try {
        console.log('🔍 === DIAGNÓSTICO DE TOKENS EN PRODUCCIÓN ===');
        console.log('==============================================');
        
        // 1. Verificar tokens generales
        console.log('\n📋 1. Verificando tokens generales...');
        const tokensResponse = await makeRequest(`${RENDER_URL}/api/notifications/diagnostico-produccion`);
        
        if (tokensResponse.success) {
            console.log('✅ Tokens encontrados:', tokensResponse.tokensCount);
            
            tokensResponse.tokens.forEach((token, index) => {
                console.log(`\n🔑 TOKEN ${index + 1}:`);
                console.log('   - Cliente:', token.clienteDocumento);
                console.log('   - Platform:', token.platform);
                console.log('   - Longitud:', token.tokenLength);
                console.log('   - Inicio:', token.tokenStart);
                console.log('   - Final:', token.tokenEnd);
                console.log('   - Formato válido:', token.hasAPA91b ? '✅ Sí' : '❌ No');
                console.log('   - Completo:', token.isComplete ? '✅ Sí' : '❌ No');
                console.log('   - Creado:', token.createdAt);
            });
        } else {
            console.log('❌ Error obteniendo tokens:', tokensResponse.message);
        }
        
        // 2. Verificar token específico de Felipe
        console.log('\n📋 2. Verificando token específico de Felipe...');
        const felipeResponse = await makeRequest(`${RENDER_URL}/api/notifications/validar-token-produccion`, {
            clienteDocumento: '1235467890'
        });
        
        if (felipeResponse.success) {
            const token = felipeResponse.tokenInfo;
            console.log('✅ Token de Felipe encontrado:');
            console.log('   - ID:', token.id);
            console.log('   - Documento:', token.clienteDocumento);
            console.log('   - Platform:', token.platform);
            console.log('   - Longitud:', token.tokenLength);
            console.log('   - Inicio:', token.tokenStart);
            console.log('   - Final:', token.tokenEnd);
            console.log('   - Formato válido:', token.hasAPA91b ? '✅ Sí' : '❌ No');
            console.log('   - Completo:', token.isComplete ? '✅ Sí' : '❌ No');
            console.log('   - Creado:', token.createdAt);
            
            // Verificar si necesitamos el token completo
            if (!token.isComplete) {
                console.log('\n⚠️  TOKEN INCOMPLETO DETECTADO');
                console.log('🔍 Obteniendo token completo...');
                
                const fullTokenResponse = await makeRequest(`${RENDER_URL}/api/notifications/validar-token-produccion?showFull=true`, {
                    clienteDocumento: '1235467890'
                });
                
                if (fullTokenResponse.success) {
                    console.log('🔑 Token completo:', fullTokenResponse.tokenInfo.tokenCompleto);
                }
            }
        } else {
            console.log('❌ Error obteniendo token de Felipe:', felipeResponse.message);
        }
        
        // 3. Verificar token de Daniela
        console.log('\n📋 3. Verificando token específico de Daniela...');
        const danielaResponse = await makeRequest(`${RENDER_URL}/api/notifications/validar-token-produccion`, {
            clienteDocumento: '2129239233'
        });
        
        if (danielaResponse.success) {
            const token = danielaResponse.tokenInfo;
            console.log('✅ Token de Daniela encontrado:');
            console.log('   - ID:', token.id);
            console.log('   - Documento:', token.clienteDocumento);
            console.log('   - Platform:', token.platform);
            console.log('   - Longitud:', token.tokenLength);
            console.log('   - Inicio:', token.tokenStart);
            console.log('   - Final:', token.tokenEnd);
            console.log('   - Formato válido:', token.hasAPA91b ? '✅ Sí' : '❌ No');
            console.log('   - Completo:', token.isComplete ? '✅ Sí' : '❌ No');
            console.log('   - Creado:', token.createdAt);
        } else {
            console.log('❌ Error obteniendo token de Daniela:', danielaResponse.message);
        }
        
        // 4. Conclusiones
        console.log('\n🎯 === CONCLUSIONES ===');
        console.log('======================');
        
        if (tokensResponse.success) {
            const tokensCompletos = tokensResponse.tokens.filter(t => t.isComplete);
            const tokensIncompletos = tokensResponse.tokens.filter(t => !t.isComplete);
            
            console.log('📊 Estadísticas:');
            console.log('   - Tokens totales:', tokensResponse.tokensCount);
            console.log('   - Tokens completos:', tokensCompletos.length);
            console.log('   - Tokens incompletos:', tokensIncompletos.length);
            
            if (tokensIncompletos.length > 0) {
                console.log('\n⚠️  PROBLEMA DETECTADO:');
                console.log('   - Hay tokens incompletos en producción');
                console.log('   - Esto causa errores FCM 404');
                console.log('   - Necesario regenerar tokens en la app Android');
            } else {
                console.log('\n✅ TODOS LOS TOKENS ESTÁN COMPLETOS');
            }
        }
        
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
    }
}

function makeRequest(url, postData = null) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const lib = isHttps ? https : http;
        
        const options = {
            method: postData ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'NodeJS-Diagnostic-Script'
            }
        };
        
        const req = lib.request(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve(parsedData);
                } catch (e) {
                    reject(new Error('Invalid JSON response: ' + data));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (postData) {
            req.write(JSON.stringify(postData));
        }
        
        req.end();
    });
}

// Ejecutar diagnóstico
diagnosticoProduccion().catch(console.error);
