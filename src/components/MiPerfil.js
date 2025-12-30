// src/components/MiPerfil.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Chip,
  Stack,
  Avatar,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import { auth } from "../firebase";
import {
  FiRefreshCw,
  FiUser,
  FiFileText,
  FiExternalLink,
  FiDownload,
  FiCopy,
  FiAlertCircle,
  FiCheckCircle,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";

import FormDocumentos from "./FormDocumentos";

const COLORS = {
  bg: "#fff8ff",
  white: "#fff",
  subtle: "#e6dfef",
  red: "#ff3333",
  lilac: "#f3eaff",
};
const BACKEND_URL = "https://vol-backend.onrender.com";
const DEBUG = false;

/* =============== UI helpers =============== */
function Section({ title, children, dense, sx }) {
  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: COLORS.white,
        border: `1px solid ${COLORS.subtle}`,
        borderRadius: 3,
        p: dense ? 2 : 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...sx,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: COLORS.red,
          fontWeight: 900,
          mb: dense ? 1.5 : 2,
          letterSpacing: 0.3,
        }}
      >
        {title}
      </Typography>
      <Box sx={{ flex: 1 }}>{children}</Box>
    </Paper>
  );
}

function Row({ label, value }) {
  const show = value ?? "—";
  const isNode = React.isValidElement(show);
  return (
    <Box sx={{ display: "flex", gap: 1, py: 0.5, alignItems: "baseline" }}>
      <Typography
        variant="body2"
        sx={{ minWidth: 190, color: "#555", fontWeight: 700 }}
      >
        {label}
      </Typography>
      <Box sx={{ color: "#222" }}>
        {isNode ? (
          show
        ) : (
          <Typography variant="body2">
            {show === undefined || show === null || show === "" ? "—" : show}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function StatusChip({ status }) {
  const s = (status || "").toString().toLowerCase();
  let color = "default";
  let label = status || "—";

  if (["aprobado", "aprobada", "aceptado"].includes(s)) color = "success";
  else if (
    ["rechazado", "rechazada", "invalido", "inválido"].includes(s)
  )
    color = "error";
  else if (["pendiente", "en revisión", "revision"].includes(s))
    color = "warning";

  return (
    <Chip
      label={label}
      size="small"
      color={color === "default" ? undefined : color}
      variant={color === "default" ? "outlined" : "filled"}
      sx={{ fontSize: "0.7rem", textTransform: "uppercase" }}
    />
  );
}

function StatPill({ label, value, color = COLORS.red }) {
  return (
    <Box
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: 999,
        border: `1px solid ${COLORS.subtle}`,
        display: "flex",
        flexDirection: "column",
        minWidth: 90,
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: "#777", textTransform: "uppercase", mb: 0.5 }}
      >
        {label}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, color }}>
        {value}
      </Typography>
    </Box>
  );
}

function prettyBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const e = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, e)).toFixed(1)} ${units[e]}`;
}

function dateOnly(value) {
  if (!value) return "—";
  const s = String(value);
  if (s.includes("T")) return s.slice(0, 10);
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch (e) {
    // ignore
  }
  return s;
}

/* =============== Normalización perfil/documents =============== */

function firstNonEmpty(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

function mergeProfilesPriority(main, fallback) {
  const out = { ...(fallback || {}) };
  for (const [k, v] of Object.entries(main || {})) {
    if (
      v !== undefined &&
      v !== null &&
      v !== "" &&
      JSON.stringify(v) !== JSON.stringify(out[k])
    ) {
      out[k] = v;
    }
  }
  return out;
}

function hasAnyData(profile) {
  return Object.values(profile || {}).some(
    (v) => v !== undefined && v !== null && v !== ""
  );
}

function pickUserObject(res) {
  if (!res) return null;
  if (Array.isArray(res) && res.length === 1) return res[0];
  if (!Array.isArray(res) && typeof res === "object") {
    if (res.user) return res.user;
    if (res.data) return res.data;
    const keys = Object.keys(res);
    for (const k of keys) {
      const c = res[k];
      if (!c) continue;
      if (Array.isArray(c) && c.length === 1) return c[0];
      if (!Array.isArray(c) && typeof c === "object") return c;
    }
  }
  return res;
}

function normalizeProfile(rawIn = {}) {
  const raw = pickUserObject(rawIn) || {};
  if (DEBUG) console.log("🧩 normalizing profile from:", rawIn);

  return {
    nombre: firstNonEmpty(raw, ["nombre", "name"]),
    apellidoPat: firstNonEmpty(raw, [
      "apellidoPat",
      "apellido_pat",
      "apellido_paterno",
    ]),
    apellidoMat: firstNonEmpty(raw, [
      "apellidoMat",
      "apellido_mat",
      "apellido_materno",
    ]),
    fechaNacimiento: firstNonEmpty(raw, [
      "fechaNacimiento",
      "fecha_nacimiento",
    ]),
    curp:
      (firstNonEmpty(raw, ["curp", "CURP"]) || "")
        .toString()
        .toUpperCase() || undefined,
    sexo: firstNonEmpty(raw, ["sexo", "genero"]),
    estadoCivil: firstNonEmpty(raw, ["estadoCivil", "estado_civil"]),
    telefono: firstNonEmpty(raw, ["telefono", "tel"]),
    celular: firstNonEmpty(raw, ["celular", "mobile"]),
    emergenciaNombre: firstNonEmpty(raw, [
      "emergenciaNombre",
      "emergencia_nombre",
    ]),
    emergenciaRelacion: firstNonEmpty(raw, [
      "emergenciaRelacion",
      "emergencia_relacion",
    ]),
    emergenciaTelefono: firstNonEmpty(raw, [
      "emergenciaTelefono",
      "emergencia_telefono",
    ]),
    emergenciaCelular: firstNonEmpty(raw, [
      "emergenciaCelular",
      "emergencia_celular",
    ]),
    gradoEstudios: firstNonEmpty(raw, ["gradoEstudios", "grado_estudios"]),
    especificaEstudios: firstNonEmpty(raw, [
      "especificaEstudios",
      "especifica_estudios",
    ]),
    ocupacion: firstNonEmpty(raw, ["ocupacion"]),
    empresa: firstNonEmpty(raw, ["empresa"]),
    idiomas: firstNonEmpty(raw, ["idiomas"]),
    porcentajeIdioma: firstNonEmpty(raw, [
      "porcentajeIdioma",
      "porcentaje_idioma",
    ]),
    licencias: firstNonEmpty(raw, ["licencias"]),
    tipoLicencia: firstNonEmpty(raw, ["tipoLicencia", "tipo_licencia"]),
    pasaporte: firstNonEmpty(raw, ["pasaporte"]),
    otroDocumento: firstNonEmpty(raw, ["otroDocumento", "otro_documento"]),
    tipoSangre: firstNonEmpty(raw, ["tipoSangre", "tipo_sangre"]),
    rh:
      (firstNonEmpty(raw, ["rh", "RH", "factor"]) || "")
        .toString()
        .toUpperCase() || undefined,
    enfermedades: firstNonEmpty(raw, ["enfermedades"]),
    alergias: firstNonEmpty(raw, ["alergias"]),
    medicamentos: firstNonEmpty(raw, ["medicamentos"]),
    ejercicio: firstNonEmpty(raw, ["ejercicio"]),
    comoSeEntero: firstNonEmpty(raw, ["comoSeEntero", "como_se_entero"]),
    motivoInteres: firstNonEmpty(raw, ["motivoInteres", "motivo_interes"]),
    voluntariadoPrevio: firstNonEmpty(raw, [
      "voluntariadoPrevio",
      "voluntariado_previo",
    ]),
    razonProyecto: firstNonEmpty(raw, ["razonProyecto", "razon_proyecto"]),
    estado: firstNonEmpty(raw, ["estado"]),
    colonia: firstNonEmpty(raw, ["colonia", "municipio"]),
    cp: firstNonEmpty(raw, ["cp", "codigo_postal"]),
    coordinacion: firstNonEmpty(raw, ["coordinacion", "coordinación"]),
    rol:
      firstNonEmpty(raw, ["rol"])?.nombre_rol ||
      firstNonEmpty(raw, ["rol"]),
    matricula: firstNonEmpty(raw, ["matricula"]),
    estadoValidacion: firstNonEmpty(raw, [
      "estado_validacion",
      "estadoValidacion",
      "estado_expediente",
      "estado",
    ]),
    fechaRegistro: firstNonEmpty(raw, [
      "fecha_registro",
      "fechaRegistro",
      "created_at",
    ]),
  };
}

function normalizeDoc(raw) {
  const id =
    raw?.id ??
    raw?.documento_id ??
    raw?.doc_id ??
    raw?.uuid ??
    undefined;
  const name =
    raw?.nombre ??
    raw?.name ??
    raw?.tipo ??
    raw?.tipo_documento ??
    "Documento";

  const url =
    raw?.url ??
    raw?.link ??
    raw?.firebase_url ??
    raw?.firebaseUrl ??
    raw?.documento_url ??
    null;

  const size =
    raw?.size ??
    raw?.tamaño ??
    raw?.tamano ??
    raw?.bytes ??
    undefined;

  const status =
    raw?.estatus ??
    raw?.status ??
    raw?.estado ??
    raw?.aprobado === true
      ? "aprobado"
      : raw?.aprobado === false
      ? "rechazado"
      : raw?.aprobado ?? "pendiente";

  return {
    id,
    name,
    url,
    size,
    status,
    notes: raw?.nota ?? raw?.observaciones ?? "",
    uploadedAt:
      raw?.fecha ??
      raw?.created_at ??
      raw?.updated_at ??
      raw?.subidoEn ??
      null,
    raw,
  };
}

function extractDocsArrayFlexible(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  for (const k of [
    "documentos",
    "docs",
    "files",
    "archivos",
    "items",
    "data",
    "result",
    "records",
  ]) {
    if (Array.isArray(data?.[k])) return data[k];
  }
  const keys = Object.keys(data || {});
  if (keys.some((k) => k.endsWith("_url"))) {
    const out = [];
    for (const k of keys) {
      if (!k.endsWith("_url")) continue;
      const base = k.replace(/_url$/, "");
      const url =
        data[k] ??
        data[`${base}_link`] ??
        data[`${base}_firebase_url`] ??
        data[`${base}_firebaseUrl`] ??
        null;

      const approved =
        data[`${base}_aprobado`] ??
        data[`${base}Aprobado`] ??
        data[`${base}_approved`] ??
        data[`${base}Approved`] ??
        false;

      if (url || approved !== undefined) {
        out.push(
          normalizeDoc({
            id: base,
            nombre: base,
            url,
            aprobado: approved,
            fecha: data[`${base}_fecha`] ?? data[`${base}_uploaded_at`] ?? null,
            nota: data[`${base}_nota`] ?? data[`${base}_observaciones`] ?? "",
          })
        );
      }
    }
    return out;
  }
  return [];
}

async function fetchDocuments(userId, token) {
  const candidates = [
    `${BACKEND_URL}/documentos/mios`,
    `${BACKEND_URL}/users/${userId}/documentos`,
  ];
  for (const url of candidates) {
    try {
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (DEBUG) console.log("📄 docs resp:", url, { ok: r.ok, j });
      if (!r.ok) continue;

      if (Array.isArray(j)) return j.map(normalizeDoc);

      const arr = extractDocsArrayFlexible(j);
      if (arr.length) return arr.map(normalizeDoc);
    } catch {
      /* try next */
    }
  }
  return [];
}

async function fetchUserIdAndBasic() {
  const current = auth.currentUser;
  if (!current) throw new Error("No hay sesión de Firebase");
  const token = await current.getIdToken(true);

  const res = await fetch(`${BACKEND_URL}/public/validar-usuario`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const basic = await res.json().catch(() => ({}));
  if (DEBUG) console.log("🔎 validar-usuario ->", { ok: res.ok, basic });
  if (!res.ok) {
    throw new Error(basic?.error || `Error validar-usuario (${res.status})`);
  }
  return { token, basic, userId: basic?.id };
}

async function fetchUserFull(userId, token) {
  const res = await fetch(`${BACKEND_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => null);
  if (DEBUG) console.log("🔎 users/:id ->", { ok: res.ok, data });
  if (!res.ok || !data) return null;
  return data;
}

