// src/components/BloquesCursosComponent.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  TextField,
  Chip,
  Paper,
  Button,
  useMediaQuery,
  useTheme,
  Alert,
} from "@mui/material";
import { FiChevronDown } from "react-icons/fi";
import YouTube from "react-youtube";
import { jsPDF } from "jspdf";
import { auth } from "../firebase"; // ajusta la ruta si es necesario
import jsonData from "./data.json"; // tu dataset local de cursos
import ActividadesPA from "./ActividadesPA";
import ActividadRegulacionEmociones from "./ActividadesRE";
import ActividadesID from "./ActividadesID";
import ActividadesCRM from "./ActividadesCRM";
import ActividadesAMS from "./ActividadesAMS";
import GenerateRecCertButton from "./GenerateRecCertButton";

const BACKEND_URL = "https://vol-backend.onrender.com";

// ====== Helpers de normalización y mapa nombre -> curso_id ======
const norm = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Admite variantes con/sin acentos y sinónimos
const NAME_TO_ID = {
  "primeros auxilios": "PA",
  "induccion a los desastres": "ID",
  "inducción a los desastres": "ID",
  "induccion a la cruz roja mexicana": "CRM",
  "inducción a la cruz roja mexicana": "CRM",
  "regulacion de emociones": "RE",
  "regulación de emociones": "RE",
  "gestion de emociones": "RE",
};

