// src/components/ProfilePlatformSmall.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaMedal } from "react-icons/fa";
import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const BACKEND_URL = "https://vol-backend.onrender.com";

// ---- TEMP DATA (igual idea que el grande) ----
const MOCK_FULL_NAME = "NOMBRE APELLIDO PATERNO APELLIDO MATERNO";
const MOCK_EMAIL = "usuario.ejemplo@correo.com";
const MOCK_HOURS = 24;
const MOCK_COURSES = 3;

const MOCK_ACHIEVEMENT_TITLE = "¡Soy Voluntario!";
const MOCK_ACHIEVEMENT_DESC =
  "Termina tu Formación Institucional y culmina con el primer paso para ser Voluntario.";

export default function ProfilePlatformSmall() {
  const navigate = useNavigate();

  const [photoUrl, setPhotoUrl] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(true);

  // Carga de foto desde /documentos/mios (mismo enfoque que en ProfilePlatform)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoadingPhoto(true);
      setPhotoUrl(null);
      try {
        if (!user) {
          setLoadingPhoto(false);
          return;
        }
        const token = await user.getIdToken(true);

        const resp = await axios.get(`${BACKEND_URL}/documentos/mios`, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        });

        if (resp.status >= 200 && resp.status < 300 && resp.data) {
          const d = resp.data;

          const direct =
            d.foto_url ||
            d.fotoUrl ||
            d.foto ||
            d.fotoFirebaseUrl ||
            d.foto_firebase_url;

          let normalized = null;
          if (direct && typeof direct === "string") normalized = direct;
          if (!normalized && direct && typeof direct === "object") {
            normalized = direct.url || direct.link || direct.firebase_url || null;
          }

          setPhotoUrl(normalized || null);
        }
      } catch (_) {
        // fallback silencioso
      } finally {
        setLoadingPhoto(false);
      }
    });
    return () => unsub();
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      {/* PANEL PERFIL (versión móvil full width) */}
      <Box
        sx={{
          backgroundColor: "#ffffff",
          borderRadius: 3,
          boxShadow: "0 5px 14px rgba(255, 0, 0, 0.1)",
          pb: 2.4,
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            backgroundColor: "#e6dfef",
            textAlign: "center",
            py: 1.3,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Arial', sans-serif",
              fontWeight: 700,
              fontSize: "0.9rem",
              letterSpacing: 1,
            }}
          >
            BIENVENIDO/A
          </Typography>
        </Box>

        {/* FOTO */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mt: 2,
            mb: 2,
          }}
        >
          {photoUrl && !loadingPhoto ? (
            <Box
              sx={{
                width: 96,
                height: 96,
                borderRadius: "9999px",
                overflow: "hidden",
                boxShadow: "0 4px 10px rgba(255, 0, 0, 0.12)",
                border: "3px solid #fff8ff",
                backgroundColor: "#fff8ff",
              }}
            >
              <img
                src={photoUrl}
                alt="Foto de perfil"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                referrerPolicy="no-referrer"
              />
            </Box>
          ) : (
            <FaUserCircle
              size={96}
              color="#ee140a"
              style={{ opacity: loadingPhoto ? 0.6 : 1 }}
              title={loadingPhoto ? "Cargando foto..." : "Sin foto de perfil"}
            />
          )}
        </Box>

        {/* DATOS */}
        <Box
          sx={{
            px: 2.4,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            textAlign: "center",
          }}
        >
          {/* NOMBRE */}
          <Typography
            sx={{
              fontFamily: "'Arial', sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              textTransform: "uppercase",
              color: "#000",
            }}
          >
            {MOCK_FULL_NAME}
          </Typography>

          {/* CORREO */}
          <Typography
            sx={{
              fontFamily: "'Arial', sans-serif",
              fontSize: "0.82rem",
              color: "#867d91",
              wordBreak: "break-word",
            }}
          >
            {MOCK_EMAIL}
          </Typography>

          {/* BOTÓN IDENTIFICACIÓN */}
          <Button
            onClick={() => navigate("/MiIdentificacion")}
            sx={{
              backgroundColor: "#ff3333",
              color: "#fff",
              textTransform: "none",
              fontFamily: "'Arial', sans-serif",
              borderRadius: "999px",
              px: 2.6,
              py: 0.8,
              fontSize: "0.8rem",
              alignSelf: "center",
              "&:hover": {
                backgroundColor: "#e02a2a",
              },
            }}
          >
            Ver mi identificación digital
          </Button>

          {/* HORAS / CURSOS */}
          <Box
            sx={{
              display: "flex",
              mt: 1.8,
            }}
          >
            {/* HORAS */}
            <Box
              sx={{
                flex: 1,
                textAlign: "center",
                pr: 1.4,
                borderRight: "1px solid #e0d7f0",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'Arial', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.35rem",
                }}
              >
                {MOCK_HOURS}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Arial', sans-serif",
                  color: "#867d91",
                  fontSize: "0.74rem",
                }}
              >
                HORAS
              </Typography>
            </Box>

            {/* CURSOS */}
            <Box
              sx={{
                flex: 1,
                textAlign: "center",
                pl: 1.4,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'Arial', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.35rem",
                }}
              >
                {MOCK_COURSES}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Arial', sans-serif",
                  color: "#867d91",
                  fontSize: "0.74rem",
                }}
              >
                CURSOS
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 🏅 LOGRO MÁS RECIENTE (igual concepto que el grande) */}
      <Box
        sx={{
          backgroundColor: "#ffffff",
          borderRadius: 3,
          boxShadow: "0 5px 14px rgba(255, 0, 0, 0.1)",
          pb: 2,
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            backgroundColor: "#e6dfef",
            textAlign: "center",
            py: 1.2,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Arial', sans-serif",
              fontWeight: 700,
              fontSize: "0.88rem",
              textTransform: "uppercase",
            }}
          >
            TU LOGRO MÁS RECIENTE
          </Typography>
        </Box>

        {/* CONTENIDO DEL LOGRO */}
        <Box
          sx={{
            backgroundColor: "#fff8ff",
            borderRadius: 2,
            mx: 2.2,
            my: 1.8,
            p: 1.8,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 1.4,
          }}
        >
          {/* ÍCONO CON ANIMACIÓN */}
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulse-medal 1.8s ease-in-out infinite",
              "@keyframes pulse-medal": {
                "0%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.1)" },
                "100%": { transform: "scale(1)" },
              },
            }}
          >
            <FaMedal size={26} color="#ff3333" />
          </Box>

          {/* TEXTO DEL LOGRO */}
          <Box>
            <Typography
              sx={{
                fontFamily: "'Arial', sans-serif",
                fontWeight: 700,
                fontSize: "0.86rem",
                mb: 0.3,
                color: "#000",
              }}
            >
              {MOCK_ACHIEVEMENT_TITLE}
            </Typography>

            <Typography
              sx={{
                fontFamily: "'Arial', sans-serif",
                fontSize: "0.72rem",
                color: "#867d91",
                lineHeight: 1.35,
              }}
            >
              {MOCK_ACHIEVEMENT_DESC}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
