import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Modal,
  Backdrop,
  Fade
} from '@mui/material';
import { API_URLS } from '../constants/apiUrls';

const RegistroMuestras: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    documento: '',
    tipoDeAgua: {
      tipo: '',
      codigo: '',
      descripcion: '',
      subtipoResidual: ''
    },
    tipoMuestreo: '',
    lugarMuestreo: '',
    fechaHoraMuestreo: '',
    tipoAnalisis: '',
    identificacionMuestra: '',
    planMuestreo: '',
    condicionesAmbientales: '',
    preservacionMuestra: '',
    preservacionMuestraOtra: '',
    analisisSeleccionados: [],
    firmas: {
      firmaAdministrador: {
        firma: '',
        fecha: ''
      },
      firmaCliente: {
        firma: '',
        fecha: ''
      }
    },
    observaciones: '',
    estado: 'Recibida'
  });

  const [isRejected, setIsRejected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [validatingUser, setValidatingUser] = useState(false);
  const [openRechazoModal, setOpenRechazoModal] = useState(false);
  const [observacionRechazo, setObservacionRechazo] = useState('');
  const [mostrarFirmas, setMostrarFirmas] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleValidateUser = async () => {
    setValidatingUser(true);
    setError('');

    try {
      const response = await axios.get(
        `${API_URLS.USUARIOS}/buscar`,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          },
          params: { documento: formData.documento }
        }
      );

      if (response.data) {
        setClienteEncontrado(response.data);
        setError(null);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(`Error: ${errorMessage}`);
    } finally {
      setValidatingUser(false);
    }
  };

  const handleConfirmarRechazo = () => {
    if (!observacionRechazo.trim()) {
      setError("Debe ingresar el motivo de rechazo.");
      return;
    }
    setIsRejected(true);
    setFormData(prev => ({
      ...prev,
      estado: 'Rechazada',
      observaciones: observacionRechazo
    }));
    setOpenRechazoModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRejected && !observacionRechazo.trim()) {
      setError("El motivo de rechazo es requerido");
      return;
    }

    // Si no se están mostrando las firmas y no es un rechazo, mostrarlas y no enviar el formulario
    if (!mostrarFirmas && !isRejected) {
      const errores = validarFormulario(formData);
      // Filtrar errores de firma ya que aún no se muestran
      const erroresSinFirmas = Object.entries(errores).reduce((acc, [key, value]) => {
        if (!key.includes('firma')) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);

      if (Object.keys(erroresSinFirmas).length > 0) {
        setError(Object.values(erroresSinFirmas).join(' - '));
        return;
      }

      setMostrarFirmas(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const errores = validarFormulario(formData);
      if (Object.keys(errores).length > 0 && !isRejected) {
        setError(Object.values(errores).join(' - '));
        setLoading(false);
        return;
      }

      const muestraData = {
        documento: formData.documento,
        tipoDeAgua: {
          tipo: formData.tipoDeAgua.tipo,
          codigo: formData.tipoDeAgua.codigo,
          descripcion: formData.tipoDeAgua.descripcion,
          subtipoResidual: formData.tipoDeAgua.subtipo
        },
        tipoMuestreo: formData.tipoMuestreo,
        lugarMuestreo: formData.lugarMuestreo,
        fechaHoraMuestreo: new Date(formData.fechaHoraMuestreo).toISOString(),
        tipoAnalisis: formData.tipoAnalisis,
        identificacionMuestra: formData.identificacionMuestra,
        planMuestreo: formData.planMuestreo,
        condicionesAmbientales: formData.condicionesAmbientales,
        preservacionMuestra: formData.preservacionMuestra,
        descripcion: formData.preservacionMuestra === 'Otro' ? formData.preservacionMuestraOtra : undefined,
        analisisSeleccionados: formData.analisisSeleccionados,
        firmas: isRejected ? {} : {
          firmaAdministrador: {
            firma: formData.firmas.firmaAdministrador.firma,
            fecha: new Date().toISOString()
          },
          firmaCliente: {
            firma: formData.firmas.firmaCliente.firma,
            fecha: new Date().toISOString()
          }
        },
        observaciones: isRejected ? observacionRechazo : formData.observaciones || '',
        estado: isRejected ? 'Rechazada' : 'Recibida'
      };

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No se encontró el token de autenticación');

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(
        API_URLS.MUESTRAS,
        muestraData,
        { headers }
      );

      setSuccess(isRejected ? '✔ Muestra rechazada exitosamente' : '✔ Muestra registrada exitosamente');
      limpiarEstado();

      // Redirigir después de un registro exitoso
      setTimeout(() => {
        navigate('/muestras');
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRechazoModal = () => {
    setOpenRechazoModal(false);
  };

  const limpiarEstado = () => {
    setIsRejected(false);
    setObservacionRechazo('');
    setOpenRechazoModal(false);
    setMostrarFirmas(false);
    setFormData({
      documento: '',
      tipoDeAgua: {
        tipo: '',
        codigo: '',
        descripcion: '',
        subtipoResidual: ''
      },
      tipoMuestreo: '',
      lugarMuestreo: '',
      fechaHoraMuestreo: '',
      tipoAnalisis: '',
      identificacionMuestra: '',
      planMuestreo: '',
      condicionesAmbientales: '',
      preservacionMuestra: '',
      preservacionMuestraOtra: '',
      analisisSeleccionados: [],
      firmas: {
        firmaAdministrador: {
          firma: '',
          fecha: ''
        },
        firmaCliente: {
          firma: '',
          fecha: ''
        }
      },
      observaciones: '',
      estado: 'Recibida'
    });
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, margin: "auto", marginTop: 3 }}>
      <Typography variant="h5" gutterBottom>
        Registro de Muestra
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <TextField
            fullWidth
            label="Número de Documento"
            name="documento"
            value={formData.documento}
            onChange={handleChange}
            required
          />
          <Button
            variant="outlined"
            onClick={handleValidateUser}
            sx={{ ml: 1, height: "56px" }}
            disabled={validatingUser || !formData.documento}
          >
            {validatingUser ? <CircularProgress size={24} /> : "Validar"}
          </Button>
        </Box>

        {clienteEncontrado && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Cliente Validado:
            </Typography>
            <Typography>Nombre: {clienteEncontrado.nombre}</Typography>
            <Typography>Documento: {clienteEncontrado.documento}</Typography>
            <Typography>Correo: {clienteEncontrado.email}</Typography>
          </Box>
        )}

        <Button
          variant="contained"
          color="error"
          onClick={() => setOpenRechazoModal(true)}
          sx={{ mb: 2 }}
          fullWidth
        >
          Rechazar Muestra
        </Button>

        <Button
          type="submit"
          variant="contained"
          color={isRejected ? "error" : "primary"}
          fullWidth
          disabled={loading || (isRejected && !observacionRechazo.trim())}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : isRejected ? (
            'Confirmar Rechazo de Muestra'
          ) : (
            'Registrar Muestra'
          )}
        </Button>
      </form>

      <Modal
        open={openRechazoModal}
        onClose={handleCloseRechazoModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openRechazoModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 1,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Rechazar Muestra
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Por favor, ingrese el motivo por el cual se rechaza la muestra.
            </Typography>
            <TextField
              fullWidth
              label="Motivo de rechazo"
              name="observacionRechazo"
              value={observacionRechazo}
              onChange={(e) => setObservacionRechazo(e.target.value)}
              multiline
              rows={3}
              required
              error={!observacionRechazo.trim()}
              helperText={!observacionRechazo.trim() ? "El motivo de rechazo es requerido" : ""}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={handleCloseRechazoModal}
                fullWidth
              >
                Cancelar
              </Button>
              <Button 
                variant="contained" 
                color="error" 
                fullWidth 
                onClick={handleConfirmarRechazo}
                disabled={!observacionRechazo.trim()}
              >
                Confirmar Rechazo
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Paper>
  );
};

export default RegistroMuestras; 