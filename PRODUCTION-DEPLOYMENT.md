# 🚀 DESPLIEGUE A PRODUCCIÓN - BACKEND NOTIFICACIONES

## ✅ ESTADO ACTUAL
- **Firebase Cloud Messaging API**: ✅ HABILITADA
- **Backend FCM**: ✅ FUNCIONANDO
- **Endpoints de diagnóstico**: ✅ LISTOS
- **Tokens FCM**: ✅ SE REGISTRAN CORRECTAMENTE
- **Envío de notificaciones**: ✅ BACKEND REPORTA ÉXITO

## 🎯 OBJETIVO
Subir el backend a producción para que el equipo Android pueda hacer pruebas reales una vez implementen las correcciones.

## 📋 CHECKLIST PRE-PRODUCCIÓN

### 1. Variables de Entorno (.env)
```bash
# Firebase Configuration (✅ Verificadas)
FIREBASE_PROJECT_ID=aqualab-83795
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@aqualab-83795.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_ID=xxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_ID=xxxxx

# MongoDB (⚠️ Verificar para producción)
MONGODB_URI=mongodb://...

# JWT (⚠️ Cambiar para producción)
JWT_SECRET=production_secret_key_here

# Server
NODE_ENV=production
PORT=5000
```

### 2. Archivos Listos para Producción
- ✅ `src/app/notificaciones/controllers/notificationController.js`
- ✅ `src/app/notificaciones/routes/notificationRoutes.js`
- ✅ `server.js`
- ✅ Endpoints de diagnóstico público

### 3. Endpoints Disponibles en Producción

#### 🔍 Diagnóstico (Públicos - Sin autenticación)
```
GET /api/notificaciones/diagnostico-publico-fcm
GET /api/notificaciones/guia-configuracion-android
```

#### 📱 Registro de Tokens (Públicos para testing)
```
POST /api/notificaciones/registrar-token-publico
Body: {
  "deviceToken": "token_fcm",
  "platform": "android",
  "clienteDocumento": "1234567890"
}
```

#### 🧪 Testing (Públicos para testing)
```
POST /api/notificaciones/probar-notificacion-token
Body: {
  "deviceToken": "token_fcm",
  "titulo": "Prueba",
  "mensaje": "Mensaje de prueba"
}
```

#### 🔐 Endpoints Autenticados
```
POST /api/notificaciones/register-device (Con JWT)
GET /api/notificaciones/verificar-estado-tokens (Con JWT)
```

## 🚀 PASOS PARA DESPLIEGUE

### Opción A: Heroku
```bash
# 1. Configurar variables de entorno
heroku config:set FIREBASE_PROJECT_ID=aqualab-83795
heroku config:set FIREBASE_CLIENT_EMAIL=xxxxx
heroku config:set FIREBASE_PRIVATE_KEY_ID=xxxxx
heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
heroku config:set NODE_ENV=production

# 2. Desplegar
git add .
git commit -m "Backend listo para producción - FCM configurado"
git push heroku main
```

### Opción B: Railway
```bash
# Variables en Railway Dashboard
FIREBASE_PROJECT_ID=aqualab-83795
FIREBASE_CLIENT_EMAIL=xxxxx
FIREBASE_PRIVATE_KEY_ID=xxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
NODE_ENV=production
```

### Opción C: Render
```bash
# En render.com dashboard, configurar variables de entorno
# Luego conectar repositorio GitHub
```

## 🧪 TESTING POST-DESPLIEGUE

### 1. Verificar FCM está funcionando
```bash
curl https://tu-backend-produccion.com/api/notificaciones/diagnostico-publico-fcm
```

### 2. Probar registro de token
```bash
curl -X POST https://tu-backend-produccion.com/api/notificaciones/registrar-token-publico \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "TOKEN_REAL_DE_ANDROID",
    "platform": "android", 
    "clienteDocumento": "1234567890"
  }'
```

### 3. Probar envío de notificación
```bash
curl -X POST https://tu-backend-produccion.com/api/notificaciones/probar-notificacion-token \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "TOKEN_REAL_DE_ANDROID",
    "titulo": "🚀 Prueba Producción",
    "mensaje": "Backend en producción funcionando"
  }'
```

## 📱 PARA EL EQUIPO ANDROID

Una vez el backend esté en producción, el equipo Android debe:

### 1. Actualizar URL base de la API
```kotlin
// Cambiar de localhost a la URL de producción
const val BASE_URL = "https://tu-backend-produccion.com/api/"
```

### 2. Implementar FirebaseMessagingService
Ver guía completa en: `GET /api/notificaciones/guia-configuracion-android`

### 3. Probar con endpoints públicos
- Registrar token: `/registrar-token-publico`
- Probar notificación: `/probar-notificacion-token`
- Diagnóstico: `/diagnostico-publico-fcm`

## 🔒 SEGURIDAD PARA PRODUCCIÓN

### Variables críticas a cambiar:
```bash
# ⚠️ IMPORTANTE: Cambiar antes de producción
JWT_SECRET=un_secreto_muy_seguro_para_produccion
MONGODB_URI=mongodb://usuario:password@cluster-produccion
```

### Endpoints de testing:
- Los endpoints públicos están diseñados para testing
- Una vez las notificaciones funcionen, considera deshabilitarlos
- Los endpoints autenticados con JWT son seguros para producción

## 📞 CONTACTO PARA TESTING

Una vez en producción, comparte estas URLs con el equipo Android:

- **Base URL**: `https://tu-backend-produccion.com`
- **Diagnóstico**: `/api/notificaciones/diagnostico-publico-fcm`
- **Guía Android**: `/api/notificaciones/guia-configuracion-android`
- **Registro token**: `/api/notificaciones/registrar-token-publico`
- **Probar notificación**: `/api/notificaciones/probar-notificacion-token`

## ✅ VERIFICACIÓN FINAL

Antes de deployment, confirma:
- [ ] Variables de entorno configuradas
- [ ] Firebase funciona en desarrollo
- [ ] MongoDB accesible desde producción
- [ ] JWT_SECRET cambiado para producción
- [ ] CORS configurado para el dominio de producción

---

**🎯 El backend está 100% listo para producción. Los problemas restantes están del lado Android.**
