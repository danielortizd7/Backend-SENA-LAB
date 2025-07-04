/**
 * VERIFICAR EXISTENCIA DE TOKENS
 * Script rápido para verificar qué tokens existen en la base de datos
 */

const mongoose = require('mongoose');
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

async function verificarTokens() {
    try {
        console.log('🔍 === VERIFICANDO TOKENS EXISTENTES ===');
        
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');
        
        // Buscar tokens específicos
        const clientes = ['1024578963', '2129239233'];
        
        for (const cliente of clientes) {
            console.log(`\n👤 Cliente: ${cliente}`);
            console.log('─'.repeat(30));
            
            // Buscar todos los tokens (activos e inactivos)
            const todosLosTokens = await DeviceToken.find({ clienteDocumento: cliente }).sort({ createdAt: -1 });
            
            if (todosLosTokens.length === 0) {
                console.log('❌ No se encontraron tokens para este cliente');
                continue;
            }
            
            console.log(`📱 Encontrados ${todosLosTokens.length} tokens:`);
            
            todosLosTokens.forEach((token, index) => {
                console.log(`\n  ${index + 1}. ${token.isActive ? '🟢' : '🔴'} ${token.isActive ? 'ACTIVO' : 'INACTIVO'}`);
                console.log(`     📅 Creado: ${token.createdAt}`);
                console.log(`     📱 Platform: ${token.platform}`);
                console.log(`     🔄 Último uso: ${token.lastUsed}`);
                console.log(`     📏 Token: ${token.deviceToken.substring(0, 20)}...`);
            });
        }
        
        // Mostrar resumen general
        console.log('\n📊 === RESUMEN GENERAL ===');
        console.log('==========================');
        
        const totalTokens = await DeviceToken.countDocuments();
        const tokensActivos = await DeviceToken.countDocuments({ isActive: true });
        const tokensInactivos = await DeviceToken.countDocuments({ isActive: false });
        
        console.log(`📱 Total tokens: ${totalTokens}`);
        console.log(`🟢 Tokens activos: ${tokensActivos}`);
        console.log(`🔴 Tokens inactivos: ${tokensInactivos}`);
        
        // Mostrar últimos 5 tokens activos
        console.log('\n🕐 Últimos 5 tokens activos:');
        const ultimosTokens = await DeviceToken.find({ isActive: true }).sort({ createdAt: -1 }).limit(5);
        
        ultimosTokens.forEach((token, index) => {
            console.log(`${index + 1}. ${token.clienteDocumento} - ${token.platform} - ${token.createdAt}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔐 Desconectado de MongoDB');
    }
}

verificarTokens().catch(console.error);
