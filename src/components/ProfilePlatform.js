// src/components/ProfilePlatform.js
import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaMedal } from "react-icons/fa";
import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const BACKEND_URL = "https://vol-backend.onrender.com";

// ---- TEMP / FALLBACK DATA ----
const MOCK_FULL_NAME = "NOMBRE APELLIDO PATERNO APELLIDO MATERNO";
const MOCK_EMAIL = "usuario.ejemplo@correo.com";
const MOCK_HOURS = "?";
const MOCK_COURSES = "?";

export const MOCK_ACHIEVEMENT_TITLE = "¡Día Internacional del Voluntariado!";
export const MOCK_ACHIEVEMENT_DESC =
  "Tu cuenta estuvo activa en la conmemoración del Día Internacional del Voluntariado del 2025.";

// Helper sencillo tipo MiPerfil
function firstNonEmpty(obj, keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

export default function UserPanel() {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(true);

  // 👉 nuevos states para datos reales
  const [fullName, setFullName] = useState(MOCK_FULL_NAME);
  const [email, setEmail] = useState(MOCK_EMAIL);
  const [hours, setHours] = useState(MOCK_HOURS);
  const [courses, setCourses] = useState(MOCK_COURSES);

  // ---- FOTO + PERFIL BÁSICO + CURSOS COMPLETADOS ----
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoadingPhoto(true);
      setPhotoUrl(null);

      // reset a fallback por si no hay sesión
      if (!user) {
        setFullName(MOCK_FULL_NAME);
        setEmail(MOCK_EMAIL);
        setHours(MOCK_HOURS);
        setCourses(MOCK_COURSES);
        setLoadingPhoto(false);
        return;
      }

      try {
        const token = await user.getIdToken(true);

        // 1) DOCUMENTOS (para foto)
        try {
          const respDocs = await axios.get(
            `${BACKEND_URL}/documentos/mios`,
            {
              headers: { Authorization: `Bearer ${token}` },
              validateStatus: () => true,
            }
          );

          if (
            respDocs.status >= 200 &&
            respDocs.status < 300 &&
            respDocs.data
          ) {
            const d = respDocs.data;
            const direct =
              d.foto_url ||
              d.fotoUrl ||
              d.foto ||
              d.fotoFirebaseUrl ||
              d.foto_firebase_url;

            let normalized = null;
            if (typeof direct === "string") normalized = direct;
            if (!normalized && direct && typeof direct === "object") {
              normalized =
                direct.url || direct.link || direct.firebase_url || null;
            }

            setPhotoUrl(normalized || null);
          }
        } catch {
          setPhotoUrl(null);
        }

        // 2) PERFIL BÁSICO (nombre + apellidos + correo)
        try {
          const respUser = await axios.get(
            `${BACKEND_URL}/public/validar-usuario`,
            {
              headers: { Authorization: `Bearer ${token}` },
              validateStatus: () => true,
            }
          );

          if (
            respUser.status >= 200 &&
            respUser.status < 300 &&
            respUser.data
          ) {
            const basic = respUser.data;

            const nombre = firstNonEmpty(basic, ["nombre", "name"]) || "";
            const apPat =
              firstNonEmpty(basic, [
                "apellidoPat",
                "apellido_pat",
                "apellido_paterno",
              ]) || "";
            const apMat =
              firstNonEmpty(basic, [
                "apellidoMat",
                "apellido_mat",
                "apellido_materno",
              ]) || "";

            const correo =
              firstNonEmpty(basic, [
                "correo",
                "email",
                "correo_electronico",
              ]) || user.email || "";

            const full = [nombre, apPat, apMat].filter(Boolean).join(" ");

            setFullName(full || MOCK_FULL_NAME);
            setEmail(correo || MOCK_EMAIL);

            // 🔁 horas: por ahora fijo en 0 / "?"
            const horas = 0;
            setHours(
              horas !== null && horas !== undefined ? horas : MOCK_HOURS
            );
          } else {
            setFullName(MOCK_FULL_NAME);
            setEmail(user.email || MOCK_EMAIL);
            setHours(MOCK_HOURS);
          }
        } catch {
          setFullName(MOCK_FULL_NAME);
          setEmail(user.email || MOCK_EMAIL);
          setHours(MOCK_HOURS);
        }

        // 3) CURSOS COMPLETADOS: /inscripciones/me/completed-count
        try {
          const respCompleted = await axios.get(
            `${BACKEND_URL}/inscripciones/me/completed-count`,
            {
              headers: { Authorization: `Bearer ${token}` },
              validateStatus: () => true,
            }
          );

          if (
            respCompleted.status >= 200 &&
            respCompleted.status < 300 &&
            respCompleted.data &&
            respCompleted.data.total !== undefined &&
            respCompleted.data.total !== null
          ) {
            const total = respCompleted.data.total;
            setCourses(
              Number.isFinite(Number(total)) ? Number(total) : MOCK_COURSES
            );
          } else {
            setCourses(MOCK_COURSES);
          }
        } catch {
          setCourses(MOCK_COURSES);
        }
      } catch {
        setFullName(MOCK_FULL_NAME);
        setEmail(MOCK_EMAIL);
        setHours(MOCK_HOURS);
        setCourses(MOCK_COURSES);
      } finally {
        setLoadingPhoto(false);
      }
    });

    return () => unsub();
  }, []);

  return (
    <Box
      sx={{
        width: "330px",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: 2.4,
        boxSizing: "border-box",
        position: "relative",
        top: "-150px",
      }}
    >
      {/* PANEL PERFIL */}
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
            py: 1.4,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Arial', sans-serif",
              fontWeight: 700,
              fontSize: "0.92rem",
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
            mt: 2.2,
            mb: 2,
          }}
        >
          {photoUrl && !loadingPhoto ? (
            <Box
              sx={{
                width: "68%",
                aspectRatio: "1 / 1",
                borderRadius: "9999px",
                overflow: "hidden",
                boxShadow: "0 5px 12px rgba(255, 0, 0, 0.1)",
                border: "4px solid #fff8ff",
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
              size="100%"
              color="#ee140a"
              style={{ width: "68%", opacity: loadingPhoto ? 0.6 : 1 }}
            />
          )}
        </Box>

        {/* DATOS */}
        <Box
          sx={{
            mx: 2.6,
            mb: 2.8,
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
            {fullName}
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
            {email}
          </Typography>

          {/* BOTÓN IDENTIFICACIÓN DESHABILITADO */}
          <Button
            disabled
            onClick={() => navigate("/MiIdentificacion")}
            sx={{
              backgroundColor: "#e0e0e0",
              color: "#9e9e9e",
              textTransform: "none",
              fontFamily: "'Arial', sans-serif",
              borderRadius: "999px",
              px: 2.8,
              py: 0.75,
              fontSize: "0.78rem",
              alignSelf: "center",
              cursor: "not-allowed",
              boxShadow: "none",
              "&.Mui-disabled": {
                backgroundColor: "#e0e0e0",
                color: "#9e9e9e",
              },
              "&:hover": {
                backgroundColor: "#e0e0e0",
              },
            }}
          >
            Ver mi identificación digital
          </Button>

          {/* HORAS / CURSOS */}
          <Box sx={{ display: "flex", mt: 1.8 }}>
            <Box
              sx={{
                flex: 1,
                textAlign: "center",
                pr: 1.4,
                borderRight: "1px solid #867d91",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "1.4rem",
                }}
              >
                {hours}
              </Typography>
              <Typography
                sx={{
                  color: "#867d91",
                  fontSize: "0.72rem",
                }}
              >
                HORAS
              </Typography>
            </Box>

            <Box sx={{ flex: 1, textAlign: "center", pl: 1.4 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "1.4rem",
                }}
              >
                {courses}
              </Typography>
              <Typography
                sx={{
                  color: "#867d91",
                  fontSize: "0.72rem",
                }}
              >
                CURSOS
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 🏅 LOGRO MÁS RECIENTE */}
      <Box
        sx={{
          backgroundColor: "#ffffff",
          borderRadius: 3,
          boxShadow: "0 5px 14px rgba(255, 0, 0, 0.1)",
          mt: 2.8,
          pb: 2,
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
              textTransform: "uppercase",
            }}
          >
            TU LOGRO MÁS RECIENTE
          </Typography>
        </Box>

        {/* CONTENIDO */}
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
          {/* ÍCONO */}
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
            <FaMedal size={28} color="#ff3333" />
          </Box>

          {/* TEXTO */}
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontFamily: "'Arial', sans-serif",
                fontSize: "0.88rem",
                mb: 0.3,
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
