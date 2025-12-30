import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  IconButton,
  Modal,
} from "@mui/material";
import {
  IoIosArrowDropleftCircle,
  IoIosArrowDroprightCircle,
} from "react-icons/io";
import { FaPlay } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

import Program1 from "../assets/Prog1.png";
import Program2 from "../assets/Prog2.png";
import Program3 from "../assets/Prog3.png";
import Program4 from "../assets/Prog4.png";
import Program5 from "../assets/Prog5.png";
import Program6 from "../assets/Prog6.png";
import Program7 from "../assets/Prog7.png";
import Program8 from "../assets/Prog8.png";

const programas = [
  {
    key: "capacitacion",
    image: Program1,
    title: "Capacitación",
    videoId: "BFEMFcPdYAA",
    descripcion:
      "Aprende a salvar vidas y a enseñar a otras personas. La capacitación es la base para que cada voluntario actúe con seguridad, conocimiento y responsabilidad.",
    perfil:
      "Buscamos personas mayores de edad, con bachillerato concluido, interés por la enseñanza, gusto por trabajar con grupos y disposición para seguir formándose continuamente.",
    formacion:
      "La formación dura de 8 a 12 meses. Verás primeros auxilios, atención prehospitalaria básica, pedagogía para adultos, simulacros y práctica guiada.",
  },
  {
    key: "socorros",
    image: Program2,
    title: "Socorros",
    videoId: "UiYOTHesYt0",
    descripcion:
      "Es la cara operativa de la respuesta a emergencias. Apoyas en la atención prehospitalaria, traslados, guardias y respuesta ante desastres.",
    perfil:
      "Mayor de edad, bachillerato concluido, condición física adecuada, estabilidad emocional y compromiso con la capacitación continua.",
    formacion:
      "La formación dura de 8 a 12 meses. Verás atención prehospitalaria, manejo de equipo, guardias en ambulancia y protocolos de emergencia.",
  },
  {
    key: "apoyo-psicosocial",
    image: Program3,
    title: "Apoyo Psicosocial",
    videoId: "TeOujnVjKh4",
    descripcion:
      "Acompañas emocionalmente a personas y comunidades que han vivido emergencias, pérdidas o situaciones difíciles.",
    perfil:
      "Licenciatura en Psicología o área afín, sensibilidad humana, capacidad de escucha y ética profesional.",
    formacion:
      "La formación dura alrededor de 1 mes: primeros auxilios psicológicos, intervención en crisis y autocuidado del voluntariado.",
  },
  {
    key: "comunicacion",
    image: Program4,
    title: "Comunicación",
    videoId: "DBjV-ima4F8",
    descripcion:
      "Das voz a las historias y campañas de Cruz Roja. Ayudas a conectar a más personas con el movimiento.",
    perfil:
      "Interés por comunicación, diseño, fotografía, video o redes sociales; enfoque humanitario.",
    formacion:
      "1 mes: comunicación humanitaria, narrativa de impacto, buenas prácticas y manejo de imagen institucional.",
  },
  {
    key: "migracion",
    image: Program5,
    title: "Migración",
    videoId: "UTKAwLSsiIE",
    descripcion:
      "Acompañas a personas en situación de movilidad humana, brindando orientación y apoyo humanitario.",
    perfil:
      "Mayor de edad, sensibilidad hacia derechos humanos, trato respetuoso y escucha activa.",
    formacion:
      "1 mes: principios humanitarios, protección de personas migrantes y rutas seguras de canalización.",
  },
  {
    key: "prevencion",
    image: Program6,
    title: "Prevención",
    videoId: "q1lhkhA-wnc",
    descripcion:
      "Promueves la cultura de prevención de accidentes en hogares, escuelas y comunidades.",
    perfil:
      "Mayor de edad, gusto por dar pláticas, trabajar con escuelas y organizar actividades.",
    formacion:
      "1 mes: educación para la seguridad vial, campañas de prevención y talleres comunitarios.",
  },
  {
    key: "reduccion-riesgos",
    image: Program7,
    title: "Reducción de Riesgos",
    videoId: "m47TgdABs-o",
    descripcion:
      "Trabajas con comunidades para fortalecer su resiliencia ante desastres.",
    perfil:
      "Mayor de edad, interés en gestión del riesgo, trabajo comunitario y organización de brigadas.",
    formacion:
      "1 mes: análisis de vulnerabilidades, planes de emergencia y resiliencia comunitaria.",
  },
  {
    key: "voluntariado",
    image: Program8,
    title: "Voluntariado",
    videoId: "D86Dcc2PClg",
    descripcion:
      "Apoyas en actividades, eventos, centros de acopio y campañas humanitarias.",
    perfil:
      "Mayor de edad, disponibilidad flexible, actitud de servicio y trabajo en equipo.",
    formacion:
      "1 mes: inducción institucional, armado de kits, apoyo logístico y operaciones básicas.",
  },
];

const MotionBox = motion(Box);

