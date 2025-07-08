# Configuración de Notificaciones Push para App Cerrada

## Características Implementadas en el Backend

El backend ya está configurado para enviar notificaciones push optimizadas que aparecen incluso cuando la app está cerrada. Las configuraciones incluyen:

### 🔧 Configuración FCM Aplicada:

1. **Prioridad Alta**: `priority: 'high'`
2. **Canal Específico**: `channel_id: 'sena_lab_channel'`
3. **Sonido por Defecto**: `default_sound: true`
4. **Vibración por Defecto**: `default_vibrate_timings: true`
5. **Luces por Defecto**: `default_light_settings: true`
6. **Visible en Lock Screen**: `visibility: 'public'`
7. **No Agrupación**: `tag` único por notificación
8. **Color Personalizado**: `color: '#0066CC'`
9. **Icono Personalizado**: `icon: 'ic_notification'`

## 📱 Configuración Requerida en Android

### 1. Canal de Notificaciones (NotificationChannel)

```java
// En tu aplicación Android, crea el canal de notificaciones:
private void createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        NotificationChannel channel = new NotificationChannel(
            "sena_lab_channel",
            "SENA Lab Notifications",
            NotificationManager.IMPORTANCE_HIGH
        );
        
        channel.setDescription("Notificaciones del laboratorio SENA");
        channel.enableLights(true);
        channel.setLightColor(Color.BLUE);
        channel.enableVibration(true);
        channel.setShowBadge(true);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        
        NotificationManager notificationManager = getSystemService(NotificationManager.class);
        notificationManager.createNotificationChannel(channel);
    }
}
```

### 2. Manejo de Datos FCM

```java
// En tu FirebaseMessagingService:
@Override
public void onMessageReceived(RemoteMessage remoteMessage) {
    super.onMessageReceived(remoteMessage);
    
    // Extraer datos específicos del backend
    String estadoAnterior = remoteMessage.getData().get("estadoAnterior");
    String estadoNuevo = remoteMessage.getData().get("estadoNuevo");
    String idMuestra = remoteMessage.getData().get("id_muestra");
    String tipo = remoteMessage.getData().get("tipo");
    String clickAction = remoteMessage.getData().get("clickAction");
    
    // Obtener título y cuerpo de la notificación
    String title = remoteMessage.getNotification() != null ? 
        remoteMessage.getNotification().getTitle() : "SENA Lab";
    String body = remoteMessage.getNotification() != null ? 
        remoteMessage.getNotification().getBody() : "Nueva notificación";
    
    // Crear notificación personalizada
    createCustomNotification(title, body, idMuestra, clickAction);
}
```

### 3. Notificación Personalizada

```java
private void createCustomNotification(String title, String body, String idMuestra, String clickAction) {
    // Intent para abrir la app en la pantalla correcta
    Intent intent;
    
    if ("OPEN_MUESTRA_DETAIL".equals(clickAction)) {
        intent = new Intent(this, MuestraDetailActivity.class);
        intent.putExtra("id_muestra", idMuestra);
    } else {
        intent = new Intent(this, MainActivity.class);
    }
    
    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    
    PendingIntent pendingIntent = PendingIntent.getActivity(
        this, 
        (int) System.currentTimeMillis(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
    );
    
    NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, "sena_lab_channel")
        .setSmallIcon(R.drawable.ic_notification) // Tu icono personalizado
        .setContentTitle(title)
        .setContentText(body)
        .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setAutoCancel(true)
        .setContentIntent(pendingIntent)
        .setColor(ContextCompat.getColor(this, R.color.primary_blue))
        .setDefaults(Notification.DEFAULT_ALL);
    
    NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
    notificationManager.notify((int) System.currentTimeMillis(), notificationBuilder.build());
}
```

### 4. Permisos en AndroidManifest.xml

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<!-- Para Android 13+ -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Service para FCM -->
<service
    android:name=".fcm.MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

### 5. Inicialización en Application

```java
public class MyApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "sena_lab_channel",
                "SENA Lab Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            
            channel.setDescription("Notificaciones del laboratorio SENA");
            channel.enableLights(true);
            channel.setLightColor(Color.BLUE);
            channel.enableVibration(true);
            channel.setShowBadge(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }
}
```

### 6. Clase FirebaseMessagingService Completa

