#!/usr/bin/env node

/**
 * Script para probar CORS en el servidor de producción
 * Ejecutar con: node test-cors-produccion.js
 */

const axios = require('axios');

const BACKEND_URL = 'https://backend-registro-muestras.onrender.com';
const FRONTEND_ORIGIN = 'https://aqualab-sena.vercel.app';

console.log('🌐 === DIAGNÓSTICO DE CORS EN PRODUCCIÓN ===\n');

async function probarCORS() {
    try {
        console.log(`🔍 Probando desde: ${FRONTEND_ORIGIN}`);
        console.log(`🎯 Hacia: ${BACKEND_URL}\n`);

        // 1. Probar endpoint básico
        console.log('1️⃣ Probando endpoint básico...');
        try {
            const response = await axios.get(BACKEND_URL, {
                headers: {
                    'Origin': FRONTEND_ORIGIN,
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'Content-Type'
                },
                timeout: 10000
            });
            
            console.log(`✅ Respuesta HTTP: ${response.status}`);
            console.log('📋 Headers de respuesta:');
            console.log(`   Access-Control-Allow-Origin: ${response.headers['access-control-allow-origin'] || 'NO PRESENTE'}`);
            console.log(`   Access-Control-Allow-Methods: ${response.headers['access-control-allow-methods'] || 'NO PRESENTE'}`);
            console.log(`   Access-Control-Allow-Headers: ${response.headers['access-control-allow-headers'] || 'NO PRESENTE'}`);
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
            }
        }

        // 2. Probar preflight request
        console.log('\n2️⃣ Probando preflight request (OPTIONS)...');
        try {
            const preflightResponse = await axios.options(`${BACKEND_URL}/api/muestras`, {
                headers: {
                    'Origin': FRONTEND_ORIGIN,
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'Content-Type,Authorization'
                },
                timeout: 10000
            });
            
            console.log(`✅ Preflight HTTP: ${preflightResponse.status}`);
            console.log('📋 Headers de preflight:');
            console.log(`   Access-Control-Allow-Origin: ${preflightResponse.headers['access-control-allow-origin'] || 'NO PRESENTE'}`);
            console.log(`   Access-Control-Allow-Methods: ${preflightResponse.headers['access-control-allow-methods'] || 'NO PRESENTE'}`);
            console.log(`   Access-Control-Allow-Headers: ${preflightResponse.headers['access-control-allow-headers'] || 'NO PRESENTE'}`);
            
        } catch (error) {
            console.log(`❌ Preflight falló: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
            }
        }

        // 3. Verificar si el servidor está respondiendo
        console.log('\n3️⃣ Verificando estado del servidor...');
        try {
            const healthResponse = await axios.get(BACKEND_URL, {
                timeout: 10000,
                validateStatus: () => true
            });
            
            console.log(`✅ Servidor responde: HTTP ${healthResponse.status}`);
            if (healthResponse.data) {
                console.log(`📄 Respuesta: ${JSON.stringify(healthResponse.data, null, 2).substring(0, 200)}...`);
            }
            
        } catch (error) {
            console.log(`❌ Servidor no responde: ${error.message}`);
        }

    } catch (error) {
        console.error('💥 Error general:', error.message);
    }
}

async function mostrarSolucion() {
    console.log('\n' + '='.repeat(60));
    console.log('🛠️ SOLUCIONES POSIBLES:\n');
    
    console.log('1️⃣ CONFIGURAR VARIABLES EN RENDER:');
    console.log('   • Ve a https://dashboard.render.com');
    console.log('   • Busca tu servicio "backend-registro-muestras"');
    console.log('   • En Environment, agrega:');
    console.log('     ALLOWED_ORIGINS=https://aqualab-sena.vercel.app');
    console.log('     NODE_ENV=production');
    console.log('   • Redeploy el servicio\n');
    
    console.log('2️⃣ VERIFICAR LOGS DE RENDER:');
    console.log('   • Ve al dashboard de Render');
    console.log('   • Revisa los logs del servicio');
    console.log('   • Busca mensajes de CORS bloqueados\n');
    
    console.log('3️⃣ SI EL PROBLEMA PERSISTE:');
    console.log('   • El servidor podría estar caído');
    console.log('   • Verifica que el deploy esté funcionando');
    console.log('   • Contacta soporte de Render si es necesario');
}

async function main() {
    await probarCORS();
    await mostrarSolucion();
}

main();
