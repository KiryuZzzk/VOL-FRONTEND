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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { getAuth } from "firebase/auth";
import { FiRefreshCw, FiArrowUp, FiArrowDown, FiEdit2 } from "react-icons/fi";
import { FaTimes } from "react-icons/fa";

/** 🎨 Paleta (misma vibra que ConsultarUsuarios) */
const COLORS = {
  white: "#ffffff",
  whiteSoft: "#fff8ff",
  subtle: "#e6dfef",
  red: "#ff3333",
  redDark: "#cc0000",
  textMain: "#2d233a",
  textMuted: "#6c6478",
};

const API_BASE = "https://vol-backend.onrender.com";

/** Campos editables (misma lógica que tu modal viejo) */
const EDITABLE_FIELDS = [
  { label: "Nombre", key: "nombre" },
  { label: "Apellido paterno", key: "apellido_paterno" },
  { label: "Apellido materno", key: "apellido_materno" },
  { label: "Fecha de nacimiento", key: "fecha_nacimiento", type: "date" },
  { label: "CURP", key: "curp" },
  { label: "Sexo", key: "sexo" },
  { label: "Estado civil", key: "estado_civil" },
  { label: "Teléfono", key: "telefono" },
  { label: "Celular", key: "celular" },
  { label: "Contacto emergencia", key: "emergencia_nombre" },
  { label: "Relación emergencia", key: "emergencia_relacion" },
];

/** Columnas para la tabla en modo edición (parecido a Consultar, pero compacto) */
const TABLE_COLUMNS = [
  { key: "matricula", label: "Matrícula", minWidth: 120, sortable: true },
  { key: "nombre", label: "Nombre", minWidth: 160, sortable: true },
  { key: "apellido_paterno", label: "Apellido paterno", minWidth: 160, sortable: true },
  { key: "apellido_materno", label: "Apellido materno", minWidth: 160, sortable: true },
  { key: "curp", label: "CURP", minWidth: 180, sortable: true },
  { key: "correo", label: "Correo", minWidth: 220, sortable: true },
  { key: "estado", label: "Estado", minWidth: 120, sortable: true },
  { key: "estado_validacion", label: "Validación", minWidth: 140, sortable: true },
];

const SEARCH_FIELDS = [
  { value: "matricula", label: "Matrícula" },
  { value: "curp", label: "CURP" },
  { value: "correo", label: "Correo" },
];

