import React, { useMemo, useState, memo, useCallback, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Button,
  MenuItem,
  Divider,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  FaPlus,
  FaUpload,
  FaFileAlt,
  FaTag,
  FaCalendarAlt,
  FaHashtag,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
} from "react-icons/fa";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../firebase"; // ✅ igual que FormDocumentos

const API_BASE = "https://vol-backend.onrender.com";

const colorRojo = "#ff3333";
const bgSoft = "#fff8ff";
const CONTROL_H = 44;

// Categorías ordenadas por “peso/importancia”
const CATEGORIAS = [
  "Comprobante posgrado",
  "Cédula profesional",
  "Comprobante licenciatura",
  "Carrera técnica",

  "Credencial Cruz Roja Mexicana",
  "Seguro de Accidentes",
  "Seguro de vida",

  "TUM Cruz Roja Mexicana",
  "TUM externo",
  "Certificado/Certificación",
  "Diplomado",
  "Otro",
];

// ✅ Años reales solamente (no fecha)
function buildYears() {
  const current = new Date().getFullYear();
  const max = current + 1; // por si suben algo del año entrante
  const min = 1900;
  const years = [];
  for (let y = max; y >= min; y--) years.push(y);
  return years;
}
const YEARS = buildYears();

function statusMeta(status) {
  const s = (status || "pending").toLowerCase();

  if (s === "validated") {
    return {
      label: "Validado",
      icon: <FaCheckCircle />,
      border: "rgba(60, 179, 113, 0.55)",
      bg: "rgba(60, 179, 113, 0.12)",
      color: "#1f6b3f",
    };
  }

  if (s === "rejected") {
    return {
      label: "Rechazado",
      icon: <FaTimesCircle />,
      border: "rgba(220, 20, 60, 0.55)",
      bg: "rgba(220, 20, 60, 0.10)",
      color: "#8b1230",
    };
  }

  // Pendiente amarillo
  return {
    label: "Pendiente",
    icon: <FaClock />,
    border: "rgba(245, 158, 11, 0.70)",
    bg: "rgba(245, 158, 11, 0.18)",
    color: "#8a5a00",
  };
}

/**
 * Timeline memoizada (no delete)
 */
