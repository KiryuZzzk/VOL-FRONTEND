import React, { useState, useEffect, useRef } from "react"; 
import { FaTimes } from "react-icons/fa";
import { getAuth } from "firebase/auth";

const SearchPanelDoc = ({ isOpen, onClose }) => {
  const panelRef = useRef(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredProfiles, setFilteredProfiles] = useState([]);

  const [matriculaFilter, setMatriculaFilter] = useState("");
  const [curpFilter, setCurpFilter] = useState("");
  const [correoFilter, setCorreoFilter] = useState("");

  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const docFields = [
    { label: "CURP", key: "curp_url", aprobado: "curp_aprobado" },
    { label: "Acta de nacimiento", key: "acta_nacimiento_url", aprobado: "acta_nacimiento_aprobado" },
    { label: "INE", key: "ine_url", aprobado: "ine_aprobado" },
    { label: "CV", key: "cv_url", aprobado: "cv_aprobado" },
    { label: "NSS", key: "nss_url", aprobado: "nss_aprobado" },
    { label: "Constancia", key: "constancia_url", aprobado: "constancia_aprobado" },
    { label: "Foto", key: "foto_url", aprobado: "foto_aprobado" },
    { label: "Certificado médico", key: "certificado_medico_url", aprobado: "certificado_medico_aprobado" },
  ];

  const actualizarEstado = async (matricula, documento, nuevoEstado) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuario no autenticado");

      const idToken = await currentUser.getIdToken();

      const response = await fetch("https://vol-backend.onrender.com/documentos/estado", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "x-firebase-uid": currentUser.uid,
        },
        body: JSON.stringify({
          user_matricula: matricula,
          documento,
          estado: nuevoEstado,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error actualizando estado: ${text}`);
      }

      setProfiles((prev) =>
        prev.map((profile) =>
          profile.matricula === matricula
            ? { ...profile, [`${documento}_aprobado`]: nuevoEstado }
            : profile
        )
      );
    } catch (e) {
      console.error("❌ Error en actualizarEstado:", e);
      alert("Error al actualizar estado del documento.");
    }
  };

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

        const response = await fetch("https://vol-backend.onrender.com/documentos", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "x-firebase-uid": uid,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error al cargar documentos: ${errorText}`);
        }

        const data = await response.json();
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

  if (!isOpen) return null;

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
          <h2 style={styles.title}>Buscar documentos</h2>
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
          {loading && <p>Cargando documentos...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
          {!loading && filteredProfiles.length === 0 && (
            <p style={{ textAlign: "center", color: "#999" }}>
              No se encontraron documentos.
            </p>
          )}
          {!loading &&
            filteredProfiles.map((p, i) => {
              const isExpanded = expandedIndex === i;

              return (
                <div
                  key={i}
                  style={{
                    ...styles.profileItem,
                    ...(isExpanded ? styles.profileItemExpanded : {}),
                  }}
                  onClick={() => toggleExpand(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggleExpand(i);
                  }}
                >
                  <div><strong>Nombre:</strong> {p.nombre}</div>
                  <div><strong>Matrícula:</strong> {p.matricula}</div>
                  <div><strong>CURP:</strong> {p.curp}</div>
                  <div><strong>Correo:</strong> {p.correo}</div>

                  {isExpanded && (
                    <div style={styles.extraInfo}>
                      {docFields.map(({ label, key, aprobado }) => (
                        <div key={key} style={{ marginBottom: "16px" }}>
                          <strong>{label}:</strong>{" "}
                          {p[key] ? (
                            <a href={p[key]} target="_blank" rel="noopener noreferrer">
                              Ver documento
                            </a>
                          ) : (
                            "No disponible"
                          )}
                          {" — "}
                          Estado:{" "}
                          <span
                            style={{
                              fontWeight: "bold",
                              color: p[aprobado] ? "#2e7d32" : "#d32f2f",
                            }}
                          >
                            {p[aprobado] ? "Aprobado" : "Pendiente"}
                          </span>
                          {p[key] && (
                            <div
                              style={{
                                marginTop: "8px",
                                marginBottom: "8px",
                                display: "flex",
                                justifyContent: "center",
                                gap: "10px",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  actualizarEstado(p.matricula, aprobado.replace("_aprobado", ""), true);
                                }}
                                style={{
                                  backgroundColor: "#c8facc",
                                  color: "#1b5e20",
                                  border: "1px solid #1b5e20",
                                  borderRadius: "6px",
                                  padding: "4px 10px",
                                  cursor: "pointer",
                                  fontWeight: "bold",
                                }}
                              >
                                ✅ Validar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  actualizarEstado(p.matricula, aprobado.replace("_aprobado", ""), false);
                                }}
                                style={{
                                  backgroundColor: "#ffccd5",
                                  color: "#b71c1c",
                                  border: "1px solid #b71c1c",
                                  borderRadius: "6px",
                                  padding: "4px 10px",
                                  cursor: "pointer",
                                  fontWeight: "bold",
                                }}
                              >
                                ❌ Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      <div>
                        <strong>Sobre mí:</strong> {p.sobre_mi || "No especificado"}
                      </div>
                      <div>
                        <strong>Fecha de creación:</strong> {p.fecha_creacion || "N/A"}
                      </div>
                      <div>
                        <strong>Última actualización:</strong> {p.ultima_actualizacion || "N/A"}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
    backgroundColor: "#fff8ff",
    borderRadius: "12px",
    padding: "20px",
    width: "90%",
    maxWidth: "700px",
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
    color: "#ff3333",
  },
  closeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.5rem",
    color: "#ff3333",
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
    border: "1px solid #e6dfef",
    fontSize: "0.9rem",
    backgroundColor: "#fff",
  },
  list: {
    flexGrow: 1,
    overflowY: "auto",
    
  },
  profileItem: {
    padding: "12px",
    marginBottom: "10px",
    backgroundColor: "#fff",
    borderRadius: "10px",
    border: "1px solid #e6dfef",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    cursor: "pointer",
  },
  profileItemExpanded: {
    backgroundColor: "#f3eaff",
    border: "2px solid #ff3333",
    boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
  },
  extraInfo: {
    marginTop: "10px",
    padding: "10px",
    borderRadius: "8px",
    backgroundColor: "#fff8ff",
    border: "1px solid #e6dfef",
    fontSize: "0.85rem",
    color: "#333",
  },
};

export default SearchPanelDoc;
