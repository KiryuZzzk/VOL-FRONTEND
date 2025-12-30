import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Modal,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  IoIosArrowDropleftCircle,
  IoIosArrowDroprightCircle,
} from "react-icons/io";
import { FaClipboardList, FaMapMarkedAlt, FaTasks } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import Program1 from "../assets/Prog1.png";
import Program2 from "../assets/Prog2.png";
import Program3 from "../assets/Prog3.png";
import { useNavigate } from "react-router-dom";

const programas = [
  {
    image: Program1,
    title: "Técnico en Urgencias ",
    videoId: "dQw4w9WgXcQ",
    modalidades: ["Presencial", "Híbrido"],
    requisitos: "Mayor de edad, bachillerato concluido, condición física, etc",
    estados: ["Todos los estados del país"],
    actividades:
      "Aprender técnicas de primeros auxilios, realizar simulacros y atención a emergencias.",
    descripcion:
      "Programa diseñado para formar voluntarios capaces de asistir en emergencias médicas básicas con eficacia y responsabilidad.",
  },
  {
    image: Program2,
    title: "Rescate Urbano",
    videoId: "TeOujnVjKh4",
    modalidades: ["Presencial", "Eventual"],
    requisitos:
      "Condición física adecuada, disponibilidad para prácticas, formación continua.",
    estados: ["Puebla", "Oaxaca", "Veracruz", "Querétaro"],
    actividades:
      "Participación en entrenamientos urbanos, búsqueda y rescate, apoyo en desastres.",
    descripcion:
      "Capacitación intensiva para intervención en zonas urbanas ante situaciones de emergencia y desastres naturales.",
  },
  {
    image: Program3,
    title: "Apoyo Psicológico",
    videoId: "D86Dcc2PClg",
    modalidades: ["A distancia", "Eventual"],
    requisitos:
      "Formación en psicología o áreas afines, empatía, responsabilidad.",
    estados: ["Chiapas", "Tabasco", "Morelos"],
    actividades:
      "Brindar contención emocional, colaborar con equipos multidisciplinarios.",
    descripcion:
      "Voluntariado para acompañar y apoyar emocionalmente a personas en crisis o situaciones difíciles.",
  },
];

const MotionBox = motion(Box);

const InfoModal = ({ open, onClose, title, content, icon }) => (
  <Modal open={open} onClose={onClose}>
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: { xs: "90%", md: 400 },
        bgcolor: "#fff",
        boxShadow: 24,
        borderRadius: 2,
        p: 4,
        outline: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", color: "#ff3333", display: "flex", alignItems: "center", gap: 1 }}
        >
          {icon}
          {title}
        </Typography>
        <IconButton onClick={onClose}>
          <MdClose />
        </IconButton>
      </Box>
      <Typography variant="body2" sx={{ color: "#333" }}>
        {content}
      </Typography>
    </Box>
  </Modal>
);

export default function ProgramasConVideo() {
  const [index, setIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(null);
  const theme = useTheme();
  const isSmallOrTablet = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  const handlePrev = () =>
    setIndex((prev) => (prev === 0 ? programas.length - 1 : prev - 1));
  const handleNext = () =>
    setIndex((prev) => (prev === programas.length - 1 ? 0 : prev + 1));

  const openModal = (key) => setModalOpen(key);
  const closeModal = () => setModalOpen(null);

  const programa = programas[index];

  return (
    <Box
      sx={{
        py: 10,
        textAlign: "center",
        backgroundColor: "#fff8ff",
        px: { xs: 2, md: 4 },
      }}
    >
      <Typography
        variant="h3"
        sx={{
          fontWeight: "bold",
          fontSize: { xs: "28px", md: "40px" },
          mb: 4,
        }}
      >
        Nuestros programas
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: isSmallOrTablet ? "column" : "row",
          gap: 2,
          width: "100%",
        }}
      >
        <IconButton onClick={handlePrev} sx={{ color: "#867d91" }}>
          <IoIosArrowDropleftCircle size={40} />
        </IconButton>

        <AnimatePresence mode="wait">
          <MotionBox
            key={programa.title}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4 }}
            component={Card}
            sx={{
              display: "flex",
              flexDirection: "column",
              borderRadius: 4,
              boxShadow: "0 4px 12px rgba(255, 51, 51, 0.2)",
              overflow: "hidden",
              maxWidth: 600, // más pequeño que antes
              width: "100%",
            }}
          >
            <Box
              component="img"
              src={programa.image}
              alt={programa.title}
              sx={{ width: "100%", height: 200, objectFit: "cover" }}
            />

            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: "#ff3333", mb: 2 }}
              >
                {programa.title}
              </Typography>

              <Typography variant="body2" sx={{ color: "#555", mb: 2 }}>
                {programa.descripcion}
              </Typography>

              <Box sx={{ position: "relative", paddingTop: "56.25%", mb: 3 }}>
                <iframe
                  src={`https://www.youtube.com/embed/${programa.videoId}`}
                  title={`Video del programa ${programa.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: 0,
                    borderRadius: 12,
                  }}
                />
              </Box>

              <Stack
                spacing={2}
                direction="row" // columna para que los botones ocupen todo el ancho
                justifyContent="center"
                sx={{ mb: 3, width: "100%" }}
              >
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<FaClipboardList />}
                  onClick={() => openModal("perfil")}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    color: "#fff",
                    width: "100%", // full ancho
                  }}
                >
                  Perfil de ingreso
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<FaMapMarkedAlt />}
                  onClick={() => openModal("estados")}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    color: "#fff",
                    width: "100%", // full ancho
                  }}
                >
                  Estados
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<FaTasks />}
                  onClick={() => openModal("actividades")}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    color: "#fff",
                    width: "100%", // full ancho
                  }}
                >
                  Actividades
                </Button>
              </Stack>

              <Box sx={{ mt: 3, width: "100%" }}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => navigate("/Registrate")}
                  sx={{
                    textTransform: "none",
                    borderRadius: "999px",
                    width: "100%", // full ancho
                    py: 1.5,
                    fontSize: "1rem",
                  }}
                >
                  Hazte voluntario
                </Button>
              </Box>

              {/* Modales */}
              <InfoModal
                open={modalOpen === "perfil"}
                onClose={closeModal}
                title="Perfil de ingreso"
                content={programa.requisitos}
                icon={<FaClipboardList />}
              />
              <InfoModal
                open={modalOpen === "estados"}
                onClose={closeModal}
                title="Estados"
                content={programa.estados.join(", ")}
                icon={<FaMapMarkedAlt />}
              />
              <InfoModal
                open={modalOpen === "actividades"}
                onClose={closeModal}
                title="Actividades"
                content={programa.actividades}
                icon={<FaTasks />}
              />
            </CardContent>
          </MotionBox>
        </AnimatePresence>

        <IconButton onClick={handleNext} sx={{ color: "#867d91" }}>
          <IoIosArrowDroprightCircle size={40} />
        </IconButton>
      </Box>
    </Box>
  );
}
