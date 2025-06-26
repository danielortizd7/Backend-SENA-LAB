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
                // Configuración desde variables de entorno
                const serviceAccount = {
                    type: "service_account",
                    project_id: process.env.FIREBASE_PROJECT_ID,
                    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    client_email: process.env.FIREBASE_CLIENT_EMAIL,
                    client_id: process.env.FIREBASE_CLIENT_ID,
                    auth_uri: "https://accounts.google.com/o/oauth2/auth",
                    token_uri: "https://oauth2.googleapis.com/token"
                };

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: process.env.FIREBASE_PROJECT_ID
                });

                console.log('Firebase Admin SDK inicializado exitosamente');
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

            console.log(`Token registrado para cliente ${clienteDocumento}: ${platform}`);
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

            console.log(`Notificación enviada para muestra ${muestraId}: ${estadoAnterior} → ${estadoNuevo}`);
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
            });

            const tokens = deviceTokens.map(dt => dt.deviceToken);

            const message = {
                notification: {
                    title: titulo,
                    body: mensaje
                },
                data: {
                    ...data,
                    estadoAnterior: data.estadoAnterior || '',
                    estadoNuevo: data.estadoNuevo || '',
                    fechaCambio: data.fechaCambio?.toISOString() || new Date().toISOString(),
                    observaciones: data.observaciones || '',
                    tipo: 'cambio_estado',
                    clickAction: 'OPEN_MUESTRA_DETAIL'
                },
                tokens
            };

            const response = await admin.messaging().sendMulticast(message);
            // Procesar respuestas y desactivar tokens inválidos
            await this.procesarRespuestaFirebase(response, deviceTokens);

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
