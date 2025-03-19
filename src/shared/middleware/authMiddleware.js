const laboratoristasPermitidos = {
  "12345678": "Juan Pérez",
  "87654321": "María Gómez",
  "11223344": "Carlos López"
};

const authMiddleware = (req, res, next) => {
  const { cedulaLaboratorista } = req.body;

  if (!cedulaLaboratorista) {
    return res.status(400).json({ error: "Acceso denegado: Cédula requerida" });
  }

  if (!laboratoristasPermitidos[cedulaLaboratorista]) {
    return res.status(403).json({ error: "Acceso denegado: Usuario no autorizado" });
  }

  req.nombreLaboratorista = laboratoristasPermitidos[cedulaLaboratorista]; // Asignar el nombre
  next();
};

module.exports = authMiddleware;
