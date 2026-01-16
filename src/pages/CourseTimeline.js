import React, { useMemo, useState, useEffect, useRef } from "react";
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

import { auth, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

const BACKEND_URL = "https://vol-backend.onrender.com";

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
    case "final_quiz":
      return <FiFileText size={14} />;
    case "scorm":
      return <FiPlayCircle size={14} />;
    case "url":
      return <FiExternalLink size={14} />;
    case "path":
      return <FiStar size={14} />;
    case "docs":
    case "upload":
      return <FiFileText size={14} />;
    default:
      return <FiFileText size={14} />;
  }
};

const safeTitle = (obj) => obj?.title || obj?.name || "Sin título";

const normModuleId = (m) => m?.id ?? m?.module_id ?? `mod-${m?.order ?? "x"}`;
const normActivityId = (a) => a?.id ?? a?.activity_id ?? null;

const normOrder = (o) =>
  o?.order ??
  o?.order_index ??
  o?.orderIndex ??
  o?.orden ??
  o?.module_order ??
  o?.activity_order ??
  999;

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

const isModuleLocked = (modules, index) => {
  if (index === 0) return false;
  const prevStats = getModuleStats(modules[index - 1]);
  return !prevStats.completed;
};

// =======================
// ✅ API helpers progreso
// =======================
async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado");
  return user.getIdToken(true);
}

async function postWithAuth(url, body) {
  const token = await getToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : "{}",
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

async function deleteWithAuth(url) {
  const token = await getToken();
  const res = await fetch(url, {
    method: "DELETE",
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


// =======================
// ✅ Para parsear la config
// =======================
const safeParseConfig = (config) => {
  if (!config) return {};
  if (typeof config === "object") return config;

  if (typeof config === "string") {
    try {
      return JSON.parse(config);
    } catch (e) {
      console.warn("⚠️ No se pudo parsear config JSON:", config);
      return {};
    }
  }

  return {};
};
// =======================
// ✅ YouTube Iframe API loader (singleton)
// =======================
let __ytApiPromise = null;

function loadYouTubeIframeAPI() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);

  if (__ytApiPromise) return __ytApiPromise;

  __ytApiPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[data-yt-iframe-api="1"]');
    if (!existing) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.defer = true;
      tag.dataset.ytIframeApi = "1";
      document.body.appendChild(tag);
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try {
        prev && prev();
      } catch {}
      resolve(window.YT);
    };

    setTimeout(() => {
      if (window.YT && window.YT.Player) resolve(window.YT);
    }, 6000);
  });

  return __ytApiPromise;
}

function extractYoutubeId(maybe) {
  if (!maybe || typeof maybe !== "string") return null;
  const v = maybe.trim();
  if (!v) return null;

  if (v.includes("youtube.com")) {
    try {
      const url = new URL(v);
      const fromQuery = url.searchParams.get("v");
      if (fromQuery) return fromQuery;
    } catch {}
  }

  if (v.includes("youtu.be")) {
    const tail = v.split("/").pop();
    return tail || null;
  }

  return v;
}

// =======================
// ✅ YouTubePlayer FIXED
// =======================
const YouTubePlayer = ({ videoId, title, onPlayOnce }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const playedRef = useRef(false);

  const onPlayOnceRef = useRef(onPlayOnce);
  useEffect(() => {
    onPlayOnceRef.current = onPlayOnce;
  }, [onPlayOnce]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!videoId) return;
      if (!containerRef.current) return;

      try {
        const YT = await loadYouTubeIframeAPI();
        if (cancelled) return;

        if (playerRef.current && typeof playerRef.current.destroy === "function") {
          try {
            playerRef.current.destroy();
          } catch {}
        }

        playedRef.current = false;

        playerRef.current = new YT.Player(containerRef.current, {
          videoId,
          playerVars: { rel: 0, modestbranding: 1 },
          events: {
            onStateChange: (event) => {
              if (event?.data === 1 && !playedRef.current) {
                playedRef.current = true;
                onPlayOnceRef.current?.();
              }
            },
          },
        });

        setTimeout(() => {
          try {
            const iframe = playerRef.current?.getIframe?.();
            if (iframe) {
              iframe.style.width = "100%";
              iframe.style.height = "100%";
              iframe.style.position = "absolute";
              iframe.style.inset = "0";
              iframe.style.border = "0";
            }
          } catch {}
        }, 0);
      } catch (e) {
        console.error("❌ YT init error:", e);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch {}
      }
      playerRef.current = null;
    };
  }, [videoId]);

  if (!videoId) {
    return (
      <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
        Falta configurar <code>config.videoIds</code> para este video.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        pt: "56.25%",
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: "0 8px 16px rgba(0,0,0,0.25)",
        backgroundColor: "#000",
      }}
    >
      <Box ref={containerRef} sx={{ position: "absolute", inset: 0 }} aria-label={title} />
    </Box>
  );
};

