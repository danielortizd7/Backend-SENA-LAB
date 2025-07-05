console.log('🧪 PRUEBA LOCAL DE CONFIGURACIÓN FIREBASE BASE64');
console.log('=============================================');

// Probar la configuración Base64 localmente
const admin = require('firebase-admin');

// Usar la clave privada real convertida a Base64
const privateKeyBase64 = 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQ1NuV1JBUU92a0ZDUGcKSVRDN0RadElGVDBpUlBSRjZTWlRkSWNDLzhzamlxeFcvdUtnc2lpdU9qaUJoY1dKR1FjSlV3UUFZUnZDK0ovNwpiS2xUR0tQSitVRk9iVmVYSmZEY2xCRGdDY0FMQ2FPQXB5cDJoN1RCN25DT1hNaWdSMkpIUVF6cE5mZTFWMVNrCmxZSTJRY3prckRKcERhMmJuNDU3cG12SWxIYmwwSm1GSU1kbE5FUld6Z2RGUzEraWJJVUtNUDdITjFlU3N4YTIKeE5RVGd4SENDbHpKNFNUa0VmU0xsNllwWW81RS9rOWw3ZndIcmgrWGNkWUVRYXpDbEN4SndFbk1WZ3RmNDZlNApTYUZFRmlJd2lGa0hHSExoTGhoMVNVQ2JPUnorZ3QvWWpRQk96S2VaRTBmUHJ4M1lBd2RYSi9rRmI5U212S0NXCnMvc2JkZ2paQWdNQkFBRUNnZ0VBSXB0azBTUHNaTVlkYlR2ZUdiTjhhbTJPNFo5Y1BWWU02L3F3d0JseVNhK3IKd1RJZHRzUHJpdTZmVHVBeEtxNExETUYvQWV3cHFKS1Q4WFNTemgzaDdxNEhWQVFvMHdxZGRyUHBkdHM4dENWLwptcEhJUXZITVFqMTNJN0NsdWdCdVJad1N6WTR2NVZmSi9WOGk2M2sxdnhZTERSL1RYWDlyaXJ0Qm1tRTZJVWtRCjV4aXJJc0FCWGJHS2JMNTROZTNjajgyMHRSVlk5Z0w2dURJNy81aEUrWC9JRTJlRm1sTUhhdjJvS0ZLZ1ZTTTcKeWxtSFlqSVJxTDlGaXN3eXNJMVdlQWRyMFdROEJibjNqODJoUE9seFBvTEExbDZRSDBNbzJtZ0s4dmJkQUpWbwplelQ2NmxkRnRSbnJYR1VzN05EQXVHdTE0K2pwekg2TkVGcVZhT3BQVVFLQmdRREliY1lCMU5INzlxYjdZbDFaCkYzN2RBS2ZvL1dMejgwMkMxL0t3QUdSOWVhZXZNOHNwNitjNG9xREdWZ1lhTUV2dm91eDdjaHZ2S2t1ZllZeVcKdTFLSEFWc2k4VFFkQmppczFlQWxWQzJqVUVzcDFxemc5Tk9IUDN0WEp5UWN3VUZHSFNhSkhDVHFuTGYzRjV6VQpockxjMmM0b2hBU1JabXM5RXcxTDhPaVdsUUtCZ1FDN1EvVVZ3c0dwSnV0cmRVNzJKZnNmUGpzUklFRGw4eDhKCm5GNjRHNkRTSzZoWWIzamxlZXFnczB3dTh2WW5id1pvNTJEQmI1MWJXdklFUGtHdEJxN1h1OGhocWt1MFE5eC8KdGFaQkVxK3pXTjBjY1IwUG5Bd2RDNjZ2a0YvN2pMdVpiV0lDdGJ6NG51b3FNU0VkR1RyYnBGdGRXdXFuVG9YSQoxcTBub3Foc05RS0JnUUN3YU1ZMkNHNkdHZk9oSVZQT1BicmdwRm9sM1JoQ1pheWNkSnZidzR5dlQrdUNidERyCjVnSE92SDFMOUoxTVlhUUVtTjhTVEQ1QUJIY3BJa0FPejNOMDlvR1R3TDlBcUtBcnA5ZXdvMlhENzhFb1l4WW8KcmZTY2Z3aDlqaXJmMEUwMmZDUFYzRnExMFJpdXVDN0dkSVJybEowNjFlLzdWaTBmUld5WG9jUGwvUUtCZ0FGMQp5ekJyUDFWUlQxNmNJSXg4eVZONkNiM2RjWVFaZkRGMy9ha1QxaEl0Y3ZlVmp1ekRJWmcxTGEva0J4VlJvVXdxCkdiQUliY0tybDkxK21zWjltZGxteG00MGhMaVlHdDBJRG83TlZYOWhmdi9jeGV3OFBEL3h1bC8yRVRtRjVHU1MKM01QR3BQMlBSNllpa2U2SEp0VlZsN3pIbTdMSVF2VEk3N3F5WXZ2TkFvR0FUcHJhZVAreEdacGsvdlNURTlFdAp0TEFlYm5BVGhmSmQyb2VhQjA4bUllZE5HMWxiVFBROEtoTUVQUW56VXVsa0piSmttQm9QVkZoSGF4L3p3R0dWClpXZEkxa1ZYbytkMTUxeHMxaFdxLzZ3S3doRTAyUzRWdXI1dWgyZEhDbW1HaG9LUDNJV256T3VNbzFsWDUzMUEKVzg5VjlDRWlJSnQrZElYeGFYVC95MTg9Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0=';

