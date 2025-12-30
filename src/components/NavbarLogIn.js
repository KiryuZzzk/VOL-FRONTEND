import React, { useState, useEffect } from "react";
import { Box, Button, Typography, useMediaQuery, useTheme } from "@mui/material";
import logoCRM from "../assets/logos/cruz-roja-logo.png";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { IoLogOutOutline } from "react-icons/io5";

export default function NavbarLogIn() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeNav, setActiveNav] = useState("Plataforma");

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm")); // <600px

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await firebaseUser.reload();
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        console.log("Sesión cerrada");
        navigate("Ingresa");
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
      .catch((error) => {
        console.error("Error cerrando sesión", error);
      });
  };

  const handleNavClick = (path) => {
    setActiveNav(path);
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box
      sx={{
        width: "100%",
        position: "sticky",
        top: 0,
        zIndex: 1300,
        backgroundColor: "#fff",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      {/* Barra superior */}
      <Box
        sx={{
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, sm: 3 },
          backgroundColor: "#fff",
        }}
      >
        <Box
          component="img"
          src={logoCRM}
          alt="Logo Cruz Roja"
          sx={{ height: 48, userSelect: "none", flexShrink: 0 }}
        />

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Typography
            sx={{
              display: { xs: "none", sm: "block" },
              fontFamily: "Arial, sans-serif",
              fontSize: "0.9rem",
              color: "#867d91",
              userSelect: "none",
              textAlign: "right",
            }}
          >
            Bienvenido/a, {user?.email || user?.providerData?.[0]?.email || "usuario"}
          </Typography>

          <Button
            variant="contained"
            onClick={handleSignOut}
            sx={{
              minWidth: isSmallScreen ? "40px" : "190px",
              width: isSmallScreen ? "40px" : "auto",
              height: 40,
              backgroundColor: "red",
              color: "white",
              fontSize: "0.85rem",
              textTransform: "none",
              fontWeight: "bold",
              fontFamily: "'Arial', sans-serif",
              whiteSpace: "nowrap",
              padding: isSmallScreen ? 0 : "6px 16px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              "&:hover": {
                backgroundColor: "#b30000",
              },
            }}
            aria-label="Cerrar sesión"
          >
            {isSmallScreen ? (
              <IoLogOutOutline size={24} />
            ) : (
              "CERRAR SESIÓN"
            )}
          </Button>
        </Box>
      </Box>

      {/* Línea divisoria */}
      <Box sx={{ height: "1px", backgroundColor: "#ddd", width: "100%" }} />

      {/* Navegación inferior */}
      <Box
        sx={{
          height: 50,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          px: { xs: 2, sm: 3 },
          gap: 4,
          backgroundColor: "#fff",
          borderBottom: "1px solid #eee",
          pt: 1,
        }}
      >
        <Typography
          onClick={() => handleNavClick("Inicio")}
          sx={{
            cursor: "pointer",
            fontFamily: "Arial, sans-serif",
            fontSize: "0.9rem",
            color: activeNav === "Inicio" ? "#ff3333" : "#867d91",
            position: "relative",
            paddingBottom: 1.5,
            ml: 3,
            transition: "color 0.3s ease",
            "&:after": {
              content: '""',
              position: "absolute",
              width: activeNav === "Inicio" ? "100%" : "0%",
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
          Inicio
        </Typography>
      </Box>
    </Box>
  );
}
