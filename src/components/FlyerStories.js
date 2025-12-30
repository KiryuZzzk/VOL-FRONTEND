import React, { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Box, Typography, IconButton, useMediaQuery } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

// 🖼️ Importa tus imágenes aquí
import flyer1 from "../assets/flyers/flyer1.png";
import flyer2 from "../assets/flyers/flyer2.png";
import flyer3 from "../assets/flyers/flyer3.png";
import flyer4 from "../assets/flyers/flyer4.png";
import flyer5 from "../assets/flyers/flyer5.png";
import flyer6 from "../assets/flyers/flyer6.png";

// 📚 Arreglo de flyers
const flyers = [
  { id: 1, title: "Tu ayuda salva vidas. Sé voluntario", img: flyer1 },
  { id: 2, title: "¿Sientes el llamado que te impulsa a actuar?", img: flyer2 },
  { id: 3, title: "Salva hoy, inspira siempre", img: flyer3 },
  { id: 4, title: "Juntos podemos hacer la diferencia", img: flyer4 },
  { id: 5, title: "Tu tiempo es esperanza para otros", img: flyer5 },
  { id: 6, title: "Cada acción cuenta", img: flyer6 },
];

const FlyerStories = () => {
  const [index, setIndex] = useState(0);
  const isMobile = useMediaQuery("(max-width:600px)");

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % flyers.length);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + flyers.length) % flyers.length);
  };

  const current = flyers[index];

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#fff8ff",
        padding: isMobile ? "24px 0" : "40px 0",
      }}
    >



      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 1000,
          margin: "0 auto",
          height: isMobile ? 260 : 380,
          borderRadius: "20px",
          overflow: "hidden",
          backgroundColor: "#fff8ff",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={current.id}
            src={current.img}
            alt={current.title}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.5 }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center", // opcional: ajusta la posición de la imagen
              backgroundColor: "#e6dfef", // para que el letterboxing combine
            }}
          />
        </AnimatePresence>

        {/* Flecha izquierda */}
        <IconButton
          onClick={handlePrev}
          sx={{
            position: "absolute",
            top: "50%",
            left: 20,
            transform: "translateY(-50%)",
            backgroundColor: "#fff8ff",
            color: "#ff3333",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            "&:hover": { backgroundColor: "#e6dfef" },
            zIndex: 2,
          }}
        >
          <FiChevronLeft size={isMobile ? 20 : 28} />
        </IconButton>

        {/* Flecha derecha */}
        <IconButton
          onClick={handleNext}
          sx={{
            position: "absolute",
            top: "50%",
            right: 20,
            transform: "translateY(-50%)",
            backgroundColor: "#fff8ff",
            color: "#ff3333",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            "&:hover": { backgroundColor: "#e6dfef" },
            zIndex: 2,
          }}
        >
          <FiChevronRight size={isMobile ? 20 : 28} />
        </IconButton>
      </Box>

      <Typography
        variant="subtitle1"
        sx={{
          textAlign: "center",
          mt: 2,
          color: "#333",
          fontWeight: 600,
          fontSize: { xs: "1rem", md: "1.2rem" },
        }}
      >
        {current.title}
      </Typography>
    </div>
  );
};

export default FlyerStories;
