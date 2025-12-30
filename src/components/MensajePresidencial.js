import React from "react";
import { Box, Typography, Card, useMediaQuery } from "@mui/material";
import { FiVolume2 } from "react-icons/fi";

const MensajePresidencial = () => {
  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "#fff8ff",
        py: { xs: 5, md: 7 },
        px: { xs: 2, md: 4 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Encabezado institucional */}
      <Box
        sx={{
          textAlign: "center",
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 1,
            mb: 1,
          }}
        >
          <Typography
            variant={isMobile ? "h5" : "h4"}
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1.4,
              display: "inline-block",
              pb: 0.4,
              borderBottom: "4px solid #ff3333",
            }}
          >
            Mensaje del Presidente Nacional
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            mt: 1,
            fontFamily: "'Outfit', sans-serif",
            color: "#555",
            fontSize: { xs: "0.9rem", md: "0.95rem" },
          }}
        >

          Un mensaje para todas las personas que sienten ese impulso por ayudar.
        </Typography>
      </Box>

      {/* Card con el video (más pequeña y centrada) */}
      <Card
        sx={{
          width: "100%",
          maxWidth: 720, // más pequeño y controlado
          borderRadius: 3,
          bgcolor: "#ffffff",
          boxShadow: "0 6px 16px rgba(255,51,51,0.18)",
          p: { xs: 1.5, md: 2 },
        }}
      >
        <Box
          sx={{
            position: "relative",
            paddingTop: "56.25%", // 16:9
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <iframe
            src="https://www.youtube.com/embed/cqfrPvBgwr4"
            title="Video del Presidente Nacional"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: 0,
            }}
          />
        </Box>
      </Card>
              <Typography
          variant="body2"
          sx={{
            mt: 1,
            fontFamily: "'Outfit', sans-serif",
            color: "#555",
            fontSize: { xs: "0.9rem", md: "0.95rem" },
          }}
        >
          Lic. Carlos Freaner Figueroa
        </Typography>
    </Box>
  );
};

export default MensajePresidencial;
