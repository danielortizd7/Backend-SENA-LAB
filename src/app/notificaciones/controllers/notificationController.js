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
            }

            if (!['android'].includes(platform)) {
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

    // Registrar token de dispositivo móvil (versión pública para testing)
    async registrarDeviceTokenPublico(req, res) {
        try {
            console.log('📱 === REGISTRO PÚBLICO DE TOKEN FCM ===');
            
            const { deviceToken, platform, deviceInfo, clienteDocumento } = req.body;

            if (!deviceToken || !platform || !clienteDocumento) {
                return res.status(400).json({
                    success: false,
                    message: 'Token de dispositivo, plataforma y documento de cliente son requeridos',
                    required: {
                        deviceToken: 'Token FCM del dispositivo',
                        platform: 'android',
                        clienteDocumento: 'Número de documento del cliente'
                    }
                });
            }

            if (!['android'].includes(platform)) {
                return res.status(400).json({
                    success: false,
                    message: 'Plataforma no válida. Solo se acepta: android'
                });
            }

            // ✅ VALIDACIÓN DE LONGITUD DE TOKEN FCM
            if (deviceToken.length < 140) {
                console.log(`❌ Token incompleto detectado: ${deviceToken.length} caracteres`);
                console.log(`🔑 Token recibido: ${deviceToken}`);
                return res.status(400).json({
                    success: false,
                    message: 'Token FCM incompleto. Los tokens válidos deben tener al menos 140 caracteres',
                    data: {
                        tokenLength: deviceToken.length,
                        minimumRequired: 140,
                        tokenReceived: deviceToken,
                        error: 'TOKEN_INCOMPLETO',
                        solution: 'Regenerar token FCM en la app Android'
                    }
                });
            }

            // ✅ VALIDACIÓN DE FORMATO DE TOKEN FCM
            if (!deviceToken.includes(':APA91b')) {
                console.log(`❌ Token con formato inválido: ${deviceToken}`);
                return res.status(400).json({
                    success: false,
                    message: 'Token FCM con formato inválido. Debe contener ":APA91b"',
                    data: {
                        tokenLength: deviceToken.length,
                        tokenReceived: deviceToken,
                        error: 'TOKEN_FORMATO_INVALIDO',
                        solution: 'Regenerar token FCM en la app Android'
                    }
                });
            }

            console.log(`📋 Registrando token para cliente: ${clienteDocumento}`);
            console.log(`📱 Platform: ${platform}`);
            console.log(`🔑 Token: ${deviceToken.substring(0, 20)}...`);

            const token = await NotificationService.registrarDeviceToken(
                null, // clienteId (no requerido para registro público)
                clienteDocumento,
                deviceToken,
                platform,
                deviceInfo || { public: true, registered: new Date().toISOString() }
            );

            console.log('✅ Token registrado exitosamente');

            return res.status(200).json({
                success: true,
                message: 'Token de dispositivo registrado exitosamente',
                data: {
                    tokenId: token._id,
                    clienteDocumento: token.clienteDocumento,
                    platform: token.platform,
                    isActive: token.isActive,
                    registeredAt: token.createdAt
                }
            });

        } catch (error) {
            console.error('❌ Error registrando device token público:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al registrar token de dispositivo',
                error: error.message
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

    // ENDPOINT PARA LIMPIAR TOKENS INVÁLIDOS
    async limpiarTokensInvalidos(req, res) {
        try {
            console.log('🧹 === LIMPIEZA DE TOKENS INVÁLIDOS ===');
            
            // Desactivar todos los tokens marcados como inválidos
            const resultado = await DeviceToken.updateMany(
                { isActive: false },
                { $unset: { deviceToken: 1 } }
            );
            
            // Contar tokens activos restantes
            const tokensActivos = await DeviceToken.countDocuments({ isActive: true });
            
            console.log(`🗑️ Tokens inválidos limpiados: ${resultado.modifiedCount}`);
            console.log(`✅ Tokens activos restantes: ${tokensActivos}`);
            
            return res.status(200).json({
                success: true,
                message: 'Tokens inválidos limpiados exitosamente',
                data: {
                    tokensLimpiados: resultado.modifiedCount,
                    tokensActivos: tokensActivos,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Error limpiando tokens:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al limpiar tokens inválidos',
                error: error.message
            });
        }
    }

    // ENDPOINT PARA VERIFICAR ESTADO DE FCM API
    async verificarEstadoFCMAPI(req, res) {
        try {
            console.log('🔍 === VERIFICACIÓN DE FCM API ===');
            
            const admin = require('firebase-admin');
            
            // Verificar si Firebase está inicializado
            if (admin.apps.length === 0) {
                return res.status(500).json({
                    success: false,
                    message: 'Firebase no está inicializado',
                    data: { initialized: false }
                });
            }
            
            const messaging = admin.messaging();
            console.log('✅ Instancia de Messaging obtenida');
            
            // Intentar una operación que requiere FCM API habilitada
            const testToken = 'fakeTokenForAPITest123456789012345678901234567890123456789012345678901234567890';
            
            try {
                await messaging.send({
                    token: testToken,
                    notification: {
                        title: 'API Test',
                        body: 'Testing FCM API availability'
                    }
                });
                
                // Si llegamos aquí sin error 404, FCM API está habilitada
                console.log('✅ FCM API está habilitada y respondiendo');
                
            } catch (apiError) {
                console.log(`🔍 Error recibido: ${apiError.code}`);
                console.log(`📝 Mensaje: ${apiError.message}`);
                
                if (apiError.message.includes('404') || 
                    apiError.message.includes('/batch') ||
                    apiError.code === 'messaging/unknown-error') {
                    
                    return res.status(200).json({
                        success: false,
                        message: 'Firebase Cloud Messaging API NO está habilitada',
                        data: {
                            error: apiError.code,
                            message: apiError.message,
                            diagnosis: 'FCM_API_NOT_ENABLED',
                            solution: {
                                step1: 'Ve a Google Cloud Console',
                                step2: `https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=${process.env.FIREBASE_PROJECT_ID}`,
                                step3: 'Habilita "Firebase Cloud Messaging API"',
                                step4: 'Espera 5-10 minutos para propagación'
                            }
                        }
                    });
                    
                } else if (apiError.code === 'messaging/invalid-registration-token' ||
                          apiError.code === 'messaging/registration-token-not-registered' ||
                          apiError.code === 'messaging/invalid-argument') {
                    
                    return res.status(200).json({
                        success: true,
                        message: 'FCM API está habilitada y funcionando correctamente',
                        data: {
                            error: apiError.code,
                            diagnosis: 'FCM_API_WORKING',
                            explanation: 'Error esperado con token de prueba inválido'
                        }
                    });
                    
                } else {
                    return res.status(200).json({
                        success: false,
                        message: 'Error inesperado en FCM API',
                        data: {
                            error: apiError.code,
                            message: apiError.message,
                            diagnosis: 'UNKNOWN_ERROR'
                        }
                    });
                }
            }
            
        } catch (error) {
            console.error('❌ Error verificando FCM API:', error);
            return res.status(500).json({
                success: false,
                message: 'Error verificando estado de FCM API',
                error: error.message
            });
        }
    }

    // DIAGNÓSTICO ESPECÍFICO PARA ERROR 404 DE FCM
    async diagnosticoError404FCM(req, res) {
        try {
            console.log('🚨 === DIAGNÓSTICO ERROR 404 FCM ===');
            
            const admin = require('firebase-admin');
            
            // Verificar si Firebase está inicializado
            if (admin.apps.length === 0) {
                return res.status(500).json({
                    success: false,
                    message: 'Firebase no está inicializado',
                    data: { initialized: false }
                });
            }

            console.log('✅ Firebase está inicializado');
            
            const firebaseConfig = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
                hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
            };

            console.log('📋 Configuración Firebase:');
            console.log(`   Project ID: ${firebaseConfig.projectId}`);
            console.log(`   Client Email: ${firebaseConfig.clientEmail}`);
            console.log(`   Private Key ID: ${firebaseConfig.privateKeyId}`);
            console.log(`   Has Private Key: ${firebaseConfig.hasPrivateKey}`);

            // Verificar URLs de Firebase
            const baseUrl = `https://fcm.googleapis.com/v1/projects/${firebaseConfig.projectId}/messages:send`;
            console.log(`🔗 URL de FCM: ${baseUrl}`);

            // Buscar tokens de prueba
            const testTokens = await DeviceToken.find({ 
                isActive: true 
            }).limit(1);

            if (testTokens.length === 0) {
                return res.status(200).json({
                    success: false,
                    message: 'No hay tokens FCM para probar',
                    data: {
                        diagnosis: 'NO_TOKENS',
                        solution: 'Registra un token FCM primero'
                    }
                });
            }

            const testToken = testTokens[0];
            console.log(`🧪 Token de prueba: ${testToken.deviceToken.substring(0, 20)}...`);

            // Intentar envío de prueba para diagnosticar el error exacto
            const messaging = admin.messaging();
            
            try {
                const result = await messaging.send({
                    token: testToken.deviceToken,
                    notification: {
                        title: '🧪 Diagnóstico FCM',
                        body: 'Probando conectividad FCM...'
                    },
                    data: {
                        type: 'diagnostic',
                        timestamp: new Date().toISOString()
                    }
                });

                console.log('✅ Notificación enviada exitosamente');
                console.log(`📝 Message ID: ${result}`);

                return res.status(200).json({
                    success: true,
                    message: 'FCM funciona correctamente',
                    data: {
                        messageId: result,
                        tokenTested: testToken.deviceToken.substring(0, 20) + '...',
                        projectId: firebaseConfig.projectId,
                        diagnosis: 'FCM_WORKING'
                    }
                });

            } catch (fcmError) {
                console.log(`❌ Error FCM: ${fcmError.code}`);
                console.log(`📝 Mensaje: ${fcmError.message}`);
                
                let diagnosis = 'UNKNOWN';
                let solution = [];
                
                if (fcmError.message.includes('404') || 
                    fcmError.message.includes('/batch') ||
                    fcmError.message.includes('not found')) {
                    
                    diagnosis = 'FCM_API_NOT_ENABLED';
                    solution = [
                        '1. Ve a Google Cloud Console',
                        `2. Abre: https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=${firebaseConfig.projectId}`,
                        '3. Haz click en "HABILITAR" para Firebase Cloud Messaging API',
                        '4. Espera 5-10 minutos para que se propague',
                        '5. Vuelve a intentar enviar notificaciones'
                    ];
                    
                } else if (fcmError.code === 'messaging/invalid-registration-token') {
                    diagnosis = 'INVALID_TOKEN';
                    solution = [
                        '1. El token FCM es inválido o expiró',
                        '2. Genera un nuevo token en la app Android',
                        '3. Registra el nuevo token usando /registrar-token'
                    ];
                    
                } else if (fcmError.code === 'messaging/authentication-error') {
                    diagnosis = 'AUTH_ERROR';
                    solution = [
                        '1. Verifica las credenciales de Firebase en .env',
                        '2. Descarga un nuevo service account key',
                        '3. Actualiza las variables de entorno'
                    ];
                    
                } else if (fcmError.message.includes('project')) {
                    diagnosis = 'WRONG_PROJECT';
                    solution = [
                        '1. Verifica el Project ID en Firebase Console',
                        '2. Asegúrate que coincida con FIREBASE_PROJECT_ID en .env',
                        '3. Verifica que el service account pertenezca al proyecto correcto'
                    ];
                }

                return res.status(200).json({
                    success: false,
                    message: 'Error en FCM detectado',
                    data: {
                        error: fcmError.code,
                        message: fcmError.message,
                        diagnosis,
                        solution,
                        projectId: firebaseConfig.projectId,
                        tokenTested: testToken.deviceToken.substring(0, 20) + '...',
                        fcmUrl: baseUrl
                    }
                });
            }

        } catch (error) {
            console.error('❌ Error en diagnóstico:', error);
            return res.status(500).json({
                success: false,
                message: 'Error ejecutando diagnóstico',
                error: error.message
            });
        }
    }

    // GUÍA PASO A PASO PARA SOLUCIONAR ERROR 404
    async guiaSolucionError404(req, res) {
        try {
            const projectId = process.env.FIREBASE_PROJECT_ID;
            
            const guia = {
                problema: 'Error 404 - Firebase Cloud Messaging API no está habilitada',
                causa: 'La API de FCM no está activada en Google Cloud Console',
                solucion: {
                    paso1: {
                        titulo: '1. Acceder a Google Cloud Console',
                        url: `https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=${projectId}`,
                        descripcion: 'Abre este enlace en tu navegador (asegúrate de estar logueado con la cuenta correcta)'
                    },
                    paso2: {
                        titulo: '2. Habilitar Firebase Cloud Messaging API',
                        accion: 'Haz click en el botón "HABILITAR" o "ENABLE"',
                        nota: 'Si ya está habilitada, aparecerá "API HABILITADA"'
                    },
                    paso3: {
                        titulo: '3. Esperar propagación',
                        tiempo: '5-10 minutos',
                        descripcion: 'La activación puede tardar unos minutos en propagarse'
                    },
                    paso4: {
                        titulo: '4. Verificar estado',
                        endpoint: '/api/notificaciones/verificar-fcm-api',
                        descripcion: 'Usa este endpoint para verificar que FCM esté funcionando'
                    }
                },
                verificacion: {
                    endpoint: `${req.protocol}://${req.get('host')}/api/notificaciones/diagnostico-error-404`,
                    metodo: 'GET',
                    descripcion: 'Ejecuta este endpoint para diagnosticar el problema específico'
                },
                alternativas: {
                    webpush: 'Si Firebase sigue fallando, considera usar Web Push API',
                    websocket: 'Para notificaciones en tiempo real cuando la app está abierta'
                }
            };

            return res.status(200).json({
                success: true,
                message: 'Guía para solucionar Error 404 de FCM',
                data: guia
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error generando guía',
                error: error.message
            });
        }
    }

    // ENDPOINT PÚBLICO PARA DIAGNÓSTICO SIN AUTENTICACIÓN
    async diagnosticoPublicoFCM(req, res) {
        try {
            console.log('🔍 === DIAGNÓSTICO PÚBLICO FCM ===');
            
            const admin = require('firebase-admin');
            
            // 1. Verificar Firebase
            const firebaseStatus = {
                initialized: admin.apps.length > 0,
                projectId: process.env.FIREBASE_PROJECT_ID || 'NO_CONFIGURADO',
                hasCredentials: !!(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)
            };

            console.log('📋 Estado de Firebase:');
            console.log(`   Inicializado: ${firebaseStatus.initialized}`);
            console.log(`   Project ID: ${firebaseStatus.projectId}`);
            console.log(`   Credenciales: ${firebaseStatus.hasCredentials}`);

            // 2. Probar FCM con token falso para verificar API
            let fcmStatus = { working: false, error: null };
            
            if (firebaseStatus.initialized) {
                try {
                    const messaging = admin.messaging();
                    const testToken = 'fakeTokenForAPITest123456789012345678901234567890123456789012345678901234567890';
                    
                    await messaging.send({
                        token: testToken,
                        notification: {
                            title: '🧪 Diagnóstico público',
                            body: 'Probando FCM API...'
                        }
                    });
                    
                    fcmStatus.working = true;
                    
                } catch (fcmError) {
                    fcmStatus.error = {
                        code: fcmError.code,
                        message: fcmError.message,
                        isAPIError: fcmError.message.includes('404') || fcmError.message.includes('/batch')
                    };
                    
                    // Si es error de token inválido, FCM API funciona
                    if (fcmError.code === 'messaging/invalid-registration-token' ||
                        fcmError.code === 'messaging/invalid-argument') {
                        fcmStatus.working = true;
                        fcmStatus.error.diagnosis = 'FCM_API_WORKING - Error esperado con token falso';
                    } else if (fcmError.message.includes('404')) {
                        fcmStatus.error.diagnosis = 'FCM_API_NOT_ENABLED - Error 404';
                    }
                }
            }

            // 3. Verificar tokens registrados
            const tokensInfo = await DeviceToken.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        activos: {
                            $sum: {
                                $cond: [{ $eq: ['$isActive', true] }, 1, 0]
                            }
                        },
                        plataformas: { $addToSet: '$platform' }
                    }
                }
            ]);

            const tokens = tokensInfo[0] || { total: 0, activos: 0, plataformas: [] };

            console.log(`📱 Tokens: ${tokens.total} total, ${tokens.activos} activos`);

            // 4. Resultado final
            const diagnosis = {
                timestamp: new Date().toISOString(),
                firebase: firebaseStatus,
                fcm: fcmStatus,
                tokens,
                status: firebaseStatus.initialized && fcmStatus.working ? 'OK' : 'ERROR',
                nextSteps: []
            };

            if (!firebaseStatus.initialized) {
                diagnosis.nextSteps.push('Firebase no está inicializado - verificar credenciales');
            }
            
            if (fcmStatus.error && fcmStatus.error.isAPIError) {
                diagnosis.nextSteps.push('Habilitar Firebase Cloud Messaging API en Google Cloud Console');
            }
            
            if (tokens.activos === 0) {
                diagnosis.nextSteps.push('Registrar tokens FCM de dispositivos móviles');
            }

            console.log(`🎯 Estado general: ${diagnosis.status}`);
            console.log('🔍 === FIN DIAGNÓSTICO PÚBLICO ===');

            return res.status(200).json({
                success: true,
                message: 'Diagnóstico público completado',
                data: diagnosis
            });

        } catch (error) {
            console.error('❌ Error en diagnóstico público:', error);
            return res.status(500).json({
                success: false,
                message: 'Error ejecutando diagnóstico público',
                error: error.message
            });
        }
    }

    // ENDPOINT PARA PROBAR NOTIFICACIÓN CON TOKEN ESPECÍFICO (PÚBLICO)
    async probarNotificacionToken(req, res) {
        try {
            console.log('🧪 === PRUEBA DE NOTIFICACIÓN CON TOKEN ===');
            
            const { 
                deviceToken,
                clienteDocumento = 'TEST_USER',
                titulo = '🧪 Prueba de notificación',
                mensaje = 'Esta es una notificación de prueba desde el backend'
            } = req.body;

            if (!deviceToken) {
                return res.status(400).json({
                    success: false,
                    message: 'deviceToken es requerido',
                    example: {
                        deviceToken: 'tu_token_fcm_aqui',
                        clienteDocumento: '1235467890',
                        titulo: 'Título personalizado',
                        mensaje: 'Mensaje personalizado'
                    }
                });
            }

            console.log(`🔑 Token: ${deviceToken.substring(0, 20)}...`);
            console.log(`👤 Cliente: ${clienteDocumento}`);
            console.log(`📝 Título: ${titulo}`);
            console.log(`💬 Mensaje: ${mensaje}`);

            // Registrar token temporalmente si no existe
            let tokenDoc = await DeviceToken.findOne({ deviceToken });
            if (!tokenDoc) {
                console.log('📝 Registrando token temporalmente...');
                tokenDoc = await NotificationService.registrarDeviceToken(
                    null, // clienteId
                    clienteDocumento,
                    deviceToken,
                    'android',
                    { test: true, registered: new Date().toISOString() }
                );
                console.log('✅ Token registrado');
            } else {
                console.log('📋 Token ya existe en BD');
            }

            // Enviar notificación directa
            const admin = require('firebase-admin');
            const messaging = admin.messaging();

            const message = {
                token: deviceToken,
                notification: {
                    title: titulo,
                    body: mensaje
                },
                data: {
                    type: 'test',
                    timestamp: new Date().toISOString(),
                    clienteDocumento: clienteDocumento
                },
                android: {
                    priority: 'high'
                }
            };

            console.log('🚀 Enviando notificación...');
            const result = await messaging.send(message);
            console.log(`✅ Notificación enviada: ${result}`);

            return res.status(200).json({
                success: true,
                message: 'Notificación enviada exitosamente',
                data: {
                    messageId: result,
                    deviceToken: deviceToken.substring(0, 20) + '...',
                    clienteDocumento,
                    titulo,
                    mensaje,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ Error enviando notificación:', error);
            
            let diagnosis = 'UNKNOWN_ERROR';
            let solution = [];

            if (error.message.includes('404') || error.message.includes('/batch')) {
                diagnosis = 'FCM_API_NOT_ENABLED';
                solution = [
                    'Firebase Cloud Messaging API no está habilitada',
                    'Ve a Google Cloud Console y habilítala'
                ];
            } else if (error.code === 'messaging/invalid-registration-token') {
                diagnosis = 'INVALID_TOKEN';
                solution = [
                    'El token FCM es inválido o expiró',
                    'Genera un nuevo token en tu app Android'
                ];
            } else if (error.code === 'messaging/authentication-error') {
                diagnosis = 'AUTH_ERROR';
                solution = [
                    'Error de autenticación de Firebase',
                    'Verifica las credenciales en variables de entorno'
                ];
            }

            return res.status(500).json({
                success: false,
                message: 'Error enviando notificación',
                error: {
                    code: error.code,
                    message: error.message,
                    diagnosis,
                    solution
                }
            });
        }
    }

    // OBTENER TOKENS DE CLIENTE ESPECÍFICO (PARA DEBUG)
    async obtenerTokensCliente(req, res) {
        try {
            const { clienteDocumento } = req.params;
            
            console.log(`🔍 === OBTENIENDO TOKENS PARA CLIENTE: ${clienteDocumento} ===`);
            
            // Buscar todos los tokens del cliente (activos e inactivos)
            const tokens = await DeviceToken.find({ 
                clienteDocumento: clienteDocumento 
            }).sort({ createdAt: -1 });
            
            if (tokens.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontraron tokens para cliente ${clienteDocumento}`,
                    data: { clienteDocumento, tokensFound: 0 }
                });
            }
            
            // Formatear información de tokens
            const tokensInfo = tokens.map(token => ({
                id: token._id,
                clienteDocumento: token.clienteDocumento,
                platform: token.platform,
                isActive: token.isActive,
                tokenPreview: token.deviceToken.substring(0, 30) + '...',
                tokenLength: token.deviceToken.length,
                validFormat: token.deviceToken.includes(':APA91b'),
                createdAt: token.createdAt,
                lastUsed: token.lastUsed,
                deviceInfo: token.deviceInfo
            }));
            
            const summary = {
                clienteDocumento,
                totalTokens: tokens.length,
                activeTokens: tokens.filter(t => t.isActive).length,
                inactiveTokens: tokens.filter(t => !t.isActive).length,
                platforms: [...new Set(tokens.map(t => t.platform))],
                latestToken: tokensInfo[0]
            };
            
            console.log(`📱 Encontrados ${tokens.length} tokens para ${clienteDocumento}`);
            console.log(`   - Activos: ${summary.activeTokens}`);
            console.log(`   - Inactivos: ${summary.inactiveTokens}`);
            
            return res.status(200).json({
                success: true,
                message: `Tokens encontrados para cliente ${clienteDocumento}`,
                data: {
                    summary,
                    tokens: tokensInfo
                }
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo tokens de cliente:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // DIAGNÓSTICO ESPECÍFICO DE FIREBASE EN PRODUCCIÓN
    async diagnosticoFirebaseProduccion(req, res) {
        try {
            console.log('🔍 === DIAGNÓSTICO FIREBASE PRODUCCIÓN ===');
            
            const admin = require('firebase-admin');
            
            // 1. Verificar configuración básica
            const config = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
                hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
                clientId: process.env.FIREBASE_CLIENT_ID,
                environment: process.env.NODE_ENV
            };

            console.log('📋 Configuración Firebase:');
            Object.entries(config).forEach(([key, value]) => {
                if (key === 'hasPrivateKey') {
                    console.log(`   ${key}: ${value}`);
                } else {
                    console.log(`   ${key}: ${value || 'NO_CONFIGURADO'}`);
                }
            });

            // 2. Verificar inicialización
            const isInitialized = admin.apps.length > 0;
            console.log(`🔧 Firebase inicializado: ${isInitialized}`);

            if (!isInitialized) {
                return res.status(500).json({
                    success: false,
                    message: 'Firebase no está inicializado',
                    data: { config, initialized: false }
                });
            }

            // 3. Probar FCM con token real de prueba
            const testTokens = await DeviceToken.find({ 
                isActive: true 
            }).limit(1);

            if (testTokens.length === 0) {
                return res.status(200).json({
                    success: false,
                    message: 'No hay tokens FCM para probar',
                    data: {
                        config,
                        initialized: isInitialized,
                        diagnosis: 'NO_TOKENS_AVAILABLE'
                    }
                });
            }

            const testToken = testTokens[0];
            console.log(`🧪 Probando con token: ${testToken.deviceToken.substring(0, 20)}...`);

            // 4. Intentar envío de notificación de diagnóstico
            const messaging = admin.messaging();
            
            try {
                const result = await messaging.send({
                    token: testToken.deviceToken,
                    notification: {
                        title: '🔧 Diagnóstico Producción',
                        body: 'Firebase funcionando correctamente en producción'
                    },
                    data: {
                        type: 'diagnostic_production',
                        timestamp: new Date().toISOString(),
                        environment: process.env.NODE_ENV
                    }
                });

                console.log('✅ Notificación enviada exitosamente');
                console.log(`📝 Message ID: ${result}`);

                return res.status(200).json({
                    success: true,
                    message: 'Firebase funciona correctamente en producción',
                    data: {
                        config,
                        initialized: isInitialized,
                        messageId: result,
                        tokenTested: testToken.deviceToken.substring(0, 20) + '...',
                        clienteDocumento: testToken.clienteDocumento,
                        diagnosis: 'FIREBASE_WORKING'
                    }
                });

            } catch (fcmError) {
                console.log(`❌ Error FCM: ${fcmError.code}`);
                console.log(`📝 Mensaje: ${fcmError.message}`);
                
                let diagnosis = 'UNKNOWN_FCM_ERROR';
                let solution = [];
                
                if (fcmError.message.includes('404') || fcmError.message.includes('/batch')) {
                    diagnosis = 'FCM_API_NOT_ENABLED';
                    solution = [
                        'Firebase Cloud Messaging API no está habilitada',
                        `Ve a: https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=${config.projectId}`,
                        'Haz click en HABILITAR',
                        'Espera 5-10 minutos para propagación'
                    ];
                } else if (fcmError.code === 'messaging/invalid-registration-token') {
                    diagnosis = 'INVALID_TOKEN';
                    solution = [
                        'Token FCM inválido o expirado',
                        'Regenerar token en la app Android'
                    ];
                } else if (fcmError.code === 'messaging/authentication-error') {
                    diagnosis = 'AUTH_ERROR';
                    solution = [
                        'Error de autenticación',
                        'Verificar credenciales de Firebase'
                    ];
                }

                return res.status(200).json({
                    success: false,
                    message: 'Error de Firebase detectado',
                    data: {
                        config,
                        initialized: isInitialized,
                        error: {
                            code: fcmError.code,
                            message: fcmError.message
                        },
                        diagnosis,
                        solution,
                        tokenTested: testToken.deviceToken.substring(0, 20) + '...'
                    }
                });
            }

        } catch (error) {
            console.error('❌ Error en diagnóstico:', error);
            return res.status(500).json({
                success: false,
                message: 'Error ejecutando diagnóstico de Firebase',
                error: error.message
            });
        }
    }
}

module.exports = new NotificationController();
