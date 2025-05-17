import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api'; // Cambia a tu URL de producción si es necesario

const API_URLS = {
  AUDITORIA: {
    EXPORTAR_EXCEL: `${BASE_URL}/auditoria/exportar-excel`,
    EXPORTAR_EXCEL_VISUALIZAR: `${BASE_URL}/auditoria/exportar-excel-visualizar`,
    SEMANALES: `${BASE_URL}/auditoria/semanales`,
    MENSUALES: `${BASE_URL}/auditoria/mensuales`,
    DATOS: `${BASE_URL}/auditoria/datos`,
    HISTORIAL_PARAMETRO: `${BASE_URL}/auditoria/historial-parametro`,
    MUESTRA_DETALLE: `${BASE_URL}/auditoria/muestra-detalle`,
  },
};

const getAuthHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

const openExcelInNewWindow = (excelBlob, preOpenedWindow) => {
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

const downloadExcel = (excelBlob, filename) => {
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

export const excelGenerator = {
  async obtenerDatosAuditoria() {
    try {
      const response = await axios({
        url: API_URLS.AUDITORIA.DATOS,
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw new Error(
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        'No se pudieron obtener los datos de auditoría'
      );
    }
  },

  async obtenerHistorialParametro(parametroId, fechaInicio, fechaFin) {
    try {
      const response = await axios({
        url: `${API_URLS.AUDITORIA.HISTORIAL_PARAMETRO}/${parametroId}`,
        method: 'GET',
        params: { fechaInicio, fechaFin },
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw new Error(
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        'No se pudo obtener el historial del parámetro'
      );
    }
  },

  async obtenerMuestraDetalle(muestraId) {
    try {
      const response = await axios({
        url: `${API_URLS.AUDITORIA.MUESTRA_DETALLE}/${muestraId}`,
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw new Error(
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        'No se pudo obtener el detalle de la muestra'
      );
    }
  },

  async generarExcelAuditoria(tipo = 'download', periodo = 'general', fechaInicio, fechaFin) {
    let preOpenedWindow = null;
    try {
      let url = API_URLS.AUDITORIA.EXPORTAR_EXCEL;
      
      // Determinar la URL según el tipo y período
      if (tipo === 'view') {
        url = API_URLS.AUDITORIA.EXPORTAR_EXCEL_VISUALIZAR;
      }
      
      // Agregar parámetros de fecha si se proporcionan
      if (fechaInicio && fechaFin) {
        url += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      }

      if (tipo === 'view') {
        preOpenedWindow = window.open('', '_blank');
      }

      const response = await axios({
        url,
        method: 'GET',
        responseType: 'blob',
        headers: getAuthHeaders(),
      });

      if (!response.data) {
        throw new Error('No se recibió el archivo Excel');
      }

      const excelBlob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      if (tipo === 'view') {
        openExcelInNewWindow(excelBlob, preOpenedWindow);
      } else {
        downloadExcel(excelBlob, `auditoria_${periodo}.xlsx`);
      }
    } catch (error) {
      if (preOpenedWindow) preOpenedWindow.close();
      console.error('Error al generar Excel de auditoría:', error);
      throw new Error(
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        'No se pudo generar el Excel de auditoría'
      );
    }
  },

  async obtenerAuditoriasSemanales(fechaInicio, fechaFin) {
    try {
      const response = await axios({
        url: `${API_URLS.AUDITORIA.SEMANALES}?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw new Error(
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        'No se pudieron obtener las auditorías semanales'
      );
    }
  },

  async obtenerAuditoriasMensuales(fechaInicio, fechaFin) {
    try {
      const response = await axios({
        url: `${API_URLS.AUDITORIA.MENSUALES}?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw new Error(
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        'No se pudieron obtener las auditorías mensuales'
      );
    }
  }
};
