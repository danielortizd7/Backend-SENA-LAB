# 📱 GUÍA COMPLETA: SOLUCIONAR NOTIFICACIONES PUSH ANDROID

## 🎯 SITUACIÓN ACTUAL

✅ **Backend funcionando perfectamente**  
✅ **Firebase configurado correctamente**  
✅ **Token FCM válido y registrado**  
✅ **Notificaciones enviadas sin errores del servidor**  
❌ **Notificaciones NO llegan al dispositivo Android**

## 🔍 DIAGNÓSTICO

**El problema está en la configuración del lado Android**, no en el backend.

---

## 🚀 SOLUCIÓN PASO A PASO

### 📌 PASO 1: VERIFICAR google-services.json

1. Abre tu proyecto Android en Android Studio
2. Ve a `app/google-services.json`
3. Verifica que contenga: `"project_id": "aqualab-83795"`
4. Si no es correcto, descarga el archivo desde Firebase Console
5. Reemplaza el archivo y rebuilda el proyecto

### 📌 PASO 2: VERIFICAR PERMISOS EN MANIFEST

Asegúrate que `AndroidManifest.xml` tenga:

```xml
<!-- Permisos para notificaciones -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
```

### 📌 PASO 3: IMPLEMENTAR FirebaseMessagingService

Crea la clase `MyFirebaseMessagingService.java`:

```java
package tu.package.name;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "FCMService";
    private static final String CHANNEL_ID = "default_channel";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "Mensaje recibido de: " + remoteMessage.getFrom());

        // Verificar si el mensaje tiene notificación
        if (remoteMessage.getNotification() != null) {
            Log.d(TAG, "Titulo: " + remoteMessage.getNotification().getTitle());
            Log.d(TAG, "Cuerpo: " + remoteMessage.getNotification().getBody());
            showNotification(
                remoteMessage.getNotification().getTitle(),
                remoteMessage.getNotification().getBody()
            );
        }

        // Verificar si el mensaje tiene datos
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Datos del mensaje: " + remoteMessage.getData());
        }
    }

    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "Token actualizado: " + token);
        // Enviar token al backend
        sendTokenToServer(token);
    }

    private void showNotification(String title, String body) {
        NotificationManager notificationManager = 
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification) // Asegúrate de tener este ícono
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setDefaults(NotificationCompat.DEFAULT_ALL);

        notificationManager.notify(1, builder.build());
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Canal de Notificaciones",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Canal para notificaciones push");
            channel.enableLights(true);
            channel.enableVibration(true);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }

    private void sendTokenToServer(String token) {
        // Aquí implementa el envío del token al backend
        Log.d(TAG, "Enviando token al servidor: " + token);
    }
}
```

### 📌 PASO 4: REGISTRAR SERVICIO EN MANIFEST

Agrega en `AndroidManifest.xml` dentro de `<application>`:

```xml
<service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

### 📌 PASO 5: VERIFICAR PERMISOS EN DISPOSITIVO

1. Ve a **Configuración > Apps > Tu App > Notificaciones**
2. Asegúrate que las notificaciones están **HABILITADAS**
3. Verifica que todas las categorías estén permitidas

### 📌 PASO 6: AGREGAR LOGS DE DEBUGGING

En tu `MainActivity`, agrega:

```java
FirebaseMessaging.getInstance().getToken()
    .addOnCompleteListener(new OnCompleteListener<String>() {
        @Override
        public void onComplete(@NonNull Task<String> task) {
            if (!task.isSuccessful()) {
                Log.w("FCM", "Error obteniendo token", task.getException());
                return;
            }
            String token = task.getResult();
            Log.d("FCM_TOKEN", "Token FCM: " + token);
        }
    });
```

### 📌 PASO 7: COMANDOS DE VERIFICACIÓN

Para verificar logs en Android Studio:
1. Abre **Logcat**
2. Filtra por **"FCM"** o **"FirebaseMessaging"**
3. Envía una notificación de prueba
4. Verifica que aparezcan los logs

---

## 🔧 COMANDOS DE TERMINAL PARA DEBUGGING

```bash
# Ver logs específicos de FCM
adb logcat | grep -i fcm

# Ver logs de Firebase
adb logcat | grep -i firebase

# Limpiar logs y ver solo nuevos
adb logcat -c && adb logcat | grep -i fcm
```

---

## 🎯 PRUEBA FINAL

1. Implementa todos los pasos anteriores
2. Rebuilda y reinstala la app
3. Ejecuta este comando para enviar otra notificación:
   ```bash
   node prueba-token-directo.js
   ```
4. Verifica los logs en Android Studio

---

## ✅ CONFIRMACIÓN DE ÉXITO

Cuando funcione correctamente, verás:
- **Logs en Logcat**: "Mensaje recibido de: ..."
- **Notificación visible** en la barra de estado
- **Sonido/vibración** según configuración

---

## 📞 SI SIGUE SIN FUNCIONAR

1. Prueba en un **dispositivo físico diferente**
2. Verifica que el dispositivo tenga **Google Play Services actualizado**
3. Asegúrate de que la app **no esté en modo de ahorro de batería**
4. Revisa que **no haya restricciones de background** para la app

---

## 🏁 RESULTADO ESPERADO

Después de implementar estos cambios, las notificaciones push llegarán inmediatamente al dispositivo Android. **El backend ya está 100% funcional y enviando correctamente**.

---

## 📊 ESTADO DEL PROYECTO

| Componente | Estado |
|-----------|--------|
| Backend | ✅ Funcionando |
| Firebase | ✅ Configurado |
| API FCM | ✅ Habilitada |
| Tokens FCM | ✅ Válidos |
| Envío Servidor | ✅ Exitoso |
| **Android App** | ❌ **Requiere configuración** |

---

**¡El problema está solo en la configuración Android! Una vez implementados estos cambios, todo funcionará perfectamente.**
