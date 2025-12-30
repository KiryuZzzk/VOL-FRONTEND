import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  useMediaQuery,
} from "@mui/material";
import {
  IoIosArrowDropleftCircle,
  IoIosArrowDroprightCircle,
} from "react-icons/io";
import Curso1 from "../assets/Curso1.png";
import Curso2 from "../assets/Curso2.png";
import Curso3 from "../assets/Curso3.png";
import Curso4 from "../assets/Curso4.png";
import Curso5 from "../assets/Curso5.png";
// import Program4 from "../assets/Prog4.png"; // corrige/usa si existe
import { useNavigate } from "react-router-dom";

const MotionBox = motion(Box);

// ===== Helpers: normalizador + alias UI -> nombre EXACTO del JSON =====
const norm = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/**
 * Mapa de títulos que muestras en UI -> nombre EXACTO del JSON.
 * Si en la UI alguna vez pones “Gestión de emociones”, aquí lo traducimos al
 * “Regulación de emociones” del JSON.
 */
const aliasNombreJSON = {
  "Gestion de emociones": "Regulación de emociones",
  "Regulacion de emociones": "Regulación de emociones",
  "Primeros auxilios": "Primeros Auxilios",
};

const toNombreJSON = (uiTitle = "") => {
  const n = norm(uiTitle);
  return aliasNombreJSON[n] || uiTitle;
};

// ======= LISTAS =======
const programasInst = [
  { image: Curso1, title: "Primeros Auxilios", description: "Aprende a salvar vidas en situaciones de emergencia." },
  { image: Curso2, title: "Regulación de emociones", description: "Aprende a entender y regular tus emociones sanamente." },
  { image: Curso3, title: "Inducción a los Desastres", description: "Aprende a identificar y actuar ante desastres." },
  { image: Curso4, title: "Inducción a la Cruz Roja Mexicana", description: "Adéntrate en el Movimiento Internacional de Ayuda Humanitaria más grande del mundo." },
   { image: Curso5, title: "Acceso Más Seguro", description: "Aprende a actuar priorizando tu seguridad y la de tu equipo." },
 
  // { image: Program3, title: "Atención Prehospitalaria", description: "Protocolos y práctica clínica." },
];

const programasEsp = [
  // ...
];

const programasCon = [
  // ...
];

