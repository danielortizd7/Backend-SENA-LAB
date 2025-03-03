static async registrar(datos) {
    try {
        const nuevoTipo = new TipoAgua({
            tipoDeAgua: datos.tipoDeAgua,
            tipoPersonalizado: datos.tipoDeAgua === "otra" ? datos.tipoPersonalizado : null,
            descripcion: datos.descripcion
        });

        await nuevoTipo.save();
        return nuevoTipo;
    } catch (error) {
        console.error("❌ Error en registrarTipoAgua:", error);
        throw new Error(`Error al registrar el tipo de agua: ${error.message}`);
    }
}
