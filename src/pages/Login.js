import { Box, Typography } from "@mui/material";
import LoginForm from "../components/LoginForm";

import bannerBg from "../assets/Banner.png";
import crmMexicoImg from "../assets/crmexico.png";
import crmLogo from "../assets/logos/cruz-roja-logo.png";

const Login = () => {
  return (
    <Box
      sx={{
        minHeight: "85vh",
        width: "100%",
        backgroundImage: `url(${bannerBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 2 },
        py: { xs: 0, sm: 0 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 720, // ✅ igual que antes, no hacemos más grande el card
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          bgcolor: "#ffffff",
        }}
      >
        {/* IZQUIERDA */}
        <Box
          sx={{
            // antes: flex: 1
            flex: { xs: "1 1 100%", md: 0.9 }, // 🔹 un poco más angosto en desktop
            minHeight: { xs: 140, md: 240 },   // ✅ misma altura mínima
          }}
        >
          <Box
            component="img"
            src={crmMexicoImg}
            alt="Cruz Roja Mexicana"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </Box>

        {/* DERECHA */}
        <Box
          sx={{
            // antes: flex: 1
            flex: { xs: "1 1 100%", md: 1.1 }, // 🔹 un poquito más ancho que la izquierda
            px: { xs: 3, md: 4 },
            py: { xs: 3, md: 4 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.3,
          }}
        >
          {/* Logo más grande */}
          <Box
            component="img"
            src={crmLogo}
            alt="Logo Cruz Roja Mexicana"
            sx={{
              width: 160,
              mb: 1,
            }}
          />

          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              textAlign: "center",
              fontSize: { xs: "1rem", md: "1.2rem" },
            }}
          >
            INICIAR SESIÓN
          </Typography>

          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              color: "#444",
              maxWidth: 380, // 🔹 antes 300 → texto con más aire horizontal
              mb: 0.5,
              fontSize: { xs: "0.78rem", md: "0.85rem" },
            }}
          >
            Ingresa a la plataforma colocando tu usuario y contraseña.
          </Typography>

          <LoginForm />
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
