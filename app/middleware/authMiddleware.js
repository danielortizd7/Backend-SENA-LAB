const laboratoristasPermitidos = {
  "12345678": "Juan Pérez",
  "87654321": "María Gómez",
  "11223344": "Carlos López",
};

const authMiddleware = (req, res, next) => {
  const { cedulaLaboratorista, cedulaCliente } = req.body;

  if (!cedulaLaboratorista) {
    return res.status(400).json({ error: "Acceso denegado: Cédula del laboratorista requerida" });
  }

  if (!laboratoristasPermitidos[cedulaLaboratorista]) {
    return res.status(403).json({ error: "Acceso denegado: Usuario no autorizado" });
  }

  // Guarda el nombre del laboratorista para usarlo después
  req.nombreLaboratorista = laboratoristasPermitidos[cedulaLaboratorista];

  // Ahora verifica si hay cédula del cliente para permitir la firma
  if (!cedulaCliente) {
    return res.status(400).json({ error: "La cédula del cliente es obligatoria después de la firma del laboratorista." });
  }

  next();
};

module.exports = authMiddleware;
