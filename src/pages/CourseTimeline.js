import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Checkbox,
  LinearProgress,
  Chip,
  Tooltip,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiLock,
  FiPlayCircle,
  FiBookOpen,
  FiEdit3,
  FiFileText,
  FiStar,
  FiClock,
  FiExternalLink,
  FiX,
  FiArrowLeft,
} from "react-icons/fi";

// =======================
// 🎨 PALETA
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

// =======================
// 🧱 EJEMPLO (fallback) -> ahora es MODULES
// =======================
const exampleModules = [
  {
    id: "mod-1",
    title: "Módulo 1: Conceptos básicos",
    order: 1,
    activities: [
      {
        id: "act-1",
        title: "Lectura ejemplo",
        type: "reading",
        xp: 10,
        completed: true,
        config: { manualId: "/manuals/ejemplo_manual.pdf" },
      },
      {
        id: "act-2",
        title: "Video ejemplo",
        type: "video",
        xp: 15,
        completed: false,
        config: { provider: "youtube", videoIds: ["dQw4w9WgXcQ"] },
      },
    ],
  },
];

// =======================
// 🧮 HELPERS
// =======================
const getActivityIcon = (type) => {
  switch (type) {
    case "lectura":
    case "reading":
      return <FiBookOpen size={14} />;
    case "video":
      return <FiPlayCircle size={14} />;
    case "practica":
      return <FiEdit3 size={14} />;
    case "quiz":
    case "examen":
      return <FiFileText size={14} />;
    case "scorm":
      return <FiPlayCircle size={14} />;
    case "url":
      return <FiExternalLink size={14} />;
    default:
      return <FiFileText size={14} />;
  }
};

const safeTitle = (obj) => obj?.title || obj?.name || "Sin título";

const getModuleStats = (module) => {
  let total = 0;
  let done = 0;
  let xpTotal = 0;
  let xpEarned = 0;

  (module?.activities || []).forEach((a) => {
    total += 1;
    const xp = a?.xp || 0;
    xpTotal += xp;
    if (a?.completed) {
      done += 1;
      xpEarned += xp;
    }
  });

  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const completed = total > 0 && done === total;

  return { total, done, percent, completed, xpTotal, xpEarned };
};

const getCourseStatsFromModules = (modules) => {
  let total = 0;
  let done = 0;
  let xpTotal = 0;
  let xpEarned = 0;

  (modules || []).forEach((m) => {
    const s = getModuleStats(m);
    total += s.total;
    done += s.done;
    xpTotal += s.xpTotal;
    xpEarned += s.xpEarned;
  });

  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent, xpTotal, xpEarned };
};

// módulo n bloqueado si el anterior NO está completo
const isModuleLocked = (modules, index) => {
  if (index === 0) return false;
  const prevStats = getModuleStats(modules[index - 1]);
  return !prevStats.completed;
};

