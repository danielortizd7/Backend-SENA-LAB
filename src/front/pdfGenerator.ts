import axios from 'axios';

// ----- URLs para las peticiones -----
const BASE_URLS = {
    // Usar URL local para desarrollo
    MUESTRAS: "http://localhost:5000/api",
};

const API_URLS = {
    MUESTRAS: {
        // Endpoints para PDF de muestras
        GENERAR: (idMuestra: string) => `${BASE_URLS.MUESTRAS}/firma-digital/generar-pdf/${idMuestra}`,
    },
    RESULTADOS: {
        // Endpoints para PDF de resultados
        GENERAR: (idMuestra: string) => `${BASE_URLS.MUESTRAS}/ingreso-resultados/${idMuestra}/pdf`,
        DESCARGAR: (idMuestra: string) => `${BASE_URLS.MUESTRAS}/ingreso-resultados/${idMuestra}/pdf/download`,
    }
};

/**
 * Obtiene el token de autenticación del localStorage y los headers necesarios
 */
const getAuthHeaders = () => ({
    'Accept': 'application/pdf',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

/**
 * Servicio para manejar la generación y descarga de PDFs
 */
export const PDFService = {
    /**
     * Genera y obtiene el PDF de una muestra (sin resultados)
     * @param idMuestra - ID de la muestra
     */
    async generarPDFMuestra(idMuestra: string): Promise<void> {
        try {
            console.log('Generando PDF de muestra:', idMuestra);
            const response = await axios({
                url: API_URLS.MUESTRAS.GENERAR(idMuestra),
                method: 'GET',
                responseType: 'blob',
                headers: getAuthHeaders()
            });

            if (response.data) {
                const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
                const pdfUrl = window.URL.createObjectURL(pdfBlob);
                window.open(pdfUrl, '_blank');

                setTimeout(() => {
                    window.URL.revokeObjectURL(pdfUrl);
                }, 100);
            } else {
                throw new Error('La respuesta del servidor está vacía');
            }
        } catch (error: any) {
            console.error('Error al generar PDF de muestra:', error.response || error);
            const errorMessage = error.response?.data?.message || 
                               error.response?.statusText || 
                               'No se pudo generar el PDF de la muestra';
            throw new Error(errorMessage);
        }
    },

    /**
     * Descarga el PDF de una muestra
     * @param idMuestra - ID de la muestra
     */
    async descargarPDFMuestra(idMuestra: string): Promise<void> {
        try {
            console.log('Descargando PDF de muestra:', idMuestra);
            const response = await axios({
                url: API_URLS.MUESTRAS.GENERAR(idMuestra),
                method: 'GET',
                responseType: 'blob',
                headers: getAuthHeaders()
            });

            if (!response.data || response.data.size === 0) {
                throw new Error('El PDF descargado está vacío');
            }

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const downloadUrl = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `Muestra_${idMuestra}.pdf`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => {
                window.URL.revokeObjectURL(downloadUrl);
            }, 100);
        } catch (error: any) {
            console.error('Error al descargar PDF de muestra:', error);
            const errorMessage = error.response?.data?.message || 
                               error.response?.statusText || 
                               error.message ||
                               'No se pudo descargar el PDF de la muestra';
            throw new Error(errorMessage);
        }
    },

    /**
     * Genera y obtiene el PDF de resultados de una muestra
     * @param idMuestra - ID de la muestra
     */
    async generarPDFResultados(idMuestra: string): Promise<void> {
        try {
            console.log('Generando PDF de resultados:', idMuestra);
            const response = await axios({
                url: API_URLS.RESULTADOS.GENERAR(idMuestra),
                method: 'GET',
                responseType: 'blob',
                headers: {
                    ...getAuthHeaders(),
                    'Accept': 'application/pdf',
                }
            });

            // Verificar que la respuesta no esté vacía y sea un PDF
            if (!response.data || response.data.size === 0) {
                throw new Error('El PDF generado está vacío');
            }

            // Verificar el tipo de contenido
            const contentType = response.headers['content-type'];
            if (!contentType || !contentType.includes('application/pdf')) {
                console.warn('Tipo de contenido inesperado:', contentType);
            }

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            
            // Verificar que el blob no esté vacío
            if (pdfBlob.size === 0) {
                throw new Error('El PDF generado está vacío');
            }

            const pdfUrl = window.URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');

            setTimeout(() => {
                window.URL.revokeObjectURL(pdfUrl);
            }, 100);
        } catch (error: any) {
            console.error('Error al generar PDF de resultados:', error);
            const errorMessage = error.response?.data?.message || 
                               error.response?.statusText || 
                               error.message ||
                               'No se pudo generar el PDF de resultados';
            throw new Error(errorMessage);
        }
    },

    /**
     * Descarga el PDF de resultados de una muestra
     * @param idMuestra - ID de la muestra
     */
    async descargarPDFResultados(idMuestra: string): Promise<void> {
        try {
            console.log('Descargando PDF de resultados:', idMuestra);
            const response = await axios({
                url: API_URLS.RESULTADOS.DESCARGAR(idMuestra),
                method: 'GET',
                responseType: 'blob',
                headers: {
                    ...getAuthHeaders(),
                    'Accept': 'application/pdf',
                }
            });

            // Verificar la respuesta
            if (!response.data || response.data.size === 0) {
                throw new Error('El PDF descargado está vacío');
            }

            // Verificar el tipo de contenido
            const contentType = response.headers['content-type'];
            if (!contentType || !contentType.includes('application/pdf')) {
                console.warn('Tipo de contenido inesperado:', contentType);
            }

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            
            // Verificar el tamaño del blob
            if (pdfBlob.size === 0) {
                throw new Error('El PDF descargado está vacío');
            }

            const downloadUrl = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `Resultados_Muestra_${idMuestra}.pdf`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => {
                window.URL.revokeObjectURL(downloadUrl);
            }, 100);
        } catch (error: any) {
            console.error('Error al descargar PDF de resultados:', error);
            const errorMessage = error.response?.data?.message || 
                               error.response?.statusText || 
                               error.message ||
                               'No se pudo descargar el PDF de resultados';
            throw new Error(errorMessage);
        }
    },
};

