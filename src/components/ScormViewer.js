import React, { useEffect, useState } from "react";
import { Box, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { FiX } from "react-icons/fi";

/**
 * SCORM Viewer (ZIP → wrapper launchUrl vía backend)
 *
 * Props:
 * - activity: activity object (must include id + config)
 * - backendUrl: e.g. https://vol-backend.onrender.com
 * - resolveAssetUrl: (path) => absolute url
 * - postWithAuth: (url, body) => fetch helper with Firebase Bearer token
 * - onScormComplete: ({ score, cmi }) => callback when completion detected
 * - colors: optional palette (matches CourseTimeline COLORS)
 */
export default function ScormViewer({
  activity,
  backendUrl,
  resolveAssetUrl,
  postWithAuth,
  onScormComplete,
  colors,
}) {
  const COLORS =
    colors ||
    {
      white: "#ffffff",
      whiteSoft: "#fff8ff",
      whiteAlt: "#f7f2ff",
      subtle: "#e6dfef",
      red: "#ff3333",
      redDark: "#cc0000",
      textMain: "#2d233a",
      textMuted: "#6c6478",
    };

  const config = activity?.config || {};
  const scormPackageUrl = config?.scormPackageUrl ? resolveAssetUrl?.(config.scormPackageUrl) : null;
  const initialLaunchUrl = config?.launchUrl ? resolveAssetUrl?.(config.launchUrl) : null;

  const [open, setOpen] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [launchUrl, setLaunchUrl] = useState(initialLaunchUrl);
  const [mounting, setMounting] = useState(false);
  const [mountError, setMountError] = useState(null);
  const [maybeBlocked, setMaybeBlocked] = useState(false);

  useEffect(() => {
    setOpen(false);
    setIframeError(false);
    setLaunchUrl(initialLaunchUrl);
    setMounting(false);
    setMountError(null);
    setMaybeBlocked(false);
  }, [activity?.id, initialLaunchUrl]);

  const toBackendAbsolute = (maybeUrl) => {
    if (!maybeUrl) return null;
    const s = String(maybeUrl).trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) return s;
    return `${backendUrl}${s.startsWith("/") ? "" : "/"}${s}`;
  };

  const ensureLaunchUrl = async () => {
    if (launchUrl) return launchUrl;
    if (!scormPackageUrl) return null;
    if (!backendUrl) throw new Error("Falta backendUrl para SCORM.");

    setMounting(true);
    setMountError(null);

    try {
      const resp = await postWithAuth?.(`${backendUrl}/progreso/scorm/activities/${activity.id}/mount`, {
        scormPackageUrl: config.scormPackageUrl,
      });

      const url = resp?.launchUrl ? toBackendAbsolute(resp.launchUrl) : null;
      if (!url) throw new Error("El backend no devolvió url");

      setLaunchUrl(url);
      return url;
    } catch (e) {
      setMountError(e?.message || "No se pudo cargar el SCORM");
      return null;
    } finally {
      setMounting(false);
    }
  };

  const isCompletionFromCmi = (cmi) => {
    if (!cmi || typeof cmi !== "object") return false;
    const completion = String(cmi["cmi.completion_status"] || cmi["cmi.core.lesson_status"] || "").toLowerCase();
    const success = String(cmi["cmi.success_status"] || "").toLowerCase();
    if (["completed", "passed"].includes(completion)) return true;
    if (success === "passed") return true;
    return false;
  };

  // Listener SCORM commits
  useEffect(() => {
    if (!backendUrl) return;

    const backendOrigin = (() => {
      try {
        return new URL(backendUrl).origin;
      } catch {
        return backendUrl;
      }
    })();

    const handler = async (event) => {
      try {
        if (event.origin !== backendOrigin) return;

        const data = event.data || {};
        if (data?.type !== "SCORM_COMMIT") return;
        if (String(data.activityId) !== String(activity?.id)) return;

        const cmi = data.cmi || {};

        try {
          await postWithAuth?.(`${backendUrl}/progreso/scorm/activities/${activity.id}/commit`, {
            cmi,
            raw: data.raw || null,
          });
        } catch (e) {
          console.warn("❌ SCORM commit backend error:", e);
        }

        if (isCompletionFromCmi(cmi)) {
          onScormComplete?.({
            cmi,
            score: Number(cmi["cmi.score.raw"] ?? cmi["cmi.core.score.raw"] ?? null),
          });
        }
      } catch (e) {
        console.warn("SCORM message handler error:", e);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [activity?.id, backendUrl, postWithAuth, onScormComplete]);

  if (!scormPackageUrl && !launchUrl) {
    return (
      <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
        Falta configurar <code>config.scormPackageUrl</code> o <code>config.launchUrl</code>.
      </Typography>
    );
  }

  const startInline = async () => {
    setIframeError(false);
    setMaybeBlocked(false);
    const url = await ensureLaunchUrl();
    if (!url) return;
    setOpen(true);

    // Si el navegador bloquea por headers, a veces no dispara onError.
    setTimeout(() => {
      setMaybeBlocked((prev) => prev || false);
    }, 1500);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        {activity?.title || activity?.name || "Contenido SCORM"}
      </Typography>

      {/* Botón centrado */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 1, mb: 1.25 }}>
        <Button
          variant="contained"
          size="small"
          onClick={startInline}
          disabled={mounting}
          sx={{
            backgroundColor: COLORS.red,
            "&:hover": { backgroundColor: COLORS.redDark },
            px: 3,
            borderRadius: 999,
            fontWeight: 950,
            textTransform: "none",
          }}
        >
          {mounting ? "Cargando..." : "Iniciar"}
        </Button>
      </Box>

      {mountError && (
        <Typography variant="caption" sx={{ color: COLORS.redDark, display: "block", textAlign: "center" }}>
          {mountError}
        </Typography>
      )}

      {/* Inline player (NO MODAL) */}
      {open && launchUrl && (
        <Box sx={{ mt: 1.5 }}>
          <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: 0.75 }}>
            <Tooltip title="Cerrar">
              <IconButton
                size="small"
                onClick={() => {
                  setOpen(false);
                  setIframeError(false);
                  setMaybeBlocked(false);
                }}
                sx={{
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.subtle}`,
                  "&:hover": { backgroundColor: COLORS.whiteAlt },
                }}
              >
                <FiX size={16} />
              </IconButton>
            </Tooltip>
          </Stack>

          {!iframeError ? (
            <Box
              sx={{
                width: "100%",
                height: "70vh",
                borderRadius: 2,
                overflow: "hidden",
                border: `1px solid ${COLORS.subtle}`,
                backgroundColor: "#000",
              }}
            >
              <iframe
                key={launchUrl}
                src={launchUrl}
                title="SCORM"
                style={{ width: "100%", height: "100%", border: 0, display: "block" }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                allow="fullscreen"
                referrerPolicy="no-referrer"
                onLoad={() => setMaybeBlocked(false)}
                onError={() => setIframeError(true)}
              />
            </Box>
          ) : (
            <Box
              sx={{
                p: 2,
                backgroundColor: COLORS.whiteSoft,
                borderRadius: 2,
                border: `1px solid ${COLORS.subtle}`,
              }}
            >
              <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                Este contenido no pudo mostrarse embebido.
              </Typography>
            </Box>
          )}

          {!iframeError && maybeBlocked && (
            <Box
              sx={{
                mt: 1,
                p: 1.25,
                backgroundColor: COLORS.whiteSoft,
                borderRadius: 2,
                border: `1px solid ${COLORS.subtle}`,
              }}
            >
              <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                Si aquí ves “rechazó la conexión”, contacta a soporte.
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
