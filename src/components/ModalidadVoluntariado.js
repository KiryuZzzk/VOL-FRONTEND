import React from "react";
import { Box, Typography, Card } from "@mui/material";
import { FiMapPin, FiMonitor, FiCalendar } from "react-icons/fi";

const MODALIDADES = [
  {
    key: "presencial",
    title: "PRESENCIAL",
    icon: <FiMapPin size={22} />,
    description:
      "Participas en actividades dentro de tu Cruz Roja local: talleres, campañas, eventos y acciones directas con la comunidad.",
  },
  {
    key: "en-linea",
    title: "EN LÍNEA",
    icon: <FiMonitor size={22} />,
    description:
      "Colaboras a distancia desde tu casa o trabajo. Cruz Roja Mexicana cada vez se mueve más por medios digitales.",
  },
  {
    key: "eventual",
    title: "EVENTUAL",
    icon: <FiCalendar size={22} />,
    description:
      "Te sumas por temporadas o proyectos puntuales: campañas específicas, jornadas o emergencias concretas.",
  },
];

export default function ModalidadVoluntariado() {
  return (
    <Box
      sx={{
        px: { xs: 2, md: 6 },
        py: { xs: 5, md: 7 },
        backgroundColor: "#fff8ff",
        color: "#000",
      }}
    >
      {/* TÍTULO */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 800,
            textTransform: "uppercase",
            fontSize: { xs: "1.6rem", md: "2.1rem" },
            display: "inline-block",
            pb: 0.5,
            borderBottom: "4px solid #ff3333",
            letterSpacing: 1.2,
          }}
        >
          MODALIDAD DEL VOLUNTARIADO
        </Typography>
      </Box>

      {/* DESCRIPCIÓN */}
      <Typography
        variant="body1"
        sx={{
          maxWidth: 820,
          mx: "auto",
          mb: 5,
          fontFamily: "'Outfit', system-ui",
          color: "#444",
          textAlign: "center",
          lineHeight: 1.7,
          fontSize: { xs: "0.95rem", md: "1rem" },
        }}
      >
        Asistir presencialmente no es la única manera de ayudar, ¡tú pones la
        disposición, nosotros las oportunidades! Apoya la causa que te mueve
        desde donde y cuándo sea.
      </Typography>

      {/* CARDS MODALIDAD */}
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 3, md: 4 },
          justifyContent: "center",
        }}
      >
        {MODALIDADES.map((mod) => (
          <Card
            key={mod.key}
            sx={{
              flex: 1,
              borderRadius: 3,
              backgroundColor: "#ffffff",
              boxShadow: "0 6px 16px rgba(255,51,51,0.12)",
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 1.5,
              minHeight: 200,
            }}
          >
            {/* ICONO CIRCULAR */}
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "999px",
                backgroundColor: "#ff3333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 0 12px rgba(255,51,51,0.35)",
                mb: 0.5,
              }}
            >
              {mod.icon}
            </Box>

            {/* TÍTULO MODALIDAD */}
            <Typography
              sx={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "0.95rem",
                letterSpacing: 1,
                color: "#ff3333",
              }}
            >
              {mod.title}
            </Typography>

            {/* DESCRIPCIÓN MODALIDAD */}
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Outfit', system-ui",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: "#444",
              }}
            >
              {mod.description}
            </Typography>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
