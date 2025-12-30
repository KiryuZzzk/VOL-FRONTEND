import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';

import nparra from '../assets/dir/nparra.png';
import frivera from '../assets/dir/frivera.png';
import mhinojosa from '../assets/dir/mhinojosa.png';
import bavila from '../assets/dir/bavila.png';
import avatarcrm from '../assets/dir/avatarcrm.png';

const personas = [
  {
    nombre: 'Lic. Natalia María Parra Campas',
    titulo: 'Coordinadora Nacional de Capacitación',
    correo: 'nparra@cruzrojamexicana.org.mx',
    descripcion: 'Dirige y supervisa los programas de formación y capacitación a nivel nacional.',
    avatar: nparra
  },
  {
    nombre: 'Lic. Brenda Ávila Flores',
    titulo: 'Coordinadora Nacional de Reducción de Riesgos',
    correo: 'bavila@cruzrojamexicana.org.mx',
    descripcion: 'Encargada de promover estrategias para reducir el impacto de desastres.',
    avatar: bavila
  },
  {
    nombre: 'Mtra. Pitichi Rivadeneyra López Hernández',
    titulo: 'Coordinadora Nacional de Prevención',
    correo: 'plopez@cruzrojamexicana.org.mx',
    descripcion: 'Coordina acciones preventivas en salud y seguridad comunitaria.',
    avatar: avatarcrm
  },
  {
    nombre: 'Mtro. Fernando Rivera Muñoz',
    titulo: 'Coordinador Nacional de Voluntariado',
    correo: 'frivera@cruzrojamexicana.org.mx',
    descripcion: 'Gestiona y fortalece la red de voluntariado en todo el país.',
    avatar: frivera
  },
  {
    nombre: 'Lic. Jose Luis Camacho Toledo',
    titulo: 'Coordinador Nacional de Migración',
    correo: 'jlcamacho@cruzrojamexicana.org.mx',
    descripcion: 'Lidera la atención y protección de personas migrantes.',
    avatar: avatarcrm
  },
  {
    nombre: 'Psic. Marta Dolores Hinojosa Falcon',
    titulo: 'Coordinadora Nacional de Apoyo Psicosocial',
    correo: 'mhinojosa@cruzrojamexicana.org.mx',
    descripcion: 'Brinda apoyo emocional y psicológico a comunidades vulnerables.',
    avatar: mhinojosa
  },
  {
    nombre: 'Cmdte. Isaac Oxenhaut Gruszko',
    titulo: 'Coordinador Nacional de Socorros',
    correo: 'ioxenhaut@cruzrojamexicana.org.mx',
    descripcion: 'Encabeza las operaciones de emergencia y respuesta ante desastres.',
    avatar: avatarcrm
  },
];

export default function Directorio() {
  return (
    <Box sx={{ backgroundColor: '#fff8ff', py: 8, px: 4 }}>
      <Typography
        variant="h3"
        sx={{
          fontWeight: "bold",
          fontSize: "40px",
          textAlign: "center",
          color: "black",
          mb: 2,
        }}
      >
        Directorio Nacional de Coordinadores
      </Typography>

      <Typography
        variant="body1"
        sx={{
          maxWidth: 700,
          mx: "auto",
          mb: 6,
          color: "#444",
          textAlign: "center",
          lineHeight: 1.5,
          fontSize: "0.95rem",
        }}
      >
        Este directorio reúne a las personas responsables de liderar, coordinar y transformar el trabajo de la Cruz Roja Mexicana a nivel nacional. Aquí encontrarás a quienes guían con entrega, compromiso y visión en cada una de las áreas clave.
      </Typography>

      <Grid container spacing={4} direction="column" alignItems="center">
        {personas.map((persona, index) => (
          <Grid item key={index} sx={{ width: '100%', maxWidth: 800, }}>
            <Card
              sx={{
                display: 'flex',
                boxShadow: '0 4px 10px #e6dfef',
                borderRadius: 3,
                overflow: 'hidden',
                backgroundColor: '#fff',
              }}
            >
              {/* Lado izquierdo cuadrado con imagen tipo cover */}
              <Box
                sx={{
                  width: 180,
                  height: 250,
                  flexShrink: 0,
                  backgroundImage: `url(${persona.avatar})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: '#f0f0f0',
                }}
              />

              {/* Lado derecho con texto */}
              <CardContent
                sx={{
                  flex: 1,
                  padding: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="subtitle2" sx={{ color: '#ff3333', fontWeight: 'bold' }}>
                  {persona.titulo}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {persona.nombre}
                </Typography>
                <Typography variant="body2" sx={{ color: '#555' }}>
                  {persona.correo}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#666' }}>
                  {persona.descripcion}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
