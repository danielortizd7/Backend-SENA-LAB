// ENDPOINT TEMPORAL DE DIAGNÓSTICO - AGREGAR TEMPORALMENTE AL SERVIDOR

// Agregar esta ruta a tu archivo de rutas principal o server.js

app.get('/api/debug/firebase-status', (req, res) => {
    try {
        const status = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            firebase: {
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
                clientId: process.env.FIREBASE_CLIENT_ID,
                
                // Configuración de claves privadas
                hasTraditionalKey: !!process.env.FIREBASE_PRIVATE_KEY,
                hasBase64Key: !!process.env.FIREBASE_PRIVATE_KEY_BASE64,
                
                // Información sobre la clave activa
                activeKeyType: process.env.FIREBASE_PRIVATE_KEY_BASE64 ? 'BASE64' : 'TRADITIONAL',
                activeKeyLength: process.env.FIREBASE_PRIVATE_KEY_BASE64 ? 
                    Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8').length :
                    process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').length,
                
                // Firebase Admin status
                adminAppsInitialized: require('firebase-admin').apps.length,
                
                // Variables presentes
                allEnvVars: {
                    FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
                    FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
                    FIREBASE_PRIVATE_KEY_BASE64: !!process.env.FIREBASE_PRIVATE_KEY_BASE64,
                    FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
                    FIREBASE_PRIVATE_KEY_ID: !!process.env.FIREBASE_PRIVATE_KEY_ID,
                    FIREBASE_CLIENT_ID: !!process.env.FIREBASE_CLIENT_ID
                }
            }
        };
        
        res.json(status);
    } catch (error) {
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/* 
INSTRUCCIONES:
1. Agrega este endpoint temporalmente a tu server.js
2. Redeploy el servidor
3. Visita: https://backend-registro-muestras.onrender.com/api/debug/firebase-status
4. Esto te dirá exactamente qué configuración está usando
5. Una vez verificado, puedes remover este endpoint
*/