// =======================
// 📎 DOCS UPLOADER (Firebase Storage + /progreso/actividades/:id/docs)
// =======================
const DocsUploader = ({ activity, onUploaded }) => {
  const config = safeParseConfig(activity?.config);
  const accept = config?.accept || "image/*,.pdf,.doc,.docx";
  const required = config?.required !== false;

  const documentTitle = config?.documentTitle || activity?.title || activity?.name || "Evidencia";
  const description = config?.description || "Sube tu evidencia para completar esta actividad.";

  const [existing, setExisting] = useState(null);
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const activityId = Number(activity?.id);

  const fetchExisting = async () => {
    if (!Number.isFinite(activityId) || activityId <= 0) return;
    setLoadingExisting(true);
    setError(null);
    try {
      const resp = await getWithAuth(`${BACKEND_URL}/progreso/actividades/${activityId}/docs`);
      setExisting(resp?.doc || null);
    } catch (e) {
      // No truena UI si no hay doc o si falla leve
      console.warn("get docs error:", e);
      setExisting(null);
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    setExisting(null);
    setFile(null);
    setError(null);
    setSuccess(null);
    fetchExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  const uploadToFirebase = async (selectedFile) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const userId = user.uid;
    const safeName = selectedFile?.name || "archivo";
    const path = `evidencias/${userId}/actividad-${activityId}/${Date.now()}-${safeName}`;

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, selectedFile);
    const url = await getDownloadURL(storageRef);

    return { url, storagePath: path };
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!file) {
        if (required) throw new Error("Selecciona un archivo para subir.");
        // si no es requerido, podrías permitir completar sin doc (pero usualmente sí es requerido)
        setSuccess("Sin archivo (no requerido).");
        return;
      }

      const { url, storagePath } = await uploadToFirebase(file);

      const payload = {
        documentTitle,
        description: config?.description || null,
        fileUrl: url,
        fileName: file.name,
        fileType: file.type || null,
        fileSize: file.size || null,
        storagePath,
      };

      const resp = await postWithAuth(
        `${BACKEND_URL}/progreso/actividades/${activityId}/docs`,
        payload
      );

      const doc = resp?.doc || null;
      setExisting(doc);
      setFile(null);
      setSuccess("Evidencia guardada ✅");

      // ✅ Marca completado en tu flujo
      onUploaded?.({ doc });
    } catch (e) {
      setError(e?.message || "No se pudo subir la evidencia.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteWithAuth(`${BACKEND_URL}/progreso/actividades/${activityId}/docs`);
      setExisting(null);
      setSuccess("Evidencia eliminada.");
    } catch (e) {
      setError(e?.message || "No se pudo eliminar.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.textMain, mb: 0.5 }}>
        {documentTitle}
      </Typography>
      <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 1.5 }}>
        {description}
      </Typography>

      {loadingExisting ? (
        <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
          Cargando evidencia...
        </Typography>
      ) : existing ? (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: `1px solid ${COLORS.subtle}`,
            backgroundColor: COLORS.whiteSoft,
            mb: 1.5,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textMain }}>
            Evidencia actual:
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
            {existing?.file_name || existing?.fileName || "Archivo"}
          </Typography>

          {(existing?.file_url || existing?.fileUrl) && (
            <Button
              variant="outlined"
              size="small"
              href={existing?.file_url || existing?.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<FiExternalLink size={14} />}
              sx={{ mt: 1, borderRadius: 999 }}
            >
              Ver archivo
            </Button>
          )}

          <Box sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDelete}
              disabled={loading}
              sx={{
                borderRadius: 999,
                borderColor: COLORS.subtle,
                color: COLORS.textMain,
                "&:hover": { borderColor: COLORS.red, color: COLORS.redDark },
              }}
            >
              Eliminar evidencia
            </Button>
          </Box>
        </Paper>
      ) : null}

      {error && <Alert severity="error" sx={{ mb: 1.25, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 1.25, borderRadius: 2 }}>{success}</Alert>}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems="center">
        <Button
          variant="contained"
          component="label"
          disabled={loading}
          sx={{
            backgroundColor: COLORS.red,
            "&:hover": { backgroundColor: COLORS.redDark },
            borderRadius: 999,
            fontWeight: 900,
            textTransform: "none",
          }}
        >
          Elegir archivo
          <input
            type="file"
            hidden
            accept={accept}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </Button>

        <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
          {file ? file.name : "Ningún archivo seleccionado"}
        </Typography>
      </Stack>

      <Box sx={{ mt: 1.5 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || (!file && required)}
          sx={{
            backgroundColor: COLORS.red,
            "&:hover": { backgroundColor: COLORS.redDark },
            borderRadius: 999,
            fontWeight: 950,
            textTransform: "none",
          }}
        >
          {loading ? "Subiendo..." : "Subir evidencia"}
        </Button>
      </Box>
    </Box>
  );
};


