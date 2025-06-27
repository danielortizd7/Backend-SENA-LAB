const NotificationService = require('../services/notificationService');
const DeviceToken = require('../models/deviceTokenModel');
const Notification = require('../models/notificationModel');
const { ValidationError } = require('../../../shared/errors/AppError');

class NotificationController {
    
    // Registrar token de dispositivo móvil
    async registrarDeviceToken(req, res) {
        try {
            const { deviceToken, platform, deviceInfo } = req.body;
            const cliente = req.usuario; // Del middleware de autenticación

            if (!deviceToken || !platform) {
                return res.status(400).json({
                    success: false,
                    message: 'Token de dispositivo y plataforma son requeridos'
                });
            }            if (!['android'].includes(platform)) {
                return res.status(400).json({
                    success: false,
                    message: 'Plataforma no válida. Solo se acepta: android'
                });
            }

            const token = await NotificationService.registrarDeviceToken(
                cliente._id,
                cliente.documento,
                deviceToken,
                platform,
                deviceInfo
            );

            return res.status(200).json({
                success: true,
                message: 'Token de dispositivo registrado exitosamente',
                data: {
                    tokenId: token._id,
                    platform: token.platform,
                    isActive: token.isActive
                }
            });

        } catch (error) {
            console.error('Error registrando device token:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al registrar token de dispositivo'
            });
        }
    }

    // Obtener notificaciones del cliente
    async obtenerNotificaciones(req, res) {
        try {
            const { limite = 20, pagina = 1 } = req.query;
            const cliente = req.usuario;

            const notificaciones = await NotificationService.obtenerNotificacionesCliente(
                cliente._id,
                parseInt(limite)
            );

            const resumenNoLeidas = await NotificationService.obtenerResumenNoLeidas(cliente._id);

            return res.status(200).json({
                success: true,
                message: 'Notificaciones obtenidas exitosamente',
                data: {
                    notificaciones,
                    resumen: resumenNoLeidas,
                    total: notificaciones.length
                }
            });

        } catch (error) {
            console.error('Error obteniendo notificaciones:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener notificaciones'
            });
        }
    }

    // Marcar notificación como leída
    async marcarComoLeida(req, res) {
        try {
            const { notificacionId } = req.params;
            const cliente = req.usuario;

            if (!notificacionId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de notificación es requerido'
                });
            }

            const notificacion = await NotificationService.marcarComoLeida(
                notificacionId,
                cliente._id
            );

            return res.status(200).json({
                success: true,
                message: 'Notificación marcada como leída',
                data: {
                    notificacionId: notificacion._id,
                    fechaLectura: notificacion.fechaLectura
                }
            });

        } catch (error) {
            console.error('Error marcando notificación como leída:', error);
            const status = error.message.includes('no encontrada') ? 404 : 500;
            return res.status(status).json({
                success: false,
                message: error.message || 'Error al marcar notificación como leída'
            });
        }
    }

    // Obtener resumen de notificaciones no leídas
    async obtenerResumenNoLeidas(req, res) {
        try {
            const cliente = req.usuario;
            
            const resumen = await NotificationService.obtenerResumenNoLeidas(cliente._id);

            return res.status(200).json({
                success: true,
                message: 'Resumen de notificaciones obtenido exitosamente',
                data: resumen
            });

        } catch (error) {
            console.error('Error obteniendo resumen de notificaciones:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener resumen de notificaciones'
            });
        }
    }

    // Desactivar token de dispositivo (logout)
    async desactivarDeviceToken(req, res) {
        try {
            const { deviceToken } = req.body;
            const cliente = req.usuario;

            if (!deviceToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Token de dispositivo es requerido'
                });
            }

            await DeviceToken.findOneAndUpdate(
                { 
                    deviceToken,
                    clienteId: cliente._id
                },
                { 
                    isActive: false 
                }
            );

            return res.status(200).json({
                success: true,
                message: 'Token de dispositivo desactivado exitosamente'
            });

        } catch (error) {
            console.error('Error desactivando device token:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al desactivar token de dispositivo'
            });
        }
    }

    // Enviar notificación de prueba (solo para desarrollo)
    async enviarNotificacionPrueba(req, res) {
        try {
            if (process.env.NODE_ENV === 'production') {
                return res.status(403).json({
                    success: false,
                    message: 'Esta función no está disponible en producción'
                });
            }

            const { muestraId, estadoAnterior, estadoNuevo, observaciones } = req.body;
            const cliente = req.usuario;


            // Enviar notificación usando cliente.documento para compatibilidad con tokens existentes
            const notificacion = await NotificationService.enviarNotificacionCambioEstado(
                cliente.documento,
                muestraId || 'TEST001',
                estadoAnterior || 'En Cotización',
                estadoNuevo || 'Aceptada',
                observaciones || 'Notificación de prueba'
            );

            return res.status(200).json({
                success: true,
                message: 'Notificación de prueba enviada exitosamente',
                data: {
                    notificacionId: notificacion._id,
                    titulo: notificacion.titulo,
                    mensaje: notificacion.mensaje
                }
            });

        } catch (error) {
            console.error('Error enviando notificación de prueba:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al enviar notificación de prueba'
            });
        }
    }

    // Obtener estadísticas de notificaciones (admin)
    async obtenerEstadisticas(req, res) {
        try {
            const { fechaInicio, fechaFin } = req.query;
            
            const filtros = {};
            if (fechaInicio && fechaFin) {
                filtros.createdAt = {
                    $gte: new Date(fechaInicio),
                    $lte: new Date(fechaFin)
                };
            }

            const estadisticas = await Notification.aggregate([
                { $match: filtros },
                {
                    $group: {
                        _id: null,
                        totalNotificaciones: { $sum: 1 },
                        porTipo: {
                            $push: "$tipo"
                        },
                        porEstado: {
                            $push: "$estado"
                        },
                        promedioIntentos: { $avg: "$intentos" }
                    }
                }
            ]);

            return res.status(200).json({
                success: true,
                message: 'Estadísticas obtenidas exitosamente',
                data: estadisticas[0] || {
                    totalNotificaciones: 0,
                    porTipo: [],
                    porEstado: [],
                    promedioIntentos: 0
                }
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas'
            });
        }
    }

    // Verificar estado de tokens FCM del cliente
    async verificarEstadoTokens(req, res) {
        try {
            const cliente = req.usuario;

            // Obtener todos los tokens del cliente
            const tokens = await DeviceToken.find({ clienteId: cliente._id });
            
            const resumen = {
                clienteId: cliente._id,
                clienteDocumento: cliente.documento,
                clienteNombre: cliente.nombre,
                totalTokens: tokens.length,
                tokensActivos: tokens.filter(t => t.isActive).length,
                tokensInactivos: tokens.filter(t => !t.isActive).length,
                plataformas: {},
                dispositivos: tokens.map(token => ({
                    id: token._id,
                    platform: token.platform,
                    isActive: token.isActive,
                    lastUsed: token.lastUsed,
                    deviceInfo: token.deviceInfo,
                    tokenPreview: token.deviceToken.substring(0, 20) + '...'
                }))
            };

            // Contar por plataforma
            tokens.forEach(token => {
                if (!resumen.plataformas[token.platform]) {
                    resumen.plataformas[token.platform] = {
                        total: 0,
                        activos: 0
                    };
                }
                resumen.plataformas[token.platform].total++;
                if (token.isActive) {
                    resumen.plataformas[token.platform].activos++;
                }
            });

            return res.status(200).json({
                success: true,
                message: 'Estado de tokens obtenido exitosamente',
                data: resumen
            });

        } catch (error) {
            console.error('Error verificando estado de tokens:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al verificar estado de tokens'
            });
        }
    }

    // Diagnóstico completo de notificaciones (admin)
    async diagnosticoNotificaciones(req, res) {
        try {
            const { muestraId } = req.query;
            const NotificationUtils = require('../utils/notificationUtils');

            let resultado = {
                timestamp: new Date(),
                firebase: {
                    configurado: false,
                    estado: 'No configurado'
                },
                estadisticasGenerales: null,
                verificacionMuestra: null
            };

            // Verificar Firebase
            const admin = require('firebase-admin');
            if (admin.apps.length > 0) {
                resultado.firebase = {
                    configurado: true,
                    estado: 'Configurado correctamente',
                    proyectoId: process.env.FIREBASE_PROJECT_ID || 'No especificado'
                };
            }

            // Estadísticas generales
            resultado.estadisticasGenerales = await NotificationUtils.obtenerEstadisticasNotificaciones();

            // Verificación específica de muestra si se proporciona
            if (muestraId) {
                resultado.verificacionMuestra = await NotificationUtils.verificarClienteParaNotificaciones(muestraId);
            }

            // Clientes con tokens activos
            resultado.clientesConTokens = await NotificationUtils.obtenerClientesConTokensActivos();

            return res.status(200).json({
                success: true,
                message: 'Diagnóstico de notificaciones completado',
                data: resultado
            });

        } catch (error) {
            console.error('Error en diagnóstico de notificaciones:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al realizar diagnóstico'
            });
        }
    }

    // Validar formato del token de autenticación
    async validarTokenMovil(req, res) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader) {
                return res.status(401).json({
                    success: false,
                    message: 'Token de autenticación requerido',
                    required: {
                        header: 'Authorization: Bearer <jwt_token>',
                        description: 'La app móvil debe enviar el JWT token en el header Authorization'
                    }
                });
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Formato de token inválido',
                    required: {
                        format: 'Bearer <jwt_token>',
                        example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                    }
                });
            }

            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
            
            return res.status(200).json({
                success: true,
                message: 'Token válido',
                data: {
                    clienteId: decoded._id || decoded.id,
                    documento: decoded.documento,
                    nombre: decoded.nombre,
                    rol: decoded.rol,
                    validUntil: new Date(decoded.exp * 1000)
                }
            });

        } catch (error) {
            console.error('Error validando token:', error);
            return res.status(401).json({
                success: false,
                message: 'Token inválido o expirado',
                error: error.message
            });
        }
    }    // Guía para obtener token FCM desde la app móvil Android
    async guiaTokenFCM(req, res) {
        try {
            const guia = {
                android: {
                    description: "Para obtener el token FCM en Android",
                    dependencies: [
                        "implementation 'com.google.firebase:firebase-messaging:23.2.1'",
                        "implementation 'com.google.firebase:firebase-analytics:21.3.0'"
                    ],
                    setup: "1. Crear proyecto en Firebase Console\n2. Agregar app Android\n3. Descargar google-services.json\n4. Configurar credenciales en backend",
                    code: `
// En MainActivity.java o MainActivity.kt
FirebaseMessaging.getInstance().getToken()
    .addOnCompleteListener(new OnCompleteListener<String>() {
        @Override
        public void onComplete(@NonNull Task<String> task) {
            if (!task.isSuccessful()) {
                Log.w(TAG, "Fetching FCM registration token failed", task.getException());
                return;
            }

            // Get new FCM registration token
            String token = task.getResult();
            Log.d(TAG, "FCM Token: " + token);
            
            // Enviar al backend
            sendTokenToBackend(token, "android");
        }
    });
                    `,
                    manifest: `
<service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
                    `,
                    websocket: `
// Alternativa: Solo WebSocket (sin Firebase)
// Para recibir notificaciones solo cuando la app está abierta
import io.socket.client.IO;
import io.socket.client.Socket;

Socket socket = IO.socket("ws://tu-backend.com");
socket.on("notification", (args) -> {
    // Manejar notificación recibida
    JSONObject notification = (JSONObject) args[0];
    // Mostrar notificación local
});
socket.connect();
                    `
                }
            };

            return res.status(200).json({
                success: true,
                message: 'Guía para implementar notificaciones en Android',
                data: guia,
                firebase: {
                    required: true,
                    reason: "Firebase es necesario para notificaciones push cuando la app está cerrada",
                    steps: [
                        "1. Crear proyecto en Firebase Console",
                        "2. Agregar app Android con tu package name",
                        "3. Descargar google-services.json",
                        "4. Configurar credenciales en backend (.env)",
                        "5. Implementar FCM en tu app Android"
                    ]
                },
                endpoint: {
                    url: `${req.protocol}://${req.get('host')}/api/notificaciones/register-device`,
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer <jwt_token>',
                        'Content-Type': 'application/json'
                    },
                    body: {
                        deviceToken: 'token_fcm_obtenido',
                        platform: 'android',
                        deviceInfo: {
                            deviceId: 'unique_device_identifier',
                            deviceName: 'Samsung Galaxy S21',
                            osVersion: 'Android 12',
                            appBuild: '1.0.0'
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error generando guía FCM:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al generar guía'
            });
        }
    }

    // ENDPOINT DE PRUEBA LOCAL - Solo para desarrollo
    async pruebaLocalNotificacion(req, res) {
        try {
            console.log('🧪 === PRUEBA LOCAL DE NOTIFICACIONES ===');
            
            const { 
                clienteDocumento = '1235467890',
                muestraId = 'TEST-' + Date.now(),
                estadoAnterior = 'En Cotización',
                estadoNuevo = 'Aceptada',
                observaciones = 'Prueba local de notificación',
                testToken = null
            } = req.body;

            console.log('📋 Parámetros de prueba:');
            console.log(`   - Cliente Documento: ${clienteDocumento}`);
            console.log(`   - Muestra ID: ${muestraId}`);
            console.log(`   - Cambio: ${estadoAnterior} → ${estadoNuevo}`);
            console.log(`   - Token de prueba: ${testToken ? testToken.substring(0, 20) + '...' : 'No proporcionado'}`);

            // Si se proporciona un token de prueba, registrarlo temporalmente
            if (testToken) {
                console.log('🔧 Registrando token de prueba...');
                await NotificationService.registrarDeviceToken(
                    null, // clienteId
                    clienteDocumento,
                    testToken,
                    'android',
                    { device: 'test', version: 'local' }
                );
                console.log('✅ Token de prueba registrado');
            }

            // Buscar tokens existentes para este cliente
            const tokens = await DeviceToken.find({ 
                clienteDocumento: clienteDocumento, 
                isActive: true 
            });
            console.log(`🔍 Tokens encontrados para ${clienteDocumento}: ${tokens.length}`);
            tokens.forEach((token, index) => {
                console.log(`   ${index + 1}. ${token.platform} - ${token.deviceToken.substring(0, 20)}... (Activo: ${token.isActive})`);
            });

            if (tokens.length === 0) {
                console.log('⚠️ No hay tokens activos para este cliente');
                return res.status(200).json({
                    success: false,
                    message: 'No hay tokens FCM registrados para este cliente',
                    data: {
                        clienteDocumento,
                        tokensEncontrados: 0,
                        sugerencia: 'Registra un token primero usando el endpoint /registrar-token o proporciona testToken en el body'
                    }
                });
            }

            // Enviar notificación de prueba
            console.log('🚀 Enviando notificación de prueba...');
            const notificacion = await NotificationService.enviarNotificacionCambioEstado(
                clienteDocumento,
                muestraId,
                estadoAnterior,
                estadoNuevo,
                observaciones
            );

            console.log('✅ Notificación enviada exitosamente');
            console.log('🧪 === FIN DE PRUEBA LOCAL ===');

            return res.status(200).json({
                success: true,
                message: 'Notificación de prueba enviada exitosamente',
                data: {
                    notificacionId: notificacion._id,
                    clienteDocumento,
                    muestraId,
                    titulo: notificacion.titulo,
                    mensaje: notificacion.mensaje,
                    tokensEncontrados: tokens.length,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ Error en prueba local:', error);
            return res.status(500).json({
                success: false,
                message: 'Error en prueba local de notificación',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // ENDPOINT PARA VERIFICAR CONFIGURACIÓN DE FIREBASE
    async verificarConfigFirebase(req, res) {
        try {
            console.log('🔍 === VERIFICACIÓN DE CONFIGURACIÓN FIREBASE ===');
            
            const firebaseVars = {
                PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
                CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
                PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
                HAS_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
                CLIENT_ID: process.env.FIREBASE_CLIENT_ID
            };

            console.log('📋 Variables de entorno Firebase:');
            Object.entries(firebaseVars).forEach(([key, value]) => {
                if (key === 'HAS_PRIVATE_KEY') {
                    console.log(`   ${key}: ${value}`);
                } else if (value) {
                    console.log(`   ${key}: ${value.length > 50 ? value.substring(0, 50) + '...' : value}`);
                } else {
                    console.log(`   ${key}: ❌ NO CONFIGURADA`);
                }
            });

            const missingVars = Object.entries(firebaseVars)
                .filter(([key, value]) => !value && key !== 'CLIENT_ID')
                .map(([key]) => key);

            const admin = require('firebase-admin');
            const isInitialized = admin.apps.length > 0;

            console.log(`🔧 Firebase Admin SDK inicializado: ${isInitialized ? '✅' : '❌'}`);
            console.log('🔍 === FIN DE VERIFICACIÓN ===');

            return res.status(200).json({
                success: true,
                message: 'Verificación de configuración Firebase completada',
                data: {
                    isInitialized,
                    configuredVars: firebaseVars,
                    missingVars,
                    status: missingVars.length === 0 ? 'COMPLETA' : 'INCOMPLETA'
                }
            });

        } catch (error) {
            console.error('❌ Error verificando configuración:', error);
            return res.status(500).json({
                success: false,
                message: 'Error verificando configuración Firebase',
                error: error.message
            });
        }
    }
}

module.exports = new NotificationController();
