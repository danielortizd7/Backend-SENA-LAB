import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const verificarRolUsuario = async (token) => {
    try {
        const response = await axios.post('https://back-usuarios-f.onrender.com/api/usuarios/login', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(response);
        return response.data;
    } catch (error) {
        if (error.response) {
            // Error de respuesta del servidor
            throw new Error(`Error del servidor de usuarios: ${error.response.data.mensaje || error.response.statusText}`);
        } else if (error.request) {
            // Error de conexión
            throw new Error('No se pudo conectar con el servidor de usuarios');
        } else {
            throw new Error('Error al verificar el rol del usuario: ' + error.message);
        }
    }
};