```java
public class MyFirebaseMessagingService extends FirebaseMessagingService {

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        Log.d("FCM", "Mensaje recibido de: " + remoteMessage.getFrom());
        
        // Verificar si el mensaje tiene notification payload
        if (remoteMessage.getNotification() != null) {
            Log.d("FCM", "Notification Body: " + remoteMessage.getNotification().getBody());
        }
        
        // Extraer datos específicos del backend
        String estadoAnterior = remoteMessage.getData().get("estadoAnterior");
        String estadoNuevo = remoteMessage.getData().get("estadoNuevo");
        String idMuestra = remoteMessage.getData().get("id_muestra");
        String tipo = remoteMessage.getData().get("tipo");
        String clickAction = remoteMessage.getData().get("clickAction");
        
        // Obtener título y cuerpo de la notificación
        String title = remoteMessage.getNotification() != null ? 
            remoteMessage.getNotification().getTitle() : "SENA Lab";
        String body = remoteMessage.getNotification() != null ? 
            remoteMessage.getNotification().getBody() : "Nueva notificación";
        
        // Log de datos recibidos
        Log.d("FCM", "Estado anterior: " + estadoAnterior);
        Log.d("FCM", "Estado nuevo: " + estadoNuevo);
        Log.d("FCM", "ID Muestra: " + idMuestra);
        
        // Crear notificación personalizada
        createCustomNotification(title, body, idMuestra, clickAction);
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        Log.d("FCM", "Refreshed token: " + token);
        
        // Enviar el token al servidor
        sendTokenToServer(token);
    }
    
    private void sendTokenToServer(String token) {
        // Aquí implementas el envío del token a tu backend
        // Por ejemplo, usando Retrofit o tu método preferido
        Log.d("FCM", "Enviando token al servidor: " + token);
        
        // Ejemplo con SharedPreferences para obtener el documento del cliente
        SharedPreferences prefs = getSharedPreferences("user_prefs", MODE_PRIVATE);
        String clienteDocumento = prefs.getString("cliente_documento", "");
        
        if (!clienteDocumento.isEmpty()) {
            // Llamar a tu API para registrar el token
            // registrarTokenFCM(token, clienteDocumento);
        }
    }

    private void createCustomNotification(String title, String body, String idMuestra, String clickAction) {
        // Intent para abrir la app en la pantalla correcta
        Intent intent;
        
        if ("OPEN_MUESTRA_DETAIL".equals(clickAction)) {
            intent = new Intent(this, MuestraDetailActivity.class);
            intent.putExtra("id_muestra", idMuestra);
        } else {
            intent = new Intent(this, MainActivity.class);
        }
        
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            (int) System.currentTimeMillis(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, "sena_lab_channel")
            .setSmallIcon(R.drawable.ic_notification) // Tu icono personalizado
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setColor(ContextCompat.getColor(this, R.color.primary_blue))
            .setDefaults(Notification.DEFAULT_ALL)
            .setWhen(System.currentTimeMillis());
        
        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
        notificationManager.notify((int) System.currentTimeMillis(), notificationBuilder.build());
    }
}
```

### 7. Registro del Token FCM

```java
// En tu MainActivity o donde manejes la autenticación:
private void registerFCMToken() {
    FirebaseMessaging.getInstance().getToken()
        .addOnCompleteListener(new OnCompleteListener<String>() {
            @Override
            public void onComplete(@NonNull Task<String> task) {
                if (!task.isSuccessful()) {
                    Log.w("FCM", "Fetching FCM registration token failed", task.getException());
                    return;
                }

                // Get new FCM registration token
                String token = task.getResult();
                Log.d("FCM", "FCM Registration Token: " + token);
                
                // Obtener documento del cliente logueado
                SharedPreferences prefs = getSharedPreferences("user_prefs", MODE_PRIVATE);
                String clienteDocumento = prefs.getString("cliente_documento", "");
                
                if (!clienteDocumento.isEmpty()) {
                    // Enviar al backend
                    sendTokenToBackend(token, clienteDocumento);
                }
            }
        });
}

private void sendTokenToBackend(String token, String clienteDocumento) {
    // Implementar llamada HTTP a tu backend
    // POST https://backend-registro-muestras.onrender.com/api/notificaciones/registrar-token
    /*
    {
        "token": token,
        "clienteDocumento": clienteDocumento,
        "platform": "android"
    }
    */
}
```

## 🧪 Pruebas

### Endpoint de Prueba:
```
POST https://backend-registro-muestras.onrender.com/api/notificaciones/probar-notificacion-app-cerrada

Body:
{
    "clienteDocumento": "1235467890",
    "mensaje": "Mensaje de prueba para app cerrada"
}
```

### Script de Prueba Local:
```bash
node probar-notificacion-app-cerrada.js
```

## ✅ Verificación de Funcionamiento

1. **App Abierta**: ✅ Notificación aparece en primer plano
2. **App en Background**: ✅ Notificación aparece en barra de estado
3. **App Cerrada**: ✅ Notificación aparece y puede abrir la app
4. **Pantalla Bloqueada**: ✅ Notificación visible en lock screen
5. **Modo Silencioso**: ✅ Notificación visual aparece (sin sonido)

## 📊 Estados que Envían Notificaciones

- ✅ **"En Cotización"** → "💼 Cotización en Proceso"
- ✅ **"Aceptada"** → "✅ Cotización Aceptada"
- ✅ **"Recibida"** → "📦 Muestra Recibida"
- ✅ **"En análisis"** → "🔬 Análisis en Proceso"
- ✅ **"Finalizada"** → "✅ Resultados Disponibles"
- ✅ **"Rechazada"** → "❌ Muestra Rechazada"

¡El sistema está completamente configurado para notificaciones push robustas!
