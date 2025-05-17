import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Divider,
  CircularProgress
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { excelGenerator } from "../services/excelGenerator";

const BASE_URLS = {
  USUARIOS: "https://backend-sena-lab-1-qpzp.onrender.com/api",
  MUESTRAS: "http://localhost:5000/api"
};

const API_URLS = {
  USUARIOS: `${BASE_URLS.USUARIOS}/usuarios`,
  MUESTRAS: `${BASE_URLS.MUESTRAS}/muestras`,
  ANALISIS: `${BASE_URLS.MUESTRAS}/analisis`,
  ANALISIS_FISICOQUIMICOS: `${BASE_URLS.MUESTRAS}/analisis/fisicoquimico`,
  ANALISIS_MICROBIOLOGICOS: `${BASE_URLS.MUESTRAS}/analisis/microbiologico`
};

const ExcelGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [selectedParameter, setSelectedParameter] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [auditData, setAuditData] = useState({
    muestras: [],
    parametros: [],
    historial: []
  });
  const [filteredData, setFilteredData] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [analisisDisponibles, setAnalisisDisponibles] = useState([]);

  useEffect(() => {
    loadInitialData();
    fetchAnalisisDisponibles();
  }, []);

  const fetchAnalisisDisponibles = async () => {
    try {
      const res = await fetch(API_URLS.ANALISIS);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAnalisisDisponibles(data);
      } else if (Array.isArray(data.analisis)) {
        setAnalisisDisponibles(data.analisis);
      }
    } catch (e) {
      setAnalisisDisponibles([]);
    }
  };

  const loadInitialData = async () => {
    setInitialLoading(true);
    setError(null);
    try {
      const response = await excelGenerator.obtenerDatosAuditoria();
      const data = response.data || {};
      setAuditData({
        muestras: Array.isArray(data.muestras) ? data.muestras : [],
        parametros: Array.isArray(data.parametros) ? data.parametros : [],
        historial: Array.isArray(data.historial) ? data.historial : []
      });
      setFilteredData(Array.isArray(data.muestras) ? data.muestras : []);
    } catch (err) {
      setError('Error al cargar los datos iniciales');
      setAuditData({ muestras: [], parametros: [], historial: [] });
      setFilteredData([]);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleParameterChange = (event) => {
    const parameter = event.target.value;
    setSelectedParameter(parameter);
    if (parameter) {
      const filtered = (auditData.muestras || []).filter(muestra =>
        (muestra.parametros || []).includes(parameter)
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(auditData.muestras || []);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleDownloadExcel = async (periodo = 'general') => {
    setLoading(true);
    setError(null);
    try {
      await excelGenerator.generarExcelAuditoria('download', periodo, fechaInicio, fechaFin);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewExcel = async (periodo = 'general') => {
    setLoading(true);
    setError(null);
    try {
      await excelGenerator.generarExcelAuditoria('view', periodo, fechaInicio, fechaFin);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderTimeline = (historial) => {
    if (!historial.length) {
      return <Typography color="textSecondary">No hay historial para este parámetro.</Typography>;
    }
    return (
      <Box component="ol" sx={{ pl: 2, borderLeft: '3px solid #1976d2', ml: 1 }}>
        {historial.map((evento, index) => (
          <Box component="li" key={index} sx={{ mb: 3, position: 'relative' }}>
            <Box sx={{ position: 'absolute', left: -28, top: 2 }}>
              <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: evento.tipo === 'creacion' ? '#1976d2' : '#9c27b0', border: '2px solid white', boxShadow: 1 }} />
            </Box>
            <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 600 }}>{evento.fecha}</Typography>
            <Typography sx={{ mb: 1 }}>{evento.descripcion}</Typography>
            {evento.cambios && (
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(evento.cambios).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    size="small"
                    color="info"
                  />
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <div>
      {initialLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Filtros y Controles */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Fecha Inicio"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Fecha Fin"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Parámetro</InputLabel>
                      <Select
                        value={selectedParameter}
                        onChange={handleParameterChange}
                        label="Parámetro"
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {analisisDisponibles.map((param) => (
                          <MenuItem key={param.nombre} value={param.nombre}>
                            {param.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<RefreshIcon />}
                      onClick={loadInitialData}
                    >
                      Actualizar
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Tabs de Visualización */}
          <Grid item xs={12}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={selectedTab} onChange={handleTabChange}>
                <Tab label="Lista de Muestras" />
                <Tab label="Historial de Parámetros" />
                <Tab label="Reportes" />
              </Tabs>
            </Box>
          </Grid>

          {/* Contenido de las Tabs */}
          <Grid item xs={12}>
            {selectedTab === 0 && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID Muestra</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Fecha Ingreso</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Parámetros</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(filteredData || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ color: '#888' }}>
                          No hay muestras para mostrar
                        </TableCell>
                      </TableRow>
                    ) : (
                      (filteredData || []).map((muestra) => (
                        <TableRow key={muestra.id}>
                          <TableCell>{muestra.id}</TableCell>
                          <TableCell>{muestra.cliente}</TableCell>
                          <TableCell>{muestra.fechaIngreso}</TableCell>
                          <TableCell>
                            <Chip
                              label={muestra.estado}
                              color={muestra.estado === 'Finalizado' ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>
                            {(muestra.parametros || []).map((param) => (
                              <Chip
                                key={param}
                                label={param}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                            ))}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {selectedTab === 1 && (
              <Card>
                <CardContent>
                  {selectedParameter ? (
                    renderTimeline((auditData.historial || []).filter(h => h.parametro === selectedParameter))
                  ) : (
                    <Typography color="textSecondary">
                      Seleccione un parámetro para ver su historial
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {selectedTab === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Reporte General
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={() => handleDownloadExcel('general')}
                        disabled={loading}
                        startIcon={<DownloadIcon />}
                      >
                        Descargar Excel
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Reporte Semanal
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={() => handleDownloadExcel('semanal')}
                        disabled={loading}
                        startIcon={<DownloadIcon />}
                      >
                        Descargar Excel
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Reporte Mensual
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        color="info"
                        onClick={() => handleDownloadExcel('mensual')}
                        disabled={loading}
                        startIcon={<DownloadIcon />}
                      >
                        Descargar Excel
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Grid>
        </Grid>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </div>
  );
};

const Auditorias = () => {
  return (
    <Paper sx={{ padding: 4, maxWidth: 1400, margin: '32px auto', boxShadow: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#222', mb: 3 }}>
        Módulo de Auditorías
      </Typography>
      <ExcelGenerator />
    </Paper>
  );
};

export default Auditorias;