// =======================
// 🧪 QUIZ VIEWER SIMPLE
// =======================
const QuizViewer = ({ activity }) => {
  const questions = activity?.config?.questions || [];
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (qIndex, option) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = () => {
    if (!questions.length) return;
    setSubmitted(true);
  };

  const allAnswered =
    questions.length > 0 &&
    questions.every((_, idx) => answers[idx] !== undefined);

  const score = submitted
    ? questions.reduce((acc, q, idx) => {
        const correct =
          q.respuestaCorrecta || q.correctAnswer || q.correcta || null;
        return acc + (answers[idx] === correct ? 1 : 0);
      }, 0)
    : 0;

  const displayName = activity?.title || activity?.name || "Evaluación / Quiz";

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, color: COLORS.textMain, mb: 0.5 }}
      >
        {displayName}
      </Typography>
      <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 1.5 }}>
        Responde las siguientes preguntas y envía tus respuestas. (Visor local)
      </Typography>

      {questions.length === 0 && (
        <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
          No hay preguntas configuradas para este quiz. Revisa{" "}
          <code>activity.config.questions</code>.
        </Typography>
      )}

      <Stack spacing={2}>
        {questions.map((q, idx) => {
          const text = q.texto || q.text || q.pregunta || `Pregunta ${idx + 1}`;
          const options = q.opciones || q.options || [];
          const selected = answers[idx];

          const correct =
            q.respuestaCorrecta || q.correctAnswer || q.correcta || null;
          const isCorrect = submitted && selected === correct;

          return (
            <Box
              key={idx}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${COLORS.subtle}`,
                backgroundColor: submitted
                  ? isCorrect
                    ? "#e0f8ec"
                    : "#ffecec"
                  : COLORS.whiteSoft,
              }}
            >
              <FormControl component="fieldset" fullWidth>
                <FormLabel
                  component="legend"
                  sx={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: COLORS.textMain,
                    mb: 1,
                  }}
                >
                  {idx + 1}. {text}
                </FormLabel>
                <RadioGroup
                  value={selected ?? ""}
                  onChange={(e) => handleChange(idx, e.target.value)}
                >
                  {options.map((opt, i) => (
                    <FormControlLabel
                      key={i}
                      value={opt}
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">{opt}</Typography>}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              {submitted && correct && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 0.5,
                    color: isCorrect ? "#1c7d4f" : "#c62828",
                  }}
                >
                  Respuesta correcta: {correct}
                </Typography>
              )}
            </Box>
          );
        })}
      </Stack>

      {questions.length > 0 && (
        <Box mt={2}>
          {!submitted && (
            <Button
              variant="contained"
              size="small"
              onClick={handleSubmit}
              disabled={!allAnswered}
              sx={{
                backgroundColor: COLORS.red,
                "&:hover": { backgroundColor: COLORS.redDark },
              }}
            >
              Enviar respuestas
            </Button>
          )}

          {submitted && (
            <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>
              Obtuviste {score} de {questions.length} respuestas correctas.
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

// =======================
// 🎬 VIEWER DE ACTIVIDAD
// =======================
const ActivityViewer = ({ selectedActivity }) => {
  const [iframeError, setIframeError] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);

  useEffect(() => {
    setIframeError(false);
    setUrlModalOpen(false);
  }, [selectedActivity]);

  if (!selectedActivity) return null;

  const { activity } = selectedActivity;
  const type = activity?.type;
  const config = activity?.config || {};
  const displayName = activity?.title || activity?.name || "Actividad sin título";

  if (type === "video") {
    let videoId = Array.isArray(config.videoIds)
      ? config.videoIds[0]
      : config.videoIds || null;

    if (videoId && videoId.includes("youtube.com")) {
      try {
        const url = new URL(videoId);
        const fromQuery = url.searchParams.get("v");
        if (fromQuery) videoId = fromQuery;
      } catch {
        // noop
      }
    } else if (videoId && videoId.includes("youtu.be")) {
      videoId = videoId.split("/").pop();
    }

    return (
      <Box>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, color: COLORS.textMain, mb: 0.5 }}
        >
          {displayName}
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 1 }}>
          Recurso en video
        </Typography>

        {videoId ? (
          <Box
            sx={{
              position: "relative",
              pt: "56.25%",
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: "0 8px 16px rgba(0,0,0,0.25)",
            }}
          >
            <Box
              component="iframe"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={displayName}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sx={{
                border: 0,
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            />
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
            Falta configurar <code>config.videoIds</code> para este video.
          </Typography>
        )}
      </Box>
    );
  }

  if (type === "reading" || type === "lectura") {
    const manualId = config.manualId;
    let manualUrl = config.manualUrl;

    if (!manualUrl && manualId) {
      if (
        typeof manualId === "string" &&
        (manualId.startsWith("/") || manualId.startsWith("http"))
      ) {
        manualUrl = manualId;
      } else {
        manualUrl = `/manuals/${manualId}.pdf`;
      }
    }

    const showPreview = config.preview !== false && !iframeError;

    return (
      <Box>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, color: COLORS.textMain, mb: 0.5 }}
        >
          {displayName}
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 1 }}>
          Recurso de lectura
        </Typography>

        {manualUrl ? (
          <>
            <Button
              variant="contained"
              size="small"
              endIcon={<FiExternalLink size={14} />}
              sx={{
                mb: 1.5,
                backgroundColor: COLORS.red,
                "&:hover": { backgroundColor: COLORS.redDark },
              }}
              href={manualUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir manual
            </Button>

            {showPreview && (
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  border: `1px solid ${COLORS.subtle}`,
                  height: 260,
                  backgroundColor: COLORS.whiteSoft,
                }}
              >
                <Box
                  component="iframe"
                  src={manualUrl}
                  title={displayName}
                  sx={{ width: "100%", height: "100%", border: 0 }}
                  onError={() => setIframeError(true)}
                />
              </Box>
            )}

            {iframeError && (
              <Typography variant="body2" sx={{ color: COLORS.textMuted, mt: 1 }}>
                No se pudo mostrar la vista previa embebida, pero puedes abrir el
                manual en otra pestaña.
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
            Falta configurar <code>manualId</code> o <code>manualUrl</code> para
            esta lectura.
          </Typography>
        )}
      </Box>
    );
  }

  if (type === "scorm") {
    const scormPath = config.scormPath || config.scormUrl || config.scormPackageUrl;

    return (
      <Box>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, color: COLORS.textMain, mb: 0.5 }}
        >
          {displayName}
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 1 }}>
          Paquete SCORM
        </Typography>

        {scormPath ? (
          <Button
            variant="contained"
            endIcon={<FiExternalLink size={16} />}
            sx={{ backgroundColor: COLORS.red, "&:hover": { backgroundColor: COLORS.redDark } }}
            href={scormPath}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir SCORM
          </Button>
        ) : (
          <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
            Falta configurar <code>scormPackageUrl</code> / <code>scormPath</code>.
          </Typography>
        )}
      </Box>
    );
  }

  if (type === "url") {
    const url = config.url;
    const allowEmbed = config.allowEmbed !== false;

    return (
      <Box>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, color: COLORS.textMain, mb: 0.5 }}
        >
          {displayName}
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 1 }}>
          Recurso externo
        </Typography>

        {url ? (
          <>
            <Stack direction="row" spacing={1.5} mb={1.5} flexWrap="wrap">
              {allowEmbed && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    setIframeError(false);
                    setUrlModalOpen(true);
                  }}
                  sx={{ backgroundColor: COLORS.red, "&:hover": { backgroundColor: COLORS.redDark } }}
                  endIcon={<FiExternalLink size={14} />}
                >
                  Ver dentro de la plataforma
                </Button>
              )}

              <Button
                variant="outlined"
                size="small"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<FiExternalLink size={14} />}
                sx={{
                  borderColor: COLORS.subtle,
                  color: COLORS.textMain,
                  "&:hover": { borderColor: COLORS.red, color: COLORS.redDark },
                }}
              >
                Abrir en pestaña nueva
              </Button>
            </Stack>

            {allowEmbed && (
              <Dialog
                open={urlModalOpen}
                onClose={() => setUrlModalOpen(false)}
                fullWidth
                maxWidth="lg"
                sx={{
                  zIndex: 99999,
                  "& .MuiBackdrop-root": { zIndex: 99998 },
                  "& .MuiDialog-container": { zIndex: 99999 },
                  "& .MuiDialog-paper": { zIndex: 999999 },
                }}
              >
                <DialogTitle
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pr: 1,
                    backgroundColor: COLORS.whiteSoft,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textMain }}>
                    {displayName}
                  </Typography>
                  <IconButton size="small" onClick={() => setUrlModalOpen(false)}>
                    <FiX size={18} />
                  </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0, backgroundColor: "#000000" }}>
                  {!iframeError && (
                    <Box sx={{ width: "100%", height: "70vh" }}>
                      <Box
                        component="iframe"
                        src={url}
                        title={displayName}
                        sx={{ border: 0, width: "100%", height: "100%" }}
                        onError={() => setIframeError(true)}
                      />
                    </Box>
                  )}

                  {iframeError && (
                    <Box sx={{ p: 2, backgroundColor: COLORS.whiteSoft }}>
                      <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                        Este recurso no puede mostrarse embebido. Ábrelo en una pestaña nueva.
                      </Typography>
                    </Box>
                  )}
                </DialogContent>
              </Dialog>
            )}

            {!allowEmbed && (
              <Typography variant="body2" sx={{ color: COLORS.textMuted, mt: 0.5 }}>
                Este recurso está configurado para abrirse solo en una pestaña nueva (embed desactivado).
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
            Falta configurar <code>config.url</code> para esta actividad.
          </Typography>
        )}
      </Box>
    );
  }

  if (type === "quiz" || type === "examen") {
    return <QuizViewer activity={activity} />;
  }

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, color: COLORS.textMain, mb: 0.5 }}
      >
        {displayName}
      </Typography>
      <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
        Tipo de actividad: <code>{type || "desconocido"}</code>. Aún no hay viewer
        específico para este tipo.
      </Typography>
    </Box>
  );
};

// =======================
// 🌟 COMPONENTE PRINCIPAL (SINGLE VIEW)
// =======================
const CourseTimeline = ({
  modules = exampleModules,
  context, // { programId, programTitle, blockId, blockTitle } opcional
  onActivityClick,
  hideOuterContainer = false,
}) => {
  const sortedModules = useMemo(() => {
    return [...(modules || [])].sort((a, b) => (a?.order ?? 999) - (b?.order ?? 999));
  }, [modules]);

  const courseStats = useMemo(
    () => getCourseStatsFromModules(sortedModules),
    [sortedModules]
  );

  const [selectedActivity, setSelectedActivity] = useState(null);

  const handleActivityClick = (module, activity) => {
    const payload = {
      ...context,
      moduleId: module?.id,
      moduleTitle: safeTitle(module),
      activity,
    };
    setSelectedActivity(payload);
    if (typeof onActivityClick === "function") onActivityClick(payload);
  };

  const Outer = hideOuterContainer ? React.Fragment : Box;

  const outerProps = hideOuterContainer
    ? {}
    : {
        sx: {
          width: "100%",
          maxWidth: 1200,
          mx: "auto",
          py: 3,
          px: { xs: 1.5, md: 2 },
          backgroundColor: COLORS.bg,
        },
      };

  // =======================
  // ✅ VIEW: TIMELINE (módulos) O VIEWER (actividad)
  // =======================
  const isViewerOpen = !!selectedActivity;

  return (
    <Outer {...outerProps}>
      {/* HEADER: PROGRESO (de módulos) */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2.5,
          borderRadius: 3,
          backgroundColor: COLORS.whiteSoft,
          border: `1px solid ${COLORS.subtle}`,
          display: hideOuterContainer ? "none" : "block",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textMain }}>
              Progreso del bloque (módulos)
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
              {courseStats.done} de {courseStats.total} actividades completadas
            </Typography>
          </Box>

          <Chip
            icon={<FiStar size={16} />}
            label={`${courseStats.xpEarned}/${courseStats.xpTotal} XP`}
            sx={{
              backgroundColor: COLORS.white,
              borderColor: COLORS.subtle,
              borderWidth: 1,
              borderStyle: "solid",
              fontWeight: 600,
            }}
          />
        </Stack>

        <Box mt={2}>
          <LinearProgress
            variant="determinate"
            value={courseStats.percent}
            sx={{
              height: 8,
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
              mt: 0.5,
              color: COLORS.textMuted,
              fontWeight: 600,
            }}
          >
            {courseStats.percent}%
          </Typography>
        </Box>
      </Paper>

      {/* ===== VIEWER ===== */}
      {isViewerOpen && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            background: `linear-gradient(180deg, ${COLORS.whiteSoft} 0%, ${COLORS.white} 100%)`,
            border: `1px solid ${COLORS.subtle}`,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            mb={1.5}
          >
            <Button
              onClick={() => setSelectedActivity(null)}
              startIcon={<FiArrowLeft size={16} />}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                color: COLORS.textMain,
                borderRadius: 999,
              }}
            >
              Volver a módulos
            </Button>

            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
              <Chip
                size="small"
                icon={getActivityIcon(selectedActivity.activity?.type)}
                label={selectedActivity.activity?.type || "actividad"}
                sx={{ fontSize: "0.7rem", fontWeight: 700, backgroundColor: COLORS.white }}
              />
              <Chip
                size="small"
                icon={<FiStar size={14} />}
                label={`${selectedActivity.activity?.xp || 10} XP`}
                sx={{ fontSize: "0.7rem", fontWeight: 700, backgroundColor: COLORS.white }}
              />
            </Stack>
          </Stack>

          <Typography
            variant="caption"
            sx={{ color: COLORS.textMuted, mb: 0.5, display: "block" }}
          >
            {selectedActivity?.blockTitle ? `${selectedActivity.blockTitle} · ` : ""}
            {selectedActivity.moduleTitle}
          </Typography>

          <ActivityViewer selectedActivity={selectedActivity} />
        </Paper>
      )}

      {/* ===== TIMELINE (módulos) ===== */}
      {!isViewerOpen && (
        <Box sx={{ width: "100%" }}>
          {sortedModules.map((module, index) => {
            const moduleStats = getModuleStats(module);
            const locked = isModuleLocked(sortedModules, index);

            return (
              <Stack
                key={module.id || index}
                direction="row"
                spacing={2}
                alignItems="flex-start"
                sx={{ mb: 3 }}
              >
                {/* Mini chip estado */}
                <Box sx={{ width: 36, mt: 0.5 }}>
                  <Tooltip
                    title={
                      locked
                        ? "Completa el módulo anterior para desbloquear este."
                        : moduleStats.completed
                        ? "Módulo completado"
                        : "Módulo en progreso"
                    }
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: locked
                          ? COLORS.locked
                          : moduleStats.completed
                          ? "#e0f8ec"
                          : "#fff6e6",
                        border: `1px solid ${
                          locked ? COLORS.locked : moduleStats.completed ? "#1c7d4f" : "#ffb347"
                        }`,
                      }}
                    >
                      {locked ? (
                        <FiLock size={14} color="#444" />
                      ) : moduleStats.completed ? (
                        <FiCheckCircle size={14} color="#1c7d4f" />
                      ) : (
                        <FiAlertCircle size={14} color="#ff9800" />
                      )}
                    </Box>
                  </Tooltip>
                </Box>

                {/* Timeline círculo grande + líneas */}
                <Box
                  sx={{
                    width: 90,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                    overflow: "visible",
                  }}
                >
                  {index > 0 && (
                    <Box
                      sx={{
                        width: 2,
                        bgcolor: COLORS.line,
                        position: "absolute",
                        top: -24,
                        bottom: "50%",
                        zIndex: 0,
                      }}
                    />
                  )}

                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: locked
                        ? COLORS.locked
                        : `linear-gradient(135deg, ${COLORS.red}, #ff6b6b)`,
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 8px 16px rgba(0,0,0,0.18)",
                      zIndex: 1,
                    }}
                  >
                    {locked ? (
                      <FiLock size={24} />
                    ) : moduleStats.completed ? (
                      <FiCheckCircle size={26} />
                    ) : (
                      <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
                        {module?.order ?? index + 1}
                      </Typography>
                    )}
                  </Box>

                  {index < sortedModules.length - 1 && (
                    <Box
                      sx={{
                        width: 2,
                        bgcolor: COLORS.line,
                        position: "absolute",
                        top: "50%",
                        bottom: -24,
                        zIndex: 0,
                      }}
                    />
                  )}
                </Box>

                {/* Tarjeta del MÓDULO */}
                <Box sx={{ flex: 1 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 3,
                      backgroundColor: locked ? COLORS.locked : COLORS.red,
                      color: "#ffffff",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: -60,
                        width: 160,
                        transform: "rotate(35deg)",
                        backgroundColor: "rgba(0,0,0,0.12)",
                        py: 0.3,
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                        MÓDULO {module?.order ?? index + 1}
                      </Typography>
                    </Box>

                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {safeTitle(module)}
                    </Typography>

                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.3, fontSize: "0.8rem" }}>
                      {moduleStats.done} de {moduleStats.total} actividades · {moduleStats.percent}% completado
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        icon={<FiClock size={14} />}
                        label={`${moduleStats.xpEarned}/${moduleStats.xpTotal} XP`}
                        sx={{
                          backgroundColor: "rgba(255,255,255,0.14)",
                          color: "#ffffff",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                        }}
                      />
                      {moduleStats.completed && (
                        <Chip
                          size="small"
                          icon={<FiCheckCircle size={14} />}
                          label="Completado"
                          sx={{
                            backgroundColor: "rgba(255,255,255,0.18)",
                            color: "#ffffff",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Stack>
                  </Paper>

                  {/* Cajita del módulo: actividades */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.8,
                      borderRadius: 3,
                      backgroundColor: COLORS.white,
                      border: `1px solid ${COLORS.subtle}`,
                      opacity: locked ? 0.6 : 1,
                    }}
                  >
                    <Stack spacing={1}>
                      {(module?.activities || [])
                        .slice()
                        .sort((a, b) => (a?.order ?? 999) - (b?.order ?? 999))
                        .map((activity) => {
                          const label = activity?.title || activity?.name || "Actividad sin título";

                          return (
                            <Stack
                              key={activity?.id || label}
                              direction="row"
                              alignItems="center"
                              spacing={1}
                              sx={{
                                pl: 0.5,
                                py: 0.45,
                                borderRadius: 2,
                                cursor: locked ? "not-allowed" : "pointer",
                                "&:hover": locked ? {} : { backgroundColor: COLORS.subtle },
                              }}
                              onClick={() => !locked && handleActivityClick(module, activity)}
                            >
                              <Checkbox
                                checked={!!activity?.completed}
                                disabled
                                sx={{
                                  p: 0.2,
                                  "&.Mui-checked": { color: COLORS.red },
                                }}
                              />

                              <Box
                                sx={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: "50%",
                                  border: `1px solid ${COLORS.subtle}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  backgroundColor: COLORS.whiteSoft,
                                }}
                              >
                                {getActivityIcon(activity?.type)}
                              </Box>

                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.textMain }}>
                                  {label}
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
                                  {activity?.type || "actividad"} · {activity?.xp || 10} XP
                                </Typography>
                              </Box>

                              {!locked && (
                                <Tooltip title="Abrir actividad">
                                  <Box sx={{ color: COLORS.red }}>
                                    <FiPlayCircle size={18} />
                                  </Box>
                                </Tooltip>
                              )}
                            </Stack>
                          );
                        })}
                    </Stack>
                  </Paper>
                </Box>
              </Stack>
            );
          })}
        </Box>
      )}
    </Outer>
  );
};

export default CourseTimeline;
