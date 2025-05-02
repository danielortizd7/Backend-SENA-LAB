import axios from 'axios';

const BASE_URLS = {
    USUARIOS: import.meta.env.VITE_BACKEND_URL || 'https://backend-sena-lab-1-qpzp.onrender.com/api',
    MUESTRAS: import.meta.env.VITE_BACKEND_MUESTRAS_URL || 'http://localhost:5000'
};

const API_URLS = {
    USUARIOS: `${BASE_URLS.USUARIOS}/usuarios`,
    MUESTRAS: `${BASE_URLS.MUESTRAS}/api/muestras`,
    ANALISIS_FISICOQUIMICOS: `${BASE_URLS.MUESTRAS}/api/analisis/fisicoquimico`,
    ANALISIS_MICROBIOLOGICOS: `${BASE_URLS.MUESTRAS}/api/analisis/microbiologico`
};

interface ApiError extends Error {
    response?: {
        status: number;
        data?: any;
    };
    request?: any;
}

const handleApiError = (error: ApiError): never => {
    console.error('Error en operación de muestras:', error);

    if (error.response) {
        const errorMessage = error.response.data?.message || '';
        switch (error.response.status) {
            case 401:
                throw new Error(`No autorizado. Por favor, inicie sesión nuevamente. ${errorMessage}`);
            case 403:
                throw new Error(`No tiene permisos para realizar esta acción. ${errorMessage}`);
            case 404:
                throw new Error(`La muestra solicitada no fue encontrada. ${errorMessage}`);
            case 500:
                throw new Error(`Error interno del servidor. ${errorMessage}`);
            default:
                throw new Error(`Error en la operación: ${errorMessage || 'Error desconocido'}`);
        }
    } else if (error.request) {
        throw new Error('No se pudo conectar con el servidor. Verifique su conexión a internet.');
    }
    throw new Error('Error inesperado en la operación.');
};

interface MuestraFiltros {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    tipo?: string;
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
    searchTerm?: string;
}

interface Muestra {
    id_muestra?: string;
    id_muestrea?: string;
    _id?: string;
    tipoAnalisis: string;
    tipoMuestreo: string;
    estado: string;
    cliente?: {
        documento: string;
        nombre: string;
    };
    documento?: string;
    nombreCliente?: string;
    fechaHoraMuestreo?: {
        fecha: string;
        hora: string;
    };
    analisisSeleccionados?: string[];
    observaciones?: string;
}

export const muestrasService = {
    /**
     * Obtiene la lista de muestras con filtros
     */
    async getMuestras(filtros: MuestraFiltros = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                tipo,
                estado,
                fechaInicio,
                fechaFin,
                searchTerm
            } = filtros;

            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                sortBy,
                sortOrder
            });

            if (tipo) params.append('tipo', tipo);
            if (estado) params.append('estado', estado);
            if (fechaInicio) params.append('fechaInicio', fechaInicio);
            if (fechaFin) params.append('fechaFin', fechaFin);
            if (searchTerm) params.append('search', searchTerm);

            const response = await axios.get(`${API_URLS.MUESTRAS}?${params.toString()}`);
            return response.data;
        } catch (error) {
            handleApiError(error as ApiError);
        }
    },

    /**
     * Obtiene una muestra por su ID
     */
    async getMuestraById(id: string) {
        try {
            const response = await axios.get(`${API_URLS.MUESTRAS}/${id}`);
            return response.data;
        } catch (error) {
            handleApiError(error as ApiError);
        }
    },

    /**
     * Crea una nueva muestra
     */
    async createMuestra(muestra: Muestra) {
        try {
            const response = await axios.post(API_URLS.MUESTRAS, muestra);
            return response.data;
        } catch (error) {
            handleApiError(error as ApiError);
        }
    },

    /**
     * Actualiza una muestra existente
     */
    async updateMuestra(id: string, muestra: Partial<Muestra>) {
        try {
            const response = await axios.put(`${API_URLS.MUESTRAS}/${id}`, muestra);
            return response.data;
        } catch (error) {
            handleApiError(error as ApiError);
        }
    },

    /**
     * Elimina una muestra
     */
    async deleteMuestra(id: string) {
        try {
            await axios.delete(`${API_URLS.MUESTRAS}/${id}`);
        } catch (error) {
            handleApiError(error as ApiError);
        }
    },

    /**
     * Obtiene los análisis fisicoquímicos disponibles
     */
    async getAnalisisFisicoquimicos() {
        try {
            const response = await axios.get(API_URLS.ANALISIS_FISICOQUIMICOS);
            return response.data;
        } catch (error) {
            handleApiError(error as ApiError);
        }
    },

    /**
     * Obtiene los análisis microbiológicos disponibles
     */
    async getAnalisisMicrobiologicos() {
        try {
            const response = await axios.get(API_URLS.ANALISIS_MICROBIOLOGICOS);
            return response.data;
        } catch (error) {
            handleApiError(error as ApiError);
        }
    }
}; 