// =======================
// 🧪 QUIZ VIEWER
// =======================
const QuizViewer = ({ activity, onComplete }) => {
  const questions = activity?.config?.questions || [];
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (qIndex, option) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const allAnswered =
    questions.length > 0 && questions.every((_, idx) => answers[idx] !== undefined);

  const minScore = Number.isFinite(activity?.min_score) ? Number(activity.min_score) : 80;

  const computeScore = () => {
    const total = questions.length;
    if (!total) return { scoreRaw: 0, percentScore: 0, passed: false, total: 0 };

    const scoreRaw = questions.reduce((acc, q, idx) => {
      const correct = q.respuestaCorrecta || q.correctAnswer || q.correcta || null;
      return acc + (answers[idx] === correct ? 1 : 0);
    }, 0);

    const percentScore = Math.round((scoreRaw / total) * 100);
    const passed = percentScore >= minScore;
    return { scoreRaw, percentScore, passed, total };
  };

  const handleSubmit = async () => {
    if (!questions.length) return;

    const { scoreRaw, percentScore, passed, total } = computeScore();
    setSubmitted(true);
    setResult({ scoreRaw, percentScore, passed, total });

    await onComplete?.({
      score: percentScore,
      passed,
      data_json: { answers, percentScore, passed, total, scoreRaw },
    });
  };

  const displayName = activity?.title || activity?.name || "Evaluación / Quiz";

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textMain, mb: 0.5 }}>
        {displayName}
      </Typography>
      <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 1.5 }}>
        Responde y envía. Para aprobar necesitas {minScore}%.
      </Typography>

      {questions.length === 0 && (
        <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
          No hay preguntas configuradas para este quiz. Revisa <code>activity.config.questions</code>.
        </Typography>
      )}

      <Stack spacing={2}>
        {questions.map((q, idx) => {
          const text = q.texto || q.text || q.pregunta || `Pregunta ${idx + 1}`;
          const options = q.opciones || q.options || [];
          const selected = answers[idx];

          const correct = q.respuestaCorrecta || q.correctAnswer || q.correcta || null;
          const isCorrect = submitted && correct ? selected === correct : false;

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
              sx={{ backgroundColor: COLORS.red, "&:hover": { backgroundColor: COLORS.redDark } }}
            >
              Enviar respuestas
            </Button>
          )}

          {submitted && result && (
            <Alert severity={result.passed ? "success" : "warning"} sx={{ mt: 1.5, borderRadius: 2 }}>
              Score: {result.percentScore}% ({result.scoreRaw}/{result.total}).{" "}
              {result.passed ? "Aprobado ✅" : "No aprobado ❌"}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};



// =======================
// 🧾 FINAL QUIZ VIEWER (Banco → selección aleatoria + intentos limitados)
// =======================
/**
 * DEV (final_quiz):
 * - config.questionsBank: banco completo
 * - config.pickCount: cuántas preguntas escoger aleatoriamente (default: todas)
 * - config.maxAttempts: intentos permitidos (default: 1)
 * - config.shuffleQuestions / shuffleOptions: barajeo
 *
 * UX:
 * - No hay "previsualización": al abrir la actividad solo se muestra una advertencia y un botón de inicio.
 * - Al iniciar, se considera consumido un intento (front-only). Ideal: reforzar esto en backend (attempts_used).
 */
const shuffleArray = (arr) => {
  const a = [...(arr || [])];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pickRandomN = (arr, n) => {
  const a = [...(arr || [])];
  if (!Number.isFinite(n) || n <= 0 || n >= a.length) return a;
  // Fisher–Yates parcial
  for (let i = a.length - 1; i > a.length - 1 - n; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(a.length - n);
};

const FinalQuizViewer = ({ activity, onComplete }) => {
  const config = safeParseConfig(activity?.config);

  const bankRaw = Array.isArray(config?.questionsBank) ? config.questionsBank : [];
  const pickCount = Number.isFinite(config?.pickCount) ? Number(config.pickCount) : bankRaw.length;
  const maxAttempts = Number.isFinite(config?.maxAttempts) ? Number(config.maxAttempts) : 1;
  const shuffleQuestions = config?.shuffleQuestions !== false;
  const shuffleOptions = config?.shuffleOptions !== false;

  const minScore = Number.isFinite(config?.minScore)
    ? Number(config.minScore)
    : (Number.isFinite(activity?.min_score) ? Number(activity.min_score) : 80);

  // DEV: Estos campos dependen de cómo venga el progreso del backend.
  // Si no existen, solo mostramos "Intentos: X" sin bloquear. Ideal: backend exponga attempts_used.
  const attemptsUsed = Number(activity?.attempts_used ?? activity?.attemptsUsed ?? activity?.progress?.attempts_used ?? activity?.progress?.attemptsUsed ?? null);

  const attemptsRemaining =
    Number.isFinite(attemptsUsed) ? Math.max(0, maxAttempts - attemptsUsed) : null;

  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setStarted(false);
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setConfirmOpen(false);
  }, [activity?.id]);

  const buildQuestions = () => {
    const picked = pickRandomN(bankRaw, pickCount);
    const qList = shuffleQuestions ? shuffleArray(picked) : picked;

    return qList.map((q) => {
      const texto = q?.texto || q?.text || q?.pregunta || "";
      const opcionesRaw = q?.opciones || q?.options || [];
      const opciones = shuffleOptions ? shuffleArray(opcionesRaw) : opcionesRaw;
      const respuestaCorrecta = q?.respuestaCorrecta || q?.correctAnswer || q?.correcta || null;
      return { ...q, texto, opciones, respuestaCorrecta };
    });
  };

  const handleStart = () => {
    if (attemptsRemaining === 0) return;
    setConfirmOpen(false);
    setStarted(true);
    setQuestions(buildQuestions());
    // DEV: Si quieres “congelar” el set de preguntas por intento y evitar cambios al recargar,
    // puedes persistir questions en backend o localStorage con una key por usuario+actividad+attempt.
  };

  const handleChange = (qIndex, option) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const allAnswered =
    questions.length > 0 && questions.every((_, idx) => answers[idx] !== undefined);

  const computeScore = () => {
    const total = questions.length;
    if (!total) return { scoreRaw: 0, percentScore: 0, passed: false, total: 0 };

    const scoreRaw = questions.reduce((acc, q, idx) => {
      const correct = q.respuestaCorrecta || null;
      return acc + (answers[idx] === correct ? 1 : 0);
    }, 0);

    const percentScore = Math.round((scoreRaw / total) * 100);
    const passed = percentScore >= minScore;
    return { scoreRaw, percentScore, passed, total };
  };

  const handleSubmit = async () => {
    if (!questions.length) return;

    const { scoreRaw, percentScore, passed, total } = computeScore();
    setSubmitted(true);
    setResult({ scoreRaw, percentScore, passed, total });

    await onComplete?.({
      score: percentScore,
      passed,
      data_json: {
        type: "final_quiz",
        maxAttempts,
        attemptsUsed: Number.isFinite(attemptsUsed) ? attemptsUsed : undefined,
        pickCount,
        minScore,
        percentScore,
        passed,
        total,
        scoreRaw,
        // DEV: Auditoría: guardamos set de preguntas usado (texto/opciones/correcta) + respuestas del usuario
        questionsUsed: questions.map((q) => ({
          texto: q.texto,
          opciones: q.opciones,
          respuestaCorrecta: q.respuestaCorrecta,
          categoria: q?.categoria,
        })),
        answers,
      },
    });
  };

  const displayName = activity?.title || activity?.name || "Examen final";

  // ----------- PRE-START (sin preview) -----------
  if (!started) {
    const attemptsLabel =
      attemptsRemaining === null
        ? `Intentos: ${maxAttempts}`
        : `Intentos restantes: ${attemptsRemaining}/${maxAttempts}`;

    const blockedByAttempts = attemptsRemaining === 0;
    const notice = activity?._notice;
    const startBlocked = !!activity?._startBlocked || activity?.completed === true;
    const blocked = blockedByAttempts || startBlocked;

    // Si está bloqueado (ya completado o sin intentos), NO mostramos preview ni permitimos iniciar.
    if (startBlocked) {
      const msg =
        notice?.text ||
        (activity?.completed === true
          ? "Ya realizaste este examen. Tu resultado quedó registrado."
          : "Este examen no se puede iniciar en este momento.");
      const sev = notice?.severity || "info";

      return (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.textMain, mb: 0.5 }}>
            {displayName}
          </Typography>
          <Alert severity={sev} sx={{ borderRadius: 2, mb: 1.25 }}>
            <Typography variant="body2" sx={{ color: COLORS.textMain }}>
              {msg}
            </Typography>
          </Alert>
          <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
            {attemptsLabel}
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.textMain, mb: 0.5 }}>
          {displayName}
        </Typography>

        <Alert severity={blocked ? "error" : "warning"} sx={{ borderRadius: 2, mb: 1.25 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>
            Importante
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textMain }}>
            {blocked
              ? "Ya no tienes intentos disponibles para este examen."
              : "Una vez que inicies el examen, se considera consumido un intento. Asegúrate de estar lista/o antes de comenzar."}
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textMain, mt: 0.5 }}>
            {attemptsLabel} · Preguntas: {Math.min(pickCount, bankRaw.length)}/{bankRaw.length}
          </Typography>
        </Alert>

        <Button
          variant="contained"
          disabled={blocked || bankRaw.length === 0}
          onClick={() => setConfirmOpen(true)}
          sx={{
            backgroundColor: COLORS.red,
            "&:hover": { backgroundColor: COLORS.redDark },
            borderRadius: 999,
            fontWeight: 950,
            textTransform: "none",
          }}
        >
          Iniciar examen
        </Button>

        {bankRaw.length === 0 && (
          <Typography variant="body2" sx={{ color: COLORS.textMuted, mt: 1 }}>
            No hay preguntas configuradas para este examen.
            {/* DEV: Esperado: activity.config.questionsBank + pickCount */}
          </Typography>
        )}

        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 900 }}>Confirmar inicio</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ color: COLORS.textMain }}>
              Al iniciar, <b>se consumirá un intento</b>. Si sales a mitad, tu intento puede contar como usado.
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textMain, mt: 1 }}>
              {attemptsLabel}
            </Typography>

            <Stack direction="row" spacing={1.25} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleStart}
                sx={{
                  backgroundColor: COLORS.red,
                  "&:hover": { backgroundColor: COLORS.redDark },
                  borderRadius: 999,
                  fontWeight: 950,
                  textTransform: "none",
                }}
              >
                Sí, iniciar
              </Button>
              <Button
                variant="outlined"
                onClick={() => setConfirmOpen(false)}
                sx={{ borderRadius: 999, fontWeight: 900, textTransform: "none" }}
              >
                Cancelar
              </Button>
            </Stack>
          </DialogContent>
        </Dialog>
      </Box>
    );
  }

  // ----------- EXAMEN EN CURSO -----------
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.textMain, mb: 0.25 }}>
        {displayName}
      </Typography>
      <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 1.25 }}>
        Responde y envía. Para aprobar necesitas {minScore}%.
        {/* DEV: final_quiz usa questionsBank + pickCount. Puede barajar preguntas/opciones. */}
      </Typography>

      <Stack spacing={2}>
        {questions.map((q, idx) => {
          const text = q.texto || `Pregunta ${idx + 1}`;
          const options = q.opciones || [];
          const selected = answers[idx];

          const correct = q.respuestaCorrecta || null;
          const isCorrect = submitted && correct ? selected === correct : false;

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
                    fontWeight: 700,
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
              sx={{ backgroundColor: COLORS.red, "&:hover": { backgroundColor: COLORS.redDark } }}
            >
              Enviar respuestas
            </Button>
          )}

          {submitted && result && (
            <Alert severity={result.passed ? "success" : "warning"} sx={{ mt: 1.5, borderRadius: 2 }}>
              Score: {result.percentScore}% ({result.scoreRaw}/{result.total}).{" "}
              {result.passed ? "Aprobado ✅" : "No aprobado ❌"}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};
// =======================
// 🧭 PATH VIEWER
// =======================
const PathViewer = ({ activity, resolveAssetUrl, onChoosePath }) => {
  const config = activity?.config || {};
  const options = Array.isArray(config.options) ? config.options : [];
  const prompt = config.prompt || "Elige hasta 2 caminos para continuar";
  const maxChoices = Number.isFinite(config.maxChoices) ? Number(config.maxChoices) : 2;

  const [selected, setSelected] = useState([]);

  useEffect(() => {
    setSelected([]);
  }, [activity?.id]);

  if (!options.length) {
    return (
      <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
        Falta configurar <code>config.options</code> para esta actividad tipo <code>path</code>.
      </Typography>
    );
  }

  const toggle = (key) => {
    setSelected((prev) => {
      const k = String(key).toUpperCase();
      const exists = prev.includes(k);
      if (exists) return prev.filter((x) => x !== k);
      if (prev.length >= maxChoices) return prev;
      return [...prev, k];
    });
  };

  const isDisabled = (key) => {
    const k = String(key).toUpperCase();
    return selected.length >= maxChoices && !selected.includes(k);
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 1.0 }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: COLORS.textMain, mb: 0.15 }}>
            {activity?.title || activity?.name || "Elige tu camino"}
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
            {prompt}
          </Typography>
        </Box>

        <Chip
          size="small"
          icon={<FiStar size={14} />}
          label={`Seleccionadas: ${selected.length}/${maxChoices}`}
          sx={{
            fontSize: "0.72rem",
            fontWeight: 900,
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.subtle}`,
          }}
        />
      </Stack>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.1,
          justifyContent: "center",
          alignItems: "stretch",
        }}
      >
        {options.map((opt, idx) => {
          const key = String(opt?.key || opt?.code || `opt-${idx}`).toUpperCase();
          const label = opt?.label || opt?.title || key;
          const desc = opt?.description || "";
          const img = opt?.image ? resolveAssetUrl(opt.image) : null;
          const helpUrl = opt?.helpUrl || opt?.help?.url || null;

          const checked = selected.includes(key);
          const disabled = isDisabled(key);

          const handleCardClick = () => {
            if (disabled) return;
            toggle(key);
          };

          return (
            <Box
              key={key}
              onClick={handleCardClick}
              sx={{
                backgroundColor: COLORS.red,
                borderRadius: 2.25,
                p: 1.0,
                cursor: disabled ? "not-allowed" : "pointer",
                boxShadow: checked
                  ? "0 8px 18px rgba(204,0,0,0.26)"
                  : "0 5px 12px rgba(0,0,0,0.14)",
                outline: checked ? `2px solid ${COLORS.redDark}` : "none",
                opacity: disabled ? 0.6 : 1,
                transition: "all 0.14s ease",
                "&:hover": disabled
                  ? {}
                  : {
                      transform: "translateY(-1px)",
                      boxShadow: checked
                        ? "0 10px 22px rgba(204,0,0,0.30)"
                        : "0 8px 18px rgba(0,0,0,0.18)",
                    },
                width: "100%",
                maxWidth: 280,
                mx: "auto",
                flex: {
                  xs: "1 1 100%",
                  sm: "0 0 280px",
                  md: "0 0 280px",
                },
              }}
            >
              <Box
                sx={{
                  backgroundColor: COLORS.white,
                  borderRadius: 1.8,
                  overflow: "hidden",
                  border: `1px solid rgba(0,0,0,0.06)`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Box sx={{ width: "100%", height: 92, backgroundColor: COLORS.whiteAlt }}>
                  <Box
                    component="img"
                    src={img || `${process.env.PUBLIC_URL}/assets/Prog1.png`}
                    alt={label}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/Prog1.png`;
                    }}
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                  />
                </Box>

                <Box sx={{ px: 1.25, pt: 1.15, pb: 1.1, textAlign: "center" }}>
                  <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.8} sx={{ mb: 0.45 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        color: COLORS.textMain,
                        fontSize: "0.80rem",
                        lineHeight: 1.1,
                      }}
                    >
                      {label}
                    </Typography>

                    <Chip
                      size="small"
                      label={key}
                      sx={{
                        height: 18,
                        fontSize: "0.64rem",
                        fontWeight: 900,
                        backgroundColor: COLORS.whiteAlt,
                        border: `1px solid ${COLORS.subtle}`,
                      }}
                    />
                  </Stack>

                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: ".75rem",
                      lineHeight: 1.22,
                      color: COLORS.textMuted,
                      minHeight: 28,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {desc || " "}
                  </Typography>

                  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mt: 0.85 }}>
                    <Button
                      variant="contained"
                      onClick={() => toggle(key)}
                      disabled={disabled}
                      startIcon={checked ? <FiCheckCircle size={14} /> : <FiStar size={14} />}
                      sx={{
                        backgroundColor: COLORS.red,
                        color: "#fff",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        fontSize: "0.68rem",
                        px: 2.0,
                        py: 0.5,
                        borderRadius: 999,
                        "&:hover": { backgroundColor: COLORS.redDark },
                        "&.Mui-disabled": {
                          backgroundColor: "rgba(0,0,0,0.15)",
                          color: "rgba(0,0,0,0.35)",
                        },
                      }}
                    >
                      {checked ? "SELECCIONADO" : "ELEGIR"}
                    </Button>

                    {helpUrl && (
                      <Button
                        variant="outlined"
                        onClick={() => window.open(helpUrl, "_blank", "noopener,noreferrer")}
                        endIcon={<FiExternalLink size={14} />}
                        sx={{
                          borderColor: COLORS.red,
                          color: COLORS.red,
                          fontWeight: 900,
                          textTransform: "uppercase",
                          fontSize: "0.68rem",
                          px: 1.9,
                          py: 0.45,
                          borderRadius: 999,
                          "&:hover": {
                            borderColor: COLORS.redDark,
                            color: COLORS.redDark,
                            backgroundColor: "rgba(255,51,51,0.06)",
                          },
                        }}
                      >
                        VER MÁS
                      </Button>
                    )}
                  </Stack>

                  {disabled && (
                    <Box sx={{ mt: 0.7 }}>
                      <Typography variant="caption" sx={{ color: COLORS.redDark, fontWeight: 900 }}>
                        Máximo {maxChoices}. Deselecciona una para elegir otra.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: "none" }}>
                <Checkbox checked={checked} readOnly />
              </Box>
            </Box>
          );
        })}
      </Box>

      <Button
        variant="contained"
        disabled={selected.length === 0}
        onClick={() => onChoosePath?.(selected)}
        sx={{
          mt: 1.6,
          backgroundColor: COLORS.red,
          "&:hover": { backgroundColor: COLORS.redDark },
          textTransform: "none",
          fontWeight: 950,
          borderRadius: 999,
        }}
      >
        Confirmar selección
      </Button>

      {selected.length === 0 && (
        <Typography variant="caption" sx={{ display: "block", mt: 0.75, color: COLORS.textMuted }}>
          Selecciona {maxChoices === 1 ? "una opción" : `hasta ${maxChoices} opciones`} para continuar.
        </Typography>
      )}
    </Box>
  );
};

