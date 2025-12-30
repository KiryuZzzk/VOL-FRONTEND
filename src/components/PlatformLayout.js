// src/components/PlatformLayout.js
import React from "react";
import { Box } from "@mui/material";
import SidebarPlatform from "./SideBarPlatform";
import RedBackground from "../assets/Banner.png";
import RedBackground2 from "../assets/Banner2.png";
import { useEffect, useState } from "react";

const COLORS = {
  bg: "#fff8ff",
};



export default function PlatformLayout({
  children,
  modOrAdmin = false,   // 👈 viene desde App.js
  ...rest               // por si después le pasas más cosas
}) {
  const [mode, setMode] = useState("aspirante"); // "aspirante" | "admin"

  // Si ya no es admin/mod, regresamos a aspirante
  useEffect(() => {
    if (!modOrAdmin) {
      setMode("aspirante");
    }
  }, [modOrAdmin]);

  const handleToggleMode = () => {
    if (!modOrAdmin) return; // seguridad extra
    setMode((prev) => (prev === "aspirante" ? "admin" : "aspirante"));
  };

  return (
    <Box sx={{ backgroundColor: COLORS.bg, minHeight: "100vh" }}>
      {/* Menú lateral fijo */}
            <SidebarPlatform
        mode={mode}
        canSwitchMode={modOrAdmin}
        onToggleMode={handleToggleMode}
      />

      {/* Contenido desplazado a la derecha del menú */}
      <Box
        sx={{
          pl: { xs: "260px", md: "260px" }, // debe coincidir con el width del sidebar
        }}
      >
        {/* Banner superior */}
        <Box
          sx={{
            width: "100%",
            aspectRatio: "16 / 1.5",
            backgroundImage: `url(${RedBackground})`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        />

        {/* Zona central dinámica */}
        <Box
          sx={{
            px: { xs: 2, md: 4 },
            py: 4,
          }}
        >
          {children}
        </Box>

        {/* Banner inferior */}
        <Box
          sx={{
            width: "100%",
            aspectRatio: "16 / 1.5",
            backgroundImage: `url(${RedBackground2})`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        />
      </Box>
    </Box>
  );
}
