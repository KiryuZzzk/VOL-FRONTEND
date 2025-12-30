import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Stack,
  Alert,
  Paper,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  FiX,
  FiPlay,
  FiHelpCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
} from "react-icons/fi";
import { auth } from "../firebase";

import CapaCoord from "../assets/CapaCoord.png";
import ComCoord from "../assets/ComCoord.png";
import VolCoord from "../assets/VolCoord.png";
import PsicCoord from "../assets/PsicCoord.png";
import MigrCoord from "../assets/MigrCoord.png";
import ReduCoord from "../assets/ReduCoord.png";
import PrevCoord from "../assets/PrevCoord.png";

const COLORS = {
  bg: "#fff8ff",
  white: "#fff",
  subtle: "#e6dfef",
  red: "#ff3333",
  redHover: "#e52e2e",
  text: "#1f1f1f",
  dot: "#d7cfe6",
};

const BACKEND_URL = "https://vol-backend.onrender.com";

// Keys backend -> nombres UI
const COORDS = [
  { key: "CAP", label: "Capacitación" },
  { key: "COM", label: "Tecnología e Imagen" },
  { key: "APS", label: "Apoyo Psicosocial" },
  { key: "MIG", label: "Migración" },
  { key: "PREV", label: "Prevención de Lesiones" },
  { key: "RDR", label: "Reducción de Riesgos de Desastres" },
  { key: "VOL", label: "Voluntariado" },
];

const cardsData = [
  {
    title: "Capacitación",
    description:
      "Capacítate como Técnico en Urgencias Médicas y apoya a tu comunidad en emergencias.",
    image: CapaCoord,
    videoId: "Cg4u8VUtQ5Y",
    notesText:
      "Tiene un costo dependiendo de los Centros de Capacitación en tu estado.",
    costHelp: {
      text: "Quieres más información?",
      url: "https://drive.google.com/file/d/1WV8d1gZkbQZCsFfar3nXHgsIkiFvub8a/view?usp=sharing",
    },
  },
  {
    title: "Tecnología e Imagen",
    description:
      "Proyectos innovadoras, campañas y contenidos que conectan con personas y comunidades.",
    image: ComCoord,
    videoId: "geMYwYi7gmA",
  },
  {
    title: "Apoyo Psicosocial",
    description:
      "Acompañamiento emocional y psicosocial para personas y equipos en crisis.",
    image: PsicCoord,
    videoId: "ry_Fo6tqtrI",
    chip: "Exclusivo para Lic. en Psicología",
  },
  {
    title: "Migración",
    description:
      "Acciones humanitarias para personas en movilidad: información, orientación y protección.",
    image: MigrCoord,
    videoId: "wdSnJvdjCK0",
  },
  {
    title: "Prevención de Lesiones",
    description:
      "Programas y hábitos seguros para reducir accidentes en casa, escuela y comunidad.",
    image: PrevCoord,
    videoId: "fkAzCuAHJDs",
  },
  {
    title: "Reducción de Riesgos de Desastres",
    description:
      "Preparación, mitigación y resiliencia comunitaria ante amenazas y desastres.",
    image: ReduCoord,
    videoId: "v8BZC2X-8xk",
  },
  {
    title: "Voluntariado",
    description:
      "Únete a una red nacional de personas comprometidas con la acción humanitaria.",
    image: VolCoord,
    videoId: "iJWz-2x-7e4",
  },
];

const keyToLabel = (k) => COORDS.find((c) => c.key === k)?.label || k;

