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
  FormGroup,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { useForm, Controller } from "react-hook-form";
import { auth } from "../firebase.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

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
  "Unión libre",
];

const asociadoOptions = [
  "No",
  "Sí, pero no tengo número de asociado",
  "Sí, tengo número de asociado",
];

const frecuenciaEjercicioOptions = [
  "Nunca",
  "Rara vez",
  "1 vez a la semana",
  "2-3 veces a la semana",
  "4-5 veces a la semana",
  "Diario",
  "Más de una vez al día",
];

const licenciasConducirOptions = [
  "No tengo",
  "A",
  "A1",
  "A2",
  "A3",
  "B",
  "B1",
  "B2",
  "C",
  "C1",
  "C2",
  "D",
  "E",
  "Otro",
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
  "Español y 3 o más idiomas",
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

const rhOptions = ["Pos+", "Neg-"];

const sangreOptions = ["AB", "A", "B", "O"];

export default function RegistroFormulario() {
  const [activeStep, setActiveStep] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [message, setMessage] = useState(""); // mensajes generales
  const theme = useTheme();
  const isSmall = useMediaQuery("(max-width:1128px)");

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
    setValue,
    setError,
  } = useForm({
    defaultValues: {
      // Paso 1
      avisoPrivacidad: false,
      terminosyCondiciones: false,
      fecha: new Date().toISOString(),
      id: "",
      correo: "",
      contraseña: "",
      confirmarContraseña: "",
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

    if (activeStep < 4) {
      valid = await trigger();
    } else {
      valid = await trigger();

      const dias = getValues("disponibilidadDias");
      if (!validateDias(dias)) valid = false;

      const proyectos = getValues("proyectoParticipar");
      if (!validateProyectos(proyectos)) valid = false;
    }

    if (valid) {
      const data = getValues();
      console.log("Información correcta: siguiente paso", data);
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
      {/* Stepper responsive */}
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Stepper
          activeStep={activeStep}
          alternativeLabel={!isSmall}
          sx={{
            padding: 0,
            minWidth: 300,
            whiteSpace: "nowrap",
            flexWrap: "nowrap",
            justifyContent: isSmall ? "flex-start" : "center",
            "& .MuiStepLabel-root": {
              padding: isSmall ? "0 0px" : "0 8px",
            },
            "& .MuiStepLabel-label": {
              display: isSmall ? "none" : "block",
            },
            "& .MuiStepLabel-root .Mui-completed": { color: "red" },
            "& .MuiStepLabel-root .Mui-active": { color: "red" },
            "& .MuiStepLabel-label.Mui-active": { fontWeight: "bold" },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Step 0 - Datos personales */}
      {activeStep === 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom textAlign="center">
            Datos personales
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {[
              { name: "nombre", label: "Nombre/s" },
              { name: "apellidoPat", label: "Apellido paterno" },
              { name: "apellidoMat", label: "Apellido materno" },
              { name: "fechaNacimiento", label: "Fecha de nacimiento", type: "date" },
              { name: "paisNacimiento", label: "País de nacimiento" },
              {
                name: "edad",
                label: "Edad",
                type: "number",
              },
              { name: "sexo", label: "Sexo", type: "select", options: sexOptions },
              { name: "curp", label: "CURP" },
              {
                name: "estadoCivil",
                label: "Estado civil",
                type: "select",
                options: estadoCivilOptions,
              },
              { name: "telefono", label: "Teléfono" },
              { name: "celular", label: "Celular" },
            ].map(({ name, label, type = "text", options }) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={name}
                display="flex"
                justifyContent="center"
              >
                <Controller
                  name={name}
                  control={control}
                  rules={{
                    required: `${label} es requerido.`,
                    ...(name === "edad" && {
                      valueAsNumber: true,
                      validate: (value) =>
                        value >= 18 ||
                        "Debes ser mayor de 18 años para continuar.",
                    }),
                  }}
                  render={({ field }) =>
                    type === "select" ? (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        label={label}
                        InputLabelProps={{ shrink: true }}
                        error={!!errors[name]}
                        helperText={errors[name]?.message}
                        sx={{
                          width: 160,
                          "& .MuiInputBase-root": { borderRadius: 2 },
                          "& label.Mui-focused": { color: "red" },
                          "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                            borderColor: "red",
                          },
                        }}
                      >
                        {options.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <TextField
                        {...field}
                        fullWidth
                        type={type}
                        label={label}
                        error={!!errors[name]}
                        helperText={errors[name]?.message}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          width: 160,
                          "& .MuiInputBase-root": { borderRadius: 2 },
                          "& label.Mui-focused": { color: "red" },
                          "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                            borderColor: "red",
                          },
                        }}
                      />
                    )
                  }
                />
              </Grid>
            ))}
          </Grid>

          <Box mt={6}>
            <Typography variant="h6" gutterBottom textAlign="center">
              Contacto de emergencia
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              {[
                { name: "emergenciaNombre", label: "Nombre" },
                { name: "emergenciaRelacion", label: "Parentesco" },
                { name: "emergenciaCelular", label: "Celular" },
                { name: "emergenciaTelefono", label: "Teléfono" },
              ].map(({ name, label }) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={name}
                  display="flex"
                  justifyContent="center"
                >
                  <Controller
                    name={name}
                    control={control}
                    rules={{ required: `${label} es requerido.` }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label={label}
                        InputLabelProps={{ shrink: true }}
                        error={!!errors[name]}
                        helperText={errors[name]?.message}
                        sx={{
                          width: 160,
                          "& .MuiInputBase-root": { borderRadius: 2 },
                          "& label.Mui-focused": { color: "red" },
                          "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                            borderColor: "red",
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      )}

      {/* Step 1 - Información personal */}
      {activeStep === 1 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom textAlign="center">
            Información personal
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {[
              {
                name: "estado",
                label: "Estado",
                type: "select",
                options: estadosOptions,
              },
              { name: "colonia", label: "Municipio (o colonia)" },
              { name: "cp", label: "Código Postal" },
              {
                name: "gradoEstudios",
                label: "Grado de estudios",
                type: "select",
                options: escolaridadOptions,
              },
              { name: "especificaEstudios", label: "Especifica tus estudios" },
              { name: "ocupacion", label: "Ocupación actual" },
              { name: "empresa", label: "Empresa o institución" },
              {
                name: "idiomas",
                label: "Idiomas que hablas",
                type: "select",
                options: idiomasHabladosOptions,
              },
              { name: "porcentajeIdioma", label: "¿Qué idioma es?" },
              { name: "licencias", label: "¿Tienes licencias de conducir?" },
              {
                name: "tipoLicencia",
                label: "¿Cuáles licencias?",
                type: "select",
                options: licenciasConducirOptions,
              },
              { name: "pasaporte", label: "¿Tienes pasaporte?" },
              { name: "otroDocumento", label: "Otro documento (visa, etc.)" },
            ].map(({ name, label, type = "text", options }) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={name}
                display="flex"
                justifyContent="center"
              >
                <Controller
                  name={name}
                  control={control}
                  rules={{ required: `${label} es requerido.` }}
                  render={({ field }) =>
                    type === "select" ? (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        label={label}
                        error={!!errors[name]}
                        helperText={errors[name]?.message}
                        sx={{
                          width: 160,
                          "& .MuiInputBase-root": { borderRadius: 2 },
                          "& label.Mui-focused": { color: "red" },
                          "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                            borderColor: "red",
                          },
                        }}
                      >
                        {options.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <TextField
                        {...field}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        label={label}
                        error={!!errors[name]}
                        helperText={errors[name]?.message}
                        sx={{
                          width: 160,
                          "& .MuiInputBase-root": { borderRadius: 2 },
                          "& label.Mui-focused": { color: "red" },
                          "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                            borderColor: "red",
                          },
                        }}
                      />
                    )
                  }
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Step 2 - Estado de salud */}
      {activeStep === 2 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom textAlign="center">
            Estado de salud
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {[
              {
                name: "tipoSangre",
                label: "Tipo de Sangre",
                type: "select",
                options: sangreOptions,
              },
              {
                name: "rh",
                label: "RH",
                type: "select",
                options: rhOptions,
              },
              { name: "enfermedades", label: "¿Qué enfermedades tienes?" },
              { name: "alergias", label: "¿Qué alergias tienes?" },
              { name: "medicamentos", label: "¿Qué medicamentos tomas?" },
              {
                name: "ejercicio",
                label: "¿Realizas ejercicio?",
                type: "select",
                options: frecuenciaEjercicioOptions,
              },
            ].map(({ name, label, type = "text", options }) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={name}
                display="flex"
                justifyContent="center"
              >
                <Controller
                  name={name}
                  control={control}
                  rules={{ required: `${label} es requerido.` }}
                  render={({ field }) =>
                    type === "select" ? (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        label={label}
                        error={!!errors[name]}
                        helperText={errors[name]?.message}
                        sx={{
                          width: 160,
                          "& .MuiInputBase-root": { borderRadius: 2 },
                          "& label.Mui-focused": { color: "red" },
                          "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                            borderColor: "red",
                          },
                        }}
                      >
                        {options.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <TextField
                        {...field}
                        fullWidth
                        label={label}
                        InputLabelProps={{ shrink: true }}
                        error={!!errors[name]}
                        helperText={errors[name]?.message}
                        sx={{
                          width: 160,
                          "& .MuiInputBase-root": { borderRadius: 2 },
                          "& label.Mui-focused": { color: "red" },
                          "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                            borderColor: "red",
                          },
                        }}
                      />
                    )
                  }
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Step 3 - Disponibilidad y motivación */}
      {activeStep === 3 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom textAlign="center">
            Disponibilidad y motivación
          </Typography>

          {/* Días */}
          <Box sx={{ mb: 3, width: "100%", textAlign: "center" }}>
            <Typography variant="subtitle1" gutterBottom>
              Disponibilidad (selecciona los días disponibles)
            </Typography>
            <FormGroup row justifyContent="center" sx={{ gap: 2, flexWrap: "wrap" }}>
              {Object.keys(getValues("disponibilidadDias")).map((dia) => (
                <FormControlLabel
                  key={dia}
                  control={
                    <Checkbox
                      checked={getValues(`disponibilidadDias.${dia}`)}
                      onChange={() => toggleDia(dia)}
                      color="error"
                    />
                  }
                  label={dia.charAt(0).toUpperCase() + dia.slice(1)}
                />
              ))}
            </FormGroup>
            {errors.disponibilidadDias && (
              <Typography color="error" variant="caption">
                {errors.disponibilidadDias.message}
              </Typography>
            )}
          </Box>

          {/* Turno */}
          <Controller
            name="turno"
            control={control}
            rules={{ required: "Selecciona un turno." }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Turno"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.turno}
                helperText={errors.turno?.message}
                sx={{ mb: 3 }}
              >
                <MenuItem value="Matutino">Matutino</MenuItem>
                <MenuItem value="Vespertino">Vespertino</MenuItem>
                <MenuItem value="Discontinuo">Discontinuo</MenuItem>
              </TextField>
            )}
          />

          {/* Horario */}
          <Controller
            name="horario"
            control={control}
            rules={{ required: "Ingresa tu horario." }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Horario"
                InputLabelProps={{ shrink: true }}
                placeholder="Ejemplo: 9:00 - 14:00"
                fullWidth
                error={!!errors.horario}
                helperText={errors.horario?.message}
                sx={{ mb: 3 }}
              />
            )}
          />

          {/* Cómo se enteró */}
          <Controller
            name="comoSeEntero"
            control={control}
            rules={{ required: "Selecciona una opción." }}
            render={({ field }) => (
              <TextField
                {...field}
                InputLabelProps={{ shrink: true }}
                select
                label="¿Cómo te enteraste del voluntariado?"
                fullWidth
                error={!!errors.comoSeEntero}
                helperText={errors.comoSeEntero?.message}
                sx={{ mb: 3 }}
              >
                {motivoOptions.map((op) => (
                  <MenuItem key={op} value={op}>
                    {op}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          {/* Motivo de interés */}
          <Controller
            name="motivoInteres"
            control={control}
            rules={{ required: "Este campo es obligatorio." }}
            render={({ field }) => (
              <TextField
                {...field}
                label="¿Por qué quieres ser voluntario?"
                multiline
                minRows={3}
                InputLabelProps={{ shrink: true }}
                fullWidth
                error={!!errors.motivoInteres}
                helperText={errors.motivoInteres?.message}
                sx={{ mb: 3 }}
              />
            )}
          />

          {/* Voluntariado previo */}
          <Controller
            name="voluntariadoPrevio"
            control={control}
            rules={{ required: "Selecciona una opción." }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="¿Ya eres voluntario de Cruz Roja Mexicana?"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.voluntariadoPrevio}
                helperText={errors.voluntariadoPrevio?.message}
                sx={{ mb: 3 }}
              >
                <MenuItem value="No">No, nunca</MenuItem>
                <MenuItem value="Sí, sin número">
                  Sí, pero no tengo número de Asociado
                </MenuItem>
                <MenuItem value="Sí, con número">
                  Sí, ya tengo número de Asociado
                </MenuItem>
              </TextField>
            )}
          />

          {/* Proyectos */}
          <Typography variant="subtitle1" gutterBottom>
            Proyectos en los que quieres participar
          </Typography>
          <FormGroup row sx={{ mb: 2, gap: 3 }}>
            {proyectoOptions.map((proyecto) => (
              <FormControlLabel
                key={proyecto}
                control={
                  <Checkbox
                    checked={(getValues("proyectoParticipar") || []).includes(
                      proyecto
                    )}
                    onChange={() => toggleProyecto(proyecto)}
                    color="error"
                  />
                }
                label={proyecto}
              />
            ))}
          </FormGroup>
          {errors.proyectoParticipar && (
            <Typography color="error" variant="caption" display="block" mb={2}>
              {errors.proyectoParticipar.message}
            </Typography>
          )}

          {/* Razón proyecto */}
          <Controller
            name="razonProyecto"
            control={control}
            rules={{ required: "Explica la razón para elegir el proyecto." }}
            render={({ field }) => (
              <TextField
                {...field}
                label="¿Por qué elegiste este proyecto?"
                multiline
                minRows={3}
                InputLabelProps={{ shrink: true }}
                fullWidth
                error={!!errors.razonProyecto}
                helperText={errors.razonProyecto?.message}
              />
            )}
          />
        </Box>
      )}

      {/* Step 4 - Registra tu cuenta */}
      {activeStep === 4 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom textAlign="center">
            Registra tu cuenta
          </Typography>

          <Grid container spacing={3} justifyContent="center">
            {[
              {
                name: "correo",
                label: "Correo electrónico",
                type: "email",
                rules: {
                  required: "Correo es requerido.",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Correo inválido.",
                  },
                },
              },
              {
                name: "contraseña",
                label: "Contraseña",
                type: "password",
                rules: {
                  required: "Contraseña es requerida.",
                  minLength: { value: 6, message: "Mínimo 6 caracteres." },
                  maxLength: { value: 40, message: "Máximo 40 caracteres." },
                },
              },
              {
                name: "confirmarContraseña",
                label: "Confirmar Contraseña",
                type: "password",
                rules: {
                  required: "Confirmar contraseña es requerido.",
                  validate: (value) =>
                    value === getValues("contraseña") ||
                    "Las contraseñas no coinciden.",
                },
              },
            ].map(({ name, label, type, rules }) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={name}
                display="flex"
                justifyContent="center"
              >
                <Controller
                  name={name}
                  control={control}
                  rules={rules}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      label={label}
                      type={type}
                      error={!!errors[name]}
                      helperText={errors[name]?.message}
                      sx={{
                        width: 160,
                        "& .MuiInputBase-root": { borderRadius: 2 },
                        "& label.Mui-focused": { color: "red" },
                        "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                          borderColor: "red",
                        },
                      }}
                    />
                  )}
                />
              </Grid>
            ))}

            {/* Aviso de privacidad */}
            <Grid item xs={12} md={6} display="flex" justifyContent="center">
              <Controller
                name="avisoPrivacidad"
                control={control}
                rules={{
                  required:
                    "Debes aceptar el aviso de privacidad para continuar.",
                }}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        Acepto el{" "}
                        <a
                          href="/docs/aviso-de-privacidad.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#b30000",
                            textDecoration: "underline",
                          }}
                        >
                          aviso de privacidad
                        </a>
                      </Typography>
                    }
                  />
                )}
              />
            </Grid>

            {/* Términos y condiciones */}
            <Grid item xs={12} md={6} display="flex" justifyContent="center">
              <Controller
                name="terminosyCondiciones"
                control={control}
                rules={{
                  required:
                    "Debes aceptar los términos y condiciones para continuar.",
                }}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        Acepto los{" "}
                        <a
                          href="/docs/terminos-y-condiciones.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#b30000",
                            textDecoration: "underline",
                          }}
                        >
                          Términos y condiciones
                        </a>
                      </Typography>
                    }
                  />
                )}
              />
            </Grid>

            {errors.avisoPrivacidad && (
              <Grid item xs={12} display="flex" justifyContent="center">
                <Typography variant="caption" color="error">
                  {errors.avisoPrivacidad.message}
                </Typography>
              </Grid>
            )}

            {errors.terminosyCondiciones && (
              <Grid item xs={12} display="flex" justifyContent="center">
                <Typography variant="caption" color="error">
                  {errors.terminosyCondiciones.message}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Paso final (mensaje) */}
      {activeStep === 5 && (
        <Box sx={{ mt: 4, textAlign: "center", px: 4 }}>
          <Typography variant="h4" gutterBottom color="red">
            ¡Bienvenido/a!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Desde Cruz Roja Mexicana, agradecemos profundamente tu interés en
            formar parte de esta gran familia de voluntariado. Tu disposición,
            tiempo y energía son invaluables para continuar salvando vidas y
            transformando comunidades. A través de tu cuenta podrás seguir el
            avance de tu proceso y conocer los distintos programas de
            voluntariado disponibles.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Te enviaremos un correo electrónico cuando tu cuenta esté
            habilitada. A partir de entonces podrás ingresar con tus datos y
            empezar esta gran aventura humanitaria junto a nosotros.
          </Typography>
        </Box>
      )}

      {/* Botones de navegación */}
      {activeStep < 5 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 6,
          }}
        >
          {activeStep > 0 && (
            <Button
              onClick={handleBack}
              variant="outlined"
              sx={{
                borderColor: "red",
                color: "red",
                "&:hover": { backgroundColor: "rgba(255,0,0,0.1)" },
              }}
            >
              Regresar
            </Button>
          )}

          {activeStep < 4 ? (
            <Button
              onClick={handleNext}
              variant="contained"
              sx={{
                backgroundColor: "red",
                "&:hover": { backgroundColor: "#b30000" },
              }}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={handleSubmit(async (data) => {
                try {
                  setMessage("");
                  console.log("📦 Enviando registro al backend:", data);

                  const response = await fetch(
                    "https://vol-backend.onrender.com/public/register",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(data),
                    }
                  );

                  let result = {};
                  try {
                    result = await response.json();
                  } catch {
                    result = {};
                  }

                  if (!response.ok) {
                    console.error("❌ Error al registrar en backend:", result);

                    // Mapear errores específicos a campos
                    if (result.field) {
                      setError(result.field, {
                        type: "server",
                        message:
                          result.message ||
                          "Hay un problema con este campo. Revisa la información.",
                      });
                    } else if (
                      result.code === "EMAIL_EXISTS" ||
                      result.code === "EMAIL_OR_CURP_EXISTS"
                    ) {
                      setError("correo", {
                        type: "server",
                        message:
                          result.message ||
                          "Ya existe una cuenta registrada con este correo.",
                      });
                    } else if (result.code === "CURP_EXISTS") {
                      setError("curp", {
                        type: "server",
                        message:
                          result.message ||
                          "Ya existe una cuenta registrada con esta CURP.",
                      });
                    } else if (result.code === "INVALID_PASSWORD") {
                      setError("contraseña", {
                        type: "server",
                        message:
                          result.message ||
                          "La contraseña no cumple con los requisitos.",
                      });
                    } else {
                      alert(
                        result.message ||
                          result.error ||
                          "Ocurrió un error al registrar tu cuenta. Inténtalo nuevamente."
                      );
                    }

                    return;
                  }

                  console.log("✅ Registro exitoso en backend:", result);

                  // Iniciar sesión en Firebase usando el mismo correo/contraseña
                  await signInWithEmailAndPassword(
                    auth,
                    data.correo,
                    data.contraseña
                  );
                  console.log("🔑 Sesión iniciada después de registro");

                  setOpenSnackbar(true);
                  setTimeout(() => setActiveStep(5), 1000);
                } catch (error) {
                  console.error("⚠️ Error en el proceso de registro:", error);
                  alert(
                    "Ocurrió un error al registrar tu cuenta. Intenta nuevamente en unos momentos."
                  );
                }
              })}
              variant="contained"
              sx={{
                backgroundColor: "red",
                color: "#fff",
                fontWeight: "bold",
                mt: 2,
                px: 4,
                py: 1.5,
                borderRadius: "9999px",
                "&:hover": {
                  backgroundColor: "#b30000",
                },
              }}
            >
              Enviar
            </Button>
          )}
        </Box>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          variant="filled"
          sx={{
            backgroundColor: "white",
            color: "red",
            fontWeight: "bold",
            borderRadius: 2,
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        >
          Registro exitoso. Gracias por formar parte de la Cruz Roja Mexicana ❤️
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}
