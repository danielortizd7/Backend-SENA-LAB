const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

// Endpoint para verificar configuración de Firebase
router.get('/firebase-config', (req, res) => {
    try {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        
        // Verificar que todas las variables estén definidas
        const allConfigured = !!(projectId && clientEmail && privateKeyId && privateKey);
        
        // Verificar formato de la clave privada
        const privateKeyValid = privateKey && 
                               privateKey.includes('-----BEGIN PRIVATE KEY-----') &&
                               privateKey.includes('-----END PRIVATE KEY-----') &&
                               privateKey.includes('\n');
        
        res.json({
            configured: allConfigured,
            projectId: projectId || 'NO_CONFIGURADO',
            clientEmail: clientEmail || 'NO_CONFIGURADO',
            privateKeyId: privateKeyId || 'NO_CONFIGURADO',
            privateKeyLength: privateKey ? privateKey.length : 0,
            privateKeyValid: privateKeyValid,
            privateKeyLines: privateKey ? privateKey.split('\n').length : 0,
            privateKeyNewlines: privateKey ? (privateKey.match(/\n/g) || []).length : 0
        });
    } catch (error) {
        res.status(500).json({
            error: 'Error al verificar configuración Firebase',
            message: error.message
        });
    }
});

// Endpoint para verificar si Firebase está inicializado
router.get('/firebase-status', (req, res) => {
    try {
        const appsCount = admin.apps.length;
        const isInitialized = appsCount > 0;
        
        let fcmAvailable = false;
        if (isInitialized) {
            try {
                const messaging = admin.messaging();
                fcmAvailable = !!messaging;
            } catch (error) {
                fcmAvailable = false;
            }
        }
        
        res.json({
            firebaseInitialized: isInitialized,
            appsCount: appsCount,
            fcmAvailable: fcmAvailable
        });
    } catch (error) {
        res.status(500).json({
            error: 'Error al verificar estado Firebase',
            message: error.message
        });
    }
});

// Endpoint para diagnóstico completo de FCM
router.get('/diagnostico-fcm', (req, res) => {
    try {
        // Verificar variables de entorno
        const envVars = {
            FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
            FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
            FIREBASE_PRIVATE_KEY_ID: !!process.env.FIREBASE_PRIVATE_KEY_ID,
            FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY
        };
        
        // Verificar Firebase Admin
        const firebaseInitialized = admin.apps.length > 0;
        let fcmAvailable = false;
        
        if (firebaseInitialized) {
            try {
                const messaging = admin.messaging();
                fcmAvailable = !!messaging;
            } catch (error) {
                fcmAvailable = false;
            }
        }
        
        // Verificar formato de clave privada
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        const privateKeyFormat = {
            exists: !!privateKey,
            length: privateKey ? privateKey.length : 0,
            hasBeginMarker: privateKey ? privateKey.includes('-----BEGIN PRIVATE KEY-----') : false,
            hasEndMarker: privateKey ? privateKey.includes('-----END PRIVATE KEY-----') : false,
            hasNewlines: privateKey ? privateKey.includes('\n') : false,
            lineCount: privateKey ? privateKey.split('\n').length : 0,
            newlineCount: privateKey ? (privateKey.match(/\n/g) || []).length : 0
        };
        
        res.json({
            environmentVariables: envVars,
            firebaseInitialized: firebaseInitialized,
            fcmAvailable: fcmAvailable,
            privateKeyFormat: privateKeyFormat,
            timestamp: new Date().toISOString(),
            status: firebaseInitialized && fcmAvailable ? 'OK' : 'ERROR'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Error en diagnóstico FCM',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
