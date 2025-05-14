import React, { useState } from 'react';

const ExcelGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

  const handleGenerateExcel = async () => {
    setLoading(true);
    setError(null);
    setFileUrl(null);
    try {
      // Realizar petición al backend para generar el Excel
      const response = await fetch('/auditoria/exportar-excel?fechaInicio=&fechaFin=', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al generar el archivo Excel');
      }

      const data = await response.json();

      if (data.success && data.fileUrl) {
        setFileUrl(data.fileUrl);
        // Descargar el archivo automáticamente
        const link = document.createElement('a');
        link.href = data.fileUrl;
        link.download = data.fileUrl.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('No se recibió la URL del archivo');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleGenerateExcel} disabled={loading}>
        {loading ? 'Generando Excel...' : 'Descargar Excel de Auditorías'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {fileUrl && (
        <p>
          Archivo generado: <a href={fileUrl} target="_blank" rel="noopener noreferrer">{fileUrl}</a>
        </p>
      )}
    </div>
  );
};

export default ExcelGenerator;
