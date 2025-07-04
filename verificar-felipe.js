/**
 * VERIFICAR TOKEN FELIPE
 * Script simple para verificar si Felipe tiene token
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function verificarFelipe() {
    try {
        console.log('🔍 Verificando token de Felipe...');
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');
        
        const DeviceToken = mongoose.model('DeviceToken', new mongoose.Schema({
            clienteDocumento: String,
            deviceToken: String,
            platform: String,
            isActive: Boolean,
            createdAt: Date
        }), 'devicetokens');
        
        // Buscar token de Felipe
        const tokenFelipe = await DeviceToken.findOne({ clienteDocumento: '1024578963', isActive: true });
        
        if (tokenFelipe) {
            console.log('✅ Felipe tiene token activo');
            console.log('📱 Platform:', tokenFelipe.platform);
            console.log('📅 Creado:', tokenFelipe.createdAt);
            console.log('📏 Longitud:', tokenFelipe.deviceToken.length);
            console.log('🔑 Token:', tokenFelipe.deviceToken.substring(0, 30) + '...');
        } else {
            console.log('❌ Felipe NO tiene token activo');
            
            // Buscar tokens inactivos
            const tokensInactivos = await DeviceToken.find({ clienteDocumento: '1024578963', isActive: false });
            console.log(`🔍 Tokens inactivos de Felipe: ${tokensInactivos.length}`);
            
            // Buscar todos los tokens
            const todosTokens = await DeviceToken.find({ clienteDocumento: '1024578963' });
            console.log(`📱 Total tokens de Felipe: ${todosTokens.length}`);
        }
        
        // Comparar con Daniela
        const tokenDaniela = await DeviceToken.findOne({ clienteDocumento: '2129239233', isActive: true });
        
        if (tokenDaniela) {
            console.log('✅ Daniela tiene token activo');
            console.log('📱 Platform:', tokenDaniela.platform);
            console.log('📅 Creado:', tokenDaniela.createdAt);
        } else {
            console.log('❌ Daniela NO tiene token activo');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔐 Desconectado');
    }
}

verificarFelipe().catch(console.error);
