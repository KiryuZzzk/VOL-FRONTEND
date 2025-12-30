import React from "react";
import { Box, Typography, Card, CardMedia, CardContent } from "@mui/material";
import Card1 from "../assets/Card1.png";
import Card2 from "../assets/Card2.png";
import Card3 from "../assets/Card3.png";

export default function QueEsVoluntario() {
  const cards = [
    {
      image: Card1,
      title: "CONECTA",
      description: "CON GENTE COMO TÚ",
    },
    {
      image: Card2,
      title: "APOYA",
      description: "A LA COMUNIDAD",
    },
    {
      image: Card3,
      title: "GENERA",
      description: "UN CAMBIO EN EL MUNDO",
    },
  ];

  return (
    <Box
      sx={{
        px: { xs: 3, md: 6 },
        py: { xs: 6, md: 8 },
        textAlign: "center",
        backgroundColor: "#fff8ff",
        color: "#000",
      }}
    >
      {/* TÍTULO */}
      <Typography
        variant="h4"
        sx={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 800,
          fontSize: { xs: "1.6rem", md: "2.2rem" },
          textTransform: "uppercase",
          display: "inline-block",
          pb: 0.5,
          mb: 3,
          borderBottom: "4px solid #ff3333",
          letterSpacing: 1.2,
        }}
      >
        ¿Qué es ser voluntario?
      </Typography>

      {/* DESCRIPCIÓN */}
      <Typography
        variant="body1"
        sx={{
          maxWidth: 750,
          mx: "auto",
          mb: 6,
          fontFamily: "'Outfit', sans-serif",
          color: "#444",
          lineHeight: 1.7,
          fontSize: { xs: "0.95rem", md: "1.05rem" },
        }}
      >
        Ser voluntario significa conectar con otros, aportar tu tiempo y habilidades para 
        transformar vidas y comunidades, y formar parte de algo mucho más grande que tú mismo. 
        Es formar parte de una red de personas que actúan con el corazón. 
        Es decidir marcar una diferencia real: estar donde otros necesitan esperanza, apoyo 
        o una mano amiga.
      </Typography>

      {/* CARDS */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: { xs: 2, md: 3 },
          flexWrap: "wrap",
        }}
      >
        {cards.map(({ image, title, description }, index) => (
          <Card
            key={index}
            sx={{
              width: 260,
              borderRadius: 3,
              overflow: "hidden",
              backgroundColor: "#fff",
              boxShadow: "0 4px 10px rgba(255,51,51,0.15)", // rojita leve
              transition: "transform 0.25s ease",
              "&:hover": {
                transform: "translateY(-6px)",
                boxShadow: "0 10px 20px rgba(255,51,51,0.28)",
              },
            }}
          >
            <CardMedia
              component="img"
              image={image}
              alt={title}
              sx={{
                height: 180,
                objectFit: "cover",
              }}
            />

            <CardContent
              sx={{
                textAlign: "center",
                backgroundColor: "#fff",
                p: 2.5,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 700,
                  color: "#ff3333",
                  letterSpacing: 1,
                  mb: 0.8,
                }}
              >
                {title}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "0.88rem",
                  color: "#555",
                }}
              >
                {description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
