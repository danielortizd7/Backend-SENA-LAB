# 📱 COMANDOS DE TESTING PARA EQUIPO ANDROID

## 🚀 **TESTING CONTRA SERVIDOR DE PRODUCCIÓN**

Una vez que el backend esté desplegado en Render, usa estos comandos para verificar que todo funciona:

---

## 🔍 **VERIFICACIÓN BÁSICA**

### **1. Verificar que el servidor está activo**
```bash
curl https://tu-app.onrender.com/test-firebase
```
**Esperado:** `✅ Firebase conectado correctamente`

### **2. Verificar configuración Firebase**
```bash
curl https://tu-app.onrender.com/api/notificaciones-test/firebase-config
```
**Esperado:** JSON con configuración Firebase

---

## 📝 **REGISTRO DE TOKEN FCM**

### **Registro Básico (Sin Autenticación)**
```bash
curl -X POST https://tu-app.onrender.com/api/notificaciones-test/register-device \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "AQUI_VA_TU_TOKEN_FCM_REAL",
    "platform": "android",
    "clienteDocumento": "123456789",
    "deviceInfo": {
      "deviceId": "device123",
      "deviceName": "Samsung Galaxy S21",
      "osVersion": "Android 12",
      "appBuild": "1.0.0"
    }
  }'
```

### **Registro con Autenticación (Producción)**
```bash
curl -X POST https://tu-app.onrender.com/api/notificaciones/register-device \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -d '{
    "deviceToken": "AQUI_VA_TU_TOKEN_FCM_REAL",
    "platform": "android",
    "clienteDocumento": "123456789",
    "deviceInfo": {
      "deviceId": "device123",
      "deviceName": "Samsung Galaxy S21",
      "osVersion": "Android 12",
      "appBuild": "1.0.0"
    }
  }'
```

---

## 🔔 **ENVÍO DE NOTIFICACIONES DE PRUEBA**

### **Notificación Simple**
```bash
curl -X POST https://tu-app.onrender.com/api/notificaciones-test/local \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "AQUI_VA_TU_TOKEN_FCM_REAL",
    "title": "Prueba desde Producción",
    "body": "Esta notificación viene del servidor de producción",
    "data": {
      "tipo": "test",
      "timestamp": "2024-01-20T10:00:00Z"
    }
  }'
```

### **Notificación con Datos Personalizados**
```bash
curl -X POST https://tu-app.onrender.com/api/notificaciones-test/local \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "AQUI_VA_TU_TOKEN_FCM_REAL",
    "title": "Nueva Auditoría Asignada",
    "body": "Se te ha asignado una nueva auditoría #12345",
    "data": {
      "tipo": "nueva_auditoria",
      "auditoriaId": "12345",
      "prioridad": "alta",
      "fechaVencimiento": "2024-01-25T23:59:59Z"
    },
    "android": {
      "priority": "high",
      "notification": {
        "icon": "ic_notification",
        "color": "#FF6B35",
        "sound": "default",
        "channel_id": "auditorias_channel"
      }
    }
  }'
```

---

## 📊 **VERIFICACIÓN DE ESTADO**

### **Estado General del Sistema**
```bash
curl https://tu-app.onrender.com/api/notificaciones/status
```

### **Verificar Token Específico**
```bash
curl "https://tu-app.onrender.com/api/notificaciones-test/probar-token?token=AQUI_VA_TU_TOKEN_FCM_REAL"
```

---

## 🔧 **TROUBLESHOOTING PARA ANDROID**

### **Si no recibes notificaciones, verifica:**

1. **Token FCM Válido:**
```bash
# El token debe ser similar a esto:
# fGhI2jKlMnOpQrStUvWxYz123456789AbCdEfGhIjKlMnOpQrStUvWxYz
```

2. **Configuración AndroidManifest.xml:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
```

3. **Servicio FCM Implementado:**
```kotlin
class MyFirebaseMessagingService : FirebaseMessagingService() {
    
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d("FCM", "Mensaje recibido: ${remoteMessage.data}")
        
        // Crear notificación local
        showNotification(
            remoteMessage.notification?.title ?: "Sin título",
            remoteMessage.notification?.body ?: "Sin mensaje"
        )
    }
    
    override fun onNewToken(token: String) {
        Log.d("FCM", "Nuevo token: $token")
        // Enviar token al servidor
        sendTokenToServer(token)
    }
}
```

4. **Canal de Notificaciones (Android 8+):**
```kotlin
private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val channel = NotificationChannel(
            "auditorias_channel",
            "Auditorías",
            NotificationManager.IMPORTANCE_HIGH
        )
        channel.description = "Notificaciones de auditorías"
        
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.createNotificationChannel(channel)
    }
}
```

---

## 📱 **TESTING EN DIFERENTES ESCENARIOS**

### **App en Primer Plano:**
- La notificación debe aparecer dentro de la app
- `onMessageReceived()` se ejecuta

### **App en Segundo Plano:**
- La notificación aparece en la bandeja del sistema
- Al tocar la notificación, la app se abre

### **App Cerrada:**
- La notificación aparece en la bandeja del sistema
- Al tocar la notificación, la app se inicia

---

## 🚨 **ERRORES COMUNES Y SOLUCIONES**

### **Error: "Registration token not registered"**
```bash
# El token FCM ha expirado o es inválido
# Solución: Generar nuevo token en la app
```

### **Error: "Invalid key"**
```bash
# Problema con las credenciales Firebase
# Verificar que google-services.json corresponde al proyecto correcto
```

### **Error: "Sender ID mismatch"**
```bash
# El sender ID no coincide
# Verificar que el Project ID de Firebase es correcto
```

---

## 📋 **CHECKLIST FINAL PARA ANDROID**

- [ ] Actualizar URL del backend a producción
- [ ] Verificar google-services.json es el correcto
- [ ] Implementar FirebaseMessagingService
- [ ] Crear canal de notificaciones
- [ ] Manejar permisos de notificaciones
- [ ] Probar en dispositivo físico (no emulador)
- [ ] Verificar que Firebase Console muestra el dispositivo registrado

---

## 🎯 **RESULTADO ESPERADO**

Una vez configurado correctamente, deberías ver:

1. ✅ Token FCM registrado exitosamente en el backend
2. ✅ Notificaciones llegando al dispositivo
3. ✅ App respondens a toques en notificaciones
4. ✅ Datos personalizados recibidos correctamente

**¡El backend está funcionando perfectamente! Ahora solo falta ajustar la configuración del lado Android. 🚀**
