import { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  TextField,
  Box,
  Typography,
  Button,
  InputAdornment,
} from "@mui/material";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";

const MotionButton = motion(Button);

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
    } catch (error) {
      const code = error?.code || "";
      let friendly = error.message;

      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        friendly = "Correo o contraseña incorrectos.";
      } else if (code === "auth/user-not-found") {
        friendly = "No encontramos una cuenta con ese correo.";
      }

      setMessage(`Error: ${friendly}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async () => {
    setLoading(true);
    setMessage("");
    try {
      await sendPasswordResetEmail(auth, recoveryEmail.trim());
      setMessage("Correo de recuperación enviado.");
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 380,
        mt: 1,
      }}
    >
      {!showRecovery ? (
        <>
          <TextField
            label="Correo electrónico"
            type="email"
            value={email}
            size="small"
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="dense"
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiMail color="#867d91" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Contraseña"
            type="password"
            value={password}
            size="small"
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="dense"
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiLock color="#867d91" />
                </InputAdornment>
              ),
            }}
          />

          {/* Botón centrado */}
          <Box sx={{ mt: 2, mb: 2, display: "flex", justifyContent: "center" }}>
            <MotionButton
              onClick={handleLogin}
              disabled={loading || !email || !password}
              sx={{
                backgroundColor: "#ff3333",
                color: "#fff",
                px: 3,
                py: 1,
                borderRadius: "9999px",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "0.8rem",
                gap: 1,
                "&:hover": { backgroundColor: "#e02c2c" },
              }}
              whileHover={{
                scale: loading ? 1 : 1.03,
              }}
            >
              INGRESAR
              <FiArrowRight color="#fff" />
            </MotionButton>
          </Box>

          {/* Registro */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 0.6,
              mb: 0.5,
              flexWrap: "wrap",
            }}
          >
            <Typography sx={{ color: "#000", fontSize: "0.78rem" }}>
              ¿Todavía no tienes una cuenta?
            </Typography>

            <Typography
              sx={{
                color: "#e53935",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "0.78rem",
              }}
              onClick={() => window.location.assign("/Registrate")}
            >
              Regístrate
            </Typography>
          </Box>

          {/* Recuperar contraseña */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 0.6,
              flexWrap: "wrap",
            }}
          >
            <Typography sx={{ color: "#000", fontSize: "0.78rem" }}>
              ¿No recuerdas tu contraseña?
            </Typography>

            <Typography
              sx={{
                color: "#e53935",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "0.78rem",
              }}
              onClick={() => {
                setShowRecovery(true);
                setRecoveryEmail(email);
              }}
            >
              Recuperar tu contraseña
            </Typography>
          </Box>
        </>
      ) : (
        <>
          <Typography
            textAlign="center"
            sx={{
              mb: 1,
              fontWeight: 600,
              fontSize: "0.95rem",
            }}
          >
            Recuperar contraseña
          </Typography>

          <TextField
            label="Correo electrónico"
            type="email"
            value={recoveryEmail}
            size="small"
            onChange={(e) => setRecoveryEmail(e.target.value)}
            fullWidth
            margin="dense"
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiMail color="#867d91" />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ mt: 2, mb: 2, display: "flex", justifyContent: "center" }}>
            <MotionButton
              onClick={handleRecovery}
              disabled={loading || !recoveryEmail}
              sx={{
                backgroundColor: "#666",
                color: "#fff",
                px: 3,
                py: 1,
                borderRadius: "9999px",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "0.8rem",
              }}
            >
              Enviar correo
            </MotionButton>
          </Box>

          <Typography
            textAlign="center"
            sx={{
              color: "#867d91",
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: "0.78rem",
            }}
            onClick={() => setShowRecovery(false)}
          >
            Volver al inicio de sesión
          </Typography>
        </>
      )}

      {/* Mensaje de error */}
      {message && (
        <Typography
          textAlign="center"
          mt={2}
          color="error"
          sx={{ fontSize: "0.78rem" }}
        >
          {message}
        </Typography>
      )}

      {/* SOPORTE TÉCNICO */}
      <Box
        sx={{
          mt: 2.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 1,
        }}
      >
        <Typography sx={{ fontSize: "0.78rem", color: "#000" }}>
          ¿Tienes problemas con la plataforma?
        </Typography>

        <Button
          variant="contained"
          sx={{
            backgroundColor: "#ff3333",
            color: "#fff",
            fontSize: "0.75rem",
            textTransform: "none",
            px: 2,
            py: 0.7,
            borderRadius: "9999px",
            "&:hover": {
              backgroundColor: "#d62d2d",
            },
          }}
          onClick={() =>
            window.open("https://docs.google.com/forms/d/e/1FAIpQLSfHQbZDAYOUIFNsPCd76TAj1zKyAa8qv7lngC5Vai4Df1CJ6g/viewform?usp=header", "_blank")
          }
        >
          Da click aquí
        </Button>
      </Box>
    </Box>
  );
};

export default LoginForm;
