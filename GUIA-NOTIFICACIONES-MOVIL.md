# Configuración de Notificaciones Push - AquaLab SENA

## 📱 Configuración Android

### 1. Estructura del Mensaje FCM que Recibe la App

```json
{
  "data": {
    "title": "Cotización Aceptada",
    "body": "La cotización de su muestra PF250708007 ha sido aceptada.",
    "estadoAnterior": "En Cotizacion",
    "estadoNuevo": "Aceptada",
    "fechaCambio": "2025-07-08T03:21:20.273Z",
    "tipo": "cambio_estado",
    "clickAction": "OPEN_MUESTRA_DETAIL",
    "id_muestra": "PF250708007",
    "priority": "high"
  }
}
```

### 2. Configuración del Canal de Notificaciones (Android 8+)

```kotlin
private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val channel = NotificationChannel(
            "aqualab_updates",
            "AquaLab Actualizaciones",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Notificaciones de cambios de estado de muestras"
            enableLights(true)
            enableVibration(true)
            setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), null)
        }
        
        val notificationManager: NotificationManager =
            getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.createNotificationChannel(channel)
    }
}
```

### 3. FirebaseMessagingService

```kotlin
class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        // Ahora los datos vienen solo en 'data', incluyendo title y body
        val data = remoteMessage.data
        if (data.isNotEmpty()) {
            val title = data["title"] ?: "AquaLab"
            val body = data["body"] ?: "Nueva notificación"
            
            // Mostrar notificación y guardar en base de datos local
            showNotification(title, body, data)
            saveNotificationToLocalDB(title, body, data)
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Enviar token al backend
        sendTokenToBackend(token)
    }

    private fun sendTokenToBackend(token: String) {
        // Aquí implementas el envío al backend
        val clienteDocumento = getClienteDocumento() // Método para obtener documento del cliente
        
        // POST /api/notificaciones/registrar-token
        val requestBody = mapOf(
            "token" to token,
            "clienteDocumento" to clienteDocumento,
            "platform" to "android"
        )
        
        // Llamar a tu API
    }

    private fun showNotification(title: String, body: String, data: Map<String, String>) {
        val intent = createIntentFromData(data)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, "aqualab_updates")
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(R.drawable.ic_notification)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .build()

        val notificationManager = NotificationManagerCompat.from(this)
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun saveNotificationToLocalDB(title: String, body: String, data: Map<String, String>) {
        // Aquí implementas el guardado en tu base de datos local (Room, SQLite, etc.)
        // Ejemplo conceptual:
        try {
            val notification = LocalNotification(
                title = title,
                body = body,
                tipo = data["tipo"] ?: "",
                id_muestra = data["id_muestra"] ?: "",
                fechaCambio = data["fechaCambio"] ?: "",
                estadoAnterior = data["estadoAnterior"] ?: "",
                estadoNuevo = data["estadoNuevo"] ?: "",
                clickAction = data["clickAction"] ?: "",
                timestamp = System.currentTimeMillis(),
                isRead = false
            )
            
            // Guardar en base de datos local
            // notificationRepository.save(notification)
            
        } catch (e: Exception) {
            Log.e("FCM", "Error guardando notificación localmente", e)
        }
    }

    private fun createIntentFromData(data: Map<String, String>): Intent {
        val intent = Intent(this, MainActivity::class.java)
        
        when (data["clickAction"]) {
            "OPEN_MUESTRA_DETAIL" -> {
                intent.putExtra("screen", "muestra_detail")
                intent.putExtra("id_muestra", data["id_muestra"])
            }
        }
        
        return intent
    }
}
```

### 4. Permisos en AndroidManifest.xml

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />

<service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

## 🔄 Endpoints del Backend

### Registrar Token FCM
```
POST https://backend-registro-muestras.onrender.com/api/notificaciones/registrar-token

Body:
{
  "token": "TOKEN_FCM_DEL_DISPOSITIVO",
  "clienteDocumento": "DOCUMENTO_DEL_CLIENTE",
  "platform": "android"
}
```

### Prueba de Notificación
```
POST https://backend-registro-muestras.onrender.com/api/notificaciones-test/local

Body:
{
  "clienteDocumento": "1235467890",
  "mensaje": "Mensaje de prueba"
}
```

## 📊 Estados de Muestra y Notificaciones

| Estado | Título | Acción Sugerida |
|--------|--------|----------------|
| En Cotización | Cotización en Proceso | Ver detalles |
| Aceptada | Cotización Aceptada | Ver muestra |
| Recibida | Muestra Recibida | Ver estado |
| En análisis | Análisis en Proceso | Ver progreso |
| Finalizada | Resultados Disponibles | Ver resultados |
| Rechazada | Muestra Rechazada | Ver motivo |

## 🧪 Cómo Probar

1. **Registrar token**: La app debe enviar el token FCM al backend
2. **Cerrar app**: Cerrar completamente la aplicación
3. **Generar notificación**: Cambiar estado de una muestra en el panel web
4. **Verificar**: La notificación debe aparecer en la barra de notificaciones
5. **Interacción**: Al tocar debe abrir la app en la pantalla correcta

## 🔧 Troubleshooting

- **No llegan notificaciones**: Verificar que el token esté registrado correctamente
- **App cerrada no recibe**: Asegurar que el campo `notification` esté presente
- **Android 8+**: Verificar que el canal de notificaciones esté creado
- **Token inválido**: Implementar renovación automática de tokens

## 📱 Token de Prueba Actual
```
c3lMci17RlWk2zuXAMHx8I:APA91bH5dKZgJVWJKA5uO9gQRgJ4Y6X1c9_wYUoGbQX1yNxKKRrqUPe5Kd_1sOjNGWZx2L3M7nH8F
```

Cliente de prueba: `1235467890`
