import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
} from '@mui/material';
import { HiOutlineInformationCircle } from 'react-icons/hi2'; // Ícono de información elegante

export default function AvisoRegistro() {
  const [open, setOpen] = useState(true);
  const [aceptado, setAceptado] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 2,
          backgroundColor: '#fff8f8',
          border: '2px solid #f4dada',
          boxShadow: 10,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <HiOutlineInformationCircle
          size={32}
          style={{ color: '#d32f2f', marginLeft: '8px', marginRight: '12px' }}
        />
        <DialogTitle
          sx={{
            fontWeight: 'bold',
            color: '#d32f2f',
            fontSize: '1.5rem',
            m: 0,
          }}
        >
          Aviso importante
        </DialogTitle>
      </Box>

      <DialogContent>
        <DialogContentText
          sx={{
            fontSize: '1rem',
            mb: 2,
            color: '#333',
            textAlign: 'justify',
          }}
        >
          El registro no garantiza tu participación en los programas de Cruz Roja Mexicana.  
          Nos reservamos el derecho de admisión y validación de la información proporcionada.
        </DialogContentText>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            backgroundColor: '#fff',
            p: 2,
            borderRadius: 2,
            border: '1px solid #f4dada',
            boxShadow: 1,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={aceptado}
                onChange={(e) => setAceptado(e.target.checked)}
                sx={{
                  color: '#d32f2f',
                  '&.Mui-checked': { color: '#d32f2f' },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: '0.95rem', color: '#444' }}>
                He leído y <strong>acepto</strong> las condiciones de registro.
              </Typography>
            }
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', mt: 2 }}>
        <Button
          onClick={handleClose}
          variant="contained"
          disabled={!aceptado}
          sx={{
            backgroundColor: '#d32f2f',
            color: '#fff',
            px: 4,
            py: 1,
            borderRadius: 3,
            fontWeight: 'bold',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#b71c1c',
            },
          }}
        >
          Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
