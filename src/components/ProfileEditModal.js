import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
} from "@mui/material";
import { getAuth } from "firebase/auth";
import { FaTimes } from "react-icons/fa";

/**
 * Modal único para:
 * 1) Buscar perfiles por matrícula / CURP / correo
 * 2) Seleccionar uno
 * 3) Editar campos permitidos (PUT /users/:id, enviando solo el diff)
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 */
export default function ProfileEditModal({ open, onClose }) {
  const panelRef = useRef(null);

  // Listado / búsqueda
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [matriculaFilter, setMatriculaFilter] = useState("");
  const [curpFilter, setCurpFilter] = useState("");
  const [correoFilter, setCorreoFilter] = useState("");

  // Edición
  const [selected, setSelected] = useState(null); // usuario seleccionado (original)
  const [form, setForm] = useState(null);         // estado editable
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Muestra extra (igual que tu SearchPanel)
  const extraFields = [
    { label: "Apellido paterno", key: "apellido_paterno" },
    { label: "Apellido materno", key: "apellido_materno" },
    { label: "Fecha de nacimiento", key: "fecha_nacimiento" },
    { label: "Sexo", key: "sexo" },
    { label: "Estado civil", key: "estado_civil" },
    { label: "Teléfono", key: "telefono" },
    { label: "Celular", key: "celular" },
    { label: "Contacto emergencia", key: "emergencia_nombre" },
    { label: "Relación emergencia", key: "emergencia_relacion" },
    { label: "Teléfono emergencia", key: "emergencia_telefono" },
    { label: "Celular emergencia", key: "emergencia_celular" },
    { label: "Grado de estudios", key: "grado_estudios" },
    { label: "Especifica estudios", key: "especifica_estudios" },
    { label: "Ocupación", key: "ocupacion" },
    { label: "Empresa", key: "empresa" },
    { label: "Idiomas", key: "idiomas" },
    { label: "Porcentaje idioma", key: "porcentaje_idioma" },
    { label: "Licencias", key: "licencias" },
    { label: "Tipo licencia", key: "tipo_licencia" },
    { label: "Pasaporte", key: "pasaporte" },
    { label: "Otro documento", key: "otro_documento" },
    { label: "Tipo de sangre", key: "tipo_sangre" },
    { label: "RH", key: "rh" },
    { label: "Enfermedades", key: "enfermedades" },
    { label: "Alergias", key: "alergias" },
    { label: "Medicamentos", key: "medicamentos" },
    { label: "Ejercicio", key: "ejercicio" },
    { label: "Cómo se enteró", key: "como_se_entero" },
    { label: "Motivo interés", key: "motivo_interes" },
    { label: "Voluntariado previo", key: "voluntariado_previo" },
    { label: "Razón proyecto", key: "razon_proyecto" },
    { label: "Fecha registro", key: "fecha_registro" },
    { label: "Estado", key: "estado" },
    { label: "Colonia", key: "colonia" },
    { label: "Código postal", key: "codigo_postal" },
    { label: "Coordinación", key: "coordinacion" },
  ];

  // Campos editables (backend bloquea: id, matricula, uid, correo, estado_validacion)
  const editableFields = useMemo(
    () => [
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
      { label: "Teléfono emergencia", key: "emergencia_telefono" },
      { label: "Celular emergencia", key: "emergencia_celular" },
      { label: "Grado de estudios", key: "grado_estudios" },
      { label: "Especifica estudios", key: "especifica_estudios" },
      { label: "Ocupación", key: "ocupacion" },
      { label: "Empresa", key: "empresa" },
      { label: "Idiomas", key: "idiomas" },
      { label: "Porcentaje idioma", key: "porcentaje_idioma" },
      { label: "Licencias", key: "licencias" },
      { label: "Tipo licencia", key: "tipo_licencia" },
      { label: "Pasaporte", key: "pasaporte" },
      { label: "Otro documento", key: "otro_documento" },
      { label: "Tipo de sangre", key: "tipo_sangre" },
      { label: "RH", key: "rh" },
      { label: "Enfermedades", key: "enfermedades" },
      { label: "Alergias", key: "alergias" },
      { label: "Medicamentos", key: "medicamentos" },
      { label: "Ejercicio", key: "ejercicio" },
      { label: "Cómo se enteró", key: "como_se_entero" },
      { label: "Motivo interés", key: "motivo_interes" },
      { label: "Voluntariado previo", key: "voluntariado_previo" },
      { label: "Razón proyecto", key: "razon_proyecto" },
      { label: "Estado (entidad)", key: "estado" },
      { label: "Colonia", key: "colonia" },
      { label: "Código postal", key: "codigo_postal" },
      { label: "Coordinación", key: "coordinacion" },
    ],
    []
  );

  // Cargar listado al abrir
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!open) return;
      setLoading(true);
      setError("");

      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Usuario no autenticado");
        const idToken = await currentUser.getIdToken();
        const uid = currentUser.uid;

        const res = await fetch("https://vol-backend.onrender.com/users", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "x-firebase-uid": uid,
          },
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Error al cargar perfiles: ${t}`);
        }

        const data = await res.json();
        setProfiles(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError(e.message || "Error al cargar perfiles");
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [open]);

  // Reset al abrir/cerrar
  useEffect(() => {
    if (open) {
      setTimeout(() => panelRef.current?.focus(), 0);
    } else {
      setMatriculaFilter("");
      setCurpFilter("");
      setCorreoFilter("");
      setProfiles([]);
      setFilteredProfiles([]);
      setError("");
      setSelected(null);
      setForm(null);
      setSaveMsg("");
    }
  }, [open]);

  // Filtro local
  useEffect(() => {
    if (!open) return;
    let filtered = profiles;

    if (matriculaFilter) {
      filtered = profiles.filter((p) =>
        p.matricula?.toLowerCase().includes(matriculaFilter.toLowerCase())
      );
    } else if (curpFilter) {
      filtered = profiles.filter((p) =>
        p.curp?.toLowerCase().includes(curpFilter.toLowerCase())
      );
    } else if (correoFilter) {
      filtered = profiles.filter((p) =>
        p.correo?.toLowerCase().includes(correoFilter.toLowerCase())
      );
    }

    setFilteredProfiles(filtered);
  }, [matriculaFilter, curpFilter, correoFilter, profiles, open]);

  // Elegir perfil para edición
  const handlePick = (p) => {
    if (!p.id) {
      setError("El listado no trae 'id'. Ajusta backend: SELECT u.id AS id en /users.");
      return;
    }
    setSelected(p);
    setForm({ ...p });
    setSaveMsg("");
  };

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Envía sólo diferencias
  const computeDiff = (original, edited) => {
    const diff = {};
    Object.keys(edited || {}).forEach((k) => {
      if (["id", "matricula", "uid", "correo", "estado_validacion"].includes(k)) return;
      const origVal = original?.[k] ?? null;
      const newVal = edited?.[k] ?? null;
      if (String(origVal ?? "") !== String(newVal ?? "")) {
        diff[k] = newVal;
      }
    });
    return diff;
  };

  const handleSave = async () => {
    if (!selected?.id || !form) return;
    const changes = computeDiff(selected, form);
    if (Object.keys(changes).length === 0) {
      setSaveMsg("No hay cambios por guardar.");
      return;
    }

    setSaving(true);
    setError("");
    setSaveMsg("");

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuario no autenticado");
      const idToken = await currentUser.getIdToken();
      const uid = currentUser.uid;

      const res = await fetch(`https://vol-backend.onrender.com/users/${selected.id}`, {
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
      const updated = { ...selected, ...changes };
      setSelected(updated);
      setForm(updated);
      setProfiles((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setFilteredProfiles((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (e) {
      console.error(e);
      setError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // Cerrar modal (resetea todo)
  const handleClose = () => {
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      aria-labelledby="edit-users-title"
    >
      <DialogTitle
        id="edit-users-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: 1,
        }}
      >
        {selected ? "Editar perfil de usuario" : "Editar voluntarios (buscar y seleccionar)"}
        <IconButton onClick={handleClose} aria-label="Cerrar">
          <FaTimes />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers ref={panelRef} tabIndex={0} sx={{ bgcolor: "#fff8ff" }}>
        {!selected && (
          <>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                mb: 2,
                bgcolor: "#fff",
                p: 1.5,
                borderRadius: 2,
                border: "1px solid #e6dfef",
              }}
            >
              <TextField
                label="Matrícula"
                value={matriculaFilter}
                onChange={(e) => {
                  setMatriculaFilter(e.target.value);
                  setCurpFilter("");
                  setCorreoFilter("");
                }}
                size="small"
                fullWidth
              />
              <TextField
                label="CURP"
                value={curpFilter}
                onChange={(e) => {
                  setCurpFilter(e.target.value);
                  setMatriculaFilter("");
                  setCorreoFilter("");
                }}
                size="small"
                fullWidth
              />
              <TextField
                label="Correo"
                value={correoFilter}
                onChange={(e) => {
                  setCorreoFilter(e.target.value);
                  setMatriculaFilter("");
                  setCurpFilter("");
                }}
                size="small"
                fullWidth
              />
            </Box>

            {loading && <Typography>Cargando perfiles...</Typography>}
            {!!error && (
              <Typography color="error" sx={{ mb: 1 }}>
                {error}
              </Typography>
            )}
            {!loading && filteredProfiles.length === 0 && (
              <Typography sx={{ color: "#888" }}>No se encontraron perfiles.</Typography>
            )}

            {!loading &&
              filteredProfiles.map((p, i) => (
                <Box
                  key={p.id ?? i}
                  onClick={() => handlePick(p)}
                  sx={{
                    p: 1.2,
                    mb: 1,
                    borderRadius: 2,
                    border: "1px solid #e6dfef",
                    bgcolor: "#fff",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#ffeefe" },
                  }}
                >
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                    <Typography><strong>Nombre:</strong> {p.nombre}</Typography>
                    <Typography><strong>Apellido paterno:</strong> {p.apellido_paterno ?? "N/A"}</Typography>
                    <Typography><strong>Apellido materno:</strong> {p.apellido_materno ?? "N/A"}</Typography>
                    <Typography><strong>Matrícula:</strong> {p.matricula}</Typography>
                    <Typography><strong>CURP:</strong> {p.curp}</Typography>
                    <Typography><strong>Correo:</strong> {p.correo}</Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                    {extraFields.map(({ label, key }) => (
                      <Typography key={key} sx={{ fontSize: ".9rem", color: "#555" }}>
                        <strong>{label}:</strong> {p[key] ?? "N/A"}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              ))}
          </>
        )}

        {selected && form && (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setSelected(null);
                  setForm(null);
                  setSaveMsg("");
                }}
                sx={{ borderColor: "#e6dfef", color: "#7a6d7f", "&:hover": { borderColor: "#ff3333" } }}
              >
                ← Regresar a la búsqueda
              </Button>

              <Typography sx={{ ml: 1 }}>
                <strong>Editar:</strong> {selected.nombre} {selected.apellido_paterno ?? ""} {selected.apellido_materno ?? ""} ·{" "}
                <em>Matrícula:</em> {selected.matricula} · <em>Correo:</em> {selected.correo}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.2,
                bgcolor: "#fff",
                p: 1.5,
                borderRadius: 2,
                border: "1px solid #e6dfef",
              }}
            >
              {editableFields.map(({ label, key, type }) => (
                <TextField
                  key={key}
                  type={type || "text"}
                  label={label}
                  value={form[key] ?? ""}
                  onChange={(e) => onChange(key, e.target.value)}
                  size="small"
                  fullWidth
                />
              ))}
            </Box>

            {!!error && (
              <Typography color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            {!!saveMsg && (
              <Typography sx={{ mt: 1, color: "#0a7b0a" }}>
                {saveMsg}
              </Typography>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={handleClose}>Cerrar</Button>
        {selected && (
          <>
            <Button
              onClick={() => {
                setForm({ ...selected });
                setSaveMsg("Cambios revertidos.");
              }}
              disabled={saving}
            >
              Cancelar cambios
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{ bgcolor: "#1976d2" }}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
