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
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  IconButton,
  Tooltip,
} from "@mui/material";
import { getAuth } from "firebase/auth";
import { FiRefreshCw, FiSearch, FiExternalLink, FiCheckCircle } from "react-icons/fi";

const COLORS = {
  bg: "#f5f0ff",
  white: "#ffffff",
  whiteSoft: "#fff8ff",
  subtle: "#e6dfef",
  red: "#ff3333",
  redDark: "#cc0000",
  textMain: "#2d233a",
  textMuted: "#6c6478",
};

const API_BASE = "https://vol-backend.onrender.com";

const USER_SEARCH_FIELDS = [
  { value: "matricula", label: "Matrícula" },
  { value: "curp", label: "CURP" },
  { value: "correo", label: "Correo" },
];

// ✅ UI labels (ES) pero values (EN) para backend
const REVIEW_STATUS_OPTIONS = [
  { value: "submitted", label: "Enviado" },
  { value: "approved", label: "Aprobado" },
  { value: "rejected", label: "Rechazado" },
];

// ✅ Traducción solo visual del tipo de actividad (no cambiar value)
const ACTIVITY_TYPE_LABEL = {
  upload: "Evidencia / Archivo",
  solicitud: "Solicitud",
  quiz: "Cuestionario",
  scorm: "SCORM",
  video: "Video",
  text: "Lectura / Texto",
  url: "Enlace",
};

// ✅ Traducción solo visual del estatus de progreso de la actividad
const ACTIVITY_STATUS_LABEL = {
  not_started: "No iniciado",
  in_progress: "En progreso",
  completed: "Completado",
  failed: "Fallido",
};

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

function fullNameOf(u) {
  const n = safeStr(u?.nombre);
  const ap = safeStr(u?.apellido_paterno ?? u?.apellido_pat);
  const am = safeStr(u?.apellido_materno ?? u?.apellido_mat);
  return `${n} ${ap} ${am}`.replace(/\s+/g, " ").trim();
}

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
  return res.json();
}

function StatusChip({ status }) {
  const raw = safeStr(status) || "not_started";
  const label = ACTIVITY_STATUS_LABEL[raw] || "Desconocido";

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        backgroundColor: COLORS.white,
        border: `1px solid ${COLORS.subtle}`,
        fontWeight: 900,
        color: COLORS.textMain,
      }}
    />
  );
}

function ReviewStatusChip({ status }) {
  const raw = safeStr(status) || "submitted";
  const map = {
    submitted: "Enviado",
    approved: "Aprobado",
    rejected: "Rechazado",
  };
  const label = map[raw] || "Desconocido";

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        backgroundColor: COLORS.white,
        border: `1px solid ${COLORS.subtle}`,
        fontWeight: 900,
        color: COLORS.textMain,
      }}
    />
  );
}

function buildReviewKey(kind, id) {
  return `${kind}:${id}`;
}

