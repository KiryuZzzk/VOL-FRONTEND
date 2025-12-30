import React from "react";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { motion } from "framer-motion";
import RedBackground from "../assets/BannerProg.png";
import RedBackground2 from "../assets/BannerProgxs.png";


const MotionTypography = motion(Typography);
const MotionSvg = motion.svg;

export default function BackgroundAnimated({ setPageType, pageType }) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const backgroundToUse = isSmall ? RedBackground2 : RedBackground;

  return (
    <Box
      sx={{
        maxWidth: "100vw",
        overflowX: "hidden",
        overflowY: "visible",
        height: { xs: 500, sm: 420, md: 500 },
        backgroundImage: `url(${backgroundToUse})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        textAlign: "left",
        color: "#fff",
        px: { xs: 4, sm: 6, md: 10 },
        fontFamily: "'Arial Black', sans-serif",
        position: "relative",
        zIndex: 0,
      }}
    >
      <Typography
        variant="h3"
        component="h1"
        sx={{
          fontWeight: "bold",
          mb: 2,
          fontFamily: "'Arial Black', sans-serif",
          textShadow: "0 0 6px rgba(0,0,0,0.25), 0 0 12px rgba(0,0,0,0.15)",
          fontSize: {
            xs: "clamp(32px, 7vw, 56px)",
            sm: "clamp(48px, 7vw, 80px)",
            md: "clamp(56px, 6vw, 80px)",
          },
          zIndex: 3,
        }}
      >
        PROGRAMAS
      </Typography>

      <MotionTypography
        variant="h6"
        component="h2"
        sx={{
          mb: 1,
          opacity: 0.95,
          color: "#fff",
          textShadow: "0 0 3px rgba(0,0,0,0.2)",
          fontSize: {
            xs: "clamp(14px, 4vw, 18px)",
            sm: "clamp(16px, 3vw, 20px)",
            md: "clamp(18px, 2vw, 22px)",
          },
          maxWidth: "80%",
          zIndex: 3,
        }}
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        VOLUNTARIOS
      </MotionTypography>

      <Typography
        variant="body1"
        sx={{
          mt: 0.5,
          color: "#f1f1f1",
          opacity: 0.85,
          maxWidth: "50%",
          fontSize: {
            xs: "0.9rem",
            sm: "1rem",
            md: "1.1rem",
          },
          fontFamily: "'Arial', sans-serif",
          zIndex: 3,
        }}
      >
        En la Cruz Roja Mexicana creemos en la fuerza de la solidaridad. Ya seas principiante o experto, aquí hay un lugar para ti.
      </Typography>

      {/* Ola SVG */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "150px",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        <MotionSvg
          viewBox="0 0 1440 150"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{
            width: "120%",
            height: "100%",
            fill: "#fff8ff",
            display: "block",
            position: "relative",
          }}
          animate={{ x: ["0%", "-20%"] }}
          transition={{ duration: 10, ease: "linear", repeat: Infinity }}
        >
          <path d="M0,60 
            C180,120 360,0 540,60 
            C720,120 900,0 1080,60 
            C1260,120 1440,0 1620,60 
            L1620,150 L0,150 Z" />
        </MotionSvg>
      </Box>
    </Box>
  );
}
