const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');
require('dotenv').config();

/**
 * Script de diagnóstico detallado para debugging de FCM
 * - Analiza tokens registrados
 * - Valida formato de configuración Firebase
 * - Envía notificación de prueba con análisis detallado de errores
 */

async function diagnosticoDetalladoFCM() {
    console.log('🔍 DIAGNÓSTICO DETALLADO DE FCM - INICIO');
    console.log('=' .repeat(60));

    try {
        // 1. Verificar configuración Firebase
        console.log('\n1️⃣ VERIFICANDO CONFIGURACIÓN FIREBASE...');
        
        const firebaseConfig = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        };

        console.log('✓ Project ID:', firebaseConfig.projectId);
        console.log('✓ Client Email:', firebaseConfig.clientEmail);
        console.log('✓ Private Key length:', firebaseConfig.privateKey?.length || 0);
        console.log('✓ Private Key format:', firebaseConfig.privateKey?.startsWith('-----BEGIN') ? 'VÁLIDO' : 'INVÁLIDO');

        // Inicializar Firebase si no está ya inicializado
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(firebaseConfig)
            });
            console.log('✅ Firebase inicializado correctamente');
        }

        // 2. Conectar a MongoDB
        console.log('\n2️⃣ CONECTANDO A MONGODB...');
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        console.log('✅ Conectado a MongoDB');

        const db = client.db('lab_sena');
        const muestrasCollection = db.collection('muestras');

        // 3. Buscar todas las muestras con tokens FCM
        console.log('\n3️⃣ ANALIZANDO TOKENS FCM REGISTRADOS...');
        const muestrasConTokens = await muestrasCollection.find({
            fcmToken: { $exists: true, $ne: null, $ne: '' }
        }).toArray();

        console.log(`📱 Total muestras con tokens FCM: ${muestrasConTokens.length}`);

        if (muestrasConTokens.length === 0) {
            console.log('❌ No se encontraron tokens FCM registrados');
            await client.close();
            return;
        }

        // Mostrar detalles de tokens
        muestrasConTokens.forEach((muestra, index) => {
            console.log(`\n🔗 Token ${index + 1}:`);
            console.log(`   - Cliente Doc: ${muestra.clienteDocumento}`);
            console.log(`   - Código muestra: ${muestra.codigoMuestra}`);
            console.log(`   - Token: ${muestra.fcmToken.substring(0, 50)}...`);
            console.log(`   - Token length: ${muestra.fcmToken.length}`);
            console.log(`   - Estado: ${muestra.estado}`);
        });

        // 4. Validar tokens individualmente
        console.log('\n4️⃣ VALIDANDO TOKENS INDIVIDUALMENTE...');
        
        for (let i = 0; i < muestrasConTokens.length; i++) {
            const muestra = muestrasConTokens[i];
            const token = muestra.fcmToken;
            
            console.log(`\n🔍 Validando token ${i + 1}/${muestrasConTokens.length}:`);
            
            try {
                // Crear mensaje de prueba específico para este token
                const testMessage = {
                    token: token,
                    notification: {
                        title: `🧪 Test Token ${i + 1}`,
                        body: `Diagnóstico para muestra ${muestra.codigoMuestra}`,
                    },
                    data: {
                        tipo: 'diagnostico',
                        codigoMuestra: muestra.codigoMuestra,
                        timestamp: new Date().toISOString()
                    },
                    android: {
                        priority: 'high',
                        notification: {
                            channelId: 'lab_notifications',
                            priority: 'high',
                            defaultSound: true,
                            defaultVibrateTimings: true,
                            defaultLightSettings: true,
                            visibility: 'public',
                            color: '#1976D2',
                            icon: 'ic_notification'
                        }
                    }
                };

                console.log('   📤 Enviando notificación de prueba...');
                const response = await admin.messaging().send(testMessage);
                console.log(`   ✅ ÉXITO - Message ID: ${response}`);
                
            } catch (error) {
                console.log(`   ❌ ERROR al enviar a este token:`);
                console.log(`      - Code: ${error.code}`);
                console.log(`      - Message: ${error.message}`);
                console.log(`      - Details:`, JSON.stringify(error, null, 2));
                
                // Analizar tipo de error
                if (error.code === 'messaging/registration-token-not-registered') {
                    console.log('   🔍 DIAGNÓSTICO: Token no registrado o app desinstalada');
                } else if (error.code === 'messaging/invalid-registration-token') {
                    console.log('   🔍 DIAGNÓSTICO: Token inválido o malformado');
                } else if (error.code === 'messaging/mismatched-credential') {
                    console.log('   🔍 DIAGNÓSTICO: Proyecto Firebase incorrecto');
                } else {
                    console.log('   🔍 DIAGNÓSTICO: Error desconocido - verificar logs');
                }
            }
            
            // Pausa entre tokens para evitar rate limiting
            if (i < muestrasConTokens.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // 5. Prueba con múltiples tokens
        console.log('\n5️⃣ PRUEBA DE ENVÍO MÚLTIPLE...');
        const allTokens = muestrasConTokens.map(m => m.fcmToken);
        
        const multicastMessage = {
            tokens: allTokens,
            notification: {
                title: '🔥 Test Multicast',
                body: 'Prueba de envío múltiple - Diagnóstico FCM'
            },
            data: {
                tipo: 'diagnostico_multicast',
                timestamp: new Date().toISOString()
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'lab_notifications',
                    priority: 'high',
                    defaultSound: true,
                    defaultVibrateTimings: true,
                    defaultLightSettings: true,
                    visibility: 'public',
                    color: '#1976D2',
                    icon: 'ic_notification'
                }
            }
        };

        try {
            const multicastResponse = await admin.messaging().sendEachForMulticast(multicastMessage);
            
            console.log('📊 RESULTADOS MULTICAST:');
            console.log(`   ✅ Exitosos: ${multicastResponse.successCount}`);
            console.log(`   ❌ Fallidos: ${multicastResponse.failureCount}`);
            
            if (multicastResponse.failureCount > 0) {
                console.log('\n🔍 ANÁLISIS DE FALLOS MULTICAST:');
                multicastResponse.responses.forEach((resp, index) => {
                    if (!resp.success) {
                        console.log(`   ❌ Token ${index + 1}:`);
                        console.log(`      - Error: ${resp.error?.code} - ${resp.error?.message}`);
                        console.log(`      - Muestra: ${muestrasConTokens[index]?.codigoMuestra}`);
                    }
                });
            }
            
        } catch (error) {
            console.log('❌ Error en envío multicast:', error.message);
        }

        await client.close();
        console.log('\n✅ DIAGNÓSTICO COMPLETADO');
        
    } catch (error) {
        console.error('💥 ERROR CRÍTICO en diagnóstico:', error);
    }
}

// Ejecutar diagnóstico
diagnosticoDetalladoFCM()
    .then(() => {
        console.log('\n🏁 Script finalizado');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
