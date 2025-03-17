import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const verificarRolUsuario = async (token) => {
    console.log("Token que se envia a la Api de usuarios", token);
    try {
        const response = await axios.get('https://back-usuarios-f.onrender.com/api/usuarios/perfil', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data; // Retorna los datos del usuario (incluyendo el rol)
    } catch (error) {
        console.error("Error al obtener perfil del usuario:", error.message);
        throw new Error("Error al obtener perfil del usuario");
    }
};