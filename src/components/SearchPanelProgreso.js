import React, { useState, useEffect, useRef, useMemo } from "react";
import { FaTimes, FaSyncAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { getAuth } from "firebase/auth";

const BACKEND_URL = "https://vol-backend.onrender.com";

const SearchPanelProgreso = ({ isOpen, onClose }) => {
  const panelRef = useRef(null);

  // Lista de usuarios base (para filtrar y elegir a quién ver)
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [errorProfiles, setErrorProfiles] = useState(null);

  // Filtros
  const [matriculaFilter, setMatriculaFilter] = useState("");
  const [curpFilter, setCurpFilter] = useState("");
  const [correoFilter, setCorreoFilter] = useState("");

  // UI
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Progreso por userId (cache)
  const [progressByUser, setProgressByUser] = useState({});
  const [loadingUserId, setLoadingUserId] = useState(null);
  const [errorByUser, setErrorByUser] = useState({}); // { [userId]: string }

  // ==== Abrir/Cerrar ====
  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    const fetchProfiles = async () => {
      setLoadingProfiles(true);
      setErrorProfiles(null);
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Usuario no autenticado");

        const idToken = await currentUser.getIdToken();
        const uid = currentUser.uid;

        const resp = await fetch(`${BACKEND_URL}/users`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "x-firebase-uid": uid,
          },
          signal: controller.signal,
        });

        if (!resp.ok) {
          const t = await resp.text();
          throw new Error(`Error al cargar perfiles: ${t}`);
        }

        const data = await resp.json();
        setProfiles(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("❌ Error perfiles:", e);
          setErrorProfiles(e.message);
        }
      } finally {
        setLoadingProfiles(false);
      }
    };

    // lock scroll + focus + fetch
    document.body.style.overflow = "hidden";
    setTimeout(() => panelRef.current?.focus(), 0);
    fetchProfiles();

    return () => {
      controller.abort();
      document.body.style.overflow = "auto";
      // reset limpio
      setMatriculaFilter("");
      setCurpFilter("");
      setCorreoFilter("");
      setExpandedIndex(null);
      setErrorProfiles(null);
    };
  }, [isOpen]);

  // ==== Filtro memoizado ====
  const filteredProfiles = useMemo(() => {
    if (!isOpen) return [];
    let list = profiles;

    if (matriculaFilter) {
      const q = matriculaFilter.toLowerCase();
      list = list.filter((p) => p.matricula?.toLowerCase().includes(q));
    } else if (curpFilter) {
      const q = curpFilter.toLowerCase();
      list = list.filter((p) => p.curp?.toLowerCase().includes(q));
    } else if (correoFilter) {
      const q = correoFilter.toLowerCase();
      list = list.filter((p) => p.correo?.toLowerCase().includes(q));
    }

    return list;
  }, [profiles, isOpen, matriculaFilter, curpFilter, correoFilter]);

  // ==== Helpers UI ====
  const toggleExpand = async (index) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
      return;
    }
    setExpandedIndex(index);

    const user = filteredProfiles[index];
    if (!user) return;

    const userId = user.id || user.user_id || user.uid; // flexible por si tu /users cambia
    if (!userId) return;

    // Si ya está en cache y no hubo error previo, no refetch
    if (progressByUser[userId] && !errorByUser[userId]) return;

    await fetchProgress(userId);
  };

  // ==== Fetch progreso por usuario ====
  const fetchProgress = async (userId) => {
    setLoadingUserId(userId);
    setErrorByUser((prev) => ({ ...prev, [userId]: null }));

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuario no autenticado");

      const idToken = await currentUser.getIdToken();
      const uid = currentUser.uid;

      const resp = await fetch(`${BACKEND_URL}/inscripciones/${encodeURIComponent(userId)}/progreso`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "x-firebase-uid": uid,
        },
      });

      if (!resp.ok) {
        const t = await resp.text();
        // 403 -> no autorizado (no es admin/mod)
        if (resp.status === 403) {
          throw new Error("No autorizado (se requiere rol admin o moderador).");
        }
        throw new Error(t || "Error al consultar progreso");
      }

      const data = await resp.json();
      setProgressByUser((prev) => ({ ...prev, [userId]: data }));
    } catch (e) {
      console.error("❌ Error progreso:", e);
      setErrorByUser((prev) => ({ ...prev, [userId]: e.message || "Error al consultar progreso" }));
    } finally {
      setLoadingUserId(null);
    }
  };

  // ==== Formatting ====
  const fmtDate = (iso) => {
    try {
      if (!iso) return "N/A";
      const d = new Date(iso);
      return new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d);
    } catch {
      return String(iso);
    }
  };

  const fmtNumber = (n) => (typeof n === "number" && !isNaN(n) ? n.toFixed(2) : "N/A");

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
      }}
      style={styles.backdrop}
      tabIndex={-1}
    >
      <div ref={panelRef} style={styles.panel} tabIndex={0}>
        <header style={styles.header}>
          <h2 style={styles.title}>Progreso de aspirantes</h2>
          <button
            onClick={onClose}
            style={styles.closeButton}
            type="button"
            aria-label="Cerrar panel"
            title="Cerrar"
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
              setExpandedIndex(null);
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
              setExpandedIndex(null);
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
              setExpandedIndex(null);
            }}
            style={styles.input}
            autoComplete="off"
            spellCheck={false}
          />
        </section>

        <section style={styles.list}>
          {loadingProfiles && <p>Cargando voluntarios...</p>}
          {errorProfiles && <p style={{ color: "#ff3333" }}>{errorProfiles}</p>}

          {!loadingProfiles && filteredProfiles.length === 0 && (
            <p style={{ textAlign: "center", color: "#999" }}>
              No se encontraron resultados. Afina tu búsqueda.
            </p>
          )}

          {!loadingProfiles &&
            filteredProfiles.map((p, i) => {
              const userId = p.id || p.user_id || p.uid;
              const expanded = expandedIndex === i;
              const progreso = userId ? progressByUser[userId] : null;
              const err = userId ? errorByUser[userId] : null;

              return (
                <div
                  key={userId || i}
                  style={{
                    ...styles.profileItem,
                    ...(expanded ? styles.profileItemActive : {}),
                  }}
                  onClick={() => toggleExpand(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? toggleExpand(i) : null)}
                >
                  <div style={styles.rowTop}>
                    <div><strong>Nombre:</strong> {p.nombre ?? "N/A"}</div>
                    <div><strong>Apellidos:</strong> {(p.apellido_paterno || "") + " " + (p.apellido_materno || "")}</div>
                  </div>
                  <div style={styles.rowMid}>
                    <div><strong>Matrícula:</strong> {p.matricula ?? "N/A"}</div>
                    <div><strong>CURP:</strong> {p.curp ?? "N/A"}</div>
                    <div><strong>Correo:</strong> {p.correo ?? "N/A"}</div>
                  </div>

                  {expanded && (
                    <div style={styles.progressBox} onClick={(e) => e.stopPropagation()}>
                      {/* Botón refrescar */}
                      <div style={styles.progressHeader}>
                        <h4 style={{ margin: 0 }}>Progreso</h4>
                        <button
                          type="button"
                          onClick={() => userId && fetchProgress(userId)}
                          style={styles.refreshBtn}
                          title="Actualizar progreso"
                        >
                          <FaSyncAlt />
                        </button>
                      </div>

                      {/* Estado de carga / error */}
                      {loadingUserId === userId && <p>Cargando progreso...</p>}
                      {err && <p style={{ color: "#ff3333" }}>{err}</p>}

                      {/* Resumen */}
                      {progreso && !err && (
                        <>
                          <div style={styles.summary}>
                            <div>
                              <div style={styles.summaryLabel}>Cursos distintos</div>
                              <div style={styles.summaryValue}>{progreso?.resumen?.total_cursos ?? 0}</div>
                            </div>
                            <div>
                              <div style={styles.summaryLabel}>Aprobados</div>
                              <div style={styles.summaryValue}>{progreso?.resumen?.aprobados ?? 0}</div>
                            </div>
                            <div>
                              <div style={styles.summaryLabel}>Promedio</div>
                              <div style={styles.summaryValue}>
                                {typeof progreso?.resumen?.promedio === "number"
                                  ? progreso.resumen.promedio.toFixed(2)
                                  : "N/A"}
                              </div>
                            </div>
                          </div>

                          {/* Lista de cursos */}
                          <div style={styles.coursesList}>
                            {Array.isArray(progreso.cursos) && progreso.cursos.length > 0 ? (
                              progreso.cursos.map((c, idx) => (
                                <div key={idx} style={styles.courseItem}>
                                  <div style={styles.courseHeader}>
                                    <div style={{ fontWeight: 600 }}>
                                      {c.nombre || c.codigo || "Curso"}
                                      {c.codigo ? <span style={styles.codePill}>{c.codigo}</span> : null}
                                    </div>
                                    <div style={styles.badge(c.aprobado)}>
                                      {c.aprobado ? (
                                        <>
                                          <FaCheckCircle style={{ marginRight: 4 }} />
                                          Aprobado
                                        </>
                                      ) : (
                                        <>
                                          <FaTimesCircle style={{ marginRight: 4 }} />
                                          No aprobado
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <div style={styles.courseMeta}>
                                    <div><strong>Calificación:</strong> {fmtNumber(c.calificacion)}</div>
                                    <div><strong>Finalización:</strong> {fmtDate(c.fecha_finalizacion)}</div>
                                    <div><strong>Duración (min):</strong> {c.duracion ?? "N/A"}</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p style={{ color: "#777", marginTop: 8 }}>
                                Sin cursos registrados para mostrar.
                              </p>
                            )}
                          </div>
                        </>
                      )}
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

// ==== Estilos (ligero acento con tu paleta: fondo #fff8ff, bordes #e6dfef, detalle rojo #ff3333) ====
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
    borderRadius: 12,
    padding: 20,
    width: "95%",
    maxWidth: 860,
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    position: "relative",
    outline: "none",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { margin: 0 },
  closeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.5rem",
    color: "#ff3333",
  },
  filters: {
    display: "flex",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  input: {
    flex: "1 1 30%",
    minWidth: 140,
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: "0.95rem",
  },
  list: { flexGrow: 1, overflowY: "auto" },
  profileItem: {
    padding: "12px 14px",
    border: "1px solid #e6dfef",
    borderRadius: 12,
    marginBottom: 10,
    fontSize: "0.95rem",
    color: "#333",
    cursor: "pointer",
    userSelect: "none",
    background: "#fff",
    transition: "background 0.2s, box-shadow 0.2s",
  },
  profileItemActive: {
    background: "#fff8ff",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
  },
  rowTop: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 6,
  },
  rowMid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    color: "#555",
  },
  progressBox: {
    marginTop: 12,
    padding: 12,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e6dfef",
  },
  progressHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  refreshBtn: {
    border: "1px solid #e6dfef",
    background: "#fff",
    padding: "6px 10px",
    borderRadius: 8,
    cursor: "pointer",
  },
  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  summaryLabel: { fontSize: 12, color: "#666" },
  summaryValue: { fontSize: 18, fontWeight: 700 },
  coursesList: { display: "flex", flexDirection: "column", gap: 10 },
  courseItem: {
    border: "1px solid #e6dfef",
    borderRadius: 12,
    padding: 10,
  },
  courseHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  codePill: {
    marginLeft: 8,
    fontSize: 12,
    border: "1px solid #e6dfef",
    borderRadius: 999,
    padding: "2px 8px",
    background: "#fff",
  },
  badge: (ok) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    color: ok ? "#1b5e20" : "#b71c1c",
    background: ok ? "rgba(76,175,80,0.12)" : "rgba(255,51,51,0.12)",
    border: `1px solid ${ok ? "rgba(76,175,80,0.25)" : "#ff3333"}`,
  }),
  courseMeta: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    color: "#444",
  },
};

export default SearchPanelProgreso;
