// src/components/Calendar.jsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import { FiCalendar } from "react-icons/fi";
import Calendar from "react-calendar";

// Mock de eventos para probar diseño
const mockEvents = [
  { id: 1, date: "2025-12-03", title: "Entrega módulo 1" },
  { id: 2, date: "2025-12-04", title: "Clase en vivo: Introducción" },
  { id: 3, date: "2025-12-10", title: "Evaluación diagnóstica" },
  { id: 4, date: "2025-12-10", title: "Recordatorio de foro" },
  { id: 5, date: "2025-12-21", title: "Cierre de inscripciones" },
];

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const Calendario = ({
  events = mockEvents,
  title = "Calendario",
  onDateClick,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // indexar eventos por fecha
  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [events]);

  const selectedKey = formatDateKey(selectedDate);
  const eventsForSelected = eventsByDate[selectedKey] || [];

  const handleChange = (date) => {
    setSelectedDate(date);
    const key = formatDateKey(date);
    const dayEvents = eventsByDate[key] || [];
    if (onDateClick) onDateClick(key, dayEvents);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 3,
        background: "#fff8ff",
        border: "1px solid #e6dfef",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 3,
      }}
    >
      {/* Panel izquierdo: calendario */}
      <Box sx={{ flex: 1, minWidth: 280 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
            gap: 1,
          }}
        >
          <FiCalendar size={22} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Marca entregas, sesiones y fechas clave.
            </Typography>
          </Box>
        </Box>

        <Calendar
          onChange={handleChange}
          value={selectedDate}
          // Lunes como primer día
          locale="es-MX"
          calendarType="iso8601"
          // Personalizar contenido de cada día
          tileContent={({ date, view }) => {
            if (view !== "month") return null;
            const key = formatDateKey(date);
            const dayEvents = eventsByDate[key] || [];
            if (!dayEvents.length) return null;

            return (
              <Box sx={{ mt: 0.5, display: "flex", justifyContent: "center" }}>
                <Chip
                  size="small"
                  label={dayEvents.length}
                  sx={{
                    height: 18,
                    fontSize: "0.65rem",
                    borderRadius: 999,
                    backgroundColor: "#f3eaff",
                  }}
                />
              </Box>
            );
          }}
          // Personalizar clases para días con eventos (por si luego quieres CSS)
          tileClassName={({ date, view }) => {
            if (view !== "month") return "";
            const key = formatDateKey(date);
            if (eventsByDate[key]?.length) {
              return "cal-has-events";
            }
            return "";
          }}
        />
      </Box>

      {/* Panel derecho: eventos del día + próximos */}
      <Box sx={{ flex: 1, minWidth: 260 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {`Eventos del ${selectedKey}`}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Stack spacing={1.2} sx={{ mb: 2 }}>
          {eventsForSelected.length === 0 && (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", fontStyle: "italic" }}
            >
              No hay eventos para esta fecha.
            </Typography>
          )}
          {eventsForSelected.map((ev) => (
            <Paper
              key={ev.id}
              variant="outlined"
              sx={{
                p: 1,
                borderRadius: 2,
                borderColor: "#e6dfef",
                background: "#ffffff",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {ev.title}
              </Typography>
            </Paper>
          ))}
        </Stack>

        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Próximos eventos
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Stack spacing={1}>
          {events.length === 0 && (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", fontStyle: "italic" }}
            >
              No hay eventos programados por el momento.
            </Typography>
          )}

          {events
            .slice()
            .sort((a, b) => (a.date > b.date ? 1 : -1))
            .slice(0, 5)
            .map((ev) => (
              <Paper
                key={ev.id}
                variant="outlined"
                sx={{
                  p: 1,
                  borderRadius: 2,
                  borderColor: "#e6dfef",
                  background: "#ffffff",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary" }}
                >
                  {ev.date}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {ev.title}
                </Typography>
              </Paper>
            ))}
        </Stack>
      </Box>
    </Paper>
  );
};

export default Calendario;
