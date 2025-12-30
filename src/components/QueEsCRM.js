import React from "react";
import { Box, Typography, Card } from "@mui/material";
import inicio1 from "../assets/inicio1.png";
import logoifrc from "../assets/logoifrc.png";
import logocrm from "../assets/logocrm.png";
import logoicrc from "../assets/logoicrc.png";

export default function QueEsCRM() {
  return (
    <Box
      sx={{
        px: { xs: 2, md: 6 },
        py: { xs: 4, md: 6 },
        backgroundColor: "#fff8ff",
        color: "#000",
      }}
    >
      {/* TÍTULO */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "1.8rem", md: "2.3rem" },
            fontFamily: "'Montserrat', sans-serif",
            display: "inline-block",
            pb: 0.4,
            borderBottom: "4px solid #ff3333",
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          ¿Qué es la Cruz Roja Mexicana?
        </Typography>
      </Box>

      {/* DESCRIPCIÓN */}
      <Typography
        variant="body1"
        sx={{
          maxWidth: 900,
          mx: "auto",
          textAlign: "center",
          fontFamily: "'Outfit', system-ui",
          fontSize: { xs: "0.95rem", md: "1rem" },
          lineHeight: 1.7,
          color: "#333",
          mb: 4,
        }}
      >
        Cruz Roja Mexicana es una institución de asistencia privada no
        gubernamental, humanitaria, imparcial, neutral e independiente; que
        moviliza redes de voluntarios, comunidades y donantes para operar
        programas y servicios que tienen como objetivo el preservar la salud, la
        vida y aliviar el sufrimiento humano de la población en situación de
        vulnerabilidad.
      </Typography>

      {/* CONTENEDOR DEL BANNER + CAJITAS */}
      <Box
        sx={{
          position: "relative",
          maxWidth: 1100,
          mx: "auto",
        }}
      >
        {/* BANNER */}
        <Box
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          }}
        >
          <Box
            component="img"
            src={inicio1}
            alt="Cruz Roja Mexicana"
            sx={{
              width: "100%",
              height: { xs: 160, md: 210 },
              objectFit: "cover",
            }}
          />
        </Box>

        {/* CAJITAS flotantes */}
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: "100%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            gap: { xs: 2, md: 4 },
            flexDirection: { xs: "column", sm: "row" },
            width: { xs: "90%", md: "80%" },
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {/* MISIÓN */}
          <Card
            sx={{
              flex: 1,
              borderRadius: 3,
              overflow: "hidden",
              backgroundColor: "#ffffff",
              pointerEvents: "auto",
              boxShadow: "0 4px 10px rgba(255,51,51,0.18)", // sombra más sutil
            }}
          >
            <Box
              sx={{
                bgcolor: "#d8cfe5",
                color: "#000",
                textAlign: "center",
                py: 1,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1,
                  fontSize: "0.9rem",
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                MISIÓN
              </Typography>
            </Box>

            <Box sx={{ p: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  color: "#333",
                  fontFamily: "'Outfit', system-ui",
                }}
              >
                La Cruz Roja Mexicana es parte del Movimiento Internacional de la
                Cruz Roja y de la Media Luna Roja, el movimiento humanitario más
                grande del mundo, presente en casi todos los países.
              </Typography>
            </Box>
          </Card>

          {/* VISIÓN */}
          <Card
            sx={{
              flex: 1,
              borderRadius: 3,
              overflow: "hidden",
              backgroundColor: "#ffffff",
              pointerEvents: "auto",
              boxShadow: "0 4px 10px rgba(255,51,51,0.18)", // sombra más suave
            }}
          >
            <Box
              sx={{
                bgcolor: "#d8cfe5",
                color: "#000",
                textAlign: "center",
                py: 1,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1,
                  fontSize: "0.9rem",
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                VISIÓN
              </Typography>
            </Box>

            <Box sx={{ p: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  color: "#333",
                  fontFamily: "'Outfit', system-ui",
                }}
              >
                Su visión es ser una institución humanitaria moderna, cercana a
                las personas y capaz de responder eficazmente ante cualquier
                emergencia o necesidad social.
              </Typography>
            </Box>
          </Card>
        </Box>
      </Box>

      {/* ESPACIO inferior */}
      <Box sx={{ height: { xs: 160, md: 180 } }} />

      {/* LOGOS */}
      <Box
        sx={{
          maxWidth: 700,
          mx: "auto",
        }}
      >
        <Box
          sx={{
            backgroundColor: "#ffffff",
            borderRadius: 3,
            px: { xs: 2, md: 4 },
            py: { xs: 2, md: 3 },
            boxShadow: "0 4px 10px rgba(255,51,51,0.12)", // sombra rojita suave
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: { xs: 2, md: 4 },
            }}
          >
            {/* IFRC */}
            <Box
              sx={{
                flex: 1,
                textAlign: "center",
                py: 1.5,
                borderRight: "1px solid #d8cfe5",
              }}
            >
              <Box
                component="img"
                src={logoifrc}
                alt="IFRC"
                sx={{
                  maxHeight: { xs: 60, md: 80 },
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
            </Box>

            {/* CRM */}
            <Box
              sx={{
                flex: 1,
                textAlign: "center",
                py: 1.5,
                borderRight: "1px solid #d8cfe5",
              }}
            >
              <Box
                component="img"
                src={logocrm}
                alt="Cruz Roja Mexicana"
                sx={{
                  maxHeight: { xs: 60, md: 80 },
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
            </Box>

            {/* ICRC */}
            <Box
              sx={{
                flex: 1,
                textAlign: "center",
                py: 1.5,
              }}
            >
              <Box
                component="img"
                src={logoicrc}
                alt="ICRC"
                sx={{
                  maxHeight: { xs: 60, md: 80 },
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
