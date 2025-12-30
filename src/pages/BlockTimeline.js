import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  LinearProgress,
  Chip,
  Tooltip,
  Button,
  Divider,
} from "@mui/material";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiLock,
  FiStar,
  FiLayers,
  FiArrowLeft,
  FiArrowRight,
  FiZap,
  FiGrid,
} from "react-icons/fi";

import CourseTimeline from "./CourseTimeline";
import data from "../components/datav2.json"; // 👈 ajusta si tu ruta es distinta

// =======================
// 🎨 PALETA BASE
// =======================
const COLORS = {
  bg: "#f5f0ff",
  white: "#ffffff",
  whiteSoft: "#fff8ff",
  whiteAlt: "#f7f2ff",
  subtle: "#e6dfef",
  red: "#ff3333",
  redDark: "#cc0000",
  textMain: "#2d233a",
  textMuted: "#6c6478",
  locked: "#d0cadb",
  line: "#d4ccdf",
};

// Gradientes (distintos por bloque para evitar copy-paste vibe)
// (NO los toqué porque me dijiste que el resto está chingón)
const GRADIENTS = [
  "linear-gradient(135deg, #ff3333 0%, #ff6b6b 100%)",
  "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)",
  "linear-gradient(135deg, #fb7185 0%, #f97316 100%)",
];

const safeTitle = (obj) => obj?.title || obj?.name || "Sin título";

// =======================
// 🧮 STATS
// =======================
const getBlockStats = (block) => {
  let total = 0;
  let done = 0;
  let xpTotal = 0;
  let xpEarned = 0;
  let modulesCount = (block?.modules || []).length;

  (block?.modules || []).forEach((m) => {
    (m?.activities || []).forEach((a) => {
      total += 1;
      const xp = a?.xp || 0;
      xpTotal += xp;
      if (a?.completed) {
        done += 1;
        xpEarned += xp;
      }
    });
  });

  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const completed = total > 0 && done === total;

  return { total, done, percent, completed, xpTotal, xpEarned, modulesCount };
};

const getProgramStats = (blocks) => {
  let total = 0;
  let done = 0;
  let xpTotal = 0;
  let xpEarned = 0;

  (blocks || []).forEach((b) => {
    const s = getBlockStats(b);
    total += s.total;
    done += s.done;
    xpTotal += s.xpTotal;
    xpEarned += s.xpEarned;
  });

  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent, xpTotal, xpEarned };
};

const isBlockLocked = (blocks, index) => {
  if (index === 0) return false;
  const prevStats = getBlockStats(blocks[index - 1]);
  return !prevStats.completed;
};

// =======================
// 🔥 UI helpers
// =======================
const getBlockGradient = (index) => GRADIENTS[index % GRADIENTS.length];

const getStatusMeta = ({ locked, completed }) => {
  if (locked) return { label: "BLOQUEADO", icon: <FiLock size={14} /> };
  if (completed) return { label: "COMPLETADO", icon: <FiCheckCircle size={14} /> };
  return { label: "EN PROGRESO", icon: <FiAlertCircle size={14} /> };
};

// =======================
// 🌟 COMPONENTE PRINCIPAL
// =======================
const BlockTimeline = ({
  programId = "soy_voluntario",
  programs = data?.programs || [],
  initialBlockId = null,
  onActivityClick,
}) => {
  const program = useMemo(() => {
    return (programs || []).find((p) => p.id === programId) || programs?.[0] || null;
  }, [programId, programs]);

  const blocks = useMemo(() => {
    const list = program?.blocks || [];
    return [...list].sort((a, b) => (a?.order ?? 999) - (b?.order ?? 999));
  }, [program]);

  const programStats = useMemo(() => getProgramStats(blocks), [blocks]);

  const [selectedBlockId, setSelectedBlockId] = useState(
    initialBlockId || blocks?.[0]?.id || null
  );
  const [view, setView] = useState("blocks"); // "blocks" | "course"

  useEffect(() => {
    const exists = blocks.some((b) => b.id === selectedBlockId);
    if (!exists) setSelectedBlockId(blocks?.[0]?.id || null);
  }, [blocks, selectedBlockId]);

  const selectedBlock = useMemo(() => {
    return blocks.find((b) => b.id === selectedBlockId) || null;
  }, [blocks, selectedBlockId]);

  if (!program) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">No encontré el programa.</Typography>
      </Box>
    );
  }

  const goToCourse = (blockId) => {
    setSelectedBlockId(blockId);
    setView("course");
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1250,
        mx: "auto",
        py: 3,
        px: { xs: 1.5, md: 2 },
        backgroundColor: COLORS.bg,
      }}
    >
      {/* HEADER PROGRAMA */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2.5,
          borderRadius: 3,
          backgroundColor: COLORS.whiteSoft,
          border: `1px solid ${COLORS.subtle}`,
          position: "relative",
          overflow: "hidden",
        }}
      >

        
<Box
  sx={{
    position: "absolute",
    inset: 0,
    opacity: 1,
    pointerEvents: "none",
    border: "6px solid red",
    borderRadius: 2,
  }}
