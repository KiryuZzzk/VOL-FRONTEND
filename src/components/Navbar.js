import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import logoCRM from "../assets/logos/cruz-roja-logo.png";
import { IoLogInOutline, IoHeartOutline } from "react-icons/io5";

export default function Navbar() {
  const [activeNav, setActiveNav] = useState("Inicio");
  const navItems = ["Inicio", "Programas"];
  const navigate = useNavigate();

  const handleClick = (path) => {
    setActiveNav(path);
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box
      sx={{
        width: "100%",
        position: "sticky",
        zIndex: 1300,
        top: 0,
        backgroundColor: "#fff",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      {/* Barra superior */}
      <Box
        sx={{
          minHeight: 50,                // 🔽 antes 60
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          px: { xs: 2, sm: 3 },
          py: 0.5,                      // 🔽 antes 1
          backgroundColor: "#fff",
        }}
      >
        {/* Logo */}
        <Box
          component="img"
          src={logoCRM}
          alt="Logo Cruz Roja"
          sx={{ height: 48, userSelect: "none", flexShrink: 0 }}
        />

        {/* Botones */}
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
          }}
        >
{/* REGÍSTRATE */}
<Button
  variant="contained"
  onClick={() => handleClick("Registrate")}
  sx={{
    px: { xs: 1.2, sm: 2 },
    minWidth: { xs: 40, sm: 140 },
    height: 40,
    backgroundColor: "#ff3333",     // ❤️ rojo CRM
    color: "#ffffff",               // 🤍 texto blanco
    fontSize: "0.75rem",
    fontWeight: "bold",
    fontFamily: "'Arial', sans-serif",
    textTransform: "none",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 1,
    "&:hover": {
      backgroundColor: "#d62d2d",   // 🔥 rojo más oscuro al hover
    },
  }}
>
  <IoHeartOutline size={18} color="#ffffff" />   {/* ❤️ icono blanco */}
  <Box
    sx={{
      ml: 1,
      display: { xs: "none", sm: "inline" },
    }}
  >
    Regístrate
  </Box>
</Button>


          {/* INICIAR SESIÓN */}
          <Button
            variant="outlined"
            onClick={() => handleClick("Ingresa")}
            sx={{
              px: { xs: 1.2, sm: 2 },
              minWidth: { xs: 40, sm: 140 },
              height: 40,
              borderColor: "red",
              color: "red",
              fontSize: "0.75rem",
              fontWeight: "bold",
              fontFamily: "'Arial', sans-serif",
              textTransform: "none",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              "&:hover": {
                borderColor: "#b30000",
                backgroundColor: "rgba(255,0,0,0.05)",
              },
            }}
          >
            <IoLogInOutline size={18} />
            <Box
              sx={{
                ml: 1,
                display: { xs: "none", sm: "inline" },
              }}
            >
              Iniciar sesión
            </Box>
          </Button>
        </Box>
      </Box>

      {/* Línea divisoria */}
      <Box sx={{ height: "1px", backgroundColor: "#ddd", width: "100%" }} />

      {/* Navegación inferior */}
      <Box
        sx={{
          height: 42,                   // 🔽 antes 50
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          px: { xs: 2, sm: 3 },
          gap: 4,
          backgroundColor: "#fff",
          borderBottom: "1px solid #eee",
          pt: 0.5,                      // 🔽 antes 1
        }}
      >
        {navItems.map((item, index) => (
          <Typography
            key={item}
            onClick={() => handleClick(item)}
            sx={{
              cursor: "pointer",
              fontFamily: "Arial, sans-serif",
              fontSize: "0.9rem",
              color: activeNav === item ? "#ff3333" : "#867d91",
              position: "relative",
              paddingBottom: 1.5,
              ml: index === 0 ? 3 : 0,
              transition: "color 0.3s ease",
              "&:after": {
                content: '""',
                position: "absolute",
                width: activeNav === item ? "100%" : "0%",
                height: 2,
                backgroundColor: "#ff3333",
                bottom: 0,
                left: 0,
                transition: "width 0.3s ease",
              },
              "&:hover:after": {
                width: "100%",
              },
            }}
          >
            {item}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
