import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Button,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Stack,
  TextField,
  Snackbar,
  Alert,
  Collapse,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaUserShield,
  FaMapMarkerAlt,
  FaFlag,
  FaRegLightbulb,
  FaArrowUp,
  FaArrowDown,
  FaSync,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaClipboardCheck,
} from "react-icons/fa";

/**
 * ActividadesAMS — Módulo didáctico para el curso "Acceso Más Seguro" (CRM)
 *
 * Requisitos del usuario: React + MUI + react-icons.
 * NO reutiliza las preguntas provistas; se crean dinámicas nuevas alineadas al enfoque AMS.
 *
 * Contenido: 4 mini-actividades interactivas + barra de progreso + retroalimentación.
 * - A1: Radar de Riesgo (clasificación Bajo/Medio/Alto por situación de campo)
 * - A2: Ruta Segura (ordenar pasos de actuación)
 * - A3: Visibilidad Responsable (clasificar elementos en Visible vs. Riesgo)
 * - A4: Miniprotocolo (checklist de medidas y autogeneración de protocolo breve)
 *
 * Paleta de colores (preferencia del usuario):
 *  fondo #fff8ff, detalles/sombras #e6dfef, detalles rojos #ff3333
 */

const PALETTE = {
  bg: "#fff8ff",
  ink: "#1f1135",
  subtle: "#e6dfef",
  accent: "#ff3333",
  ok: "#2e7d32",
  warn: "#ef6c00",
};

const Shell = styled(Box)(({ theme }) => ({
  background: PALETTE.bg,
  minHeight: "100%",
  padding: theme.spacing(2),
}));

const SoftCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  border: `1px solid ${PALETTE.subtle}`,
  boxShadow: `0 8px 24px rgba(0,0,0,0.06)`,
  background: "#fff",
}));

const SoftPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  border: `1px dashed ${PALETTE.subtle}`,
  background: "#fff",
  padding: theme.spacing(2),
}));

const SectionTitle = ({ icon, title, subtitle }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
    <Box sx={{ fontSize: 22, color: PALETTE.accent }}>{icon}</Box>
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: PALETTE.ink }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

const Pill = ({ ok, children }) => (
  <Chip
    size="small"
    label={children}
    sx={{
      fontWeight: 600,
      color: ok ? "#fff" : PALETTE.ink,
      background: ok ? PALETTE.ok : PALETTE.subtle,
      borderRadius: 2,
    }}
  />
);

// Helpers
const shuffle = (arr) => arr.map((v) => ({ v, s: Math.random() }))
  .sort((a, b) => a.s - b.s).map(({ v }) => v);

const persist = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const revive = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

// ---------- A1: Radar de Riesgo ----------
const RISK_ITEMS = [
  { id: 1, text: "Ingreso a colonia con conflicto activo reportado en últimas 24h" },
  { id: 2, text: "Traslado diurno con equipo completo y conductor designado" },
  { id: 3, text: "Entrega de ayuda sin coordinación con autoridad local" },
  { id: 4, text: "Actividad nocturna con rutas secundarias sin iluminación" },
  { id: 5, text: "Punto de reunión comunicado y confirmación en radio" },
  { id: 6, text: "Visita a comunidad tras lluvia intensa y deslaves recientes" },
];

const RISK_KEY = {
  1: "Alto",
  2: "Bajo",
  3: "Alto",
  4: "Medio",
  5: "Bajo",
  6: "Medio",
};

// ---------- A2: Ruta Segura (orden) ----------
const FLOW_STEPS = [
  { id: "prep", label: "Preparación del equipo" },
  { id: "ident", label: "Identificación visible y roles" },
  { id: "eval", label: "Evaluar entorno y riesgos" },
  { id: "com", label: "Comunicar plan y rutas" },
  { id: "act", label: "Ejecución con monitoreo" },
  { id: "post", label: "Cierre y lecciones aprendidas" },
];

const FLOW_CORRECT = ["prep", "ident", "eval", "com", "act", "post"];

