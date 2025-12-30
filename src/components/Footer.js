import React from "react";
import { Box,Link } from "@mui/material";
import logoCRM from "../assets/logos/cruz-roja-logo.png";
import { FaFacebookF, FaYoutube, FaInstagram } from "react-icons/fa";
import { FiX } from "react-icons/fi";

const socialLinks = [
  { icon: <FiX />, url: "https://x.com/CruzRoja_MX" }, // X
  { icon: <FaFacebookF />, url: "https://www.facebook.com/CruzRojaMx" },
  { icon: <FaYoutube />, url: "https://www.youtube.com/user/CRUZROJAMEXICANAIAP" },
  { icon: <FaInstagram />, url: "https://www.instagram.com/cruzroja_mx" },
];

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        maxWidth: "100%",
        bgcolor: "#fff",
        borderTop: "1px solid #ddd",
        px: { xs: 3, sm: 6 },
        py: 2,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        fontFamily: "'Arial', sans-serif",
        fontSize: "0.85rem",
        color: "#666",
        userSelect: "none",
      }}
    >
      {/* Logo Izquierda */}
      <Box
        component="a"
        href="https://www.cruzrojamexicana.org.mx"
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          height: 48,
          cursor: "pointer",
          "& img": {
            height: "100%",
            userSelect: "none",
          },
          flexShrink: 0,
        }}
        aria-label="Cruz Roja Mexicana - Página oficial"
      >
        <img src={logoCRM} alt="Logo Cruz Roja Mexicana" />
      </Box>

      {/* Links de Avisos */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexWrap: "wrap",
          justifyContent: "center",
          flexGrow: 1,
          color: "#444",
        }}
      >
        <Link href="https://www.cruzrojamexicana.org.mx/contenido/Legal/9/#aviso-de-privacidad" underline="hover" color="inherit"   target="_blank"
  rel="noopener noreferrer">
          Aviso de privacidad
        </Link>
        <Link href="https://www.cruzrojamexicana.org.mx/contenido/Legal/9/#terminos2019"   target="_blank"
  rel="noopener noreferrer" underline="hover" color="inherit">
          Términos y condiciones
        </Link>
        <Link href="https://www.cruzrojamexicana.org.mx/contenido/Legal/9/#aviso-de-copyright"   target="_blank"
  rel="noopener noreferrer" underline="hover" color="inherit">
          Aviso de copyright
        </Link>
      </Box>

      {/* Redes Sociales Derecha */}
      <Box sx={{ display: "flex", gap: 2, color: "#888" }}>
        {socialLinks.map(({ icon, url }, i) => (
          <Link
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              fontSize: 20,
              color: "inherit",
              transition: "color 0.3s ease",
              "&:hover": {
                color: "red",
              },
            }}
            aria-label={`Enlace a ${url}`}
          >
            {icon}
          </Link>
        ))}
      </Box>
    </Box>
  );
}
