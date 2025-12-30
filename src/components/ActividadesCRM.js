import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Tabs,
  Tab,
  Stack,
  Divider,
  Grid,
  Alert,
} from "@mui/material";
import {
  FaHeart,
  FaHandsHelping,
  FaFlag,
  FaShieldAlt,
  FaMedkit,
  FaGlobe,
  FaUserFriends,
} from "react-icons/fa";

// --- Paleta alineada a tu UI ---
const palette = {
  bg: "#fff8ff",
  soft: "#e6dfef",
  accent: "#ff3333",
  ink: "#2a2333",
  good: "#2e7d32",
};

// --- Principios para actividades ---
const PRINCIPLES = [
  {
    key: "Humanidad",
    def: "Prevenir y aliviar el sufrimiento en todas las circunstancias.",
    icon: <FaHeart />,
  },
  {
    key: "Imparcialidad",
    def: "No discriminación por nacionalidad, raza, religión, condición social o ideas.",
    icon: <FaGlobe />,
  },
  {
    key: "Neutralidad",
    def: "No tomar parte en hostilidades ni controversias de orden político, racial, religioso o ideológico.",
    icon: <FaShieldAlt />,
  },
  {
    key: "Independencia",
    def: "Autonomía para actuar conforme a los principios, aun siendo auxiliares de los poderes públicos.",
    icon: <FaFlag />,
  },
  { key: "Voluntariado", def: "Servicio desinteresado.", icon: <FaHandsHelping /> },
  { key: "Unidad", def: "Una sola Sociedad Nacional por país.", icon: <FaUserFriends /> },
  { key: "Universalidad", def: "Movimiento mundial con deberes y derechos iguales.", icon: <FaMedkit /> },
];

// Barajar
const shuffle = (arr) => arr.map((a) => [Math.random(), a]).sort((a, b) => a[0] - b[0]).map(([, a]) => a);

