// src/components/ProfilePlatformSmall.jsx
// -----------------------------------------------------------------------------
// Este componente es la versión “small” (móvil / cards full width).
// Antes traía MOCK_* y mostraba HORAS/CURSOS.
// Ahora iguala la lógica del componente grande:
//
//   - DÍAS: rango inclusivo entre la primera actividad iniciada y la última terminada/vista
//   - ACTIVIDADES: total de activity_id con status='completed'
//
// Carga también foto y perfil básico desde backend.
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaMedal } from "react-icons/fa";
import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const BACKEND_URL = "https://vol-backend.onrender.com";

// Fallbacks (cuando no hay sesión / falla backend)
const MOCK_FULL_NAME = "NOMBRE APELLIDO PATERNO APELLIDO MATERNO";
const MOCK_EMAIL = "usuario.ejemplo@correo.com";
const MOCK_DAYS = "?";
const MOCK_ACTIVITIES = "?";

const MOCK_ACHIEVEMENT_TITLE = "¡Soy Voluntario!";
const MOCK_ACHIEVEMENT_DESC =
  "Termina tu Formación Institucional y culmina con el primer paso para ser Voluntario.";

// Helper: primer valor no vacío de un conjunto de keys
function firstNonEmpty(obj, keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

// Helper: parse seguro de fechas
function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Estadísticas desde user_activity_progress
function computeActivityStats(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];

  const completedCount = safeRows.reduce((acc, r) => {
    const st = String(r?.status || "").toLowerCase();
    return st === "completed" ? acc + 1 : acc;
  }, 0);

  let minDate = null;
  let maxDate = null;

  for (const r of safeRows) {
    const started = toDate(r?.started_at);
    const completed = toDate(r?.completed_at);
    const lastSeen = toDate(r?.last_seen_at);

    const candidateStart = started || completed || lastSeen;
    const candidateEnd = completed || lastSeen || started;

    if (candidateStart) {
      if (!minDate || candidateStart < minDate) minDate = candidateStart;
    }
    if (candidateEnd) {
      if (!maxDate || candidateEnd > maxDate) maxDate = candidateEnd;
    }
  }

  let days = null;
  if (minDate && maxDate) {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const diffMs = maxDate.getTime() - minDate.getTime();
    const diffDays = Math.floor(diffMs / MS_PER_DAY);
    days = Math.max(1, diffDays + 1);
  }

  return { completedCount, days };
}

// Igual que en el grande: probamos varios endpoints hasta encontrar uno que responda.
async function fetchProgressRows(token) {
  const endpoints = [
    `${BACKEND_URL}/progreso/me/activity-progress`,
    `${BACKEND_URL}/progreso/me/activity-progress/list`,
    `${BACKEND_URL}/progreso/me/progress`,
    `${BACKEND_URL}/progreso/me`,
  ];

  for (const url of endpoints) {
    try {
      const resp = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true,
      });

      if (!(resp.status >= 200 && resp.status < 300)) continue;

      const data = resp.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.rows)) return data.rows;
      if (data && Array.isArray(data.data)) return data.data;
    } catch (_) {
      // seguimos intentando
    }
  }

  return null;
}

export default function ProfilePlatformSmall() {
  const navigate = useNavigate();

  const [photoUrl, setPhotoUrl] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(true);

  const [fullName, setFullName] = useState(MOCK_FULL_NAME);
  const [email, setEmail] = useState(MOCK_EMAIL);

  const [days, setDays] = useState(MOCK_DAYS);
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);

  // Carga de foto + perfil + stats reales
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoadingPhoto(true);
      setPhotoUrl(null);

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

        // 1) Foto
        try {
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
          setPhotoUrl(null);
        }

        // 2) Perfil básico
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
        } catch (_) {
          setFullName(MOCK_FULL_NAME);
          setEmail(user.email || MOCK_EMAIL);
        }

        // 3) Stats reales (DÍAS y ACTIVIDADES)
        try {
          const rows = await fetchProgressRows(token);

          if (rows) {
            const { completedCount, days: computedDays } = computeActivityStats(rows);

            setActivities(
              Number.isFinite(Number(completedCount)) ? Number(completedCount) : MOCK_ACTIVITIES
            );

            setDays(
              computedDays !== null && computedDays !== undefined
                ? computedDays
                : MOCK_DAYS
            );
          } else {
            setActivities(MOCK_ACTIVITIES);
            setDays(MOCK_DAYS);
          }
        } catch (_) {
          setActivities(MOCK_ACTIVITIES);
          setDays(MOCK_DAYS);
        }
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

          {/* DÍAS / ACTIVIDADES */}
          <Box
            sx={{
              display: "flex",
              mt: 1.8,
            }}
          >
            {/* DÍAS */}
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
                {days}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Arial', sans-serif",
                  color: "#867d91",
                  fontSize: "0.74rem",
                }}
              >
                DÍAS
              </Typography>
            </Box>

            {/* ACTIVIDADES */}
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
                {activities}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Arial', sans-serif",
                  color: "#867d91",
                  fontSize: "0.74rem",
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