export default function CarrouselCursos() {
  const [index, setIndex] = useState(0);
  const [formacion, setFormacion] = useState("institucional");
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width:900px)");

  const programas =
    formacion === "especializada"
      ? programasEsp
      : formacion === "continua"
      ? programasCon
      : programasInst;

  // Asegura que el índice siempre sea válido al cambiar la lista
  useEffect(() => {
    if (index >= programas.length) setIndex(0);
  }, [programas.length, index]);

  const handlePrev = () =>
    setIndex((prev) => (prev === 0 ? programas.length - 1 : prev - 1));
  const handleNext = () =>
    setIndex((prev) => (prev === programas.length - 1 ? 0 : prev + 1));

  /**
   * IMPORTANTE:
   * - Mapeamos el título “visible” al nombre exacto del JSON.
   * - Enviamos por state y por querystring (?c=...) para que /Course pueda leer de ambos
   *   (útil si la página se recarga y se pierde location.state).
   */
  const handleClick = (cursoTituloUI) => {
    const nombreParaJSON = toNombreJSON(cursoTituloUI);
    navigate(`/Course?c=${encodeURIComponent(nombreParaJSON)}`, {
      state: { cursoNombre: nombreParaJSON },
      replace: false,
    });
  };

  // ==== Tarjeta de curso reutilizable ====
  const CursoCard = ({ programa, isCenter = false }) => (
    <Box
      sx={{
        flexShrink: 0,
        flexGrow: 0,
        width: { xs: "100%", sm: 300, md: 260 },
        minHeight: 350,
        transition: "transform 0.3s ease, opacity 0.3s ease",
        transform: isCenter ? "scale(1.05)" : "scale(0.98)",
        opacity: isCenter ? 1 : 0.95,
      }}
    >
      <Box
        component="img"
        src={programa.image}
        alt={programa.title}
        sx={{
          width: "100%",
          height: 160,
          objectFit: "cover",
          borderRadius: 2,
          mb: -5,
        }}
      />
      <Card
        sx={{
          borderRadius: 3,
          pt: 6,
          pb: 2,
          px: 2,
          backgroundColor: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          textAlign: "center",
          height: 210,
          display: "flex",
          alignItems: "center",
        }}
      >
        <CardContent sx={{ p: 0, width: "100%" }}>
          <Typography variant="h6" fontWeight="bold" fontSize="0.95rem" mb={1}>
            {programa.title}
          </Typography>
          <Typography variant="body2" fontSize="0.85rem" mb={2} sx={{ color: "#555" }}>
            {programa.description}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => handleClick(programa.title)}
            sx={{
              borderColor: "#867d91",
              color: "#867d91",
              fontSize: "0.8rem",
              textTransform: "none",
              borderRadius: "9999px",
              px: 2.5,
              py: 0.5,
              ":hover": { borderColor: "#ff4d4d", color: "#ff4d4d" },
            }}
          >
            Entrar
          </Button>
        </CardContent>
      </Card>
    </Box>
  );

  // ==== Render principal ====
  const count = programas.length;
  const showCarousel = count >= 3;

  return (
    <Box
      sx={{
        py: 2,
        textAlign: "center",
        fontFamily: "'Arial Black', Arial, sans-serif",
        backgroundColor: "#fff8ff",
        px: { xs: 1, sm: 3, md: 10 },
        position: "relative",
      }}
    >
      <FormControl sx={{ mb: 4, minWidth: 250 }} variant="outlined">
        <InputLabel id="formacion-label" sx={{ color: "#ee140a", fontFamily: "'Arial', sans-serif" }}>
          Tipo de Formación
        </InputLabel>
        <Select
          labelId="formacion-label"
          value={formacion}
          label="Tipo de Formación"
          onChange={(e) => {
            setFormacion(e.target.value);
            setIndex(0);
          }}
          sx={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            fontFamily: "'Arial', sans-serif",
            fontWeight: "bold",
            color: "#333",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ee140a" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b30000" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#b30000", borderWidth: "2px" },
            "& .MuiSvgIcon-root": { color: "#ee140a" },
          }}
        >
          <MenuItem value="institucional">Formación Institucional</MenuItem>
          {/* <MenuItem value="especializada">Formación Especializada</MenuItem>
          <MenuItem value="continua">Formación Continua</MenuItem> */}
        </Select>
      </FormControl>

      {/* ====== SIN CURSOS ====== */}
      {count === 0 && (
        <Typography sx={{ color: "#867d91", fontWeight: 600 }}>
          Próximamente publicaremos cursos en esta categoría.
        </Typography>
      )}

      {/* ====== 1 o 2 CURSOS (NO CARRUSEL) ====== */}
      {(count === 1 || count === 2) && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: count === 1 ? "1fr" : "1fr 1fr",
            },
            gap: 4,
            alignItems: "center",
            justifyItems: "center",
            width: "100%",
          }}
        >
          {programas.map((p, i) => (
            <CursoCard key={i} programa={p} isCenter />
          ))}
        </Box>
      )}

      {/* ====== 3+ CURSOS (CARRUSEL) ====== */}
      {showCarousel && (
        <>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              minHeight: 300,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: isDesktop ? "row" : "column",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                gap: 4,
                flexWrap: isDesktop ? "nowrap" : "wrap",
                position: "relative",
              }}
            >
              {isDesktop && (
                <Box
                  onClick={handlePrev}
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "-50px",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#867d91",
                    "&:hover": { color: "#ff4d4d" },
                    zIndex: 2,
                  }}
                >
                  <IoIosArrowDropleftCircle size={40} />
                </Box>
              )}

              {(isDesktop ? [0, 1, 2] : [0]).map((offset) => {
                const cardIndex = (index + offset) % count;
                const programa = programas[cardIndex];
                const isCenter = offset === 1 || !isDesktop;

                return (
                  <CursoCard
                    key={`${cardIndex}-${offset}`}
                    programa={programa}
                    isCenter={isCenter}
                  />
                );
              })}

              {isDesktop && (
                <Box
                  onClick={handleNext}
                  sx={{
                    position: "absolute",
                    top: "50%",
                    right: "-50px",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#867d91",
                    "&:hover": { color: "#ff4d4d" },
                    zIndex: 2,
                  }}
                >
                  <IoIosArrowDroprightCircle size={40} />
                </Box>
              )}
            </Box>

            {!isDesktop && (
              <Box sx={{ display: "flex", gap: 3, mt: 3 }}>
                <Box
                  onClick={handlePrev}
                  sx={{ cursor: "pointer", color: "#867d91", "&:hover": { color: "#ff4d4d" } }}
                >
                  <IoIosArrowDropleftCircle size={40} />
                </Box>
                <Box
                  onClick={handleNext}
                  sx={{ cursor: "pointer", color: "#867d91", "&:hover": { color: "#ff4d4d" } }}
                >
                  <IoIosArrowDroprightCircle size={40} />
                </Box>
              </Box>
            )}
          </Box>

          {/* Indicadores solo en carrusel */}
          <Box mt={4} display="flex" justifyContent="center" gap={1}>
            {programas.map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: i === index ? 10 : 8,
                  height: i === index ? 10 : 8,
                  borderRadius: "50%",
                  backgroundColor: i === index ? "#ff3333" : "#867d91",
                  transition: "background-color 0.3s ease",
                }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
