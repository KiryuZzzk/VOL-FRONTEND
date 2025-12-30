import { useState, useEffect } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Button,
  Typography,
  MenuItem,
  Grid,
  Checkbox,
  FormControlLabel,
  FormGroup,useTheme, useMediaQuery
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { useForm, Controller } from "react-hook-form";
import { auth} from "../firebase.js";

import { createUserWithEmailAndPassword,signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

const steps = [
  "Datos personales",
  "Información personal",
  "Estado de salud",
  "Disponibilidad y motivación",
  "Registra tu cuenta",
];

const estadoCivilOptions = [
  "Soltero/a",
  "Casado/a",
  "Divorciado/a",
  "Viudo/a",
  "Separado/a",
  "Unión libre"
];

const asociadoOptions = [
  "No",
  "Sí, pero no tengo número de asociado",
  "Sí, tengo número de asociado"
];

const frecuenciaEjercicioOptions = [
  "Nunca",
  "Rara vez",
  "1 vez a la semana",
  "2-3 veces a la semana",
  "4-5 veces a la semana",
  "Diario",
  "Más de una vez al día"
];

const licenciasConducirOptions = [
  "No tengo",
  "A",
  "A1",  // Automóviles particulares y camionetas
  "A2",  // Automóviles de servicio público de pasajeros (taxis, etc.)
  "A3",  // Vehículos de carga ligera y vehículos de transporte de pasajeros
  "B",
  "B1",  // Motocicletas
  "B2",
  "C",
    // Motocicletas de mayor cilindrada o con pasajeros
  "C1",  // Camiones y vehículos de carga pesada
  "C2",  // Transporte público de carga pesada
  "D",   // Transporte de materiales peligrosos
  "E",   // Vehículos especiales (maquinaria, etc.)
  "Otro"
];

const sexOptions = ["Hombre", "Mujer", "No binario", "Otro"];
const escolaridadOptions = [
  "Primaria",
  "Secundaria",
  "Bachillerato trunco",
  "Bachillerato en curso",
  "Bachillerato terminado",
  "Licenciatura trunca",
  "Licenciatura en curso",
  "Licenciatura terminada",
  "Maestría en curso",
  "Maestría terminada",
  "Doctorado en curso",
  "Doctorado terminado",
  "Otro",
];

const estadosOptions = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Coahuila",
  "Colima",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Durango",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Estado de México",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
];

const motivoOptions = [
  "Televisión",
  "Actividades en mi comunidad",
  "Redes sociales",
  "Colecta",
  "Voluntarios",
  "Otros",
];
const idiomasHabladosOptions = [
  "Solo español",
  "Español y 1 idioma más",
  "Español y 2 idiomas más",
  "Español y 3 o más idiomas"
];

const proyectoOptions = [
  "Capacitación",
  "Socorros",
  "Apoyo Psicosocial",
  "Comunicación",
  "Migración",
  "Prevención",
  "Reducción de Riesgos",
  "Voluntariado",
];

const rhOptions = [
  "Pos+",
  "Neg-"
];

const sangreOptions = [
  "AB",
  "A",
  "B",
  "O"
];
export default function RegistroFormulario() {
  const [activeStep, setActiveStep] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [message, setMessage] = useState(""); // Para el texto del error o éxito
    const theme = useTheme();
  // Aquí consideramos tabletas y móviles juntos (hasta 'md' inclusive)
const isSmall = useMediaQuery("(max-width:1128px)");


  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
    setValue,
  } = useForm({
    defaultValues: {
      // Paso 1
      avisoPrivacidad: false,
      fecha: new Date().toISOString(),
      id:"",
      correo:"",
      contraseña:"",
      nombre: "",
      apellidoPat: "",
      apellidoMat: "",
      fechaNacimiento: "",
      paisNacimiento: "",
      edad: "",
      sexo: "",
      curp: "",
      estadoCivil: "",
      telefono: "",
      celular: "",
      emergenciaNombre: "",
      emergenciaRelacion: "",
      emergenciaCelular: "",
      emergenciaTelefono: "",
      // Paso 2
      estado: "",
      colonia: "",
      cp: "",
      gradoEstudios: "",
      especificaEstudios: "",
      ocupacion: "",
      empresa: "",
      idiomas: "",
      porcentajeIdioma: "",
      licencias: "",
      tipoLicencia: "",
      pasaporte: "",
      otroDocumento: "",
      // Paso 3
      tipoSangre: "",
      rh: "",
      enfermedades: "",
      alergias: "",
      medicamentos: "",
      ejercicio: "",
      // Paso 4
      disponibilidadDias: {
        lunes: false,
        martes: false,
        miercoles: false,
        jueves: false,
        viernes: false,
        sabado: false,
        domingo: false,
      },
      turno: "",
      horario: "",
      comoSeEntero: "",
      motivoInteres: "",
      voluntariadoPrevio: "",
      proyectoParticipar: [],
      razonProyecto: "",
    },
  });

  // Validación personalizada para disponibilidad dias
  const validateDias = (dias) =>
    Object.values(dias).some((v) => v) || "Selecciona al menos un día";

  // Validación para proyectoParticipar (checkbox múltiple)
  const validateProyectos = (arr) =>
    arr.length > 0 || "Selecciona al menos un proyecto";

  const handleNext = async () => {
    let valid = false;

    // Para pasos normales
    if (activeStep < 4) {
      valid = await trigger();
    } else {
      // Validaciones custom para step 4:
      // disparar validación normal
      valid = await trigger();

      // Validar días checkbox
      const dias = getValues("disponibilidadDias");
      if (!validateDias(dias)) valid = false;

      // Validar proyectoParticipar
      const proyectos = getValues("proyectoParticipar");
      if (!validateProyectos(proyectos)) valid = false;
    }

    if (valid) {
      const data = getValues();
      console.log("Información correcta: siguiente paso");
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Para manejo checkbox de días
  const toggleDia = (dia) => {
    const current = getValues(`disponibilidadDias.${dia}`);
    setValue(`disponibilidadDias.${dia}`, !current, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  // Para manejo checkbox de proyectos (múltiples)
  const toggleProyecto = (proyecto) => {
    const arr = getValues("proyectoParticipar") || [];
    if (arr.includes(proyecto)) {
      setValue(
        "proyectoParticipar",
        arr.filter((p) => p !== proyecto),
        { shouldValidate: true, shouldDirty: true }
      );
    } else {
      setValue("proyectoParticipar", [...arr, proyecto], {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const [user, setUser] = useState(null);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    setUser(firebaseUser);
  });

  return () => unsubscribe();
}, []);

  
  return (
    <Box sx={{ width: "80%", mx: "auto", p: 3 }}>
      {/* Contenedor scroll horizontal para evitar overflow */}

      <Typography>
        El registro ha sido deshabilitado hasta nuevo aviso. Quédate al pendiente de nuestras redes sociales para nuevas convocatorias.
      </Typography>
      



    </Box>
  );
}

