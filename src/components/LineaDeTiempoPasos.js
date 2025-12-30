import React from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const steps = [
  { number: 1, title: "Paso 1. REGISTRO", description: "A través de esta página, vas a registrar tu perfil." },
  { number: 2, title: "Paso 2. ENTREVISTA Y DOCUMENTOS", description: "Se te pedirá que subas tus documentos y agendes una entrevista." },
  { number: 3, title: "Paso 3. REVISIÓN DE TU PERFIL", description: "Los Responsables revisarán que tu perfil esté completo." },
  { number: 4, title: "Paso 4. FORMACIÓN INSTITUCIONAL", description: "Podrás empezar a tomar los cursos básicos para ser voluntario." },
  { number: 5, title: "Paso 5. SELECCIONAR PROGRAMA", description: "Aquí podrás elegir a cuál de nuestros programas quieres pertenecer." },
  { number: 6, title: "Paso 6. REVISIÓN DE TU SOLICITUD", description: "Los Responsables revisarán que cumplas con los requisitos." },
  { number: 7, title: "Paso 7. FORMACIÓN ESPECIALIZADA", description: "Podrás adquirirs los conocimientos claves de tu programa." },
  { number: 8, title: "Paso 8. INICIO DE ACTIVIDADES", description: "¡Bienvenido/a! Ya podrás participar como Voluntario." },
];

export default function LineaDeTiempoPasos({ onRegistrateClick }) {
  const navigate = useNavigate();

  const handleInternalClick = () => {
    if (onRegistrateClick) {
      onRegistrateClick();
    } else {
      navigate("/registrate");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#fff8ff",
        px: { xs: 2, md: 6 },
        py: { xs: 5, md: 8 },
      }}
    >
      {/* Keyframes */}
      <style>{`
        @keyframes fadeInUpSoft {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes softGlow {
          0% { box-shadow: 0 0 8px rgba(255,51,51,0.2); }
          50% { box-shadow: 0 0 14px rgba(255,51,51,0.38); }
          100% { box-shadow: 0 0 8px rgba(255,51,51,0.2); }
        }
      `}</style>

      {/* TÍTULO */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 800,
            textTransform: "uppercase",
            fontSize: { xs: "1.6rem", md: "2.2rem" },
            display: "inline-block",
            pb: 0.5,
            borderBottom: "4px solid #ff3333",
            letterSpacing: 1.2,
          }}
        >
          ¿CÓMO SER VOLUNTARIO?
        </Typography>
      </Box>

      {/* CONTENEDOR TIMELINE */}
      <Box
        sx={{
          position: "relative",
          maxWidth: 1100,
          mx: "auto",
          pt: 2,
        }}
      >
        {/* LÍNEA VERTICAL */}
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: "3px",
            background: "linear-gradient(to bottom, #ff9999, #ff3333)",
            transform: "translateX(-50%)",
            borderRadius: 3,
          }}
        />

        {/* PASOS */}
        {steps.map((step, i) => {
          const isLeft = i % 2 === 0;
          return (
            <Box
              key={step.number}
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: isLeft ? "flex-start" : "flex-end",
                mb: 2,
                position: "relative",
                animation: "fadeInUpSoft 0.6s ease-out forwards",
                opacity: 0,
                animationDelay: `${i * 0.08}s`,
              }}
            >
              {/* CÍRCULO DEL NÚMERO */}
              <Box
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 3,
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  backgroundColor: "#ff3333",
                  border: "3px solid #ff3333",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  animation: "softGlow 3s infinite ease-in-out",
                }}
              >
                {step.number}
              </Box>

              {/* TARJETA */}
              <Box
                sx={{
                  width: { xs: "90%", sm: "70%", md: "45%" },
                  backgroundColor: "#ffffff",
                  borderRadius: 3,
                  p: 2.5,
                  boxShadow: "0 4px 12px rgba(255,51,51,0.12)",
                  ml: isLeft ? 0 : { sm: 4, md: 6 },
                  mr: isLeft ? { sm: 4, md: 6 } : 0,
                  textAlign: isLeft ? "right" : "left",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#ff3333",
                    fontSize: "0.9rem",
                    mb: 0.7,
                    letterSpacing: 1,
                  }}
                >
                  {step.title}
                </Typography>

                <Typography
                  sx={{
                    fontFamily: "'Outfit', sans-serif",
                    color: "#444",
                    lineHeight: 1.6,
                    fontSize: "0.9rem",
                  }}
                >
                  {step.description}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* CTA FINAL */}
      <Box
        sx={{
          mt: 5,
          textAlign: "center",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        <Typography sx={{ fontSize: { xs: "0.95rem", md: "1rem" }, color: "#444" }}>
          ¿Quieres empezar tu camino?{" "}
          <Box
            component="span"
            onClick={handleInternalClick}
            sx={{
              color: "#ff3333",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
              textDecorationThickness: "2px",
              textUnderlineOffset: "3px",
              "&:hover": { opacity: 0.8 },
            }}
          >
            Da click aquí
          </Box>
        </Typography>
      </Box>
    </Box>
  );
}