/* ---------- Video modal ---------- */
const VideoDialog = ({ open, onClose, videoId, title }) => {
  const src = useMemo(() => {
    if (!videoId) return "";
    const params = new URLSearchParams({ autoplay: "1", rel: "0" });
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }, [videoId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <Box sx={{ position: "relative", bgcolor: "black" }}>
        <IconButton
          onClick={onClose}
          aria-label="Cerrar video"
          sx={{ position: "absolute", right: 8, top: 8, zIndex: 1, color: "white" }}
        >
          <FiX />
        </IconButton>
        <Box sx={{ position: "relative", pt: "56.25%" }}>
          {open && (
            <Box
              component="iframe"
              title={title || "Video"}
              src={src}
              allow="autoplay; encrypted-media"
              allowFullScreen
              sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

/* ---------- Card del carrusel ---------- */
const CardItem = ({ item, onOpenVideo }) => {
  const isCap = item.title === "Capacitación";
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 4,
        boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
        bgcolor: COLORS.white,
        minWidth: 280,
        maxWidth: 280,
        border: `1px solid ${COLORS.subtle}`,
        overflow: "hidden",
        transition: "transform .2s ease, box-shadow .2s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 16px 36px rgba(0,0,0,0.10)" },
      }}
    >
      <CardMedia component="img" height="150" image={item.image} alt={item.title} sx={{ objectFit: "cover" }} />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
          {item.title}
        </Typography>
        {item.chip && (
          <Chip label={item.chip} size="small" variant="outlined" sx={{ mb: 0.5, borderColor: COLORS.subtle }} />
        )}
        <Typography variant="body2" color="text.secondary">{item.description}</Typography>
      </CardContent>
      <CardActions
        sx={{
          px: 2,
          pt: 0,
          pb: 2,
          ...(isCap
            ? { flexDirection: "column", alignItems: "flex-start", gap: 1 }
            : { flexWrap: "wrap", rowGap: 1 }),
        }}
      >
        <Button
          onClick={() => onOpenVideo(item)}
          variant="contained"
          startIcon={<FiPlay />}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            borderRadius: 2,
            bgcolor: COLORS.red,
            "&:hover": { bgcolor: COLORS.redHover },
          }}
        >
          Conoce qué hacemos
        </Button>
        {item.notesText && (
          <Typography variant="caption" color="text.secondary">
            {item.notesText}
          </Typography>
        )}
        {item.costHelp && (
          <Button
            href={item.costHelp.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="text"
            size="small"
            startIcon={<FiHelpCircle />}
            sx={{ textTransform: "none", px: 0, color: COLORS.text }}
          >
            {item.costHelp.text}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

/* ---------- Sub-modal de selección (1 o 2, solo nombres) ---------- */
const SelectionDialog = ({ open, onClose, locked, canChoose, initial, onConfirm }) => {
  const [picked, setPicked] = useState(initial || []);
  useEffect(() => setPicked(initial || []), [initial, open]);

  const toggle = (key) => {
    if (locked || !canChoose) return;
    setPicked((prev) => {
      const has = prev.includes(key);
      if (has) return prev.filter((k) => k !== key);
      if (prev.length >= 2) return prev;
      return [...prev, key];
    });
  };

  const canConfirm = !locked && canChoose && picked.length >= 1 && picked.length <= 2;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900, color: COLORS.red }}>
        Elige tu(s) proyecto(s){" "}
        <Typography component="span" sx={{ ml: 1, fontSize: 14, color: "text.secondary" }}>
          ({picked.length}/2)
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {!canChoose ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Tu perfil aún no está <strong>activo</strong>. Cuando tu estatus cambie a <strong>“activo”</strong>, podrás elegir tus áreas.
          </Alert>
        ) : locked ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Tus áreas registradas: <strong>{picked.map(keyToLabel).join(" + ")}</strong>. Para cambios, contacta a un administrador.
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Selecciona <strong>1 o 2</strong> áreas (distintas).
          </Alert>
        )}

        <Grid container spacing={1}>
          {COORDS.map((c) => {
            const active = picked.includes(c.key);
            return (
              <Grid item xs={12} key={c.key}>
                <Paper
                  variant="outlined"
                  onClick={() => toggle(c.key)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    cursor: locked || !canChoose ? "not-allowed" : "pointer",
                    borderColor: active ? COLORS.red : COLORS.subtle,
                    boxShadow: active ? `0 0 0 3px ${COLORS.red}22 inset` : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all .15s ease",
                    "&:hover": { boxShadow: locked || !canChoose ? "none" : `0 6px 16px rgba(0,0,0,.06)` },
                  }}
                >
                  <Typography sx={{ fontWeight: 800 }}>{c.label}</Typography>
                  {active && (
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        bgcolor: COLORS.red,
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 14,
                        ml: 2,
                      }}
                    >
                      <FiCheck />
                    </Box>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="text" sx={{ textTransform: "none" }}>
          Cancelar
        </Button>
        <Button
          onClick={() => onConfirm(picked)}
          disabled={!canConfirm}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: 2,
            bgcolor: COLORS.red,
            "&:hover": { bgcolor: COLORS.redHover },
          }}
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ---------- Popup principal con carrusel (3 por página) + CTA fijo ---------- */
const ShowcaseDialog = ({
  open,
  onClose,
  locked,
  canChoose,
  initialSelected,
  onConfirm,
}) => {
  const trackRef = useRef(null);
  const [page, setPage] = useState(0);
  const cardWidth = 280;
  const gap = 16;
  const visible = 3;
  const pages = Math.max(1, Math.ceil(cardsData.length / visible));
  const viewportWidth = visible * cardWidth + (visible - 1) * gap;

  const scrollToPage = (p) => {
    const el = trackRef.current;
    if (!el) return;
    const offset = p * (visible * (cardWidth + gap));
    el.scrollTo({ left: offset, behavior: "smooth" });
    setPage(p);
  };

  const scrollByCards = (dir) => {
    const next = Math.min(Math.max(page + dir, 0), pages - 1);
    scrollToPage(next);
  };

  const [videoOpen, setVideoOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const openVideo = (item) => { setActiveCard(item); setVideoOpen(true); };
  const closeVideo = () => { setActiveCard(null); setVideoOpen(false); };

  const [selOpen, setSelOpen] = useState(false);

  useEffect(() => { if (!open) setPage(0); }, [open]);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: 900, color: COLORS.red }}>
          Explora las áreas
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            position: "relative",
            pb: 10,
            background:
              "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,248,255,1) 60%)",
          }}
        >
          {/* Carrusel centrado: SOLO 3 visibles */}
          <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mb: 2 }}>
            <Box sx={{ position: "relative", width: viewportWidth }}>
              <IconButton
                onClick={() => scrollByCards(-1)}
                aria-label="Anterior"
                sx={{
                  position: "absolute",
                  left: -48,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 2,
                  bgcolor: COLORS.white,
                  border: `1px solid ${COLORS.subtle}`,
                  boxShadow: "0 8px 16px rgba(0,0,0,.08)",
                  width: 40,
                  height: 40,
                  "&:hover": { bgcolor: COLORS.white },
                }}
              >
                <FiChevronLeft />
              </IconButton>

              <IconButton
                onClick={() => scrollByCards(1)}
                aria-label="Siguiente"
                sx={{
                  position: "absolute",
                  right: -48,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 2,
                  bgcolor: COLORS.white,
                  border: `1px solid ${COLORS.subtle}`,
                  boxShadow: "0 8px 16px rgba(0,0,0,.08)",
                  width: 40,
                  height: 40,
                  "&:hover": { bgcolor: COLORS.white },
                }}
              >
                <FiChevronRight />
              </IconButton>

              <Box
                ref={trackRef}
                sx={{
                  display: "flex",
                  gap: `${gap}px`,
                  overflow: "hidden",
                  scrollBehavior: "smooth",
                  width: viewportWidth,
                }}
              >
                {cardsData.map((item, idx) => (
                  <Box key={idx} sx={{ minWidth: cardWidth, maxWidth: cardWidth }}>
                    <CardItem item={item} onOpenVideo={openVideo} />
                  </Box>
                ))}
              </Box>

              {/* Dots */}
              <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 1 }}>
                {Array.from({ length: pages }).map((_, i) => (
                  <Box
                    key={i}
                    onClick={() => scrollToPage(i)}
                    sx={{
                      width: i === page ? 22 : 8,
                      height: 8,
                      borderRadius: 999,
                      bgcolor: i === page ? COLORS.red : COLORS.dot,
                      cursor: "pointer",
                      transition: "all .15s ease",
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Box>
        </DialogContent>

        {/* CTA fijo */}
        <DialogActions
          sx={{
            position: "sticky",
            bottom: 0,
            zIndex: 3,
            bgcolor: COLORS.white,
            borderTop: `1px solid ${COLORS.subtle}`,
            py: 1.5,
          }}
        >
          <Button onClick={onClose} variant="text" sx={{ textTransform: "none" }}>
            Cerrar
          </Button>

          <Tooltip
            title={canChoose ? "" : "Requiere estatus ACTIVO para elegir coordinación"}
            placement="top"
          >
            <span>
              <Button
                onClick={() => setSelOpen(true)}
                variant="contained"
                disabled={!canChoose}
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  borderRadius: 2,
                  px: 3,
                  bgcolor: COLORS.red,
                  "&:hover": { bgcolor: COLORS.redHover },
                }}
              >
                Elegir proyecto
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* Modal de video */}
      <VideoDialog
        open={videoOpen}
        onClose={closeVideo}
        videoId={activeCard?.videoId}
        title={activeCard?.title}
      />

      {/* Sub-modal de selección */}
      <SelectionDialog
        open={selOpen}
        onClose={() => setSelOpen(false)}
        locked={locked}
        canChoose={canChoose}
        initial={initialSelected}
        onConfirm={(picked) => {
          onConfirm(picked);
          setSelOpen(false);
        }}
      />
    </>
  );
};