// ---------- A3: Visibilidad Responsable (clasificar) ----------
const VIS_ITEMS = [
  { id: "chaleco", text: "Chaleco institucional en terreno" },
  { id: "selfie", text: "Selfie en zona sensible con población identificable" },
  { id: "emblema", text: "Emblema visible en vehículo autorizado" },
  { id: "hashtags", text: "Hashtags y ubicación en vivo durante operativo" },
  { id: "reporte", text: "Reporte de cierre sin datos personales" },
  { id: "donativos", text: "Publicar lista de personas beneficiarias con nombres" },
];

const VIS_MAP = {
  chaleco: "Visible",
  selfie: "Riesgo",
  emblema: "Visible",
  hashtags: "Riesgo",
  reporte: "Visible",
  donativos: "Riesgo",
};

// ---------- A4: Miniprotocolo (checklist) ----------
const PROTOCOL_ITEMS = [
  { id: "contacto", label: "Contacto de emergencia designado" },
  { id: "ruta", label: "Rutas primaria y alternativa identificadas" },
  { id: "pdi", label: "Puntos de ingreso/egreso y punto seguro" },
  { id: "brief", label: "Brief de seguridad antes de salir" },
  { id: "checkin", label: "Check-in por radio/cel cada 30-60 min" },
  { id: "kit", label: "Kit mínimo: agua, botiquín, luz, power bank" },
  { id: "mapa", label: "Mapa offline/descargado del área" },
  { id: "coord", label: "Coordinación con autoridad/comité local" },
];

function ScoreBar({ value }) {
  return (
    <Box sx={{ px: 1 }}>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 10,
          borderRadius: 999,
          background: PALETTE.subtle,
          "& .MuiLinearProgress-bar": { background: PALETTE.accent },
        }}
      />
    </Box>
  );
}

function ActivityHeader({ title, icon, done }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
      <SectionTitle icon={icon} title={title} />
      <Pill ok={done}>{done ? "Listo" : "Pendiente"}</Pill>
    </Box>
  );
}

