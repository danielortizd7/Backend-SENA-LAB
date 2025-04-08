import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  CircularProgress,
  Chip,
  TextField
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { resultadosService } from '../services/resultados.service';

const ListaResultados = () => {
  const navigate = useNavigate();
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const cargarResultados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = userData.rol?.toLowerCase();
      
      if (!userRole || (userRole !== 'laboratorista' && userRole !== 'administrador')) {
        setError('No tienes autorización para ver esta página.');
        navigate('/login');
        return;
      }

      const data = await resultadosService.obtenerTodosLosResultados();
      
      if (Array.isArray(data)) {
        setResultados(data);
      } else {
        console.warn('Formato de respuesta inesperado:', data);
        setResultados([]);
        setError('No se encontraron resultados para mostrar');
      }
    } catch (err) {
      console.error('Error al cargar resultados:', err);
      setError(err.message || 'Error al cargar los resultados');
      
      if (err.message.includes('Sesión expirada')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarResultados();
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleVerDetalles = (resultado) => {
    navigate(`/registrar-resultados/${resultado.idMuestra}`);
  };

  const filteredResultados = resultados.filter((resultado) =>
    resultado.idMuestra?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Paper sx={{ p: 4, margin: 'auto', maxWidth: 1200, mt: 4, bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#333', fontWeight: 'bold' }}>
          Lista de Resultados
        </Typography>
        <Button
          variant="contained"
          onClick={cargarResultados}
          disabled={loading}
          sx={{
            bgcolor: '#39A900',
            '&:hover': { bgcolor: '#2d8000' }
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Recargar'}
        </Button>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        label="Buscar por ID de muestra"
        value={searchTerm}
        onChange={handleSearchChange}
        sx={{ mb: 3 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredResultados.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay resultados disponibles
        </Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#39A900' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID Muestra</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cliente</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredResultados.map((resultado) => (
                <TableRow 
                  key={resultado._id || resultado.idMuestra}
                  sx={{
                    '&:hover': {
                      bgcolor: 'rgba(57, 169, 0, 0.04)',
                    }
                  }}
                >
                  <TableCell>{resultado.idMuestra}</TableCell>
                  <TableCell>
                    {resultado.cliente?.nombre || 'No especificado'}
                  </TableCell>
                  <TableCell>
                    {new Date(resultado.fechaHoraMuestreo).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={resultado.verificado ? "Verificado" : "Pendiente"}
                      color={resultado.verificado ? "success" : "warning"}
                      sx={{
                        bgcolor: resultado.verificado ? '#39A900' : '#FF9800',
                        color: 'white'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      onClick={() => handleVerDetalles(resultado)}
                      sx={{
                        bgcolor: '#39A900',
                        '&:hover': {
                          bgcolor: '#2d8000',
                        }
                      }}
                    >
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default ListaResultados; 