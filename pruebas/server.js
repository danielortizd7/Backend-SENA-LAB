const express = require('express');
const path = require('path');
const app = express();

// Servir archivos estáticos desde el directorio interfaces
app.use(express.static(path.join(__dirname, 'interfaces')));

// Ruta por defecto redirige a index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'interfaces', 'index.html'));
});

// Puerto para el servidor web
const PORT = 8080;

app.listen(PORT, () => {
    console.log(`Servidor web corriendo en http://localhost:${PORT}`);
}); 