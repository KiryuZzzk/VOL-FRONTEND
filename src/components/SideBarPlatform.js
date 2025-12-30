// SidebarPlatform.js
import React from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

import {
  FaHome,
  FaRoute,
  FaClipboardList,
  FaCalendarAlt,
  FaSignOutAlt,
  FaUser,
  FaUsers,
  FaExchangeAlt,
  FaFolderOpen,
  FaClipboardCheck,
  FaChartLine,
  FaIdBadge,
  FaChartBar,
} from "react-icons/fa";

import { signOut } from "firebase/auth";
import { auth } from "../firebase";

import CruzRojaLogo from "../assets/logos/cruz-roja-logo.png";

// -------- MENÚ ASPIRANTE --------
const NAV_ITEMS_ASPIRANTE = [
  { key: "inicio", label: "INICIO", icon: <FaHome />, path: "/Plataforma" },
  { key: "perfil", label: "MI PERFIL", icon: <FaUser />, path: "/MiPerfil" },
  { key: "trayectoria", label: "TRAYECTORIA", icon: <FaRoute />, path: "/Trayectoria" },
  { key: "solicitudes", label: "SOLICITUDES", icon: <FaClipboardList />, path: "/Solicitudes" },
  { key: "calendario", label: "CALENDARIO", icon: <FaCalendarAlt />, path: "/Calendario" },
];

const NAV_ITEMS_ADMIN = [
  { key: "inicio", label: "INICIO", icon: <FaHome />, path: "/Plataforma" },
  { key: "usuarios", label: "USUARIOS", icon: <FaUsers />, path: "/Usuarios" },
  { key: "documentos", label: "DOCUMENTOS", icon: <FaFolderOpen />, path: "/Documentos" },
  { key: "trayectorias", label: "TRAYECTORIAS", icon: <FaRoute />, path: "/Trayectorias" },
  {key: "solicitudes",label: "SOLICITUDES",icon: <FaClipboardCheck />,path: "/Solicitudes",},
  { key: "progresos",label: "PROGRESOS",icon: <FaChartLine />,path: "/Progresos",},
  {key: "credenciales",label: "CREDENCIALES",icon: <FaIdBadge />,path: "/Credenciales",},
   {key: "estadisticas",label: "ESTADISTICAS",icon: <FaChartBar />,path: "/Estadisticas",},
];

export default function SidebarPlatform({
  mode = "aspirante", // "aspirante" | "admin"
  canSwitchMode = false,
  onToggleMode,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navItems = mode === "admin" ? NAV_ITEMS_ADMIN : NAV_ITEMS_ASPIRANTE;
  const roleLabel = mode === "admin" ? "ADMIN / MOD" : "ASPIRANTE";

  const handleToggleClick = () => {
    if (canSwitchMode && typeof onToggleMode === "function") {
      onToggleMode();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
      // si truena, igual lo mandamos a login para que no se quede colgado
    } finally {
      navigate("/Ingresa", { replace: true });
    }
  };

  return (
    <Box
      sx={{
        width: "260px",
        height: "100vh",
        backgroundColor: "#ff3333",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pt: 3,
        boxSizing: "border-box",
      }}
    >
      {/* --- LOGO RECTANGULAR --- */}
      <Box
        sx={{
          py: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: 160,
            height: 70,
            borderRadius: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            boxShadow: "0 6px 16px rgba(255, 0, 0, 0.35)",
          }}
        >
          <Box
            component="img"
            src={CruzRojaLogo}
            alt="Cruz Roja Mexicana"
            sx={{
              width: "96%",
              height: "96%",
              objectFit: "contain",
            }}
          />
        </Box>
      </Box>

      {/* --- ROL DEL USUARIO + SWITCH --- */}
      <Box
        sx={{
          width: "100%",
          backgroundColor: "#dc3434",
          textAlign: "center",
          py: 1.4,
          mb: 3,
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Arial', sans-serif",
            fontWeight: 700,
            color: "#fff",
            fontSize: "0.9rem",
            letterSpacing: 1,
          }}
        >
          {roleLabel}
        </Typography>

        {canSwitchMode && (
          <Box
            onClick={handleToggleClick}
            sx={{
              mt: 0.5,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.6,
              cursor: "pointer",
              px: 1.2,
              py: 0.3,
              borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.15)",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.25)",
              },
            }}
          >
            <FaExchangeAlt size={11} color="#fff" />
            <Typography
              sx={{
                fontSize: "0.7rem",
                color: "#fff",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              {mode === "aspirante" ? "Cambiar a admin" : "Cambiar a aspirante"}
            </Typography>
          </Box>
        )}
      </Box>

      {/* --- MENÚ NAVEGACIÓN --- */}
      <Box
        sx={{
          width: "100%",
          px: 2,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        {navItems.map((item) => (
          <Box
            key={item.key}
            onClick={() => navigate(item.path)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              py: 1,
              px: 2,
              borderRadius: 2,
              cursor: "pointer",
              backgroundColor: isActive(item.path) ? "#dc3434" : "transparent",
              transition: "0.2s",
              "&:hover": {
                backgroundColor: isActive(item.path)
                  ? "#dc3434"
                  : "rgba(0,0,0,0.15)",
              },
            }}
          >
            <Box sx={{ color: "#fff", fontSize: "1.1rem" }}>{item.icon}</Box>
            <Typography
              sx={{
                color: "#fff",
                fontSize: "0.9rem",
                textTransform: "uppercase",
                fontWeight: isActive(item.path) ? 700 : 400,
                letterSpacing: 0.6,
              }}
            >
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* --- SEPARADOR --- */}
      <Box
        sx={{
          width: "80%",
          height: "1px",
          backgroundColor: "#c71515",
          my: 2,
        }}
      />

      {/* --- CERRAR SESIÓN --- */}
      <Box
        sx={{
          width: "100%",
          px: 2,
        }}
      >
        <Box
          onClick={handleLogout}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            py: 1,
            px: 2,
            borderRadius: 2,
            cursor: "pointer",
            transition: "0.2s",
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.15)",
            },
          }}
        >
          <FaSignOutAlt color="#fff" size={18} />
          <Typography
            sx={{
              color: "#fff",
              textTransform: "uppercase",
              fontSize: "0.9rem",
            }}
          >
            Cerrar sesión
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
