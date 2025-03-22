import axios from 'axios';

async function verificarRol() {
    try {
        const response = await axios.get('https://back-usuarios-f.onrender.com/api/usuarios/roles/67d8c23082d1ef13162bdc18', {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('Datos del rol:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

verificarRol(); 