const TimelineView = memo(function TimelineView({ items }) {
  const grouped = useMemo(() => {
    const map = new Map();
    (items || []).forEach((it) => {
      const y = Number(it.year) || 0;
      if (!map.has(y)) map.set(y, []);
      map.get(y).push(it);
    });

    for (const y of map.keys()) {
      map.get(y).sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    const years = Array.from(map.keys()).sort((a, b) => b - a);
    return years.map((y) => ({ year: y, entries: map.get(y) }));
  }, [items]);

  const TimelineEntryCard = ({ entry, align = "left" }) => {
    const isLeft = align === "left";
    const st = statusMeta(entry.status);

    const hasFile = Boolean(entry.file_name);
    const canOpen = Boolean(entry.file_url);

    const handleOpenFile = () => {
      if (!entry.file_url) return;
      window.open(entry.file_url, "_blank", "noopener,noreferrer");
    };

    return (
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: { xs: "center", md: isLeft ? "flex-start" : "flex-end" },
          position: "relative",
          mb: { xs: 1.8, md: 2.2 },
          zIndex: 2,
        }}
      >
        {/* Punto */}
        <Box
          sx={{
            position: "absolute",
            left: { xs: "50%", md: "50%" },
            top: 24,
            transform: "translateX(-50%)",
            zIndex: 3,
            width: 16,
            height: 16,
            borderRadius: "50%",
            backgroundColor: colorRojo,
            border: `3px solid ${colorRojo}`,
            boxShadow: "0 0 10px rgba(255,51,51,0.35)",
          }}
        />

        <Paper
          elevation={0}
          sx={{
            width: { xs: "96%", sm: "88%", md: "45%" },
            p: { xs: 1.7, sm: 2.1 },
            borderRadius: 3,
            backgroundColor: "#fff",
            boxShadow: "0 4px 12px rgba(255,51,51,0.12)",
            ml: { xs: 0, md: isLeft ? 0 : 6 },
            mr: { xs: 0, md: isLeft ? 6 : 0 },
            textAlign: { xs: "left", md: isLeft ? "right" : "left" },
            position: "relative",
            zIndex: 2,
            overflow: "hidden",
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 800,
              textTransform: "uppercase",
              color: colorRojo,
              fontSize: "0.8rem",
              letterSpacing: 1,
              mb: 0.6,
              wordBreak: "break-word",
            }}
          >
            {entry.category}
          </Typography>

          <Typography
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 900,
              color: "#111",
              fontSize: "1.02rem",
              mb: 0.9,
              lineHeight: 1.2,
              wordBreak: "break-word",
            }}
          >
            {entry.title}
          </Typography>

          {/* Chips de Folio/Archivo */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              justifyContent: { xs: "flex-start", md: isLeft ? "flex-end" : "flex-start" },
              alignItems: "center",
              mt: 0.2,
            }}
          >
            {entry.folio ? (
              <Chip
                icon={<FaHashtag />}
                label={`Folio: ${entry.folio}`}
                size="small"
                sx={{
                  border: `1px solid ${colorRojo}55`,
                  color: "#111",
                  backgroundColor: "#fff",
                  "& .MuiChip-icon": { color: colorRojo },
                  maxWidth: "100%",
                }}
              />
            ) : null}

            {hasFile ? (
              <Chip
                icon={<FaFileAlt />}
                label={entry.file_name}
                size="small"
                onClick={canOpen ? handleOpenFile : undefined}
                sx={{
                  border: `1px solid ${colorRojo}55`,
                  color: "#111",
                  backgroundColor: "#fff",
                  maxWidth: "100%",
                  cursor: canOpen ? "pointer" : "default",
                  "& .MuiChip-label": {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: { xs: 180, sm: 260, md: 240 },
                  },
                  "& .MuiChip-icon": { color: colorRojo },
                  ...(canOpen ? { "&:hover": { backgroundColor: `${colorRojo}10` } } : {}),
                }}
              />
            ) : (
              <Chip
                label="Sin archivo"
                size="small"
                sx={{
                  border: `1px dashed ${colorRojo}55`,
                  color: "#666",
                  backgroundColor: "#fff",
                  maxWidth: "100%",
                }}
              />
            )}
          </Box>

          {/* Estatus */}
          <Box
            sx={{
              mt: 1.1,
              display: "flex",
              justifyContent: { xs: "flex-start", md: isLeft ? "flex-end" : "flex-start" },
            }}
          >
            <Chip
              icon={st.icon}
              label={st.label}
              size="small"
              sx={{
                border: `1px solid ${st.border}`,
                backgroundColor: st.bg,
                color: st.color,
                fontWeight: 800,
                "& .MuiChip-icon": { color: st.color },
              }}
            />
          </Box>
        </Paper>
      </Box>
    );
  };

  if (!items?.length) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor: "#fff",
          boxShadow: "0 4px 12px rgba(255,51,51,0.12)",
        }}
      >
        <Typography sx={{ fontFamily: "'Outfit', sans-serif", color: "#444" }}>
          Aún no hay elementos en tu trayectoria. Agrega el primero arriba.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ position: "relative", pt: 1 }}>
      {/* Línea vertical central (atrás) */}
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: "3px",
          background: `linear-gradient(to bottom, #ff9999, ${colorRojo})`,
          transform: "translateX(-50%)",
          borderRadius: 3,
          opacity: 0.9,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <Box sx={{ position: "relative", zIndex: 2 }}>
        {grouped.map((group, gIdx) => (
          <Box key={`year-${group.year}`} sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
              <Chip
                label={String(group.year)}
                sx={{
                  backgroundColor: colorRojo,
                  color: "#fff",
                  fontWeight: 900,
                  fontFamily: "'Montserrat', sans-serif",
                  letterSpacing: 1,
                  px: 1.2,
                  boxShadow: "0 6px 14px rgba(255,51,51,0.22)",
                }}
              />
            </Box>

            {group.entries.map((entry, iIdx) => {
              const globalIndex = gIdx * 1000 + iIdx;
              const isLeft = globalIndex % 2 === 0;
              return (
                <TimelineEntryCard
                  key={String(entry.trajectory_id)}
                  entry={entry}
                  align={isLeft ? "left" : "right"}
                />
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
});

/**
 * Form UNCONTROLLED: móvil bonito + no se rompe
 */
const AddTrayectoriaForm = memo(function AddTrayectoriaForm({ onAdd, loading }) {
  const yearRef = useRef(null);
  const categoryRef = useRef(null);
  const titleRef = useRef(null);
  const folioRef = useRef(null);

  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      height: CONTROL_H,
      "& fieldset": { borderColor: colorRojo },
      "&:hover fieldset": { borderColor: colorRojo },
      "&.Mui-focused fieldset": { borderColor: colorRojo },
    },
    "& .MuiInputBase-input": { fontSize: "0.93rem", py: 0 },
    "& .MuiInputLabel-root": { fontSize: "0.93rem" },
  };

  const resetForm = () => {
    setError(null);
    setFile(null);
    const y = String(new Date().getFullYear());
    if (yearRef.current) yearRef.current.value = y;
    if (categoryRef.current) categoryRef.current.value = CATEGORIAS[0];
    if (titleRef.current) titleRef.current.value = "";
    if (folioRef.current) folioRef.current.value = "";
  };

  const handlePickFile = (e) => setFile(e.target.files?.[0] || null);

  const handleAdd = () => {
    setError(null);

    const yearStr = yearRef.current?.value ?? "";
    const category = categoryRef.current?.value ?? "";
    const title = (titleRef.current?.value ?? "").trim();
    const folio = (folioRef.current?.value ?? "").trim();
    const yearNum = Number(yearStr);

    // ✅ yearNum viene de select, pero igual validamos por sanidad mental
    if (!yearNum || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      return setError("Pon un año válido (ej. 2024).");
    }
    if (!category) return setError("Selecciona una categoría.");
    if (!title) return setError("Te falta el título.");

    onAdd({ year: yearNum, category, title, folio, file });
    resetForm();
  };

  return (
    <Paper
      elevation={8}
      sx={{
        p: { xs: 1.8, sm: 2.2 },
        maxWidth: 1100,
        mx: "auto",
        borderRadius: 3,
        backgroundColor: "#ffffff",
        boxShadow: `0 0 15px 3px ${colorRojo}55`,
        mb: { xs: 3, md: 4 },
      }}
    >
      <Typography
        variant="subtitle1"
        fontWeight={900}
        color="#000"
        mb={1.6}
        textAlign="center"
        sx={{
          textTransform: "uppercase",
          borderBottom: `2px solid ${colorRojo}`,
          pb: 0.5,
          letterSpacing: 1,
          fontSize: { xs: "0.95rem", sm: "1rem" },
        }}
      >
        Añadir a la trayectoria
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 1.6 }}>
          {error}
        </Alert>
      ) : null}

      <Grid container spacing={1.2} alignItems="stretch">
        {/* Año (select) */}
        <Grid item xs={12} sm={4} md={2.2}>
          <TextField
            select
            label="Año"
            defaultValue={new Date().getFullYear()}
            fullWidth
            inputRef={yearRef}
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1, display: "flex", alignItems: "center", color: colorRojo }}>
                  <FaCalendarAlt />
                </Box>
              ),
            }}
            sx={inputSx}
          >
            {YEARS.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Categoría */}
        <Grid item xs={12} sm={8} md={4.0}>
          <TextField
            select
            label="Categoría"
            defaultValue={CATEGORIAS[0]}
            fullWidth
            inputRef={categoryRef}
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1, display: "flex", alignItems: "center", color: colorRojo }}>
                  <FaTag />
                </Box>
              ),
            }}
            sx={inputSx}
          >
            {CATEGORIAS.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Título */}
        <Grid item xs={12} md={3.8}>
          <TextField label="Título" defaultValue="" fullWidth inputRef={titleRef} sx={inputSx} />
        </Grid>

        {/* Folio */}
        <Grid item xs={12} sm={6} md={2.0}>
          <TextField label="Folio" defaultValue="" fullWidth inputRef={folioRef} sx={inputSx} />
        </Grid>

        {/* Upload */}
        <Grid item xs={12} sm={6} md={3.0}>
          <Button
            variant="contained"
            component="label"
            fullWidth
            disabled={loading}
            sx={{
              height: CONTROL_H,
              color: "#fff",
              backgroundColor: colorRojo,
              textTransform: "none",
              fontWeight: 900,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              "&:hover": { backgroundColor: "#cc2929" },
              svg: { color: "#fff" },
              opacity: loading ? 0.85 : 1,
            }}
          >
            <FaUpload />
            Subir archivo
            <input type="file" hidden accept="image/*,.pdf,.doc,.docx" onChange={handlePickFile} />
          </Button>

          <Typography
            variant="caption"
            sx={{
              color: file ? colorRojo : "#777",
              mt: 0.5,
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={file ? file.name : ""}
          >
            {file ? file.name : "Aún no has seleccionado archivo."}
          </Typography>
        </Grid>

        {/* Botones: en móvil van en fila (6/6) */}
        <Grid item xs={6} md={0.75} sx={{ display: "flex" }}>
          <Tooltip title="Limpiar" arrow>
            <IconButton
              aria-label="Limpiar"
              onClick={resetForm}
              disabled={loading}
              sx={{
                width: "100%",
                borderRadius: 2,
                height: CONTROL_H,
                border: `2px solid ${colorRojo}66`,
                color: colorRojo,
                "&:hover": { backgroundColor: `${colorRojo}10`, borderColor: colorRojo },
              }}
            >
              <FaTrash size={16} />
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={6} md={0.75} sx={{ display: "flex" }}>
          <Tooltip title="Agregar" arrow>
            <IconButton
              aria-label="Agregar"
              onClick={handleAdd}
              disabled={loading}
              sx={{
                width: "100%",
                borderRadius: 2,
                height: CONTROL_H,
                backgroundColor: colorRojo,
                color: "#fff",
                "&:hover": { backgroundColor: "#cc2929" },
                opacity: loading ? 0.85 : 1,
              }}
            >
              {loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <FaPlus size={16} />}
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
    </Paper>
  );
});