function safeStr(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function normalizeText(s) {
  return safeStr(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function fullNameOf(row) {
  const n = safeStr(row?.nombre);
  const ap = safeStr(row?.apellido_paterno);
  const am = safeStr(row?.apellido_materno);
  return `${n} ${ap} ${am}`.replace(/\s+/g, " ").trim();
}

function toISODateInput(value) {
  // Convierte a yyyy-mm-dd (para <input type="date">)
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function EditarUsuarios() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // búsqueda server-side (como ConsultarUsuarios)
  const [searchField, setSearchField] = useState("matricula");
  const [search, setSearch] = useState("");

  // búsqueda client-side (nombre completo)
  const [nameSearch, setNameSearch] = useState("");

  // tabla
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // sort
  const [sortKey, setSortKey] = useState("matricula");
  const [sortDir, setSortDir] = useState("asc");

  // editor modal
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null); // row original
  const [form, setForm] = useState({}); // edit buffer
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");
  const panelRef = useRef(null);

  const debounceRef = useRef(null);

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
      // respeta tu backend: si mandas query, filtra del lado server
      if (term && term.trim() && field) {
        url.searchParams.set("searchField", field);
        url.searchParams.set("search", term.trim());
      }

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "x-firebase-uid": uid,
        },
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Error al cargar usuarios");
      }

      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
      setPage(0);
    } catch (e) {
      setError(e.message || "Error al cargar usuarios");
      setRows([]);
    } finally {
      setLoading(false);
    }
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

    if (nameSearch.trim()) {
      const term = normalizeText(nameSearch.trim());
      r = r.filter((x) => normalizeText(fullNameOf(x)).includes(term));
    }

    const dir = sortDir === "asc" ? 1 : -1;
    r.sort((a, b) => {
      const av = safeStr(a?.[sortKey]);
      const bv = safeStr(b?.[sortKey]);
      return av.localeCompare(bv) * dir;
    });

    return r;
  }, [rows, nameSearch, sortKey, sortDir]);

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

  const openEditor = (row) => {
    setSelected(row);
    // precarga form
    const next = {};
    for (const f of EDITABLE_FIELDS) {
      let v = row?.[f.key] ?? "";
      // fecha en input type="date"
      if (f.type === "date") v = toISODateInput(v);
      next[f.key] = safeStr(v);
    }
    setForm(next);
    setSaveMsg("");
    setSaveError("");
    setOpen(true);

    // focus
    setTimeout(() => panelRef.current?.focus(), 0);
  };

  const closeEditor = () => {
    if (saving) return;
    setOpen(false);
    setSelected(null);
    setForm({});
    setSaveMsg("");
    setSaveError("");
  };

  const computeChanges = () => {
    if (!selected) return {};
    const changes = {};

    for (const f of EDITABLE_FIELDS) {
      const original = selected?.[f.key] ?? "";
      let originalComparable = safeStr(original);

      // fecha: original puede venir como datetime y el form es yyyy-mm-dd
      if (f.type === "date") {
        originalComparable = toISODateInput(original);
      }

      const current = safeStr(form?.[f.key] ?? "");

      if (current !== originalComparable) {
        // manda vacío como null/""? (lo dejamos como string, backend decide)
        changes[f.key] = current;
      }
    }

    return changes;
  };

  const saveChanges = async () => {
    setSaving(true);
    setSaveError("");
    setSaveMsg("");

    try {
      if (!selected?.id) throw new Error("No hay usuario seleccionado");

      const changes = computeChanges();
      if (!Object.keys(changes).length) {
        setSaveMsg("No hay cambios que guardar.");
        setSaving(false);
        return;
      }

      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuario no autenticado");

      const idToken = await currentUser.getIdToken();
      const uid = currentUser.uid;

      const res = await fetch(`${API_BASE}/users/${selected.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "x-firebase-uid": uid,
        },
        body: JSON.stringify(changes),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Error al guardar: ${t}`);
      }

      setSaveMsg("✅ Perfil actualizado correctamente.");

      // refresca lista para reflejar cambios
      await fetchUsers({ field: searchField, term: search });

      // opcional: cerrar al guardar
      // closeEditor();
    } catch (e) {
      setSaveError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      {/* Header estilo Consultar */}
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
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.textMain, letterSpacing: 1.2 }}>
              MODIFICAR USUARIOS
            </Typography>
            <Typography sx={{ color: COLORS.textMuted, mt: 0.3 }}>
              Busca, abre un usuario y edita sus campos.
            </Typography>
          </Box>

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

        {/* Filtros (misma vibra que ConsultarUsuarios) */}
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
              placeholder="Filtro extra (client-side)"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              sx={{ flex: 1, minWidth: { md: 360 }, backgroundColor: COLORS.white }}
            />
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabla tipo Consultar + columna Acciones */}
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
                {TABLE_COLUMNS.map((c) => (
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

                <TableCell
                  sx={{
                    minWidth: 140,
                    backgroundColor: COLORS.whiteSoft,
                    borderBottom: `1px solid ${COLORS.subtle}`,
                    fontWeight: 900,
                    color: COLORS.textMain,
                    whiteSpace: "nowrap",
                  }}
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={TABLE_COLUMNS.length + 1} sx={{ py: 6 }}>
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
                  <TableCell colSpan={TABLE_COLUMNS.length + 1} sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: COLORS.textMuted, textAlign: "center" }}>
                      No hay resultados con esos filtros.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((r, idx) => (
                  <TableRow key={`${r.id ?? "row"}-${idx}`} hover sx={{ "& td": { borderBottom: `1px solid ${COLORS.subtle}` } }}>
                    {TABLE_COLUMNS.map((c) => (
                      <TableCell key={c.key} sx={{ whiteSpace: "nowrap" }}>
                        {safeStr(r?.[c.key]) || <span style={{ color: COLORS.textMuted }}>—</span>}
                      </TableCell>
                    ))}

                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<FiEdit2 />}
                        onClick={() => openEditor(r)}
                        sx={{
                          backgroundColor: COLORS.red,
                          "&:hover": { backgroundColor: COLORS.redDark },
                          borderRadius: 2,
                          fontWeight: 900,
                          textTransform: "none",
                        }}
                      >
                        Editar
                      </Button>
                    </TableCell>
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

      {/* Editor modal (similar vibe, pero ya no es ProfileEditModal) */}
      <Dialog
        open={open}
        onClose={closeEditor}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${COLORS.subtle}`,
            background: `linear-gradient(180deg, ${COLORS.whiteSoft} 0%, ${COLORS.white} 100%)`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: COLORS.textMain }}>
          Editar usuario
          <IconButton
            onClick={closeEditor}
            disabled={saving}
            sx={{ position: "absolute", right: 12, top: 12, border: `1px solid ${COLORS.subtle}`, borderRadius: 2 }}
          >
            <FaTimes />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: COLORS.subtle }}>
          <Box tabIndex={-1} ref={panelRef} />

          {/* Info NO editable */}
          {selected && (
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mb: 2,
                borderRadius: 3,
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.subtle}`,
              }}
            >
              <Typography sx={{ fontWeight: 900, color: COLORS.textMain, mb: 0.5 }}>
                Identidad
              </Typography>
              <Typography sx={{ color: COLORS.textMuted, fontSize: 13 }}>
                Matrícula: <b style={{ color: COLORS.textMain }}>{safeStr(selected.matricula) || "—"}</b> &nbsp;•&nbsp;
                Correo: <b style={{ color: COLORS.textMain }}>{safeStr(selected.correo) || "—"}</b> &nbsp;•&nbsp;
                Validación: <b style={{ color: COLORS.textMain }}>{safeStr(selected.estado_validacion) || "—"}</b>
              </Typography>
            </Paper>
          )}

          {saveError && (
            <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>
              {saveError}
            </Alert>
          )}
          {saveMsg && (
            <Alert severity="success" sx={{ borderRadius: 3, mb: 2 }}>
              {saveMsg}
            </Alert>
          )}

          {/* Campos editables */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 1.2,
            }}
          >
            {EDITABLE_FIELDS.map((f) => (
              <TextField
                key={f.key}
                size="small"
                label={f.label}
                type={f.type || "text"}
                value={form?.[f.key] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                sx={{ backgroundColor: COLORS.white }}
                InputLabelProps={f.type === "date" ? { shrink: true } : undefined}
              />
            ))}
          </Box>

          <Typography sx={{ color: COLORS.textMuted, fontSize: 12.5, mt: 1.5 }}>
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={closeEditor}
            disabled={saving}
            variant="outlined"
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
            Cancelar
          </Button>

          <Button
            onClick={saveChanges}
            disabled={saving || !selected}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 900,
              backgroundColor: COLORS.red,
              "&:hover": { backgroundColor: COLORS.redDark },
            }}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
