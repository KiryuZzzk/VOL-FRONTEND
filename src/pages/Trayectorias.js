import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSearch,
  FaFileAlt,
  FaFilter,
  FaSyncAlt,
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaHashtag,
} from "react-icons/fa";

import { auth } from "../firebase";

const API_BASE = "https://vol-backend.onrender.com";

function safeStr(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function normalizeKey(v) {
  return safeStr(v)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// 🔐 fetch con Firebase token (+ uid header cuando el backend lo pide)
async function authedFetch(url, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado. Inicia sesión e intenta de nuevo.");

  const token = await user.getIdToken();
  const uid = user.uid;

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    "x-firebase-uid": uid,
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  // algunos endpoints regresan vacío; intenta json si se puede
  try {
    return await res.json();
  } catch {
    return null;
  }
}


const colorRojo = "#ff3333";
const bgSoft = "#fff8ff";
const CONTROL_H = 44;

const CATEGORIAS = [
  "",
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

function buildYears() {
  const current = new Date().getFullYear();
  const max = current + 1;
  const min = 1900;
  const years = [""];
  for (let y = max; y >= min; y--) years.push(y);
  return years;
}
const YEARS = buildYears();

function statusMeta(status) {
  const s = (status || "pending").toLowerCase();

  if (s === "validated") {
    return {
      key: "validated",
      label: "Validado",
      icon: <FaCheckCircle />,
      border: "rgba(60, 179, 113, 0.55)",
      bg: "rgba(60, 179, 113, 0.12)",
      color: "#1f6b3f",
    };
  }

  if (s === "rejected") {
    return {
      key: "rejected",
      label: "Rechazado",
      icon: <FaTimesCircle />,
      border: "rgba(220, 20, 60, 0.55)",
      bg: "rgba(220, 20, 60, 0.10)",
      color: "#8b1230",
    };
  }

  return {
    key: "pending",
    label: "Pendiente",
    icon: <FaClock />,
    border: "rgba(245, 158, 11, 0.70)",
    bg: "rgba(245, 158, 11, 0.18)",
    color: "#8a5a00",
  };
}

function safeOpen(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function filtersEqual(a, b) {
  return (
    (a?.status || "") === (b?.status || "") &&
    (a?.category || "") === (b?.category || "") &&
    String(a?.year || "") === String(b?.year || "") &&
    (a?.searchField || "") === (b?.searchField || "") &&
    (a?.search || "") === (b?.search || "")
  );
}

export default function Trayectorias() {
  // =========================
  // 1) FILTROS: draft vs applied
  // =========================
  const initialFilters = useMemo(
    () => ({
      status: "pending",
      category: "",
      year: "",
      searchField: "nombre",
      search: "",
    }),
    []
  );

  const [draft, setDraft] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);


// =========================
// 1.1) FILTRO POR PROGRAMA (reutiliza catálogo de /progreso)
// =========================
const [programFilterList, setProgramFilterList] = useState([]); // [{program_id, code, name}]
const [programFilterCode, setProgramFilterCode] = useState(""); // "" = todos
const [programRoster, setProgramRoster] = useState(null); // { program, count }
const [programRosterLoading, setProgramRosterLoading] = useState(false);
const [programRosterError, setProgramRosterError] = useState("");
const [programUserKeys, setProgramUserKeys] = useState(() => new Set()); // matricula|correo|uid normalizados

  // =========================
  // 2) DATA + ESTADO UI
  // =========================
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // =========================
  // 3) MODAL aprobar/rechazar
  // =========================
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("validated");
  const [reviewNotes, setReviewNotes] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  // =========================
  // 4) Paginación (esto salva navegadores)
  // =========================
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // =========================
  // 5) AbortController (evita requests zombis)
  // =========================
  const abortRef = useRef(null);

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      height: CONTROL_H,
      "& fieldset": { borderColor: colorRojo },
      "&:hover fieldset": { borderColor: colorRojo },
      "&.Mui-focused fieldset": { borderColor: colorRojo },
    },
    "& .MuiInputBase-input": { fontSize: "0.95rem", py: 0.25 },
    "& .MuiInputLabel-root": { fontSize: "0.92rem", fontWeight: 800 },
  };

  

const fetchProgramFilterList = useCallback(async () => {
  try {
    const data = await authedFetch(`${API_BASE}/progreso/admin/programas`, { method: "GET" });
    setProgramFilterList(Array.isArray(data?.programs) ? data.programs : []);
  } catch (e) {
    // No crítico; solo deshabilita filtro por programa si falla
    setProgramFilterList([]);
  }
}, []);

const fetchProgramRoster = useCallback(
  async (programCode) => {
    const code = safeStr(programCode).trim().toUpperCase();
    if (!code) {
      setProgramRoster(null);
      setProgramRosterError("");
      setProgramUserKeys(new Set());
      return;
    }

    setProgramRosterLoading(true);
    setProgramRosterError("");
    try {
      const data = await authedFetch(
        `${API_BASE}/progreso/admin/programas/${encodeURIComponent(code)}/users`,
        { method: "GET" }
      );

      const list = Array.isArray(data?.users) ? data.users : [];

      const keys = new Set();
      for (const r of list) {
        const mat = normalizeKey(r?.matricula);
        const correo = normalizeKey(r?.correo);
        const uid = normalizeKey(r?.uid);
        if (mat) keys.add(mat);
        if (correo) keys.add(correo);
        if (uid) keys.add(uid);
      }

      setProgramUserKeys(keys);
      setProgramRoster({
        program: data?.program || { code, name: code },
        count: list.length,
      });
    } catch (e) {
      setProgramRosterError(e?.message || "No se pudo cargar el roster del programa.");
      setProgramRoster(null);
      setProgramUserKeys(new Set());
    } finally {
      setProgramRosterLoading(false);
    }
  },
  []
);

const buildQuery = useCallback((filters) => {
    const qs = new URLSearchParams();

    if (filters.status) qs.set("status", filters.status);
    if (filters.category) qs.set("category", filters.category);
    if (filters.year) qs.set("year", String(filters.year));

    if (filters.search && filters.searchField) {
      qs.set("searchField", filters.searchField);
      qs.set("search", filters.search);
    }

    return qs.toString();
  }, []);

  const fetchList = useCallback(async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Cancela request anterior si existe
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const user = auth.currentUser;
      if (!user) {
        setRows([]);
        setError("Usuario no autenticado. Inicia sesión e intenta de nuevo.");
        return;
      }

      const token = await user.getIdToken();
      const query = buildQuery(applied);
      const url = `${API_BASE}/trayectoria${query ? `?${query}` : ""}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (!res.ok) {
        let payload = null;
        try {
          payload = await res.json();
        } catch {}
        throw new Error(payload?.error || "No se pudo cargar la lista de trayectorias.");
      }

      const data = await res.json();
      const nextRows = Array.isArray(data) ? data : [];
      setRows(nextRows);

      // reset de paginación para no caer en “página vacía”
      setPage(1);
    } catch (e) {
      if (e?.name === "AbortError") return;
      console.error(e);
      setError(
        e?.message ||
          "No se pudo cargar la lista. Intenta de nuevo más tarde. Si persiste, contacta a plataformacrmsn@gmail.com."
      );
    } finally {
      setLoading(false);
    }
  }, [applied, buildQuery]);

  useEffect(() => {
    fetchList();
    fetchProgramFilterList();
    return () => {
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
      }
    };
  }, [fetchList, fetchProgramFilterList]);

// Cuando cambie el filtro por programa, trae roster (para filtrar en frontend sin tocar backend /trayectoria)
useEffect(() => {
  fetchProgramRoster(programFilterCode);
  // reset de paginación para no caer en página vacía
  setPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [programFilterCode]);


  

const rowsAfterProgramFilter = useMemo(() => {
  if (!programFilterCode) return rows;
  if (!programUserKeys || programUserKeys.size === 0) return [];
  return rows.filter((r) => {
    const mat = normalizeKey(r?.matricula);
    const correo = normalizeKey(r?.correo);
    const uid = normalizeKey(r?.uid);
    // algunos endpoints de trayectoria podrían usar user_id; lo ignoramos porque roster no lo trae
    return (mat && programUserKeys.has(mat)) || (correo && programUserKeys.has(correo)) || (uid && programUserKeys.has(uid));
  });
}, [rows, programFilterCode, programUserKeys]);

// Stats en UNA pasada (más barato que 3 filters)
  const stats = useMemo(() => {
    const acc = { total: 0, pending: 0, validated: 0, rejected: 0 };
    acc.total = rowsAfterProgramFilter.length;

    for (const r of rowsAfterProgramFilter) {
      const st = String(r?.status || "pending").toLowerCase();
      if (st === "pending") acc.pending++;
      else if (st === "validated") acc.validated++;
      else if (st === "rejected") acc.rejected++;
    }
    return acc;
  }, [rows]);

  const totalPages = useMemo(() => {
    const denom = Math.max(1, Number(pageSize) || 25);
    return Math.max(1, Math.ceil(rowsAfterProgramFilter.length / denom));
  }, [rowsAfterProgramFilter.length, pageSize]);

  const pagedRows = useMemo(() => {
    const size = Math.max(1, Number(pageSize) || 25);
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * size;
    return rowsAfterProgramFilter.slice(start, start + size);
  }, [rowsAfterProgramFilter, page, pageSize, totalPages]);

  const openReview = (row, nextStatus) => {
    setReviewTarget(row);
    setReviewStatus(nextStatus);
    setReviewNotes(row?.review_notes || "");
    setReviewOpen(true);
  };

  const closeReview = () => {
    setReviewOpen(false);
    setReviewTarget(null);
    setReviewNotes("");
    setSavingReview(false);
  };

  const saveReview = useCallback(async () => {
    if (!reviewTarget?.trajectory_id) return;

    setSavingReview(true);
    setError(null);
    setSuccess(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Usuario no autenticado. Inicia sesión e intenta de nuevo.");
        return;
      }
      const token = await user.getIdToken();

      const trajectoryId = reviewTarget.trajectory_id;

      const res = await fetch(`${API_BASE}/trayectoria/${trajectoryId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: reviewStatus,
          review_notes: reviewNotes?.trim() || null,
        }),
      });

      if (!res.ok) {
        let payload = null;
        try {
          payload = await res.json();
        } catch {}
        throw new Error(payload?.error || "No se pudo actualizar el estatus.");
      }

      setSuccess(
        reviewStatus === "validated"
          ? "Trayectoria validada ✅"
          : reviewStatus === "rejected"
          ? "Trayectoria rechazada ❌"
          : "Estatus actualizado."
      );

      closeReview();
      await fetchList();
    } catch (e) {
      console.error(e);
      setError(e?.message || "No se pudo actualizar. Intenta de nuevo.");
      setSavingReview(false);
    }
  }, [reviewTarget, reviewStatus, reviewNotes, fetchList]);

  const hasUnapplied = useMemo(() => !filtersEqual(draft, applied), [draft, applied]);

  return (
    <Box
      sx={{
        backgroundColor: bgSoft,
        px: { xs: 1.5, sm: 2.5, md: 6 },
        py: { xs: 3.5, sm: 4.5, md: 6 },
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            textTransform: "uppercase",
            fontSize: { xs: "1.35rem", sm: "1.8rem", md: "2.1rem" },
            display: "inline-block",
            pb: 0.6,
            borderBottom: `4px solid ${colorRojo}`,
            letterSpacing: 1.2,
          }}
        >
          Revisión de Trayectorias
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
          Aquí podrás revisar, aprobar o rechazar los elementos de las trayectorias de los participantes.
        </Typography>
      </Box>

      {/* Mensajes */}
      {error ? (
        <Box sx={{ maxWidth: 1200, mx: "auto", mb: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : null}

      {success ? (
        <Box sx={{ maxWidth: 1200, mx: "auto", mb: 2 }}>
          <Alert severity="success">{success}</Alert>
        </Box>
      ) : null}

      {/* Filtros */}
      <Paper
        elevation={8}
        sx={{
          p: { xs: 1.8, sm: 2.2 },
          maxWidth: 1200,
          mx: "auto",
          borderRadius: 3,
          backgroundColor: "#ffffff",
          boxShadow: `0 0 15px 3px ${colorRojo}55`,
          mb: { xs: 3, md: 4 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaFilter color={colorRojo} />
            <Typography sx={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, color: "#111" }}>
              Filtros
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Actualizar" arrow>
              <span>
                <IconButton
                  onClick={fetchList}
                  disabled={loading}
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${colorRojo}55`,
                    color: colorRojo,
                    "&:hover": { backgroundColor: `${colorRojo}10` },
                  }}
                  size="small"
                >
                  <FaSyncAlt size={14} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={1.8} alignItems="stretch">
          {/* Status */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              label="Estatus"
              size="small"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
              fullWidth
              sx={inputSx}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value="validated">Validado</MenuItem>
              <MenuItem value="rejected">Rechazado</MenuItem>
            </TextField>
          </Grid>

          {/* Categoria */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Categoría"
              size="small"
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              fullWidth
              sx={inputSx}
            >
              {CATEGORIAS.map((c) => (
                <MenuItem key={c || "__all"} value={c}>
                  {c ? c : "Todas"}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

{/* Programa */}
<Grid item xs={12} sm={12} md={4}>
  <TextField
    select
    label="Programa"
    size="small"
    value={programFilterCode}
    onChange={(e) => setProgramFilterCode(e.target.value)}
    fullWidth
    sx={{ ...inputSx, minWidth: { md: 420 } }}
  >
    <MenuItem value="">Todos</MenuItem>
    {programFilterList.map((p) => (
      <MenuItem key={p.code} value={p.code}>
        {p.name} ({p.code})
      </MenuItem>
    ))}
  </TextField>

  {programRosterLoading ? (
    <Typography sx={{ mt: 0.6, fontSize: "0.78rem", color: "#777" }}>
      Cargando roster…
    </Typography>
  ) : programFilterCode && programRoster ? (
    <Typography sx={{ mt: 0.6, fontSize: "0.78rem", color: "#777" }}>
      {safeStr(programRoster?.program?.name)} • {safeStr(programRoster?.count)} alumnos
    </Typography>
  ) : null}

  {programRosterError ? (
    <Typography sx={{ mt: 0.6, fontSize: "0.78rem", color: "#b00020" }}>
      {programRosterError}
    </Typography>
  ) : null}
</Grid>

          {/* Año */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              label="Año"
              size="small"
              value={draft.year}
              onChange={(e) => setDraft((d) => ({ ...d, year: e.target.value }))}
              fullWidth
              sx={{ ...inputSx, minWidth: { md: 220 } }}
            >
              {YEARS.map((y) => (
                <MenuItem key={String(y || "__all")} value={y}>
                  {y ? y : "Todos"}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* SearchField */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              label="Buscar por"
              size="small"
              value={draft.searchField}
              onChange={(e) => setDraft((d) => ({ ...d, searchField: e.target.value }))}
              fullWidth
              sx={{ ...inputSx, minWidth: { md: 380 } }}
            >
              <MenuItem value="nombre">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FaUser /> Nombre
                </Box>
              </MenuItem>
              <MenuItem value="correo">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FaEnvelope /> Correo
                </Box>
              </MenuItem>
              <MenuItem value="curp">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FaIdCard /> CURP
                </Box>
              </MenuItem>
              <MenuItem value="title">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FaHashtag /> Título
                </Box>
              </MenuItem>
            </TextField>
          </Grid>

          {/* Search */}
          <Grid item xs={12} md={4}>
            <TextField
              label="Búsqueda"
              value={draft.search}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
              fullWidth
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: "flex", alignItems: "center", color: colorRojo }}>
                    <FaSearch />
                  </Box>
                ),
              }}
            />
          </Grid>

          {/* Botones */}
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              onClick={() => setApplied(draft)}
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
                opacity: loading ? 0.85 : 1,
              }}
              fullWidth
            >
              {loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <FaFilter />}
              Aplicar filtros
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              onClick={() => setDraft(initialFilters)}
              disabled={loading}
              sx={{
                height: CONTROL_H,
                borderColor: `${colorRojo}88`,
                color: colorRojo,
                textTransform: "none",
                fontWeight: 900,
                "&:hover": { borderColor: colorRojo, backgroundColor: `${colorRojo}10` },
              }}
              fullWidth
            >
              Limpiar filtros
            </Button>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2, opacity: 0.6 }} />

        {/* Stats rápidas */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
          <Chip label={`Total: ${stats.total}`} sx={{ fontWeight: 900 }} />
          <Chip label={`Pendientes: ${stats.pending}`} sx={{ fontWeight: 900 }} />
          <Chip label={`Validados: ${stats.validated}`} sx={{ fontWeight: 900 }} />
          <Chip label={`Rechazados: ${stats.rejected}`} sx={{ fontWeight: 900 }} />
        </Box>

        {/* Indicador: filtros aplicados vs editados */}
        <Box sx={{ mt: 1.5, display: "flex", justifyContent: "center" }}>
          <Chip
            label={hasUnapplied ? "Tienes filtros sin aplicar" : "Filtros aplicados ✅"}
            sx={{
              fontWeight: 900,
              border: `1px solid ${colorRojo}55`,
              backgroundColor: "#fff",
            }}
          />
        </Box>

        {/* Controles de paginación */}
        <Box
          sx={{
            mt: 2,
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <Typography sx={{ fontFamily: "'Outfit', sans-serif", color: "#555" }}>
            Mostrando{" "}
            <b>
              {rowsAfterProgramFilter.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, rowsAfterProgramFilter.length)}
            </b>{" "}
            de <b>{rowsAfterProgramFilter.length}</b>
          </Typography>

          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Por página</InputLabel>
              <Select
                label="Por página"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) || 25);
                  setPage(1);
                }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>

            <Pagination
              count={totalPages}
              page={Math.min(page, totalPages)}
              onChange={(_, p) => setPage(p)}
              size="small"
              shape="rounded"
            />
          </Box>
        </Box>
      </Paper>

      {/* Lista */}
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {loading ? (
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
              Cargando trayectorias…
            </Typography>
          </Paper>
        ) : !rowsAfterProgramFilter.length ? (
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
              No hay resultados con esos filtros.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.4 }}>
            {pagedRows.map((row) => {
              const st = statusMeta(row.status);
              const fullName = [row.nombre, row.apellido_pat, row.apellido_mat].filter(Boolean).join(" ").trim();

              return (
                <Paper
                  key={String(row.trajectory_id)}
                  elevation={0}
                  sx={{
                    p: { xs: 1.7, sm: 2.0 },
                    borderRadius: 3,
                    backgroundColor: "#fff",
                    boxShadow: "0 4px 12px rgba(255,51,51,0.12)",
                    overflow: "hidden",
                  }}
                >
                  {/* Header: persona + status */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      justifyContent: "space-between",
                      gap: 1,
                      alignItems: { xs: "flex-start", md: "center" },
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: "'Montserrat', sans-serif",
                          fontWeight: 900,
                          color: "#111",
                          fontSize: { xs: "1.02rem", md: "1.08rem" },
                          wordBreak: "break-word",
                        }}
                      >
                        {fullName || "(Sin nombre)"}{" "}
                        <Typography component="span" sx={{ color: "#777", fontWeight: 700 }}>
                          — {row.correo || "sin correo"}
                        </Typography>
                      </Typography>

                      <Typography sx={{ fontFamily: "'Outfit', sans-serif", color: "#555", mt: 0.3 }}>
                        <b>{row.category}</b> • {row.title} {row.year ? `• ${row.year}` : ""}
                      </Typography>

                      {row.folio ? (
                        <Typography sx={{ fontFamily: "'Outfit', sans-serif", color: "#666", mt: 0.2 }}>
                          Folio: <b>{row.folio}</b>
                        </Typography>
                      ) : null}

                    </Box>

                    <Chip
                      icon={st.icon}
                      label={st.label}
                      size="small"
                      sx={{
                        border: `1px solid ${st.border}`,
                        backgroundColor: st.bg,
                        color: st.color,
                        fontWeight: 900,
                        "& .MuiChip-icon": { color: st.color },
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 1.3, opacity: 0.6 }} />

                  {/* Archivo + acciones */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      gap: 1.2,
                      justifyContent: "space-between",
                      alignItems: { xs: "stretch", md: "center" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Chip
                        icon={<FaFileAlt />}
                        label={row.file_name ? row.file_name : "Sin archivo"}
                        size="small"
                        onClick={row.file_url ? () => safeOpen(row.file_url) : undefined}
                        sx={{
                          border: `1px solid ${colorRojo}55`,
                          color: "#111",
                          backgroundColor: "#fff",
                          maxWidth: "100%",
                          cursor: row.file_url ? "pointer" : "default",
                          "& .MuiChip-label": {
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: { xs: 240, sm: 360, md: 420 },
                          },
                          "& .MuiChip-icon": { color: colorRojo },
                          ...(row.file_url ? { "&:hover": { backgroundColor: `${colorRojo}10` } } : {}),
                        }}
                      />

                      {row.review_notes ? (
                        <Chip
                          label="Tiene notas"
                          size="small"
                          sx={{
                            border: `1px dashed ${colorRojo}55`,
                            backgroundColor: `${colorRojo}08`,
                            fontWeight: 800,
                          }}
                        />
                      ) : null}
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <Button
                        variant="outlined"
                        disabled={!row.file_url}
                        onClick={() => safeOpen(row.file_url)}
                        sx={{
                          borderColor: `${colorRojo}88`,
                          color: colorRojo,
                          fontWeight: 900,
                          textTransform: "none",
                          "&:hover": { borderColor: colorRojo, backgroundColor: `${colorRojo}10` },
                        }}
                      >
                        Abrir archivo
                      </Button>

                      <Button
                        variant="contained"
                        onClick={() => openReview(row, "validated")}
                        sx={{
                          backgroundColor: "#2e7d32",
                          fontWeight: 900,
                          textTransform: "none",
                          "&:hover": { backgroundColor: "#256628" },
                        }}
                      >
                        Validar
                      </Button>

                      <Button
                        variant="contained"
                        onClick={() => openReview(row, "rejected")}
                        sx={{
                          backgroundColor: "#c62828",
                          fontWeight: 900,
                          textTransform: "none",
                          "&:hover": { backgroundColor: "#a81f1f" },
                        }}
                      >
                        Rechazar
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Modal aprobar/rechazar */}
      <Dialog open={reviewOpen} onClose={closeReview} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900 }}>
          {reviewStatus === "validated" ? "Validar trayectoria" : "Rechazar trayectoria"}
        </DialogTitle>

        <DialogContent>
          {reviewTarget ? (
            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontFamily: "'Outfit', sans-serif", color: "#444" }}>
                <b>{reviewTarget.category}</b> — {reviewTarget.title}
              </Typography>
              <Typography sx={{ fontFamily: "'Outfit', sans-serif", color: "#777", mt: 0.2 }}>
                {reviewTarget.year ? `Año: ${reviewTarget.year}` : ""}{" "}
                {reviewTarget.folio ? `• Folio: ${reviewTarget.folio}` : ""}
              </Typography>
            </Box>
          ) : null}

          <TextField
            label="Notas de revisión (opcional)"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            sx={{
              mt: 1,
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: colorRojo },
                "&:hover fieldset": { borderColor: colorRojo },
                "&.Mui-focused fieldset": { borderColor: colorRojo },
              },
            }}
            placeholder={
              reviewStatus === "validated"
                ? "Ej: Se valida por cumplir con lo solicitado."
                : "Ej: El documento no es legible / no corresponde a la categoría."
            }
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeReview} disabled={savingReview} sx={{ textTransform: "none", fontWeight: 900 }}>
            Cancelar
          </Button>
          <Button
            onClick={saveReview}
            disabled={savingReview}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 900,
              backgroundColor: reviewStatus === "validated" ? "#2e7d32" : "#c62828",
              "&:hover": { backgroundColor: reviewStatus === "validated" ? "#256628" : "#a81f1f" },
            }}
          >
            {savingReview ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
