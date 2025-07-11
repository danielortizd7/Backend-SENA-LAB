# JSONs para Pruebas en Postman - Notificaciones AquaLab

## 🔧 Configuración Base de Postman

**Base URL:** `https://backend-registro-muestras.onrender.com`

**Headers para todas las requests:**
```
Content-Type: application/json
```

---

## 1️⃣ Registrar Token FCM

**Método:** `POST`  
**URL:** `/api/notificaciones/registrar-token`

```json
{
  "token": "c3lMci17RlWk2zuXAMHx8I:APA91bH5dKZgJVWJKA5uO9gQRgJ4Y6X1c9_wYUoGbQX1yNxKKRrqUPe5Kd_1sOjNGWZx2L3M7nH8F",
  "clienteDocumento": "1235467890",
  "platform": "android"
}
```

---

## 2️⃣ Notificación de Prueba Simple

**Método:** `POST`  
**URL:** `/api/notificaciones-test/local`

```json
{
  "clienteDocumento": "1235467890",
  "mensaje": "🔔 Prueba de notificación con app cerrada - ¿La recibiste en la barra de notificaciones?"
}
```

---

## 3️⃣ Simular Estado "En Cotización"

**Método:** `POST`  
**URL:** `/api/notificaciones-test/local`

```json
{
  "clienteDocumento": "1235467890",
  "titulo": "Cotización en Proceso",
  "mensaje": "Su muestra PF250708999 está siendo cotizada. Pronto recibirá más información.",
  "data": {
    "tipo": "cambio_estado",
    "estadoAnterior": "Recibida",
    "estadoNuevo": "En Cotización",
    "id_muestra": "PF250708999",
    "clickAction": "OPEN_MUESTRA_DETAIL"
  }
}
```

---

## 4️⃣ Simular Estado "Aceptada"

**Método:** `POST`  
**URL:** `/api/notificaciones-test/local`

```json
{
  "clienteDocumento": "1235467890",
  "titulo": "Cotización Aceptada",
  "mensaje": "¡Excelente! La cotización de su muestra PF250708999 ha sido aceptada. Procederemos con el análisis.",
  "data": {
    "tipo": "cambio_estado",
    "estadoAnterior": "En Cotización",
    "estadoNuevo": "Aceptada",
    "id_muestra": "PF250708999",
    "clickAction": "OPEN_MUESTRA_DETAIL"
  }
}
```

---

## 5️⃣ Simular Estado "Recibida"

**Método:** `POST`  
**URL:** `/api/notificaciones-test/local`

```json
{
  "clienteDocumento": "1235467890",
  "titulo": "📦 Muestra Recibida",
  "mensaje": "Su muestra PF250708999 ha sido recibida en nuestro laboratorio y está lista para análisis.",
  "data": {
    "tipo": "cambio_estado",
    "estadoAnterior": "Aceptada",
    "estadoNuevo": "Recibida",
    "id_muestra": "PF250708999",
    "clickAction": "OPEN_MUESTRA_DETAIL"
  }
}
```

---

## 6️⃣ Simular Estado "En análisis"

**Método:** `POST`  
**URL:** `/api/notificaciones-test/local`

```json
{
  "clienteDocumento": "1235467890",
  "titulo": "🔬 Análisis en Proceso",
  "mensaje": "Su muestra PF250708999 está siendo analizada por nuestros expertos.",
  "data": {
    "tipo": "cambio_estado",
    "estadoAnterior": "Recibida",
    "estadoNuevo": "En análisis",
    "id_muestra": "PF250708999",
    "clickAction": "OPEN_MUESTRA_DETAIL"
  }
}
```

---

## 7️⃣ Simular Estado "Finalizada"

**Método:** `POST`  
**URL:** `/api/notificaciones-test/local`

```json
{
  "clienteDocumento": "1235467890",
  "titulo": "✅ Resultados Disponibles",
  "mensaje": "¡Sus resultados están listos! Los análisis de la muestra PF250708999 han sido completados.",
  "data": {
    "tipo": "cambio_estado",
    "estadoAnterior": "En análisis",
    "estadoNuevo": "Finalizada",
    "id_muestra": "PF250708999",
    "clickAction": "OPEN_MUESTRA_DETAIL"
  }
}
```

---

## 8️⃣ Simular Estado "Rechazada"

**Método:** `POST`  
**URL:** `/api/notificaciones-test/local`

```json
{
  "clienteDocumento": "1235467890",
  "titulo": "❌ Muestra Rechazada",
  "mensaje": "Su muestra PF250708999 ha sido rechazada. La muestra no cumple con los requisitos técnicos necesarios.",
  "data": {
    "tipo": "cambio_estado",
    "estadoAnterior": "Recibida",
    "estadoNuevo": "Rechazada",
    "id_muestra": "PF250708999",
    "clickAction": "OPEN_MUESTRA_DETAIL"
  }
}
```

---

## 9️⃣ Verificar Token Registrado

**Método:** `GET`  
**URL:** `/api/notificaciones/debug/token-completo/1235467890`

*No requiere body*

---

## 🔟 Diagnóstico de Producción

**Método:** `GET`  
**URL:** `/api/notificaciones/diagnostico-produccion`

*No requiere body*

---

## 1️⃣1️⃣ Notificación Personalizada

**Método:** `POST`  
**URL:** `/api/notificaciones-test/local`

```json
{
  "clienteDocumento": "1235467890",
  "titulo": "🧪 Notificación Personalizada",
  "mensaje": "Esta es una notificación de prueba completamente personalizada para verificar la funcionalidad.",
  "data": {
    "tipo": "prueba_personalizada",
    "timestamp": "2025-07-08T00:00:00.000Z",
    "clickAction": "OPEN_MAIN_SCREEN",
    "priority": "high"
  }
}
```

---

## 📋 Secuencia de Pruebas Recomendada

1. **Registrar Token** (Request #1)
2. **Verificar Token** (Request #9)
3. **Cerrar app móvil completamente**
4. **Enviar notificación simple** (Request #2)
5. **Verificar que llegue a la barra de notificaciones**
6. **Probar diferentes estados** (Requests #3-8)
7. **Verificar navegación al tocar notificación**

---

## 🎯 Datos de Prueba

- **Cliente de prueba:** `1235467890`
- **Token FCM de prueba:** `c3lMci17RlWk2zuXAMHx8I:APA91bH5dKZgJVWJKA5uO9gQRgJ4Y6X1c9_wYUoGbQX1yNxKKRrqUPe5Kd_1sOjNGWZx2L3M7nH8F`
- **Muestra de prueba:** `PF250708999`

---

## ✅ Respuestas Esperadas

**Registro exitoso:**
```json
{
  "success": true,
  "message": "Token registrado exitosamente",
  "data": {
    "clienteDocumento": "1235467890",
    "platform": "android",
    "isActive": true
  }
}
```

**Notificación enviada (nueva estructura):**
```json
{
  "success": true,
  "message": "Notificación enviada exitosamente",
  "data": {
    "devicesSent": 1,
    "devicesFailed": 0,
    "estructura": "solo_data"
  }
}
```

**Estructura JSON que recibe Firebase:**
```json
{
  "data": {
    "title": "Cotización Aceptada",
    "body": "La cotización ha sido aceptada",
    "estadoAnterior": "En Cotización",
    "estadoNuevo": "Aceptada",
    "tipo": "cambio_estado",
    "clickAction": "OPEN_MUESTRA_DETAIL",
    "id_muestra": "PF250708999",
    "priority": "high"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channel_id": "aqualab_updates"
    }
  }
}
```
