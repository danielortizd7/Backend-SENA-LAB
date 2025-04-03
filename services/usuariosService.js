import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const verificarRolUsuario = async (rolId) => {
    try {
        const response = await axios.get(`https://back-usuarios-f.onrender.com/api/usuarios/roles/${rolId}`);
            return response.data;
        

     
    } catch (error) {
        console.error("Error al obtener perfil del usuario:", error.message);
        throw new Error("Error al obtener perfil del usuario: " + error.message);
    }
};