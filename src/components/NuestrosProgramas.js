import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  useMediaQuery,
} from "@mui/material";
import { IoIosArrowDropleftCircle, IoIosArrowDroprightCircle } from "react-icons/io";
import Program1 from "../assets/Prog1.png";
import Program2 from "../assets/Prog2.png";
import Program3 from "../assets/Prog3.png";
import Program4 from "../assets/Prog4.png";
import Program5 from "../assets/Prog5.png";
import Program6 from "../assets/Prog6.png";
import Program7 from "../assets/Prog7.png";
import Program8 from "../assets/Prog8.png";

import { useNavigate } from "react-router-dom";

const programas = [
  {
    image: Program1,
    title: "Capacitación",
    description:
      "Aprende a salvar vidas en situaciones de emergencia y comparte tus conocimientos.",
  },
  {
    image: Program2,
    title: "Socorros",
    description: "Sé la esperanza en momentos críticos.",
  },
  {
    image: Program3,
    title: "Apoyo Psicosocial",
    description: "Apoya emocionalmente a quien más lo necesita.",
  },
  {
    image: Program4,
    title: "Comunicación",
    description: "Inspira el cambio comunicando ideas.",
  },
  {
    image: Program5,
    title: "Migración",
    description: "Reconecta a familias sin importar dónde estén.",
  },
  {
    image: Program6,
    title: "Prevención",
    description:
      "Fomenta la cultura de prevención de accidentes viales y del hogar.",
  },
  {
    image: Program7,
    title: "Reducción de Riesgos",
    description:
      "La resiliencia de las comunidades es esencial. Genera un cambio en cualquier punto.",
  },
  {
    image: Program8,
    title: "Voluntariado",
    description: "Conecta con gente como tú y transforma comunidades.",
  },
];

const MotionBox = motion(Box);

const variants = {
  enter: (direction) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
    position: "absolute",
  }),
  center: {
    x: 0,
    opacity: 1,
    position: "relative",
  },
  exit: (direction) => ({
    x: direction > 0 ? -100 : 100,
    opacity: 0,
    position: "absolute",
  }),
};

