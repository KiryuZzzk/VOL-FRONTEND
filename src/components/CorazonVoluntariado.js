import React from "react";
import { Box, Typography } from "@mui/material";
import Banner from "../assets/Banner.png";

export default function CorazonVoluntariado() {
  return (
    <Box
      sx={{
        width: "100%",
        backgroundImage: `url(${Banner})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        py: { xs: 10, md: 14 },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Typography
        variant="h3"
        sx={{
          color: "#ffffff",
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: { xs: 2, md: 4 },
          fontSize: { xs: "1.6rem", md: "2.6rem", lg: "3rem" },
          maxWidth: 1000,
          px: 2,
          lineHeight: 1.25,

          // sombra mucho más sutil y elegante
          textShadow: `
            0 0 4px rgba(0,0,0,0.45),
            0 0 8px rgba(0,0,0,0.35)
          `,
        }}
      >
        EL LLAMADO ESTÁ EN TI
      </Typography>
    </Box>
  );
}
