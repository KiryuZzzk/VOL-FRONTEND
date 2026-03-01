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
  Checkbox,
  FormControlLabel,
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

// ✅ Traducción para estatus generales (cuando viene del backend en inglés)
const GENERIC_STATUS_LABEL = {
  enrolled: "Inscrito",
  active: "Activo",
  inactive: "Inactivo",
  completed: "Completado",
  dropped: "Baja",
  pending: "Pendiente",
};

const YES_NO = (v) => (v ? "Sí" : "No");

const toEsActivityType = (typeKey) => ACTIVITY_TYPE_LABEL[safeStr(typeKey)] || safeStr(typeKey);
const toEsActivityStatus = (statusKey) => ACTIVITY_STATUS_LABEL[safeStr(statusKey)] || safeStr(statusKey);
const toEsReviewStatus = (s) => {
  const raw = safeStr(s);
  const map = { submitted: "Enviado", approved: "Aprobado", rejected: "Rechazado" };
  return map[raw] || raw;
};
const toEsGenericStatus = (s) => GENERIC_STATUS_LABEL[safeStr(s)] || safeStr(s);

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

  // ✅ Filtro por programa (para listar alumnos inscritos)
  const [programFilterList, setProgramFilterList] = useState([]); // [{program_id, code, name}]
  const [programFilterCode, setProgramFilterCode] = useState(""); // "" = sin filtro
  const [programUsersMeta, setProgramUsersMeta] = useState(null); // {program, totalActivities, count}
  const [programUsersLoading, setProgramUsersLoading] = useState(false);
  const [programUsersError, setProgramUsersError] = useState("");

  // ✅ Filtros extra (solo FRONTEND) para la lista por programa
  const [filterMinAvgScore, setFilterMinAvgScore] = useState(""); // número o ""
  const [filterOnlyNoProgress, setFilterOnlyNoProgress] = useState(false); // no han hecho nada
  const [filterOnlyNoScore, setFilterOnlyNoScore] = useState(false); // sin calificación

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
    // Si está activo el filtro por programa, la lista viene del endpoint de programa.
    if (programFilterCode) {
      await fetchUsersByProgramCode(programFilterCode);
      return;
    }

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

  const fetchProgramFilterList = async () => {
    try {
      const data = await authedFetch(`${API_BASE}/progreso/admin/programas`, { method: "GET" });
      setProgramFilterList(Array.isArray(data?.programs) ? data.programs : []);
    } catch (e) {
      // No es crítico: si falla, igual se puede buscar por usuario como siempre.
      setProgramFilterList([]);
    }
  };

  const fetchUsersByProgramCode = async (programCode) => {
    const code = safeStr(programCode).trim().toUpperCase();
    if (!code) return;

    setProgramUsersLoading(true);
    setProgramUsersError("");
    setUsersError("");
    setUsersLoading(false); // por si veníamos de debounce
    try {
      const data = await authedFetch(
        `${API_BASE}/progreso/admin/programas/${encodeURIComponent(code)}/users`,
        { method: "GET" }
      );

      const list = Array.isArray(data?.users) ? data.users : [];
      // Normalizamos forma para reutilizar la tabla actual + selectUser()
      const normalized = list.map((r) => ({
        id: r.user_id_internal, // 👈 importante para selectUserKey (users.id)
        uid: r.uid,
        matricula: r.matricula,
        correo: r.correo,
        nombre: r.nombre,
        apellido_pat: r.apellido_pat,
        apellido_mat: r.apellido_mat,
        // extras (solo visual)
        enrollment_status: r.enrollment_status,
        progress_pct: r.progress_pct,
        avg_score: r.avg_score,
        last_activity_at: r.last_activity_at,
        // estado del usuario (users.status)
        estado: r.estado ?? null, // entidad federativa

        // si quieres conservar status, que sea SOLO status
        status: r.user_status ?? r.status ?? r.userStatus ?? null,
      }));

      setUsers(normalized);
      setUsersPage(0);

      setProgramUsersMeta({
        program: data?.program || { code, name: code },
        totalActivities: data?.totalActivities ?? null,
        count: normalized.length,
      });
    } catch (e) {
      setProgramUsersError(e.message || "Error al cargar usuarios por programa");
      setUsers([]);
      setProgramUsersMeta(null);
    } finally {
      setProgramUsersLoading(false);
    }
  };

  // Cargar lista de programas para filtro (una vez)
  useEffect(() => {
    fetchProgramFilterList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce de búsqueda
  useEffect(() => {
    // Si estás filtrando por programa, NO dispares búsqueda al backend /users.
    if (programFilterCode) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUsers();
    }, 350);

    return () => debounceRef.current && clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearchField, userSearch, programFilterCode]);

  // Cuando cambie el filtro por programa, trae el roster de ese programa
  useEffect(() => {
    if (!programFilterCode) {
      setProgramUsersMeta(null);
      setProgramUsersError("");
      // si quitamos filtro, vuelve a traer usuarios (respetando input)
      fetchUsers();
      return;
    }

    // al elegir programa, limpiamos selección previa
    setSelectedUser(null);
    setSelectedProgram(null);
    setPrograms([]);
    setProgramView(null);
    setReviewEdits({});
    setReviewSavedMsg({});
    setProgramsError("");
    setViewError("");

    fetchUsersByProgramCode(programFilterCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programFilterCode]);

  const usersFiltered = useMemo(() => {
    // 1) filtro por búsqueda (nombre/correo/curp/matrícula)
    const term = userSearch.trim();
    let list = Array.isArray(users) ? users : [];

    if (term) {
      const nTerm = normalizeText(term);
      list = list.filter((u) => {
        const name = normalizeText(fullNameOf(u));
        const correo = normalizeText(u?.correo);
        const curp = normalizeText(u?.curp);
        const mat = normalizeText(u?.matricula);
        return name.includes(nTerm) || correo.includes(nTerm) || curp.includes(nTerm) || mat.includes(nTerm);
      });
    }

    // 2) filtros extra SOLO cuando estás viendo usuarios por programa
    if (programFilterCode) {
      // a) sin progreso: progress_pct == 0 o null/undefined
      if (filterOnlyNoProgress) {
        list = list.filter((u) => {
          const p = u?.progress_pct;
          return p === 0 || p === "0" || p === null || p === undefined;
        });
      }

      // b) sin calificación: avg_score == null/undefined/""
      if (filterOnlyNoScore) {
        list = list.filter((u) => u?.avg_score === null || u?.avg_score === undefined || u?.avg_score === "");
      }

      // c) promedio mínimo
      if (filterMinAvgScore !== "" && filterMinAvgScore !== null && filterMinAvgScore !== undefined) {
        const min = Number(filterMinAvgScore);
        if (!Number.isNaN(min)) {
          list = list.filter((u) => {
            const s = u?.avg_score;
            if (s === null || s === undefined || s === "") return false;
            const n = Number(s);
            return !Number.isNaN(n) && n >= min;
          });
        }
      }
    }

    return list;
  }, [users, userSearch, programFilterCode, filterOnlyNoProgress, filterOnlyNoScore, filterMinAvgScore]);

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

  // ---------------------------
  // CSV export helpers
  // ---------------------------
  const csvEscape = (value) => {
    const s = safeStr(value);
    // Si tiene comas, saltos o comillas -> envolver en comillas y escapar comillas dobles
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const downloadCsv = (filename, csvText) => {
    try {
      const blob = new Blob([`\ufeff${csvText}`], { type: "text/csv;charset=utf-8;" }); // BOM para Excel
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // fallback: abre en nueva pestaña
      const encoded = encodeURIComponent(csvText);
      window.open(`data:text/csv;charset=utf-8,${encoded}`, "_blank");
    }
  };

  const exportParticipantsCSV = () => {
    // Exporta la lista tal como la estás viendo (respeta filtros y búsqueda)
    const code = safeStr(programFilterCode).trim().toUpperCase() || "TODOS";
    const progName = safeStr(programUsersMeta?.program?.name || programUsersMeta?.program?.code || code);
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");

    // ✅ REQ: NO exportar uid, estatus_usuario, promedio
    const headers = [
      "codigo_programa",
      "nombre_programa",
      "matricula",
      "nombre_completo",
      "correo",
      "curp",
      "estado",
      "estatus_inscripcion",
      "avance_pct",
      "ultima_actividad",
    ];

    const rows = (Array.isArray(usersFiltered) ? usersFiltered : []).map((u) => [
      code,
      progName,
      safeStr(u?.matricula),
      fullNameOf(u),
      safeStr(u?.correo),
      safeStr(u?.curp),
      safeStr(u?.estado),
      toEsGenericStatus(u?.enrollment_status),
      u?.progress_pct ?? "",
      safeStr(u?.last_activity_at),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
    downloadCsv(`participantes_${code}_${y}-${m}-${d}.csv`, csv);
  };

  const exportSelectedProgramProgressCSV = () => {
    if (!selectedUser || !selectedProgram || !programView) return;

    const code = safeStr(
      selectedProgram?.code || selectedProgram?.program_code || selectedProgram?.programCode
    )
      .trim()
      .toUpperCase();
    const progName = safeStr(selectedProgram?.name || programView?.program?.name || code);
    const userName = fullNameOf(selectedUser) || safeStr(selectedUser?.correo) || "Usuario";

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");

    // ✅ REQ: NO exportar uid de ningún tipo
    const headers = [
      "codigo_programa",
      "nombre_programa",
      "matricula_usuario",
      "usuario",
      "codigo_bloque",
      "codigo_modulo",
      "codigo_actividad",
      "actividad",
      "tipo_actividad",
      "requerida",
      "estatus_actividad",
      "intentos",
      "calificacion",
      "estatus_evidencia",
      "archivo_evidencia",
      "url_evidencia",
      "estatus_solicitud",
      "clave_solicitud",
      "titulo_solicitud",
      "comentario_usuario",
      "estatus_revision_editado",
      "calificacion_editada",
      "comentario_revision_editado",
    ];

    const list = Array.isArray(programView?.activities) ? programView.activities : [];

    const rows = list.map((a) => {
      const typeKey = safeStr(a.activity_type);
      const isUpload = typeKey === "upload";
      const isRequest = typeKey === "solicitud";

      const doc = a.doc || null;
      const req = a.request || null;

      const kind =
        isUpload && doc?.doc_id ? "doc" : isRequest && req?.request_id ? "request" : null;
      const itemId =
        kind === "doc" ? doc?.doc_id : kind === "request" ? req?.request_id : null;
      const reviewKey = kind && itemId ? buildReviewKey(kind, itemId) : null;
      const edit = reviewKey ? reviewEdits?.[reviewKey] || {} : {};

      return [
        code,
        progName,
        safeStr(selectedUser?.matricula),
        userName,
        safeStr(a.block_code),
        safeStr(a.module_code),
        safeStr(a.activity_code),
        safeStr(a.activity_title),
        toEsActivityType(typeKey),
        YES_NO(!!a.required),
        toEsActivityStatus(a.status),
        a.attempts ?? "",
        a.score ?? "",
        // doc
        isUpload ? toEsReviewStatus(doc?.doc_status) : "",
        isUpload ? safeStr(doc?.file_name) : "",
        isUpload ? safeStr(doc?.file_url) : "",
        // request
        isRequest ? toEsReviewStatus(req?.status) : "",
        isRequest ? safeStr(req?.request_key) : "",
        isRequest ? safeStr(req?.request_title) : "",
        isRequest ? safeStr(req?.user_comment) : "",
        // overrides (lo que el admin ha editado en UI, si aplica)
        reviewKey ? toEsReviewStatus(edit?.status) : "",
        reviewKey ? edit?.score ?? "" : "",
        reviewKey ? safeStr(edit?.review_note) : "",
      ];
    });

    const csv = [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");

    // ✅ REQ: el nombre del archivo NO debe usar uid
    const fileUserKey =
      safeStr(selectedUser?.matricula) || safeStr(selectedUser?.correo) || "usuario";

    const safeCode = code || "PROGRAMA";
    downloadCsv(`progreso_${safeCode}_${fileUserKey}_${y}-${m}-${d}.csv`, csv);
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

            {programFilterCode ? (
              <Button
                variant="outlined"
                onClick={exportParticipantsCSV}
                sx={{
                  borderRadius: 2,
                  fontWeight: 900,
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.subtle}`,
                  color: COLORS.textMain,
                  px: 2,
                  ml: { xs: 0, md: 1 },
                }}
              >
                Exportar CSV (programa)
              </Button>
            ) : null}
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
          <Stack direction="row" flexWrap="wrap" useFlexGap gap={1.2} alignItems="center">
            <TextField
              select
              size="small"
              label="Filtrar por programa"
              value={programFilterCode}
              onChange={(e) => {
                const v = e.target.value;
                setProgramFilterCode(v);
                // reset filtros extra cuando cambias programa
                setFilterMinAvgScore("");
                setFilterOnlyNoProgress(false);
                setFilterOnlyNoScore(false);
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

            {/* Export CSV (participantes) - solo cuando estás viendo una lista por programa */}
            {programFilterCode ? (
              <Button
                variant="outlined"
                onClick={exportParticipantsCSV}
                sx={{
                  borderRadius: 2,
                  fontWeight: 900,
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.subtle}`,
                  color: COLORS.textMain,
                  px: 2,
                }}
              >
                Exportar CSV (programa)
              </Button>
            ) : null}

            <TextField
              select
              size="small"
              label="Buscar usuario por"
              disabled={!!programFilterCode}
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
              label={programFilterCode ? "Búsqueda (en este programa)" : "Búsqueda"}
              placeholder={programFilterCode ? "Filtra por nombre / matrícula / correo" : "Matrícula / CURP / Correo"}
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

            {/* Filtros extra (solo aplica cuando filtras por programa) */}
            {programFilterCode ? (
              <>
                <TextField
                  size="small"
                  type="number"
                  label="Promedio mínimo"
                  value={filterMinAvgScore}
                  onChange={(e) => setFilterMinAvgScore(e.target.value)}
                  sx={{ width: { xs: "100%", md: 180 }, backgroundColor: COLORS.white }}
                />

                <FormControlLabel
                  sx={{ ml: { xs: 0, md: 0.5 } }}
                  control={<Checkbox checked={filterOnlyNoProgress} onChange={(e) => setFilterOnlyNoProgress(e.target.checked)} />}
                  label="Sin progreso"
                />

                <FormControlLabel
                  sx={{ ml: { xs: 0, md: 0.5 } }}
                  control={<Checkbox checked={filterOnlyNoScore} onChange={(e) => setFilterOnlyNoScore(e.target.checked)} />}
                  label="Sin calificación"
                />
              </>
            ) : null}

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

          {programUsersError && (
            <Alert severity="error" sx={{ borderRadius: 3, mt: 1.5 }}>
              {programUsersError}
            </Alert>
          )}

          <Divider sx={{ my: 1.5, borderColor: COLORS.subtle }} />

          {programFilterCode && programUsersMeta ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2, flexWrap: "wrap" }}>
              <Chip
                label={`Programa: ${safeStr(programUsersMeta?.program?.name)} (${safeStr(programUsersMeta?.program?.code)})`}
                sx={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.subtle}`, fontWeight: 900 }}
              />
              <Chip
                label={`Alumnos: ${safeStr(programUsersMeta?.count)}`}
                sx={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.subtle}`, fontWeight: 900 }}
              />
              {programUsersMeta?.totalActivities !== null && programUsersMeta?.totalActivities !== undefined ? (
                <Chip
                  label={`Actividades del programa: ${safeStr(programUsersMeta?.totalActivities)}`}
                  sx={{ backgroundColor: COLORS.white, border: `1px solid ${COLORS.subtle}`, fontWeight: 900 }}
                />
              ) : null}
            </Stack>
          ) : null}

          <TableContainer sx={{ maxHeight: 360 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: COLORS.whiteSoft, fontWeight: 900 }}>Matrícula</TableCell>
                  <TableCell sx={{ backgroundColor: COLORS.whiteSoft, fontWeight: 900 }}>Nombre</TableCell>
                  <TableCell sx={{ backgroundColor: COLORS.whiteSoft, fontWeight: 900 }}>Correo</TableCell>
                  <TableCell sx={{ backgroundColor: COLORS.whiteSoft, fontWeight: 900 }}>Estado</TableCell>
                  <TableCell sx={{ backgroundColor: COLORS.whiteSoft, fontWeight: 900 }}>Progreso</TableCell>
                  <TableCell sx={{ backgroundColor: COLORS.whiteSoft, fontWeight: 900 }}>Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersLoading || programUsersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 4 }}>
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <CircularProgress size={18} />
                        <Typography sx={{ color: COLORS.textMuted }}>
                          {programFilterCode ? "Cargando…" : "Buscando…"}
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : usersPageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 4 }}>
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
                        <Chip
                          label={safeStr(u?.estado) || "—"}
                          size="small"
                          sx={{
                            backgroundColor: COLORS.white,
                            border: `1px solid ${COLORS.subtle}`,
                            fontWeight: 900,
                            color: COLORS.textMain,
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontWeight: 900, color: COLORS.textMain, fontSize: 13 }}>
                          {u?.progress_pct !== undefined && u?.progress_pct !== null ? `${u.progress_pct}%` : "—"}
                        </Typography>

                        {u?.avg_score !== undefined && u?.avg_score !== null ? (
                          <Typography sx={{ color: COLORS.textMuted, fontSize: 12 }}>
                            Promedio: <b>{safeStr(u.avg_score)}</b>
                          </Typography>
                        ) : (
                          <Typography sx={{ color: COLORS.textMuted, fontSize: 12 }}> </Typography>
                        )}
                      </TableCell>

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

              <Button
                variant="outlined"
                onClick={exportSelectedProgramProgressCSV}
                disabled={!selectedUser || !selectedProgram || !programView}
                sx={{
                  borderRadius: 2,
                  fontWeight: 900,
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.subtle}`,
                  color: COLORS.textMain,
                  px: 2,
                }}
              >
                Exportar CSV (progreso)
              </Button>

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

                        const edit = reviewKey ? reviewEdits?.[reviewKey] || {} : {};
                        const saving = reviewKey ? !!reviewSaving?.[reviewKey] : false;
                        const msg = reviewKey ? reviewSavedMsg?.[reviewKey] || "" : "";

                        const canReview = (isUpload && hasDoc) || (isRequest && hasReq);

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
                                        (kind === "doc" ? doc?.doc_status || "submitted" : req?.status || "submitted")
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