// =======================
// 📦 SCORM VIEWER (ZIP → wrapper launchUrl vía backend)
// =======================
const ScormViewer = ({ activity, resolveAssetUrl, postWithAuth, onScormComplete }) => {
  const config = activity?.config || {};
  const scormPackageUrl = config?.scormPackageUrl
    ? resolveAssetUrl(config.scormPackageUrl)
    : null;
  const initialLaunchUrl = config?.launchUrl
    ? resolveAssetUrl(config.launchUrl)
    : null;

  const [open, setOpen] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [launchUrl, setLaunchUrl] = useState(initialLaunchUrl);
  const [mounting, setMounting] = useState(false);
  const [mountError, setMountError] = useState(null);

  // ✅ extra: detectar “no cargó” (XFO/CSP suele no disparar onError)
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
    return `${BACKEND_URL}${s.startsWith("/") ? "" : "/"}${s}`;
  };

  const ensureLaunchUrl = async () => {
    if (launchUrl) return launchUrl;
    if (!scormPackageUrl) return null;

    setMounting(true);
    setMountError(null);

    try {
      const resp = await postWithAuth(
        `${BACKEND_URL}/progreso/scorm/activities/${activity.id}/mount`,
        {
          scormPackageUrl: config.scormPackageUrl,
        }
      );

      const url = resp?.launchUrl ? toBackendAbsolute(resp.launchUrl) : null;
      if (!url) throw new Error("El backend no devolvió launchUrl");

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
    const completion = String(
      cmi["cmi.completion_status"] || cmi["cmi.core.lesson_status"] || ""
    ).toLowerCase();
    const success = String(cmi["cmi.success_status"] || "").toLowerCase();

    if (["completed", "passed"].includes(completion)) return true;
    if (success === "passed") return true;
    return false;
  };

  // ✅ Listener SCORM commits
  useEffect(() => {
    const backendOrigin = (() => {
      try {
        return new URL(BACKEND_URL).origin;
      } catch {
        return BACKEND_URL;
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
          await postWithAuth(
            `${BACKEND_URL}/progreso/scorm/activities/${activity.id}/commit`,
            { cmi, raw: data.raw || null }
          );
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
  }, [activity?.id, postWithAuth, onScormComplete]);

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

    // Si el navegador bloquea por headers, a veces no dispara onError:
    // dejamos un hint si después de ~1.5s no se “siente” cargado.
    setTimeout(() => {
      setMaybeBlocked((prev) => prev || false);
    }, 1500);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        {activity?.title || activity?.name || "Contenido SCORM"}
      </Typography>

      {/* ✅ Botón centrado */}
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
        <Typography
          variant="caption"
          sx={{ color: COLORS.redDark, display: "block", textAlign: "center" }}
        >
          {mountError}
        </Typography>
      )}

      {/* ✅ Inline player (NO MODAL) */}
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
                Si aquí ves “rechazó la conexión”, normalmente es bloqueo por headers (CSP/X-Frame-Options).
                Con tu fix del backend (frame-ancestors) ya debería estar OK.
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

// =======================
// 🎬 VIEWER DE ACTIVIDAD
// =======================
const ActivityViewer = ({
  selectedActivity,
  onMarkComplete,
  onMarkCompleteManual,
  onMarkCompleteUrl,
  onMarkVideoPlayed,
  onChoosePath,
  resolveAssetUrl,
}) => {
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
    const raw = Array.isArray(config.videoIds) ? config.videoIds[0] : config.videoIds;
    const videoId = extractYoutubeId(raw);

    return (
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textMain, mb: 0.5 }}>
          {displayName}
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.textMuted, mb: 1 }}>
          Recurso en video (se marca al darle play)
        </Typography>

        <YouTubePlayer videoId={videoId} title={displayName} onPlayOnce={onMarkVideoPlayed} />
      </Box>
    );
  }

  if (type === "reading" || type === "lectura") {
    const manualId = config.manualId;
    let manualUrl = config.manualUrl;

    if (!manualUrl && manualId) {
      if (typeof manualId === "string" && (manualId.startsWith("/") || manualId.startsWith("http"))) {
        manualUrl = manualId;
      } else {
        manualUrl = `/manuals/${manualId}.pdf`;
      }
    }

    const showPreview = config.preview !== false && !iframeError;

    return (
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textMain, mb: 0.5 }}>
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
              sx={{ mb: 1.5, backgroundColor: COLORS.red, "&:hover": { backgroundColor: COLORS.redDark } }}
              href={manualUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onMarkCompleteManual?.()}
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
                No se pudo mostrar la vista previa embebida, pero puedes abrir el manual en otra pestaña.
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
            Falta configurar <code>manualId</code> o <code>manualUrl</code>.
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
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textMain, mb: 0.5 }}>
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
                    onMarkCompleteUrl?.();
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
                onClick={() => onMarkCompleteUrl?.()}
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
          </>
        ) : (
          <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
            Falta configurar <code>config.url</code>.
          </Typography>
        )}
      </Box>
    );
  }

  if (type === "path") {
    return (
      <PathViewer activity={activity} resolveAssetUrl={resolveAssetUrl} onChoosePath={onChoosePath} />
    );
  }

  if (type === "scorm") {
    return (
      <ScormViewer
        activity={activity}
        resolveAssetUrl={resolveAssetUrl}
        postWithAuth={postWithAuth}
        onScormComplete={async ({ score, cmi }) => {
          await onMarkComplete?.({
            score: Number.isFinite(score) ? score : null,
            passed: true,
            data_json: { completedBy: "scorm_runtime", cmi },
          });
        }}
      />
    );
  }

  if (type === "quiz" || type === "examen") {
    return <QuizViewer activity={activity} onComplete={onMarkComplete} />;
  }

  if (type === "final_quiz") {
    return <FinalQuizViewer activity={activity} onComplete={onMarkComplete} />;
  }

  if (type === "docs" || type === "upload") {
    return (
      <DocsUploader
        activity={activity}
        onUploaded={async ({ doc }) => {
          await onMarkComplete?.({
            score: null,
            passed: true,
            data_json: { completedBy: "docs_upload", docId: doc?.id || null },
          });
        }}
      />
    );
  }


