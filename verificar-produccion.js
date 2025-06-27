/**
 * Script de verificación para entorno de producción
 * Verifica que todas las configuraciones estén listas para despliegue
 */

// Cargar variables de entorno
require('dotenv').config();

const fs = require('fs');
const path = require('path');

class ProductionVerifier {
    constructor() {
        this.checks = [];
        this.warnings = [];
        this.errors = [];
    }

    async runAllChecks() {
        console.log('🔍 === VERIFICACIÓN PRE-PRODUCCIÓN ===\n');

        // Verificar variables de entorno
        this.checkEnvironmentVariables();
        
        // Verificar archivos críticos
        this.checkCriticalFiles();
        
        // Verificar configuración de Firebase
        this.checkFirebaseConfig();
        
        // Verificar dependencias
        this.checkDependencies();

        // Mostrar resultados
        this.showResults();
    }

    checkEnvironmentVariables() {
        console.log('📋 Verificando variables de entorno...');
        
        const requiredVars = [
            'MONGODB_URI',
            'JWT_SECRET',
            'FIREBASE_PROJECT_ID',
            'FIREBASE_PRIVATE_KEY_ID',
            'FIREBASE_PRIVATE_KEY',
            'FIREBASE_CLIENT_EMAIL',
            'FIREBASE_CLIENT_ID'
        ];

        const productionVars = [
            'NODE_ENV',
            'ALLOWED_ORIGINS'
        ];

        requiredVars.forEach(varName => {
            if (process.env[varName]) {
                this.checks.push(`✅ ${varName} configurado`);
            } else {
                this.errors.push(`❌ ${varName} NO configurado`);
            }
        });

        productionVars.forEach(varName => {
            if (process.env[varName]) {
                this.checks.push(`✅ ${varName} configurado`);
            } else {
                this.warnings.push(`⚠️ ${varName} recomendado para producción`);
            }
        });

        // Verificar NODE_ENV específicamente
        if (process.env.NODE_ENV === 'production') {
            this.checks.push('✅ NODE_ENV establecido como production');
        } else {
            this.warnings.push('⚠️ NODE_ENV no es production - endpoints de testing estarán disponibles');
        }
    }

    checkCriticalFiles() {
        console.log('📁 Verificando archivos críticos...');
        
        const criticalFiles = [
            'server.js',
            'src/config/database.js',
            'src/app/notificaciones/services/notificationService.js',
            'src/app/notificaciones/controllers/notificationController.js',
            'src/app/notificaciones/models/deviceTokenModel.js',
            'package.json'
        ];

        criticalFiles.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                this.checks.push(`✅ ${filePath} existe`);
            } else {
                this.errors.push(`❌ ${filePath} NO encontrado`);
            }
        });
    }

    checkFirebaseConfig() {
        console.log('🔥 Verificando configuración de Firebase...');
        
        try {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY;
            
            if (privateKey) {
                if (privateKey.includes('BEGIN PRIVATE KEY') && privateKey.includes('END PRIVATE KEY')) {
                    this.checks.push('✅ Private key de Firebase tiene formato correcto');
                } else {
                    this.warnings.push('⚠️ Private key de Firebase podría tener formato incorrecto');
                }
                
                if (privateKey.includes('\\n')) {
                    this.checks.push('✅ Private key contiene caracteres de escape correctos');
                } else {
                    this.warnings.push('⚠️ Private key podría necesitar caracteres de escape \\n');
                }
            }

            const email = process.env.FIREBASE_CLIENT_EMAIL;
            if (email && email.includes('@') && email.includes('.iam.gserviceaccount.com')) {
                this.checks.push('✅ Email de cliente Firebase tiene formato correcto');
            } else if (email) {
                this.warnings.push('⚠️ Email de cliente Firebase podría tener formato incorrecto');
            }

        } catch (error) {
            this.errors.push(`❌ Error verificando Firebase: ${error.message}`);
        }
    }

    checkDependencies() {
        console.log('📦 Verificando dependencias...');
        
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const requiredDeps = [
                'express',
                'mongoose',
                'firebase-admin',
                'cors',
                'dotenv',
                'socket.io'
            ];

            requiredDeps.forEach(dep => {
                if (packageJson.dependencies[dep]) {
                    this.checks.push(`✅ ${dep} instalado`);
                } else {
                    this.errors.push(`❌ ${dep} NO encontrado en dependencies`);
                }
            });

        } catch (error) {
            this.errors.push(`❌ Error leyendo package.json: ${error.message}`);
        }
    }

    showResults() {
        console.log('\n🎯 === RESULTADOS DE VERIFICACIÓN ===\n');
        
        // Mostrar éxitos
        if (this.checks.length > 0) {
            console.log('✅ VERIFICACIONES EXITOSAS:');
            this.checks.forEach(check => console.log(`   ${check}`));
            console.log('');
        }

        // Mostrar advertencias
        if (this.warnings.length > 0) {
            console.log('⚠️ ADVERTENCIAS:');
            this.warnings.forEach(warning => console.log(`   ${warning}`));
            console.log('');
        }

        // Mostrar errores
        if (this.errors.length > 0) {
            console.log('❌ ERRORES CRÍTICOS:');
            this.errors.forEach(error => console.log(`   ${error}`));
            console.log('');
        }

        // Resumen final
        console.log('📊 RESUMEN:');
        console.log(`   ✅ Verificaciones exitosas: ${this.checks.length}`);
        console.log(`   ⚠️ Advertencias: ${this.warnings.length}`);
        console.log(`   ❌ Errores críticos: ${this.errors.length}`);
        console.log('');

        // Conclusión
        if (this.errors.length === 0) {
            console.log('🚀 ESTADO: LISTO PARA PRODUCCIÓN');
            console.log('   Todos los componentes críticos están configurados correctamente.');
            if (this.warnings.length > 0) {
                console.log('   Revisa las advertencias para optimización adicional.');
            }
        } else {
            console.log('🚫 ESTADO: NO LISTO PARA PRODUCCIÓN');
            console.log('   Corrige los errores críticos antes de desplegar.');
        }

        console.log('\n🔧 Para desplegar en Render:');
        console.log('   1. Asegúrate de que NODE_ENV=production esté configurado');
        console.log('   2. Verifica que todas las variables de Firebase estén en Render');
        console.log('   3. Haz push a tu repositorio');
        console.log('   4. Verifica el despliegue con /test-firebase');
    }
}

// Ejecutar verificación si se llama directamente
if (require.main === module) {
    const verifier = new ProductionVerifier();
    verifier.runAllChecks().catch(console.error);
}

module.exports = ProductionVerifier;
