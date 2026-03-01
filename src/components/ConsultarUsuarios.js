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
  Menu,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  FiDownload,
  FiRefreshCw,
  FiArrowUp,
  FiArrowDown,
  FiSliders,
  FiColumns,
} from "react-icons/fi";
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
};

const API_BASE = "https://vol-backend.onrender.com";

/**
 * Columnas “tipo Excel”
 * - id NO aparece en selector (toggleable:false)
 * - CSV exporta TODO menos id (ver EXPORT_COLUMNS)
 */
const COLUMNS = [
  { key: "id", label: "ID", minWidth: 90, defaultVisible: false, toggleable: false },

  { key: "matricula", label: "Matrícula", minWidth: 120, defaultVisible: true, toggleable: true },
  { key: "nombre", label: "Nombre", minWidth: 160, defaultVisible: true, toggleable: true },
  { key: "apellido_paterno", label: "Apellido paterno", minWidth: 160, defaultVisible: true, toggleable: true },
  { key: "apellido_materno", label: "Apellido materno", minWidth: 160, defaultVisible: true, toggleable: true },
  { key: "curp", label: "CURP", minWidth: 180, defaultVisible: true, toggleable: true },
  { key: "correo", label: "Correo", minWidth: 220, defaultVisible: true, toggleable: true },

  { key: "entrevistado", label: "Entrevista", minWidth: 150, defaultVisible: true, toggleable: true },

  { key: "telefono", label: "Teléfono", minWidth: 120, defaultVisible: false, toggleable: true },
  { key: "celular", label: "Celular", minWidth: 120, defaultVisible: false, toggleable: true },

  { key: "estado", label: "Estado", minWidth: 120, defaultVisible: true, toggleable: true },
  { key: "colonia", label: "Colonia", minWidth: 160, defaultVisible: false, toggleable: true },
  { key: "codigo_postal", label: "CP", minWidth: 90, defaultVisible: false, toggleable: true },

  { key: "coordinacion", label: "Coordinación", minWidth: 140, defaultVisible: true, toggleable: true },
  { key: "estado_validacion", label: "Validación", minWidth: 140, defaultVisible: true, toggleable: true },
  { key: "fecha_registro", label: "Fecha registro", minWidth: 160, defaultVisible: true, toggleable: true },
];

const EXPORT_COLUMNS = COLUMNS.filter((c) => c.key !== "id");

const SEARCH_FIELDS = [
  { value: "matricula", label: "Matrícula" },
  { value: "curp", label: "CURP" },
  { value: "correo", label: "Correo" },
];

function safeCellValue(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  return String(v);
}

