// src/components/TusProgramas.js
import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Grid } from "@mui/material";
import { FaPlay } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import rawProgramsData from "./datav2.json";
//import rawProgramsData from "./datavacia.json";

// =======================
// 🔧 CONFIG
// =======================

const HEADER_TITLE = "TUS PROGRAMAS";

const COLOR_BANDA_SUPERIOR = "#867d91";
const COLOR_PADRE_FONDO = "#e6dfef";
const COLOR_CARD_FONDO = "#ff3333";
const COLOR_CARD_CONTENIDO = "#ffffff";

const DEFAULT_PROGRAM_IMAGE = "/assets/Prog1.png";

// categorías lógicas → etiquetas que ves en UI
const PROGRAM_CATEGORIES = [
  { key: "formacionInstitucional", label: "FORMACIÓN INSTITUCIONAL" },
  { key: "formacionEspecializada", label: "FORMACIÓN ESPECIALIZADA" },
  { key: "formacionContinua", label: "FORMACIÓN CONTINUA" },
];

// normalizamos el JSON
const normalizePrograms = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.programs)) return data.programs;
  if (data.id) return [data];
  return [];
};

// agrupar por categoría
const groupProgramsByCategory = (programs) => {
  const grouped = {};
  programs.forEach((program) => {
    const catKey = program.formacion || "otros";
    if (!grouped[catKey]) grouped[catKey] = [];
    grouped[catKey].push(program);
  });
  return grouped;
};

// construimos estructura base
const ALL_PROGRAMS = normalizePrograms(rawProgramsData);
const PROGRAMS_BY_CATEGORY = groupProgramsByCategory(ALL_PROGRAMS);

// =======================
// 🌟 COMPONENTE PRINCIPAL
// =======================

