import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const RegistroMuestras = () => {
  const [formData, setFormData] = useState({
    tipoMuestreo: "",
    tipoAgua: "",
    descripcion: "",
    analisisSeleccionados: [],
    documento: "",
  });

  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [validatingUser, setValidatingUser] = useState(false);
  const [userValidationError, setUserValidationError] = useState(null);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Lista de análisis disponibles según la API
  const analisisDisponibles = [
    {
      categoria: "Análisis Básicos",
      analisis: [
        "pH",
        "turbidez",
        "conductividad",
        "temperatura",
        "oxigenoDisuelto",
        "nitratos",
        "fosfatos"
      ]
    }
  ];

  // Manejar cambios en formData
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null);
  };

  // Manejar checkbox de análisis
  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      analisisSeleccionados: checked
        ? [...prev.analisisSeleccionados, value]
        : prev.analisisSeleccionados.filter((item) => item !== value),
    }));
  };

  // Validar usuario por documento
  const handleValidateUser = async () => {
    if (!formData.documento) {
      setUserValidationError("Por favor ingrese el número de documento.");
      return;
    }
    setValidatingUser(true);
    setUserValidationError(null);

    try {
      const token = localStorage.getItem("token");
      // Cambiamos la URL para obtener los datos del rol
      const response = await axios.get(
        `https://back-usuarios-f.onrender.com/api/usuarios/roles/67d8c23082d1ef13162bdc18`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.data && response.data.rol) {
        // Verificamos que el usuario sea administrador
        if (response.data.rol.name === "administrador") {
          setClienteEncontrado({
            nombre: response.data.nombre,
            email: response.data.email,
            documento: response.data.documento,
            rol: response.data.rol,
            activo: response.data.activo
          });
          setUserValidationError(null);
        } else {
          setUserValidationError("El usuario no tiene permisos de administrador.");
          setClienteEncontrado(null);
        }
      } else {
        setUserValidationError("Usuario no encontrado o sin rol asignado.");
        setClienteEncontrado(null);
      }
    } catch (error) {
      console.error('Error de validación:', error);
      setUserValidationError("Error al validar el usuario: " + (error.response?.data?.message || error.message));
      setClienteEncontrado(null);
    }
    setValidatingUser(false);
  };

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Validaciones básicas
    if (
      !formData.tipoMuestreo ||
      !formData.tipoAgua ||
      formData.analisisSeleccionados.length === 0
    ) {
      setError("⚠ Todos los campos son obligatorios.");
      setLoading(false);
      return;
    }

    // Verificar que el usuario sea administrador
    if (!clienteEncontrado || clienteEncontrado.rol.name !== "administrador") {
      setError("⚠ Se requieren permisos de administrador para registrar muestras.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      // Si el tipo de agua es "Otra", registramos primero el nuevo tipo
      if (formData.tipoAgua === "Otra") {
        await axios.post(
          "https://daniel-back-dom.onrender.com/api/registro-muestras/tipos-agua",
          {
            tipo: formData.tipoPersonalizado || "Otro",
            descripcion: formData.descripcion,
            parametrosRecomendados: formData.analisisSeleccionados
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // Registramos la muestra
      const response = await axios.post(
        "https://daniel-back-dom.onrender.com/api/registro-muestras/muestras",
        {
          tipoMuestreo: formData.tipoMuestreo,
          analisisSeleccionados: formData.analisisSeleccionados,
          tipoDeAgua: {
            tipo: formData.tipoAgua === "Otra" ? formData.tipoPersonalizado : formData.tipoAgua,
            descripcion: formData.descripcion || formData.tipoAgua
          },
          usuario: {
            id: clienteEncontrado._id,
            nombre: clienteEncontrado.nombre,
            rol: clienteEncontrado.rol.name
          }
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("✔ Muestra registrada exitosamente.");
      setTimeout(() => navigate("/muestras"), 2000);
    } catch (error) {
      console.error("Error al registrar la muestra:", error);
      setError(error.response?.data?.message || "Error al registrar la muestra.");
    }

    setLoading(false);
  };

  return (
    <Paper sx={{ padding: 3, maxWidth: 800, margin: "auto", marginTop: 3 }}>
      <Typography variant="h5" gutterBottom>
        Registro de Muestra
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {userValidationError && <Alert severity="error" sx={{ mb: 2 }}>{userValidationError}</Alert>}

      <form onSubmit={handleSubmit} autoComplete="off">
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Documento de Identidad"
            name="documento"
            value={formData.documento}
            onChange={handleChange}
          />
          <Button
            variant="contained"
            onClick={handleValidateUser}
            disabled={validatingUser}
            sx={{ minWidth: '120px' }}
          >
            {validatingUser ? <CircularProgress size={24} /> : "Validar"}
          </Button>
        </Box>

        {clienteEncontrado && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Usuario validado: {clienteEncontrado.nombre} - Rol: {clienteEncontrado.rol.name}
          </Alert>
        )}

        <Select
          fullWidth
          name="tipoMuestreo"
          value={formData.tipoMuestreo}
          onChange={handleChange}
          displayEmpty
          sx={{ mb: 2 }}
        >
          <MenuItem value="">Seleccione tipo de muestreo</MenuItem>
          <MenuItem value="simple">Simple</MenuItem>
          <MenuItem value="compuesto">Compuesto</MenuItem>
          <MenuItem value="continuo">Continuo</MenuItem>
        </Select>

        <Select
          fullWidth
          name="tipoAgua"
          value={formData.tipoAgua}
          onChange={handleChange}
          displayEmpty
          sx={{ mb: 2 }}
        >
          <MenuItem value="">Seleccione tipo de agua</MenuItem>
          <MenuItem value="potable">Potable</MenuItem>
          <MenuItem value="natural">Natural</MenuItem>
          <MenuItem value="residual">Residual</MenuItem>
          <MenuItem value="Otra">Otra</MenuItem>
        </Select>

        {formData.tipoAgua === "Otra" && (
          <TextField
            fullWidth
            label="Descripción del tipo de agua"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
        )}

        <Typography variant="body1" sx={{ mb: 1 }}>
          Análisis a realizar:
        </Typography>

        {analisisDisponibles.map((categoria, index) => (
          <Accordion key={index} sx={{ mb: 1, boxShadow: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ backgroundColor: "#f5f5f5" }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                {categoria.categoria}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {categoria.analisis.map((analisis, idx) => (
                <FormControlLabel
                  key={idx}
                  control={
                    <Checkbox
                      value={analisis}
                      checked={formData.analisisSeleccionados.includes(analisis)}
                      onChange={handleCheckboxChange}
                    />
                  }
                  label={analisis}
                />
              ))}
            </AccordionDetails>
          </Accordion>
        ))}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading || !clienteEncontrado}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : "Registrar Muestra"}
        </Button>
      </form>
    </Paper>
  );
};

export default RegistroMuestras; 