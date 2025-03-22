const generarIdMuestra = async (Muestra) => {
    // Obtener la última muestra ordenada por id_muestra de forma descendente
    const ultimaMuestra = await Muestra.findOne({}, { id_muestra: 1 })
        .sort({ id_muestra: -1 });

    if (!ultimaMuestra || !ultimaMuestra.id_muestra) {
        // Si no hay muestras, empezar desde H01
        return 'MUESTRA-H01';
    }

    // Extraer el número del último ID
    const match = ultimaMuestra.id_muestra.match(/H(\d+)$/);
    if (!match) {
        throw new Error('Formato de ID inválido en la base de datos');
    }

    // Incrementar el número y formatearlo con padding de ceros
    const ultimoNumero = parseInt(match[1], 10);
    const nuevoNumero = ultimoNumero + 1;
    const numeroFormateado = nuevoNumero.toString().padStart(2, '0');

    return `MUESTRA-H${numeroFormateado}`;
};

module.exports = { generarIdMuestra }; 