/>



        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          sx={{ position: "relative", borderRadius: 2,}}
          
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Icon badge (INSTITUCIONAL: rojo sólido/serio) */}
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #cc0000 0%, #ff3333 65%, #ff3939ff 100%)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 10px 18px rgba(0,0,0,0.10)",
                }}
              >
                <FiGrid size={16} color="#fff" />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.textMain }}>
                {safeTitle(program)}
              </Typography>
            </Stack>

            <Typography variant="body2" sx={{ color: COLORS.textMuted, mt: 0.5 }}>
              {program?.description || "Selecciona un bloque para ver sus módulos."}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
            <Chip
              icon={<FiStar size={16} />}
              label={`${programStats.xpEarned}/${programStats.xpTotal} XP`}
              sx={{
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.subtle}`,
                fontWeight: 800,
              }}
            />
            <Chip
              icon={<FiZap size={16} />}
              label={`${programStats.percent}%`}
              sx={{
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.subtle}`,
                fontWeight: 800,
              }}
            />
          </Stack>
        </Stack>

        <Box mt={2} sx={{ position: "relative" }}>
          <LinearProgress
            variant="determinate"
            value={programStats.percent}
            sx={{
              height: 10,
              borderRadius: 999,
              backgroundColor: COLORS.subtle,
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
                backgroundColor: COLORS.red,
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "right",
              mt: 0.6,
              color: COLORS.textMuted,
              fontWeight: 800,
            }}
          >
            {programStats.done}/{programStats.total} actividades
          </Typography>
        </Box>
      </Paper>

      {/* =========================
          VIEW: COURSE
         ========================= */}
      {view === "course" && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 3,
            backgroundColor: COLORS.whiteAlt,
            border: `1px solid ${COLORS.subtle}`,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            sx={{ px: 0.5, pt: 0.5, pb: 1 }}
          >
            <Button
              onClick={() => setView("blocks")}
              startIcon={<FiArrowLeft size={16} />}
              sx={{
                textTransform: "none",
                fontWeight: 900,
                color: COLORS.textMain,
                borderRadius: 999,
              }}
            >
              Volver a bloques
            </Button>

            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 900,
                color: COLORS.textMain,
                textAlign: { xs: "left", sm: "right" },
              }}
            >
              {selectedBlock ? safeTitle(selectedBlock) : "Selecciona un bloque"}
            </Typography>
          </Stack>

          <CourseTimeline
            modules={(selectedBlock?.modules || [])
              .slice()
              .sort((a, b) => (a?.order ?? 999) - (b?.order ?? 999))}
            context={{
              programId: program?.id,
              programTitle: safeTitle(program),
              blockId: selectedBlock?.id,
              blockTitle: safeTitle(selectedBlock),
            }}
            onActivityClick={onActivityClick}
            hideOuterContainer
          />
        </Paper>
      )}

      {/* =========================
          VIEW: BLOCKS (NUEVO DISEÑO)
         ========================= */}
      {view === "blocks" && (
        <Box sx={{ width: "100%" }}>
          {/* Línea vertical central (para el efecto "mapa") */}
          <Box
            sx={{
              position: "relative",
              py: 1,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                left: "50%",
                top: 0,
                bottom: 0,
                width: 2,
                transform: "translateX(-50%)",
                background: `linear-gradient(180deg, ${COLORS.line}, rgba(212,204,223,0.0))`,
                display: { xs: "none", md: "block" },
              }}
            />

            <Stack spacing={2.5}>
              {blocks.map((block, index) => {
                const stats = getBlockStats(block);
                const locked = isBlockLocked(blocks, index);
                const gradient = getBlockGradient(index);
                const status = getStatusMeta({ locked, completed: stats.completed });

                // Alterna izquierda/derecha para que se sienta dinámico
                const isLeft = index % 2 === 0;

                const sideJustify = { xs: "flex-start", md: isLeft ? "flex-start" : "flex-end" };
                const cardWidth = { xs: "100%", md: "48%" };

                return (
                  <Box
                    key={block.id}
                    sx={{
                      display: "flex",
                      justifyContent: sideJustify,
                      position: "relative",
                    }}
                  >
                    {/* Nodo central */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: "50%",
                        top: 28,
                        transform: "translateX(-50%)",
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: locked
                          ? COLORS.locked
                          : stats.completed
                          ? "#e0f8ec"
                          : "#fff6e6",
                        border: `2px solid ${
                          locked ? "#a9a2b6" : stats.completed ? "#1c7d4f" : "#ff9800"
                        }`,
                        boxShadow: "0 10px 18px rgba(0,0,0,0.10)",
                        display: { xs: "none", md: "block" },
                        zIndex: 2,
                      }}
                    />

                    <Paper
                      elevation={0}
                      onClick={() => !locked && goToCourse(block.id)}
                      sx={{
                        width: cardWidth,
                        borderRadius: 4,
                        overflow: "hidden",
                        cursor: locked ? "not-allowed" : "pointer",
                        border: `1px solid ${COLORS.subtle}`,
                        backgroundColor: "rgba(255,255,255,0.72)",
                        backdropFilter: "blur(10px)",
                        position: "relative",
                        opacity: locked ? 0.72 : 1,
                        transform: "translateY(0px)",
                        transition: "transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease",
                        boxShadow: "0 12px 24px rgba(0,0,0,0.10)",
                        "&:hover": locked
                          ? {}
                          : {
                              transform: "translateY(-2px)",
                              boxShadow: "0 16px 34px rgba(0,0,0,0.14)",
                            },
                      }}
                    >
                      {/* Banner superior */}
                      <Box
                        sx={{
                          height: 64,
                          background: locked ? "linear-gradient(135deg, #bdb6c9, #d8d2e3)" : gradient,
                          position: "relative",
                        }}
                      >
                        {/* patrón sutil */}
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.25), transparent 35%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18), transparent 40%)",
                            pointerEvents: "none",
                          }}
                        />
                        {/* Badge bloque # */}
                        <Box
                          sx={{
                            position: "absolute",
                            left: 16,
                            top: 14,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            px: 1.2,
                            py: 0.6,
                            borderRadius: 999,
                            backgroundColor: "rgba(255,255,255,0.20)",
                            border: "1px solid rgba(255,255,255,0.35)",
                            color: "#fff",
                            fontWeight: 900,
                            letterSpacing: 1,
                            boxShadow: "0 10px 18px rgba(0,0,0,0.10)",
                          }}
                        >
                          <FiLayers size={14} />
                          <span>BLOQUE {block?.order ?? index + 1}</span>
                        </Box>

                        {/* Status pill */}
                        <Box
                          sx={{
                            position: "absolute",
                            right: 16,
                            top: 14,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.8,
                            px: 1.1,
                            py: 0.6,
                            borderRadius: 999,
                            backgroundColor: "rgba(0,0,0,0.18)",
                            border: "1px solid rgba(255,255,255,0.22)",
                            color: "#fff",
                            fontWeight: 800,
                            letterSpacing: 0.6,
                          }}
                        >
                          {status.icon}
                          <span style={{ fontSize: 12 }}>{status.label}</span>
                        </Box>
                      </Box>

                      {/* Contenido */}
                      <Box sx={{ p: 2.2 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 950,
                            color: COLORS.textMain,
                            lineHeight: 1.1,
                            mb: 0.5,
                          }}
                        >
                          {safeTitle(block)}
                        </Typography>

                        <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 1.6 }}>
                          {block?.description || "Avanza para desbloquear el siguiente bloque."}
                        </Typography>

                        {/* Stats row */}
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          alignItems="center"
                          sx={{ mb: 1.2 }}
                        >
                          <Chip
                            size="small"
                            icon={<FiZap size={14} />}
                            label={`${stats.percent}%`}
                            sx={{
                              fontWeight: 900,
                              backgroundColor: COLORS.white,
                              border: `1px solid ${COLORS.subtle}`,
                            }}
                          />
                          <Chip
                            size="small"
                            icon={<FiStar size={14} />}
                            label={`${stats.xpEarned}/${stats.xpTotal} XP`}
                            sx={{
                              fontWeight: 900,
                              backgroundColor: COLORS.white,
                              border: `1px solid ${COLORS.subtle}`,
                            }}
                          />
                          <Chip
                            size="small"
                            icon={<FiLayers size={14} />}
                            label={`${stats.modulesCount} módulos`}
                            sx={{
                              fontWeight: 900,
                              backgroundColor: COLORS.white,
                              border: `1px solid ${COLORS.subtle}`,
                            }}
                          />
                        </Stack>

                        {/* Barra progreso */}
                        <Box sx={{ mb: 1.2 }}>
                          <LinearProgress
                            variant="determinate"
                            value={stats.percent}
                            sx={{
                              height: 9,
                              borderRadius: 999,
                              backgroundColor: COLORS.subtle,
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 999,
                                backgroundColor: locked ? "#8f889d" : COLORS.red,
                              },
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              mt: 0.6,
                              color: COLORS.textMuted,
                              fontWeight: 800,
                            }}
                          >
                            {stats.done}/{stats.total} actividades
                          </Typography>
                        </Box>

                        <Divider sx={{ borderColor: COLORS.subtle, mb: 1.2 }} />

                        {/* CTA */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 800 }}>
                            {locked
                              ? "Completa el bloque anterior para entrar."
                              : stats.completed
                              ? "Listo. Puedes repasar cuando quieras."
                              : "Siguiente paso: entra y avanza."}
                          </Typography>

                          <Tooltip title={locked ? "Bloqueado" : "Abrir bloque"}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 999,
                                display: "grid",
                                placeItems: "center",
                                background: locked ? "#d7d0e3" : gradient,
                                color: locked ? "#4b4456" : "#fff",
                                border: `1px solid ${COLORS.subtle}`,
                                boxShadow: "0 10px 18px rgba(0,0,0,0.10)",
                              }}
                            >
                              {locked ? (
                                <FiLock size={18} />
                              ) : isLeft ? (
                                <FiArrowRight size={18} />
                              ) : (
                                <FiArrowLeft size={18} />
                              )}
                            </Box>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Paper>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default BlockTimeline;
