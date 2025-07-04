/**
 * MONITOREO DE TOKENS FCM DE TODOS LOS USUARIOS
 * Script para verificar el estado de los tokens FCM de todos los usuarios activos
 */

const mongoose = require('mongoose');
const admin = require('firebase-admin');
require('dotenv').config();

// Esquema del DeviceToken
const deviceTokenSchema = new mongoose.Schema({
    clienteId: mongoose.Schema.Types.ObjectId,
    clienteDocumento: String,
    deviceToken: String,
    platform: String,
    isActive: Boolean,
    createdAt: Date,
    updatedAt: Date,
    lastUsed: Date,
    deviceInfo: Object,
    appVersion: String
});

const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema, 'devicetokens');

async function monitorearTokensUsuarios() {
    try {
        console.log('🔍 === MONITOREO DE TOKENS FCM - TODOS LOS USUARIOS ===');
        console.log('=====================================================');
        
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');
        
        // Inicializar Firebase
        if (admin.apps.length === 0) {
            const firebaseConfig = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                clientId: process.env.FIREBASE_CLIENT_ID
            };

            admin.initializeApp({
                credential: admin.credential.cert(firebaseConfig),
                projectId: firebaseConfig.projectId
            });
            
            console.log('✅ Firebase inicializado');
        }
        
        // Obtener todos los tokens activos
        const tokensActivos = await DeviceToken.find({ isActive: true })
            .sort({ createdAt: -1 });
        
        console.log(`📱 Encontrados ${tokensActivos.length} tokens activos total`);
        
        // Agrupar por cliente
        const tokensPorCliente = {};
        tokensActivos.forEach(token => {
            const cliente = token.clienteDocumento || 'Sin_Documento';
            if (!tokensPorCliente[cliente]) {
                tokensPorCliente[cliente] = [];
            }
            tokensPorCliente[cliente].push(token);
        });
        
        console.log(`👥 Clientes únicos con tokens: ${Object.keys(tokensPorCliente).length}`);
        console.log('');
        
        // Resumen por cliente
        for (const [clienteDoc, tokens] of Object.entries(tokensPorCliente)) {
            console.log(`📋 CLIENTE: ${clienteDoc}`);
            console.log(`   📱 Tokens: ${tokens.length}`);
            console.log(`   🕐 Último registro: ${tokens[0].createdAt}`);
            console.log(`   🔧 Plataforma: ${tokens[0].platform}`);
            console.log(`   🔑 Token más reciente: ${tokens[0].deviceToken.substring(0, 20)}...`);
            console.log('');
        }
        
        // Probar tokens de los usuarios principales
        const usuariosPrincipales = ['2129239233', '1009845262']; // Daniela y Felipe
        
        for (const usuarioDoc of usuariosPrincipales) {
            if (tokensPorCliente[usuarioDoc]) {
                console.log(`🧪 === PROBANDO USUARIO: ${usuarioDoc} ===`);
                const tokenMasReciente = tokensPorCliente[usuarioDoc][0];
                
                try {
                    const message = {
                        notification: {
                            title: '🔍 Test de Monitoreo',
                            body: `Verificando token FCM para ${usuarioDoc}`
                        },
                        data: {
                            tipo: 'monitoreo_token',
                            clienteDocumento: usuarioDoc,
                            timestamp: new Date().toISOString()
                        },
                        token: tokenMasReciente.deviceToken
                    };
                    
                    const response = await admin.messaging().send(message);
                    console.log(`✅ ${usuarioDoc}: Notificación enviada exitosamente`);
                    console.log(`   📋 Response ID: ${response}`);
                    console.log(`   🔑 Token usado: ${tokenMasReciente.deviceToken.substring(0, 30)}...`);
                    
                } catch (error) {
                    console.log(`❌ ${usuarioDoc}: Error enviando notificación`);
                    console.log(`   🔍 Error: ${error.message}`);
                    console.log(`   🔍 Código: ${error.code}`);
                    
                    if (error.code === 'messaging/registration-token-not-registered') {
                        console.log(`   💡 Token expirado, necesita regenerar en app`);
                    } else if (error.code === 'messaging/invalid-argument') {
                        console.log(`   💡 Token con formato inválido`);
                    }
                }
                console.log('');
            } else {
                console.log(`❌ Usuario ${usuarioDoc} no encontrado en tokens activos`);
            }
        }
        
        // Estadísticas generales
        console.log('📊 === ESTADÍSTICAS GENERALES ===');
        console.log('=================================');
        
        const ahora = new Date();
        const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
        const hace7d = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const tokensRecientes = tokensActivos.filter(t => t.createdAt > hace24h);
        const tokensUltimaSemana = tokensActivos.filter(t => t.createdAt > hace7d);
        
        console.log(`📱 Tokens totales activos: ${tokensActivos.length}`);
        console.log(`🕐 Creados en últimas 24h: ${tokensRecientes.length}`);
        console.log(`📅 Creados en última semana: ${tokensUltimaSemana.length}`);
        console.log(`🤖 Plataforma Android: ${tokensActivos.filter(t => t.platform === 'android').length}`);
        console.log(`🍎 Plataforma iOS: ${tokensActivos.filter(t => t.platform === 'ios').length}`);
        
        // Tokens por longitud (para detectar formatos inválidos)
        const distribucionLongitud = {};
        tokensActivos.forEach(token => {
            const longitud = token.deviceToken.length;
            const rango = `${Math.floor(longitud / 10) * 10}-${Math.floor(longitud / 10) * 10 + 9}`;
            distribucionLongitud[rango] = (distribucionLongitud[rango] || 0) + 1;
        });
        
        console.log(`📏 Distribución por longitud de token:`);
        Object.entries(distribucionLongitud).forEach(([rango, count]) => {
            console.log(`   ${rango} caracteres: ${count} tokens`);
        });
        
    } catch (error) {
        console.error('❌ Error en monitoreo:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔐 Desconectado de MongoDB');
    }
}

// Ejecutar monitoreo
console.log('🚀 Iniciando monitoreo de tokens FCM...');
console.log('');

monitorearTokensUsuarios().catch(console.error);
