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
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  IconButton,
  Tooltip,
  Divider,
  Collapse,
} from "@mui/material";
import { FiRefreshCw, FiArrowUp, FiArrowDown, FiExternalLink } from "react-icons/fi";
import { getAuth } from "firebase/auth";

/** 🎨 Paleta */
const COLORS = {
  bg: "#f5f0ff",
  white: "#ffffff",
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
 * - NO interpretar false como rechazado (eso era el bug)
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
  if (status === "validado") return { label: "Validado", color: COLORS.green };
  if (status === "rechazado") return { label: "Rechazado", color: COLORS.danger };
  return { label: "Pendiente", color: COLORS.amber };
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

const Documentos = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchField, setSearchField] = useState("matricula");
  const [search, setSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [docStatusFilter, setDocStatusFilter] = useState(""); // validado|pendiente|rechazado|"" (todos)

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [sortKey, setSortKey] = useState("matricula");
  const [sortDir, setSortDir] = useState("asc");

  const [expandedMatricula, setExpandedMatricula] = useState(null);

  const debounceRef = useRef(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setNameSearch("");
    setDocStatusFilter("");
    setExpandedMatricula(null);
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

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: COLORS.bg, px: { xs: 1.5, md: 2 }, py: 2 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            background: `linear-gradient(180deg, ${COLORS.whiteSoft} 0%, ${COLORS.white} 100%)`,
            border: `1px solid ${COLORS.subtle}`,
            mb: 2,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.textMain, letterSpacing: 1.2 }}>
              DOCUMENTOS
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip
                label={`${filteredRows.length} resultados`}
                sx={{
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.subtle}`,
                  fontWeight: 800,
                  color: COLORS.textMain,
                }}
              />

              <Tooltip title="Refrescar">
                <IconButton
                  onClick={fetchDocs}
                  sx={{
                    border: `1px solid ${COLORS.subtle}`,
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
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems="stretch">
              <TextField
                select
                size="small"
                label="Buscar por"
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
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
                sx={{ width: { xs: "100%", md: 520 }, backgroundColor: COLORS.white }}
              />

              <TextField
                size="small"
                label="Nombre / apellidos"
                placeholder="Ej. ana garcía / garcía / ana"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                sx={{ flex: 1, minWidth: { md: 360 }, backgroundColor: COLORS.white }}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems="stretch">
              <TextField
                select
                size="small"
                label="Estado (al menos 1 doc)"
                value={docStatusFilter}
                onChange={(e) => setDocStatusFilter(e.target.value)}
                sx={{ width: { xs: "100%", md: 320 }, backgroundColor: COLORS.white }}
              >
                {estadoOptions.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant="text"
                onClick={clearFilters}
                sx={{
                  width: { xs: "100%", md: 220 },
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 900,
                  color: COLORS.textMuted,
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.subtle}`,
                  "&:hover": { backgroundColor: COLORS.whiteSoft },
                }}
              >
                Limpiar filtros
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.subtle}`,
            overflow: "hidden",
          }}
        >
          <TableContainer sx={{ maxHeight: "70vh" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {[
                    { key: "matricula", label: "Matrícula", minWidth: 130, sortable: true },
                    { key: "nombre", label: "Nombre", minWidth: 240, sortable: true },
                    { key: "curp", label: "CURP", minWidth: 180, sortable: true },
                    { key: "correo", label: "Correo", minWidth: 240, sortable: true },
                    { key: "__pendientes__", label: "Pendientes", minWidth: 120, sortable: true },
                    { key: "__validados__", label: "Validados", minWidth: 120, sortable: true },
                    { key: "__rechazados__", label: "Rechazados", minWidth: 120, sortable: true },
                  ].map((c) => (
                    <TableCell
                      key={c.key}
                      onClick={() => c.sortable && handleSort(c.key)}
                      sx={{
                        minWidth: c.minWidth,
                        backgroundColor: COLORS.whiteSoft,
                        borderBottom: `1px solid ${COLORS.subtle}`,
                        fontWeight: 900,
                        color: COLORS.textMain,
                        cursor: c.sortable ? "pointer" : "default",
                        userSelect: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Stack direction="row" spacing={0.7} alignItems="center">
                        <span>{c.label}</span>
                        {sortKey === c.key ? (sortDir === "asc" ? <FiArrowUp /> : <FiArrowDown />) : null}
                      </Stack>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 6 }}>
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <CircularProgress size={20} />
                        <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                          Cargando documentos…
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 6 }}>
                      <Typography variant="body2" sx={{ color: COLORS.textMuted, textAlign: "center" }}>
                        No hay resultados con esos filtros.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((r, idx) => {
                    const matricula = r?.matricula ?? `${idx}`;
                    const isExpanded = expandedMatricula === matricula;
                    const counts = countStatuses(r);

                    const clickableCellSx = {
                      whiteSpace: "nowrap",
                      fontWeight: 900,
                      cursor: "pointer",
                      borderRadius: 1.5,
                      "&:hover": { backgroundColor: COLORS.whiteSoft },
                      outline: "none",
                    };

                    return (
                      <React.Fragment key={`${matricula}-${idx}`}>
                        <TableRow hover sx={{ "& td": { borderBottom: `1px solid ${COLORS.subtle}` } }}>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {safeCellValue(r?.matricula) || <span style={{ color: COLORS.textMuted }}>—</span>}
                          </TableCell>

                          <TableCell
                            tabIndex={0}
                            role="button"
                            aria-expanded={isExpanded}
                            onClick={() => toggleExpand(matricula)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleExpand(matricula);
                              }
                            }}
                            sx={clickableCellSx}
                            title="Click para ver documentos"
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              <span>{fullNameOf(r) || "—"}</span>
                              <Chip
                                size="small"
                                label={isExpanded ? "Abierto" : "Abrir"}
                                sx={{
                                  height: 22,
                                  fontWeight: 900,
                                  backgroundColor: COLORS.white,
                                  border: `1px solid ${COLORS.subtle}`,
                                  color: COLORS.textMuted,
                                }}
                              />
                            </Stack>
                          </TableCell>

                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {safeCellValue(r?.curp) || <span style={{ color: COLORS.textMuted }}>—</span>}
                          </TableCell>

                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {safeCellValue(r?.correo) || <span style={{ color: COLORS.textMuted }}>—</span>}
                          </TableCell>

                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            <Chip label={counts.pen} size="small" sx={{ fontWeight: 900, backgroundColor: COLORS.white, border: `1px solid ${COLORS.subtle}` }} />
                          </TableCell>

                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            <Chip label={counts.ok} size="small" sx={{ fontWeight: 900, backgroundColor: COLORS.white, border: `1px solid ${COLORS.subtle}` }} />
                          </TableCell>

                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            <Chip label={counts.rej} size="small" sx={{ fontWeight: 900, backgroundColor: COLORS.white, border: `1px solid ${COLORS.subtle}` }} />
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={7} sx={{ p: 0, borderBottom: `1px solid ${COLORS.subtle}` }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 2, backgroundColor: COLORS.whiteSoft }}>
                                <Stack spacing={1.2}>
                                  <Typography sx={{ fontWeight: 900, color: COLORS.textMain }}>
                                    Documentos de: {fullNameOf(r) || "—"} ({safeCellValue(r?.matricula) || "—"})
                                  </Typography>

                                  <Divider sx={{ borderColor: COLORS.subtle }} />

                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 900, color: COLORS.textMain, whiteSpace: "nowrap" }}>Documento</TableCell>
                                        <TableCell sx={{ fontWeight: 900, color: COLORS.textMain, whiteSpace: "nowrap" }}>Archivo</TableCell>
                                        <TableCell sx={{ fontWeight: 900, color: COLORS.textMain, whiteSpace: "nowrap" }}>Estado</TableCell>
                                        <TableCell sx={{ fontWeight: 900, color: COLORS.textMain, whiteSpace: "nowrap" }}>Acciones</TableCell>
                                      </TableRow>
                                    </TableHead>

                                    <TableBody>
                                      {DOC_FIELDS.map((f) => {
                                        const url = r?.[f.key];
                                        const st = getDocStatus(r, f);
                                        const meta = statusMeta(st || "pendiente");
                                        const disabledNoFile = !url;

                                        return (
                                          <TableRow key={f.documento} hover sx={{ "& td": { borderBottom: `1px solid ${COLORS.subtle}` } }}>
                                            <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 800 }}>{f.label}</TableCell>

                                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                                              {url ? (
                                                <Button
                                                  variant="outlined"
                                                  size="small"
                                                  startIcon={<FiExternalLink />}
                                                  onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                                                  sx={{
                                                    borderRadius: 2,
                                                    textTransform: "none",
                                                    fontWeight: 900,
                                                    borderColor: COLORS.subtle,
                                                    color: COLORS.textMain,
                                                    backgroundColor: COLORS.white,
                                                    "&:hover": { backgroundColor: COLORS.whiteSoft },
                                                  }}
                                                >
                                                  Ver
                                                </Button>
                                              ) : (
                                                <span style={{ color: COLORS.textMuted }}>No disponible</span>
                                              )}
                                            </TableCell>

                                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                                              <Chip
                                                label={meta.label}
                                                size="small"
                                                sx={{
                                                  fontWeight: 900,
                                                  color: meta.color,
                                                  backgroundColor: COLORS.white,
                                                  border: `1px solid ${COLORS.subtle}`,
                                                }}
                                              />
                                            </TableCell>

                                            <TableCell>
                                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                                <Button
                                                  size="small"
                                                  disabled={disabledNoFile}
                                                  onClick={() => actualizarEstado(matricula, f.documento, "validado")}
                                                  sx={{
                                                    borderRadius: 2,
                                                    textTransform: "none",
                                                    fontWeight: 900,
                                                    backgroundColor: disabledNoFile ? COLORS.subtle : "#c8facc",
                                                    color: disabledNoFile ? COLORS.textMuted : "#1b5e20",
                                                    border: `1px solid ${disabledNoFile ? COLORS.subtle : "#1b5e20"}`,
                                                    "&:hover": { backgroundColor: disabledNoFile ? COLORS.subtle : "#b6f3bb" },
                                                  }}
                                                >
                                                  ✅ Validar
                                                </Button>

                                                <Button
                                                  size="small"
                                                  disabled={disabledNoFile}
                                                  onClick={() => actualizarEstado(matricula, f.documento, "pendiente")}
                                                  sx={{
                                                    borderRadius: 2,
                                                    textTransform: "none",
                                                    fontWeight: 900,
                                                    backgroundColor: disabledNoFile ? COLORS.subtle : "#fff2cc",
                                                    color: disabledNoFile ? COLORS.textMuted : "#7a4b00",
                                                    border: `1px solid ${disabledNoFile ? COLORS.subtle : "#7a4b00"}`,
                                                    "&:hover": { backgroundColor: disabledNoFile ? COLORS.subtle : "#ffebb2" },
                                                  }}
                                                >
                                                  ⏳ Pendiente
                                                </Button>

                                                <Button
                                                  size="small"
                                                  disabled={disabledNoFile}
                                                  onClick={() => actualizarEstado(matricula, f.documento, "rechazado")}
                                                  sx={{
                                                    borderRadius: 2,
                                                    textTransform: "none",
                                                    fontWeight: 900,
                                                    backgroundColor: disabledNoFile ? COLORS.subtle : "#ffccd5",
                                                    color: disabledNoFile ? COLORS.textMuted : "#b71c1c",
                                                    border: `1px solid ${disabledNoFile ? COLORS.subtle : "#b71c1c"}`,
                                                    "&:hover": { backgroundColor: disabledNoFile ? COLORS.subtle : "#ffb9c6" },
                                                  }}
                                                >
                                                  ❌ Rechazar
                                                </Button>
                                              </Stack>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>

                                  <Divider sx={{ borderColor: COLORS.subtle }} />

                                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography sx={{ fontWeight: 900, color: COLORS.textMain }}>Sobre mí</Typography>
                                      <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                                        {safeCellValue(r?.sobre_mi) || "—"}
                                      </Typography>
                                    </Box>

                                    <Box sx={{ minWidth: 260 }}>
                                      <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                                        <b>Fecha de creación:</b> {safeCellValue(r?.fecha_creacion) || "—"}
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                                        <b>Última actualización:</b> {safeCellValue(r?.ultima_actualizacion) || "—"}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </Stack>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

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
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default Documentos;
