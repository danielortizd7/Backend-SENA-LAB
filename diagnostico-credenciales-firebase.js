require('dotenv').config();

async function diagnosticarCredencialesFirebase() {
    console.log('🔍 === DIAGNÓSTICO DETALLADO DE CREDENCIALES FIREBASE ===\n');
    
    try {
        // 1. Verificar variables de entorno
        console.log('📋 1. VARIABLES DE ENTORNO:');
        const firebaseVars = {
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
            FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
            FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
            FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
            FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
        };
        
        Object.entries(firebaseVars).forEach(([key, value]) => {
            if (key === 'FIREBASE_PRIVATE_KEY') {
                if (value) {
                    console.log(`   ✅ ${key}: Configurada (${value.length} caracteres)`);
                    // Verificar formato de private key
                    if (value.includes('\\n')) {
                        console.log('      🔧 Formato: Contiene \\n (correcto para variables de entorno)');
                    } else if (value.includes('\n')) {
                        console.log('      ⚠️ Formato: Contiene saltos de línea reales (puede causar problemas)');
                    } else {
                        console.log('      ❌ Formato: No contiene saltos de línea (formato incorrecto)');
                    }
                } else {
                    console.log(`   ❌ ${key}: NO CONFIGURADA`);
                }
            } else if (value) {
                console.log(`   ✅ ${key}: ${value}`);
            } else {
                console.log(`   ❌ ${key}: NO CONFIGURADA`);
            }
        });
        
        // 2. Verificar inicialización de Firebase Admin
        console.log('\n🔧 2. INICIALIZACIÓN DE FIREBASE ADMIN:');
        const admin = require('firebase-admin');
        
        if (admin.apps.length > 0) {
            console.log('   ✅ Firebase Admin ya inicializado');
            const app = admin.app();
            console.log(`   📱 Project ID en uso: ${app.options.projectId}`);
        } else {
            console.log('   ⚠️ Firebase Admin no inicializado, intentando inicializar...');
            
            // Intentar inicializar
            const serviceAccount = {
                type: "service_account",
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: "https://accounts.google.com/o/oauth2/auth",
                token_uri: "https://oauth2.googleapis.com/token",
                auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
                client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
            };
            
            try {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: process.env.FIREBASE_PROJECT_ID
                });
                console.log('   ✅ Firebase Admin inicializado exitosamente');
            } catch (initError) {
                console.log('   ❌ Error inicializando Firebase Admin:');
                console.log(`      ${initError.message}`);
                return;
            }
        }
        
        // 3. Verificar acceso a Firebase Cloud Messaging
        console.log('\n📨 3. VERIFICACIÓN DE FIREBASE CLOUD MESSAGING:');
        try {
            const messaging = admin.messaging();
            console.log('   ✅ Firebase Messaging instancia creada');
            
            // Intentar validar un token de prueba (formato válido pero no real)
            const testToken = 'emcp-test-token-' + Date.now();
            console.log('   🧪 Probando validación de token...');
            
            try {
                // Este debería fallar con error específico de token inválido, no 404
                await messaging.send({
                    token: testToken,
                    notification: {
                        title: 'Test',
                        body: 'Test'
                    }
                });
            } catch (messagingError) {
                console.log(`   📋 Error esperado: ${messagingError.code}`);
                if (messagingError.code === 'messaging/registration-token-not-registered' ||
                    messagingError.code === 'messaging/invalid-registration-token') {
                    console.log('   ✅ Conexión a FCM exitosa (error de token esperado)');
                } else if (messagingError.message.includes('404') || messagingError.message.includes('/batch')) {
                    console.log('   ❌ Error 404/batch - PROBLEMA DE CREDENCIALES');
                    console.log('      🔍 Detalles del error:');
                    console.log(`      Code: ${messagingError.code}`);
                    console.log(`      Message: ${messagingError.message}`);
                } else {
                    console.log('   ⚠️ Error inesperado:');
                    console.log(`      Code: ${messagingError.code}`);
                    console.log(`      Message: ${messagingError.message}`);
                }
            }
            
        } catch (messagingInitError) {
            console.log('   ❌ Error creando instancia de Messaging:');
            console.log(`      ${messagingInitError.message}`);
        }
        
        // 4. Verificar formato del service account
        console.log('\n🗂️ 4. VERIFICACIÓN DEL SERVICE ACCOUNT:');
        try {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
            if (privateKey) {
                const lines = privateKey.split('\n');
                console.log(`   📄 Private key tiene ${lines.length} líneas`);
                console.log(`   🔑 Comienza con: ${lines[0]}`);
                console.log(`   🔑 Termina con: ${lines[lines.length - 1]}`);
                
                if (lines[0].includes('-----BEGIN PRIVATE KEY-----') && 
                    lines[lines.length - 1].includes('-----END PRIVATE KEY-----')) {
                    console.log('   ✅ Formato de private key correcto');
                } else {
                    console.log('   ❌ Formato de private key incorrecto');
                }
            }
            
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            if (clientEmail) {
                const projectFromEmail = clientEmail.split('@')[1]?.split('.')[0];
                console.log(`   📧 Client email: ${clientEmail}`);
                console.log(`   🆔 Project ID extraído del email: ${projectFromEmail}`);
                
                if (projectFromEmail === process.env.FIREBASE_PROJECT_ID) {
                    console.log('   ✅ Project ID coincide con client email');
                } else {
                    console.log('   ❌ Project ID NO coincide con client email');
                    console.log(`      Esperado: ${projectFromEmail}`);
                    console.log(`      Configurado: ${process.env.FIREBASE_PROJECT_ID}`);
                }
            }
            
        } catch (formatError) {
            console.log('   ❌ Error verificando formato:');
            console.log(`      ${formatError.message}`);
        }
        
        // 5. Recomendaciones
        console.log('\n💡 5. RECOMENDACIONES:');
        console.log('   1. Descarga nuevamente el archivo service account JSON desde Firebase Console');
        console.log('   2. En Render, configura las variables exactamente como aparecen en el JSON:');
        console.log('      - FIREBASE_PROJECT_ID: exactamente como "project_id" en el JSON');
        console.log('      - FIREBASE_CLIENT_EMAIL: exactamente como "client_email" en el JSON');
        console.log('      - FIREBASE_PRIVATE_KEY: exactamente como "private_key" en el JSON');
        console.log('        (reemplaza saltos de línea con \\n literal)');
        console.log('   3. Verifica que el service account tenga rol "Firebase Admin SDK Administrator Service Agent"');
        console.log('   4. Habilita "Firebase Cloud Messaging API" en Google Cloud Console');
        
    } catch (error) {
        console.error('❌ Error general en diagnóstico:', error);
    }
    
    console.log('\n🔍 === FIN DEL DIAGNÓSTICO ===');
}

// Ejecutar diagnóstico
diagnosticarCredencialesFirebase();
