/**
 * VERIFICAR CREDENCIALES FIREBASE EN PRODUCCIÓN
 * Script para probar las credenciales de Firebase directamente
 */

const admin = require('firebase-admin');

async function verificarCredencialesFirebase() {
    try {
        console.log('🔍 === VERIFICANDO CREDENCIALES FIREBASE ===');
        console.log('============================================');
        
        // Mostrar variables de entorno (sin mostrar valores sensibles)
        console.log('\n📋 Variables de entorno:');
        console.log('   - FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ SET' : '❌ NO SET');
        console.log('   - FIREBASE_PRIVATE_KEY_ID:', process.env.FIREBASE_PRIVATE_KEY_ID ? '✅ SET' : '❌ NO SET');
        console.log('   - FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ SET' : '❌ NO SET');
        console.log('   - FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ SET' : '❌ NO SET');
        console.log('   - FIREBASE_CLIENT_ID:', process.env.FIREBASE_CLIENT_ID ? '✅ SET' : '❌ NO SET');
        
        // Verificar valores específicos
        console.log('\n📋 Valores específicos:');
        console.log('   - Project ID:', process.env.FIREBASE_PROJECT_ID);
        console.log('   - Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
        console.log('   - Client ID:', process.env.FIREBASE_CLIENT_ID);
        console.log('   - Private Key ID:', process.env.FIREBASE_PRIVATE_KEY_ID);
        console.log('   - Private Key present:', process.env.FIREBASE_PRIVATE_KEY ? 'YES' : 'NO');
        console.log('   - Private Key length:', process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0);
        
        // Crear configuración de Firebase
        const firebaseConfig = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            clientId: process.env.FIREBASE_CLIENT_ID
        };
        
        console.log('\n🔧 Configuración de Firebase:');
        console.log('   - Project ID:', firebaseConfig.projectId);
        console.log('   - Private Key ID:', firebaseConfig.privateKeyId);
        console.log('   - Client Email:', firebaseConfig.clientEmail);
        console.log('   - Client ID:', firebaseConfig.clientId);
        console.log('   - Private Key length:', firebaseConfig.privateKey ? firebaseConfig.privateKey.length : 0);
        
        // Verificar formato de private key
        if (firebaseConfig.privateKey) {
            console.log('\n🔑 Análisis de Private Key:');
            console.log('   - Comienza con "-----BEGIN":', firebaseConfig.privateKey.startsWith('-----BEGIN'));
            console.log('   - Termina con "-----END":', firebaseConfig.privateKey.endsWith('-----END PRIVATE KEY-----'));
            console.log('   - Contiene \\n:', firebaseConfig.privateKey.includes('\\n'));
            console.log('   - Primeros 50 chars:', firebaseConfig.privateKey.substring(0, 50));
            console.log('   - Últimos 50 chars:', firebaseConfig.privateKey.substring(firebaseConfig.privateKey.length - 50));
        }
        
        // Intentar inicializar Firebase
        console.log('\n🚀 Intentando inicializar Firebase...');
        
        try {
            // Limpiar apps existentes
            admin.apps.forEach(app => {
                app.delete();
            });
            
            const app = admin.initializeApp({
                credential: admin.credential.cert(firebaseConfig),
                projectId: firebaseConfig.projectId
            });
            
            console.log('✅ Firebase inicializado exitosamente');
            console.log('   - App name:', app.name);
            console.log('   - Project ID:', app.options.projectId);
            
            // Probar acceso a FCM
            console.log('\n📱 Probando acceso a FCM...');
            const messaging = admin.messaging();
            console.log('✅ FCM messaging obtenido exitosamente');
            
            // Probar con un token de prueba (inválido a propósito)
            console.log('\n🧪 Probando FCM con token de prueba...');
            const testToken = 'test-token-invalid:APA91bTestTokenForValidation';
            
            try {
                const testMessage = {
                    notification: {
                        title: 'Test',
                        body: 'Test message'
                    },
                    token: testToken
                };
                
                const result = await messaging.send(testMessage);
                console.log('🎉 FCM funcionando - resultado:', result);
                
            } catch (fcmError) {
                console.log('🔍 Error FCM esperado (token inválido):', fcmError.code);
                
                if (fcmError.code === 'messaging/registration-token-not-registered') {
                    console.log('✅ FCM está funcionando correctamente (error esperado)');
                } else if (fcmError.code === 'messaging/invalid-argument') {
                    console.log('✅ FCM está funcionando correctamente (error esperado)');
                } else {
                    console.log('❌ Error FCM inesperado:', fcmError.message);
                }
            }
            
        } catch (initError) {
            console.log('❌ Error inicializando Firebase:', initError.message);
            console.log('🔍 Código de error:', initError.code);
            console.log('🔍 Stack:', initError.stack);
        }
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

// Ejecutar verificación
verificarCredencialesFirebase().catch(console.error);

module.exports = { verificarCredencialesFirebase };
