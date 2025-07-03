# 🚀 GUÍA DE DESPLIEGUE EN RENDER - Sistema de Notificaciones Push

## ✅ **VALIDACIÓN COMPLETADA - SISTEMA LISTO PARA PRODUCCIÓN**

Tu sistema ha pasado todas las validaciones y está completamente preparado para desplegar en producción.

---

## 📋 **PASO A PASO - DESPLIEGUE EN RENDER**

### **1. Preparar Repositorio**

```bash
# Asegúrate de que todos los cambios estén guardados
git add .
git commit -m "Backend listo para producción - Sistema de notificaciones push completo"
git push origin main
```

### **2. Crear Servicio en Render**

1. Ve a [render.com](https://render.com)
2. Haz clic en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Configura el servicio:
   - **Name:** `backend-sena-lab-notifications`
   - **Region:** `Oregon (US West)`
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`

### **3. Configurar Variables de Entorno**

En la sección **"Environment"** de Render, agrega estas variables:

```env
NODE_ENV=production
PORT=10000

# MongoDB
MONGODB_URI=mongodb+srv://tu-usuario:tu-password@cluster.mongodb.net/tu-database

# JWT
JWT_SECRET=tu-jwt-secret-de-al-menos-32-caracteres

# Firebase - Usar las mismas que tienes funcionando localmente
FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_PRIVATE_KEY_AQUI\n-----END PRIVATE KEY-----\n"
FIREBASE_PRIVATE_KEY_ID=tu-private-key-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=tu-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40tu-proyecto.iam.gserviceaccount.com

# CORS para producción
ALLOWED_ORIGINS=https://tu-app-frontend.com,https://www.tu-app-frontend.com
```

### **4. Plan Recomendado**

- **Starter Plan ($7/mes):** Perfecto para comenzar
- **Incluye:** 
  - 512 MB RAM
  - 0.1 CPU
  - 100 GB ancho de banda
  - SSL automático

---

## 🔍 **VERIFICACIÓN POST-DESPLIEGUE**

Una vez desplegado, verifica que todo funciona:

### **1. Estado del Servicio**
```bash
curl https://tu-app.onrender.com/test-firebase
```
**Esperado:** `✅ Firebase conectado correctamente`

### **2. Registro de Token FCM**
```bash
curl -X POST https://tu-app.onrender.com/api/notificaciones-test/register-device \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "test_token_123",
    "platform": "android",
    "clienteDocumento": "123456789",
    "deviceInfo": {
      "deviceId": "device123",
      "deviceName": "Samsung Galaxy",
      "osVersion": "Android 12",
      "appBuild": "1.0.0"
    }
  }'
```

### **3. Estado General**
```bash
curl https://tu-app.onrender.com/api/notificaciones/status
```

---

## 📱 **CONFIGURACIÓN PARA APP ANDROID**

Tu URL de producción será: `https://tu-app.onrender.com`

### **Endpoints Disponibles para la App:**

```javascript
// Registro de token FCM (público)
POST https://tu-app.onrender.com/api/notificaciones-test/register-device

// Con autenticación
POST https://tu-app.onrender.com/api/notificaciones/register-device
GET  https://tu-app.onrender.com/api/notificaciones/status
POST https://tu-app.onrender.com/api/notificaciones/test
```

### **Ejemplo de Integración en Android:**

```kotlin
// Registrar token FCM en producción
private fun registerTokenInProduction(fcmToken: String) {
    val url = "https://tu-app.onrender.com/api/notificaciones-test/register-device"
    
    val json = JSONObject().apply {
        put("deviceToken", fcmToken)
        put("platform", "android")
        put("clienteDocumento", userDocument)
        put("deviceInfo", JSONObject().apply {
            put("deviceId", getDeviceId())
            put("deviceName", Build.MODEL)
            put("osVersion", "Android ${Build.VERSION.RELEASE}")
            put("appBuild", BuildConfig.VERSION_NAME)
        })
    }
    
    // Hacer request HTTP...
}
```

---

## 🔧 **MONITOREO Y MANTENIMIENTO**

### **Logs de Render:**
- Ve a tu servicio en Render
- Pestaña **"Logs"** para ver actividad en tiempo real
- Busca errores o warnings

### **Métricas Importantes:**
- **Response Time:** < 500ms normal
- **Memory Usage:** < 80% del límite
- **Error Rate:** < 1%

### **Alertas Recomendadas:**
- Fallo en conexión a MongoDB
- Errores de Firebase FCM
- Alta cantidad de tokens inválidos

---

## 🚨 **TROUBLESHOOTING COMÚN**

### **Error: "Firebase Project Not Found"**
```bash
# Verificar variables de entorno
echo $FIREBASE_PROJECT_ID
```

### **Error: "MongoDB Connection Failed"**
```bash
# Verificar URI de MongoDB
echo $MONGODB_URI
```

### **Error: "CORS Blocked"**
- Verificar que `ALLOWED_ORIGINS` incluye tu dominio frontend
- Verificar que `NODE_ENV=production`

### **Notificaciones No Llegan:**
1. ✅ Backend desplegado correctamente
2. ✅ Firebase FCM API habilitada  
3. ❌ **Revisar configuración Android** (problema más común)

---

## 🎯 **SIGUIENTE PASO CRÍTICO**

**El backend está 100% listo y funcionando.** 

El equipo de **Android** debe ahora:

1. **Usar la URL de producción** en lugar de localhost
2. **Verificar su configuración FCM** siguiendo la guía que creamos
3. **Implementar FirebaseMessagingService** correctamente
4. **Probar notificaciones** contra el servidor de producción

---

## 📞 **CONTACTO PARA SOPORTE**

Una vez desplegado, podrás:
- Monitorear logs en tiempo real
- Escalar según demanda
- Actualizar variables sin redeployar
- Tener HTTPS automático

**¡Tu sistema de notificaciones push está listo para miles de usuarios! 🚀**
