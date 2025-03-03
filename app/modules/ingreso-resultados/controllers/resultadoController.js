const axios = require("axios");
const Resultado = require("../models/resultadoModel");

exports.registrarResultado = async (req, res) => {
    try {
        const { idMuestra, pH, turbidez, oxigenoDisuelto, nitratos, fosfatos, cedulaLaboratorista, nombreLaboratorista } = req.body;

        // 🔹 Validar campos obligatorios
        if (!idMuestra || !cedulaLaboratorista || !nombreLaboratorista) {
            return res.status(400).json({ error: "idMuestra, cedulaLaboratorista y nombreLaboratorista son obligatorios" });
        }

        // 🔹 Convertir valores a número antes de validar
        const valoresNumericos = {
            pH: Number(pH),
            turbidez: Number(turbidez),
            oxigenoDisuelto: Number(oxigenoDisuelto),
            nitratos: Number(nitratos),
            fosfatos: Number(fosfatos),
        };

        // 🔹 Validar que los valores numéricos sean correctos
        for (const key in valoresNumericos) {
            if (!Number.isFinite(valoresNumericos[key])) {
                return res.status(400).json({ error: `El valor de ${key} no es válido` });
            }
        }

        // 🔹 Obtener detalles de la muestra desde la API externa
        let muestras = [];
        try {
            const response = await axios.get("https://backendregistromuestra.onrender.com/muestras");
            muestras = response.data;
        } catch (apiError) {
            console.error("❌ Error al obtener muestras:", apiError.message);
            return res.status(500).json({ error: "Error al obtener datos de la muestra" });
        }

        // 🔹 Buscar la muestra por ID
        const muestraEncontrada = muestras.find(m => m.id_muestra === idMuestra.trim());
        if (!muestraEncontrada) {
            return res.status(404).json({ error: "Muestra no encontrada" });
        }

        // 🔹 Crear el nuevo resultado
        const nuevoResultado = new Resultado({
            idMuestra: idMuestra.trim(),
            pH: valoresNumericos.pH,
            turbidez: valoresNumericos.turbidez,
            oxigenoDisuelto: valoresNumericos.oxigenoDisuelto,
            nitratos: valoresNumericos.nitratos,
            fosfatos: valoresNumericos.fosfatos,
            cedulaLaboratorista: cedulaLaboratorista.trim(),
            nombreLaboratorista: nombreLaboratorista.trim(),
        });

        await nuevoResultado.save();

        // 🔹 Combinar los datos de la muestra con el resultado
        const registroCompleto = {
            ...muestraEncontrada,
            resultado: nuevoResultado.toObject(),
        };

        res.status(201).json({ message: "Resultado registrado exitosamente", registro: registroCompleto });
    } catch (error) {
        console.error("❌ Error registrando el resultado:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
