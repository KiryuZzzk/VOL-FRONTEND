import RedBackground from "../assets/Banner.png";
import RedBackground2 from "../assets/Banner2.png";
import BloquesCursosComponent from "../components/BloquesCursosComponent";
import { Box, useMediaQuery } from "@mui/material";
import { useLocation } from "react-router-dom";
import { useMemo } from "react";

const norm = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Alias/tolerancia: cómo puede venir en la UI → nombre EXACTO que usa tu JSON
const aliasNombreJSON = {
  "gestion de emociones": "Regulación de emociones",
  "regulacion de emociones": "Regulación de emociones",
  "primeros auxilios": "Primeros Auxilios",
};

const resolverNombreCurso = (location) => {
  // 1) Prioriza lo que venga en location.state
  let nombre = location?.state?.cursoNombre;

  // 2) Si no hay state (ej. tras refresh), intenta leer de ?nombre=
  if (!nombre) {
    const qs = new URLSearchParams(location?.search || "");
    nombre = qs.get("nombre") || qs.get("c"); // por si lo envías como ?c=
  }

  if (!nombre) return null;

  // 3) Normaliza y aplica alias a nombre exacto del JSON
  const n = norm(nombre);
  return aliasNombreJSON[n] || nombre;
};

const Course = () => {
  const isSmallScreen = useMediaQuery("(max-width:1232px)");
  const location = useLocation();

  const cursoNombre = useMemo(() => resolverNombreCurso(location), [location]);

  return (
    <Box sx={{ backgroundColor: "#fff8ff" }}>
      {/* Banner superior */}
      <Box
        sx={{
          maxWidth: "100%",
          overflowX: "hidden",
          overflowY: "visible",
          aspectRatio: "16 / 1.5",
          backgroundImage: `url(${RedBackground})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          color: "#fff",
          px: { xs: 2, sm: 4, md: 6 },
          fontFamily: "'Arial Black', sans-serif",
          position: "relative",
          zIndex: 0,
          margin: 0,
          padding: 0,
        }}
      />

      {/* Pásale el nombre resuelto al componente de bloques */}
      <BloquesCursosComponent
        cursoNombre={cursoNombre}
        selectedCourseName={cursoNombre}
        // Si tu componente también acepta el JSON completo o un id,
        // aquí podrías pasarle más props.
      />

      {/* Banner inferior */}
      <Box
        sx={{
          maxWidth: "100%",
          overflowX: "hidden",
          overflowY: "visible",
          aspectRatio: "16 / 1.5",
          backgroundImage: `url(${RedBackground2})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          color: "#fff",
          px: { xs: 2, sm: 4, md: 6 },
          fontFamily: "'Arial Black', sans-serif",
          position: "relative",
          zIndex: 0,
          margin: 0,
          padding: 0,
        }}
      />
    </Box>
  );
};

export default Course;
