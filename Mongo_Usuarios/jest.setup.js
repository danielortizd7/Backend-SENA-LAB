// Configuración global para las pruebas
process.env.NODE_ENV = 'test';

// Aumentar timeout para operaciones de base de datos
jest.setTimeout(30000);

// Manejar warnings de deprecación
process.env.NODE_NO_WARNINGS = '1';