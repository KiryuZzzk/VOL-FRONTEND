import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Button,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  Collapse,
  Avatar,
  TablePagination,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { FiRefreshCw, FiChevronDown, FiChevronUp, FiExternalLink, FiFilter } from "react-icons/fi";
import { getAuth } from "firebase/auth";

/** 🎨 Paleta (misma que ya usas) */
const COLORS = {
  bg: "#f5f0ff",
  white: "#fcfcfc",
  whiteSoft: "#fff8ff",
  subtle: "#e6dfef",
  red: "#ff3333",
  redDark: "#cc0000",
  textMain: "#2d233a",
  textMuted: "#6c6478",
  line: "#d4ccdf",
  green: "#2e7d32",
  amber: "#ed6c02",
  danger: "#d32f2f",
};

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
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Usuario no autenticado");

  const idToken = await currentUser.getIdToken();
  const uid = currentUser.uid;

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${idToken}`,
    "x-firebase-uid": uid,
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}


const SEARCH_FIELDS = [
  { value: "matricula", label: "Matrícula" },
  { value: "curp", label: "CURP" },
  { value: "correo", label: "Correo" },
];

const DOC_FIELDS = [
  { label: "CURP", key: "curp_url", aprobadoKey: "curp_aprobado", estadoKey: "curp_estado", documento: "curp" },
  { label: "Acta de nacimiento", key: "acta_nacimiento_url", aprobadoKey: "acta_nacimiento_aprobado", estadoKey: "acta_nacimiento_estado", documento: "acta_nacimiento" },
  { label: "INE", key: "ine_url", aprobadoKey: "ine_aprobado", estadoKey: "ine_estado", documento: "ine" },
  { label: "CV", key: "cv_url", aprobadoKey: "cv_aprobado", estadoKey: "cv_estado", documento: "cv" },
  { label: "NSS", key: "nss_url", aprobadoKey: "nss_aprobado", estadoKey: "nss_estado", documento: "nss" },
  { label: "Constancia", key: "constancia_url", aprobadoKey: "constancia_aprobado", estadoKey: "constancia_estado", documento: "constancia" },
  { label: "Foto", key: "foto_url", aprobadoKey: "foto_aprobado", estadoKey: "foto_estado", documento: "foto" },
  { label: "Certificado médico", key: "certificado_medico_url", aprobadoKey: "certificado_medico_aprobado", estadoKey: "certificado_medico_estado", documento: "certificado_medico" },
];

function safeCellValue(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  return String(v);
}

function normalizeText(s) {
  return safeCellValue(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function fullNameOf(row) {
  const n = safeCellValue(row?.nombre);
  const ap = safeCellValue(row?.apellido_paterno);
  const am = safeCellValue(row?.apellido_materno);
  const joined = `${n} ${ap} ${am}`.replace(/\s+/g, " ").trim();
  return joined || n || "";
}

function normalizeEstadoStr(v) {
  const s = normalizeText(v);
  if (s === "validado" || s === "validada") return "validado";
  if (s === "rechazado" || s === "rechazada") return "rechazado";
  if (s === "pendiente") return "pendiente";
  return null;
}

/**
 * ✅ Estado real:
 * - Preferir *_estado si existe
 * - Fallback: si hay archivo y aprobado==1 => validado, else pendiente
 * - NO interpretar false como rechazado
 */
function getDocStatus(row, f) {
  const hasDoc = !!row?.[f.key];
  if (!hasDoc) return null;

  const estadoStr = normalizeEstadoStr(row?.[f.estadoKey]);
  if (estadoStr) return estadoStr;

  const ap = row?.[f.aprobadoKey];
  if (ap === 1 || ap === true) return "validado";
  return "pendiente";
}

function statusMeta(status) {
  if (status === "validado") return { label: "Validado", color: COLORS.green, border: "#1b5e20" };
  if (status === "rechazado") return { label: "Rechazado", color: COLORS.danger, border: "#b71c1c" };
  return { label: "Pendiente", color: COLORS.amber, border: "#7a4b00" };
}

function countStatuses(row) {
  let ok = 0;
  let rej = 0;
  let pen = 0;

  for (const f of DOC_FIELDS) {
    const st = getDocStatus(row, f);
    if (!st) continue;

    if (st === "validado") ok += 1;
    else if (st === "rechazado") rej += 1;
    else pen += 1;
  }

  return { ok, rej, pen };
}

function initialsFromName(name) {
  const parts = safeCellValue(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase();
}

const SORT_OPTIONS = [
  { key: "matricula", label: "Matrícula" },
  { key: "nombre", label: "Nombre" },
  { key: "curp", label: "CURP" },
  { key: "correo", label: "Correo" },
  { key: "__pendientes__", label: "Pendientes" },
  { key: "__validados__", label: "Validados" },
  { key: "__rechazados__", label: "Rechazados" },
];

const excelCellSx = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
};

const Documentos = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchField, setSearchField] = useState("matricula");
  const [search, setSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [docStatusFilter, setDocStatusFilter] = useState(""); // validado|pendiente|rechazado|"" (todos)


// ✅ Filtro por programa (reutiliza catálogo de /progreso)
const [programFilterList, setProgramFilterList] = useState([]); // [{program_id, code, name}]
const [programFilterCode, setProgramFilterCode] = useState(""); // "" = todos
const [programRosterLoading, setProgramRosterLoading] = useState(false);
const [programRosterError, setProgramRosterError] = useState("");
const [programUserKeys, setProgramUserKeys] = useState(() => new Set()); // matricula|correo|uid normalizados

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const [sortKey, setSortKey] = useState("matricula");
  const [sortDir, setSortDir] = useState("asc");

  const [expandedMatricula, setExpandedMatricula] = useState(null);

  const debounceRef = useRef(null);


const fetchProgramFilterList = async () => {
  try {
    const data = await authedFetch(`${API_BASE}/progreso/admin/programas`, { method: "GET" });
    setProgramFilterList(Array.isArray(data?.programs) ? data.programs : []);
  } catch (e) {
    setProgramFilterList([]);
  }
};

const fetchProgramRoster = async (programCode) => {
  const code = safeStr(programCode).trim().toUpperCase();
  if (!code) {
    setProgramUserKeys(new Set());
    setProgramRosterError("");
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
  } catch (e) {
    setProgramRosterError(e?.message || "No se pudo cargar el roster del programa.");
    setProgramUserKeys(new Set());
  } finally {
    setProgramRosterLoading(false);
  }
};

  const fetchDocs = async () => {
    setLoading(true);
    setError("");

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuario no autenticado");

      const idToken = await currentUser.getIdToken();
      const uid = currentUser.uid;

      const resp = await fetch(`${API_BASE}/documentos`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "x-firebase-uid": uid,
        },
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Error al cargar documentos");
      }

      const data = await resp.json();
      setRows(Array.isArray(data) ? data : []);
      setPage(0);
    } catch (e) {
      setError(e?.message || "Error al cargar documentos");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstado = async (matricula, documento, nuevoEstado) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuario no autenticado");

      const idToken = await currentUser.getIdToken();

      const resp = await fetch(`${API_BASE}/documentos/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "x-firebase-uid": currentUser.uid,
        },
        body: JSON.stringify({
          user_matricula: matricula,
          documento,
          estado: nuevoEstado, // "validado"|"pendiente"|"rechazado"
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Error actualizando estado");
      }

      const field = DOC_FIELDS.find((d) => d.documento === documento);
      if (!field) return;

      const aprobadoBool = nuevoEstado === "validado";

      // ✅ Actualiza estado + aprobado localmente para conteos instantáneos
      setRows((prev) =>
        prev.map((r) =>
          r.matricula === matricula
            ? { ...r, [field.estadoKey]: nuevoEstado, [field.aprobadoKey]: aprobadoBool ? 1 : 0 }
            : r
        )
      );
    } catch (e) {
      console.error("❌ Error en actualizarEstado:", e);
      alert("Error al actualizar estado del documento.");
    }
  };

  useEffect(() => {
    fetchDocs();
    fetchProgramFilterList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

useEffect(() => {
  fetchProgramRoster(programFilterCode);
  setPage(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [programFilterCode]);



  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const filteredRows = useMemo(() => {
    let r = [...rows];

// filtro por programa (frontend) usando roster de /progreso
if (programFilterCode) {
  if (!programUserKeys || programUserKeys.size === 0) return [];
  r = r.filter((x) => {
    const mat = normalizeKey(x?.matricula);
    const correo = normalizeKey(x?.correo);
    const uid = normalizeKey(x?.uid);
    return (mat && programUserKeys.has(mat)) || (correo && programUserKeys.has(correo)) || (uid && programUserKeys.has(uid));
  });
}


    const term = normalizeText(debouncedSearch.trim());
    if (term) r = r.filter((x) => normalizeText(x?.[searchField]).includes(term));

    if (nameSearch.trim()) {
      const t = normalizeText(nameSearch.trim());
      r = r.filter((x) => normalizeText(fullNameOf(x)).includes(t));
    }

    if (docStatusFilter) {
      const target = docStatusFilter;
      r = r.filter((x) => {
        for (const f of DOC_FIELDS) {
          const st = getDocStatus(x, f);
          if (st === target) return true;
        }
        return false;
      });
    }

    const dir = sortDir === "asc" ? 1 : -1;

    r.sort((a, b) => {
      if (sortKey === "__pendientes__" || sortKey === "__rechazados__" || sortKey === "__validados__") {
        const ca = countStatuses(a);
        const cb = countStatuses(b);
        const av = sortKey === "__pendientes__" ? ca.pen : sortKey === "__rechazados__" ? ca.rej : ca.ok;
        const bv = sortKey === "__pendientes__" ? cb.pen : sortKey === "__rechazados__" ? cb.rej : cb.ok;
        return (av - bv) * dir;
      }

      const av = safeCellValue(a?.[sortKey]);
      const bv = safeCellValue(b?.[sortKey]);

      const an = Number(av);
      const bn = Number(bv);
      if (!Number.isNaN(an) && !Number.isNaN(bn) && av !== "" && bv !== "") {
        return (an - bn) * dir;
      }
      return av.localeCompare(bv) * dir;
    });

    return r;
  }, [rows, debouncedSearch, searchField, nameSearch, docStatusFilter, sortKey, sortDir]);

  const pageRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const clearFilters = () => {
    setSearch("");
    setNameSearch("");
    setDocStatusFilter("");
    setProgramFilterCode("");
    setExpandedMatricula(null);
    setPage(0);
  };

  const toggleExpand = (matricula) => {
    setExpandedMatricula((prev) => (prev === matricula ? null : matricula));
  };

  const estadoOptions = [
    { value: "", label: "Todos" },
    { value: "pendiente", label: "Pendiente" },
    { value: "validado", label: "Validado" },
    { value: "rechazado", label: "Rechazado" },
  ];

  const metaPendiente = statusMeta("pendiente");
  const metaValidado = statusMeta("validado");
  const metaRechazado = statusMeta("rechazado");

  const chipWhiteOutlined = (meta) => ({
    fontWeight: 900,
    backgroundColor: COLORS.white,
    border: `2px solid ${meta.border}`,
    color: meta.color,
  });

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: COLORS.bg, px: { xs: 1.5, md: 2 }, py: 2 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Header + filtros */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            background: `linear-gradient(180deg, ${COLORS.whiteSoft} 0%, ${COLORS.white} 100%)`,
            border: `2px solid ${COLORS.subtle}`,
            mb: 2,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            sx={{ width: "100%" }}
          >
            <Stack spacing={0.4}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.textMain, letterSpacing: 1.2 }}>
                DOCUMENTOS
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                Da click a una fila para desplegar y validar documentos.
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip
                label={`${filteredRows.length} resultados`}
                sx={{
                  backgroundColor: COLORS.white,
                  border: `2px solid ${COLORS.subtle}`,
                  fontWeight: 800,
                  color: COLORS.textMain,
                }}
              />

              <Tooltip title="Refrescar">
                <IconButton
                  onClick={fetchDocs}
                  sx={{
                    border: `2px solid ${COLORS.subtle}`,
                    borderRadius: 2,
                    backgroundColor: COLORS.white,
                  }}
                >
                  <FiRefreshCw />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Divider sx={{ my: 1.5, borderColor: COLORS.subtle }} />

          <Stack spacing={1.2}>
            <TextField
  select
  size="small"
  label="Filtrar por programa"
  value={programFilterCode}
  onChange={(e) => {
    setProgramFilterCode(e.target.value);
    setPage(0);
  }}
  sx={{ width: { xs: "100%", md: 320 }, backgroundColor: COLORS.white }}
>
  <MenuItem value="">Todos los programas</MenuItem>
  {programFilterList.map((p) => (
    <MenuItem key={p.code} value={p.code}>
      {p.name} ({p.code})
    </MenuItem>
  ))}
</TextField>

<Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems="stretch">
              <TextField
                select
                size="small"
                label="Buscar por"
                value={searchField}
                onChange={(e) => {
                  setSearchField(e.target.value);
                  setPage(0);
                }}
                sx={{ width: { xs: "100%", md: 220 }, backgroundColor: COLORS.white }}
              >
                {SEARCH_FIELDS.map((f) => (
                  <MenuItem key={f.value} value={f.value}>
                    {f.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                label="Búsqueda"
                placeholder="Matrícula / CURP / Correo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ width: { xs: "100%", md: 420 }, backgroundColor: COLORS.white }}
              />

              <TextField
                size="small"
                label="Nombre / apellidos"
                placeholder="Ej. ana garcía / garcía / ana"
                value={nameSearch}
                onChange={(e) => {
                  setNameSearch(e.target.value);
                  setPage(0);
                }}
                sx={{ flex: 1, minWidth: { md: 280 }, backgroundColor: COLORS.white }}
              />
</Stack>

{programRosterError ? (
  <Alert severity="error" sx={{ borderRadius: 3 }}>
    {programRosterError}
  </Alert>
) : null}

{programFilterCode && programRosterLoading ? (
  <Alert severity="info" sx={{ borderRadius: 3 }}>
    Cargando roster del programa…
  </Alert>
) : null}

<Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems="stretch">
              <TextField
                select
                size="small"
                label="Estado (al menos 1 doc)"
                value={docStatusFilter}
                onChange={(e) => {
                  setDocStatusFilter(e.target.value);
                  setPage(0);
                }}
                sx={{ width: { xs: "100%", md: 320 }, backgroundColor: COLORS.white }}
              >
                {estadoOptions.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="Ordenar por"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                sx={{ width: { xs: "100%", md: 260 }, backgroundColor: COLORS.white }}
              >
                {SORT_OPTIONS.map((o) => (
                  <MenuItem key={o.key} value={o.key}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>

              <ToggleButtonGroup
                exclusive
                size="small"
                value={sortDir}
                onChange={(_, v) => v && setSortDir(v)}
                sx={{
                  backgroundColor: COLORS.white,
                  borderRadius: 2,
                  border: `2px solid ${COLORS.subtle}`,
                  overflow: "visible",
                  width: { xs: "100%", md: 180 },
                  "& .MuiToggleButton-root": {
                    textTransform: "none",
                    fontWeight: 900,
                    color: COLORS.textMuted,
                    border: "none",
                    flex: 1,
                  },
                  "& .Mui-selected": {
                    color: COLORS.textMain,
                    backgroundColor: COLORS.whiteSoft,
                  },
                }}
              >
                <ToggleButton value="asc">Asc</ToggleButton>
                <ToggleButton value="desc">Desc</ToggleButton>
              </ToggleButtonGroup>

              <Button
                variant="text"
                onClick={clearFilters}
                startIcon={<FiFilter />}
                sx={{
                  width: { xs: "100%", md: 220 },
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 900,
                  color: COLORS.textMuted,
                  backgroundColor: COLORS.white,
                  border: `2px solid ${COLORS.subtle}`,
                  "&:hover": { backgroundColor: COLORS.whiteSoft },
                }}
              >
                Limpiar filtros
              </Button>
            </Stack>

            {/* Mini-leyenda de estados */}
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" sx={{ pt: 0.2 }}>
              <Typography variant="body2" sx={{ color: COLORS.textMuted, fontWeight: 800 }}>
                Leyenda:
              </Typography>
              <Chip size="small" label={metaPendiente.label} sx={chipWhiteOutlined(metaPendiente)} />
              <Chip size="small" label={metaValidado.label} sx={chipWhiteOutlined(metaValidado)} />
              <Chip size="small" label={metaRechazado.label} sx={chipWhiteOutlined(metaRechazado)} />
            </Stack>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Contenido */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            backgroundColor: COLORS.white,
            border: `2px solid ${COLORS.subtle}`,
            overflowY: "hidden",
            overflowX: "hidden", // ✅ todo debe caber sin scroll horizontal
          }}
        >
          {loading ? (
            <Box sx={{ py: 6 }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <CircularProgress size={20} />
                <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                  Cargando documentos…
                </Typography>
              </Stack>
            </Box>
          ) : pageRows.length === 0 ? (
            <Box sx={{ py: 6 }}>
              <Typography variant="body2" sx={{ color: COLORS.textMuted, textAlign: "center" }}>
                No hay resultados con esos filtros.
              </Typography>
            </Box>
          ) : (
            <TableContainer
              sx={{
                width: "100%",
                overflowX: "hidden", // ✅ sin scroll horizontal
              }}
            >
              <Table
                size="small"
                aria-label="tabla documentos"
                sx={{
                  width: "100%",
                                    tableLayout: "auto", // ✅ permite wrapping y evita scroll horizontal
                  "& th, & td": {
                    borderColor: COLORS.subtle,
                  },
                }}
              >
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: COLORS.whiteSoft,
                      "& th": {
                        fontWeight: 950,
                        color: COLORS.textMain,
                        borderBottom: `2px solid ${COLORS.subtle}`,
                      },
                    }}
                  >
                    <TableCell sx={{ width: 380 }}>Persona</TableCell>
                    <TableCell sx={{ width: 360 }}>Datos</TableCell>
                    <TableCell sx={{ width: 260, textAlign: "right" }}>Estatus docs</TableCell>
                    <TableCell sx={{ width: 90, textAlign: "center" }} />
</TableRow>
                </TableHead>

                <TableBody>
                  {pageRows.map((r, idx) => {
                    const matricula = r?.matricula ?? `${idx}`;
                    const isExpanded = expandedMatricula === matricula;
                    const counts = countStatuses(r);
                    const name = fullNameOf(r) || "—";

                    return (
                      <React.Fragment key={`${matricula}-${idx}`}>
                        <TableRow
                          hover
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          onClick={() => toggleExpand(matricula)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleExpand(matricula);
                            }
                          }}
                          sx={{
                            cursor: "pointer",
                            "&:hover": { backgroundColor: COLORS.whiteSoft },
                            "& td": { verticalAlign: "middle" },
                          }}
                        >
                                                    <TableCell sx={{ pr: 1 }}>
                            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                              <Avatar
                                sx={{
                                  width: 34,
                                  height: 34,
                                  fontWeight: 900,
                                  backgroundColor: COLORS.subtle,
                                  color: COLORS.textMain,
                                  flex: "0 0 auto",
                                }}
                              >
                                {initialsFromName(name)}
                              </Avatar>

                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  sx={{
                                    fontWeight: 950,
                                    color: COLORS.textMain,
                                    lineHeight: 1.1,
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                  }}
                                  title={name}
                                >
                                  {name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: "block",
                                    color: COLORS.textMuted,
                                    mt: 0.2,
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {safeCellValue(r?.sobre_mi) ? safeCellValue(r?.sobre_mi) : "—"}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>

                          <TableCell sx={{ pr: 1 }}>
                            <Stack spacing={0.3} sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ rowGap: 0.6 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ color: COLORS.textMuted, fontWeight: 900, letterSpacing: 0.2 }}
                                >
                                  Matrícula:
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: COLORS.textMain, fontWeight: 900, whiteSpace: "normal", wordBreak: "break-word" }}
                                >
                                  {safeCellValue(r?.matricula) || "—"}
                                </Typography>
                              </Stack>

                              <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ rowGap: 0.6 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ color: COLORS.textMuted, fontWeight: 900, letterSpacing: 0.2 }}
                                >
                                  CURP:
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: COLORS.textMain, fontWeight: 800, whiteSpace: "normal", wordBreak: "break-word" }}
                                >
                                  {safeCellValue(r?.curp) || "—"}
                                </Typography>
                              </Stack>

                              <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ rowGap: 0.6 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ color: COLORS.textMuted, fontWeight: 900, letterSpacing: 0.2 }}
                                >
                                  Correo:
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: COLORS.textMain, fontWeight: 800, whiteSpace: "normal", wordBreak: "break-word" }}
                                >
                                  {safeCellValue(r?.correo) || "—"}
                                </Typography>
                              </Stack>
                            </Stack>
                          </TableCell>

                          <TableCell sx={{ textAlign: "right" }}>
                            <Stack direction="row" spacing={0.8} justifyContent="flex-end" flexWrap="wrap" sx={{ rowGap: 0.6 }}>
                              <Chip size="small" label={`Pend: ${counts.pen}`} sx={chipWhiteOutlined(metaPendiente)} />
                              <Chip size="small" label={`Val: ${counts.ok}`} sx={chipWhiteOutlined(metaValidado)} />
                              <Chip size="small" label={`Rech: ${counts.rej}`} sx={chipWhiteOutlined(metaRechazado)} />
                            </Stack>
                          </TableCell>

                          <TableCell sx={{ textAlign: "center" }}>
                            <Chip
                              size="small"
                              icon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                              label={isExpanded ? "Cerrar" : "Abrir"}
                              sx={{
                                height: 28,
                                fontWeight: 900,
                                backgroundColor: COLORS.white,
                                border: `2px solid ${COLORS.subtle}`,
                                color: COLORS.textMuted,
                              }}
                            />
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={4} sx={{ p: 0, borderBottom: `2px solid ${COLORS.subtle}` }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 1.6, backgroundColor: COLORS.whiteSoft }}>
                                <Stack spacing={1.2}>
                                  <Typography sx={{ fontWeight: 950, color: COLORS.textMain }}>Documentos</Typography>

                                  {/* Documentos en filas: mismo width, cero scroll horizontal */}
                                  <Stack spacing={1} sx={{ width: "100%" }}>
                                    {DOC_FIELDS.map((f) => {
                                      const url = r?.[f.key];
                                      const st = getDocStatus(r, f);
                                      const meta = statusMeta(st || "pendiente");
                                      const disabledNoFile = !url;

                                      const baseGreyBtn = {
                                        borderRadius: 2,
                                        textTransform: "none",
                                        fontWeight: 900,
                                        backgroundColor: "#f3f3f3",
                                        color: COLORS.textMain,
                                        "&:hover": { backgroundColor: "#ececec" },
                                      };

                                      return (
                                        <Paper
                                          key={f.documento}
                                          elevation={0}
                                          sx={{
                                            width: "100%",
                                            borderRadius: 2,
                                            border: `2px solid ${COLORS.subtle}`,
                                            backgroundColor: COLORS.white,
                                            px: 1.2,
                                            py: 1,
                                          }}
                                        >
                                          <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            spacing={1}
                                            alignItems={{ xs: "stretch", md: "center" }}
                                            justifyContent="space-between"
                                            sx={{ width: "100%" }}
                                          >
                                            {/* Label + status */}
                                            <Stack
                                              direction={{ xs: "column", sm: "row" }}
                                              spacing={1}
                                              alignItems={{ xs: "flex-start", sm: "center" }}
                                              sx={{ minWidth: 0, flex: 1 }}
                                            >
                                              <Typography
                                                sx={{
                                                  fontWeight: 900,
                                                  color: COLORS.textMain,
                                                  minWidth: { xs: "auto", sm: 220 },
                                                  ...excelCellSx,
                                                }}
                                                title={f.label}
                                              >
                                                {f.label}
                                              </Typography>

                                              {url ? (
                                                <Chip size="small" label={meta.label} sx={chipWhiteOutlined(meta)} />
                                              ) : (
                                                <Chip
                                                  size="small"
                                                  label="No disponible"
                                                  sx={{
                                                    fontWeight: 900,
                                                    backgroundColor: COLORS.white,
                                                    border: `1px dashed ${COLORS.subtle}`,
                                                    color: COLORS.textMuted,
                                                  }}
                                                />
                                              )}
                                            </Stack>

                                            {/* Actions */}
                                            <Stack
                                              direction="row"
                                              spacing={1}
                                              alignItems="center"
                                              flexWrap="wrap"
                                              justifyContent={{ xs: "flex-start", md: "flex-end" }}
                                              sx={{ width: { xs: "100%", md: "auto" }, rowGap: 1 }}
                                            >
                                              <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<FiExternalLink />}
                                                disabled={!url}
                                                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                                                sx={{
                                                  ...baseGreyBtn,
                                                  border: `2px solid ${COLORS.line}`,
                                                  color: url ? COLORS.textMain : COLORS.textMuted,
                                                  backgroundColor: url ? "#f3f3f3" : COLORS.subtle,
                                                  "&:hover": { backgroundColor: url ? "#ececec" : COLORS.subtle },
                                                }}
                                              >
                                                Ver
                                              </Button>

                                              <Button
                                                size="small"
                                                disabled={disabledNoFile}
                                                onClick={() => actualizarEstado(matricula, f.documento, "validado")}
                                                sx={{
                                                  ...baseGreyBtn,
                                                  border: `2px solid ${metaValidado.border}`,
                                                  color: disabledNoFile ? COLORS.textMuted : metaValidado.border,
                                                  backgroundColor: disabledNoFile ? COLORS.subtle : "#f3f3f3",
                                                  "&:hover": { backgroundColor: disabledNoFile ? COLORS.subtle : "#ececec" },
                                                }}
                                              >
                                                ✅ Validar
                                              </Button>

                                              <Button
                                                size="small"
                                                disabled={disabledNoFile}
                                                onClick={() => actualizarEstado(matricula, f.documento, "pendiente")}
                                                sx={{
                                                  ...baseGreyBtn,
                                                  border: `2px solid ${metaPendiente.border}`,
                                                  color: disabledNoFile ? COLORS.textMuted : metaPendiente.border,
                                                  backgroundColor: disabledNoFile ? COLORS.subtle : "#f3f3f3",
                                                  "&:hover": { backgroundColor: disabledNoFile ? COLORS.subtle : "#ececec" },
                                                }}
                                              >
                                                ⏳ Pendiente
                                              </Button>

                                              <Button
                                                size="small"
                                                disabled={disabledNoFile}
                                                onClick={() => actualizarEstado(matricula, f.documento, "rechazado")}
                                                sx={{
                                                  ...baseGreyBtn,
                                                  border: `2px solid ${metaRechazado.border}`,
                                                  color: disabledNoFile ? COLORS.textMuted : metaRechazado.border,
                                                  backgroundColor: disabledNoFile ? COLORS.subtle : "#f3f3f3",
                                                  "&:hover": { backgroundColor: disabledNoFile ? COLORS.subtle : "#ececec" },
                                                }}
                                              >
                                                ❌ Rechazar
                                              </Button>
                                            </Stack>
                                          </Stack>
                                        </Paper>
                                      );
                                    })}
                                  </Stack>

                                  <Divider sx={{ borderColor: COLORS.subtle, mt: 0.6 }} />

                                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems="stretch">
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography sx={{ fontWeight: 900, color: COLORS.textMain }}>Sobre mí</Typography>
                                      <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                                        {safeCellValue(r?.sobre_mi) || "—"}
                                      </Typography>
                                    </Box>

                                    <Paper
                                      elevation={0}
                                      sx={{
                                        borderRadius: 3,
                                        border: `2px solid ${COLORS.subtle}`,
                                        backgroundColor: COLORS.white,
                                        p: 1.2,
                                        width: { xs: "100%", md: 360 },
                                      }}
                                    >
                                      <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                                        <b>Fecha de creación:</b> {safeCellValue(r?.fecha_creacion) || "—"}
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                                        <b>Última actualización:</b> {safeCellValue(r?.ultima_actualizacion) || "—"}
                                      </Typography>
                                    </Paper>
                                  </Stack>
                                </Stack>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Divider sx={{ borderColor: COLORS.subtle }} />

          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[6, 12, 24, 48]}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default Documentos;