const VideoModal = ({ open, onClose, videoId, title }) => (
  <Modal open={open} onClose={onClose}>
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: { xs: "92%", md: 700 },
        bgcolor: "#000",
        borderRadius: 2,
        p: 2,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            color: "#fff",
            fontSize: "0.95rem",
          }}
        >
          Video – {title}
        </Typography>
        <IconButton sx={{ color: "#fff" }} onClick={onClose}>
          <MdClose />
        </IconButton>
      </Box>

      <Box
        sx={{
          width: "100%",
          paddingTop: "56.25%",
          position: "relative",
          overflow: "hidden",
          borderRadius: 2,
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
          allowFullScreen
        />
      </Box>
    </Box>
  </Modal>
);

export default function ProgramasConVideo() {
  const [index, setIndex] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);

  const programa = programas[index];

  const handlePrev = () =>
    setIndex((prev) => (prev === 0 ? programas.length - 1 : prev - 1));

  const handleNext = () =>
    setIndex((prev) => (prev === programas.length - 1 ? 0 : prev + 1));

  return (
    <Box
      sx={{
        py: 8,
        backgroundColor: "#fff8ff",
        px: { xs: 2, md: 4 },
        textAlign: "center",
      }}
    >
      {/* TÍTULO GENERAL */}
      <Typography
        sx={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 800,
          fontSize: { xs: "1.6rem", md: "2.2rem" },
          textTransform: "uppercase",
          borderBottom: "4px solid #ff3333",
          display: "inline-block",
          mb: 4,
        }}
      >
        Nuestros programas
      </Typography>

      {/* CARRUSEL */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          maxWidth: 1100,
          mx: "auto",
          overflow: "hidden",
        }}
      >
        <IconButton onClick={handlePrev} sx={{ color: "#867d91" }}>
          <IoIosArrowDropleftCircle size={40} />
        </IconButton>

        <AnimatePresence mode="wait">
          <MotionBox
            key={programa.key}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4 }}
            component={Card}
            sx={{
              width: "100%",
              maxWidth: 900,
              borderRadius: 4,
              boxShadow: "0 6px 16px rgba(255,51,51,0.16)",
              overflow: "hidden",
              textAlign: "left",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: "stretch",
              }}
            >
              {/* COLUMNA 1 – IMAGEN */}
              <Box
                sx={{
                  width: { xs: "100%", sm: "35%", md: "32%" },
                  flexShrink: 0,
                }}
              >
                <Box
                  component="img"
                  src={programa.image}
                  alt={programa.title}
                  sx={{
                    width: "100%",
                    height: "100%",
                    maxHeight: { xs: 220, sm: "100%" },
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Box>

              {/* COLUMNA 2 – TEXTO */}
              <Box
                sx={{
                  flexGrow: 1,
                  flexBasis: 0,
                  minWidth: 0,
                  p: { xs: 3, md: 4 },
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* TÍTULO ROJO CENTRADO, SIN OVERFLOW RARO */}
                <Box
                  sx={{
                    backgroundColor: "#ff3333",
                    color: "#fff",
                    px: 2.5,
                    py: 0.6,
                    borderRadius: 999,
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    alignSelf: "center",
                    mb: 1.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      textAlign: "center",
                    }}
                  >
                    {programa.title}
                  </Typography>
                </Box>

                {/* DESCRIPCIÓN */}
                <Typography
                  sx={{
                    fontFamily: "'Outfit', system-ui",
                    lineHeight: 1.8,
                    color: "#444",
                    fontSize: "0.95rem",
                    mb: 2,
                    wordBreak: "break-word",
                  }}
                >
                  {programa.descripcion}
                </Typography>

                {/* PERFIL */}
                <Typography
                  sx={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    fontSize: "0.85rem",
                    color: "#ff3333",
                    mb: 0.6,
                    letterSpacing: 0.8,
                  }}
                >
                  PERFIL
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Outfit', system-ui",
                    lineHeight: 1.8,
                    color: "#444",
                    fontSize: "0.9rem",
                    mb: 1.8,
                  }}
                >
                  {programa.perfil}
                </Typography>

                {/* FORMACIÓN */}
                <Typography
                  sx={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    fontSize: "0.85rem",
                    color: "#ff3333",
                    mb: 0.6,
                    letterSpacing: 0.8,
                  }}
                >
                  FORMACIÓN
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Outfit', system-ui",
                    lineHeight: 1.8,
                    color: "#444",
                    fontSize: "0.9rem",
                    mb: 2,
                  }}
                >
                  {programa.formacion}
                </Typography>

                {/* BOTÓN */}
                <Button
                  variant="contained"
                  startIcon={<FaPlay />}
                  onClick={() => setVideoOpen(true)}
                  sx={{
                    backgroundColor: "#ff3333",
                    textTransform: "none",
                    fontFamily: "'Outfit', system-ui",
                    borderRadius: 999,
                    px: 3,
                    py: 0.8,
                    alignSelf: "flex-start",
                    "&:hover": { backgroundColor: "#e02b2b" },
                  }}
                >
                  Ver video
                </Button>
              </Box>
            </Box>

            {/* MODAL */}
            <VideoModal
              open={videoOpen}
              onClose={() => setVideoOpen(false)}
              videoId={programa.videoId}
              title={programa.title}
            />
          </MotionBox>
        </AnimatePresence>

        <IconButton onClick={handleNext} sx={{ color: "#867d91" }}>
          <IoIosArrowDroprightCircle size={40} />
        </IconButton>
      </Box>
    </Box>
  );
}
