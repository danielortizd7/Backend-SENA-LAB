const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Log de todas las peticiones a /auth
router.use((req, res, next) => {
    console.log(`Auth Request: ${req.method} ${req.url}`);
    console.log('Body:', req.body);
    next();
});

// Ruta de login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Intento de login recibido:', { email });

    // Usuario administrador existente
    if (email === 'danielortizd7@gmail.com' && password === 'Daniel123!') {
        const token = jwt.sign(
            { 
                id: '1',
                email: email,
                rol: 'administrador',
                nombre: 'Daniel Ortiz'
            },
            process.env.JWT_SECRET || 'tu_clave_secreta',
            { expiresIn: '8h' }
        );

        console.log('Login exitoso para:', email);
        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                usuario: {
                    id: '1',
                    email: email,
                    nombre: 'Daniel Ortiz',
                    rol: { name: 'administrador' }
                }
            }
        });
    } else {
        console.log('Credenciales inválidas para:', email);
        res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
        });
    }
});

// Middleware para verificar token
const verificarToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta');
        req.usuario = decoded; // Agregar información del usuario al request
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

// Ruta para verificar token
router.get('/verificar', verificarToken, (req, res) => {
    res.json({
        success: true,
        data: {
            usuario: req.usuario
        }
    });
});

module.exports = { router, verificarToken }; 