
import RedBackground from "../assets/Banner.png";
import RedBackground2 from "../assets/Banner2.png";
import RegistroFormulario from "../components/RegistroVoluntarioHabilitado";
import {
  Box,
} from "@mui/material";
const Register = () => {


  return (
    <Box sx = {{backgroundColor:"#fff8ff"}}>
        <Box
      sx={{
        maxwidth: "100%",
        maxWidth: "100vw",  // Importante: limitar máximo ancho a viewport
        overflowX: "hidden", // Corta overflow horizontal en TODO el contenedor padre
        overflowY: "visible",
        aspectRatio: "16 / 1.5",
        backgroundImage: `url(${RedBackground})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        color: "#fff",
        px: { xs: 2, sm: 4, md: 6 },
        fontFamily: "'Arial Black', sans-serif",
        position: "relative",
        zIndex: 0,
        margin: 0,      // Sin margen que pueda ampliar el box
        padding: 0,     // Sin padding que pueda ampliar el box
      }}
    />

        <RegistroFormulario/>

         <Box
      sx={{
        maxwidth: "100%",
        maxWidth: "100vw",  // Importante: limitar máximo ancho a viewport
        overflowX: "hidden", // Corta overflow horizontal en TODO el contenedor padre
        overflowY: "visible",
        aspectRatio: "16 / 1.5",
        backgroundImage: `url(${RedBackground2})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        color: "#fff",
        px: { xs: 2, sm: 4, md: 6 },
        fontFamily: "'Arial Black', sans-serif",
        position: "relative",
        zIndex: 0,
        margin: 0,      // Sin margen que pueda ampliar el box
        padding: 0,     // Sin padding que pueda ampliar el box
      }}
    />
    </Box>
  );
};

export default Register;