export default function NuestrosProgramas() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:768px)");

  const handlePrev = () => {
    setDirection(-1);
    setIndex((prev) => (prev === 0 ? programas.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setIndex((prev) => (prev === programas.length - 1 ? 0 : prev + 1));
  };

  const handleClick = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box
      sx={{
        textAlign: "center",
        backgroundColor: "#fff8ff",
        px: { xs: 2, sm: 4, md: 6 },
        py: { xs: 5, md: 7 },
        position: "relative",
      }}
    >
      {/* TÍTULO NUEVO */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 800,
            textTransform: "uppercase",
            fontSize: { xs: "1.6rem", md: "2.2rem" },
            display: "inline-block",
            pb: 0.5,
            borderBottom: "4px solid #ff3333",
            letterSpacing: 1.2,
          }}
        >
          Nuestros programas
        </Typography>
      </Box>

      {/* DESCRIPCIÓN */}
      <Typography
        variant="body1"
        sx={{
          maxWidth: 760,
          mx: "auto",
          mb: 6,
          fontFamily: "'Outfit', system-ui",
          color: "#444",
          textAlign: "center",
          lineHeight: 1.7,
          px: { xs: 1, sm: 0 },
          fontSize: { xs: "0.95rem", sm: "1rem" },
        }}
      >
        Descubre los programas que tenemos para transformar vidas. Cada uno está
        diseñado para desarrollar tus habilidades y conectar con una causa que te
        apasiona.
      </Typography>

      {/* FONDO DETRÁS DEL CARRUSEL */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: 260, sm: 230 },
          left: { xs: 32, sm: 80 },
          right: { xs: 0, sm: 40 },
          height: isMobile ? 360 : 320,
          backgroundColor: "#e6dfef",
          borderTopLeftRadius: { xs: "160px", sm: "190px" },
          borderBottomLeftRadius: { xs: "160px", sm: "190px" },
          zIndex: 0,
        }}
      />

      {/* CARRUSEL */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: isMobile ? 3 : 6,
          minHeight: isMobile ? 320 : 320,
          overflow: "visible",
          zIndex: 1,
          px: isMobile ? 0 : 2,
        }}
      >
        {/* Flecha arriba (MÓVIL) */}
        {isMobile && (
          <MotionBox
            onClick={handlePrev}
            whileHover={{ scale: 1.1, color: "#ff4d4d" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "tween", duration: 0.25 }}
            sx={{
              cursor: "pointer",
              fontSize: 32,
              color: "#867d91",
              mb: 1,
              alignSelf: "center",
              userSelect: "none",
              zIndex: 5,
            }}
          >
            <IoIosArrowDropleftCircle
              size={40}
              style={{ transform: "rotate(-90deg)" }}
            />
          </MotionBox>
        )}

        {/* CARDS - MÓVIL */}
        {isMobile ? (
          <Box
            sx={{
              position: "relative",
              width: "90%",
              height: 330,
            }}
          >
            <AnimatePresence initial={false} custom={direction}>
              <MotionBox
                key={index}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                sx={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  mx: "auto",
                }}
              >
                <Box
                  component="img"
                  src={programas[index].image}
                  alt={programas[index].title}
                  sx={{
                    width: "80%",
                    height: 160,
                    objectFit: "cover",
                    borderRadius: 3,
                    mb: -5,
                    zIndex: 4,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
                  }}
                />
                <Card
                  sx={{
                    width: "100%",
                    minHeight: 170,
                    borderRadius: 3,
                    pt: 6,
                    pb: 2.5,
                    px: 2.2,
                    backgroundColor: "#ffffff",
                    boxShadow:
                      "0 6px 18px rgba(255,51,51,0.16), 0 0 18px rgba(255,51,51,0.09)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    zIndex: 3,
                  }}
                >
                  <CardContent sx={{ textAlign: "center", p: 0 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontFamily: "'Montserrat', sans-serif",
                        color: "#ff3333",
                        mb: 1,
                        fontSize: "0.98rem",
                        letterSpacing: 0.5,
                      }}
                    >
                      {programas[index].title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#555",
                        fontSize: "0.85rem",
                        mb: 2,
                        fontFamily: "'Outfit', system-ui",
                        lineHeight: 1.6,
                      }}
                    >
                      {programas[index].description}
                    </Typography>
                    <Button
                      variant="outlined"
                      sx={{
                        borderColor: "#ff3333",
                        color: "#ff3333",
                        fontFamily: "'Outfit', system-ui",
                        fontSize: "0.8rem",
                        textTransform: "none",
                        px: 3,
                        py: 0.4,
                        borderRadius: "9999px",
                        "&:hover": {
                          borderColor: "#ff3333",
                          backgroundColor: "rgba(255,51,51,0.06)",
                        },
                      }}
                      onClick={() => handleClick("/Programas")}
                    >
                      Saber más
                    </Button>
                  </CardContent>
                </Card>
              </MotionBox>
            </AnimatePresence>
          </Box>
        ) : (
          // DESKTOP: 3 cards
          <Box
            sx={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              alignItems: "flex-end",
              overflow: "visible",
              zIndex: 2,
            }}
          >
            {[0, 1, 2].map((offset) => {
              const cardIndex = (index + offset) % programas.length;
              const programa = programas[cardIndex];
              const isCenter = offset === 1;

              return (
                <Box
                  key={cardIndex}
                  sx={{
                    position: "relative",
                    width: isCenter ? 270 : 210,
                    transition: "all 0.3s ease",
                    transform: isCenter ? "scale(1.05)" : "scale(0.9)",
                    opacity: isCenter ? 1 : 0.6,
                    zIndex: isCenter ? 3 : 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={programa.image}
                    alt={programa.title}
                    sx={{
                      width: isCenter ? "82%" : "72%",
                      height: isCenter ? 160 : 130,
                      objectFit: "cover",
                      borderRadius: 3,
                      marginBottom: -5,
                      zIndex: 4,
                      boxShadow: isCenter
                        ? "0 8px 20px rgba(0,0,0,0.18)"
                        : "0 4px 10px rgba(0,0,0,0.12)",
                    }}
                  />
                  <Card
                    sx={{
                      width: "100%",
                      minHeight: 170,
                      borderRadius: 3,
                      pt: 6,
                      pb: 2.5,
                      px: 2.2,
                      backgroundColor: "#ffffff",
                      boxShadow: isCenter
                        ? "0 6px 18px rgba(255,51,51,0.18)"
                        : "0 3px 10px rgba(0,0,0,0.08)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      zIndex: 3,
                    }}
                  >
                    <CardContent sx={{ textAlign: "center", p: 0 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontFamily: "'Montserrat', sans-serif",
                          color: "#ff3333",
                          mb: 1,
                          fontSize: "1rem",
                          letterSpacing: 0.5,
                        }}
                      >
                        {programa.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#555",
                          fontSize: "0.85rem",
                          mb: 2,
                          fontFamily: "'Outfit', system-ui",
                          lineHeight: 1.6,
                        }}
                      >
                        {programa.description}
                      </Typography>
                      <Button
                        variant="outlined"
                        sx={{
                          borderColor: "#ff3333",
                          color: "#ff3333",
                          fontFamily: "'Outfit', system-ui",
                          fontSize: "0.8rem",
                          textTransform: "none",
                          px: 3,
                          py: 0.4,
                          borderRadius: "9999px",
                          "&:hover": {
                            borderColor: "#ff3333",
                            backgroundColor: "rgba(255,51,51,0.06)",
                          },
                        }}
                        onClick={() => handleClick("/Programas")}
                      >
                        Saber más
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Flecha abajo (MÓVIL) */}
        {isMobile && (
          <MotionBox
            onClick={handleNext}
            whileHover={{ scale: 1.1, color: "#ff4d4d" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "tween", duration: 0.25 }}
            sx={{
              cursor: "pointer",
              fontSize: 32,
              color: "#867d91",
              mt: 1,
              alignSelf: "center",
              userSelect: "none",
              zIndex: 5,
            }}
          >
            <IoIosArrowDroprightCircle
              size={40}
              style={{ transform: "rotate(90deg)" }}
            />
          </MotionBox>
        )}

        {/* Flechas laterales (DESKTOP) */}
        {!isMobile && (
          <>
            <MotionBox
              onClick={handlePrev}
              whileHover={{ scale: 1.1, color: "#ff4d4d" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "tween", duration: 0.25 }}
              sx={{
                cursor: "pointer",
                fontSize: 28,
                color: "#867d91",
                position: "absolute",
                left: -10,
                top: "50%",
                zIndex: 3,
              }}
            >
              <IoIosArrowDropleftCircle size={40} />
            </MotionBox>

            <MotionBox
              onClick={handleNext}
              whileHover={{ scale: 1.1, color: "#ff4d4d" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "tween", duration: 0.25 }}
              sx={{
                cursor: "pointer",
                fontSize: 28,
                color: "#867d91",
                position: "absolute",
                right: -10,
                top: "50%",
                zIndex: 3,
              }}
            >
              <IoIosArrowDroprightCircle size={40} />
            </MotionBox>
          </>
        )}
      </Box>

      {/* PAGINACIÓN */}
      <Box
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "center",
          gap: 1,
          zIndex: 1,
          flexWrap: "wrap",
          px: { xs: 2, sm: 0 },
        }}
      >
        {programas.map((_, i) => (
          <Box
            key={i}
            sx={{
              width: i === index ? 10 : 8,
              height: i === index ? 10 : 8,
              borderRadius: "50%",
              backgroundColor: i === index ? "#ff3333" : "#867d91",
              transition: "background-color 0.25s ease, transform 0.25s ease",
              transform: i === index ? "scale(1.1)" : "scale(1)",
              zIndex: 1,
              cursor: "pointer",
            }}
            onClick={() => {
              if (i !== index) {
                setDirection(i > index ? 1 : -1);
                setIndex(i);
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