const TusProgramas = ({ onProgramClick }) => {
  const navigate = useNavigate();

  const [activeCategoryKey, setActiveCategoryKey] = useState(
    PROGRAM_CATEGORIES[0].key
  );
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 2;

  const programs = PROGRAMS_BY_CATEGORY[activeCategoryKey] || [];
  const pageCount = Math.ceil(programs.length / PAGE_SIZE) || 1;
  const startIndex = currentPage * PAGE_SIZE;
  const visiblePrograms = programs.slice(startIndex, startIndex + PAGE_SIZE);

  // cuando cambias de categoría, resetea a la primera página
  useEffect(() => {
    setCurrentPage(0);
  }, [activeCategoryKey]);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, pageCount - 1));
  };

  const handleStartProgram = (program) => {
    const id = program.id || program.slug;
    if (!id) return;

    if (onProgramClick) {
      // modo “controlado” desde el padre
      onProgramClick(id);
    } else {
      // fallback: navegar directo a /Programa?id=...
      navigate(`/Programa?id=${encodeURIComponent(id)}`);
    }
  };

  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <Box sx={{ width: "100%", maxWidth: 1100 }}>
        {/* BANDA SUPERIOR */}
        <Box
          sx={{
            backgroundColor: COLOR_BANDA_SUPERIOR,
            color: "#ffffff",
            px: 2,
            py: 1,
            borderRadius: "12px 12px 0 0",
            textAlign: "center",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {HEADER_TITLE}
          </Typography>
        </Box>

        {/* CONTENEDOR GRIS PADRE */}
        <Box
          sx={{
            backgroundColor: COLOR_PADRE_FONDO,
            borderRadius: "0 0 12px 12px",
            px: { xs: 1.5, md: 2 },
            pb: 2,
            pt: 1.5,
          }}
        >
          {/* TABS / CATEGORÍAS */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 1,
              mb: 1,
            }}
          >
            {PROGRAM_CATEGORIES.map((category) => {
              const isActive = category.key === activeCategoryKey;
              return (
                <Box
                  key={category.key}
                  onClick={() => setActiveCategoryKey(category.key)}
                  sx={{
                    flex: 1,
                    maxWidth: 260,
                    cursor: "pointer",
                    textAlign: "center",
                    py: 0.8,
                    px: 1,
                    borderRadius: "999px",
                    backgroundColor: isActive ? "#ffffff" : "transparent",
                    boxShadow: isActive
                      ? "0 2px 6px rgba(0,0,0,0.08)"
                      : "none",
                    transition: "all 0.15s ease",
                    "&:hover": !isActive
                      ? { backgroundColor: "rgba(255,255,255,0.3)" }
                      : {},
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive ? 700 : 400,
                      textTransform: "uppercase",
                      fontSize: ".75rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {category.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* PANEL BLANCO DE CARDS */}
          <Box
            sx={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              pt: 2.5,
              pb: 2.5,
              px: { xs: 1.5, md: 2 },
            }}
          >
            <Grid
              container
              spacing={2}
              justifyContent="center"
              alignItems="stretch"
            >
              {visiblePrograms.map((program) => (
                <Grid
                  item
                  key={program.id}
                  xs={12}
                  sm={6}
                  md={6}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  {/* CARD ROJA COMPACTA */}
                  <Box
                    sx={{
                      backgroundColor: COLOR_CARD_FONDO,
                      borderRadius: 2.5,
                      width: "100%",
                      maxWidth: 280,
                      minHeight: 280,
                      p: 1.5,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                    }}
                  >
                    {/* IMAGEN */}
                    <Box
                      component="img"
                      src={program.image || DEFAULT_PROGRAM_IMAGE}
                      alt={program.title}
                      sx={{
                        width: "100%",
                        height: 150,
                        objectFit: "cover",
                        borderRadius: 1.5,
                      }}
                    />

                    {/* CAPA BLANCA */}
                    <Box
                      sx={{
                        backgroundColor: COLOR_CARD_CONTENIDO,
                        borderRadius: 1.5,
                        mt: -2.5,
                        pt: 3,
                        pb: 2.2,
                        px: 1.8,
                        width: "90%",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        flexGrow: 1,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            textTransform: "uppercase",
                            mb: 0.7,
                          }}
                        >
                          {program.title}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{ fontSize: ".8rem", lineHeight: 1.3 }}
                        >
                          {program.description}
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        startIcon={<FaPlay size={12} />}
                        sx={{
                          backgroundColor: COLOR_CARD_FONDO,
                          color: "#ffffff",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          fontSize: "0.7rem",
                          px: 2.5,
                          borderRadius: 999,
                          mt: 1.5,
                          alignSelf: "center",
                          "&:hover": { backgroundColor: "#cc0000" },
                        }}
                        onClick={() => handleStartProgram(program)}
                      >
                        INICIAR
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              ))}

              {programs.length === 0 && (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: "center", py: 2 }}>
                    <Typography variant="body2">
                      No tienes programas inscritos en esta categoría aún.
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* CONTROLES TIPO CAROUSEL */}
            {programs.length > PAGE_SIZE && (
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handlePrev}
                  disabled={currentPage === 0}
                  sx={{
                    borderColor: "#ff3333",
                    color: "#ff3333",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    px: 1.8,
                    py: 0.2,
                    borderRadius: 999,
                    "&:hover": {
                      borderColor: "#cc0000",
                      color: "#cc0000",
                      backgroundColor: "rgba(255,51,51,0.06)",
                    },
                    "&.Mui-disabled": {
                      borderColor: "rgba(0,0,0,0.2)",
                      color: "rgba(0,0,0,0.3)",
                    },
                  }}
                >
                  Anterior
                </Button>

                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "#555", letterSpacing: 0.5 }}
                >
                  {currentPage + 1} de {pageCount}
                </Typography>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleNext}
                  disabled={currentPage >= pageCount - 1}
                  sx={{
                    borderColor: "#ff3333",
                    color: "#ff3333",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    px: 1.8,
                    py: 0.2,
                    borderRadius: 999,
                    "&:hover": {
                      borderColor: "#cc0000",
                      color: "#cc0000",
                      backgroundColor: "rgba(255,51,51,0.06)",
                    },
                    "&.Mui-disabled": {
                      borderColor: "rgba(0,0,0,0.2)",
                      color: "rgba(0,0,0,0.3)",
                    },
                  }}
                >
                  Siguiente
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TusProgramas;