function formatDateYMD(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return safeCellValue(value);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDisplayValue(row, key) {
  if (!row) return "";
  const raw = row[key];
  if (key === "fecha_registro") return formatDateYMD(raw);
  return safeCellValue(raw);
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
  return `${n} ${ap} ${am}`.replace(/\s+/g, " ").trim();
}

function toCsv(rows, columns) {
  const headers = columns.map((c) => c.label);
  const keys = columns.map((c) => c.key);

  const escape = (value) => {
    const s = safeCellValue(value);
    const escaped = s.replace(/"/g, '""');
    if (/[",\n]/.test(escaped)) return `"${escaped}"`;
    return escaped;
  };

  const lines = [];
  lines.push(headers.map(escape).join(","));
  for (const r of rows) {
    lines.push(keys.map((k) => escape(getDisplayValue(r, k))).join(","));
  }
  return lines.join("\n");
}

function downloadTextFile(filename, text, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function EntrevistaChip({ value }) {
  const v = (value || "").toString().trim().toLowerCase();
  if (!v) {
    return (
      <Chip
        label="—"
        size="small"
        variant="outlined"
        sx={{ textTransform: "uppercase", fontSize: 11, opacity: 0.7 }}
      />
    );
  }

  const isSi = v === "si";
  return (
    <Chip
      label={isSi ? "Entrevistado" : "No entrevistado"}
      size="small"
      color={isSi ? "success" : undefined}
      variant={isSi ? "filled" : "outlined"}
      sx={{ textTransform: "uppercase", fontSize: 11 }}
    />
  );
}

const ConsultarUsuarios = () => {
  const [rows, setRows] = useState([]);

const [interviewAnchor, setInterviewAnchor] = useState(null);
const [interviewRow, setInterviewRow] = useState(null);
const interviewOpen = Boolean(interviewAnchor);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // server-friendly
  const [searchField, setSearchField] = useState("matricula");
  const [search, setSearch] = useState("");

  // client-side: nombre/apellidos
  const [nameSearch, setNameSearch] = useState("");

  // client-side dropdowns
  const [estadoFilter, setEstadoFilter] = useState("");
  const [coordinacionFilter, setCoordinacionFilter] = useState("");
  const [coloniaFilter, setColoniaFilter] = useState("");
  const [validacionFilter, setValidacionFilter] = useState("");
  const [entrevistaFilter, setEntrevistaFilter] = useState(""); // "", "si", "no", "none"
  const [cpFilter, setCpFilter] = useState("");

  // tabla
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // sort
  const [sortKey, setSortKey] = useState("fecha_registro");
  const [sortDir, setSortDir] = useState("desc");

  // columnas visibles
  const defaultVisibility = useMemo(() => {
    const obj = {};
    for (const c of COLUMNS) obj[c.key] = !!c.defaultVisible;
    return obj;
  }, []);
  const [visibleCols, setVisibleCols] = useState(defaultVisibility);

  // menú columnas
  const [columnsAnchor, setColumnsAnchor] = useState(null);
  const columnsOpen = Boolean(columnsAnchor);

  const debounceRef = useRef(null);

  const toggleableColumns = useMemo(
    () => COLUMNS.filter((c) => c.toggleable !== false),
    []
  );

  const uniqueEstados = useMemo(() => {
    const s = new Set(rows.map((r) => (r.estado || "").trim()).filter(Boolean));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const uniqueCoordinaciones = useMemo(() => {
    const s = new Set(rows.map((r) => (r.coordinacion || "").trim()).filter(Boolean));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [rows]);


  const uniqueColonias = useMemo(() => {
    const s = new Set(rows.map((r) => (r.colonia || "").trim()).filter(Boolean));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [rows]);
  
  const uniqueValidaciones = useMemo(() => {
    const s = new Set(rows.map((r) => (r.estado_validacion || "").trim()).filter(Boolean));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [rows]);
  const fetchUsers = async ({ field, term } = {}) => {
    setLoading(true);
    setError("");

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuario no autenticado");

      const idToken = await currentUser.getIdToken();
      const uid = currentUser.uid;

      const url = new URL(`${API_BASE}/users`);
      if (term && term.trim() && field) {
        url.searchParams.set("searchField", field);
        url.searchParams.set("search", term.trim());
      }

      const resp = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "x-firebase-uid": uid,
        },
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Error al cargar usuarios");
      }

      const data = await resp.json();
      setRows(Array.isArray(data) ? data : []);
      setPage(0);
    } catch (e) {
      setError(e.message || "Error al cargar usuarios");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };


const setEntrevistadoUser = async (userId, entrevistado) => {
  // optimistic update
  const prev = rows;
  setRows((current) =>
    current.map((u) => (u.id === userId ? { ...u, entrevistado } : u))
  );

  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Usuario no autenticado");

    const idToken = await currentUser.getIdToken();
    const uid = currentUser.uid;

    const v = (entrevistado ?? "").toString().trim().toLowerCase();
    if (!["si", "no"].includes(v)) throw new Error('Valor inválido (usa "si" o "no")');

    const res = await fetch(`${API_BASE}/users/${userId}/entrevistado`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
        "x-firebase-uid": uid,
      },
      body: JSON.stringify({ entrevistado: v }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || "No se pudo actualizar entrevista");
    }
  } catch (e) {
    // rollback
    setRows(prev);
    setError(e.message || "Error al actualizar entrevista");
  } finally {
    setInterviewAnchor(null);
    setInterviewRow(null);
  }
};

const openInterviewMenu = (e, row) => {
  setInterviewAnchor(e.currentTarget);
  setInterviewRow(row);
};

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce server-side search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchUsers({ field: searchField, term: search });
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchField, search]);

  const filteredRows = useMemo(() => {
    let r = [...rows];

    if (estadoFilter) {
      const term = normalizeText(estadoFilter);
      r = r.filter((x) => normalizeText(x.estado).includes(term));
    }
    if (coordinacionFilter) {
      const term = normalizeText(coordinacionFilter);
      r = r.filter((x) => normalizeText(x.coordinacion).includes(term));
    }
    if (coloniaFilter) {
      const term = normalizeText(coloniaFilter);
      r = r.filter((x) => normalizeText(x.colonia).includes(term));
    }
    if (validacionFilter) {
      const term = normalizeText(validacionFilter);
      r = r.filter((x) => normalizeText(x.estado_validacion).includes(term));
    }
    if (entrevistaFilter) {
      const v = (x) => ((x?.entrevistado ?? "").toString().trim().toLowerCase());
      if (entrevistaFilter === "none") r = r.filter((x) => !v(x));
      else r = r.filter((x) => v(x) === entrevistaFilter);
    }
    if (cpFilter.trim()) {
      const term = normalizeText(cpFilter.trim());
      r = r.filter((x) => normalizeText(x.codigo_postal).includes(term));
    }

    if (nameSearch.trim()) {
      const term = normalizeText(nameSearch.trim());
      r = r.filter((x) => normalizeText(fullNameOf(x)).includes(term));
    }

    const dir = sortDir === "asc" ? 1 : -1;
    r.sort((a, b) => {
      const av = getDisplayValue(a, sortKey);
      const bv = getDisplayValue(b, sortKey);

      const an = Number(av);
      const bn = Number(bv);
      if (!Number.isNaN(an) && !Number.isNaN(bn) && av !== "" && bv !== "") {
        return (an - bn) * dir;
      }
      return av.localeCompare(bv) * dir;
    });

    return r;
  }, [rows, estadoFilter, coordinacionFilter, nameSearch, sortKey, sortDir]);

  const pageRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const handleToggleColumn = (key) => {
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleExportCsv = () => {
    const csv = toCsv(filteredRows, EXPORT_COLUMNS);

    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

    downloadTextFile(`usuarios_${stamp}.csv`, csv);
  };

  const totalCount = filteredRows.length;

  const visibleCount = useMemo(() => {
    return COLUMNS.filter((c) => c.key !== "id" && visibleCols[c.key]).length;
  }, [visibleCols]);

  const resetColumns = () => {
    const obj = {};
    for (const c of COLUMNS) obj[c.key] = !!c.defaultVisible;
    setVisibleCols(obj);
  };

  const clearFilters = () => {
    setEstadoFilter("");
    setCoordinacionFilter("");
    setColoniaFilter("");
    setValidacionFilter("");
    setEntrevistaFilter("");
    setCpFilter("");
    setNameSearch("");
  };

  return (
    <Box sx={{ px: { xs: 0, md: 0 }, py: 0 }}>
      {/* Header de consulta (tu UI original) */}
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
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              color: COLORS.textMain,
              letterSpacing: 1.2,
            }}
          >
            CONSULTAR USUARIOS
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip
              label={`${totalCount} resultados`}
              sx={{
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.subtle}`,
                fontWeight: 800,
                color: COLORS.textMain,
              }}
            />
            <Chip
              label={`${visibleCount} columnas`}
              sx={{
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.subtle}`,
                fontWeight: 800,
                color: COLORS.textMain,
              }}
            />

            <Button
              variant="contained"
              startIcon={<FiDownload />}
              onClick={handleExportCsv}
              sx={{
                backgroundColor: COLORS.red,
                "&:hover": { backgroundColor: COLORS.redDark },
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
              }}
            >
              Exportar CSV
            </Button>

            <Tooltip title="Refrescar">
              <IconButton
                onClick={() => fetchUsers({ field: searchField, term: search })}
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

        {/* ✅ Filtros con más aire: 2 filas en desktop */}
        <Stack spacing={1.2}>
          {/* Fila 1 */}
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
              placeholder="Matrícula / CURP / Correo (server-side)"
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

          {/* Fila 2 */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems="stretch">
            <TextField
              select
              size="small"
              label="Estado"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              sx={{ width: { xs: "100%", md: 260 }, backgroundColor: COLORS.white }}
            >
              <MenuItem value="">Todos</MenuItem>
              {uniqueEstados.map((x) => (
                <MenuItem key={x} value={x}>
                  {x}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Coordinación"
              value={coordinacionFilter}
              onChange={(e) => setCoordinacionFilter(e.target.value)}
              sx={{ width: { xs: "100%", md: 300 }, backgroundColor: COLORS.white }}
            >
              <MenuItem value="">Todas</MenuItem>
              {uniqueCoordinaciones.map((x) => (
                <MenuItem key={x} value={x}>
                  {x}
                </MenuItem>
              ))}
            </TextField>

<TextField
  select
  size="small"
  label="Colonia"
  value={coloniaFilter}
  onChange={(e) => setColoniaFilter(e.target.value)}
  sx={{ width: { xs: "100%", md: 320 }, backgroundColor: COLORS.white }}
>
  <MenuItem value="">Todas</MenuItem>
  {uniqueColonias.map((x) => (
    <MenuItem key={x} value={x}>
      {x}
    </MenuItem>
  ))}
</TextField>

<TextField
  select
  size="small"
  label="Validación"
  value={validacionFilter}
  onChange={(e) => setValidacionFilter(e.target.value)}
  sx={{ width: { xs: "100%", md: 220 }, backgroundColor: COLORS.white }}
>
  <MenuItem value="">Todas</MenuItem>
  {uniqueValidaciones.map((x) => (
    <MenuItem key={x} value={x}>
      {x}
    </MenuItem>
  ))}
</TextField>

<TextField
  select
  size="small"
  label="Entrevista"
  value={entrevistaFilter}
  onChange={(e) => setEntrevistaFilter(e.target.value)}
  sx={{ width: { xs: "100%", md: 220 }, backgroundColor: COLORS.white }}
>
  <MenuItem value="">Todas</MenuItem>
  <MenuItem value="si">Entrevistado</MenuItem>
  <MenuItem value="no">No entrevistado</MenuItem>
  <MenuItem value="none">Sin dato</MenuItem>
</TextField>

<TextField
  size="small"
  label="CP"
  placeholder="Ej. 06000"
  value={cpFilter}
  onChange={(e) => setCpFilter(e.target.value)}
  sx={{ width: { xs: "100%", md: 180 }, backgroundColor: COLORS.white }}
/>

            <Button
              variant="outlined"
              startIcon={<FiColumns />}
              onClick={(e) => setColumnsAnchor(e.currentTarget)}
              sx={{
                width: { xs: "100%", md: 220 },
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 900,
                borderColor: COLORS.subtle,
                color: COLORS.textMain,
                backgroundColor: COLORS.white,
                "&:hover": {
                  borderColor: COLORS.line,
                  backgroundColor: COLORS.whiteSoft,
                },
              }}
            >
              Columnas
            </Button>

            <Button
              variant="text"
              startIcon={<FiSliders />}
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

        {/* Menú columnas */}
        <Menu
          anchorEl={columnsAnchor}
          open={columnsOpen}
          onClose={() => setColumnsAnchor(null)}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: 3,
              border: `1px solid ${COLORS.subtle}`,
              backgroundColor: COLORS.white,
              minWidth: 320,
              p: 1,
            },
          }}
        >
          <Box sx={{ px: 1, pb: 1 }}>
            <Typography sx={{ fontWeight: 900, color: COLORS.textMain }}>
              Columnas visibles
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
              (ID está oculto permanentemente aquí)
            </Typography>
          </Box>

          <Divider sx={{ borderColor: COLORS.subtle }} />

          <Box sx={{ px: 1, py: 1, maxHeight: 320, overflow: "auto" }}>
            <FormGroup>
              {toggleableColumns.map((c) => (
                <FormControlLabel
                  key={c.key}
                  control={
                    <Checkbox
                      checked={!!visibleCols[c.key]}
                      onChange={() => handleToggleColumn(c.key)}
                      sx={{ "&.Mui-checked": { color: COLORS.red } }}
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 700, color: COLORS.textMain }}>
                      {c.label}
                    </Typography>
                  }
                />
              ))}
            </FormGroup>
          </Box>

          <Divider sx={{ borderColor: COLORS.subtle }} />

          <Stack direction="row" spacing={1} sx={{ px: 1, py: 1 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={resetColumns}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 900,
                borderColor: COLORS.subtle,
                color: COLORS.textMain,
                "&:hover": { backgroundColor: COLORS.whiteSoft },
              }}
            >
              Restaurar default
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={() => setColumnsAnchor(null)}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 900,
                backgroundColor: COLORS.red,
                "&:hover": { backgroundColor: COLORS.redDark },
              }}
            >
              Listo
            </Button>
          </Stack>
        </Menu>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabla */}
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
                {COLUMNS.filter((c) => visibleCols[c.key]).map((c) => (
                  <TableCell
                    key={c.key}
                    onClick={() => {
                      if (c.key === "id") return;
                      handleSort(c.key);
                    }}
                    sx={{
                      minWidth: c.minWidth,
                      backgroundColor: COLORS.whiteSoft,
                      borderBottom: `1px solid ${COLORS.subtle}`,
                      fontWeight: 900,
                      color: COLORS.textMain,
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Stack direction="row" spacing={0.7} alignItems="center">
                      <span>{c.label}</span>
                      {sortKey === c.key
                        ? sortDir === "asc"
                          ? <FiArrowUp />
                          : <FiArrowDown />
                        : null}
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={Math.max(1, COLUMNS.filter((c) => visibleCols[c.key]).length)}
                    sx={{ py: 6 }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                      <CircularProgress size={20} />
                      <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                        Cargando usuarios…
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={Math.max(1, COLUMNS.filter((c) => visibleCols[c.key]).length)}
                    sx={{ py: 6 }}
                  >
                    <Typography variant="body2" sx={{ color: COLORS.textMuted, textAlign: "center" }}>
                      No hay resultados con esos filtros.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((r, idx) => (
                  <TableRow
                    key={`${r.id ?? "row"}-${idx}`}
                    hover
                    sx={{ "& td": { borderBottom: `1px solid ${COLORS.subtle}` } }}
                  >
                    {COLUMNS.filter((c) => visibleCols[c.key]).map((c) => {
                      const v = getDisplayValue(r, c.key);
                      return (
  <TableCell key={c.key} sx={{ whiteSpace: "nowrap" }}>
    {c.key === "entrevistado" ? (
      <Stack direction="row" spacing={1} alignItems="center">
        <EntrevistaChip value={r?.entrevistado} />
        <Tooltip title="Marcar entrevista">
          <IconButton
            size="small"
            onClick={(e) => openInterviewMenu(e, r)}
            sx={{
              border: `1px solid ${COLORS.subtle}`,
              borderRadius: 2,
              backgroundColor: COLORS.white,
            }}
          >
            <FiSliders />
          </IconButton>
        </Tooltip>
      </Stack>
    ) : v ? (
      v
    ) : (
      <span style={{ color: COLORS.textMuted }}>—</span>
    )}
  </TableCell>
);
                    })}
                  </TableRow>
                ))
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


{/* Menú entrevista */}
<Menu
  id="menu-entrevista"
  anchorEl={interviewAnchor}
  open={interviewOpen}
  onClose={() => {
    setInterviewAnchor(null);
    setInterviewRow(null);
  }}
  PaperProps={{
    sx: {
      mt: 1,
      borderRadius: 3,
      border: `1px solid ${COLORS.subtle}`,
      backgroundColor: COLORS.white,
      minWidth: 260,
      p: 0.5,
    },
  }}
>
  <Box sx={{ px: 1.2, pt: 1, pb: 0.5 }}>
    <Typography sx={{ fontWeight: 900, color: COLORS.textMain }}>
      Entrevista
    </Typography>
    <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
      {interviewRow ? fullNameOf(interviewRow) : ""}
    </Typography>
  </Box>
  <Divider sx={{ borderColor: COLORS.subtle }} />

  <MenuItem
    onClick={() => setEntrevistadoUser(interviewRow?.id, "si")}
    sx={{ borderRadius: 2, mx: 0.5, my: 0.25 }}
  >
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: "100%" }}>
      <Typography sx={{ fontWeight: 800, color: COLORS.textMain }}>Marcar como entrevistado</Typography>
      <Chip label="SI" size="small" color="success" sx={{ fontWeight: 900 }} />
    </Stack>
  </MenuItem>

  <MenuItem
    onClick={() => setEntrevistadoUser(interviewRow?.id, "no")}
    sx={{ borderRadius: 2, mx: 0.5, my: 0.25 }}
  >
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: "100%" }}>
      <Typography sx={{ fontWeight: 800, color: COLORS.textMain }}>Marcar como NO entrevistado</Typography>
      <Chip label="NO" size="small" variant="outlined" sx={{ fontWeight: 900 }} />
    </Stack>
  </MenuItem>
</Menu>
    </Box>
  );
};

export default ConsultarUsuarios;