export default function Progresos() {
  // Buscar usuario
  const [userSearchField, setUserSearchField] = useState("matricula");
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);

  // Programas del usuario
  const [programs, setPrograms] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [programsError, setProgramsError] = useState("");

  const [selectedProgram, setSelectedProgram] = useState(null);

  // Vista programa (actividades+docs+requests)
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");
  const [programView, setProgramView] = useState(null); // {program, summary, activities}

  // Review (docs + requests)
  const [reviewEdits, setReviewEdits] = useState({}); // key(kind:id) -> {status, score, review_note}
  const [reviewSaving, setReviewSaving] = useState({}); // key -> boolean
  const [reviewSavedMsg, setReviewSavedMsg] = useState({}); // key -> msg

  // Pagination
  const [usersPage, setUsersPage] = useState(0);
  const [usersRowsPerPage, setUsersRowsPerPage] = useState(10);

  const [actPage, setActPage] = useState(0);
  const [actRowsPerPage, setActRowsPerPage] = useState(10);

  const debounceRef = useRef(null);

  // user key para backend (acepta id o uid)
  const selectedUserKey = useMemo(() => {
    const u = selectedUser;
    return safeStr(u?.id) || safeStr(u?.uid);
  }, [selectedUser]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const url = new URL(`${API_BASE}/users`);
      if (userSearch.trim()) {
        url.searchParams.set("searchField", userSearchField);
        url.searchParams.set("search", userSearch.trim());
      }

      const data = await authedFetch(url.toString(), { method: "GET" });
      setUsers(Array.isArray(data) ? data : []);
      setUsersPage(0);
    } catch (e) {
      setUsersError(e.message || "Error al buscar usuarios");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // Debounce de búsqueda
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUsers();
    }, 350);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearchField, userSearch]);

  const usersFiltered = useMemo(() => {
    const term = userSearch.trim();
    if (!term) return users;

    const nTerm = normalizeText(term);
    return users.filter((u) => {
      const name = normalizeText(fullNameOf(u));
      const correo = normalizeText(u?.correo);
      const curp = normalizeText(u?.curp);
      const mat = normalizeText(u?.matricula);
      return (
        name.includes(nTerm) ||
        correo.includes(nTerm) ||
        curp.includes(nTerm) ||
        mat.includes(nTerm)
      );
    });
  }, [users, userSearch]);

  const usersPageRows = useMemo(() => {
    const start = usersPage * usersRowsPerPage;
    return usersFiltered.slice(start, start + usersRowsPerPage);
  }, [usersFiltered, usersPage, usersRowsPerPage]);

  const actRows = useMemo(() => {
    const list = Array.isArray(programView?.activities) ? programView.activities : [];
    const start = actPage * actRowsPerPage;
    return list.slice(start, start + actRowsPerPage);
  }, [programView, actPage, actRowsPerPage]);

  const selectUser = async (u) => {
    setSelectedUser(u);
    setSelectedProgram(null);
    setPrograms([]);
    setProgramView(null);
    setReviewEdits({});
    setReviewSavedMsg({});
    setProgramsError("");
    setViewError("");

    const userKey = safeStr(u?.id) || safeStr(u?.uid);
    if (!userKey) {
      setProgramsError("No se pudo identificar al usuario seleccionado.");
      return;
    }

    setProgramsLoading(true);
    try {
      const data = await authedFetch(
        `${API_BASE}/progreso/admin/users/${encodeURIComponent(userKey)}/programas`,
        { method: "GET" }
      );
      setPrograms(Array.isArray(data?.programs) ? data.programs : []);
    } catch (e) {
      setProgramsError(e.message || "Error al cargar programas");
      setPrograms([]);
    } finally {
      setProgramsLoading(false);
    }
  };

  const loadProgramView = async (programCode) => {
    const userKey = selectedUserKey;
    const code = safeStr(programCode).toUpperCase();
    if (!userKey || !code) return;

    setViewLoading(true);
    setViewError("");
    setProgramView(null);
    setReviewEdits({});
    setReviewSavedMsg({});
    setActPage(0);

    try {
      const data = await authedFetch(
        `${API_BASE}/progreso/admin/users/${encodeURIComponent(userKey)}/programas/${encodeURIComponent(code)}`,
        { method: "GET" }
      );

      setProgramView(data || null);

      // Pre-cargar edits SOLO de actividades revisables: upload(doc) y solicitud(request)
      const initial = {};
      const acts = Array.isArray(data?.activities) ? data.activities : [];

      for (const a of acts) {
        const type = safeStr(a?.activity_type);

        // upload -> doc
        if (type === "upload") {
          const doc = a?.doc;
          if (!doc?.doc_id) continue;

          const key = buildReviewKey("doc", doc.doc_id);
          initial[key] = {
            status: doc.doc_status || "submitted",
            score: doc.score ?? "", // si no viene, queda ""
            review_note: doc.review_note ?? "",
          };
        }

        // solicitud -> request
        if (type === "solicitud") {
          const req = a?.request;
          if (!req?.request_id) continue;

          const key = buildReviewKey("request", req.request_id);
          initial[key] = {
            status: req.status || "submitted",
            score: req.score ?? "",
            review_note: req.review_note ?? "",
          };
        }
      }

      setReviewEdits(initial);
    } catch (e) {
      setViewError(e.message || "Error al cargar vista del programa");
      setProgramView(null);
    } finally {
      setViewLoading(false);
    }
  };

  const selectProgram = async (p) => {
    setSelectedProgram(p);
    const code = safeStr(p?.code).toUpperCase();
    await loadProgramView(code);
  };

  const handleReviewEdit = (key, patch) => {
    setReviewEdits((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), ...patch },
    }));
  };

  const saveReview = async ({ kind, id, programCode }) => {
    const key = buildReviewKey(kind, id);
    const edit = reviewEdits?.[key] || {};

    const payload = {
      status: edit.status, // ✅ EN al backend
      score: edit.score === "" ? null : Number(edit.score),
      review_note: edit.review_note || null,
    };

    const url =
      kind === "doc"
        ? `${API_BASE}/progreso/admin/docs/${encodeURIComponent(id)}/review`
        : `${API_BASE}/progreso/admin/requests/${encodeURIComponent(id)}/review`;

    setReviewSaving((p) => ({ ...p, [key]: true }));
    setReviewSavedMsg((p) => ({ ...p, [key]: "" }));

    try {
      await authedFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setReviewSavedMsg((p) => ({ ...p, [key]: "Guardado ✅" }));

      // refrescar vista
      await loadProgramView(programCode);
    } catch (e) {
      setReviewSavedMsg((p) => ({ ...p, [key]: `Error al guardar` }));
    } finally {
      setReviewSaving((p) => ({ ...p, [key]: false }));
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: COLORS.bg, px: { xs: 1.5, md: 2 }, py: 2 }}>
      <Box sx={{ maxWidth: 1500, mx: "auto" }}>
        {/* Header */}
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
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.textMain, letterSpacing: 1.2 }}>
                PROGRESOS (ADMIN)
              </Typography>
              <Typography sx={{ color: COLORS.textMuted, mt: 0.3 }}>
                Revisa programas, progreso por actividad y evidencias/solicitudes.
              </Typography>
            </Box>
            <Chip
              label={
                selectedUser
                  ? `Usuario: ${safeStr(selectedUser?.matricula) || safeStr(selectedUser?.correo) || "Seleccionado"}`
                  : "Selecciona un usuario"
              }
              sx={{
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.subtle}`,
                fontWeight: 900,
                color: COLORS.textMain,
              }}
            />
          </Stack>
        </Paper>

        {/* BUSCAR USUARIO */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.subtle}`,
            mb: 2,
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems="stretch">
            <TextField
              select
              size="small"
              label="Buscar usuario por"
              value={userSearchField}
              onChange={(e) => setUserSearchField(e.target.value)}
              sx={{ width: { xs: "100%", md: 220 }, backgroundColor: COLORS.white }}
            >
              {USER_SEARCH_FIELDS.map((f) => (
                <MenuItem key={f.value} value={f.value}>
                  {f.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              label="Búsqueda"
              placeholder="Matrícula / CURP / Correo"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              sx={{ flex: 1, backgroundColor: COLORS.white }}
              InputProps={{
                endAdornment: (
                  <Tooltip title="Buscar ahora">
                    <IconButton onClick={fetchUsers}>
                      <FiSearch />
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />

            <Tooltip title="Refrescar">
              <IconButton
                onClick={fetchUsers}
                sx={{ border: `1px solid ${COLORS.subtle}`, borderRadius: 2, backgroundColor: COLORS.white }}
              >
                <FiRefreshCw />
              </IconButton>
            </Tooltip>
          </Stack>

          {usersError && (
            <Alert severity="error" sx={{ borderRadius: 3, mt: 1.5 }}>
              {usersError}
            </Alert>
          )}

          <Divider sx={{ my: 1.5, borderColor: COLORS.subtle }} />

          <TableContainer sx={{ maxHeight: 360 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: COLORS.whiteSoft, fontWeight: 900 }}>Matrícula</TableCell>
                  <TableCell sx={{ backgroundColor: COLORS.whiteSoft, fontWeight: 900 }}>Nombre</TableCell>
                  <TableCell sx={{ backgroundColor: COLORS.whiteSoft, fontWeight: 900 }}>Correo</TableCell>
                  <TableCell sx={{ backgroundColor: COLORS.whiteSoft, fontWeight: 900 }}>Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ py: 4 }}>
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <CircularProgress size={18} />
                        <Typography sx={{ color: COLORS.textMuted }}>Buscando…</Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : usersPageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ py: 4 }}>
                      <Typography sx={{ color: COLORS.textMuted, textAlign: "center" }}>Sin resultados.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  usersPageRows.map((u, idx) => (
                    <TableRow key={`${u.id || u.uid || "u"}-${idx}`} hover>
                      <TableCell>{safeStr(u.matricula) || "—"}</TableCell>
                      <TableCell>{fullNameOf(u) || "—"}</TableCell>
                      <TableCell>{safeStr(u.correo) || "—"}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => selectUser(u)}
                          sx={{
                            backgroundColor: COLORS.red,
                            "&:hover": { backgroundColor: COLORS.redDark },
                            borderRadius: 2,
                            fontWeight: 900,
                            textTransform: "none",
                          }}
                        >
                          Seleccionar
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
            count={usersFiltered.length}
            page={usersPage}
            onPageChange={(_, p) => setUsersPage(p)}
            rowsPerPage={usersRowsPerPage}
            onRowsPerPageChange={(e) => {
              setUsersRowsPerPage(parseInt(e.target.value, 10));
              setUsersPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </Paper>

        {/* PROGRAMAS INSCRITOS */}
        {selectedUser && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.subtle}`,
              mb: 2,
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="center" justifyContent="space-between">
              <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.textMain }}>
                Programas inscritos
              </Typography>
              <Chip
                label={`${programs.length} programas`}
                sx={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.subtle}`, fontWeight: 900 }}
              />
            </Stack>

            {programsError && (
              <Alert severity="error" sx={{ borderRadius: 3, mt: 1.5 }}>
                {programsError}
              </Alert>
            )}

            <Divider sx={{ my: 1.5, borderColor: COLORS.subtle }} />

            {programsLoading ? (
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ py: 3 }}>
                <CircularProgress size={18} />
                <Typography sx={{ color: COLORS.textMuted }}>Cargando programas…</Typography>
              </Stack>
            ) : programs.length === 0 ? (
              <Typography sx={{ color: COLORS.textMuted, textAlign: "center", py: 2 }}>
                Este usuario no tiene inscripciones.
              </Typography>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {programs.map((p) => {
                  const active = selectedProgram?.code === p.code;
                  return (
                    <Button
                      key={p.code}
                      variant={active ? "contained" : "outlined"}
                      onClick={() => selectProgram(p)}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 900,
                        textTransform: "none",
                        mb: 1,
                        ...(active
                          ? { backgroundColor: COLORS.red, "&:hover": { backgroundColor: COLORS.redDark } }
                          : {
                              borderColor: COLORS.subtle,
                              color: COLORS.textMain,
                              backgroundColor: COLORS.white,
                              "&:hover": { backgroundColor: COLORS.whiteSoft, borderColor: COLORS.subtle },
                            }),
                      }}
                    >
                      {p.name}
                    </Button>
                  );
                })}
              </Stack>
            )}
          </Paper>
        )}

        {/* VISTA PROGRAMA */}
        {selectedUser && selectedProgram && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.subtle}`,
              mb: 2,
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="center" justifyContent="space-between">
              <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.textMain }}>
                Vista del programa — {safeStr(selectedProgram.name)}
              </Typography>

              {programView?.summary ? (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label={`Total: ${programView.summary.totalActivities}`}
                    sx={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.subtle}`, fontWeight: 900 }}
                  />
                  <Chip
                    label={`Completadas: ${programView.summary.completedActivities}`}
                    sx={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.subtle}`, fontWeight: 900 }}
                  />
                  <Chip
                    label={`Progreso: ${programView.summary.progressPct}%`}
                    sx={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.subtle}`, fontWeight: 900 }}
                  />
                </Stack>
              ) : null}
            </Stack>

            {viewError && (
              <Alert severity="error" sx={{ borderRadius: 3, mt: 1.5 }}>
                {viewError}
              </Alert>
            )}

            <Divider sx={{ my: 1.5, borderColor: COLORS.subtle }} />

            {viewLoading ? (
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ py: 3 }}>
                <CircularProgress size={18} />
                <Typography sx={{ color: COLORS.textMuted }}>Cargando…</Typography>
              </Stack>
            ) : !programView ? (
              <Typography sx={{ color: COLORS.textMuted, textAlign: "center", py: 2 }}>
                Sin datos de vista del programa.
              </Typography>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: 620 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ backgroundColor: COLORS.whiteSoft, fontWeight: 900 }}>
                          Bloque / Módulo / Actividad
                        </TableCell>
                        <TableCell sx={{ backgroundColor: COLORS.whiteSoft, fontWeight: 900 }}>Progreso</TableCell>
                        <TableCell sx={{ backgroundColor: COLORS.whiteSoft, fontWeight: 900 }}>
                          Evidencia / Solicitud
                        </TableCell>
                        <TableCell sx={{ backgroundColor: COLORS.whiteSoft, fontWeight: 900 }}>Revisión</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {actRows.map((a) => {
                        const typeKey = safeStr(a.activity_type);
                        const typeLabel = ACTIVITY_TYPE_LABEL[typeKey] || "Actividad";

                        const isUpload = typeKey === "upload";
                        const isRequest = typeKey === "solicitud";

                        // upload -> doc
                        const doc = a.doc;
                        const hasDoc = !!doc?.doc_id;
                        const docId = doc?.doc_id;

                        // solicitud -> request
                        const req = a.request;
                        const hasReq = !!req?.request_id;
                        const reqId = req?.request_id;

                        const kind = isUpload ? "doc" : isRequest ? "request" : null;
                        const itemId = isUpload ? docId : isRequest ? reqId : null;
                        const reviewKey = kind && itemId ? buildReviewKey(kind, itemId) : null;

                        const edit = reviewKey ? (reviewEdits?.[reviewKey] || {}) : {};
                        const saving = reviewKey ? !!reviewSaving?.[reviewKey] : false;
                        const msg = reviewKey ? (reviewSavedMsg?.[reviewKey] || "") : "";

                        const canReview =
                          (isUpload && hasDoc) ||
                          (isRequest && hasReq);

                        return (
                          <TableRow key={a.activity_id} hover>
                            <TableCell>
                              <Typography sx={{ fontWeight: 900, color: COLORS.textMain, fontSize: 13 }}>
                                {safeStr(a.block_code)} / {safeStr(a.module_code)} / {safeStr(a.activity_code)} —{" "}
                                {safeStr(a.activity_title) || "Actividad"}
                              </Typography>
                              <Typography sx={{ color: COLORS.textMuted, fontSize: 12 }}>
                                Tipo: <b>{typeLabel}</b> {a.required ? " • Requerida" : " • Opcional"}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Stack spacing={0.7}>
                                <StatusChip status={a.status} />
                                <Typography sx={{ color: COLORS.textMuted, fontSize: 12 }}>
                                  Intentos: <b>{safeStr(a.attempts) || "0"}</b> • Puntaje: <b>{a.score ?? "—"}</b>
                                </Typography>
                              </Stack>
                            </TableCell>

                            {/* Evidencia / Solicitud */}
                            <TableCell>
                              {/* Caso upload */}
                              {isUpload ? (
                                !hasDoc ? (
                                  <Typography sx={{ color: COLORS.textMuted, fontSize: 12 }}>
                                    Sin evidencia enviada
                                  </Typography>
                                ) : (
                                  <Stack spacing={0.7}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <ReviewStatusChip status={doc.doc_status} />
                                      <Tooltip title="Abrir archivo">
                                        <IconButton
                                          onClick={() => window.open(doc.file_url, "_blank", "noopener,noreferrer")}
                                          sx={{ border: `1px solid ${COLORS.subtle}`, borderRadius: 2 }}
                                        >
                                          <FiExternalLink />
                                        </IconButton>
                                      </Tooltip>
                                    </Stack>
                                    <Typography sx={{ color: COLORS.textMuted, fontSize: 12 }}>
                                      {safeStr(doc.file_name) || "Archivo"}
                                    </Typography>
                                  </Stack>
                                )
                              ) : null}

                              {/* Caso solicitud */}
                              {isRequest ? (
                                !hasReq ? (
                                  <Typography sx={{ color: COLORS.textMuted, fontSize: 12 }}>
                                    Sin solicitud enviada
                                  </Typography>
                                ) : (
                                  <Stack spacing={0.7}>
                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                      <ReviewStatusChip status={req.status} />
                                      <Chip
                                        label={safeStr(req.request_key) || "SOLICITUD"}
                                        size="small"
                                        sx={{
                                          backgroundColor: COLORS.white,
                                          border: `1px solid ${COLORS.subtle}`,
                                          fontWeight: 900,
                                          color: COLORS.textMain,
                                        }}
                                      />
                                    </Stack>

                                    <Typography sx={{ color: COLORS.textMain, fontSize: 12, fontWeight: 800 }}>
                                      {safeStr(req.request_title) || "Solicitud"}
                                    </Typography>

                                    {safeStr(req.user_comment) ? (
                                      <Typography sx={{ color: COLORS.textMuted, fontSize: 12 }}>
                                        {safeStr(req.user_comment)}
                                      </Typography>
                                    ) : (
                                      <Typography sx={{ color: COLORS.textMuted, fontSize: 12 }}>
                                        (Sin comentarios del usuario)
                                      </Typography>
                                    )}
                                  </Stack>
                                )
                              ) : null}

                              {/* Otros tipos */}
                              {!isUpload && !isRequest ? (
                                <Typography sx={{ color: COLORS.textMuted, fontSize: 12 }}>—</Typography>
                              ) : null}
                            </TableCell>

                            {/* Revisión */}
                            <TableCell>
                              {!canReview ? (
                                <Typography sx={{ color: COLORS.textMuted, fontSize: 12 }}>—</Typography>
                              ) : (
                                <Stack spacing={1}>
                                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                    <TextField
                                      select
                                      size="small"
                                      label="Estado"
                                      value={
                                        edit.status ||
                                        (kind === "doc" ? (doc?.doc_status || "submitted") : (req?.status || "submitted"))
                                      }
                                      onChange={(e) => handleReviewEdit(reviewKey, { status: e.target.value })}
                                      sx={{ width: 170, backgroundColor: COLORS.white }}
                                    >
                                      {REVIEW_STATUS_OPTIONS.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </MenuItem>
                                      ))}
                                    </TextField>

                                    <TextField
                                      size="small"
                                      type="number"
                                      label="Puntaje (opcional)"
                                      value={edit.score ?? ""}
                                      onChange={(e) => handleReviewEdit(reviewKey, { score: e.target.value })}
                                      sx={{ width: 160, backgroundColor: COLORS.white }}
                                      inputProps={{ step: "0.01" }}
                                    />

                                    <Button
                                      size="small"
                                      variant="contained"
                                      disabled={saving}
                                      onClick={() =>
                                        saveReview({
                                          kind,
                                          id: itemId,
                                          programCode: safeStr(selectedProgram.code).toUpperCase(),
                                        })
                                      }
                                      startIcon={<FiCheckCircle />}
                                      sx={{
                                        backgroundColor: COLORS.red,
                                        "&:hover": { backgroundColor: COLORS.redDark },
                                        borderRadius: 2,
                                        fontWeight: 900,
                                        textTransform: "none",
                                      }}
                                    >
                                      {saving ? "Guardando…" : "Guardar"}
                                    </Button>
                                  </Stack>

                                  <TextField
                                    size="small"
                                    label="Comentario (opcional)"
                                    value={edit.review_note ?? ""}
                                    onChange={(e) => handleReviewEdit(reviewKey, { review_note: e.target.value })}
                                    sx={{ width: "100%", backgroundColor: COLORS.white }}
                                  />

                                  {msg ? (
                                    <Typography
                                      sx={{
                                        color: msg.startsWith("Error") ? "#b00020" : "#1b5e20",
                                        fontSize: 12,
                                        fontWeight: 800,
                                      }}
                                    >
                                      {msg.startsWith("Error") ? "Error al guardar" : msg}
                                    </Typography>
                                  ) : null}
                                </Stack>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={(programView.activities || []).length}
                  page={actPage}
                  onPageChange={(_, p) => setActPage(p)}
                  rowsPerPage={actRowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setActRowsPerPage(parseInt(e.target.value, 10));
                    setActPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 20, 50]}
                />
              </>
            )}
          </Paper>
        )}
      </Box>
    </Box>
  );
}
