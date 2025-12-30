import React from "react";
import { Box, Button } from "@mui/material";
import { motion } from "framer-motion";
import RedBackground from "../assets/Banner.png";
import { useNavigate } from "react-router-dom";

const MotionButton = motion(Button);
const MotionSvg = motion.svg;

export default function BackgroundAnimatedWaveTop({ setPageType, pageType }) {

const navigate = useNavigate();
    const handleClick = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        overflowY: "visible",
          height: {
            xs: 300,
            sm: 420,
            md: 500,
          },
        backgroundImage: `url(${RedBackground})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
        zIndex: 0,
        margin: 0,
        padding: 0,
      }}
    >
      {/* Contenedor que recorta estrictamente el SVG arriba */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "150px",
          overflow: "hidden",
          zIndex: -1,
          margin: 0,
          padding: 0,
        }}
      >
        <MotionSvg
          viewBox="0 0 1440 150"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{
            width: "180%", 
            height: "100%",
            fill: "#fff8ff",
            margin: 0,
            padding: 0,
            display: "block",
            position: "relative",
            left: 0,
          }}
          animate={{
            x: ["0%", "-20%"],
          }}
          transition={{
            duration: 10,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {/* Onda con más curvas para que sea notoria */}
          <path d="
            M0,60 
            C180,120 360,0 540,60 
            C720,120 900,0 1080,60 
            C1260,120 1440,0 1620,60 
            L1620,0 L0,0 Z
          " />
        </MotionSvg>
      </Box>

      {/* Botón centrado */}
      <MotionButton
        variant="contained"
        onClick={() => handleClick("/Registrate")}
        sx={{
          backgroundColor: "red",
          color: "#fff",
          top:"20px",
          px: { xs: 4, sm: 5 },
          py: 1.5,
          fontWeight: "bold",
          textShadow: "0 0 6px rgba(0,0,0,0.3)",
          fontFamily: "'Arial Black', sans-serif",
          borderRadius: "9999px",
          minWidth: 200,
          boxSizing: "border-box",
          fontSize: {
            xs: "0.85rem",
            sm: "1rem",
            md: "1.1rem",
          },
          "&:hover": {
            backgroundColor: "#b30000",
          },
        }}
        whileHover={{ scale: 1.07, boxShadow: "0 0 15px rgba(255,0,0,0.7)" }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        Hazte voluntario
      </MotionButton>
    </Box>
  );
}
