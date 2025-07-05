#!/usr/bin/env node

/**
 * Probar manualmente el cambio de estado a "Recibida" para verificar notificaciones
 */

const axios = require('axios');

async function probarCambioEstado() {
    console.log('🧪 PRUEBA: Cambio de estado a "En análisis" para verificar notificaciones');
    console.log('========================================================================');
    console.log('');

    const baseURL = 'https://backend-registro-muestras.onrender.com';
    const muestraId = 'PF250705008';

    try {
        console.log('📍 Probando ruta: /api/muestras/:id/estado');
        console.log(`🎯 Muestra: ${muestraId}`);
        console.log(`🔄 Cambio: → "En análisis"`);
        console.log('');

        const response = await axios.put(
            `${baseURL}/api/muestras/${muestraId}/estado`,
            {
                estado: 'En análisis',
                observaciones: 'Prueba de notificación manual'
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ RESPUESTA EXITOSA:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
        console.log('');

        console.log('🔍 AHORA REVISA LOS LOGS DE RENDER:');
        console.log('==================================');
        console.log('');
        console.log('✅ BUSCA ESTOS MENSAJES:');
        console.log('   📨 "Enviando notificación de cambio de estado:"');
        console.log('   📱 "Encontrados X dispositivos activos"');
        console.log('   🚀 "Enviando mensaje FCM:"');
        console.log('   ✅ "Enviado exitosamente: projects/aqualab-83795/messages/..."');
        console.log('');
        console.log('❌ SI NO APARECEN, HAY UN PROBLEMA EN LA RUTA');

    } catch (error) {
        console.error('❌ ERROR EN LA PRUEBA:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Message:', error.message);
        console.log('');
        console.log('🔍 POSIBLES CAUSAS:');
        console.log('   - Muestra no encontrada');
        console.log('   - Estado inválido');
        console.log('   - Error de autenticación');
        console.log('   - Problema en el servidor');
    }
}

// Ejecutar la prueba
probarCambioEstado();
