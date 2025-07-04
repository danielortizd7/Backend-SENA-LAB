/**
 * SCRIPT SIMPLE PARA VER TOKENS EN LA BASE DE DATOS
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function verTokens() {
    try {
        console.log('🔍 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado');
        
        // Obtener la colección directamente
        const db = mongoose.connection.db;
        const tokens = await db.collection('devicetokens').find({}).sort({ createdAt: -1 }).limit(5).toArray();
        
        console.log(`\n📱 Últimos ${tokens.length} tokens encontrados:`);
        console.log('='.repeat(50));
        
        tokens.forEach((token, index) => {
            console.log(`\n🔑 TOKEN ${index + 1}:`);
            console.log('📋 ID:', token._id);
            console.log('👤 Cliente Doc:', token.clienteDocumento || 'N/A');
            console.log('🆔 Cliente ID:', token.clienteId || 'N/A');
            console.log('📱 Platform:', token.platform);
            console.log('✅ Activo:', token.isActive);
            console.log('📅 Creado:', token.createdAt);
            console.log('🔑 Token (primeros 30):', token.deviceToken?.substring(0, 30) + '...');
            console.log('📏 Longitud:', token.deviceToken?.length || 0);
            
            // Si es el token que buscamos (empieza con cqKvTNxfQe)
            if (token.deviceToken && token.deviceToken.startsWith('cqKvTNxfQe')) {
                console.log('\n🎯 ¡ESTE ES EL TOKEN QUE BUSCAMOS!');
                console.log('🔑 TOKEN COMPLETO:');
                console.log(token.deviceToken);
                console.log('\n📋 JSON COMPLETO:');
                console.log(JSON.stringify(token, null, 2));
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔐 Desconectado');
    }
}

verTokens().catch(console.error);
