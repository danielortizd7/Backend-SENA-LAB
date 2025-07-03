#!/bin/bash

# deployment-script.sh
# Script para desplegar el backend de SENA Lab en producción

echo "🚀 Iniciando deployment de SENA Lab Backend..."

# 1. Verificar que .env no esté en Git
if [ -f ".env" ]; then
    echo "⚠️  ADVERTENCIA: Archivo .env encontrado. Asegúrate de que no esté en Git"
    echo "   Verifica que .env esté en .gitignore"
fi

# 2. Instalar dependencias de producción
echo "📦 Instalando dependencias..."
npm ci --only=production

# 3. Verificar variables de entorno requeridas
echo "🔍 Verificando variables de entorno..."

required_vars=(
    "MONGO_URI"
    "JWT_SECRET"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_CLIENT_EMAIL"
    "FIREBASE_PRIVATE_KEY"
    "PORT"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Variables de entorno faltantes:"
    printf '   - %s\n' "${missing_vars[@]}"
    echo ""
    echo "Configura estas variables antes de continuar:"
    echo "export VARIABLE_NAME=\"valor\""
    exit 1
fi

# 4. Configurar NODE_ENV
export NODE_ENV=production

# 5. Crear directorio para logs si no existe
mkdir -p logs

echo "✅ Variables de entorno configuradas correctamente"
echo "🚀 Iniciando servidor en modo producción..."
echo "   Puerto: ${PORT:-5000}"
echo "   Base de datos: ${MONGO_URI:0:20}..."
echo "   Firebase proyecto: ${FIREBASE_PROJECT_ID}"

# 6. Iniciar aplicación
node server.js
