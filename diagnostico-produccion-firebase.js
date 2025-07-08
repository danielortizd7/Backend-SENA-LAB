const axios = require('axios');

async function diagnosticarFirebaseProduccion() {
    try {
        console.log('🔍 Diagnosticando configuración de Firebase en producción...\n');
        
        const response = await axios.get('https://backend-registro-muestras.onrender.com/api/notificaciones/diagnostico-clave-firebase');
        
        console.log('📊 ANÁLISIS DE CLAVE PRIVADA EN PRODUCCIÓN:');
        console.log('='.repeat(60));
        
        const { analysis, recommendations } = response.data;
        
        // Información básica
        console.log(`🌍 Entorno: ${analysis.environment}`);
        console.log(`📏 Longitud de clave: ${analysis.keyLength} caracteres`);
        console.log(`🔐 Tiene clave privada: ${analysis.hasPrivateKey ? '✅' : '❌'}`);
        console.log('');
        
        // Formato de la clave
        console.log('📝 FORMATO DE LA CLAVE:');
        console.log(`   Comienza con BEGIN PRIVATE KEY: ${analysis.startsWithBeginPrivate ? '✅' : '❌'}`);
        console.log(`   Termina con END PRIVATE KEY: ${analysis.endsWithEndPrivate ? '✅' : '❌'}`);
        console.log(`   Tiene escapes \\n: ${analysis.hasNewlineEscapes ? '⚠️  SÍ' : '✅ NO'}`);
        console.log(`   Tiene saltos reales: ${analysis.hasActualNewlines ? '✅ SÍ' : '❌ NO'}`);
        console.log(`   Número de líneas: ${analysis.numberOfLines}`);
        console.log(`   Tiene comillas extra: ${analysis.hasQuotes ? '❌ SÍ' : '✅ NO'}`);
        console.log('');
        
        // Problemas comunes
        console.log('🚨 PROBLEMAS DETECTADOS:');
        const issues = analysis.commonIssues;
        console.log(`   Double escaping (\\\\n): ${issues.doubleEscaped ? '❌ SÍ' : '✅ NO'}`);
        console.log(`   Comillas extras: ${issues.extraQuotes ? '❌ SÍ' : '✅ NO'}`);
        console.log(`   Line endings incorrectos: ${issues.wrongLineEndings ? '❌ SÍ' : '✅ NO'}`);
        console.log(`   Espacios en clave: ${issues.spacesInKey ? '❌ SÍ' : '✅ NO'}`);
        console.log('');
        
        // Primeros y últimos caracteres
        console.log('🔍 MUESTRA DE LA CLAVE:');
        console.log(`   Primeros 50 chars: "${analysis.firstChars}"`);
        console.log(`   Últimos 50 chars: "${analysis.lastChars}"`);
        console.log('');
        
        // Recomendaciones
        console.log('💡 RECOMENDACIONES:');
        if (recommendations.shouldRemoveQuotes) {
            console.log('   ❌ ELIMINAR COMILLAS del inicio y final');
        }
        if (recommendations.shouldReplaceEscapes) {
            console.log('   ❌ REEMPLAZAR \\n con saltos de línea reales');
        }
        if (recommendations.shouldFixDoubleEscaping) {
            console.log('   ❌ CORREGIR double escaping (\\\\n → \\n)');
        }
        console.log('');
        
        // Formato correcto
        console.log('✅ FORMATO CORRECTO PARA RENDER:');
        console.log('   En la variable de entorno debe estar así:');
        console.log('   -----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\\n-----END PRIVATE KEY-----');
        console.log('');
        console.log('🔧 PASOS PARA CORREGIR EN RENDER:');
        console.log('   1. Ve al dashboard de Render');
        console.log('   2. Selecciona tu servicio backend-sena-lab');
        console.log('   3. Ve a Environment');
        console.log('   4. Edita FIREBASE_PRIVATE_KEY');
        console.log('   5. Pega la clave SIN comillas extras');
        console.log('   6. Asegúrate de que tenga \\n en lugar de saltos reales');
        console.log('   7. Redeploy el servicio');
        
    } catch (error) {
        console.error('❌ Error al diagnosticar:', error.message);
        if (error.response) {
            console.error('Respuesta del servidor:', error.response.data);
        }
    }
}

diagnosticarFirebaseProduccion();
