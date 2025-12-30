import React, { useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import { motion } from "framer-motion";
import RedBackground from "../assets/Banner.png";
import { useNavigate } from "react-router-dom";

const MotionButton = motion(Button);
const MotionBox = motion(Box);

const textos = [
  "Capacítate para hacer un cambio",
  "Conecta con gente como tú",
    "Aprende sobre la Institución",
  "Fórmate con nosotros"
];

function SubtituloTyping() {
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const speed = 50; // velocidad typing/borrado ms

  useEffect(() => {
    let timer;

    if (!isDeleting && charIndex <= textos[textIndex].length) {
      setDisplayText(textos[textIndex].substring(0, charIndex));
      timer = setTimeout(() => setCharIndex(charIndex + 1), speed);
    } else if (isDeleting && charIndex >= 0) {
      setDisplayText(textos[textIndex].substring(0, charIndex));
      timer = setTimeout(() => setCharIndex(charIndex - 1), speed / 2);
    } else if (charIndex > textos[textIndex].length) {
      timer = setTimeout(() => setIsDeleting(true), 1000);
    } else if (charIndex < 0) {
      setIsDeleting(false);
      setTextIndex((textIndex + 1) % textos.length);
      setCharIndex(0);
      timer = setTimeout(() => {}, speed);
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, textIndex]);

  return (
    <Typography
      component="h2"
      sx={{
        color: "#fff",
        textShadow: "0 0 3px rgba(0,0,0,0.2)",
        fontFamily: "'Arial Black', sans-serif",
        fontSize: {
          xs: "clamp(14px, 4vw, 18px)",
          sm: "clamp(16px, 3vw, 20px)",
          md: "clamp(18px, 2vw, 22px)",
        },
        marginBottom: 4,
        maxWidth: "90%",
        mx: "auto",
        minHeight: "48px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        borderRight: "3px solid #fff",
        userSelect: "none",
      }}
    >
      {displayText}
    </Typography>
  );
}

export default function BackgroundAnimated() {
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
        position: "relative",
        backgroundColor: "#fff8ff",
      }}
    >
      {/* Fondo absoluto */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: {
            xs: 500,
            sm: 420,
            md: 500,
          },
          backgroundImage: `url(${RedBackground})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center bottom",
          backgroundSize: "cover",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Contenido */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          height: {
            xs: 500,
            sm: 420,
            md: 500,
          },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          color: "#fff",
          px: { xs: 2, sm: 4, md: 6 },
          fontFamily: "'Arial Black', sans-serif",
          margin: 0,
          padding: 0,
          overflowX: "hidden",
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontFamily: "'Arial Black', sans-serif",
            fontWeight: "bold",
            mb: 3,
            textShadow:
              "0 0 6px rgba(0,0,0,0.25), 0 0 12px rgba(0,0,0,0.15)",
            fontSize: {
              xs: "clamp(32px, 7vw, 56px)",
              sm: "clamp(48px, 7vw, 80px)",
              md: "clamp(56px, 6vw, 80px)",
            },
            maxWidth: "90%",
            mx: "auto",
            wordWrap: "break-word",
          }}
        >
         FÓRMATE CON NOSOTROS
        </Typography>

        {/* Subtítulo con efecto máquina de escribir */}
        <SubtituloTyping />
        {/* SVG decorativo animado */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "150px",
            overflow: "hidden",
            zIndex: -1,
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "200%",
              height: "100%",
              display: "flex",
            }}
          >
            <MotionBox
              sx={{
                display: "flex",
                width: "200%",
                height: "100%",
              }}
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                duration: 20,
                ease: "linear",
                repeat: Infinity,
              }}
            >
              {[0, 1].map((i) => (
                <Box
                  key={i}
                  component="svg"
                  viewBox="0 0 1440 150"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                  sx={{
                    width: "68%",
                    height: "100%",
                    fill: "#fff8ff",
                    flexShrink: 0,
                  }}
                >
                  <path
                    d="M0,60 
                    C180,120 360,0 540,60 
                    C720,120 900,0 1080,60 
                    C1260,120 1440,0 1620,60 
                    L1620,150 L0,150 Z"
                  />
                </Box>
              ))}
            </MotionBox>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
