// src/components/ProfilePlatform.js
// -----------------------------------------------------------------------------
// Este componente es el panel de perfil (desktop / sidebar).
// Antes mostraba "HORAS" y "CURSOS" usando un endpoint legacy.
// Ahora muestra:
//   - DÍAS: diferencia (en días) entre la primera actividad iniciada y la última actividad terminada/vista
//   - ACTIVIDADES: cantidad de activity_id con status = 'completed'
// Todo se calcula usando el UID de Firebase (se manda el Bearer token como siempre).
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaMedal } from "react-icons/fa";
import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const BACKEND_URL = "https://vol-backend.onrender.com";

// ---- FALLBACK DATA (solo para cuando no hay sesión / falla algo) ----
// Nota: los dejamos porque tu UI ya los usa y así no truena nada visualmente.
const MOCK_FULL_NAME = "NOMBRE APELLIDO PATERNO APELLIDO MATERNO";
const MOCK_EMAIL = "usuario.ejemplo@correo.com";
const MOCK_DAYS = "?";
const MOCK_ACTIVITIES = "?";

export const MOCK_ACHIEVEMENT_TITLE = "¡Día Internacional del Voluntariado!";
export const MOCK_ACHIEVEMENT_DESC =
  "Tu cuenta estuvo activa en la conmemoración del Día Internacional del Voluntariado del 2025.";

// Helper: agarra el primer campo que venga con valor (para sobrevivir a APIs “creativas”).
function firstNonEmpty(obj, keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}


/**
 * ✅ Progreso real desde tu endpoint nuevo:
 *   GET /progreso/me/resumen
 *
 * Respuesta esperada (ejemplo):
 *  {
 *    activitiesCompleted: number,
 *    daysActive: number,
 *    firstActivityAt: string|null,
 *    lastActivityAt: string|null
 *  }
 *
 * Ojo: si el usuario no tiene actividad, el backend puede regresar 0s.
 */
async function fetchProgressResumen(token) {
  const url = `${BACKEND_URL}/progreso/me/resumen`;
  const resp = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    validateStatus: () => true,
  });

  if (!(resp.status >= 200 && resp.status < 300)) {
    // No rompemos: solo lanzamos error para que el caller haga fallback
    const msg =
      resp?.data?.error ||
      resp?.data?.message ||
      `No se pudo cargar resumen (${resp.status})`;
    throw new Error(msg);
  }

  return resp.data || {};
}


export default function UserPanel() {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(true);

  // Datos reales (perfil + stats)
  const [fullName, setFullName] = useState(MOCK_FULL_NAME);
  const [email, setEmail] = useState(MOCK_EMAIL);

  // Antes eran hours/courses; ahora son days/activities.
  const [days, setDays] = useState(MOCK_DAYS);
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);

  // ---- FOTO + PERFIL BÁSICO + PROGRESO REAL ----
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoadingPhoto(true);
      setPhotoUrl(null);

      // Reset por si no hay sesión
      if (!user) {
        setFullName(MOCK_FULL_NAME);
        setEmail(MOCK_EMAIL);
        setDays(MOCK_DAYS);
        setActivities(MOCK_ACTIVITIES);
        setLoadingPhoto(false);
        return;
      }

      try {
        const token = await user.getIdToken(true);

        // 1) DOCUMENTOS (para foto)
        try {
          const respDocs = await axios.get(`${BACKEND_URL}/documentos/mios`, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true,
          });

          if (respDocs.status >= 200 && respDocs.status < 300 && respDocs.data) {
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
              normalized = direct.url || direct.link || direct.firebase_url || null;
            }

            setPhotoUrl(normalized || null);
          }
        } catch {
          setPhotoUrl(null);
        }

        // 2) PERFIL BÁSICO (nombre + apellidos + correo)
        try {
          const respUser = await axios.get(`${BACKEND_URL}/public/validar-usuario`, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true,
          });

          if (respUser.status >= 200 && respUser.status < 300 && respUser.data) {
            const basic = respUser.data;

            const nombre = firstNonEmpty(basic, ["nombre", "name"]) || "";
            const apPat =
              firstNonEmpty(basic, ["apellidoPat", "apellido_pat", "apellido_paterno"]) ||
              "";
            const apMat =
              firstNonEmpty(basic, ["apellidoMat", "apellido_mat", "apellido_materno"]) ||
              "";

            const correo =
              firstNonEmpty(basic, ["correo", "email", "correo_electronico"]) ||
              user.email ||
              "";

            const full = [nombre, apPat, apMat].filter(Boolean).join(" ");

            setFullName(full || MOCK_FULL_NAME);
            setEmail(correo || MOCK_EMAIL);
          } else {
            setFullName(MOCK_FULL_NAME);
            setEmail(user.email || MOCK_EMAIL);
          }
        } catch {
          setFullName(MOCK_FULL_NAME);
          setEmail(user.email || MOCK_EMAIL);
        }

        // 3) PROGRESO REAL (endpoint nuevo): DÍAS + ACTIVIDADES
        try {
          const resumen = await fetchProgressResumen(token);

          // ACTIVIDADES completadas (status='completed' en user_activity_progress)
          const completed =
            resumen?.activitiesCompleted ??
            resumen?.completedActivities ??
            resumen?.completed ??
            resumen?.count ??
            0;

          setActivities(
            Number.isFinite(Number(completed)) ? Number(completed) : MOCK_ACTIVITIES
          );

          // DÍAS activos (rango inclusivo entre primera y última actividad)
          const daysActive =
            resumen?.daysActive ?? resumen?.activeDays ?? resumen?.days ?? 0;

          setDays(
            Number.isFinite(Number(daysActive)) ? Number(daysActive) : MOCK_DAYS
          );
        } catch {
          // Si falla el endpoint, no rompemos UI
          setActivities(MOCK_ACTIVITIES);
          setDays(MOCK_DAYS);
        }
      } catch {
        // Token falló, o algo grave
        setFullName(MOCK_FULL_NAME);
        setEmail(MOCK_EMAIL);
        setDays(MOCK_DAYS);
        setActivities(MOCK_ACTIVITIES);
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

          {/* DÍAS / ACTIVIDADES (reemplaza HORAS / CURSOS) */}
          <Box sx={{ display: "flex", mt: 1.8 }}>
            {/* DÍAS */}
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
                {days}
              </Typography>
              <Typography
                sx={{
                  color: "#867d91",
                  fontSize: "0.72rem",
                }}
              >
                DÍAS
              </Typography>
            </Box>

            {/* ACTIVIDADES */}
            <Box sx={{ flex: 1, textAlign: "center", pl: 1.4 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "1.4rem",
                }}
              >
                {activities}
              </Typography>
              <Typography
                sx={{
                  color: "#867d91",
                  fontSize: "0.72rem",
                }}
              >
                ACTIVIDADES
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
