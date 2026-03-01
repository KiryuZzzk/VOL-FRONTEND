// src/pages/Informes.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Tabs,
  Tab,
  Chip,
  Divider,
  Button,
  CircularProgress,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tooltip,
  IconButton,
  Alert,
} from "@mui/material";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import { getAuth } from "firebase/auth";

const COLORS = {
  bg: "#f5f0ff",
  white: "#fcfcfc",
  whiteSoft: "#fff8ff",
  subtle: "#e6dfef",
  red: "#ff3333",
  redDark: "#cc0000",
  textMain: "#2d233a",
  textMuted: "#6c6478",
  green: "#2e7d32",
  amber: "#ed6c02",
  danger: "#d32f2f",
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function safeNumber(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}
function normalizeStr(x) {
  return String(x ?? "").trim();
}
function pct(n) {
  const v = safeNumber(n, 0);
  return `${clamp(Math.round(v), 0, 100)}%`;
}

function downloadBlob(filename, text, mime = "text/plain;charset=utf-8") {
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
function toCsv(rows, columns) {
  const esc = (v) => {
    const s = String(v ?? "");
    const needs = /[,"\n]/.test(s);
    const fixed = s.replace(/"/g, '""');
    return needs ? `"${fixed}"` : fixed;
  };
  const header = columns.map((c) => esc(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(",")).join("\n");
  return `${header}\n${body}\n`;
}

async function getAccessToken() {
  // 1) Firebase (espera breve para evitar carrera al recargar la app)
  try {
    if (getAuth) {
      const auth = getAuth();
      let user = auth?.currentUser || null;
      if (!user && typeof auth?.onAuthStateChanged === "function") {
        user = await new Promise((resolve) => {
          let done = false;
          const timeout = setTimeout(() => {
            if (!done) {
              done = true;
              resolve(auth?.currentUser || null);
            }
          }, 2500);

          const unsub = auth.onAuthStateChanged(
            (u) => {
              if (done) return;
              done = true;
              clearTimeout(timeout);
              try {
                unsub();
              } catch (e) {
                // ignore
              }
              resolve(u || null);
            },
            () => {
              if (done) return;
              done = true;
              clearTimeout(timeout);
              resolve(auth?.currentUser || null);
            }
          );
        });
      }
      if (user?.getIdToken) return await user.getIdToken();
    }
  } catch (e) {
    // ignore
  }
  // 2) localStorage fallback
  const lsToken = localStorage.getItem("token") || localStorage.getItem("idToken");
  return lsToken ? String(lsToken) : null;
}

function getApiBase() {
  // Mantiene compatibilidad con env, y usa el mismo backend por defecto que páginas funcionales.
  const raw = process.env.REACT_APP_API_URL || "https://vol-backend.onrender.com";
  return String(raw).replace(/\/+$/, "");
}

async function apiFetch(path, { method = "GET", body, signal } = {}) {
  const base = getApiBase();
  const token = await getAccessToken();
  const uid = (() => {
    try {
      if (getAuth) {
        const auth = getAuth();
        return auth?.currentUser?.uid || null;
      }
    } catch (e) {
      // ignore
    }
    return null;
  })();

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (uid) headers["x-firebase-uid"] = uid;

  const finalPath = path;

  const res = await fetch(`${base}${finalPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const msg =
      payload?.error ||
      payload?.message ||
      (typeof payload === "string" ? payload : "") ||
      `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    err.path = finalPath;
    throw err;
  }
  return payload;
}

/**
 * Try multiple endpoints until one works.
 * Returns { ok, data, usedPath }
 */
async function apiFetchAny(paths, opts) {
  let lastErr = null;
  for (const p of paths) {
    try {
      const data = await apiFetch(p, opts);
      return { ok: true, data, usedPath: p };
    } catch (e) {
      // Si ya hay error de auth/permisos, no seguir probando rutas.
      if (e?.status === 401 || e?.status === 403) {
        return { ok: false, error: e };
      }
      lastErr = e;
    }
  }
  return { ok: false, error: lastErr };
}

function StatCard({ icon, title, value, subtitle, tone = "default", right }) {
  const toneStyle =
    tone === "ok"
      ? { border: `1px solid ${COLORS.green}` }
      : tone === "warn"
      ? { border: `1px solid ${COLORS.amber}` }
      : tone === "bad"
      ? { border: `1px solid ${COLORS.danger}` }
      : { border: `1px solid ${COLORS.subtle}` };

  return (
    <Card elevation={0} sx={{ borderRadius: 3, backgroundColor: COLORS.white, ...toneStyle }}>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                background: COLORS.whiteSoft,
                border: `1px solid ${COLORS.subtle}`,
                color: COLORS.textMain,
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
                {title}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.15, color: COLORS.textMain }}>
                {value}
              </Typography>
              {subtitle ? (
                <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
          </Stack>
          {right || null}
        </Stack>
      </CardContent>
    </Card>
  );
}

function MiniBar({ label, value, max }) {
  const v = safeNumber(value, 0);
  const m = Math.max(1, safeNumber(max, 1));
  const p = clamp((v / m) * 100, 0, 100);
  return (
    <Stack spacing={0.75}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.textMain }}>
          {v}
        </Typography>
      </Stack>
      <Box sx={{ height: 8, borderRadius: 999, background: COLORS.whiteSoft, border: `1px solid ${COLORS.subtle}`, overflow: "hidden" }}>
        <Box sx={{ height: "100%", width: `${p}%`, background: COLORS.red }} />
      </Box>
    </Stack>
  );
}

function DonutStat({ title, value, total, color = COLORS.red, subtitle }) {
  const v = safeNumber(value, 0);
  const t = Math.max(1, safeNumber(total, 1));
  const p = clamp((v / t) * 100, 0, 100);
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${COLORS.subtle}`, backgroundColor: COLORS.white }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 78,
              height: 78,
              borderRadius: "50%",
              background: `conic-gradient(${color} ${p}%, ${COLORS.whiteSoft} 0)`,
              display: "grid",
              placeItems: "center",
              border: `1px solid ${COLORS.subtle}`,
            }}
          >
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                backgroundColor: COLORS.white,
                display: "grid",
                placeItems: "center",
                border: `1px solid ${COLORS.subtle}`,
              }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: 12, color: COLORS.textMain }}>{pct(p)}</Typography>
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, color: COLORS.textMain }}>{title}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.textMain }}>
              {v} / {total}
            </Typography>
            {subtitle ? (
              <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function StackedSegments({ title, items }) {
  const total = Math.max(1, items.reduce((a, x) => a + safeNumber(x.value, 0), 0));
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${COLORS.subtle}`, backgroundColor: COLORS.white }}>
      <CardContent>
        <Typography sx={{ fontWeight: 900, mb: 1, color: COLORS.textMain }}>{title}</Typography>
        <Box sx={{ height: 14, borderRadius: 999, overflow: "hidden", border: `1px solid ${COLORS.subtle}` }}>
          <Stack direction="row" sx={{ height: "100%" }}>
            {items.map((x) => (
              <Box key={x.label} sx={{ width: `${(safeNumber(x.value, 0) / total) * 100}%`, backgroundColor: x.color }} />
            ))}
          </Stack>
        </Box>
        <Grid container spacing={1} sx={{ mt: 0.8 }}>
          {items.map((x) => (
            <Grid item xs={12} sm={6} key={x.label}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: 999, backgroundColor: x.color }} />
                <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
                  {x.label}: <b>{safeNumber(x.value)}</b>
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, subtitle, right }) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      alignItems={{ xs: "flex-start", md: "center" }}
      justifyContent="space-between"
      spacing={1.5}
      sx={{ mb: 2 }}
    >
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 950, color: COLORS.textMain }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" sx={{ color: COLORS.textMuted }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {right || null}
    </Stack>
  );
}