return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textMain, mb: 0.5 }}>
        {displayName}
      </Typography>
      <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
        Tipo: <code>{type || "desconocido"}</code>
      </Typography>
    </Box>
  );
};

// =======================
// 🌟 COMPONENTE PRINCIPAL
// =======================
const CourseTimeline = ({
  modules = [],
  context,
  onActivityClick,
  onProgressUpdate,
  hideOuterContainer = false,
}) => {
  const [courseModules, setCourseModules] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const resolveAssetUrl = (maybePath) => {
    if (!maybePath) return null;
    const s = String(maybePath).trim();
    if (!s) return null;
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.startsWith("/assets/")) return `${process.env.PUBLIC_URL}${s}`;
    return s;
  };

  useEffect(() => {
    const normalized = (modules || []).map((m) => ({
      ...m,
      id: normModuleId(m),
      order: normOrder(m),
      title: m?.title ?? m?.name ?? "Módulo",
      activities: (m?.activities || []).map((a) => {
        const id = normActivityId(a);
        if (!id) console.warn("⚠️ [SV] Actividad sin activity_id/id real:", a);
        return {
          ...a,
          id,
          order: normOrder(a),
          title: a?.title ?? a?.name ?? "Actividad",
          completed: a?.completed === true,
          status: a?.status || (a?.completed ? "completed" : "not_started"),
        };
      }),
    }));

    const sorted = [...normalized].sort((a, b) => (a?.order ?? 999) - (b?.order ?? 999));
    sorted.forEach((m) => {
      m.activities = [...(m.activities || [])].sort((a, b) => (a?.order ?? 999) - (b?.order ?? 999));
    });

    setCourseModules(sorted);
  }, [modules]);

  const courseStats = useMemo(() => getCourseStatsFromModules(courseModules), [courseModules]);

  const patchActivityLocal = ({ moduleId, activityId, patch }) => {
    setCourseModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        return {
          ...m,
          activities: (m.activities || []).map((a) => {
            if (a.id !== activityId) return a;
            return { ...a, ...patch };
          }),
        };
      })
    );

    if (typeof onProgressUpdate === "function") {
      onProgressUpdate({
        blockId: context?.blockId,
        moduleId,
        activityId,
        patch,
      });
    }
  };

  const markStarted = async ({ activityId }) => {
    await postWithAuth(`${BACKEND_URL}/progreso/actividades/${activityId}/iniciar`);
  };

  const markCompleted = async ({ moduleId, activity, score = null, passed = true, data_json = null }) => {
    await postWithAuth(`${BACKEND_URL}/progreso/actividades/${activity.id}/completar`, {
      score,
      passed,
      data_json,
    });

    patchActivityLocal({
      moduleId,
      activityId: activity.id,
      patch: {
        completed: passed === true,
        status: passed ? "completed" : "failed",
        score: score ?? activity.score ?? null,
      },
    });
  };

  const shouldAutoCompleteOnOpen = (activity) => {
    const type = activity?.type;
    if (!type) return true;
    if (type === "video") return false;
    if (type === "path") return false;
    if (type === "scorm") return false;
    if (type === "practica") return true;
    if (type === "reading" || type === "lectura") return false;
    if (type === "url") return false;
    if (type === "quiz" || type === "examen" || type === "final_quiz") return false;
    if (type === "docs") return false;
    return true;
  };

  const handleActivityClick = async (module, activity) => {
    const activityIdNum = Number(activity?.id);
    if (!Number.isFinite(activityIdNum) || activityIdNum <= 0) {
      console.warn("❌ [SV] activity.id inválido (debe ser INT activity_id):", activity?.id, activity);
      setSelectedActivity({
        ...context,
        moduleId: module?.id,
        moduleTitle: safeTitle(module),
        activity,
        _invalidId: true,
      });
      return;
    }

    const type = activity?.type;
    const isCompleted = activity?.completed === true;

    // UX: Para final_quiz NO permitimos re-iniciar si ya está completado o si backend bloquea por intentos.
    // DEV: La validación real debe ser server-side (iniciarActividad) para evitar bypass en multi-dispositivo.
    const buildBlockedActivity = (noticeText, severity = "info") => ({
      ...activity,
      id: activityIdNum,
      _startBlocked: true,
      _notice: { severity, text: noticeText },
    });

    const payload = {
      ...context,
      moduleId: module?.id,
      moduleTitle: safeTitle(module),
      activity: { ...activity, id: activityIdNum },
    };

    // Si ya viene como completado desde backend, bloqueamos el inicio del examen final desde UI.
    if (type === "final_quiz" && isCompleted) {
      payload.activity = buildBlockedActivity("Ya realizaste este examen. Tu resultado quedó registrado.");
      setSelectedActivity(payload);
      if (typeof onActivityClick === "function") onActivityClick(payload);
      return;
    }

    setSelectedActivity(payload);
    if (typeof onActivityClick === "function") onActivityClick(payload);

    try {
      await markStarted({ activityId: activityIdNum });
    } catch (err) {
      const msg = String(err?.message || err || "");

      if (type === "final_quiz") {
        // Mensajes típicos desde backend: "Examen ya completado", "No attempts remaining", etc.
        if (/completad/i.test(msg) || /ya\s+complet/i.test(msg)) {
          const blocked = buildBlockedActivity("Ya realizaste este examen. Tu resultado quedó registrado.");
          setSelectedActivity((prev) => (prev && prev.activity?.id === activityIdNum ? { ...prev, activity: blocked } : prev));
          return;
        }
        if (/intento|attempt/i.test(msg) || /no\s+attempt/i.test(msg)) {
          const blocked = buildBlockedActivity("Ya no tienes intentos disponibles para este examen.", "warning");
          setSelectedActivity((prev) => (prev && prev.activity?.id === activityIdNum ? { ...prev, activity: blocked } : prev));
          return;
        }
      }

      // Default: mostramos error humano pero no crasheamos.
      setSelectedActivity((prev) =>
        prev && prev.activity?.id === activityIdNum
          ? { ...prev, activity: { ...prev.activity, _notice: { severity: "error", text: msg || "Ocurrió un error." } } }
          : prev
      );
      return;
    }

    if (!activity.completed && shouldAutoCompleteOnOpen(activity)) {
      await markCompleted({
        moduleId: module.id,
        activity: { ...activity, id: activityIdNum },
        score: null,
        passed: true,
        data_json: { completedBy: "auto_open", type: activity?.type || "unknown" },
      });
    }
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

  const isViewerOpen = !!selectedActivity;

  return (
    <Outer {...outerProps}>
      {isViewerOpen && selectedActivity?._invalidId && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          Esta actividad no tiene <b>activity_id</b> válido (INT). Debe venir desde backend como{" "}
          <code>activity_id</code>/<code>id</code>.
        </Alert>
      )}

      {!hideOuterContainer && (
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: 3,
            backgroundColor: COLORS.whiteSoft,
            border: `1px solid ${COLORS.subtle}`,
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
      )}

      {/* VIEWER */}
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

          <Typography variant="caption" sx={{ color: COLORS.textMuted, mb: 0.5, display: "block" }}>
            {selectedActivity?.blockTitle ? `${selectedActivity.blockTitle} · ` : ""}
            {selectedActivity.moduleTitle}
          </Typography>

          <ActivityViewer
            selectedActivity={selectedActivity}
            resolveAssetUrl={resolveAssetUrl}
            onChoosePath={async (choicesArr) => {
              const activityId = Number(selectedActivity.activity?.id);
              const moduleId = selectedActivity.moduleId;

              if (!Number.isFinite(activityId) || activityId <= 0) {
                console.warn("❌ choosePath: activityId inválido", activityId);
                return;
              }

              const choices = Array.isArray(choicesArr) ? choicesArr : [choicesArr].filter(Boolean);
              const choice = choices?.[0] || null;

              try {
                await postWithAuth(`${BACKEND_URL}/progreso/actividades/${activityId}/choose`, {
                  choice,
                  choices,
                });

                patchActivityLocal({
                  moduleId,
                  activityId,
                  patch: { completed: true, status: "completed" },
                });

                setSelectedActivity(null);
              } catch (e) {
                await markCompleted({
                  moduleId,
                  activity: selectedActivity.activity,
                  score: null,
                  passed: true,
                  data_json: { completedBy: "path_choice", choice, choices },
                });
                setSelectedActivity(null);
              }
            }}
            onMarkComplete={async ({ score, passed, data_json }) => {
              await markCompleted({
                moduleId: selectedActivity.moduleId,
                activity: selectedActivity.activity,
                score,
                passed,
                data_json,
              });
            }}
            onMarkCompleteManual={async () => {
              if (!selectedActivity.activity.completed) {
                await markCompleted({
                  moduleId: selectedActivity.moduleId,
                  activity: selectedActivity.activity,
                  score: null,
                  passed: true,
                  data_json: { completedBy: "manual_open" },
                });
              }
            }}
            onMarkCompleteUrl={async () => {
              if (!selectedActivity.activity.completed) {
                await markCompleted({
                  moduleId: selectedActivity.moduleId,
                  activity: selectedActivity.activity,
                  score: null,
                  passed: true,
                  data_json: { completedBy: "url_open" },
                });
              }
            }}
            onMarkVideoPlayed={async () => {
              if (!selectedActivity.activity.completed) {
                await markCompleted({
                  moduleId: selectedActivity.moduleId,
                  activity: selectedActivity.activity,
                  score: null,
                  passed: true,
                  data_json: { completedBy: "youtube_play" },
                });
              }
            }}
          />
        </Paper>
      )}

      {/* TIMELINE */}
      {!isViewerOpen && (
        <Box sx={{ width: "100%" }}>
          {courseModules.map((module, index) => {
            const moduleStats = getModuleStats(module);
            const locked = isModuleLocked(courseModules, index);

            return (
              <Stack
                key={module.id || index}
                direction="row"
                spacing={2}
                alignItems="flex-start"
                sx={{ mb: 3 }}
              >
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
                        backgroundColor: locked ? COLORS.locked : moduleStats.completed ? "#e0f8ec" : "#fff6e6",
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
                      background: locked ? COLORS.locked : `linear-gradient(135deg, ${COLORS.red}, #ff6b6b)`,
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

                  {index < courseModules.length - 1 && (
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
                              key={activity?.id || `${label}-${activity?.order ?? ""}`}
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