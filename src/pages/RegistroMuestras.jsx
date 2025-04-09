import React, { useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, TextField, FormHelperText } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

const TIPOS_AGUA = ['potable', 'natural', 'residual', 'otra'] as const;
type TipoAgua = typeof TIPOS_AGUA[number];

const TIPOS_PRESERVACION = ['Refrigeración', 'Congelación', 'Acidificación', 'Otro'] as const;

const RegistroMuestras = () => {
  const [formData, setFormData] = useState({
    tipoDeAgua: {
      tipo: '',
      codigo: '',
      descripcion: ''
    },
    preservacionMuestra: 'Refrigeración' as TipoPreservacion,
    preservacionMuestraOtra: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;

    if (name === "tipoDeAgua") {
      const codigo = getTipoAguaCodigo(value);
      setFormData(prev => ({
        ...prev,
        tipoDeAgua: {
          tipo: value,
          codigo: codigo,
          descripcion: value === 'otra' ? '' : value
        }
      }));
    } 
    else if (name === "descripcionTipoAgua") {
      setFormData(prev => ({
        ...prev,
        tipoDeAgua: {
          ...prev.tipoDeAgua,
          descripcion: value
        }
      }));
    }
    else if (name === "tipoAguaResidual") {
      setFormData(prev => ({
        ...prev,
        tipoDeAgua: {
          ...prev.tipoDeAgua,
          subtipo: value,
          descripcion: `Agua residual ${value}`
        }
      }));
    }
    else if (name === "preservacionMuestra") {
      setFormData(prev => ({
        ...prev,
        preservacionMuestra: value as TipoPreservacion,
        preservacionMuestraOtra: value === 'Otro' ? '' : undefined
      }));
    }
    else if (name === "preservacionMuestraOtra") {
      setFormData(prev => ({
        ...prev,
        preservacionMuestraOtra: value
      }));
    }
    else if (name === "tipoMuestreo") {
      setFormData(prev => ({
        ...prev,
        tipoMuestreo: value as TipoMuestreo
      }));
    }
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    setError(null);
  };

  const getTipoAguaCodigo = (tipo: string): string => {
    switch (tipo) {
      case 'potable':
        return 'P';
      case 'natural':
        return 'N';
      case 'residual':
        return 'R';
      case 'otra':
        return 'O';
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ... existing validation code ...

    try {
      const muestraData = {
        // ... other fields ...
        preservacionMuestra: formData.preservacionMuestra === 'Otro' 
          ? formData.preservacionMuestraOtra 
          : formData.preservacionMuestra,
        // ... rest of the fields ...
      };

      // ... rest of the submit code ...
    } catch (error) {
      // ... error handling ...
    }
  };

  return (
    <div>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Tipo de Agua</InputLabel>
        <Select
          name="tipoDeAgua"
          value={formData.tipoDeAgua.tipo}
          onChange={handleChange}
          label="Tipo de Agua"
        >
          {TIPOS_AGUA.map(tipo => (
            <MenuItem key={tipo} value={tipo}>
              {tipo === 'residual' ? 'Residual' :
               tipo === 'otra' ? 'Otra' :
               tipo.charAt(0).toUpperCase() + tipo.slice(1)} ({getTipoAguaCodigo(tipo)})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {formData.tipoDeAgua.tipo === "otra" && (
        <TextField
          fullWidth
          label="Descripción del tipo de agua"
          name="descripcionTipoAgua"
          value={formData.tipoDeAgua.descripcion}
          onChange={handleChange}
          required
          error={formData.tipoDeAgua.tipo === "otra" && !formData.tipoDeAgua.descripcion}
          sx={{ mb: 2 }}
          placeholder="Ejemplo: agua de pozo"
          helperText="Por favor, especifique el tipo de agua"
        />
      )}

      {formData.tipoDeAgua.tipo === "residual" && (
        // ... existing code ...
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Preservación de la Muestra</InputLabel>
        <Select
          name="preservacionMuestra"
          value={formData.preservacionMuestra}
          onChange={handleChange}
          label="Preservación de la Muestra"
          required
        >
          {TIPOS_PRESERVACION.map(tipo => (
            <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {formData.preservacionMuestra === 'Otro' && (
        <TextField
          fullWidth
          label="Especificar preservación"
          name="preservacionMuestraOtra"
          value={formData.preservacionMuestraOtra || ''}
          onChange={handleChange}
          required
          sx={{ mb: 2 }}
          placeholder="Ejemplo: gas"
          helperText="Por favor, especifique el tipo de preservación"
        />
      )}
    </div>
  );
};

export default RegistroMuestras; 