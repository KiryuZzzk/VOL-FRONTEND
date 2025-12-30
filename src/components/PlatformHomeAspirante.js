// src/components/PlatformHomeAspirante.js
import React from "react";
import {
  Box,
  Typography,
  Button,
  useMediaQuery,
} from "@mui/material";
import ProfilePlatform from "./ProfilePlatform";
import ProfilePlatformSmall from "./ProfilePlatformSmall";
import TusProgramas from "./TusProgramas";

const DOCUMENTS_LINK = "/MiPerfil"; // cámbialo luego a la ruta real

export default function PlatformHomeAspirante() {
  const isSmallScreen = useMediaQuery("(max-width:1232px)");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isSmallScreen ? "column" : "row",
        justifyContent: isSmallScreen ? "center" : "space-between",
        alignItems: "flex-start",
        gap: 3,
      }}
    >
      {/* 🔸 COLUMNA CENTRAL – botón + avisos + dummy */}
      <Box
        sx={{
          flex: 1,
          minHeight: 200,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        {/* BOTÓN DOCUMENTOS (centrado) */}
        <Button
          component="a"
          href={DOCUMENTS_LINK}
          sx={{
            alignSelf: "center",       // ⬅️ centrado
            width: "100%",
            maxWidth: 600,             // no más ancho de esto
            backgroundColor: "#ff3333",
            color: "#fff",
            textTransform: "none",
            fontFamily: "'Arial', sans-serif",
            borderRadius: "999px",
            px: 3,
            py: 1.2,
            fontSize: "0.9rem",
            boxShadow: "0 4px 12px rgba(255, 51, 51, 0.25)",
            textAlign: "center",
            "&:hover": {
              backgroundColor: "#e02a2a",
              textDecoration: "none",
              boxShadow: "0 6px 16px rgba(255, 51, 51, 0.35)",
            },
          }}
        >
          Para continuar con tu registro, no olvides subir tus documentos. Da clic aquí.
        </Button>

        {/* CARD AVISOS (estilo similar a LOGRO RECIENTE) */}
        <Box
          sx={{
            backgroundColor: "#ffffff",
            borderRadius: 3,
            boxShadow: "0 5px 14px rgba(255, 0, 0, 0.1)",
          }}
        >
          {/* HEADER AVISOS */}
          <Box
            sx={{
              backgroundColor: "#e6dfef",
              textAlign: "center",
              py: 1.3,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Arial', sans-serif",
                fontWeight: 700,
                fontSize: "0.9rem",
                textTransform: "uppercase",
              }}
            >
              AVISOS
            </Typography>
          </Box>

          {/* CONTENIDO AVISOS */}
          <Box
            sx={{
              backgroundColor: "#fff8ff",
              borderRadius: 2,
              mx: 2.2,
              my: 1.8,
              p: 1.8,
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Arial', sans-serif",
                fontSize: "0.82rem",
                color: "#867d91",
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              <strong>¡Bienvenido/a!</strong> 
              <br/> Por favor, completa tu perfil y sube tus documentos.
                    Dentro de poco podrás empezar tu formación.<br/>
                    ¡No olvides consultar la plataforma en enero 2026!
            </Typography>
          </Box>
        </Box>

        {/* CARD DUMMY PARA FUTURO COMPONENTE */}
        <TusProgramas/>
      </Box>

      {/* 🔹 PERFIL – SIEMPRE A LA DERECHA EN ESCRITORIO */}
      <Box
        sx={{
          width: isSmallScreen ? "100%" : "28%",
          flexShrink: 0,
        }}
      >
        {isSmallScreen ? <ProfilePlatformSmall /> : <ProfilePlatform />}
      </Box>
    </Box>
  );
}
