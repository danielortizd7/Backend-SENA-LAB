const axios = require('axios');

async function verificarRutasBasicas() {
    console.log('🔍 VERIFICACIÓN DE RUTAS BÁSICAS');
    console.log('=================================');
    
    const baseURL = 'https://backend-sena-lab.onrender.com';
    
    const rutas = [
        '/',
        '/api',
        '/api/usuarios',
        '/api/notificaciones',
        '/api/muestras'
    ];
    
    for (const ruta of rutas) {
        try {
            console.log(`\n🔍 Probando: ${ruta}`);
            
            const response = await axios.get(`${baseURL}${ruta}`, {
                timeout: 15000
            });
            
            console.log(`   ✅ ÉXITO (${response.status})`);
            if (response.data && typeof response.data === 'string' && response.data.length < 200) {
                console.log(`   📄 Respuesta: ${response.data}`);
            } else {
                console.log(`   📄 Respuesta: [Datos recibidos correctamente]`);
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR (${error.response?.status || 'NO_RESPONSE'})`);
            
            if (error.response?.status === 404) {
                console.log(`   📄 Ruta no encontrada (normal para algunas rutas)`);
            } else if (error.response?.status === 401) {
                console.log(`   📄 Requiere autenticación (servidor funcionando)`);
            } else if (error.response?.status === 500) {
                console.log(`   📄 Error interno del servidor`);
            } else {
                console.log(`   📄 Detalle: ${error.message}`);
            }
        }
    }
    
    // Probar endpoint de notificaciones específico
    console.log('\n🔍 Probando endpoint de notificaciones directo...');
    try {
        const response = await axios.post(`${baseURL}/api/notificaciones/send`, {
            token: 'test_token',
            titulo: 'Prueba',
            mensaje: 'Mensaje de prueba'
        }, {
            timeout: 15000
        });
        
        console.log(`   ✅ ÉXITO (${response.status})`);
        console.log(`   📄 Respuesta:`, response.data);
        
    } catch (error) {
        console.log(`   ❌ ERROR (${error.response?.status || 'NO_RESPONSE'})`);
        
        if (error.response?.data) {
            console.log(`   📄 Detalle:`, error.response.data);
        }
    }
}

verificarRutasBasicas();
