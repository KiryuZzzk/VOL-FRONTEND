// SolicitudViewer.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Alert,
  Chip,
  TextField,
  Divider,
  LinearProgress,
} from "@mui/material";
import { FiSend, FiRefreshCw, FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";

import { auth } from "../firebase";

// Ajusta si tu backend URL vive en otro lado (ideal: env var)
const BACKEND_URL = "https://vol-backend.onrender.com";

// Colores similares a tu estilo (si ya tienes COLORS global, puedes quitar esto y usar el tuyo)
const COLORS = {
  whiteSoft: "#fff8ff",
  subtle: "#e6dfef",
  red: "#ff3333",
  redDark: "#cc0000",
  textMain: "#2d233a",
  textMuted: "#6c6478",
};

const safeParseConfig = (config) => {
  if (!config) return {};
  if (typeof config === "object") return config;
  if (typeof config === "string") {
    try {
      return JSON.parse(config);
    } catch {
      return {};
    }
  }
  return {};
};

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado");
  return user.getIdToken(true);
}

async function getWithAuth(url) {
  const token = await getToken();
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error || j?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json().catch(() => ({}));
}

async function postWithAuth(url, body) {
  const token = await getToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body || {}),
  });

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error || j?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json().catch(() => ({}));
}

const statusMeta = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "approved")
    return { label: "Aprobada", color: "success", icon: <FiCheckCircle size={14} /> };
  if (s === "rejected")
    return { label: "Rechazada", color: "error", icon: <FiXCircle size={14} /> };
  if (s === "submitted")
    return { label: "En revisión", color: "warning", icon: <FiClock size={14} /> };
  return { label: "Sin enviar", color: "default", icon: null };
};

/**
 * Props:
 * - activity: objeto de actividad (de tu timeline)
 * - onSubmitted?: callback({request}) para refrescar el parent si quieres
 */