export default function ActividadesCRM() {
  const [tab, setTab] = useState(0);

  // ---- MATCH (principio ↔ definición) ----
  const defs = useMemo(() => shuffle(PRINCIPLES.map((p) => p.def)), []);
  const [pickPrinciple, setPickPrinciple] = useState(null);
  const [pickDef, setPickDef] = useState(null);
  const [matched, setMatched] = useState([]);

  const handleMatchTry = (k, d) => {
    const p = PRINCIPLES.find((x) => x.key === k);
    if (!p) return;
    if (p.def === d) {
      if (!matched.includes(k)) setMatched((m) => [...m, k]);
      setPickPrinciple(null);
      setPickDef(null);
    }
  };

  useEffect(() => {
    if (pickPrinciple && pickDef) handleMatchTry(pickPrinciple, pickDef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickPrinciple, pickDef]);

  const allMatched = matched.length === PRINCIPLES.length;

  // ---- ESCENARIOS ----
  const scenarios = [
    {
      text: "En una inundación, llega una familia migrante sin documentos. Algunos vecinos piden priorizar solo a residentes.",
      options: ["Neutralidad", "Imparcialidad", "Unidad", "Independencia"],
      correct: 1,
      why: "La ayuda se brinda sin discriminación: Imparcialidad.",
    },
    {
      text: "En redes sociales te presionan para apoyar públicamente a un partido durante una emergencia.",
      options: ["Neutralidad", "Voluntariado", "Universalidad", "Humanidad"],
      correct: 0,
      why: "Neutralidad: no tomar parte en controversias políticas.",
    },
    {
      text: "El gobierno sugiere atender primero su mitin masivo en lugar de un albergue con lesionados.",
      options: ["Independencia", "Unidad", "Imparcialidad", "Voluntariado"],
      correct: 0,
      why: "Independencia: actuar conforme a necesidades humanitarias, no conveniencia política.",
    },
  ];

  const [sIdx, setSIdx] = useState(0);
  const [sPicked, setSPicked] = useState(null);

  const nextScenario = () => {
    setSIdx((s) => (s + 1) % scenarios.length);
    setSPicked(null);
  };

  const pickScenarioOption = (i) => {
    setSPicked(i);
  };

  // --- UI helpers ---
  const Pill = ({ children, active }) => (
    <Chip
      label={children}
      sx={{
        bgcolor: active ? palette.accent : palette.soft,
        color: active ? "white" : palette.ink,
        fontWeight: 600,
        mr: 1,
        mb: 1,
      }}
    />
  );

  const SectionCard = ({ title, icon, children, footer }) => (
    <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${palette.soft}`, background: "white" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <Box sx={{ color: palette.accent, fontSize: 22 }}>{icon}</Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: palette.ink }}>{title}</Typography>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Box>{children}</Box>
        {footer ? (
          <Box mt={2}>
            <Divider sx={{ mb: 2 }} />
            {footer}
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ bgcolor: palette.bg, minHeight: "100vh", p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ border: `2px solid ${palette.soft}`, borderRadius: 6, p: { xs: 2, md: 3 }, mb: 3, background: "white" }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ color: palette.accent, fontSize: 36 }}>
            <FaMedkit />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: palette.ink }}>
              ActividadesCRM — Aprende, juega y súmate 🤝
            </Typography>
            <Typography variant="body1" sx={{ color: "#5b5069" }}>
              Principios, historia y espíritu voluntario de la Cruz Roja Mexicana.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Tabs (Match + Escenarios) */}
      <Card elevation={0} sx={{ borderRadius: 6, border: `1px solid ${palette.soft}` }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant="scrollable"
          scrollButtons
          allowScrollButtonsMobile
          sx={{ borderBottom: `1px solid ${palette.soft}` }}
        >
          <Tab icon={<FaHandsHelping />} iconPosition="start" label="Match" />
          <Tab icon={<FaShieldAlt />} iconPosition="start" label="Escenarios" />
        </Tabs>

        <Box p={{ xs: 2, md: 3 }}>
          {/* --- TAB 0: MATCH --- */}
          {tab === 0 && (
            <SectionCard
              title="Relaciona principio ↔ definición"
              icon={<FaHandsHelping />}
              footer={<Typography variant="body2" color="text.secondary">Tip: elige un principio (izquierda) y luego su definición (derecha).</Typography>}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>Principios</Typography>
                  <Stack spacing={1}>
                    {PRINCIPLES.map((p) => (
                      <Button
                        key={p.key}
                        onClick={() => setPickPrinciple(p.key)}
                        startIcon={p.icon}
                        disabled={matched.includes(p.key)}
                        sx={{
                          justifyContent: "flex-start",
                          borderRadius: 3,
                          border: `1px solid ${palette.soft}`,
                          bgcolor: matched.includes(p.key)
                            ? "#e8f5e9"
                            : pickPrinciple === p.key
                            ? "#fff1f1"
                            : "white",
                          color: palette.ink,
                        }}
                        variant="contained"
                      >
                        {p.key}
                      </Button>
                    ))}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>Definiciones</Typography>
                  <Stack spacing={1}>
                    {defs.map((d, i) => (
                      <Button
                        key={i}
                        onClick={() => setPickDef(d)}
                        disabled={matched.includes(PRINCIPLES.find((p) => p.def === d)?.key || "")}
                        sx={{
                          justifyContent: "flex-start",
                          borderRadius: 3,
                          border: `1px solid ${palette.soft}`,
                          bgcolor: matched.includes(PRINCIPLES.find((p) => p.def === d)?.key || "")
                            ? "#e8f5e9"
                            : pickDef === d
                            ? "#fff1f1"
                            : "white",
                          color: palette.ink,
                        }}
                        variant="contained"
                      >
                        {d}
                      </Button>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
              <Stack direction="row" spacing={2} mt={2}>
                <Pill active>{matched.length} / {PRINCIPLES.length} correctas</Pill>
                {allMatched && (
                  <Typography variant="body1" sx={{ color: palette.good, fontWeight: 700 }}>
                    ¡Perfecto! Ya dominas las definiciones.
                  </Typography>
                )}
              </Stack>
            </SectionCard>
          )}

          {/* --- TAB 1: ESCENARIOS --- */}
          {tab === 1 && (
            <SectionCard
              title="Escenarios de decisión"
              icon={<FaShieldAlt />}
              footer={
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={() => nextScenario()} sx={{ borderColor: palette.soft, color: palette.ink }}>
                    Otro escenario
                  </Button>
                  {sPicked !== null && (
                    <Chip
                      label={sPicked === scenarios[sIdx].correct ? "Correcto" : "Revisa el principio"}
                      color={sPicked === scenarios[sIdx].correct ? "success" : "warning"}
                    />
                  )}
                </Stack>
              }
            >
              <Typography sx={{ mb: 2 }}>{scenarios[sIdx].text}</Typography>
              <Grid container spacing={1}>
                {scenarios[sIdx].options.map((op, i) => (
                  <Grid item xs={12} sm={6} key={`${sIdx}-${i}`}>
                    <Button
                      fullWidth
                      onClick={() => pickScenarioOption(i)}
                      sx={{
                        justifyContent: "flex-start",
                        borderRadius: 3,
                        border: `1px solid ${palette.soft}`,
                        bgcolor: sPicked === i ? "#fff1f1" : "white",
                        color: palette.ink,
                        p: 1.4,
                      }}
                      variant="contained"
                    >
                      {op}
                    </Button>
                  </Grid>
                ))}
              </Grid>
              {sPicked !== null && (
                <Alert sx={{ mt: 2 }} severity={sPicked === scenarios[sIdx].correct ? "success" : "info"}>
                  {scenarios[sIdx].why}
                </Alert>
              )}
            </SectionCard>
          )}
        </Box>
      </Card>

      <Box mt={3}>
        <Typography variant="caption" color="text.secondary">
          *Este componente no recolecta datos personales ni envía información. Todo ocurre en el navegador.
        </Typography>
      </Box>
    </Box>
  );
}
