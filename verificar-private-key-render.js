const admin = require('firebase-admin');

console.log('🔍 VERIFICACIÓN DE FIREBASE_PRIVATE_KEY EN RENDER');
console.log('================================================');

// Obtener el valor de la variable de entorno
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

console.log('1. Valor de FIREBASE_PRIVATE_KEY:');
console.log('   Longitud:', privateKey ? privateKey.length : 'undefined');
console.log('   Primeros 50 caracteres:', privateKey ? privateKey.substring(0, 50) : 'undefined');
console.log('   Últimos 50 caracteres:', privateKey ? privateKey.substring(privateKey.length - 50) : 'undefined');

console.log('\n2. Análisis del formato:');
console.log('   ¿Empieza con "-----BEGIN PRIVATE KEY-----"?', privateKey ? privateKey.startsWith('-----BEGIN PRIVATE KEY-----') : false);
console.log('   ¿Termina con "-----END PRIVATE KEY-----"?', privateKey ? privateKey.endsWith('-----END PRIVATE KEY-----') : false);
console.log('   ¿Contiene \\n?', privateKey ? privateKey.includes('\\n') : false);

// Intentar parsear la clave
console.log('\n3. Prueba de parseo:');
try {
    // Simular el parseo que hace Firebase
    const processedKey = privateKey.replace(/\\n/g, '\n');
    console.log('   ✅ Clave procesada correctamente');
    console.log('   Longitud después del procesamiento:', processedKey.length);
    console.log('   ¿Contiene saltos de línea reales?', processedKey.includes('\n'));
    
    // Verificar estructura básica
    const lines = processedKey.split('\n');
    console.log('   Número de líneas:', lines.length);
    console.log('   Primera línea:', lines[0]);
    console.log('   Última línea:', lines[lines.length - 1]);
    
} catch (error) {
    console.log('   ❌ Error al procesar la clave:', error.message);
}

// Intentar inicializar Firebase Admin
console.log('\n4. Prueba de inicialización de Firebase Admin:');
try {
    const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };
    
    console.log('   ✅ Service account creado correctamente');
    console.log('   Project ID:', serviceAccount.project_id);
    console.log('   Client Email:', serviceAccount.client_email);
    
    // Verificar que la clave privada tenga el formato correcto
    const privateKeyLines = serviceAccount.private_key.split('\n');
    console.log('   Líneas en private_key:', privateKeyLines.length);
    console.log('   Primera línea:', privateKeyLines[0]);
    console.log('   Última línea (no vacía):', privateKeyLines.filter(line => line.trim()).pop());
    
} catch (error) {
    console.log('   ❌ Error al crear service account:', error.message);
}

console.log('\n5. Recomendaciones:');
console.log('   - La variable FIREBASE_PRIVATE_KEY en Render debe tener comillas dobles');
console.log('   - Formato correcto: "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
console.log('   - El valor actual parece estar SIN comillas dobles');