async function uploadFileToFirebase(userUid, file) {
  if (!file) return { file_url: null, storage_path: null };

  // Mismo patrón que FormDocumentos
  const safeName = String(file.name || "archivo").replace(/[^\w.\-() ]+/g, "_");
  const storage_path = `trayectoria/${userUid}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, storage_path);

  await uploadBytes(storageRef, file);
  const file_url = await getDownloadURL(storageRef);

  return { file_url, storage_path };
}

export default function Trayectoria() {
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadMine = useCallback(async () => {
    setError(null);
    setLoadingList(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setItems([]);
        setError("Usuario no autenticado. Inicia sesión e intenta de nuevo.");
        return;
      }

      const token = await user.getIdToken();

      const res = await fetch(`${API_BASE}/trayectoria/mios`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("No se pudo cargar tu trayectoria.");

      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError(
        "No se pudo cargar tu trayectoria. Intenta de nuevo más tarde. Si persiste, contacta a plataformacrmsn@gmail.com."
      );
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  const handleAdd = useCallback(
    async ({ year, category, title, folio, file }) => {
      setError(null);
      setSuccess(null);
      setAdding(true);

      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Usuario no autenticado. Inicia sesión e intenta de nuevo.");
          return;
        }

        const token = await user.getIdToken();
        const userUid = user.uid;

        // 1) Upload directo a Firebase Storage
        const { file_url, storage_path } = await uploadFileToFirebase(userUid, file);

        // 2) Guardar todo en backend (MySQL)
        const payload = {
          year,
          category,
          title,
          folio: folio || null,

          file_url: file_url || null,
          storage_path: storage_path || null,
          file_name: file?.name || null,
          file_type: file?.type || null,
          file_size_bytes: file?.size || null,
        };

        const res = await fetch(`${API_BASE}/trayectoria`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          console.error("POST /trayectoria error:", t);
          throw new Error("Error al guardar el registro de trayectoria.");
        }

        setSuccess("Se agregó a tu trayectoria.");
        await loadMine();
      } catch (e) {
        console.error(e);
        setError(
          e?.message ||
            "No se pudo guardar. Intenta de nuevo más tarde. Si persiste, contacta a plataformacrmsn@gmail.com."
        );
      } finally {
        setAdding(false);
      }
    },
    [loadMine]
  );

  return (
    <Box
      sx={{
        backgroundColor: bgSoft,
        px: { xs: 1.5, sm: 2.5, md: 6 },
        py: { xs: 3.5, sm: 4.5, md: 6 },
      }}
    >
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            textTransform: "uppercase",
            fontSize: { xs: "1.45rem", sm: "1.8rem", md: "2.2rem" },
            display: "inline-block",
            pb: 0.6,
            borderBottom: `4px solid ${colorRojo}`,
            letterSpacing: 1.2,
          }}
        >
          Trayectoria
        </Typography>

        <Typography
          sx={{
            fontFamily: "'Outfit', sans-serif",
            color: "#444",
            mt: 1.0,
            fontSize: { xs: "0.92rem", sm: "0.98rem", md: "1rem" },
            px: { xs: 0.5, sm: 0 },
          }}
        >
          Agrega tu formación, certificaciones y comprobantes para construir tu línea temporal.
        </Typography>
      </Box>

      {error ? (
        <Box sx={{ maxWidth: 1100, mx: "auto", mb: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : null}

      {success ? (
        <Box sx={{ maxWidth: 1100, mx: "auto", mb: 2 }}>
          <Alert severity="success">{success}</Alert>
        </Box>
      ) : null}

      <AddTrayectoriaForm onAdd={handleAdd} loading={adding} />

      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <Divider sx={{ mb: 3, opacity: 0.6 }} />

        {loadingList ? (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: "#fff",
              boxShadow: "0 4px 12px rgba(255,51,51,0.12)",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
            }}
          >
            <CircularProgress size={22} />
            <Typography sx={{ fontFamily: "'Outfit', sans-serif", color: "#444" }}>
              Cargando tu trayectoria…
            </Typography>
          </Paper>
        ) : (
          <TimelineView items={items} />
        )}
      </Box>
    </Box>
  );
}
