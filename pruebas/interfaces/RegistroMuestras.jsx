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
  Modal,
  Backdrop,
  Fade,
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
  });

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

    try {
      const token = localStorage.getItem("token");
      
      // Primero registramos el tipo de agua si es necesario
      if (formData.tipoAgua === "Otra") {
        await axios.post(
          "https://daniel-back-dom.onrender.com/api/registro-muestras/tipos-agua",
          {
            tipo: formData.tipoAgua,
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

      // Luego registramos la muestra
      const response = await axios.post(
        "https://daniel-back-dom.onrender.com/api/registro-muestras/muestras",
        {
          tipoMuestreo: formData.tipoMuestreo,
          analisisSeleccionados: formData.analisisSeleccionados,
          tipoDeAgua: {
            tipo: formData.tipoAgua,
            descripcion: formData.descripcion || formData.tipoAgua
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

      <form onSubmit={handleSubmit} autoComplete="off">
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
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : "Registrar Muestra"}
        </Button>
      </form>
    </Paper>
  );
};

export default RegistroMuestras; 