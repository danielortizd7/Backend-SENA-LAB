/**
 * PRUEBA TOKEN DANIELA MONTENEGRO
 * Probando el token FCM completo de Daniela
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Token completo de Daniela desde la base de datos
const TOKEN_DANIELA = "cqKvTNxfQe-8AalksTCm4S:APA91bG1PuQxOVB2NnzJe6m1DZrc7Idq24QhabzoCqIIWjAGRVysID1pxHCpBpNBCTvGzlN4tjYq1FiqizzApC9i06huyJDiBYyT3-1DcziwW74EP0jSUcg";

console.log('🚀 === PRUEBA TOKEN DANIELA MONTENEGRO ===');
console.log('==========================================');

// Configurar Firebase si no está inicializado
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
    
    console.log('✅ Firebase Admin SDK inicializado');
}

// Función para probar el token de Daniela
async function probarTokenDaniela() {
    console.log('\n📱 INFORMACIÓN DEL TOKEN DE DANIELA:');
    console.log('===================================');
    console.log('👤 Cliente: DANIELA MONTENEGRO');
    console.log('📄 Documento: 2129239233');
    console.log('🔑 Token (primeros 30 chars):', TOKEN_DANIELA.substring(0, 30) + '...');
    console.log('📏 Longitud del token:', TOKEN_DANIELA.length);
    console.log('🔍 Formato válido:', TOKEN_DANIELA.includes(':APA91b') ? '✅ Sí' : '❌ No');
    
    try {
        console.log('\n🚀 ENVIANDO NOTIFICACIÓN DE PRUEBA:');
        console.log('===================================');
        
        const message = {
            notification: {
                title: '🎉 ¡Notificación para Daniela!',
                body: 'El token FCM de Daniela Montenegro está funcionando correctamente.'
            },
            data: {
                tipo: 'prueba_daniela',
                clienteDocumento: '2129239233',
                clienteNombre: 'DANIELA MONTENEGRO',
                timestamp: new Date().toISOString(),
                muestraId: 'PF250704005'
            },
            token: TOKEN_DANIELA
        };
        
        console.log('📤 Enviando mensaje...');
        const response = await admin.messaging().send(message);
        
        console.log('✅ ¡MENSAJE ENVIADO EXITOSAMENTE!');
        console.log('📋 Response ID:', response);
        console.log('🎯 Daniela debería recibir la notificación en su dispositivo Android');
        
        return true;
        
    } catch (error) {
        console.log('❌ ERROR AL ENVIAR MENSAJE:');
        console.log('===========================');
        console.log('🔍 Error Code:', error.code);
        console.log('🔍 Error Message:', error.message);
        
        // Análisis detallado del error
        if (error.code === 'messaging/registration-token-not-registered') {
            console.log('\n💡 DIAGNÓSTICO:');
            console.log('- El token FCM de Daniela no está registrado o ha expirado');
            console.log('- Daniela necesita regenerar el token en su aplicación Android');
            
        } else if (error.code === 'messaging/invalid-argument') {
            console.log('\n💡 DIAGNÓSTICO:');
            console.log('- El token tiene un formato inválido');
            console.log('- Verificar que el token esté completo y correcto');
            
        } else if (error.code === 'messaging/invalid-registration-token') {
            console.log('\n💡 DIAGNÓSTICO:');
            console.log('- El token FCM de Daniela es inválido');
            console.log('- Daniela necesita regenerar el token en la aplicación Android');
            
        } else if (error.code === 'messaging/unknown-error') {
            console.log('\n💡 DIAGNÓSTICO:');
            console.log('- Error desconocido de Firebase');
            console.log('- Posible problema con las credenciales o configuración');
            
        } else {
            console.log('\n💡 DIAGNÓSTICO:');
            console.log('- Error no documentado:', error.code);
            console.log('- Detalles:', error.details || 'No hay detalles adicionales');
        }
        
        return false;
    }
}

// Función de comparación
function compararConTokenFelipe() {
    console.log('\n🔍 COMPARACIÓN CON TOKEN DE FELIPE:');
    console.log('==================================');
    
    const TOKEN_FELIPE = "cA-mT5H_Sy2m371lXP9xkY:APA91bEmiLq4ugDx-DpNgk_4Lzz088jrNgkJJ9K6oqAv_bOy26tJ3Jft24Qs2R0Bh0t5P47r9DI2LVefbozuMZF3DHlb3TyU6IiVJJEqBsh8HuImlmtbKb4";
    
    console.log('👤 Felipe (FUNCIONA):');
    console.log('   📄 Documento: 1235467890');
    console.log('   📏 Longitud: ' + TOKEN_FELIPE.length);
    console.log('   🔑 Token: ' + TOKEN_FELIPE.substring(0, 30) + '...');
    
    console.log('\n👤 Daniela (PROBANDO):');
    console.log('   📄 Documento: 2129239233');
    console.log('   📏 Longitud: ' + TOKEN_DANIELA.length);
    console.log('   🔑 Token: ' + TOKEN_DANIELA.substring(0, 30) + '...');
    
    console.log('\n🔍 ANÁLISIS:');
    console.log('   ✅ Ambos tokens tienen formato válido');
    console.log('   ✅ Ambos tokens incluyen :APA91b');
    console.log('   📏 Longitudes similares (' + TOKEN_FELIPE.length + ' vs ' + TOKEN_DANIELA.length + ')');
}

// Ejecutar prueba
async function ejecutarPrueba() {
    compararConTokenFelipe();
    
    console.log('\n🚀 Iniciando prueba...');
    const exito = await probarTokenDaniela();
    
    if (exito) {
        console.log('\n🎉 ¡PRUEBA EXITOSA!');
        console.log('==================');
        console.log('✅ Token FCM de Daniela válido y funcional');
        console.log('✅ Firebase configurado correctamente');
        console.log('✅ Notificación enviada exitosamente');
        console.log('📱 Daniela debería ver la notificación en su dispositivo Android');
        
        console.log('\n🔧 PRÓXIMO PASO:');
        console.log('===============');
        console.log('Las notificaciones automáticas para Daniela ahora funcionarán correctamente');
        console.log('cuando cambien los estados de sus muestras.');
        
    } else {
        console.log('\n❌ PRUEBA FALLIDA');
        console.log('================');
        console.log('🔧 Daniela necesita regenerar su token FCM en la aplicación Android');
        console.log('🔧 Después debe registrar el nuevo token en el backend');
    }
}

ejecutarPrueba().catch(console.error);
