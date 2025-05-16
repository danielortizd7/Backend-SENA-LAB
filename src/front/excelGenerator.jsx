import React, { useState } from 'react';
import { ExcelService } from './services/excel.service';

const ExcelGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateExcel = async () => {
    setLoading(true);
    setError(null);
    try {
      await ExcelService.generarExcelAuditoria();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleGenerateExcel} disabled={loading}>
        {loading ? 'Generando Excel...' : 'Descargar/Visualizar Excel de Auditorías'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ExcelGenerator;