export default function Informes() {
  const [tab, setTab] = useState(0);
  const [authReady, setAuthReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [viewerRole, setViewerRole] = useState("");

  // loading + error
  const [loading, setLoading] = useState(false);
  const [loadingProgramsSummary, setLoadingProgramsSummary] = useState(false);
  const [loadingProgram, setLoadingProgram] = useState(false);
  const [error, setError] = useState("");

  // data
  const [programs, setPrograms] = useState([]);
  const [selectedProgramCode, setSelectedProgramCode] = useState("");
  const [programView, setProgramView] = useState(null);

  const [users, setUsers] = useState([]);
  const [docs, setDocs] = useState([]);
  const [trayectorias, setTrayectorias] = useState([]);

  // Resumen por programa
  const [programSummaries, setProgramSummaries] = useState([]);

  // filters
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("ALL");
  const [geoFilter, setGeoFilter] = useState("");

  const endpointCandidates = useMemo(
    () => ({
      // Rutas reales usadas en Progresos/Documentos/Trayectorias.
      programs: ["/progreso/admin/programas", "/api/progreso/admin/programas"],

      users: ["/users", "/api/users"],

      docs: ["/documentos", "/api/documentos"],

      tray: ["/trayectoria", "/api/trayectoria"],
    }),
    []
  );

  const fetchAll = useCallback(async () => {
    setError("");
    setLoading(true);

    const ac = new AbortController();
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("No hay sesión activa en Firebase. Inicia sesión de nuevo.");
      }

      // 1) Programas selector (admin/mod)
      const p = await apiFetchAny(endpointCandidates.programs, { signal: ac.signal });
      if (!p.ok) throw p.error;
      setPrograms(Array.isArray(p.data?.programs) ? p.data.programs : Array.isArray(p.data) ? p.data : []);

      // 2) Users
      const u = await apiFetchAny(endpointCandidates.users, { signal: ac.signal });
      if (!u.ok) throw u.error;
      setUsers(Array.isArray(u.data) ? u.data : Array.isArray(u.data?.users) ? u.data.users : []);

      // 3) Docs
      const d = await apiFetchAny(endpointCandidates.docs, { signal: ac.signal });
      if (!d.ok) throw d.error;
      setDocs(Array.isArray(d.data) ? d.data : Array.isArray(d.data?.rows) ? d.data.rows : Array.isArray(d.data?.docs) ? d.data.docs : []);

      // 4) Trayectoria
      const t = await apiFetchAny(endpointCandidates.tray, { signal: ac.signal });
      if (!t.ok) throw t.error;
      setTrayectorias(Array.isArray(t.data) ? t.data : Array.isArray(t.data?.rows) ? t.data.rows : Array.isArray(t.data?.trayectorias) ? t.data.trayectorias : []);
    } catch (e) {
      console.error(e);
      setError(
        `No pude cargar datos. Último error: ${e?.message || "desconocido"} ${e?.path ? `(${e.path})` : ""}`
      );
    } finally {
      setLoading(false);
    }

    return () => ac.abort();
  }, [endpointCandidates]);

  const fetchProgram = useCallback(
    async (programCode) => {
      if (!programCode) {
        setProgramView(null);
        return;
      }

      setError("");
      setLoadingProgram(true);

      const ac = new AbortController();
      try {
        const token = await getAccessToken();
        if (!token) {
          throw new Error("No hay sesión activa en Firebase. Inicia sesión de nuevo.");
        }
        // Esta ruta sí está documentada en tu controller:
        // GET /progreso/admin/programs/:programId/users
        const pv = await apiFetchAny(
          [
            `/progreso/admin/programas/${encodeURIComponent(programCode)}/users`,
            `/api/progreso/admin/programas/${encodeURIComponent(programCode)}/users`,
            `/progreso/admin/programs/${encodeURIComponent(programCode)}/users`,
            `/progreso/admin/program/${encodeURIComponent(programCode)}/users`,
            `/progreso/admin/programs/${encodeURIComponent(programCode)}`,
          ],
          { signal: ac.signal }
        );

        if (!pv.ok) throw pv.error;
        setProgramView(pv.data || null);
      } catch (e) {
        console.error(e);
        setError(`Error cargando vista del programa: ${e?.message || "desconocido"} ${e?.path ? `(${e.path})` : ""}`);
        setProgramView(null);
      } finally {
        setLoadingProgram(false);
      }

      return () => ac.abort();
    },
    []
  );

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.onAuthStateChanged) {
      setAuthReady(true);
      setHasSession(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((u) => {
      setHasSession(!!u);
      setAuthReady(true);
    });

    return () => {
      try {
        unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!hasSession) {
      setError("No hay sesión activa en Firebase. Inicia sesión para cargar Informes.");
      return;
    }
    fetchAll();
  }, [fetchAll, authReady, hasSession]);

  useEffect(() => {
    if (!hasSession) return;
    let active = true;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch(`${getApiBase()}/public/validar-usuario`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        const roleName = normalizeStr(data?.rol?.nombre_rol).toLowerCase();
        setViewerRole(roleName);
        const estadoUsuario = normalizeStr(data?.estado).toUpperCase();
        if (roleName === "moderador" && estadoUsuario) {
          setEstadoFilter(estadoUsuario);
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      active = false;
    };
  }, [hasSession]);

  useEffect(() => {
    if (selectedProgramCode) fetchProgram(selectedProgramCode);
  }, [selectedProgramCode, fetchProgram]);
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Filters
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const estadosList = useMemo(() => {
    const set = new Set();
    (users || []).forEach((u) => {
      const e = normalizeStr(u?.estado).toUpperCase();
      if (e) set.add(e);
    });
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
  }, [users]);

  const usersFiltered = useMemo(() => {
    const q = normalizeStr(search).toLowerCase();
    const est = normalizeStr(estadoFilter).toUpperCase();
    const geo = normalizeStr(geoFilter).toLowerCase();

    return (users || []).filter((u) => {
      if (est !== "ALL" && normalizeStr(u?.estado).toUpperCase() !== est) return false;
      if (geo) {
        const local = normalizeStr(u?.colonia || u?.delegacion || u?.municipio || u?.alcaldia).toLowerCase();
        if (!local.includes(geo)) return false;
      }
      if (!q) return true;
      const hay = [
        u?.matricula,
        u?.correo,
        u?.curp,
        u?.nombre,
        u?.apellido_paterno,
        u?.apellido_materno,
        u?.apellido_pat,
        u?.apellido_mat,
        u?.colonia,
        u?.delegacion,
        u?.municipio,
        u?.alcaldia,
      ]
        .map((x) => normalizeStr(x).toLowerCase())
        .join(" ");
      return hay.includes(q);
    });
  }, [users, search, estadoFilter, geoFilter]);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Inteligencia de documentos
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const DOC_URL_FIELDS = useMemo(
    () => [
      { key: "curp_url", label: "CURP" },
      { key: "acta_nacimiento_url", label: "Acta" },
      { key: "ine_url", label: "INE" },
      { key: "cv_url", label: "CV" },
      { key: "nss_url", label: "NSS" },
      { key: "constancia_url", label: "Constancia" },
      { key: "foto_url", label: "Foto" },
      { key: "certificado_medico_url", label: "Cert. médico" },
    ],
    []
  );

  const DOC_STATUS_FIELDS = useMemo(
    () => [
      { key: "curp_estado", label: "CURP" },
      { key: "acta_nacimiento_estado", label: "Acta" },
      { key: "ine_estado", label: "INE" },
      { key: "cv_estado", label: "CV" },
      { key: "nss_estado", label: "NSS" },
      { key: "constancia_estado", label: "Constancia" },
      { key: "foto_estado", label: "Foto" },
      { key: "certificado_medico_estado", label: "Cert. médico" },
    ],
    []
  );

  const docsAgg = useMemo(() => {
    // docs rows tÃ­picamente son por usuario (documentos table)
    let noUploads = 0;
    let oneDocOnly = 0;
    let anyUploads = 0;

    const byDoc = {};
    DOC_URL_FIELDS.forEach((d) => {
      byDoc[d.key] = { label: d.label, uploaded: 0, missing: 0 };
    });

    const byStatus = {};
    DOC_STATUS_FIELDS.forEach((d) => {
      byStatus[d.key] = { label: d.label, pendiente: 0, validado: 0, rechazado: 0, none: 0 };
    });

    (docs || []).forEach((r) => {
      let uploadedCount = 0;

      DOC_URL_FIELDS.forEach((d) => {
        const has = !!normalizeStr(r?.[d.key]);
        if (has) {
          uploadedCount += 1;
          byDoc[d.key].uploaded += 1;
        } else {
          byDoc[d.key].missing += 1;
        }
      });

      if (uploadedCount === 0) noUploads += 1;
      else {
        anyUploads += 1;
        if (uploadedCount === 1) oneDocOnly += 1;
      }

      DOC_STATUS_FIELDS.forEach((d) => {
        const st = normalizeStr(r?.[d.key]).toLowerCase();
        if (!st) byStatus[d.key].none += 1;
        else if (st === "pendiente") byStatus[d.key].pendiente += 1;
        else if (st === "validado") byStatus[d.key].validado += 1;
        else if (st === "rechazado") byStatus[d.key].rechazado += 1;
        else byStatus[d.key].none += 1;
      });
    });

    const totalRows = (docs || []).length;
    return {
      totalRows,
      noUploads,
      anyUploads,
      oneDocOnly,
      byDoc,
      byStatus,
    };
  }, [docs, DOC_URL_FIELDS, DOC_STATUS_FIELDS]);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Trayectoria agg
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const trayAgg = useMemo(() => {
    const pending = (trayectorias || []).filter((x) => normalizeStr(x?.status).toLowerCase() === "pending").length;
    const validated = (trayectorias || []).filter((x) => normalizeStr(x?.status).toLowerCase() === "validated").length;
    const rejected = (trayectorias || []).filter((x) => normalizeStr(x?.status).toLowerCase() === "rejected").length;
    return { pending, validated, rejected, total: (trayectorias || []).length };
  }, [trayectorias]);

  const trayCategoryCounts = useMemo(() => {
    const base = {
      "Credencial CRM": 0,
      Licenciatura: 0,
      Diplomado: 0,
      Credencial: 0,
      Otros: 0,
    };
    (trayectorias || []).forEach((t) => {
      const text = [
        t?.categoria,
        t?.category,
        t?.request_key,
        t?.request_title,
        t?.title,
        t?.nombre,
        t?.description,
      ]
        .map((x) => normalizeStr(x).toLowerCase())
        .join(" ");

      if (text.includes("crm") && text.includes("credencial")) base["Credencial CRM"] += 1;
      else if (text.includes("licenciatura")) base.Licenciatura += 1;
      else if (text.includes("diplomado")) base.Diplomado += 1;
      else if (text.includes("credencial")) base.Credencial += 1;
      else base.Otros += 1;
    });
    return base;
  }, [trayectorias]);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Global KPIs
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const kpis = useMemo(() => {
    const totalUsers = usersFiltered.length;
    const entrevistadoSi = usersFiltered.filter((u) => normalizeStr(u?.entrevistado).toLowerCase() === "si").length;
    const entrevistadoNo = usersFiltered.filter((u) => normalizeStr(u?.entrevistado).toLowerCase() === "no").length;
    const entrevistadoNA = Math.max(0, totalUsers - entrevistadoSi - entrevistadoNo);

    return {
      totalUsers,
      entrevistadoSi,
      entrevistadoNo,
      entrevistadoNA,
    };
  }, [usersFiltered]);

  const docsStatusTotals = useMemo(() => {
    const acc = { pendiente: 0, validado: 0, rechazado: 0 };
    Object.values(docsAgg.byStatus || {}).forEach((d) => {
      acc.pendiente += safeNumber(d?.pendiente, 0);
      acc.validado += safeNumber(d?.validado, 0);
      acc.rechazado += safeNumber(d?.rechazado, 0);
    });
    return acc;
  }, [docsAgg]);

  const topPrograms = useMemo(() => {
    return (programSummaries || [])
      .filter((p) => !p.error)
      .slice()
      .sort((a, b) => safeNumber(b.total) - safeNumber(a.total))
      .slice(0, 6);
  }, [programSummaries]);

  const estadoStats = useMemo(() => {
    const map = new Map();
    (users || []).forEach((u) => {
      const estado = normalizeStr(u?.estado) || "Sin estado";
      const row = map.get(estado) || { estado, total: 0, entrevistadoSi: 0 };
      row.total += 1;
      if (normalizeStr(u?.entrevistado).toLowerCase() === "si") row.entrevistadoSi += 1;
      map.set(estado, row);
    });
    return Array.from(map.values()).sort((a, b) => safeNumber(b.total) - safeNumber(a.total));
  }, [users]);

  const uniqueLocalidades = useMemo(() => {
    const s = new Set(
      (users || [])
        .map((u) => normalizeStr(u?.colonia || u?.delegacion || u?.municipio || u?.alcaldia))
        .filter(Boolean)
    );
    return Array.from(s).sort((a, b) => a.localeCompare(b, "es"));
  }, [users]);

  const isModerator = viewerRole === "moderador";

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Program view agg
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const programAgg = useMemo(() => {
    const pvUsers = Array.isArray(programView?.users) ? programView.users : [];
    const total = pvUsers.length;

    const completedEnroll = pvUsers.filter((u) => normalizeStr(u?.enrollment_status) === "completed").length;

    const avgProgress =
      total > 0 ? pvUsers.reduce((acc, u) => acc + safeNumber(u?.progress_pct, 0), 0) / total : 0;

    const avgScoreBase = pvUsers.filter((u) => u?.avg_score != null);
    const avgScore =
      avgScoreBase.length > 0 ? avgScoreBase.reduce((acc, u) => acc + safeNumber(u?.avg_score, 0), 0) / avgScoreBase.length : null;

    const inactive = pvUsers.filter((u) => !u?.last_activity_at || safeNumber(u?.progress_pct, 0) <= 0).length;

    const buckets = {
      "0%": 0,
      "1-24%": 0,
      "25-49%": 0,
      "50-74%": 0,
      "75-99%": 0,
      "100%": 0,
    };

    pvUsers.forEach((u) => {
      const p = clamp(safeNumber(u?.progress_pct, 0), 0, 100);
      if (p >= 100) buckets["100%"] += 1;
      else if (p >= 75) buckets["75-99%"] += 1;
      else if (p >= 50) buckets["50-74%"] += 1;
      else if (p >= 25) buckets["25-49%"] += 1;
      else if (p >= 1) buckets["1-24%"] += 1;
      else buckets["0%"] += 1;
    });

    const maxBucket = Math.max(1, ...Object.values(buckets));

    return { total, completedEnroll, avgProgress, avgScore, inactive, buckets, maxBucket };
  }, [programView]);

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Resumen para todos los programas
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const buildProgramSummaries = useCallback(async () => {
    if (!programs.length) return;

    setLoadingProgramsSummary(true);
    setError("");

    const ac = new AbortController();
    try {
      // Hace N requests (1 por programa).
      // Si quieres performance pro, despuÃ©s te hago endpoint /progreso/admin/stats/programas
      const results = await Promise.all(
        programs.map(async (p) => {
          const programCode = normalizeStr(p?.code).toUpperCase();
          if (!programCode) {
            return {
              program_id: p.program_id,
              code: p.code,
              name: p.name,
              error: "programa sin code",
            };
          }

          const r = await apiFetchAny(
            [
              `/progreso/admin/programas/${encodeURIComponent(programCode)}/users`,
              `/api/progreso/admin/programas/${encodeURIComponent(programCode)}/users`,
              `/progreso/admin/programs/${encodeURIComponent(programCode)}/users`,
              `/progreso/admin/program/${encodeURIComponent(programCode)}/users`,
            ],
            { signal: ac.signal }
          );

          if (!r.ok) {
            return {
              program_id: p.program_id,
              code: p.code,
              name: p.name,
              error: r.error?.message || "error",
            };
          }

          const pv = r.data;
          const rows = Array.isArray(pv?.users) ? pv.users : [];
          const total = rows.length;
          const completedEnroll = rows.filter((u) => normalizeStr(u?.enrollment_status) === "completed").length;
          const avgProgress = total ? rows.reduce((a, u) => a + safeNumber(u?.progress_pct, 0), 0) / total : 0;

          const avgScoreBase = rows.filter((u) => u?.avg_score != null);
          const avgScore = avgScoreBase.length
            ? avgScoreBase.reduce((a, u) => a + safeNumber(u?.avg_score, 0), 0) / avgScoreBase.length
            : null;

          const inactive = rows.filter((u) => !u?.last_activity_at || safeNumber(u?.progress_pct, 0) <= 0).length;

          return {
            program_id: p.program_id,
            code: p.code,
            name: p.name,
            total,
            completedEnroll,
            avgProgress,
            avgScore,
            inactive,
          };
        })
      );

      setProgramSummaries(results);
    } catch (e) {
      console.error(e);
      setError(`No pude armar el resumen por programa: ${e?.message || "desconocido"}`);
    } finally {
      setLoadingProgramsSummary(false);
    }

    return () => ac.abort();
  }, [programs]);


  useEffect(() => {
    if (!hasSession || !programs.length) return;
    buildProgramSummaries();
  }, [programs, hasSession, buildProgramSummaries]);


  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Exporters
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const exportProgramSummariesCsv = useCallback(() => {
    const rows = (programSummaries || []).map((p) => ({
      code: p.code,
      name: p.name,
      total: p.total,
      completedEnroll: p.completedEnroll,
      avgProgress: p.avgProgress != null ? Math.round(p.avgProgress) : "",
      avgScore: p.avgScore != null ? Number(p.avgScore).toFixed(2) : "",
      inactive: p.inactive,
      error: p.error || "",
    }));

    const csv = toCsv(rows, [
      { key: "code", label: "Código" },
      { key: "name", label: "Programa" },
      { key: "total", label: "Inscritos" },
      { key: "completedEnroll", label: "Inscripción completada" },
      { key: "avgProgress", label: "Progreso promedio (%)" },
      { key: "avgScore", label: "Calificación promedio" },
      { key: "inactive", label: "Inactivos (0%)" },
      { key: "error", label: "Error" },
    ]);

    downloadBlob("programas_resumen_ceo.csv", csv, "text/csv;charset=utf-8");
  }, [programSummaries]);

  const headerRight = (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      <Tooltip title="Actualizar todo">
        <IconButton
          onClick={fetchAll}
          disabled={loading}
          sx={{ border: `1px solid ${COLORS.subtle}`, borderRadius: 2, backgroundColor: COLORS.white }}
        >
          <RefreshRoundedIcon />
        </IconButton>
      </Tooltip>

      <Button
        variant="outlined"
        startIcon={<DownloadRoundedIcon />}
        onClick={exportProgramSummariesCsv}
        sx={{
          borderRadius: 999,
          textTransform: "none",
          fontWeight: 900,
          borderColor: COLORS.subtle,
          color: COLORS.textMain,
          backgroundColor: COLORS.white,
          "&:hover": { borderColor: COLORS.subtle, backgroundColor: COLORS.whiteSoft },
        }}
        disabled={!programSummaries.length}
      >
        Exportar CSV
      </Button>
    </Stack>
  );

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: COLORS.bg, py: 2 }}>
      <Container maxWidth="xl" sx={{ py: 1 }}>
      <SectionHeader
        title="Informes"
        subtitle="Panorama general de usuarios, programas, documentos y trayectoria."
        right={headerRight}
      />

      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2, border: `1px solid ${COLORS.subtle}` }}>
          {error}
        </Alert>
      ) : null}

      <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${COLORS.subtle}`, backgroundColor: COLORS.white, mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                label="Buscar (matrícula, correo, CURP, nombre...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
              />
            </Grid>

            {isModerator ? (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Colonia/Delegación</InputLabel>
                  <Select
                    label="Colonia/Delegación"
                    value={geoFilter}
                    onChange={(e) => setGeoFilter(e.target.value)}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {uniqueLocalidades.map((loc) => (
                      <MenuItem key={loc} value={loc}>
                        {loc}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ) : (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select label="Estado" value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
                    {estadosList.map((e) => (
                      <MenuItem key={e} value={e}>
                        {e === "ALL" ? "Todos" : e}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

          </Grid>

          <Divider sx={{ my: 2, borderColor: COLORS.subtle }} />

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTabs-indicator": { backgroundColor: COLORS.red, height: 3, borderRadius: 3 },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 900,
                minHeight: 44,
                color: COLORS.textMuted,
                borderRadius: 2,
              },
              "& .Mui-selected": { color: `${COLORS.textMain} !important`, backgroundColor: COLORS.whiteSoft },
            }}
          >
            <Tab label="Panorama general" />
            <Tab label="Detalle por programa" />
            <Tab label="Documentos (subidas + estatus)" />
            <Tab label="Trayectoria" />
          </Tabs>
        </CardContent>
      </Card>

      {loading ? (
        <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${COLORS.subtle}`, backgroundColor: COLORS.white }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={22} />
              <Typography sx={{ fontWeight: 900, color: COLORS.textMain }}>Cargando datos...</Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : null}
      {!loading && tab === 0 ? (
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <StatCard icon={<PeopleAltRoundedIcon />} title="Usuarios" value={kpis.totalUsers} subtitle="según filtros actuales" />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                icon={<FactCheckRoundedIcon />}
                title="Entrevistados"
                value={kpis.entrevistadoSi}
                subtitle={`${kpis.entrevistadoNo} no · ${kpis.entrevistadoNA} sin dato`}
                tone={kpis.entrevistadoNA ? "warn" : "ok"}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                icon={<FolderRoundedIcon />}
                title="Sin documentos"
                value={docsAgg.noUploads}
                subtitle={`de ${docsAgg.totalRows} registros`}
                tone={docsAgg.noUploads ? "warn" : "ok"}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                icon={<SchoolRoundedIcon />}
                title="Trayectoria pendiente"
                value={trayAgg.pending}
                subtitle={`${trayAgg.validated} validadas`}
                tone={trayAgg.pending ? "warn" : "ok"}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <DonutStat title="Entrevistas completas" value={kpis.entrevistadoSi} total={Math.max(1, kpis.totalUsers)} color={COLORS.red} />
            </Grid>
            <Grid item xs={12} md={4}>
              <DonutStat title="Con documentos cargados" value={docsAgg.anyUploads} total={Math.max(1, docsAgg.totalRows)} color={COLORS.green} />
            </Grid>
            <Grid item xs={12} md={4}>
              <DonutStat title="Trayectoria validada" value={trayAgg.validated} total={Math.max(1, trayAgg.total)} color={COLORS.amber} />
            </Grid>

            <Grid item xs={12} md={6}>
              <StackedSegments
                title="Estatus de trayectoria"
                items={[
                  { label: "Pendiente", value: trayAgg.pending, color: COLORS.amber },
                  { label: "Validado", value: trayAgg.validated, color: COLORS.green },
                  { label: "Rechazado", value: trayAgg.rejected, color: COLORS.danger },
                ]}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StackedSegments
                title="Estatus documental global"
                items={[
                  { label: "Pendiente", value: docsStatusTotals.pendiente, color: COLORS.amber },
                  { label: "Validado", value: docsStatusTotals.validado, color: COLORS.green },
                  { label: "Rechazado", value: docsStatusTotals.rechazado, color: COLORS.danger },
                ]}
              />
            </Grid>

            <Grid item xs={12}>
              <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${COLORS.subtle}`, backgroundColor: COLORS.white }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 950, color: COLORS.textMain }}>
                      Programas con mayor matrícula
                    </Typography>
                    {loadingProgramsSummary ? <Chip size="small" label="Actualizando..." /> : null}
                  </Stack>
                  {!topPrograms.length ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Aún no hay datos de programas para esta gráfica.
                    </Alert>
                  ) : (
                    <Stack spacing={1.25}>
                      {topPrograms.map((p) => (
                        <Box key={`top-${p.code || p.program_id}`}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography sx={{ fontWeight: 900, color: COLORS.textMain }}>
                              {p.name} ({p.code})
                            </Typography>
                            <Typography variant="body2" sx={{ color: COLORS.textMuted, fontWeight: 900 }}>
                              {safeNumber(p.total)} inscritos
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={
                              (safeNumber(p.total) /
                                Math.max(1, ...topPrograms.map((x) => safeNumber(x.total)))) *
                              100
                            }
                            sx={{
                              mt: 0.75,
                              height: 10,
                              borderRadius: 999,
                              backgroundColor: COLORS.whiteSoft,
                              "& .MuiLinearProgress-bar": { backgroundColor: COLORS.red },
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      ) : null}

      {!loading && tab === 1 ? (
        <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${COLORS.subtle}`, backgroundColor: COLORS.white }}>
          <CardContent>
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={12} md={10} lg={8}>
                <FormControl fullWidth>
                  <InputLabel>Programa para detalle</InputLabel>
                  <Select
                    label="Programa para detalle"
                    value={selectedProgramCode}
                    onChange={(e) => setSelectedProgramCode(e.target.value)}
                  >
                    <MenuItem value="">— Sin seleccionar —</MenuItem>
                    {programs.map((p) => (
                      <MenuItem key={p.code || p.program_id} value={p.code || ""}>
                        {p.name} ({p.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <InsightsRoundedIcon />
              <Typography variant="h6" sx={{ fontWeight: 950, color: COLORS.textMain }}>
                Detalle por programa
              </Typography>
              {programView?.program?.code ? <Chip size="small" label={`${programView.program.name} (${programView.program.code})`} /> : null}
            </Stack>
            {!selectedProgramCode ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>Selecciona un programa para ver el detalle.</Alert>
            ) : loadingProgram ? (
              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 900, color: COLORS.textMain }}>Cargando programa...</Typography>
                <LinearProgress />
              </Stack>
            ) : !programView ? (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>No se pudo cargar este programa. Intenta actualizar.</Alert>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <StatCard icon={<PeopleAltRoundedIcon />} title="Inscritos" value={programAgg.total} subtitle="usuarios en programa" />
                </Grid>
                <Grid item xs={12} md={3}>
                  <StatCard icon={<FactCheckRoundedIcon />} title="Inscripción completada" value={programAgg.completedEnroll} subtitle={programAgg.total ? `${pct((programAgg.completedEnroll / programAgg.total) * 100)} del total` : "-"} tone={programAgg.total && programAgg.completedEnroll < programAgg.total ? "warn" : "ok"} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <StatCard icon={<InsightsRoundedIcon />} title="Progreso promedio" value={pct(programAgg.avgProgress)} subtitle="porcentaje promedio" />
                </Grid>
                <Grid item xs={12} md={3}>
                  <StatCard icon={<SchoolRoundedIcon />} title="Calificación promedio" value={programAgg.avgScore != null ? Number(programAgg.avgScore).toFixed(2) : "-"} subtitle="usuarios con score" tone={programAgg.avgScore == null ? "warn" : "ok"} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${COLORS.subtle}`, backgroundColor: COLORS.white }}>
                    <CardContent>
                      <Typography sx={{ fontWeight: 950, mb: 1, color: COLORS.textMain }}>Distribución de progreso</Typography>
                      <Stack spacing={1}>
                        {Object.entries(programAgg.buckets).map(([k, v]) => (
                          <MiniBar key={k} label={k} value={v} max={programAgg.maxBucket} />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <StackedSegments
                    title="Riesgo operativo"
                    items={[
                      { label: "Inactivos", value: programAgg.inactive, color: COLORS.danger },
                      { label: "Activos", value: Math.max(0, programAgg.total - programAgg.inactive), color: COLORS.green },
                    ]}
                  />
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      ) : null}

      {!loading && tab === 2 ? (
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <StatCard icon={<FolderRoundedIcon />} title="Sin subir nada" value={docsAgg.noUploads} subtitle={`de ${docsAgg.totalRows} registros`} tone={docsAgg.noUploads ? "warn" : "ok"} />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard icon={<FolderRoundedIcon />} title="Solo 1 documento" value={docsAgg.oneDocOnly} subtitle="usuarios que apenas empezaron" tone={docsAgg.oneDocOnly ? "warn" : "ok"} />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard icon={<FolderRoundedIcon />} title="Con avance documental" value={docsAgg.anyUploads} subtitle="al menos un documento" tone="ok" />
            </Grid>

            <Grid item xs={12}>
              <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${COLORS.subtle}`, backgroundColor: COLORS.white }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 950, mb: 1, color: COLORS.textMain }}>Subidas por documento</Typography>
                  {(() => {
                    const items = Object.values(docsAgg.byDoc || {});
                    const max = Math.max(1, ...items.map((x) => x.uploaded));
                    return (
                      <Grid container spacing={2}>
                        {items.map((d) => (
                          <Grid item xs={12} md={6} lg={3} key={d.label}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${COLORS.subtle}`, backgroundColor: COLORS.white }}>
                              <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Typography sx={{ fontWeight: 950, color: COLORS.textMain }}>{d.label}</Typography>
                                  <Chip size="small" label={`Subido: ${d.uploaded}`} />
                                </Stack>
                                <Divider sx={{ my: 1.5 }} />
                                <MiniBar label="Subidos" value={d.uploaded} max={max} />
                                <MiniBar label="No subidos" value={d.missing} max={Math.max(1, docsAgg.totalRows)} />
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    );
                  })()}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      ) : null}

      {!loading && tab === 3 ? (
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <StatCard icon={<FolderRoundedIcon />} title="Pendientes" value={trayAgg.pending} subtitle="requieren revisión" tone={trayAgg.pending ? "warn" : "ok"} />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard icon={<FactCheckRoundedIcon />} title="Validados" value={trayAgg.validated} subtitle="aprobados" tone="ok" />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard icon={<InsightsRoundedIcon />} title="Rechazados" value={trayAgg.rejected} subtitle="con observaciones" tone={trayAgg.rejected ? "bad" : "default"} />
            </Grid>

            <Grid item xs={12}>
              <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${COLORS.subtle}`, backgroundColor: COLORS.white }}>
                <CardContent>
                  <Typography sx={{ fontWeight: 950, mb: 1, color: COLORS.textMain }}>
                    Conteo por categoría de trayectoria
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(trayCategoryCounts).map(([k, v]) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={`cat-${k}`}>
                        <Card elevation={0} sx={{ borderRadius: 2.5, border: `1px solid ${COLORS.subtle}`, backgroundColor: COLORS.whiteSoft }}>
                          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                            <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 800 }}>
                              {k}
                            </Typography>
                            <Typography sx={{ fontSize: 26, fontWeight: 950, color: COLORS.textMain }}>
                              {safeNumber(v)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <StackedSegments
                title="Distribución de trayectoria"
                items={[
                  { label: "Pendiente", value: trayAgg.pending, color: COLORS.amber },
                  { label: "Validado", value: trayAgg.validated, color: COLORS.green },
                  { label: "Rechazado", value: trayAgg.rejected, color: COLORS.danger },
                ]}
              />
            </Grid>
          </Grid>
        </Box>
      ) : null}
      </Container>
    </Box>
  );
}