async function probarConfiguracionBase64() {
    try {
        console.log('\n1. DECODIFICANDO CLAVE PRIVADA DESDE BASE64:');
        const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8');
        
        console.log('✅ Clave decodificada correctamente');
        console.log('   Longitud:', privateKey.length);
        console.log('   Inicia con BEGIN:', privateKey.startsWith('-----BEGIN PRIVATE KEY-----'));
        console.log('   Termina con END:', privateKey.endsWith('-----END PRIVATE KEY-----'));
        
        console.log('\n2. CREANDO SERVICE ACCOUNT:');
        const serviceAccount = {
            type: "service_account",
            project_id: "aqualab-83795",
            private_key_id: "e25e9dec1c5457a266082d7b0e74ad21d631b8b4",
            private_key: privateKey,
            client_email: "firebase-adminsdk-fbsvc@aqualab-83795.iam.gserviceaccount.com",
            client_id: "103683320452412442574",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token"
        };
        
        console.log('✅ Service account creado');
        console.log('   Project ID:', serviceAccount.project_id);
        console.log('   Client Email:', serviceAccount.client_email);
        console.log('   Private Key OK:', serviceAccount.private_key.length > 0);
        
        console.log('\n3. PROBANDO INICIALIZACIÓN DE FIREBASE:');
        
        // Limpiar cualquier app existente
        if (admin.apps.length > 0) {
            await Promise.all(admin.apps.map(app => app.delete()));
        }
        
        // Inicializar con la configuración Base64
        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });
        
        console.log('✅ Firebase Admin SDK inicializado exitosamente');
        console.log('   App Name:', app.name);
        
        console.log('\n4. PROBANDO ACCESO A FIREBASE MESSAGING:');
        const messaging = admin.messaging();
        console.log('✅ Firebase Messaging disponible');
        
        console.log('\n✅ PRUEBA COMPLETADA EXITOSAMENTE');
        console.log('==================================');
        console.log('La configuración Base64 funciona correctamente.');
        console.log('Puedes proceder con el deployment en Render.');
        
        // Limpiar
        await app.delete();
        
    } catch (error) {
        console.error('\n❌ ERROR EN LA PRUEBA:', error.message);
        console.error('Detalle del error:', error);
        
        if (error.message.includes('secretOrPrivateKey')) {
            console.error('\n🔍 DIAGNÓSTICO:');
            console.error('El error indica que la clave privada no está en el formato correcto.');
            console.error('Esto puede indicar un problema con la decodificación Base64.');
        }
    }
}

// Ejecutar la prueba
probarConfiguracionBase64().catch(console.error);

console.log('\n📋 INFORMACIÓN ADICIONAL:');
console.log('Si esta prueba funciona, significa que:');
console.log('1. ✅ La conversión Base64 es correcta');
console.log('2. ✅ La clave privada está en el formato correcto');
console.log('3. ✅ Firebase Admin SDK puede usar la clave');
console.log('4. ✅ La configuración funcionará en Render');
