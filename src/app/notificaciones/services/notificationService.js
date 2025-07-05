const admin = require('firebase-admin');
const DeviceToken = require('../models/deviceTokenModel');
const Notification = require('../models/notificationModel');

class NotificationService {
    constructor() {
        this.socketIO = null;
        this.initializeFirebase();
    }

    // Configurar Socket.IO
    setSocketIO(io) {
        this.socketIO = io;
        console.log('Socket.IO configurado en NotificationService');
    }

    // Inicializar Firebase Admin SDK
    initializeFirebase() {
        try {
            // Solo inicializar si no está ya inicializado
            if (!admin.apps.length) {
                // Verificar variables de entorno requeridas
                const requiredVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL'];
                const missingVars = requiredVars.filter(varName => !process.env[varName]);
                
                // Verificar que tengamos al menos una forma de obtener la private key
                if (!process.env.FIREBASE_PRIVATE_KEY_BASE64 && !process.env.FIREBASE_PRIVATE_KEY) {
                    missingVars.push('FIREBASE_PRIVATE_KEY_BASE64 o FIREBASE_PRIVATE_KEY');
                }
                
                if (missingVars.length > 0) {
                    throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
                }

                // Configuración desde variables de entorno
                // Configuración mejorada para Firebase con soporte para Base64
                let privateKey;
                if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
                    // Usar formato Base64 (más confiable para Render)
                    privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
                    console.log('🔧 Usando FIREBASE_PRIVATE_KEY_BASE64');
                } else {
                    // Usar formato tradicional con escape de caracteres
                    privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
                    console.log('🔧 Usando FIREBASE_PRIVATE_KEY tradicional');
                }

                const serviceAccount = {
                    type: "service_account",
                    project_id: process.env.FIREBASE_PROJECT_ID,
                    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                    private_key: privateKey,
                    client_email: process.env.FIREBASE_CLIENT_EMAIL,
                    client_id: process.env.FIREBASE_CLIENT_ID,
                    auth_uri: "https://accounts.google.com/o/oauth2/auth",
                    token_uri: "https://oauth2.googleapis.com/token"
                };

                console.log('🔧 Configurando Firebase con project_id:', process.env.FIREBASE_PROJECT_ID);
                console.log('🔧 Client email:', process.env.FIREBASE_CLIENT_EMAIL);
                console.log('🔧 Private key ID:', process.env.FIREBASE_PRIVATE_KEY_ID);
                console.log('🔧 Private key present:', !!privateKey);
                console.log('🔧 Private key length:', privateKey?.length);
                console.log('🔧 Private key starts with BEGIN:', privateKey?.startsWith('-----BEGIN PRIVATE KEY-----'));
                console.log('🔧 Private key ends with END:', privateKey?.endsWith('-----END PRIVATE KEY-----'));
                console.log('🔧 Client ID:', process.env.FIREBASE_CLIENT_ID);

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: process.env.FIREBASE_PROJECT_ID
                });