export default function SolicitudViewer({ activity, onSubmitted }) {
  const activityId = useMemo(() => {
    const n = Number(activity?.id ?? activity?.activity_id ?? activity?.activityId ?? null);
    return Number.isFinite(n) ? n : null;
  }, [activity]);

  const config = useMemo(() => safeParseConfig(activity?.config), [activity]);

  // Tomamos "request_key" / "request_title" desde config si existe (como pediste)
  const requestKey = useMemo(() => {
    return (
      config?.request_key ||
      config?.requestKey ||
      config?.key ||
      config?.code ||
      "SOLICITUD"
    );
  }, [config]);

  const requestTitle = useMemo(() => {
    return (
      config?.request_title ||
      config?.requestTitle ||
      config?.title ||
      activity?.title ||
      activity?.name ||
      "Solicitud"
    );
  }, [config, activity]);

  const placeholder = useMemo(() => {
    return (
      config?.placeholder ||
      "Escribe aquí tu solicitud (comentarios, detalles, contexto, etc.)"
    );
  }, [config]);

  const helperText = useMemo(() => {
    return (
      config?.helperText ||
      "Tu solicitud será revisada por un coordinador/a. Te hará llegar su respuesta por correo electrónico o WhatsApp."
    );
  }, [config]);

  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [existing, setExisting] = useState(null); // request o null
  const [comment, setComment] = useState("");

  const existingStatus = String(existing?.status || "").toLowerCase();
  const meta = statusMeta(existingStatus);

  const blocked =
    existingStatus === "submitted" || existingStatus === "approved"; // no duplicar
  const canResubmit = existingStatus === "rejected"; // sí permite reenviar
  const hasExisting = !!existing;

  const fetchExisting = async () => {
    if (!activityId) return;
    setLoadingExisting(true);
    setError(null);

    try {
      const resp = await getWithAuth(`${BACKEND_URL}/progreso/actividades/${activityId}/solicitud`);
      setExisting(resp?.request || null);

      // Si hay solicitud, precarga comentario (solo para que el user lo vea)
      if (resp?.request?.user_comment) setComment(resp.request.user_comment);
      else if (!resp?.request) setComment("");
    } catch (e) {
      // En caso de error suave, no rompemos UI
      console.warn("get solicitud error:", e);
      setExisting(null);
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    setExisting(null);
    setComment("");
    setError(null);
    setSuccess(null);
    fetchExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!activityId) throw new Error("activityId inválido");
      const text = String(comment || "").trim();

      // Default: si config.requiredComment === false, permitimos vacío
      const requiredComment = config?.requiredComment !== false;
      if (requiredComment && !text) {
        throw new Error("Escribe un comentario para enviar la solicitud.");
      }

      // Si ya hay submitted/approved, no permitir
      if (blocked) {
        throw new Error("Ya tienes una solicitud en revisión o aprobada. No puedes duplicarla.");
      }

      const payload = {
        request_key: String(requestKey || "SOLICITUD"),
        request_title: String(requestTitle || "Solicitud"),
        user_comment: text || null,
      };

      const resp = await postWithAuth(
        `${BACKEND_URL}/progreso/actividades/${activityId}/solicitud`,
        payload
      );

      const reqSaved = resp?.request || resp?.data || null;

      setSuccess("Solicitud enviada ✅");
      // refrescamos para traer status oficial y cualquier campo extra
      await fetchExisting();

      onSubmitted?.({ request: reqSaved });
    } catch (e) {
      setError(e?.message || "No se pudo enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: COLORS.textMain, mb: 0.75 }}>
        {requestTitle}
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 1.75,
          borderRadius: 2,
          border: `1px solid ${COLORS.subtle}`,
          backgroundColor: COLORS.whiteSoft,
        }}
      >
        {/* Header status */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={meta.icon || undefined}
              label={meta.label}
              color={meta.color}
              size="small"
              sx={{ fontWeight: 900 }}
            />
            <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 700 }}>
              Solicitud
            </Typography>
          </Stack>

          <Button
            variant="outlined"
            size="small"
            onClick={fetchExisting}
            disabled={loadingExisting || loading}
            startIcon={<FiRefreshCw size={14} />}
            sx={{ borderRadius: 999, fontWeight: 900, textTransform: "none" }}
          >
            {loadingExisting ? "Actualizando..." : "Refrescar"}
          </Button>
        </Stack>

        {loadingExisting && (
          <Box sx={{ mt: 1.25 }}>
            <LinearProgress />
          </Box>
        )}

        <Divider sx={{ my: 1.5, borderColor: COLORS.subtle }} />

        {/* Mensajes */}
        {error && (
          <Alert severity="error" sx={{ mb: 1.25, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 1.25, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        {/* Vista de solicitud existente */}
        {hasExisting && (
          <Box sx={{ mb: 1.25 }}>
            <Typography variant="body2" sx={{ fontWeight: 900, color: COLORS.textMain, mb: 0.5 }}>
              Tu solicitud
            </Typography>

            <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 0.75 }}>
              {helperText}
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 1.25,
                borderRadius: 2,
                border: `1px solid ${COLORS.subtle}`,
                backgroundColor: "#fff",
              }}
            >
              <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 900 }}>
                Comentario enviado:
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.textMain, whiteSpace: "pre-wrap" }}>
                {existing?.user_comment || "—"}
              </Typography>

              <Divider sx={{ my: 1.25, borderColor: COLORS.subtle }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ color: COLORS.textMain, fontWeight: 900 }}>
                  Resultado:
                </Typography>

                <Chip
                  label={meta.label}
                  color={meta.color}
                  size="small"
                  icon={meta.icon || undefined}
                  sx={{ fontWeight: 900 }}
                />

                {existing?.score !== null && existing?.score !== undefined && (
                  <Chip
                    label={`Calificación: ${existing.score}`}
                    size="small"
                    sx={{ fontWeight: 900 }}
                  />
                )}
              </Stack>

              {(existing?.review_note || existing?.reviewNote) && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 900 }}>
                    Comentario del coordinador/a:
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.textMain, whiteSpace: "pre-wrap" }}>
                    {existing?.review_note || existing?.reviewNote}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* Formulario de envío */}
        <Box>
          {!hasExisting && (
            <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 1.0 }}>
              {helperText}
            </Typography>
          )}

          {blocked && (
            <Alert severity="info" sx={{ mb: 1.25, borderRadius: 2 }}>
              Ya tienes una solicitud <b>en revisión</b> o <b>aprobada</b>. No puedes enviar otra.
            </Alert>
          )}

          {canResubmit && (
            <Alert severity="warning" sx={{ mb: 1.25, borderRadius: 2 }}>
              Tu solicitud fue <b>rechazada</b>. Puedes corregir tu comentario y reenviarla.
            </Alert>
          )}

          <TextField
            label="Tu comentario"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={placeholder}
            multiline
            minRows={3}
            fullWidth
            disabled={loading || blocked}
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
              mb: 1.25,
            }}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || blocked}
              startIcon={<FiSend size={16} />}
              sx={{
                backgroundColor: COLORS.red,
                "&:hover": { backgroundColor: COLORS.redDark },
                borderRadius: 999,
                fontWeight: 950,
                textTransform: "none",
                px: 3,
              }}
            >
              {loading ? "Enviando..." : (canResubmit ? "Reenviar solicitud" : "Enviar solicitud")}
            </Button>

            <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 700 }}>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
