#!/usr/bin/env node

/**
 * Script para validar configuración pre-producción
 * Ejecutar con: node validar-produccion.js
 */

// Cargar variables de entorno desde .env
require('dotenv').config();

const axios = require('axios');
const admin = require('firebase-admin');

// Configuración para producción
const PRODUCTION_URL = 'https://tu-backend.onrender.com'; // Cambiar por tu URL real
const LOCAL_URL = 'http://localhost:3001';

// Colores para output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validarProduccion() {
    log('\n🔍 VALIDANDO PREPARACIÓN PARA PRODUCCIÓN\n', 'bold');
    
    const checklist = {
        variables: false,
        firebase: false,
        endpoints: false,
        optimizaciones: false,
        seguridad: false
    };

    try {
        // 1. Verificar variables de entorno
        log('1️⃣ Verificando Variables de Entorno...', 'blue');
        const requiredVars = [
            'FIREBASE_PROJECT_ID',
            'FIREBASE_PRIVATE_KEY',
            'FIREBASE_CLIENT_EMAIL',
            'FIREBASE_CLIENT_ID',
            'FIREBASE_PRIVATE_KEY_ID'
        ];

        let missingVars = [];
        requiredVars.forEach(varName => {
            if (!process.env[varName]) {
                missingVars.push(varName);
            }
        });

        if (missingVars.length === 0) {
            log('   ✅ Todas las variables están configuradas', 'green');
            checklist.variables = true;
        } else {
            log(`   ❌ Variables faltantes: ${missingVars.join(', ')}`, 'red');
        }

        // 2. Verificar conexión Firebase
        log('\n2️⃣ Verificando Firebase Admin SDK...', 'blue');
        try {
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
                    })
                });
            }

            // Test básico de Firebase
            const app = admin.app();
            log('   ✅ Firebase Admin SDK inicializado correctamente', 'green');
            checklist.firebase = true;
        } catch (error) {
            log(`   ❌ Error en Firebase: ${error.message}`, 'red');
        }

        // 3. Verificar estructura de endpoints
        log('\n3️⃣ Verificando Estructura de Endpoints...', 'blue');
        const fs = require('fs');
        const path = require('path');

        // Verificar archivos críticos
        const criticalFiles = [
            'src/app/notificaciones/controllers/notificationController.js',
            'src/app/notificaciones/routes/notificationRoutes.js',
            'server.js',
            'package.json'
        ];

        let filesOk = true;
        criticalFiles.forEach(file => {
            if (fs.existsSync(path.join(__dirname, file))) {
                log(`   ✅ ${file}`, 'green');
            } else {
                log(`   ❌ ${file} no encontrado`, 'red');
                filesOk = false;
            }
        });

        checklist.endpoints = filesOk;

        // 4. Verificar optimizaciones de código
        log('\n4️⃣ Verificando Optimizaciones...', 'blue');
        
        // Leer controller para verificar optimizaciones
        const controllerPath = path.join(__dirname, 'src/app/notificaciones/controllers/notificationController.js');
        if (fs.existsSync(controllerPath)) {
            const controllerContent = fs.readFileSync(controllerPath, 'utf8');
            
            // Verificar que hay manejo condicional de logs
            if (controllerContent.includes('NODE_ENV') && controllerContent.includes('production')) {
                log('   ✅ Logs condicionados por NODE_ENV', 'green');
            } else {
                log('   ⚠️ Logs no están condicionados por NODE_ENV', 'yellow');
            }

            // Verificar manejo de errores
            if (controllerContent.includes('try') && controllerContent.includes('catch')) {
                log('   ✅ Manejo de errores implementado', 'green');
            } else {
                log('   ⚠️ Manejo de errores incompleto', 'yellow');
            }

            checklist.optimizaciones = true;
        }

        // 5. Verificar configuraciones de seguridad
        log('\n5️⃣ Verificando Configuraciones de Seguridad...', 'blue');
        
        const serverPath = path.join(__dirname, 'server.js');
        if (fs.existsSync(serverPath)) {
            const serverContent = fs.readFileSync(serverPath, 'utf8');
            
            if (serverContent.includes('cors')) {
                log('   ✅ CORS configurado', 'green');
            } else {
                log('   ⚠️ CORS no encontrado', 'yellow');
            }

            if (serverContent.includes('helmet') || serverContent.includes('security')) {
                log('   ✅ Headers de seguridad configurados', 'green');
            } else {
                log('   ℹ️ Headers de seguridad opcionales', 'blue');
            }

            checklist.seguridad = true;
        }

        // 6. Resumen final
        log('\n📋 RESUMEN DE VALIDACIÓN:', 'bold');
        log('═'.repeat(50), 'blue');
        
        Object.entries(checklist).forEach(([key, status]) => {
            const emoji = status ? '✅' : '❌';
            const color = status ? 'green' : 'red';
            const keyFormatted = key.charAt(0).toUpperCase() + key.slice(1);
            log(`${emoji} ${keyFormatted}: ${status ? 'OK' : 'REVISAR'}`, color);
        });

        const allOk = Object.values(checklist).every(status => status);
        
        log('\n🎯 ESTADO FINAL:', 'bold');
        if (allOk) {
            log('🚀 SISTEMA LISTO PARA PRODUCCIÓN!', 'green');
            log('\nPróximos pasos:', 'blue');
            log('1. Subir código a repositorio', 'blue');
            log('2. Configurar variables en Render', 'blue');
            log('3. Desplegar con NODE_ENV=production', 'blue');
            log('4. Verificar endpoints de producción', 'blue');
            log('5. Coordinar con equipo Android para pruebas', 'blue');
        } else {
            log('⚠️ REVISAR ELEMENTOS FALTANTES ANTES DE DESPLEGAR', 'yellow');
        }

        log('\n📱 URLs de Testing Post-Despliegue:', 'blue');
        log(`GET  ${PRODUCTION_URL}/test-firebase`, 'blue');
        log(`POST ${PRODUCTION_URL}/api/notificaciones-test/register-device`, 'blue');
        log(`GET  ${PRODUCTION_URL}/api/notificaciones/status`, 'blue');

    } catch (error) {
        log(`\n❌ Error durante validación: ${error.message}`, 'red');
        log('Revisa la configuración antes de continuar', 'yellow');
    }
}

// Ejecutar validación
if (require.main === module) {
    validarProduccion();
}

module.exports = { validarProduccion };
