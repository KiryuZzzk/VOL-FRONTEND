// src/components/EnRevision.jsx
import { Box, Paper, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const COLORS = {
  bg: "#fff8ff",      // fondo suave
  white: "#fff",      // paneles internos
  subtle: "#e6dfef",  // bordes / sombras ligeras
  red: "#ff3333",     // acento principal
  lilac: "#f3eaff",   // resaltado
};

export default function EnRevision({ user }) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        backgroundColor: COLORS.bg, // ✔ paleta
        py: 6,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "min(860px, 92vw)",
          borderRadius: "12px",
          padding: { xs: "20px", md: "28px" },
          backgroundColor: COLORS.white, // panel blanco
          border: `1px solid ${COLORS.subtle}`, // ✔ borde sutil
          boxShadow: "0 8px 20px rgba(0,0,0,0.15)", // similar a tu panel
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: "15px",
          }}
        >
          <Typography variant="h5" sx={{ m: 0, color: COLORS.red, fontWeight: 900 }}>
            Estamos revisando tu expediente
          </Typography>
        </Box>

        {/* Mensaje principal */}
        <Box
          sx={{
            p: 2,
            borderRadius: "10px",
            backgroundColor: COLORS.bg, // #fff8ff
            border: `1px solid ${COLORS.subtle}`,
            mb: 2,
          }}
        >
          <Typography variant="body1" sx={{ color: "#333" }}>
            Gracias por completar tu registro. Nuestro equipo está revisando tus documentos.
          </Typography>
          <Typography variant="body2" sx={{ color: "#555", mt: 0.5 }}>
            Puedes consultar el estado en <strong>Mi perfil</strong>.
          </Typography>
        </Box>

        {/* Bloque extra estilo "extraInfo" */}
        <Box
          sx={{
            mt: 1.5,
            borderRadius: "8px",
            backgroundColor: COLORS.lilac, // #f3eaff
            border: `1px solid ${COLORS.subtle}`,
            p: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: "#333" }}>
            Si necesitas actualizar algún dato, podrás hacerlo una vez que tu solicitud cambie de estado.
          </Typography>
        </Box>

        {/* CTA */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "flex-end",
            mt: 3,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate("/")}
            sx={{
              borderColor: COLORS.subtle,
              color: COLORS.red,
              "&:hover": {
                borderColor: COLORS.red,
                backgroundColor: "#fff4f4",
              },
            }}
          >
            Volver al inicio
          </Button>

          <Button
            variant="contained"
            onClick={() => navigate("/Plataforma?tab=perfil")}
            sx={{
              backgroundColor: COLORS.red,
              color: "#fff",
              fontWeight: 700,
              px: 3,
              borderRadius: "999px",
              "&:hover": { backgroundColor: "#e02a2a" },
            }}
          >
            Ir a Mi perfil
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
