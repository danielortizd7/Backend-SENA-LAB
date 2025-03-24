# Documentación Frontend - Módulo de Resultados

## Estructura de Carpetas
```
src/
├── components/
│   ├── ResultadosForm/
│   │   ├── index.tsx
│   │   ├── CalibracionSection.tsx
│   │   ├── MedicionesSection.tsx
│   │   └── ValidationSchema.ts
│   └── common/
│       ├── LoadingSpinner.tsx
│       └── ErrorMessage.tsx
├── pages/
│   ├── ListaMuestras.tsx
│   └── IngresoResultados.tsx
├── services/
│   └── resultadosService.ts
└── types/
    └── resultados.types.ts
```

## Rutas Frontend
```typescript
const routes = [
  {
    path: "/muestras",
    component: ListaMuestras,
    exact: true
  },
  {
    path: "/ingresar-resultados/:idMuestra",
    component: IngresoResultados,
    exact: true
  }
];
```

## Servicios API

### ResultadosService
```typescript
class ResultadosService {
  // Obtener lista de muestras pendientes
  static async getMuestrasPendientes() {
    return axios.get('/api/muestras/pendientes');
  }

  // Obtener detalles de una muestra
  static async getMuestraById(idMuestra: string) {
    return axios.get(`/api/muestras/${idMuestra}`);
  }

  // Registrar resultados
  static async registrarResultados(data: ResultadosData) {
    return axios.post('/api/resultados/registrar', data);
  }

  // Verificar resultados
  static async verificarResultados(idMuestra: string, data: VerificacionData) {
    return axios.post(`/api/resultados/verificar/${idMuestra}`, data);
  }
}
```

## Interfaces TypeScript

### Tipos de Datos
```typescript
interface Muestra {
  id_muestra: string;
  documento: string;
  fechaHora: string;
  tipoMuestreo: string;
  estado: 'pendiente' | 'con_resultados' | 'verificado';
}

interface Medicion {
  M1: string;
  M2: string;
  unidad?: string;
}

interface Calibracion {
  pH4?: string;
  pH7?: string;
  pH10?: string;
  '20UNT'?: string;
  '200UNT'?: string;
}

interface Analisis {
  pH: {
    calibracion: Calibracion;
    mediciones: Medicion;
  };
  turbidez: {
    calibracion: Calibracion;
    mediciones: Medicion;
  };
  oxigenoDisuelto: {
    mediciones: Medicion;
  };
  nitratos: {
    mediciones: Medicion & { unidad: string };
  };
  fosfatos: {
    mediciones: Medicion & { unidad: string };
  };
}

interface ResultadosData {
  idMuestra: string;
  analisis: Analisis;
  observaciones: string;
}
```

## Componentes Principales

### ListaMuestras
- **Propósito**: Mostrar todas las muestras pendientes de análisis
- **Funcionalidades**:
  - Filtrar por estado
  - Ordenar por fecha
  - Búsqueda por código
  - Acceso directo a ingreso de resultados

### IngresoResultados
- **Propósito**: Formulario para ingresar resultados de análisis
- **Validaciones**:
  - pH: valores entre 0-14
  - Turbidez: valores positivos
  - Oxígeno disuelto: valores positivos
  - Nitratos: valores positivos con unidades
  - Fosfatos: valores positivos con unidades

## Flujo de Trabajo

1. **Listado de Muestras**
   - Usuario accede a `/muestras`
   - Se cargan muestras pendientes
   - Filtros disponibles por estado y fecha
   - Botón "Ingresar Resultados" por muestra

2. **Ingreso de Resultados**
   - Usuario selecciona muestra
   - Se carga formulario con datos pre-cargados
   - Secciones separadas por tipo de análisis
   - Validación en tiempo real
   - Guardado automático cada 5 minutos

3. **Verificación**
   - Otro laboratorista revisa resultados
   - Puede aprobar o solicitar correcciones
   - Se registra en historial de cambios

## Validaciones Frontend

### pH
```typescript
const pHValidation = {
  min: 0,
  max: 14,
  required: true,
  pattern: /^\d*\.?\d+$/
};
```

### Turbidez
```typescript
const turbidezValidation = {
  min: 0,
  required: true,
  pattern: /^\d*\.?\d+$/
};
```

### Mediciones Generales
```typescript
const medicionValidation = {
  required: true,
  pattern: /^\d*\.?\d+$/,
  min: 0
};
```

## Estados de Muestra

- **Pendiente**: Sin resultados registrados
- **Con Resultados**: Resultados registrados, pendiente de verificación
- **Verificado**: Resultados verificados por otro laboratorista

## Manejo de Errores

```typescript
interface ErrorResponse {
  message: string;
  code: string;
  details?: any;
}

const handleApiError = (error: ErrorResponse) => {
  switch (error.code) {
    case 'UNAUTHORIZED':
      // Redirigir a login
      break;
    case 'VALIDATION_ERROR':
      // Mostrar errores en formulario
      break;
    case 'NOT_FOUND':
      // Mostrar mensaje de muestra no encontrada
      break;
    default:
      // Error general
  }
};
```

## Seguridad y Permisos

- Solo usuarios con rol "laboratorista" pueden acceder
- Verificación de token en cada petición
- No se puede verificar resultados propios
- Registro de auditoría de cambios

## Mejores Prácticas

1. **Validación**:
   - Validar en frontend antes de enviar
   - Confirmar en backend
   - Mostrar errores claros al usuario

2. **Rendimiento**:
   - Lazy loading de componentes
   - Caché de resultados frecuentes
   - Paginación en listas largas

3. **UX**:
   - Feedback inmediato
   - Autoguardado
   - Confirmaciones importantes
   - Mensajes de error claros

4. **Mantenibilidad**:
   - Componentes reutilizables
   - TypeScript para type-safety
   - Documentación clara
   - Tests unitarios 