export default function CoordinationsShowcase() {
  const [userChoices, setUserChoices] = useState([]);
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const current = auth.currentUser;
        if (!current) return;
        const token = await current.getIdToken(true);

        // 1) id del usuario
        const r1 = await fetch(`${BACKEND_URL}/public/validar-usuario`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const basic = await r1.json();
        const userId = basic?.id;
        if (!userId) return;

        // 2) perfil completo
        const r2 = await fetch(`${BACKEND_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const full = await r2.json();

        const estatus = String(full?.estatus || "").toLowerCase();
        setIsActive(estatus === "activo");

        const c1 = full?.coordinacion || full?.coordinacion1 || null;
        const c2 = full?.coordinacion2 || null;
        const pre = [c1, c2].filter(Boolean);

        if (pre.length) {
          setUserChoices(pre);
          setLocked(true);
        }
      } catch {
        // no-op
      }
    })();
  }, []);

  const handleConfirmChoices = async (selected) => {
    try {
      setSaving(true);
      const current = auth.currentUser;
      if (!current) throw new Error("No hay sesión");
      const token = await current.getIdToken(true);

      const r1 = await fetch(`${BACKEND_URL}/public/validar-usuario`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const basic = await r1.json();
      const userId = basic?.id;
      if (!userId) throw new Error("No se pudo identificar al usuario");

      const payload = {
        coordinacion: selected[0],
        coordinacion2: selected[1] || null, // ← si solo eligió 1, mandamos null
      };

      const resp = await fetch(`${BACKEND_URL}/users/${userId}/coordinaciones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const js = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(js?.error || "No se pudo guardar tu elección");

      setUserChoices(selected);
      setLocked(true);
      setOpen(false);
    } catch (e) {
      alert(e.message || "Error al guardar selección");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="section" sx={{ width: "100%", bgcolor: COLORS.bg }}>
      {/* 🔥 Hero Rojo (compacto) */}
      <Box
        sx={{
          width: "100%",
          bgcolor: COLORS.red,
          color: "white",
          textAlign: "center",
          py: { xs: 5, md: 6 },
          px: 2,
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: 900,
            mb: 0.5,
            textShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          Elige tu misión
        </Typography>
        <Typography
          variant="h6"
          sx={{
            opacity: 0.95,
            fontWeight: 400,
            maxWidth: 640,
            mx: "auto",
            mb: 2,
          }}
        >
          Programas que transforman vidas en tu comunidad
        </Typography>

        <Button
          onClick={() => setOpen(true)}
          variant="contained"
          sx={{
            bgcolor: COLORS.white,
            color: COLORS.red,
            fontWeight: 900,
            px: 3,
            py: 1,
            borderRadius: 3,
            textTransform: "none",
            "&:hover": { bgcolor: COLORS.subtle },
          }}
        >
          Continúa con tu formación
        </Button>
      </Box>

      {/* Estado actual y aviso de estatus */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {!isActive && (
          <Box sx={{ maxWidth: 700, mx: "auto", mb: 2 }}>
            <Alert severity="warning" sx={{ border: `1px solid ${COLORS.subtle}` }}>
              Tu perfil todavía no está <strong>activo</strong>. Podrás elegir tus coordinaciones cuando tu estatus sea <strong>“activo”</strong>.
            </Alert>
          </Box>
        )}
        {locked && (
          <Box sx={{ maxWidth: 560, mx: "auto" }}>
            <Alert severity="success" sx={{ border: `1px solid ${COLORS.subtle}` }}>
              Tus áreas registradas: <strong>{userChoices.map(keyToLabel).join(" + ")}</strong>. Para cambios, contacta a un administrador.
            </Alert>
          </Box>
        )}
      </Container>

      {/* Popup principal */}
      <ShowcaseDialog
        open={open}
        onClose={() => setOpen(false)}
        locked={locked || saving}
        canChoose={isActive && !locked && !saving}
        initialSelected={userChoices}
        onConfirm={handleConfirmChoices}
      />
    </Box>
  );
}
