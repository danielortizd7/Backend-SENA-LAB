# Guía de Deployment para Permitir Frontend Local

## Cambios Realizados

### 1. Archivo `.env`
- Se agregó `http://localhost:5174` a `ALLOWED_ORIGINS` para mayor flexibilidad

### 2. Archivo `server.js`
- Mejorada la configuración de CORS para development/production
- Agregado logging de orígenes para debugging
- Configuración más permisiva para localhost en desarrollo

## Pasos para Deployment

### Opción 1: Git + Render (Recomendado)
```bash
# 1. Agregar cambios al git
git add .
git commit -m "feat: permitir frontend local conectar a backend producción"
git push origin master

# 2. Render automáticamente detectará los cambios y redesplegará
```

### Opción 2: Variables de Entorno en Render
Si no quieres hacer commit de tu `.env`, puedes configurar las variables directamente en Render:

1. Ve a tu dashboard de Render
2. Selecciona tu servicio backend
3. Ve a "Environment"
4. Actualiza o agrega:
   ```
   ALLOWED_ORIGINS=https://laboratorio-sena.vercel.app,https://web-sena-lab.vercel.app,https://aqualab-sena.vercel.app,http://localhost:5173,http://localhost:5174
   ```
5. Guarda y Render redesplegará automáticamente

## Verificación

### 1. Verificar que el backend de producción esté funcionando:
```bash
curl -i https://tu-backend-en-render.com/
```

### 2. Probar CORS desde localhost:
```bash
curl -H "Origin: http://localhost:5173" -i https://tu-backend-en-render.com/
```

### 3. En el frontend local:
- Configura tu archivo `.env` o configuración para apuntar a:
  ```
  VITE_API_URL=https://tu-backend-en-render.com
  ```
  (reemplaza con tu URL real de Render)

## Configuración del Frontend

Para que tu frontend local consuma el backend de producción, asegúrate de que:

1. Tu archivo `.env.local` o `.env` del frontend contenga:
   ```
   VITE_API_URL=https://backend-registro-muestras.onrender.com
   # o la URL que tengas en Render
   ```

2. Si usas Vite, reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   # o
   yarn dev
   ```

## Troubleshooting

### Si sigues viendo errores CORS:
1. Verifica que el deployment se completó exitosamente en Render
2. Revisa los logs del backend en Render para ver si los orígenes se están registrando correctamente
3. Asegúrate de que tu frontend esté usando la URL correcta del backend

### Si el frontend sigue apuntando a localhost:5000:
1. Verifica tu archivo de configuración del frontend
2. Reinicia el servidor de desarrollo del frontend
3. Limpia la cache del navegador (Ctrl+Shift+R)
