import axios from 'axios';

interface ResultadosData {
  idMuestra: string;
  analisis: {
    [key: string]: {
      valor: string;
      unidad: string;
      observaciones?: string;
    };
  };
  observaciones?: string;
}

class ResultadosService {
  private API_URL = 'https://backend-registro-muestras.onrender.com/api/ingreso-resultados';

  private getHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No se encontró el token de autenticación');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async obtenerTodosLosResultados() {
    try {
      const response = await axios.get(
        `${this.API_URL}/resultados`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async obtenerResultadoPorMuestra(idMuestra: string) {
    try {
      const response = await axios.get(
        `${this.API_URL}/muestra/${idMuestra}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async registrarResultados(idMuestra: string, resultados: ResultadosData) {
    try {
      const response = await axios.post(
        `${this.API_URL}/registrar/${idMuestra}`,
        resultados,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async editarResultados(idMuestra: string, resultados: ResultadosData) {
    try {
      const response = await axios.put(
        `${this.API_URL}/editar/${idMuestra}`,
        resultados,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async verificarResultados(idMuestra: string, observaciones: string) {
    try {
      const response = await axios.post(
        `${this.API_URL}/verificar/${idMuestra}`,
        { observaciones },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  private handleError(error: any) {
    console.error('Error en la operación:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
    }
    throw new Error(error.response?.data?.message || 'Error en la operación');
  }
}

export const resultadosService = new ResultadosService(); 