                if (process.env.NODE_ENV !== 'production') {
                    console.log('Firebase Admin SDK inicializado exitosamente');
                }
            }
        } catch (error) {
            console.error('Error inicializando Firebase:', error.message);
            console.warn('Las notificaciones push no estarán disponibles');
        }
    }

    // Registrar token de dispositivo
    async registrarDeviceToken(clienteId, clienteDocumento, deviceToken, platform, deviceInfo = {}) {
        try {
            // Desactivar tokens antiguos del mismo cliente
            await DeviceToken.deactivateOldTokens(clienteId, deviceToken);

            // Crear o actualizar el token actual
            const tokenDoc = await DeviceToken.findOneAndUpdate(
                { deviceToken },
                {
                    clienteId,
                    clienteDocumento,
                    deviceToken,
                    platform,
                    deviceInfo,
                    isActive: true,
                    lastUsed: new Date()
                },
                { 
                    upsert: true, 
                    new: true 
                }
            );

            // Log solo en desarrollo
            if (process.env.NODE_ENV !== 'production') {
                console.log(`Token registrado para cliente ${clienteDocumento}: ${platform}`);
            }
            return tokenDoc;
        } catch (error) {
            console.error('Error registrando device token:', error);
            throw new Error('Error al registrar token de dispositivo');
        }
    }

    // Enviar notificación de cambio de estado
    async enviarNotificacionCambioEstado(clienteIdentificador, muestraId, estadoAnterior, estadoNuevo, observaciones = '') {
        try {
            const titulo = this.generarTitulo(estadoNuevo);
            const mensaje = this.generarMensaje(muestraId, estadoAnterior, estadoNuevo, observaciones);

            // Determinar si es ObjectId (24 hex chars) o documento (string)
            let notificationData = {
                muestraId,
                tipo: 'cambio_estado',
                titulo,
                mensaje,
                data: {
                    estadoAnterior,
                    estadoNuevo,
                    fechaCambio: new Date(),
                    observaciones,
                    metadata: {
                        accion: 'cambio_estado',
                        requiereAccion: this.requiereAccionCliente(estadoNuevo)
                    }
                }
            };
            if (typeof clienteIdentificador === 'string' && !clienteIdentificador.match(/^[0-9a-fA-F]{24}$/)) {
                notificationData.clienteDocumento = clienteIdentificador;
            } else {
                notificationData.clienteId = clienteIdentificador;
            }

            const notificacion = new Notification(notificationData);

            // Guardar notificación en base de datos
            await notificacion.save();

            // Enviar por múltiples canales
            await Promise.all([
                this.enviarPushNotification(clienteIdentificador, titulo, mensaje, notificacion.data),
                this.enviarWebSocketNotification(clienteIdentificador, notificacion),
            ]);

            // Log solo en desarrollo
            if (process.env.NODE_ENV !== 'production') {
                console.log(`Notificación enviada para muestra ${muestraId}: ${estadoAnterior} → ${estadoNuevo}`);
            }
            return notificacion;

        } catch (error) {
            console.error('Error enviando notificación de cambio de estado:', error);
            throw error;
        }
    }    // Enviar notificación push via Firebase
    async enviarPushNotification(clienteId, titulo, mensaje, data = {}) {
        try {
            if (!admin.apps.length) {
                console.warn('Firebase no configurado, saltando notificación push');
                return;
            }

            // Detectar si el identificador es ObjectId o documento
            let deviceTokens = [];
            if (typeof clienteId === 'string' && !clienteId.match(/^[0-9a-fA-F]{24}$/)) {
                // Es un documento (string)
                deviceTokens = await DeviceToken.find({ clienteDocumento: clienteId, isActive: true });
            } else {
                // Es un ObjectId o número válido
                deviceTokens = await DeviceToken.find({
                    $or: [
                        { clienteId: clienteId, isActive: true },
                        { clienteDocumento: clienteId, isActive: true }
                    ]
                });
            }

            if (deviceTokens.length === 0) {
                console.log(`⚠️ No hay tokens FCM activos para cliente ${clienteId}`);
                return;
            }

            console.log(`📱 Encontrados ${deviceTokens.length} dispositivos activos para cliente ${clienteId}`);
            deviceTokens.forEach(dt => {
                console.log(`   - Dispositivo: ${dt.platform} (${dt.deviceToken.substring(0, 20)}...)`);
                // En producción, mostrar más información del token para debugging
                if (process.env.NODE_ENV === 'production') {
                    console.log(`   - Token ID: ${dt._id}`);
                    console.log(`   - Token length: ${dt.deviceToken.length}`);
                    console.log(`   - Token valid format: ${dt.deviceToken.includes(':APA91b') ? 'YES' : 'NO'}`);
                    console.log(`   - Cliente Doc: ${dt.clienteDocumento}`);
                    console.log(`   - Created: ${dt.createdAt}`);
                }
            });

            const tokens = deviceTokens.map(dt => dt.deviceToken);

            // Filtrar tokens de prueba que no son válidos
            const testTokenPattern = /^ebokE6KDQzmfrRm9lRM3TH:APA91bEyour_test_token_here/;
            const validTokens = tokens.filter(token => !testTokenPattern.test(token));
            const testTokens = tokens.filter(token => testTokenPattern.test(token));

            if (testTokens.length > 0) {
                console.log(`⚠️ Detectados ${testTokens.length} tokens de prueba - no se enviarán via Firebase`);
                console.log('ℹ️ Para probar notificaciones reales, usa un token FCM válido de un dispositivo Android');
            }

            if (validTokens.length === 0 && testTokens.length > 0) {
                console.log('ℹ️ Solo hay tokens de prueba - simulando envío exitoso');
                return {
                    successCount: testTokens.length,
                    failureCount: 0,
                    responses: testTokens.map(() => ({ success: true }))
                };
            }

            const tokensToSend = validTokens.length > 0 ? validTokens : tokens;

            const message = {
                notification: {
                    title: titulo,
                    body: mensaje
                },
                data: {
                    estadoAnterior: data.estadoAnterior || '',
                    estadoNuevo: data.estadoNuevo || '',
                    fechaCambio: data.fechaCambio?.toISOString() || new Date().toISOString(),
                    observaciones: data.observaciones || '',
                    tipo: 'cambio_estado',
                    clickAction: 'OPEN_MUESTRA_DETAIL',
                    // Solo campos string, no objetos
                    requiereAccion: data.metadata?.requiereAccion?.toString() || 'false'
                },
                tokens: tokensToSend
            };

            console.log('🚀 Enviando mensaje FCM:', JSON.stringify({
                ...message,
                tokens: tokensToSend.map(t => t.substring(0, 20) + '...')
            }, null, 2));

            let response;
            try {
                response = await admin.messaging().sendMulticast(message);
            } catch (firebaseError) {
                console.error('❌ Error específico de Firebase:', firebaseError.message);
                console.error('🔍 Código de error:', firebaseError.code);
                console.error('🔍 Detalles completos:', JSON.stringify(firebaseError, null, 2));
                
                // Diagnóstico específico del error /batch
                if (firebaseError.message.includes('/batch')) {
                    console.error('🚨 ERROR CRÍTICO: Firebase no puede encontrar el endpoint /batch');
                    console.error('💡 Posibles causas:');
                    console.error('   1. Project ID incorrecto en Firebase');
                    console.error('   2. Token FCM inválido o expirado');
                    console.error('   3. Cloud Messaging no habilitado en Firebase Console');
                    console.error('   4. Credenciales de service account incorrectas');
                    console.error('');
                    console.error('🔧 Soluciones:');
                    console.error('   1. Verifica Project ID en Firebase Console');
                    console.error('   2. Regenera token FCM en la app Android');
                    console.error('   3. Habilita Cloud Messaging en Firebase Console');
                }
                
                // Si es un error de conectividad, tokens inválidos, o proyecto incorrecto
                if (firebaseError.message.includes('404') || 
                    firebaseError.message.includes('registration-token-not-registered') ||
                    firebaseError.message.includes('invalid-registration-token') ||
                    firebaseError.message.includes('project not found') ||
                    firebaseError.message.includes('/batch') ||
                    firebaseError.code === 'messaging/invalid-registration-token' ||
                    firebaseError.code === 'messaging/registration-token-not-registered') {
                    
                    console.log('ℹ️ Simulando respuesta debido a error Firebase (ver logs arriba para detalles)');
                    response = {
                        successCount: 0,
                        failureCount: tokensToSend.length,
                        responses: tokensToSend.map(() => ({ 
                            success: false, 
                            error: { code: 'messaging/invalid-registration-token' }
                        }))
                    };
                } else {
                    // Error más serio, propagarlo
                    throw firebaseError;
                }
            }
            
            // Si había tokens de prueba, agregarlos como exitosos
            if (testTokens.length > 0 && validTokens.length > 0) {
                response.successCount += testTokens.length;
                response.responses = response.responses.concat(
                    testTokens.map(() => ({ success: true }))
                );
            }
            // Procesar respuestas y desactivar tokens inválidos (solo para tokens reales)
            const validDeviceTokens = deviceTokens.filter(device => 
                !testTokenPattern.test(device.deviceToken)
            );
            if (validDeviceTokens.length > 0) {
                await this.procesarRespuestaFirebase(response, validDeviceTokens);
            }

            console.log(`Push notification enviada a ${response.successCount}/${tokens.length} dispositivos`);
            return response;

        } catch (error) {
            console.error('Error enviando push notification:', error);
            throw error;
        }
    }

    // Enviar notificación via WebSocket
    async enviarWebSocketNotification(clienteId, notificacion) {
        try {
            if (!this.socketIO) {
                console.warn('Socket.IO no configurado');
                return;
            }

            // Enviar a la sala específica del cliente
            const roomName = `cliente_${clienteId}`;
            this.socketIO.to(roomName).emit('notification', {
                id: notificacion._id,
                tipo: notificacion.tipo,
                titulo: notificacion.titulo,
                mensaje: notificacion.mensaje,
                data: notificacion.data,
                timestamp: notificacion.createdAt
            });

            console.log(`WebSocket notification enviada a sala: ${roomName}`);

        } catch (error) {
            console.error('Error enviando WebSocket notification:', error);
        }
    }

    // Procesar respuesta de Firebase y manejar tokens inválidos
    async procesarRespuestaFirebase(response, deviceTokens) {
        try {
            const tokenUpdates = [];

            response.responses.forEach((resp, index) => {
                const token = deviceTokens[index];
                
                if (!resp.success) {
                    const error = resp.error;
                    
                    // Tokens inválidos o no registrados
                    if (error.code === 'messaging/invalid-registration-token' || 
                        error.code === 'messaging/registration-token-not-registered') {
                        tokenUpdates.push({
                            updateOne: {
                                filter: { _id: token._id },
                                update: { isActive: false }
                            }
                        });
                    }
                }
            });

            if (tokenUpdates.length > 0) {
                await DeviceToken.bulkWrite(tokenUpdates);
                console.log(`Desactivados ${tokenUpdates.length} tokens inválidos`);
            }

        } catch (error) {
            console.error('Error procesando respuesta Firebase:', error);
        }
    }

    // Generar título según el estado
    generarTitulo(estado) {
        const titulos = {
            'En Cotización': '💼 Cotización en Proceso',
            'Aceptada': '✅ Cotización Aceptada',
            'Recibida': '📦 Muestra Recibida',
            'En análisis': '🔬 Análisis en Proceso',
            'Finalizada': '✅ Resultados Disponibles',
            'Rechazada': '❌ Muestra Rechazada'
        };
        
        return titulos[estado] || `📋 Estado Actualizado: ${estado}`;
    }

    // Generar mensaje personalizado
    generarMensaje(muestraId, estadoAnterior, estadoNuevo, observaciones) {
        const mensajes = {
            'En Cotización': `Su muestra ${muestraId} está siendo cotizada. Pronto recibirá más información.`,
            'Aceptada': `¡Excelente! La cotización de su muestra ${muestraId} ha sido aceptada. Procederemos con el análisis.`,
            'Recibida': `Su muestra ${muestraId} ha sido recibida en nuestro laboratorio y está lista para análisis.`,
            'En análisis': `Su muestra ${muestraId} está siendo analizada por nuestros expertos.`,
            'Finalizada': `¡Sus resultados están listos! Los análisis de la muestra ${muestraId} han sido completados.`,
            'Rechazada': `Su muestra ${muestraId} ha sido rechazada. ${observaciones || 'Contacte al laboratorio para más información.'}`
        };

        return mensajes[estadoNuevo] || `Su muestra ${muestraId} cambió de ${estadoAnterior} a ${estadoNuevo}.`;
    }

    // Verificar si el estado requiere acción del cliente
    requiereAccionCliente(estado) {
        return ['Finalizada', 'Rechazada', 'En Cotización'].includes(estado);
    }

    // Obtener notificaciones de un cliente
    async obtenerNotificacionesCliente(clienteId, limite = 20) {
        try {
            return await Notification.obtenerPorCliente(clienteId, limite);
        } catch (error) {
            console.error('Error obteniendo notificaciones:', error);
            throw error;
        }
    }

    // Marcar notificación como leída
    async marcarComoLeida(notificacionId, clienteId) {
        try {
            const notificacion = await Notification.findOne({ 
                _id: notificacionId, 
                clienteId 
            });
            
            if (!notificacion) {
                throw new Error('Notificación no encontrada');
            }

            return await notificacion.marcarComoLeida();
        } catch (error) {
            console.error('Error marcando notificación como leída:', error);
            throw error;
        }
    }

    // Obtener resumen de notificaciones no leídas
    async obtenerResumenNoLeidas(clienteId) {
        try {
            const noLeidas = await Notification.obtenerNoLeidas(clienteId);
            
            const resumen = {
                total: noLeidas.length,
                porTipo: {},
                ultimaNotificacion: noLeidas[0] || null
            };

            noLeidas.forEach(notif => {
                resumen.porTipo[notif.tipo] = (resumen.porTipo[notif.tipo] || 0) + 1;
            });

            return resumen;
        } catch (error) {
            console.error('Error obteniendo resumen de notificaciones:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();
