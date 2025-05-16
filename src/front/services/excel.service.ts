import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api'; // Cambia a tu URL de producción si es necesario

const API_URLS = {
  AUDITORIA: {
    EXPORTAR_EXCEL: `${BASE_URL}/auditoria/exportar-excel`,
  },
};

const getAuthHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

const isValidExcelResponse = (response: any): boolean => {
  const contentType = response.headers['content-type'];
  return contentType && (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || contentType.includes('application/octet-stream')) && response.data;
};

const openExcelInNewWindow = (excelBlob: Blob, preOpenedWindow?: Window | null): void => {
  const excelUrl = window.URL.createObjectURL(excelBlob);
  const win = preOpenedWindow || window.open('', '_blank');
  if (win) {
    win.location.href = excelUrl;
    setTimeout(() => {
      window.URL.revokeObjectURL(excelUrl);
    }, 1000);
  } else {
    downloadExcel(excelBlob, 'auditoria.xlsx');
  }
};

const downloadExcel = (excelBlob: Blob, filename: string): void => {
  const downloadUrl = window.URL.createObjectURL(excelBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl);
  }, 1000);
};

export const ExcelService = {
  async generarExcelAuditoria(): Promise<void> {
    let preOpenedWindow: Window | null = null;
    try {
      preOpenedWindow = window.open('', '_blank');
      const response = await axios({
        url: API_URLS.AUDITORIA.EXPORTAR_EXCEL,
        method: 'GET',
        responseType: 'blob',
        headers: getAuthHeaders(),
      });

      if (!response.data) {
        throw new Error('No se recibió el archivo Excel');
      }

      // Intentar abrir en nueva ventana, si no, descargar
      const excelBlob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      openExcelInNewWindow(excelBlob, preOpenedWindow);
    } catch (error: any) {
      if (preOpenedWindow) preOpenedWindow.close();
      console.error('Error al generar Excel de auditoría:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'No se pudo generar el Excel de auditoría'
      );
    }
  },
  async descargarExcelAuditoria(): Promise<void> {
    try {
      const response = await axios({
        url: API_URLS.AUDITORIA.EXPORTAR_EXCEL,
        method: 'GET',
        responseType: 'blob',
        headers: getAuthHeaders(),
      });
      if (!response.data) {
        throw new Error('No se recibió el archivo Excel');
      }
      const excelBlob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      downloadExcel(excelBlob, 'auditoria.xlsx');
    } catch (error: any) {
      console.error('Error al descargar Excel de auditoría:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'No se pudo descargar el Excel de auditoría'
      );
    }
  },
}; 