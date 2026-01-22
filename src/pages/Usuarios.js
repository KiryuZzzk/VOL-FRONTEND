import React, { useMemo, useState } from "react";
import { Box, Paper, Typography, Stack, Button, Divider } from "@mui/material";
import ConsultarUsuarios from "../components/ConsultarUsuarios"
import EditarUsuarios from "../components/EditarUsuarios";

/** 🎨 Paleta (misma vibra que tu tabla) */
const COLORS = {
  bg: "#f5f0ff",
  white: "#ffffff",
  whiteSoft: "#fff8ff",
  subtle: "#e6dfef",
  red: "#ff3333",
  redDark: "#cc0000",
  textMain: "#2d233a",
  textMuted: "#6c6478",
};

export default function Usuarios() {
  // "consultar" | "editar"
  const [mode, setMode] = useState("consultar");

  const modes = useMemo(
    () => [
      { key: "consultar", label: "Consultar usuarios" },
      { key: "editar", label: "Modificar usuarios" },
    ],
    []
  );

  const isConsultar = mode === "consultar";
  const isEditar = mode === "editar";

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: COLORS.bg, px: { xs: 1.5, md: 2 }, py: 2 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        {/* Header + switch */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            background: `linear-gradient(180deg, ${COLORS.whiteSoft} 0%, ${COLORS.white} 100%)`,
            border: `1px solid ${COLORS.subtle}`,
            mb: 2,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 900, color: COLORS.textMain, letterSpacing: 1.2 }}
              >
                USUARIOS
              </Typography>
              <Typography sx={{ color: COLORS.textMuted, mt: 0.3 }}>
                {isConsultar
                  ? "Vista de consulta (tabla, filtros, exportación)."
                  : "Vista de edición (buscar, seleccionar y actualizar perfil)."}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {modes.map((m) => {
                const active = mode === m.key;
                return (
                  <Button
                    key={m.key}
                    variant={active ? "contained" : "outlined"}
                    onClick={() => setMode(m.key)}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 900,
                      textTransform: "none",
                      ...(active
                        ? {
                            backgroundColor: COLORS.red,
                            "&:hover": { backgroundColor: COLORS.redDark },
                          }
                        : {
                            borderColor: COLORS.subtle,
                            color: COLORS.textMain,
                            backgroundColor: COLORS.white,
                            "&:hover": { backgroundColor: COLORS.whiteSoft, borderColor: COLORS.subtle },
                          }),
                    }}
                  >
                    {m.label}
                  </Button>
                );
              })}
            </Stack>
          </Stack>

          <Divider sx={{ my: 1.5, borderColor: COLORS.subtle }} />

          <Typography sx={{ color: COLORS.textMuted, fontSize: 13 }}>
            Tip: Recuerda revisar todas las columnas.
          </Typography>
        </Paper>

        {/* Render condicional */}
        {isConsultar && <ConsultarUsuarios />}
        {isEditar && <EditarUsuarios />}
      </Box>
    </Box>
  );
}
