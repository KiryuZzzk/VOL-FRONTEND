import React, { useState, useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import { getAuth } from "firebase/auth";

const SearchPanel = ({ isOpen, onClose }) => {
  const panelRef = useRef(null);

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredProfiles, setFilteredProfiles] = useState([]);

  const [matriculaFilter, setMatriculaFilter] = useState("");
  const [curpFilter, setCurpFilter] = useState("");
  const [correoFilter, setCorreoFilter] = useState("");

  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchProfiles = async () => {
      setLoading(true);
      setError(null);

      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) throw new Error("Usuario no autenticado");

        const idToken = await currentUser.getIdToken();
        const uid = currentUser.uid;

        const response = await fetch("https://vol-backend.onrender.com/users", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "x-firebase-uid": uid,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error al cargar perfiles: ${errorText}`);
        }

        const data = await response.json();
        console.log("🚀 Perfil ejemplo:", data[0]); // Para debug
        setProfiles(data);
      } catch (e) {
        console.error("❌ Error en fetch:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => panelRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "auto";
      setMatriculaFilter("");
      setCurpFilter("");
      setCorreoFilter("");
      setProfiles([]);
      setError(null);
      setExpandedIndex(null);
    }
  }, [isOpen]);

useEffect(() => {
  if (!isOpen) return;

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
}, [matriculaFilter, curpFilter, correoFilter, profiles, isOpen]);

  if (!isOpen) return null;


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
    { label: "Estado validación", key: "estado_validacion" },
    { label: "Fecha registro", key: "fecha_registro" },
    { label: "Estado", key: "estado" },
    { label: "Colonia", key: "colonia" },
    { label: "Código postal", key: "codigo_postal" },
    { label: "Coordinación", key: "coordinacion" },
  ];

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div
      onClick={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target)) {
          onClose();
        }
      }}
      style={styles.backdrop}
      tabIndex={-1}
    >
      <div ref={panelRef} style={styles.panel} tabIndex={0}>
        <header style={styles.header}>
          <h2 style={styles.title}>Buscar voluntarios</h2>
          <button
            onClick={onClose}
            style={styles.closeButton}
            type="button"
            aria-label="Cerrar panel de búsqueda"
          >
            <FaTimes />
          </button>
        </header>

        <section style={styles.filters}>
          <input
  placeholder="Buscar por matrícula"
  value={matriculaFilter}
  onChange={(e) => {
    setMatriculaFilter(e.target.value);
    setCurpFilter("");
    setCorreoFilter("");
  }}
  style={styles.input}
  autoComplete="off"
  spellCheck={false}
/>
<input
  placeholder="Buscar por CURP"
  value={curpFilter}
  onChange={(e) => {
    setCurpFilter(e.target.value);
    setMatriculaFilter("");
    setCorreoFilter("");
  }}
  style={styles.input}
  autoComplete="off"
  spellCheck={false}
/>
<input
  placeholder="Buscar por correo"
  value={correoFilter}
  onChange={(e) => {
    setCorreoFilter(e.target.value);
    setMatriculaFilter("");
    setCurpFilter("");
  }}
  style={styles.input}
  autoComplete="off"
  spellCheck={false}
/>
        </section>

        <section style={styles.list}>
          {loading && <p>Cargando perfiles...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
          {!loading && filteredProfiles.length === 0 && (
            <p style={{ textAlign: "center", color: "#999" }}>
              No se encontraron perfiles.
            </p>
          )}
          {!loading &&
            filteredProfiles.map((p, i) => (
              <div
                key={i}
                style={styles.profileItem}
                onClick={() => toggleExpand(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") toggleExpand(i);
                }}
              >
                <div>
                  <strong>Nombre:</strong> {p.nombre}
                </div>
                <div>
                  <strong>Apellido paterno:</strong> {p.apellido_paterno ?? "N/A"}
                </div>
                <div>
                  <strong>Apellido materno:</strong> {p.apellido_materno ?? "N/A"}
                </div>
                <div>
                  <strong>Matrícula:</strong> {p.matricula}
                </div>
                <div>
                  <strong>CURP:</strong> {p.curp}
                </div>
                <div>
                  <strong>Correo:</strong> {p.correo}
                </div>

                {expandedIndex === i && (
                  <div style={styles.extraInfo}>
                    {extraFields.map(({ label, key }) => (
                      <div key={key}>
                        <strong>{label}:</strong> {p[key] ?? "N/A"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </section>
      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  panel: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "20px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    position: "relative",
    outline: "none",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  title: {
    margin: 0,
  },
  closeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.5rem",
    color: "#e60000",
  },
  filters: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
    flexWrap: "wrap",
  },
  input: {
    flex: "1 1 30%",
    minWidth: 100,
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "0.9rem",
  },
  list: {
    flexGrow: 1,
    overflowY: "auto",
  },
  profileItem: {
    padding: "8px 12px",
    borderBottom: "1px solid #eee",
    fontSize: "0.9rem",
    color: "#333",
    cursor: "pointer",
    userSelect: "none",
  },
  extraInfo: {
    marginTop: "10px",
    paddingLeft: "10px",
    borderLeft: "3px solid #1976d2",
    fontSize: "0.85rem",
    color: "#555",
  },
};

export default SearchPanel;
