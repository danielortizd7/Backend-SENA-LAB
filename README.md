# Backend SENA LAB

Backend para el sistema de gestión de muestras de laboratorio del SENA.

## Descripción

Este proyecto es una API REST para la gestión de muestras de laboratorio, que incluye:
- Registro de muestras
- Gestión de usuarios y roles
- Validación de muestras
- Gestión de resultados
- Firma digital de documentos

## Tecnologías

- Node.js
- Express
- MongoDB
- JWT para autenticación
- Bcrypt para encriptación

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/danielortizd7/Backend-SENA-LAB.git
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
- Crear archivo `.env` basado en `.env.example`
- Configurar las variables necesarias

4. Iniciar el servidor:
```bash
npm run dev
```

## Estructura del Proyecto

- `/src`: Código fuente
  - `/app`: Módulos de la aplicación
  - `/shared`: Código compartido
  - `/scripts`: Scripts de utilidad

## Endpoints Principales

- `/api/auth`: Autenticación
- `/api/muestras`: Gestión de muestras
- `/api/registro-muestras`: Registro de muestras
- `/api/tipos-agua`: Tipos de agua
- `/api/cambios-estado`: Gestión de estados
- `/api/ingreso-resultados`: Gestión de resultados
- `/api/firma-digital`: Firma de documentos

## Autor

Daniel Ortiz
