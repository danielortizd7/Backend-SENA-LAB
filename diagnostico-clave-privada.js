require('dotenv').config();
const admin = require('firebase-admin');

console.log('🔍 DIAGNÓSTICO DE CLAVE PRIVADA FIREBASE');
console.log('==========================================');

// Verificar variables de entorno
console.log('\n1. VERIFICANDO VARIABLES DE ENTORNO:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY_ID:', process.env.FIREBASE_PRIVATE_KEY_ID);

// Verificar la clave privada
console.log('\n2. VERIFICANDO CLAVE PRIVADA:');
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!privateKey) {
    console.log('❌ ERROR: FIREBASE_PRIVATE_KEY no está definida');
    process.exit(1);
}

console.log('✅ FIREBASE_PRIVATE_KEY está definida');
console.log('Longitud de la clave:', privateKey.length);
console.log('Primeros 50 caracteres:', privateKey.substring(0, 50));
console.log('Últimos 50 caracteres:', privateKey.substring(privateKey.length - 50));

// Verificar formato de la clave
console.log('\n3. VERIFICANDO FORMATO DE LA CLAVE:');
const hasBeginMarker = privateKey.includes('-----BEGIN PRIVATE KEY-----');
const hasEndMarker = privateKey.includes('-----END PRIVATE KEY-----');
const hasNewlines = privateKey.includes('\n');

console.log('Contiene "-----BEGIN PRIVATE KEY-----":', hasBeginMarker);
console.log('Contiene "-----END PRIVATE KEY-----":', hasEndMarker);
console.log('Contiene saltos de línea (\\n):', hasNewlines);

// Contar saltos de línea
const newlineCount = (privateKey.match(/\n/g) || []).length;
console.log('Número de saltos de línea:', newlineCount);

// Verificar si la clave se puede parsear
console.log('\n4. VERIFICANDO PARSEO DE LA CLAVE:');
try {
    // Intentar parsear como JSON (en caso de que esté escapada)
    let parsedKey = privateKey;
    
    // Si la clave no tiene los marcadores, podría estar mal formateada
    if (!hasBeginMarker || !hasEndMarker) {
        console.log('⚠️  ADVERTENCIA: La clave no tiene los marcadores BEGIN/END correctos');
    }
    
    // Verificar el formato esperado
    const expectedFormat = parsedKey.startsWith('-----BEGIN PRIVATE KEY-----') && 
                          parsedKey.endsWith('-----END PRIVATE KEY-----');
    
    console.log('Formato esperado:', expectedFormat);
    
    // Mostrar líneas de la clave para debug
    console.log('\n5. ESTRUCTURA DE LA CLAVE:');
    const lines = parsedKey.split('\n');
    console.log('Número de líneas:', lines.length);
    lines.forEach((line, index) => {
        if (index === 0 || index === lines.length - 1 || line.trim() === '') {
            console.log(`Línea ${index + 1}: "${line}"`);
        } else {
            console.log(`Línea ${index + 1}: [${line.length} caracteres]`);
        }
    });
    
} catch (error) {
    console.log('❌ ERROR al parsear la clave:', error.message);
}

// Intentar inicializar Firebase Admin
console.log('\n6. PROBANDO INICIALIZACIÓN DE FIREBASE:');
try {
    // Limpiar cualquier app existente
    if (admin.apps.length > 0) {
        admin.apps.forEach(app => {
            if (app) admin.app(app.name).delete();
        });
    }
    
    const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('✅ Firebase Admin SDK inicializado correctamente');
    
    // Probar acceso a FCM
    console.log('\n7. PROBANDO ACCESO A FCM:');
    const messaging = admin.messaging();
    console.log('✅ Servicio de mensajería FCM accesible');
    
} catch (error) {
    console.log('❌ ERROR al inicializar Firebase:', error.message);
    console.log('Detalles del error:', error.stack);
}

console.log('\n8. RECOMENDACIONES:');
console.log('- En local: La clave debe estar entre comillas dobles');
console.log('- En Render: La clave debe estar SIN comillas');
console.log('- Todos los \\n deben estar presentes');
console.log('- La clave debe tener exactamente 27 líneas');
console.log('- Primera línea: -----BEGIN PRIVATE KEY-----');
console.log('- Última línea: -----END PRIVATE KEY-----');
