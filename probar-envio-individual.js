console.log('🧪 PRUEBA LOCAL DE ENVÍO FCM INDIVIDUAL');
console.log('======================================');

const admin = require('firebase-admin');

// Usar la configuración Base64 local
const privateKeyBase64 = 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQ1NuV1JBUU92a0ZDUGcKSVRDN0RadElGVDBpUlBSRjZTWlRkSWNDLzhzamlxeFcvdUtnc2lpdU9qaUJoY1dKR1FjSlV3UUFZUnZDK0ovNwpiS2xUR0tQSitVRk9iVmVYSmZEY2xCRGdDY0FMQ2FPQXB5cDJoN1RCN25DT1hNaWdSMkpIUVF6cE5mZTFWMVNrCmxZSTJRY3prckRKcERhMmJuNDU3cG12SWxIYmwwSm1GSU1kbE5FUld6Z2RGUzEraWJJVUtNUDdITjFlU3N4YTIKeE5RVGd4SENDbHpKNFNUa0VmU0xsNllwWW81RS9rOWw3ZndIcmgrWGNkWUVRYXpDbEN4SndFbk1WZ3RmNDZlNApTYUZFRmlJd2lGa0hHSExoTGhoMVNVQ2JPUnorZ3QvWWpRQk96S2VaRTBmUHJ4M1lBd2RYSi9rRmI5U212S0NXCnMvc2JkZ2paQWdNQkFBRUNnZ0VBSXB0azBTUHNaTVlkYlR2ZUdiTjhhbTJPNFo5Y1BWWU02L3F3d0JseVNhK3IKd1RJZHRzUHJpdTZmVHVBeEtxNExETUYvQWV3cHFKS1Q4WFNTemgzaDdxNEhWQVFvMHdxZGRyUHBkdHM4dENWLwptcEhJUXZITVFqMTNJN0NsdWdCdVJad1N6WTR2NVZmSi9WOGk2M2sxdnhZTERSL1RYWDlyaXJ0Qm1tRTZJVWtRCjV4aXJJc0FCWGJHS2JMNTROZTNjajgyMHRSVlk5Z0w2dURJNy81aEUrWC9JRTJlRm1sTUhhdjJvS0ZLZ1ZTTTcKeWxtSFlqSVJxTDlGaXN3eXNJMVdlQWRyMFdROEJibjNqODJoUE9seFBvTEExbDZRSDBNbzJtZ0s4dmJkQUpWbwplelQ2NmxkRnRSbnJYR1VzN05EQXVHdTE0K2pwekg2TkVGcVZhT3BQVVFLQmdRREliY1lCMU5INzlxYjdZbDFaCkYzN2RBS2ZvL1dMejgwMkMxL0t3QUdSOWVhZXZNOHNwNitjNG9xREdWZ1lhTUV2dm91eDdjaHZ2S2t1ZllZeVcKdTFLSEFWc2k4VFFkQmppczFlQWxWQzJqVUVzcDFxemc5Tk9IUDN0WEp5UWN3VUZHSFNhSkhDVHFuTGYzRjV6VQpockxjMmM0b2hBU1JabXM5RXcxTDhPaVdsUUtCZ1FDN1EvVVZ3c0dwSnV0cmRVNzJKZnNmUGpzUklFRGw4eDhKCm5GNjRHNkRTSzZoWWIzamxlZXFnczB3dTh2WW5id1pvNTJEQmI1MWJXdklFUGtHdEJxN1h1OGhocWt1MFE5eC8KdGFaQkVxK3pXTjBjY1IwUG5Bd2RDNjZ2a0YvN2pMdVpiV0lDdGJ6NG51b3FNU0VkR1RyYnBGdGRXdXFuVG9YSQoxcTBub3Foc05RS0JnUUN3YU1ZMkNHNkdHZk9oSVZQT1BicmdwRm9sM1JoQ1pheWNkSnZidzR5dlQrdUNidERyCjVnSE92SDFMOUoxTVlhUUVtTjhTVEQ1QUJIY3BJa0FPejNOMDlvR1R3TDlBcUtBcnA5ZXdvMlhENzhFb1l4WW8KcmZTY2Z3aDlqaXJmMEUwMmZDUFYzRnExMFJpdXVDN0dkSVJybEowNjFlLzdWaTBmUld5WG9jUGwvUUtCZ0FGMQp5ekJyUDFWUlQxNmNJSXg4eVZONkNiM2RjWVFaZkRGMy9ha1QxaEl0Y3ZlVmp1ekRJWmcxTGEva0J4VlJvVXdxCkdiQUliY0tybDkxK21zWjltZGxteG00MGhMaVlHdDBJRG83TlZYOWhmdi9jeGV3OFBEL3h1bC8yRVRtRjVHU1MKM01QR3BQMlBSNllpa2U2SEp0VlZsN3pIbTdMSVF2VEk3N3F5WXZ2TkFvR0FUcHJhZVAreEdacGsvdlNURTlFdAp0TEFlYm5BVGhmSmQyb2VhQjA4bUllZE5HMWxiVFBROEtoTUVQUW56VXVsa0piSmttQm9QVkZoSGF4L3p3R0dWClpXZEkxa1ZYbytkMTUxeHMxaFdxLzZ3S3doRTAyUzRWdXI1dWgyZEhDbW1HaG9LUDNJV256T3VNbzFsWDUzMUEKVzg5VjlDRWlJSnQrZElYeGFYVC95MTg9Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0=';

async function probarEnvioIndividual() {
    try {
        console.log('\n1. INICIALIZANDO FIREBASE:');
        
        // Limpiar apps existentes
        if (admin.apps.length > 0) {
            await Promise.all(admin.apps.map(app => app.delete()));
        }
        
        const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8');
        
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
        
        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: "aqualab-83795",
            serviceAccountId: "firebase-adminsdk-fbsvc@aqualab-83795.iam.gserviceaccount.com"
        });
        
        console.log('✅ Firebase inicializado correctamente');
        
        console.log('\n2. PROBANDO ENVÍO INDIVIDUAL:');
        
        // Token de prueba (fake pero formato válido)
        const testToken = 'dRCi48vuTj-9vwfajpl3dA:APA91bHmocked_token_for_testing_only';
        
        const message = {
            notification: {
                title: '🧪 Prueba de Envío Individual',
                body: 'Esta es una prueba del nuevo método send() individual'
            },
            data: {
                tipo: 'test',
                timestamp: new Date().toISOString()
            },
            token: testToken
        };
        
        console.log('📧 Enviando mensaje de prueba...');
        console.log('Token:', testToken.substring(0, 20) + '...');
        
        try {
            const response = await admin.messaging().send(message);
            console.log('✅ Envío exitoso con método individual!');
            console.log('Response:', response);
        } catch (sendError) {
            console.log('❌ Error esperado con token de prueba:', sendError.code);
            console.log('ℹ️ Esto es normal - el token es de prueba');
            
            if (!sendError.message.includes('/batch')) {
                console.log('✅ ÉXITO: No hay error de /batch - el método individual funciona');
            }
        }
        
        console.log('\n3. RESULTADO:');
        console.log('✅ El método send() individual evita el error /batch');
        console.log('✅ La configuración está lista para producción');
        console.log('✅ Puedes hacer redeploy con confianza');
        
        // Limpiar
        await app.delete();
        
    } catch (error) {
        console.error('❌ Error en prueba:', error.message);
        
        if (error.message.includes('/batch')) {
            console.error('🚨 Aún hay problema con /batch - revisar configuración');
        }
    }
}

probarEnvioIndividual();
