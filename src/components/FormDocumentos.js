import {
  Paper,
  Typography,
  Box,
  TextField,
  Grid,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useState } from "react";
import {
  FaIdCard,
  FaFileAlt,
  FaFilePdf,
  FaFileSignature,
  FaUserCircle,
  FaUserEdit,
} from "react-icons/fa";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../firebase";

const documentos = [
  { key: "curp", label: "CURP", icon: <FaIdCard /> },
  { key: "acta_nacimiento", label: "Acta de Nacimiento", icon: <FaFileAlt /> },
  { key: "ine", label: "INE", icon: <FaIdCard /> },
  { key: "cv", label: "Currículum Vitae", icon: <FaFilePdf /> },
  { key: "nss", label: "Número de Seguridad Social", icon: <FaFileSignature /> },
  { key: "constancia", label: "Constancia de Estudios/Trabajo", icon: <FaFileAlt /> },
  { key: "foto", label: "Foto", icon: <FaUserCircle /> },
  { key: "certificado_medico", label: "Certificado Médico", icon: <FaUserEdit /> },
];

const colorRojo = "#ff3333";

export default function FormDocumentos() {
  const [sobreMi, setSobreMi] = useState("");
  const [archivos, setArchivos] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileChange = (key, e) => {
    setArchivos((prev) => ({ ...prev, [key]: e.target.files[0] }));
  };

  const uploadFile = async (file, path) => {
    if (!file) return null;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const user = auth.currentUser;
    if (!user) {
      setError("Usuario no autenticado. Inicia sesión e intenta de nuevo.");
      setLoading(false);
      return;
    }

    try {
      const token = await user.getIdToken(); // <-- aquí sacamos el token

      const userId = user.uid;

      const uploadPromises = documentos.map(({ key }) =>
        uploadFile(
          archivos[key],
          `usuarios/${userId}/${key}-${Date.now()}-${archivos[key]?.name}`
        )
      );

      const urls = await Promise.all(uploadPromises);

      const payload = { user_id: userId, sobre_mi: sobreMi };
      documentos.forEach(({ key }, i) => {
        payload[`${key}_url`] = urls[i] || null;
      });
      console.log("➡️ Enviando token:", token);
      const res = await fetch("https://vol-backend.onrender.com/documentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // <-- enviamos el token en la cabecera
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al guardar los documentos");
      setSuccess("Documentos guardados con éxito.");
      setArchivos({});
      setSobreMi("");
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo guardar, intenta de nuevo más tarde. Si el problema persiste, contacta a plataformacrmsn@gmail.com."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={8}
      sx={{
        p: 4,
        maxWidth: 700,
        margin: "auto",
        mt: 6,
        backgroundColor: "#ffffff",
        borderRadius: 3,
        boxShadow: `0 0 15px 3px ${colorRojo}88`,
        overflow: "visible",
      }}
    >
      <Typography
        variant="h6"
        fontWeight="bold"
        color="#000000"
        mb={1}
        textAlign="center"
        sx={{
          textTransform: "uppercase",
          borderBottom: `2px solid ${colorRojo}`,
          pb: 0.5,
          mb: 2,
          letterSpacing: 1,
        }}
      >
        Completa tu perfil
      </Typography>

      <Typography
        variant="body1"
        color="#000"
        fontWeight="regular"
        textAlign="center"
        sx={{ mb: 3 }}
      >
        Cuéntanos más sobre ti
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          backgroundColor: "#fff",
          p: 3,
          borderRadius: 2,
          overflow: "visible",
        }}
      >
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <TextField
          label="Sobre mí"
          multiline
          minRows={4}
          value={sobreMi}
          onChange={(e) => setSobreMi(e.target.value)}
          variant="outlined"
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: colorRojo },
              "&:hover fieldset": { borderColor: colorRojo },
              "&.Mui-focused fieldset": { borderColor: colorRojo },
            },
          }}
        />

        <Typography
          variant="body1"
          color="#000"
          fontWeight="regular"
          textAlign="center"
          sx={{ mt: 2, mb: 3 }}
        >
          Sube tus documentos
        </Typography>

        <Grid container spacing={2}>
          {documentos.map(({ key, label, icon }) => (
            <Grid item xs={12} sm={6} key={key}>
              <Button
                variant="contained"
                component="label"
                fullWidth
                sx={{
                  color: "#fff",
                  backgroundColor: colorRojo,
                  textTransform: "none",
                  fontWeight: "bold",
                  fontSize: 14,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  border: "none",
                  "&:hover": { backgroundColor: "#cc2929" },
                  svg: { color: "#fff" },
                }}
              >
                {icon}
                {label}
                <input
                  type="file"
                  hidden
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(key, e)}
                />
              </Button>
              {archivos[key] && (
                <Typography
                  variant="caption"
                  sx={{ color: colorRojo, mt: 0.5, display: "block" }}
                >
                  {archivos[key].name}
                </Typography>
              )}
            </Grid>
          ))}
        </Grid>

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{
            mt: 3,
            backgroundColor: colorRojo,
            "&:hover": { backgroundColor: "#cc2929" },
            fontWeight: "bold",
            fontSize: 16,
            color: "#fff",
          }}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: "#fff" }} />
          ) : (
            "Guardar información"
          )}
        </Button>
      </Box>
    </Paper>
  );
}