function RadarRiesgo({ onComplete, saved }) {
  const [answers, setAnswers] = useState(() => revive("ams_a1", saved || {}));
  const [revealed, setRevealed] = useState(false);

  useEffect(() => persist("ams_a1", answers), [answers]);

  const items = useMemo(() => shuffle(RISK_ITEMS), []);

  const correctCount = Object.keys(RISK_KEY).filter((id) => answers[id] === RISK_KEY[id]).length;
  const finished = Object.keys(answers).length === RISK_ITEMS.length;

  useEffect(() => {
    if (finished) onComplete?.(correctCount / RISK_ITEMS.length);
  }, [finished, correctCount, onComplete]);

  return (
    <SoftCard>
      <CardHeader title={<ActivityHeader title="Radar de Riesgo" icon={<FaExclamationTriangle />} done={finished} />} />
      <CardContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Lee cada situación y marca el nivel de riesgo percibido para el equipo. Luego, verifica tu criterio.
        </Typography>
        <Grid container spacing={2}>
          {items.map((it) => (
            <Grid item xs={12} md={6} key={it.id}>
              <SoftPaper>
                <Typography sx={{ mb: 1 }}>{it.text}</Typography>
                <ToggleButtonGroup
                  exclusive
                  value={answers[it.id] || null}
                  onChange={(_, v) => v && setAnswers((a) => ({ ...a, [it.id]: v }))}
                  size="small"
                >
                  {["Bajo", "Medio", "Alto"].map((lvl) => (
                    <ToggleButton key={lvl} value={lvl} sx={{ mr: 1 }}>
                      {lvl}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Collapse in={revealed && answers[it.id] != null}>
                  <Box sx={{ mt: 1 }}>
                    {answers[it.id] === RISK_KEY[it.id] ? (
                      <Alert icon={<FaCheck />} severity="success" sx={{ borderRadius: 2 }}>
                        Buen criterio.
                      </Alert>
                    ) : (
                      <Alert icon={<FaTimes />} severity="warning" sx={{ borderRadius: 2 }}>
                        Revisa: la referencia esperada es <b>{RISK_KEY[it.id]}</b> para esta situación.
                      </Alert>
                    )}
                  </Box>
                </Collapse>
              </SoftPaper>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Button
            variant="contained"
            onClick={() => setRevealed(true)}
            sx={{ bgcolor: PALETTE.accent, ":hover": { bgcolor: "#e02d2d" } }}
          >
            Verificar respuestas
          </Button>
          <Button variant="outlined" onClick={() => { setAnswers({}); setRevealed(false); }} startIcon={<FaSync />}>
            Reiniciar
          </Button>
          <Box sx={{ ml: "auto", minWidth: 160 }}>
            <ScoreBar value={(correctCount / RISK_ITEMS.length) * 100} />
          </Box>
        </Box>
      </CardContent>
    </SoftCard>
  );
}

function RutaSegura({ onComplete, saved }) {
  const [order, setOrder] = useState(() => revive("ams_a2", saved || FLOW_STEPS.map((s) => s.id)));
  const [snack, setSnack] = useState(false);

  useEffect(() => persist("ams_a2", order), [order]);

  const move = (idx, dir) => {
    setOrder((o) => {
      const next = [...o];
      const j = dir === "up" ? idx - 1 : idx + 1;
      if (j < 0 || j >= next.length) return o;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const isCorrect = JSON.stringify(order) === JSON.stringify(FLOW_CORRECT);

  useEffect(() => {
    if (isCorrect) onComplete?.(1);
  }, [isCorrect, onComplete]);

  return (
    <SoftCard>
      <CardHeader title={<ActivityHeader title="Ruta Segura" icon={<FaMapMarkerAlt />} done={isCorrect} />} />
      <CardContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Ordena los pasos para una salida segura. Usa las flechas para reacomodar. Cuando el orden sea lógico, verás la confirmación.
        </Typography>
        <Grid container spacing={1}>
          {order.map((id, idx) => {
            const step = FLOW_STEPS.find((s) => s.id === id);
            const correctIdx = FLOW_CORRECT.indexOf(id);
            const ok = idx === correctIdx;
            return (
              <Grid item xs={12} key={id}>
                <SoftPaper sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip label={idx + 1} sx={{ minWidth: 40, fontWeight: 700 }} />
                  <Typography sx={{ flex: 1 }}>{step.label}</Typography>
                  <Tooltip title="Subir">
                    <IconButton onClick={() => move(idx, "up")}> <FaArrowUp /> </IconButton>
                  </Tooltip>
                  <Tooltip title="Bajar">
                    <IconButton onClick={() => move(idx, "down")}> <FaArrowDown /> </IconButton>
                  </Tooltip>
                  <Pill ok={ok}>{ok ? "OK" : "Mover"}</Pill>
                </SoftPaper>
              </Grid>
            );
          })}
        </Grid>
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Button variant="outlined" startIcon={<FaSync />} onClick={() => setOrder(FLOW_STEPS.map((s) => s.id))}>
            Reiniciar
          </Button>
          <Button variant="contained" disabled={!isCorrect} onClick={() => setSnack(true)} sx={{ bgcolor: PALETTE.accent, ":hover": { bgcolor: "#e02d2d" } }}>
            Validar
          </Button>
        </Box>
        <Snackbar open={snack} autoHideDuration={2000} onClose={() => setSnack(false)}>
          <Alert onClose={() => setSnack(false)} severity="success" icon={<FaCheck />} sx={{ width: "100%" }}>
            ¡Ruta lógica confirmada!
          </Alert>
        </Snackbar>
      </CardContent>
    </SoftCard>
  );
}

function VisibilidadResponsable({ onComplete, saved }) {
  const [choices, setChoices] = useState(() => revive("ams_a3", saved || {}));
  const [revealed, setRevealed] = useState(false);

  useEffect(() => persist("ams_a3", choices), [choices]);

  const total = VIS_ITEMS.length;
  const correct = VIS_ITEMS.filter((it) => choices[it.id] === VIS_MAP[it.id]).length;
  const finished = Object.keys(choices).length === total;

  useEffect(() => { if (finished) onComplete?.(correct / total); }, [finished, correct, total, onComplete]);

  return (
    <SoftCard>
      <CardHeader title={<ActivityHeader title="Visibilidad Responsable" icon={<FaFlag />} done={finished} />} />
      <CardContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Clasifica cada elemento: ¿favorece la visibilidad segura o representa un riesgo de exposición?
        </Typography>
        <Grid container spacing={2}>
          {VIS_ITEMS.map((it) => (
            <Grid item xs={12} md={6} key={it.id}>
              <SoftPaper>
                <Typography sx={{ mb: 1 }}>{it.text}</Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={choices[it.id] || null}
                  onChange={(_, v) => v && setChoices((c) => ({ ...c, [it.id]: v }))}
                >
                  <ToggleButton value="Visible">Visible</ToggleButton>
                  <ToggleButton value="Riesgo">Riesgo</ToggleButton>
                </ToggleButtonGroup>
                <Collapse in={revealed && choices[it.id] != null}>
                  <Box sx={{ mt: 1 }}>
                    {choices[it.id] === VIS_MAP[it.id] ? (
                      <Alert icon={<FaCheck />} severity="success" sx={{ borderRadius: 2 }}>
                        Elección adecuada.
                      </Alert>
                    ) : (
                      <Alert icon={<FaTimes />} severity="warning" sx={{ borderRadius: 2 }}>
                        Revisa: la referencia esperada es <b>{VIS_MAP[it.id]}</b>.
                      </Alert>
                    )}
                  </Box>
                </Collapse>
              </SoftPaper>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Button variant="contained" onClick={() => setRevealed(true)} sx={{ bgcolor: PALETTE.accent, ":hover": { bgcolor: "#e02d2d" } }}>
            Verificar
          </Button>
          <Button variant="outlined" startIcon={<FaSync />} onClick={() => { setChoices({}); setRevealed(false); }}>
            Reiniciar
          </Button>
          <Box sx={{ ml: "auto", minWidth: 160 }}>
            <ScoreBar value={(correct / total) * 100} />
          </Box>
        </Box>
      </CardContent>
    </SoftCard>
  );
}

function MiniProtocolo({ onComplete, saved }) {
  const [checked, setChecked] = useState(() => revive("ams_a4", saved || []));
  const [nota, setNota] = useState(() => revive("ams_a4_note", ""));

  useEffect(() => persist("ams_a4", checked), [checked]);
  useEffect(() => persist("ams_a4_note", nota), [nota]);

  const toggle = (id) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const pct = (checked.length / PROTOCOL_ITEMS.length) * 100;

  useEffect(() => onComplete?.(checked.length / PROTOCOL_ITEMS.length), [checked, onComplete]);

  const resumen = useMemo(() => {
    const sel = PROTOCOL_ITEMS.filter((p) => checked.includes(p.id)).map((p) => `• ${p.label}`).join("\n");
    return `Protocolo breve:\n${sel || "(sin elementos)"}\n${nota ? `\nNotas: ${nota}` : ""}`;
  }, [checked, nota]);

  return (
    <SoftCard>
      <CardHeader title={<ActivityHeader title="Miniprotocolo" icon={<FaClipboardCheck />} done={checked.length >= Math.ceil(PROTOCOL_ITEMS.length * 0.6)} />} />
      <CardContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Selecciona los elementos mínimos para armar un protocolo operativo breve y agrega notas.
        </Typography>
        <Grid container spacing={1}>
          {PROTOCOL_ITEMS.map((p) => (
            <Grid item xs={12} sm={6} key={p.id}>
              <Chip
                onClick={() => toggle(p.id)}
                label={p.label}
                variant={checked.includes(p.id) ? "filled" : "outlined"}
                color={checked.includes(p.id) ? "success" : undefined}
                sx={{
                  width: "100%",
                  justifyContent: "space-between",
                  borderRadius: 2,
                  mb: 1,
                }}
              />
            </Grid>
          ))}
        </Grid>
        <TextField
          label="Notas (opcional)"
          multiline
          minRows={3}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          fullWidth
          sx={{ mt: 1 }}
        />
        <Box sx={{ display: "flex", gap: 1, mt: 2, alignItems: "center" }}>
          <Box sx={{ flex: 1 }}>
            <ScoreBar value={pct} />
          </Box>
          <Tooltip title="Copiar protocolo al portapapeles">
            <Button
              variant="contained"
              onClick={async () => {
                await navigator.clipboard.writeText(resumen);
              }}
              sx={{ bgcolor: PALETTE.accent, ":hover": { bgcolor: "#e02d2d" } }}
            >
              Copiar
            </Button>
          </Tooltip>
          <Tooltip title="Reiniciar">
            <Button variant="outlined" startIcon={<FaSync />} onClick={() => { setChecked([]); setNota(""); }}>
              Reiniciar
            </Button>
          </Tooltip>
        </Box>
      </CardContent>
    </SoftCard>
  );
}

// -------------------- Contenedor principal --------------------
export default function ActividadesAMS() {
  const [scores, setScores] = useState(() => revive("ams_scores", { a1: 0, a2: 0, a3: 0, a4: 0 }));
  const [hintOpen, setHintOpen] = useState(false);

  const overall = useMemo(() => ((scores.a1 + scores.a2 + scores.a3 + scores.a4) / 4) * 100, [scores]);

  useEffect(() => persist("ams_scores", scores), [scores]);

  return (
    <Shell>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SoftCard>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ fontSize: 28, color: PALETTE.accent }}>
                  <FaUserShield />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: PALETTE.ink }}>
                    ActividadesAMS — Acceso Más Seguro
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Práctica rápida de criterios: riesgo, ruta segura, visibilidad responsable y armado de miniprotocolo.
                  </Typography>
                </Box>
                <Tooltip title="Guía breve">
                  <IconButton onClick={() => setHintOpen((v) => !v)}>
                    <FaInfoCircle />
                  </IconButton>
                </Tooltip>
              </Box>
              <Collapse in={hintOpen}>
                <SoftPaper>
                  <Typography variant="body2">
                    Usa estas dinámicas para reflexionar sobre decisiones en terreno. No sustituyen políticas oficiales ni protocolos institucionales. Diseñado para fomentar criterio y conversación en equipo.
                  </Typography>
                </SoftPaper>
              </Collapse>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                  Progreso general
                </Typography>
                <ScoreBar value={overall} />
              </Box>
            </CardContent>
          </SoftCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <RadarRiesgo onComplete={(p) => setScores((s) => ({ ...s, a1: p }))} />
        </Grid>
        <Grid item xs={12} md={6}>
          <RutaSegura onComplete={(p) => setScores((s) => ({ ...s, a2: p }))} />
        </Grid>

        <Grid item xs={12} md={6}>
          <VisibilidadResponsable onComplete={(p) => setScores((s) => ({ ...s, a3: p }))} />
        </Grid>
        <Grid item xs={12} md={6}>
          <MiniProtocolo onComplete={(p) => setScores((s) => ({ ...s, a4: p }))} />
        </Grid>

        <Grid item xs={12}>
          <SoftCard>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} gap={1} alignItems={{ xs: "stretch", sm: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Cierre rápido
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Si tu barra está alta, vas por buen camino. Repite, conversa con tu equipo y ajusta criterios a la realidad local.
                  </Typography>
                </Box>
                <Chip
                  icon={<FaShieldAlt />}
                  label={`Progreso: ${Math.round(overall)}%`}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                  color={overall >= 75 ? "success" : overall >= 40 ? "warning" : "default"}
                />
                <Button variant="outlined" startIcon={<FaSync />} onClick={() => {
                  localStorage.removeItem("ams_a1");
                  localStorage.removeItem("ams_a2");
                  localStorage.removeItem("ams_a3");
                  localStorage.removeItem("ams_a4");
                  localStorage.removeItem("ams_a4_note");
                  setScores({ a1: 0, a2: 0, a3: 0, a4: 0 });
                }}>
                  Reiniciar todo
                </Button>
              </Stack>
            </CardContent>
          </SoftCard>
        </Grid>
      </Grid>
    </Shell>
  );
}
