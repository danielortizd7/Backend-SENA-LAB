require('dotenv').config();

async function verificarFirebaseCompleto() {
    console.log('🔍 === VERIFICACIÓN COMPLETA DE FIREBASE ===\n');
    
    try {
        // 1. Verificar variables de entorno DESPUÉS del cambio
        console.log('📋 1. VERIFICAR PRIVATE KEY DESPUÉS DEL CAMBIO:');
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        
        if (!privateKey) {
            console.log('❌ FIREBASE_PRIVATE_KEY no configurada');
            return;
        }
        
        console.log(`   📏 Longitud: ${privateKey.length} caracteres`);
        console.log(`   🔤 Contiene \\n literal: ${privateKey.includes('\\n')}`);
        console.log(`   📝 Contiene saltos reales: ${privateKey.includes('\n')}`);
        
        // Verificar formato después de conversión
        const convertedKey = privateKey.replace(/\\n/g, '\n');
        const lines = convertedKey.split('\n');
        console.log(`   📄 Líneas después de conversión: ${lines.length}`);
        console.log(`   🔑 Primera línea: "${lines[0]}"`);
        console.log(`   🔑 Última línea: "${lines[lines.length - 1]}"`);
        
        if (lines[0] === '-----BEGIN PRIVATE KEY-----' && 
            lines[lines.length - 1] === '-----END PRIVATE KEY-----') {
            console.log('   ✅ Formato correcto después de conversión');
        } else {
            console.log('   ❌ Formato incorrecto después de conversión');
            console.log('   📋 Líneas encontradas:');
            lines.forEach((line, index) => {
                if (index < 3 || index >= lines.length - 3) {
                    console.log(`      ${index}: "${line}"`);
                }
            });
        }
        
        // 2. Intentar inicializar Firebase desde cero
        console.log('\n🔧 2. INICIALIZACIÓN LIMPIA DE FIREBASE:');
        
        // Limpiar cualquier app existente
        const admin = require('firebase-admin');
        if (admin.apps.length > 0) {
            console.log('   🗑️ Eliminando apps Firebase existentes...');
            await admin.app().delete();
        }
        
        // Crear service account object
        const serviceAccount = {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: convertedKey,
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
        };
        
        console.log('   📋 Service Account creado:');
        console.log(`      Project ID: ${serviceAccount.project_id}`);
        console.log(`      Client Email: ${serviceAccount.client_email}`);
        console.log(`      Private Key ID: ${serviceAccount.private_key_id}`);
        console.log(`      Private Key Length: ${serviceAccount.private_key.length}`);
        
        try {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
            console.log('   ✅ Firebase Admin inicializado exitosamente');
        } catch (initError) {
            console.log('   ❌ Error inicializando Firebase Admin:');
            console.log(`      ${initError.message}`);
            console.log(`      Code: ${initError.code}`);
            return;
        }
        
        // 3. Verificar el proyecto ID en Firebase Console
        console.log('\n🏗️ 3. VERIFICAR PROJECT ID:');
        const app = admin.app();
        console.log(`   📱 Project ID configurado: ${app.options.projectId}`);
        console.log(`   📱 Project ID esperado: ${process.env.FIREBASE_PROJECT_ID}`);
        
        if (app.options.projectId === process.env.FIREBASE_PROJECT_ID) {
            console.log('   ✅ Project ID coincide');
        } else {
            console.log('   ❌ Project ID NO coincide');
        }
        
        // 4. Probar autenticación con Google Cloud
        console.log('\n🔐 4. PROBAR AUTENTICACIÓN:');
        try {
            const messaging = admin.messaging();
            console.log('   ✅ Instancia de Messaging creada');
            
            // Probar con una operación que requiere autenticación válida
            console.log('   🧪 Probando autenticación con token de prueba...');
            
            const testToken = 'fakeTokenForAuthTest123456789';
            try {
                await messaging.send({
                    token: testToken,
                    notification: {
                        title: 'Test Auth',
                        body: 'Testing authentication'
                    }
                });
            } catch (authError) {
                console.log(`   📋 Error recibido: ${authError.code}`);
                console.log(`   📋 Mensaje: ${authError.message}`);
                
                if (authError.code === 'messaging/invalid-registration-token' ||
                    authError.code === 'messaging/registration-token-not-registered') {
                    console.log('   ✅ AUTENTICACIÓN EXITOSA (error de token esperado)');
                } else if (authError.message.includes('404') || 
                          authError.message.includes('/batch') ||
                          authError.code === 'messaging/unknown-error') {
                    console.log('   ❌ ERROR DE AUTENTICACIÓN/PROYECTO');
                    console.log('   🔍 Posibles causas:');
                    console.log('      - Project ID incorrecto');
                    console.log('      - Service account sin permisos');
                    console.log('      - Firebase Cloud Messaging API no habilitada');
                    
                    // Verificar si es error 403 (permisos) vs 404 (proyecto)
                    if (authError.message.includes('403')) {
                        console.log('   🔧 SOLUCIÓN: Verificar permisos del service account');
                    } else if (authError.message.includes('404')) {
                        console.log('   🔧 SOLUCIÓN: Verificar Project ID o habilitar FCM API');
                    }
                } else {
                    console.log('   ⚠️ Error inesperado de autenticación');
                }
            }
            
        } catch (messagingError) {
            console.log('   ❌ Error creando Messaging:');
            console.log(`      ${messagingError.message}`);
        }
        
        // 5. Verificar URLs de Firebase
        console.log('\n🌐 5. VERIFICAR URLS DE FIREBASE:');
        console.log('   📍 URLs que Firebase Admin SDK intenta usar:');
        console.log(`      FCM Endpoint: https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`);
        console.log(`      Auth Token: https://oauth2.googleapis.com/token`);
        console.log(`      Service Account: ${process.env.FIREBASE_CLIENT_EMAIL}`);
        
        // 6. Recomendaciones específicas
        console.log('\n💡 6. PASOS PARA RESOLVER EL ERROR 404:');
        console.log('   1️⃣ VERIFICAR EN FIREBASE CONSOLE:');
        console.log('      - Ve a https://console.firebase.google.com/');
        console.log(`      - Selecciona el proyecto "${process.env.FIREBASE_PROJECT_ID}"`);
        console.log('      - Ve a Project Settings > Service Accounts');
        console.log('      - Descarga un NUEVO archivo service account JSON');
        console.log('');
        console.log('   2️⃣ VERIFICAR EN GOOGLE CLOUD CONSOLE:');
        console.log(`      - Ve a https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=${process.env.FIREBASE_PROJECT_ID}`);
        console.log('      - Asegúrate de que "Firebase Cloud Messaging API" esté HABILITADA');
        console.log('');
        console.log('   3️⃣ VERIFICAR PERMISOS DEL SERVICE ACCOUNT:');
        console.log(`      - Ve a https://console.cloud.google.com/iam-admin/iam?project=${process.env.FIREBASE_PROJECT_ID}`);
        console.log(`      - Busca ${process.env.FIREBASE_CLIENT_EMAIL}`);
        console.log('      - Debe tener roles: "Firebase Admin SDK Administrator Service Agent"');
        console.log('');
        console.log('   4️⃣ SI EL ERROR PERSISTE:');
        console.log('      - Crea un NUEVO service account en Firebase Console');
        console.log('      - Asigna rol "Firebase Admin SDK Administrator Service Agent"');
        console.log('      - Descarga el JSON y actualiza las variables en Render');
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
    
    console.log('\n🔍 === FIN DE VERIFICACIÓN COMPLETA ===');
}

// Ejecutar verificación
verificarFirebaseCompleto();
