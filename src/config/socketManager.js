const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const NotificationService = require('../app/notificaciones/services/notificationService');

class SocketManager {
    constructor() {
        this.io = null;
        this.connectedClients = new Map(); // clienteId -> Set of socketIds
    }

    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "*",
                methods: ["GET", "POST"],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        // Configurar NotificationService con Socket.IO
        NotificationService.setSocketIO(this.io);

        // Middleware de autenticación
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
                
                if (!token) {
                    return next(new Error('Token de autenticación requerido'));
                }

                // Verificar JWT
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
                
                // Solo permitir clientes (no administradores)
                if (decoded.rol !== 'cliente') {
                    return next(new Error('Solo clientes pueden conectarse via WebSocket'));
                }

                socket.clienteId = decoded._id || decoded.id;
                socket.clienteDocumento = decoded.documento;
                socket.clienteNombre = decoded.nombre;

                next();
            } catch (error) {
                console.error('Error en autenticación WebSocket:', error.message);
                next(new Error('Token de autenticación inválido'));
            }
        });

        // Eventos de conexión
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });

        console.log('Socket.IO inicializado exitosamente');
        return this.io;
    }

    handleConnection(socket) {
        const clienteId = socket.clienteId;
        const roomName = `cliente_${clienteId}`;

        console.log(`Cliente conectado: ${socket.clienteNombre} (${socket.clienteDocumento}) - Socket: ${socket.id}`);

        // Unirse a la sala del cliente
        socket.join(roomName);

        // Agregar cliente a la lista de conectados
        if (!this.connectedClients.has(clienteId)) {
            this.connectedClients.set(clienteId, new Set());
        }
        this.connectedClients.get(clienteId).add(socket.id);

        // Enviar notificaciones pendientes al conectarse
        this.enviarNotificacionesPendientes(clienteId, socket);

        // Eventos del socket
        this.setupSocketEvents(socket);

        // Manejar desconexión
        socket.on('disconnect', (reason) => {
            console.log(`Cliente desconectado: ${socket.clienteNombre} - Razón: ${reason}`);
            
            // Remover de la lista de conectados
            if (this.connectedClients.has(clienteId)) {
                this.connectedClients.get(clienteId).delete(socket.id);
                
                // Si no hay más sockets para este cliente, remover completamente
                if (this.connectedClients.get(clienteId).size === 0) {
                    this.connectedClients.delete(clienteId);
                }
            }
        });
    }

    setupSocketEvents(socket) {
        const clienteId = socket.clienteId;

        // Evento: Cliente confirma recepción de notificación
        socket.on('notification_received', async (data) => {
            try {
                const { notificationId } = data;
                if (notificationId) {
                    console.log(`Notificación ${notificationId} recibida por cliente ${clienteId}`);
                    
                    // Aquí podrías actualizar el estado de la notificación
                    // await NotificationService.marcarComoEntregada(notificationId);
                }
            } catch (error) {
                console.error('Error procesando confirmación de notificación:', error);
            }
        });

        // Evento: Cliente marca notificación como leída
        socket.on('mark_as_read', async (data) => {
            try {
                const { notificationId } = data;
                await NotificationService.marcarComoLeida(notificationId, clienteId);
                
                socket.emit('notification_read_confirmed', { 
                    notificationId,
                    success: true 
                });
            } catch (error) {
                console.error('Error marcando notificación como leída:', error);
                socket.emit('notification_read_confirmed', { 
                    notificationId: data.notificationId,
                    success: false,
                    error: error.message 
                });
            }
        });

        // Evento: Cliente solicita resumen de notificaciones
        socket.on('get_notifications_summary', async () => {
            try {
                const resumen = await NotificationService.obtenerResumenNoLeidas(clienteId);
                socket.emit('notifications_summary', resumen);
            } catch (error) {
                console.error('Error obteniendo resumen de notificaciones:', error);
                socket.emit('notifications_summary', { error: error.message });
            }
        });

        // Evento: Ping/Pong para mantener conexión
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
        });

        // Evento: Cliente solicita estado de conexión
        socket.on('connection_status', () => {
            socket.emit('connection_status', {
                connected: true,
                clienteId: clienteId,
                roomName: `cliente_${clienteId}`,
                timestamp: Date.now()
            });
        });
    }

    // Enviar notificaciones pendientes al cliente que se conecta
    async enviarNotificacionesPendientes(clienteId, socket) {
        try {
            const notificacionesPendientes = await NotificationService.obtenerNotificacionesCliente(clienteId, 5);
            
            if (notificacionesPendientes.length > 0) {
                socket.emit('pending_notifications', {
                    count: notificacionesPendientes.length,
                    notifications: notificacionesPendientes
                });
            }
        } catch (error) {
            console.error('Error enviando notificaciones pendientes:', error);
        }
    }

    // Método para enviar notificación a cliente específico
    async notificarCliente(clienteId, notificacion) {
        try {
            const roomName = `cliente_${clienteId}`;
            
            if (this.io) {
                this.io.to(roomName).emit('notification', notificacion);
                console.log(`Notificación enviada via WebSocket a cliente ${clienteId}`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error enviando notificación via WebSocket:', error);
            return false;
        }
    }

    // Obtener estadísticas de conexiones
    getConnectionStats() {
        return {
            totalClientes: this.connectedClients.size,
            totalSockets: Array.from(this.connectedClients.values())
                              .reduce((total, sockets) => total + sockets.size, 0),
            clientesConectados: Array.from(this.connectedClients.keys())
        };
    }

    // Verificar si un cliente está conectado
    isClienteConnected(clienteId) {
        return this.connectedClients.has(clienteId) && 
               this.connectedClients.get(clienteId).size > 0;
    }

    // Desconectar cliente específico
    disconnectCliente(clienteId, reason = 'Server disconnect') {
        const roomName = `cliente_${clienteId}`;
        
        if (this.io) {
            this.io.to(roomName).disconnectSockets();
            this.connectedClients.delete(clienteId);
            console.log(`Cliente ${clienteId} desconectado: ${reason}`);
        }
    }

    // Broadcast a todos los clientes conectados
    broadcastToAll(event, data) {
        if (this.io) {
            this.io.emit(event, data);
            console.log(`Broadcast enviado a todos los clientes: ${event}`);
        }
    }
}

module.exports = new SocketManager();
