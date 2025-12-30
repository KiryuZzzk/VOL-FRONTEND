import React, { useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { FaTimes } from "react-icons/fa";

/**
 * AvisoSubeDocumentos (versión encimosa y compacta)
 * -------------------------------------------------------------
 * Aviso fijo en la parte superior de la pantalla, rojo brillante,
 * ocupa todo el ancho, siempre visible hasta que se cierre.
 */
export default function AvisoSubeDocumentos() {
  const [hidden, setHidden] = useState(false);

  const handleDismiss = () => {
    setHidden(true); // No persistimos el cierre; al refrescar volverá a mostrarse
  };

  if (hidden) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 110,
        left: 0,
        right: 0,
        zIndex: 2000,
        p: 1.5, // más compacto
        bgcolor: "#ff3333",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontWeight: 700,
        fontSize: "13px", // más pequeño
        lineHeight: 1.3, // reduce altura de texto
        boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
        textAlign: "center",
      }}
    >
      <Typography variant="body2" sx={{ flex: 1, pr: 1 }}>
        🚨 Recuerda que para continuar con tu proceso, debes subir tus documentos en
        esta misma página y llenar tu información. Puedes consultar si tus documentos
        han sido aprobados o no revisando <strong>“Mi Perfil”</strong>.
      </Typography>

      <IconButton onClick={handleDismiss} sx={{ color: "#fff", p: 0.5 }}>
        <FaTimes size={16} />
      </IconButton>
    </Box>
  );
}
