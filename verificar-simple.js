const mongoose = require('mongoose');
require('dotenv').config();

async function verificar() {
    try {
        console.log('Conectando...');
        await mongoose.connect(process.env.MONGO_URI);
        
        const DeviceToken = mongoose.model('DeviceToken', new mongoose.Schema({
            clienteDocumento: String,
            deviceToken: String,
            isActive: Boolean,
            createdAt: Date
        }), 'devicetokens');
        
        console.log('Buscando Felipe...');
        const felipe = await DeviceToken.findOne({ clienteDocumento: '1024578963', isActive: true });
        console.log('Felipe:', felipe ? 'SÍ tiene token' : 'NO tiene token');
        
        console.log('Buscando Daniela...');
        const daniela = await DeviceToken.findOne({ clienteDocumento: '2129239233', isActive: true });
        console.log('Daniela:', daniela ? 'SÍ tiene token' : 'NO tiene token');
        
        await mongoose.disconnect();
        console.log('Listo');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

verificar();
