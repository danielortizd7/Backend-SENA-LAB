const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authController = {
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            console.log('Intento de login recibido:', { email });

            // Usuario de prueba
            const usuarios = [
                {
                    id: '1',
                    email: 'admin@test.com',
                    // Password: admin123
                    password: '$2a$10$GR8JpN.fxqnNCO3UE4VKXOKNyXHXYINwqGmzHAH0nqNhIQm0qOEGi',
                    nombre: 'Administrador',
                    rol: { name: 'administrador' },
                    activo: true
                }
            ];

            // Buscar usuario
            const usuario = usuarios.find(u => u.email === email);
            if (!usuario) {
                console.log('Usuario no encontrado:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Verificar contraseña
            const passwordValido = await bcrypt.compare(password, usuario.password);
            if (!passwordValido) {
                console.log('Contraseña inválida para usuario:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            if (!usuario.activo) {
                console.log('Usuario inactivo:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Usuario inactivo'
                });
            }

            // Generar token
            const token = jwt.sign(
                {
                    id: usuario.id,
                    email: usuario.email,
                    rol: usuario.rol.name,
                    nombre: usuario.nombre
                },
                process.env.JWT_SECRET || 'tu_clave_secreta',
                { expiresIn: '8h' }
            );

            console.log('Login exitoso para:', email);
            
            // Respuesta exitosa
            res.json({
                success: true,
                message: 'Login exitoso',
                data: {
                    token,
                    usuario: {
                        id: usuario.id,
                        email: usuario.email,
                        nombre: usuario.nombre,
                        rol: usuario.rol,
                    }
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error en el servidor',
                error: error.message
            });
        }
    },

    verificarToken: async (req, res) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token no proporcionado'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta');
            res.json({
                success: true,
                data: {
                    usuario: decoded
                }
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
    }
};

module.exports = authController; 