function formatFechaMX(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

export default function BloquesCursosComponent({ cursoNombre }) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [bloques, setBloques] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [cursos, setCursos] = useState([]);

  // Reporte automático (estado UI)
  const [reportMsg, setReportMsg] = useState(null); // {type:'success'|'error'|'info', text:string}
  const reportedRef = useRef(false); // evita dobles envíos por StrictMode/renderes múltiples

  // estilos para permitir texto largo en chips
  const chipLongTextSx = {
    "& .MuiChip-label": {
      whiteSpace: "normal",
      overflow: "visible",
      textOverflow: "clip",
      display: "block",
      textAlign: "center",
    },
    height: "auto",
    alignItems: "flex-start",
    py: 1,
    maxWidth: "100%",
  };

  // Inicializa cursos / curso seleccionado
  useEffect(() => {
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      console.error("jsonData no es un arreglo válido o está vacío");
      return;
    }

    setCursos(jsonData);

    const inicial =
      cursoNombre && jsonData.some((c) => c.nombre === cursoNombre)
        ? cursoNombre
        : jsonData[0].nombre;

    setCursoSeleccionado(inicial);

    const curso = jsonData.find((c) => c.nombre === inicial);
    setBloques(curso ? curso.modulos : []);
    setRespuestas({});
    setReportMsg(null);
    reportedRef.current = false;
  }, [cursoNombre]);

  // Cambiar curso manualmente (si agregas selector en el futuro)
  const setCurso = (nombre) => {
    setCursoSeleccionado(nombre);
    const curso = cursos.find((c) => c.nombre === nombre);
    setBloques(curso ? curso.modulos : []);
    setRespuestas({});
    setReportMsg(null);
    reportedRef.current = false;
  };

  const isRespuestaBloqueada = (bloqueIndex, preguntaIndex) => {
    const key = `${bloqueIndex}-${preguntaIndex}`;
    return respuestas[key] !== undefined;
  };

  // Reporte automático cuando aprueba (≥ 8.0)
  const reportarAprobacion = async ({ curso_nombre, calificacion, duracion = 0 }) => {
    try {
      const current = auth.currentUser;
      const token = await current?.getIdToken(true);

      if (reportedRef.current) return;
      reportedRef.current = true;

      console.log("➡️ Voy a guardar:", { curso_nombre, calificacion, duracion });
      const res = await fetch(`${BACKEND_URL}/inscripciones/final`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ curso_nombre, calificacion, duracion }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Error al registrar la inscripción");

      setReportMsg({
        type: "success",
        text: `¡Aprobado! Se registró tu mejor calificación (${calificacion}/10) para "${curso_nombre}".`,
      });
    } catch (e) {
      console.error("❌ reportarAprobacion:", e);
      setReportMsg({
        type: "error",
        text: "Hubo un problema al registrar tu calificación. Intenta de nuevo más tarde.",
      });
    }
  };

  const handleRespuestaChange = (bloqueIndex, preguntaIndex, value, isExamen) => {
    const key = `${bloqueIndex}-${preguntaIndex}`;
    if (isExamen && respuestas[key] !== undefined) return; // no permitir cambiar en examen

    setRespuestas((prev) => {
      const next = { ...prev, [key]: value };

      if (isExamen) {
        // Verificar si ya contestó todas las preguntas de ese bloque
        const preguntas = bloques[bloqueIndex]?.preguntas || [];
        const completas =
          preguntas.length > 0 &&
          preguntas.every((_, i) => next[`${bloqueIndex}-${i}`] !== undefined);

        if (completas) {
          const correctas = preguntas.filter(
            (p, i) => next[`${bloqueIndex}-${i}`] === p.respuestaCorrecta
          ).length;

          const calificacion10 = +((correctas / preguntas.length) * 10).toFixed(2);

          if (calificacion10 >= 8 && !reportedRef.current) {
            setReportMsg({ type: "info", text: "Registrando tu calificación…" });
            reportarAprobacion({
              curso_nombre: cursoSeleccionado, // ← nombre completo (el backend lo mapea)
              calificacion: calificacion10,
              duracion: 0,
            });
          }
        }
      }

      return next;
    });
  };

  // === Código/código para el botón de certificado ===
  const cursoIdCode = NAME_TO_ID[norm(cursoSeleccionado)] || null;

  return (
    <Box
      p={isSmallScreen ? 1 : 2}
      sx={{ backgroundColor: "#fff8ff", minHeight: "100vh" }}
    >
      {reportMsg && (
        <Box sx={{ maxWidth: 800, mx: "auto", mb: 2 }}>
          <Alert
            severity={reportMsg.type}
            onClose={() => setReportMsg(null)}
            variant="outlined"
          >
            {reportMsg.text}
          </Alert>
        </Box>
      )}

      {/* Botón para generar reconocimiento (solo si hay código válido) }
      { cursoIdCode && (
        <Box sx={{ maxWidth: 800, mx: "auto", mb: 2, textAlign: "center" }}>
          <GenerateRecCertButton
            cursoId={cursoIdCode}                                   // ← el backend espera 'PA' | 'ID' | 'CRM' | 'RE'
            label={`Descargar reconocimiento – ${cursoSeleccionado}`} // ← muestra el NOMBRE bonito
          />
        </Box>
      )*/}
 
      {bloques.map((bloque, bloqueIndex) => (
        <Accordion
          key={bloqueIndex}
          sx={{
            backgroundColor: "#e6dfef",
            mb: isSmallScreen ? 1.5 : 2,
            boxShadow: "none",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={
              <FiChevronDown color="#fff" size={isSmallScreen ? 20 : 24} />
            }
            sx={{
              backgroundColor: "#ff3333",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: "4px",
              fontSize: isSmallScreen ? "1rem" : "1.25rem",
              "& .MuiAccordionSummary-expandIconWrapper": {
                color: "#fff",
              },
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontSize: isSmallScreen ? "1rem" : "1.25rem" }}
            >
              {bloque.titulo}
            </Typography>
          </AccordionSummary>

          <AccordionDetails
            sx={{
              backgroundColor: "#e6dfef",
              color: "#000",
              borderRadius: "0 0 8px 8px",
              px: isSmallScreen ? 1 : 3,
              py: isSmallScreen ? 1 : 2,
            }}
          >
            {/* Videos */}
            {bloque.videos?.map((videoId, idx) => (
              <Box
                mb={2}
                key={idx}
                sx={{
                  maxWidth: isSmallScreen ? "100%" : isMediumScreen ? "600px" : "800px",
                  margin: "0 auto",
                }}
              >
                <YouTube
                  videoId={videoId}
                  opts={{
                    width: "100%",
                    height: isSmallScreen ? "200" : "390",
                    playerVars: {
                      autoplay: 0,
                    },
                  }}
                />
              </Box>
            ))}

            {/* Examen final */}
            {bloque.examen && bloque.preguntas && (
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: "bold", textAlign: "center" }}
                >
                  Examen final:
                </Typography>

                {bloque.preguntas.map((pregunta, idx) => {
                  const key = `${bloqueIndex}-${idx}`;
                  const respuesta = respuestas[key];
                  const respondida = respuesta !== undefined;
                  const correcta = respuesta === pregunta.respuestaCorrecta;

                  return (
                    <Paper
                      key={idx}
                      elevation={2}
                      sx={{
                        p: 2,
                        mb: 2,
                        backgroundColor: "#fff8ff",
                        maxWidth: isSmallScreen ? "100%" : "600px",
                        margin: "0 auto",
                      }}
                    >
                      <Typography sx={{ mb: 1 }}>{pregunta.texto}</Typography>

                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                          justifyContent: "center",
                        }}
                      >
                        {pregunta.opciones.map((op, iop) => (
                          <Chip
                            key={iop}
                            label={
                              <span
                                style={{ whiteSpace: "normal", display: "block" }}
                              >
                                {op}
                              </span>
                            }
                            onClick={() =>
                              handleRespuestaChange(bloqueIndex, idx, op, true)
                            }
                            sx={{
                              ...chipLongTextSx,
                              backgroundColor:
                                respuesta === op
                                  ? correcta
                                    ? "#4caf50"
                                    : "#f44336"
                                  : "#e6dfef",
                              cursor: respondida ? "default" : "pointer",
                              pointerEvents: respondida ? "none" : "auto",
                              "&:hover": {
                                backgroundColor: respondida ? undefined : "#ff3333",
                                color: respondida ? undefined : "#fff",
                              },
                            }}
                            clickable={!respondida}
                          />
                        ))}
                      </Box>

                      {respondida && (
                        <Typography
                          sx={{
                            mt: 1,
                            color: correcta ? "green" : "red",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          {correcta ? "✅ Correcto" : "❌ Incorrecto"}
                        </Typography>
                      )}
                    </Paper>
                  );
                })}

                {/* Resultado (solo display, sin side-effects) */}
                {bloque.preguntas.every(
                  (_, idx) => respuestas[`${bloqueIndex}-${idx}`] !== undefined
                ) && (() => {
                  const correctas = bloque.preguntas.filter(
                    (pregunta, idx) =>
                      respuestas[`${bloqueIndex}-${idx}`] ===
                      pregunta.respuestaCorrecta
                  ).length;

                  const porcentaje = Math.round(
                    (correctas / bloque.preguntas.length) * 100
                  );
                  const calificacion10 = +(
                    (correctas / bloque.preguntas.length) * 10
                  ).toFixed(2);

                  return (
                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Typography variant="h6" textAlign="center">
                        Tu porcentaje de aciertos es: {porcentaje}% ({calificacion10}/10)
                      </Typography>

                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => {
                          // Reset respuestas del bloque y permitir reintentar
                          const keysToDelete = Object.keys(respuestas).filter((k) =>
                            k.startsWith(bloqueIndex + "-")
                          );
                          const newRespuestas = { ...respuestas };
                          keysToDelete.forEach((k) => delete newRespuestas[k]);
                          setRespuestas(newRespuestas);

                          // Permite reportar otra vez si mejora
                          reportedRef.current = false;
                          setReportMsg(null);
                        }}
                      >
                        Reiniciar examen
                      </Button>
                    </Box>
                  );
                })()}
              </Box>
            )}

            {/* Preguntas “rellenar espacios” (no examen) */}
            {!bloque.examen && bloque.preguntas && (
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ textAlign: "center", mb: 1 }}
                >
                  Rellena los espacios:
                </Typography>

                {bloque.preguntas.map((pregunta, preguntaIndex) => (
                  <Paper
                    key={preguntaIndex}
                    elevation={2}
                    sx={{
                      p: 2,
                      mb: 2,
                      backgroundColor: "#fff8ff",
                      maxWidth: isSmallScreen ? "100%" : "600px",
                      margin: "0 auto",
                    }}
                  >
                    <Typography sx={{ mb: 1 }}>
                      {pregunta.texto.split("____").map((segment, i, arr) => (
                        <React.Fragment key={i}>
                          {segment}
                          {i < arr.length - 1 && (
                            <TextField
                              size="small"
                              variant="outlined"
                              value={
                                respuestas[`${bloqueIndex}-${preguntaIndex}`] || ""
                              }
                              onChange={(e) =>
                                handleRespuestaChange(
                                  bloqueIndex,
                                  preguntaIndex,
                                  e.target.value
                                )
                              }
                              sx={{ mx: 1, width: isSmallScreen ? "100px" : 120 }}
                              error={
                                respuestas[`${bloqueIndex}-${preguntaIndex}`] !==
                                  undefined &&
                                respuestas[`${bloqueIndex}-${preguntaIndex}`] !==
                                  pregunta.respuestaCorrecta
                              }
                              helperText={
                                respuestas[`${bloqueIndex}-${preguntaIndex}`] !==
                                undefined
                                  ? respuestas[`${bloqueIndex}-${preguntaIndex}`] ===
                                    pregunta.respuestaCorrecta
                                    ? "✅ Correcto"
                                    : "❌ Incorrecto"
                                  : ""
                              }
                              inputProps={{ maxLength: 50 }}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </Typography>

                    <Box
                      mt={1}
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        justifyContent: "center",
                      }}
                    >
                      {pregunta.opciones.map((op, idx) => (
                        <Chip
                          key={idx}
                          label={
                            <span
                              style={{ whiteSpace: "normal", display: "block" }}
                            >
                              {op}
                            </span>
                          }
                          onClick={() =>
                            handleRespuestaChange(bloqueIndex, preguntaIndex, op)
                          }
                          sx={{
                            ...chipLongTextSx,
                            backgroundColor:
                              respuestas[`${bloqueIndex}-${preguntaIndex}`] === op
                                ? op === pregunta.respuestaCorrecta
                                  ? "#4caf50"
                                  : "#f44336"
                                : "#e6dfef",
                            "&:hover": { backgroundColor: "#ff3333", color: "#fff" },
                            cursor: "pointer",
                          }}
                          clickable
                        />
                      ))}
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Actividades específicas por curso (opcional) */}
      {cursoSeleccionado === "Primeros Auxilios" && <ActividadesPA />}
      {cursoSeleccionado === "Regulación de emociones" && <ActividadRegulacionEmociones />}
      {cursoSeleccionado === "Inducción a los Desastres" && <ActividadesID />}
      {cursoSeleccionado === "Inducción a la Cruz Roja Mexicana" && <ActividadesCRM />}
      {cursoSeleccionado === "Acceso Más Seguro" && <ActividadesAMS />}

    </Box>
  );
}
