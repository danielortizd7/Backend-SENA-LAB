require('dotenv').config();

function corregirFormatoPrivateKey() {
    console.log('🔧 === CORRECCIÓN DE FORMATO PRIVATE KEY ===\n');
    
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!privateKey) {
        console.log('❌ FIREBASE_PRIVATE_KEY no configurada');
        return;
    }
    
    console.log('📋 INFORMACIÓN ACTUAL:');
    console.log(`   📏 Longitud: ${privateKey.length} caracteres`);
    console.log(`   📄 Líneas: ${privateKey.split('\n').length}`);
    console.log(`   🔤 Contiene \\n literal: ${privateKey.includes('\\n')}`);
    console.log(`   📝 Contiene saltos reales: ${privateKey.includes('\n')}`);
    
    // Mostrar inicio y final
    const lines = privateKey.split('\n');
    console.log(`   🔑 Primer línea: "${lines[0]}"`);
    console.log(`   🔑 Última línea: "${lines[lines.length - 1]}"`);
    
    console.log('\n🔧 FORMATO CORRECTO PARA RENDER:');
    console.log('   Variable: FIREBASE_PRIVATE_KEY');
    console.log('   Valor:');
    
    // Convertir saltos de línea reales a \n literal
    const correctedKey = privateKey.replace(/\n/g, '\\n');
    console.log('   ' + correctedKey);
    
    console.log('\n📋 INSTRUCCIONES PARA RENDER:');
    console.log('   1. Ve a tu proyecto en Render');
    console.log('   2. Ve a Environment Variables');
    console.log('   3. Busca FIREBASE_PRIVATE_KEY');
    console.log('   4. Edita el valor y pega exactamente esto:');
    console.log('      (copia desde aquí hasta el final de la línea)');
    console.log('   ┌─────────────────────────────────────────────────────────────────────────────────');
    console.log('   │ ' + correctedKey);
    console.log('   └─────────────────────────────────────────────────────────────────────────────────');
    console.log('   5. Guarda los cambios');
    console.log('   6. Redeploy el servicio');
    
    console.log('\n✅ VERIFICACIÓN:');
    console.log('   - Debe empezar con: -----BEGIN PRIVATE KEY-----\\n');
    console.log('   - Debe terminar con: \\n-----END PRIVATE KEY-----\\n');
    console.log('   - NO debe contener saltos de línea reales');
    console.log('   - Debe usar \\n literal para los saltos de línea');
    
    // Verificar también otras variables
    console.log('\n🔍 OTRAS VARIABLES A VERIFICAR EN RENDER:');
    const otherVars = {
        'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
        'FIREBASE_PRIVATE_KEY_ID': process.env.FIREBASE_PRIVATE_KEY_ID,
        'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL,
        'FIREBASE_CLIENT_ID': process.env.FIREBASE_CLIENT_ID
    };
    
    Object.entries(otherVars).forEach(([key, value]) => {
        console.log(`   ${key}: ${value || 'NO CONFIGURADA'}`);
    });
}

corregirFormatoPrivateKey();
