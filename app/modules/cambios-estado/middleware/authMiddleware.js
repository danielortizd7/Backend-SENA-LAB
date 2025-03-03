const laboratoristas = ["11223344", "87654321", "12345678"];

const authMiddleware = (req, res, next) => {
  const { cedula } = req.body;

  console.log("🔍 Cédula recibida:", cedula);

  if (!cedula) {
    return res.status(400).json({ error: "⚠️ La cédula es obligatoria." });
  }

  if (!laboratoristas.includes(cedula)) {
    return res.status(403).json({ error: "⛔ Acceso denegado. Solo laboratoristas pueden cambiar estados." });
  }

  next();
};

module.exports = authMiddleware;
