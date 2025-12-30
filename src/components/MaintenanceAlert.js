import { Alert } from "@mui/material";

export default function MaintenanceAlert() {
  return (
    <Alert
      severity="error"
      variant="filled"
      sx={{
        width: "100%",
        borderRadius: 0,
        textAlign: "center",
        fontWeight: "bold",
        fontSize: "1rem",
        backgroundColor: "#c62828", // rojo fuerte
        color: "#fff",
        position: "sticky",
        top: 120,
        zIndex: 9999, // para que esté por encima de todo
      }}
    >
      🔧 Estamos realizando mantenimiento en la plataforma.  
      Por favor, evita usarla hasta nuevo aviso.  
      Gracias por tu paciencia. ❤️
    </Alert>
  );
}
