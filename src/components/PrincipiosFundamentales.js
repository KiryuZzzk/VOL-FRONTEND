import React from "react";
import { Box, Typography, Card } from "@mui/material";

import humanidadIcon from "../assets/humanidad.svg";
import imparcialidadIcon from "../assets/imparcialidad.svg";
import neutralidadIcon from "../assets/neutralidad.svg";
import independenciaIcon from "../assets/independencia.svg";
import voluntariadoIcon from "../assets/voluntariado.svg";
import unidadIcon from "../assets/unidad.svg";
import universalidadIcon from "../assets/universalidad.svg";

const PRINCIPIOS = [
  { nombre: "HUMANIDAD", image: humanidadIcon },
  { nombre: "IMPARCIALIDAD", image: imparcialidadIcon },
  { nombre: "NEUTRALIDAD", image: neutralidadIcon },
  { nombre: "INDEPENDENCIA", image: independenciaIcon },
  { nombre: "VOLUNTARIADO", image: voluntariadoIcon },
  { nombre: "UNIDAD", image: unidadIcon },
  { nombre: "UNIVERSALIDAD", image: universalidadIcon },
];

export default function PrincipiosFundamentales() {
  return (
    <Box
      sx={{
        px: { xs: 2, md: 6 },
        py: { xs: 4, md: 6 },
        backgroundColor: "#fff8ff",
        color: "#000",
      }}
    >
      {/* TÍTULO */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "1.7rem", md: "2.1rem" },
            fontFamily: "'Montserrat', sans-serif",
            display: "inline-block",
            pb: 0.4,
            borderBottom: "4px solid #ff3333",
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          Principios Fundamentales
        </Typography>
      </Box>

      {/* DESCRIPCIÓN */}
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
          textAlign: "center",
          fontFamily: "'Outfit', system-ui",
          color: "#333",
          mb: 4,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "0.95rem", md: "1rem" },
            lineHeight: 1.7,
            mb: 2,
          }}
        >
          Los Principios Fundamentales son los valores que guían a todo el
          Movimiento Internacional. Representan su identidad y la forma en que
          actúa en cualquier parte del mundo.
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "0.95rem", md: "1rem" },
            lineHeight: 1.7,
          }}
        >
          Cada principio asegura que la Cruz Roja trabaje siempre con respeto,
          sin discriminación, sin intereses políticos y con el único propósito
          de proteger la vida y la dignidad humana.
        </Typography>
      </Box>

      {/* PRINCIPIOS SIN SCROLL */}
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          mt: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap", // <-- aquí la magia
            gap: { xs: 2, md: 3 },
            justifyContent: "center",
          }}
        >
          {PRINCIPIOS.map((p) => (
            <Card
              key={p.nombre}
              sx={{
                width: 140,
                borderRadius: 3,
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 10px rgba(255,51,51,0.16)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                px: 2,
                py: 2,
              }}
            >
              <Box
                component="img"
                src={p.image}
                alt={p.nombre}
                sx={{
                  width: 64,
                  height: "auto",
                  mb: 1.5,
                }}
              />

              <Typography
                variant="body2"
                sx={{
                  textAlign: "center",
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: "0.8rem",
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  fontWeight: 400,
                  color: "#333",
                }}
              >
                {p.nombre}
              </Typography>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