/* =============== Componente principal =============== */
export default function MiPerfil({ user: userProp }) {
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [profile, setProfile] = useState(null);

  const [docsLoading, setDocsLoading] = useState(true);
  const [docsError, setDocsError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [openDocsForm, setOpenDocsForm] = useState(false);

  const userId = userProp?.id;

  const displayName = useMemo(() => {
    const p = profile || {};
    return [p.nombre, p.apellidoPat, p.apellidoMat].filter(Boolean).join(" ");
  }, [profile]);

  const loadAll = async () => {
    setProfileLoading(true);
    setDocsLoading(true);
    setProfileError(null);
    setDocsError(null);

    try {
      let token;
      let id = userId;

      if (!id) {
        const { token: t, basic, userId: idFromBasic } =
          await fetchUserIdAndBasic();
        token = t;
        id = idFromBasic;
        const base = normalizeProfile(basic);
        setProfile(base);
      } else {
        const current = auth.currentUser;
        token = await current?.getIdToken(true);
        if (userProp)
          setProfile((prev) =>
            mergeProfilesPriority(normalizeProfile(userProp), prev || {})
          );
      }

      const fullRaw = await fetchUserFull(id, token);
      if (fullRaw) {
        const full = normalizeProfile(fullRaw);
        if (hasAnyData(full)) {
          setProfile((prev) => mergeProfilesPriority(full, prev || {}));
        }
      }

      const docs = await fetchDocuments(id, token);
      setDocuments(docs);
    } catch (err) {
      setProfileError(err.message || "Error cargando tu perfil");
    } finally {
      setProfileLoading(false);
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const P = profile || {};

  const bloques = [
    {
      titulo: "Datos de registro",
      icon: <FiFileText />,
      campos: [
        ["Matrícula", P.matricula],
        ["Fecha de registro", dateOnly(P.fechaRegistro)],
      ],
    },
    {
      titulo: "Datos personales",
      icon: <FiUser />,
      campos: [
        ["Nombre(s)", P.nombre],
        ["Apellido paterno", P.apellidoPat],
        ["Apellido materno", P.apellidoMat],
        ["Fecha de nacimiento", dateOnly(P.fechaNacimiento)],
        ["CURP", P.curp],
        ["Sexo", P.sexo],
        ["Estado civil", P.estadoCivil],
      ],
    },
    {
      titulo: "Contacto",
      icon: <FiUser />,
      campos: [
        ["Teléfono", P.telefono],
        ["Celular", P.celular],
        ["Estado", P.estado],
        ["Colonia / Municipio", P.colonia],
        ["Código postal", P.cp],
      ],
    },
    {
      titulo: "Contacto de emergencia",
      icon: <FiAlertCircle />,
      campos: [
        ["Nombre", P.emergenciaNombre],
        ["Parentesco", P.emergenciaRelacion],
        ["Teléfono", P.emergenciaTelefono],
        ["Celular", P.emergenciaCelular],
      ],
    },
    {
      titulo: "Formación y ocupación",
      icon: <FiFileText />,
      campos: [
        ["Grado de estudios", P.gradoEstudios],
        ["Especifica estudios", P.especificaEstudios],
        ["Ocupación", P.ocupacion],
        ["Empresa", P.empresa],
        ["Idiomas", P.idiomas],
        ["Porcentaje idioma", P.porcentajeIdioma],
      ],
    },
    {
      titulo: "Salud",
      icon: <FiFileText />,
      campos: [
        ["Tipo de sangre", P.tipoSangre],
        ["RH", P.rh],
        ["Enfermedades", P.enfermedades],
        ["Alergias", P.alergias],
        ["Medicamentos", P.medicamentos],
        ["Ejercicio", P.ejercicio],
      ],
    },
    {
      titulo: "Motivación",
      icon: <FiFileText />,
      campos: [
        ["¿Cómo se enteró?", P.comoSeEntero],
        ["Motivo de interés", P.motivoInteres],
        ["Voluntariado previo", P.voluntariadoPrevio],
        ["Razón del proyecto", P.razonProyecto],
      ],
    },
  ];

  const docsStats = useMemo(() => {
    let pendiente = 0;
    let aprobado = 0;
    let rechazado = 0;
    for (const d of documents) {
      const s = (d.status || "").toString().toLowerCase();
      if (["aprobado", "aprobada", "aceptado"].includes(s)) aprobado++;
      else if (
        ["rechazado", "rechazada", "invalido", "inválido"].includes(s)
      )
        rechazado++;
      else pendiente++;
    }
    return {
      total: documents.length,
      pendiente,
      aprobado,
      rechazado,
    };
  }, [documents]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Enlace copiado al portapapeles");
    } catch {
      const input = document.createElement("input");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand("copy");
        alert("Enlace copiado al portapapeles");
      } catch {
        alert("No se pudo copiar el enlace");
      }
      document.body.removeChild(input);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: COLORS.bg,
        py: 4,
        px: { xs: 2, md: 4 },
        boxSizing: "border-box",
      }}
    >
      {/* Encabezado */}
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: COLORS.red,
              fontWeight: 800,
            }}
          >
            <FiUser />
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 900, letterSpacing: 0.5 }}
            >
              Mi perfil
            </Typography>
            <Typography sx={{ color: "#555", fontSize: 14 }}>
              Revisa tu información general y el estado de tu expediente.
            </Typography>
          </Box>
        </Box>

        <Tooltip title="Recargar información">
          <span>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                if (!profileLoading && !docsLoading) {
                  loadAll();
                }
              }}
              sx={{
                borderColor: COLORS.subtle,
                color: COLORS.red,
                minWidth: 0,
                px: 1.5,
                py: 0.75,
                "&:hover": {
                  borderColor: COLORS.red,
                  backgroundColor: "#fff4f4",
                },
              }}
            >
              <FiRefreshCw />
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* Contenido principal */}
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr" },
            gap: 3,
            alignItems: "flex-start",
          }}
        >
          {/* Columna izquierda */}
          <Stack spacing={3}>
            <Section title="Datos generales">
              {profileLoading ? (
                <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : profileError ? (
                <Typography color="error">{profileError}</Typography>
              ) : !profile ? (
                <Typography variant="body2">
                  No se encontró información de perfil.
                </Typography>
              ) : (
                <Box>
                  <Row label="Nombre completo" value={displayName} />
                  <Row label="CURP" value={P.curp} />
                  <Row label="Estado" value={P.estado} />
                  <Row label="Colonia / Municipio" value={P.colonia} />
                  <Row label="Código postal" value={P.cp} />
                  <Row label="Rol" value={P.rol} />
                  <Row label="Coordinación" value={P.coordinacion} />
                  <Row
                    label="Estado del expediente"
                    value={
                      P.estadoValidacion ? (
                        <Chip
                          label={P.estadoValidacion}
                          size="small"
                          color={
                            ["aprobado", "aprobada"].includes(
                              (P.estadoValidacion || "")
                                .toString()
                                .toLowerCase()
                            )
                              ? "success"
                              : "warning"
                          }
                          sx={{ textTransform: "uppercase", fontSize: 11 }}
                        />
                      ) : (
                        "—"
                      )
                    }
                  />
                </Box>
              )}
            </Section>

            <Section title="Estado de tu expediente">
              {docsLoading ? (
                <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : docsError ? (
                <Typography color="error">{docsError}</Typography>
              ) : (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "#555", mb: 2, maxWidth: 520 }}
                  >
                    Aquí se muestra un resumen del estado de tus documentos
                    registrados en el sistema. Este resumen es orientativo; la
                    validación final depende de tu área de capacitación.
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ flexWrap: "wrap", mb: 2 }}
                  >
                    <StatPill label="Total" value={docsStats.total} />
                    <StatPill
                      label="Aprobados"
                      value={docsStats.aprobado}
                      color="#00aa55"
                    />
                    <StatPill
                      label="Pendientes"
                      value={docsStats.pendiente}
                      color="#f0a500"
                    />
                    <StatPill
                      label="Rechazados"
                      value={docsStats.rechazado}
                      color="#d00000"
                    />
                  </Stack>

                  {docsStats.total === 0 ? (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: COLORS.lilac,
                        border: `1px solid ${COLORS.subtle}`,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: "#333" }}>
                        Aún no has cargado documentos en el sistema. Te
                        recomendamos completar tu información lo antes posible.
                      </Typography>
                    </Box>
                  ) : null}
                </Box>
              )}
            </Section>

            <Section title="Detalles de registro" dense>
              {profileLoading ? (
                <Box sx={{ display: "grid", placeItems: "center", py: 2 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : (
                <Stack spacing={2}>
                  {bloques.map((b, idx) => (
                    <Box key={idx}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 0.5 }}
                      >
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: COLORS.lilac,
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          {b.icon}
                        </Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700, color: "#444" }}
                        >
                          {b.titulo}
                        </Typography>
                      </Stack>
                      <Divider sx={{ mb: 1 }} />
                      {b.campos.map(([k, v], idx2) => (
                        <Row key={`${k}-${idx2}`} label={k} value={v} />
                      ))}
                    </Box>
                  ))}
                </Stack>
              )}
            </Section>
          </Stack>

          {/* COLUMNA DERECHA: DOCUMENTOS */}
          <Section title="Tus documentos">
            {/* Encabezado + botón centrado */}
            <Stack
              direction="column"
              justifyContent="center"
              alignItems="center"
              sx={{ mb: 2, gap: 1, textAlign: "center" }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#555", maxWidth: 400 }}
              >
                Revisa el listado de documentos registrados y, si hace falta,
                sube o actualiza tu información.
              </Typography>

              <Button
                variant="contained"
                size="medium"
                onClick={() => setOpenDocsForm(true)}
                startIcon={<FiUploadCloud />}
                sx={{
                  backgroundColor: COLORS.red,
                  color: "#fff",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 999,
                  px: 3,
                  py: 1,
                  mt: 1,
                  "&:hover": {
                    backgroundColor: "#cc0000",
                  },
                }}
              >
                Completa tu expediente
              </Button>
            </Stack>

            {docsLoading ? (
              <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : docsError ? (
              <Typography color="error">{docsError}</Typography>
            ) : documents.length === 0 ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: COLORS.lilac,
                  border: `1px solid ${COLORS.subtle}`,
                }}
              >
                <Typography variant="body2" sx={{ color: "#333" }}>
                  Aún no hay documentos asociados a tu expediente.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                <Typography
                  variant="caption"
                  sx={{ color: "#666", mb: 0.5 }}
                >
                  Nota: aquí se muestran los <strong>enlaces</strong> de tus
                  documentos.
                </Typography>

                {documents.map((doc) => (
                  <Paper
                    key={doc.id ?? `${doc.name}-${doc.url}`}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: `1px solid ${COLORS.subtle}`,
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 1,
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        color: COLORS.red,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <FiFileText />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: "#222",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={doc.name || doc.url || "Documento"}
                      >
                        {doc.name || "Documento"}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mt: 0.5, flexWrap: "wrap" }}
                      >
                        <StatusChip status={doc.status} />
                        {doc.notes ? (
                          <Typography
                            variant="caption"
                            sx={{ color: "#444" }}
                          >
                            {doc.notes}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Abrir enlace">
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={!doc.url}
                            onClick={() =>
                              window.open(
                                doc.url,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                            sx={{
                              minWidth: 0,
                              px: 1.25,
                              borderColor: COLORS.subtle,
                              color: COLORS.red,
                              "&:hover": {
                                borderColor: COLORS.red,
                                backgroundColor: "#fff4f4",
                              },
                            }}
                          >
                            <FiExternalLink />
                          </Button>
                        </span>
                      </Tooltip>

                      {doc.url && (
                        <Tooltip title="Copiar enlace">
                          <span>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleCopy(doc.url)}
                              sx={{
                                minWidth: 0,
                                px: 1.25,
                                borderColor: COLORS.subtle,
                                color: "#444",
                                "&:hover": {
                                  borderColor: "#999",
                                  backgroundColor: "#f7f7f7",
                                },
                              }}
                            >
                              <FiCopy />
                            </Button>
                          </span>
                        </Tooltip>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Section>
        </Box>
      </Box>

      {/* Modal documentos */}
      <Dialog
        open={openDocsForm}
        onClose={() => {
          setOpenDocsForm(false);
          loadAll();
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 1,
            fontWeight: 800,
            color: COLORS.red,
          }}
        >
          Completa tu perfil
          <IconButton onClick={() => setOpenDocsForm(false)} size="small">
            <FiX />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            backgroundColor: COLORS.bg,
          }}
        >
          <FormDocumentos />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
