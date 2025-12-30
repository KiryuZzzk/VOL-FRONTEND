// src/components/RegistroDoble.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Snackbar,
  Alert,
  Autocomplete,
  Chip,
  CircularProgress,
} from "@mui/material";

import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { getAuth, onAuthStateChanged } from "firebase/auth";

// ====== ESTILO ======
const PRIMARY = "#b3001b";
const BG = "#ffffff";

// Pasos
const steps = [
  "Datos personales",
  "Contacto",
  "Documentos / Salud",
  "Motivación / Disponibilidad",
];

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const turnos = ["Matutino", "Vespertino", "Nocturno", "Flexible"];
const horarios = ["08:00-12:00", "12:00-16:00", "16:00-20:00", "20:00-00:00", "Flexible"];
const gradosEstudios = [
  "Primaria",
  "Secundaria",
  "Preparatoria/Bachillerato",
  "Carrera técnica",
  "Licenciatura",
  "Maestría",
  "Doctorado",
  "Otro",
];

const tiposSangre = ["A", "B", "AB", "O"];
const rhList = ["+", "-"];

const RegistroDoble = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      // Paso 1: datos personales
      nombre: "",
      apellidoPat: "",
      apellidoMat: "",
      fechaNacimiento: "",
      curp: "",
      sexo: "",
      estadoCivil: "",
      nacionalidad: "",
      rfc: "",
      nss: "",

      // Paso 2: contacto
      telefono: "",
      celular: "",
      emergenciaNombre: "",
      emergenciaRelacion: "",
      emergenciaTelefono: "",
      emergenciaCelular: "",

      // Estudios / trabajo
      gradoEstudios: "",
      especificaEstudios: "",
      ocupacion: "",
      empresa: "",

      // Idiomas
      idiomas: [],
      porcentajeIdioma: "",

      // Licencias / documentos
      licencias: [],
      tipoLicencia: "",
      pasaporte: "",
      otroDocumento: "",

      // Salud
      tipoSangre: "",
      rh: "",
      enfermedades: "",
      alergias: "",
      medicamentos: "",
      ejercicio: "",

      // Motivación
      comoSeEntero: "",
      motivoInteres: "",
      voluntariadoPrevio: "",
      razonProyecto: "",

      // Dirección
      estado: "",
      colonia: "",
      cp: "",
      coordinacion: "",
      calle: "",
      numExt: "",
      numInt: "",

      // Disponibilidad
      disponibilidadDias: [],
      turno: "",
      horario: "",
      proyectoParticipar: [],

      // Términos
      terminosyCondiciones: false,
    },
    mode: "onBlur",
  });

  const watchGrado = watch("gradoEstudios");
  const watchIdiomas = watch("idiomas");
  const watchLicencias = watch("licencias");
  const watchDias = watch("disponibilidadDias");
  const watchProyectos = watch("proyectoParticipar");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user || null);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, [auth]);

  useEffect(() => {
    // Si el usuario elige "Otro" en grado de estudios, habilitamos especificaEstudios
    if (watchGrado !== "Otro") {
      setValue("especificaEstudios", "", { shouldValidate: true, shouldDirty: true });
    }
  }, [watchGrado, setValue]);

  const handleNext = async () => {
    // Validaciones básicas por paso (si ya tienes las tuyas, déjalas)
    // Aquí solo muevo de paso; tu archivo original puede tener validaciones extra
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const toggleDia = (dia) => {
    const arr = watchDias || [];
    if (arr.includes(dia)) {
      setValue(
        "disponibilidadDias",
        arr.filter((d) => d !== dia),
        { shouldValidate: true, shouldDirty: true }
      );
    } else {
      setValue("disponibilidadDias", [...arr, dia], { shouldValidate: true, shouldDirty: true });
    }
  };

  const toggleProyecto = (proyecto) => {
    const arr = watchProyectos || [];
    if (arr.includes(proyecto)) {
      setValue(
        "proyectoParticipar",
        arr.filter((p) => p !== proyecto),
        { shouldValidate: true, shouldDirty: true }
      );
    } else {
      setValue("proyectoParticipar", [...arr, proyecto], { shouldValidate: true, shouldDirty: true });
    }
  };

  // Submit: arma payload completo y manda al backend (misma ruta que RegistroVoluntarioHabilitado)
  const onSubmit = async (data) => {
    try {
      const user = firebaseUser || auth.currentUser;
      if (!user) throw new Error("No hay sesión de Firebase");

      // Payload exacto esperado por tu SP/endpoint (SE CONSERVA IGUAL)
      const payload = {
        uid: user.uid,
        correo: user.email,
        nombre: data.nombre,
        apellidoPat: data.apellidoPat,
        apellidoMat: data.apellidoMat,
        fechaNacimiento: data.fechaNacimiento,
        curp: data.curp,
        sexo: data.sexo,
        estadoCivil: data.estadoCivil,
        nacionalidad: data.nacionalidad,
        rfc: data.rfc,
        nss: data.nss,

        telefono: data.telefono,
        celular: data.celular,
        emergenciaNombre: data.emergenciaNombre,
        emergenciaRelacion: data.emergenciaRelacion,
        emergenciaTelefono: data.emergenciaTelefono,
        emergenciaCelular: data.emergenciaCelular,

        gradoEstudios: data.gradoEstudios,
        especificaEstudios: data.especificaEstudios,
        ocupacion: data.ocupacion,
        empresa: data.empresa,

        idiomas: data.idiomas,
        porcentajeIdioma: data.porcentajeIdioma,

        licencias: data.licencias,
        tipoLicencia: data.tipoLicencia,
        pasaporte: data.pasaporte,
        otroDocumento: data.otroDocumento,

        tipoSangre: data.tipoSangre,
        rh: data.rh,
        enfermedades: data.enfermedades,
        alergias: data.alergias,
        medicamentos: data.medicamentos,
        ejercicio: data.ejercicio,

        comoSeEntero: data.comoSeEntero,
        motivoInteres: data.motivoInteres,
        voluntariadoPrevio: data.voluntariadoPrevio,
        razonProyecto: data.razonProyecto,

        estado: data.estado,
        colonia: data.colonia,
        cp: data.cp,
        coordinacion: data.coordinacion,
        calle: data.calle,
        numExt: data.numExt,
        numInt: data.numInt,

        disponibilidadDias: data.disponibilidadDias,
        turno: data.turno,
        horario: data.horario,
        proyectoParticipar: data.proyectoParticipar,

        terminosyCondiciones: data.terminosyCondiciones,
      };

      console.log("📦 Enviando /public/register", payload);

      // ✅ MISMO estilo que RegistroVoluntarioHabilitado: Content-Type y ya
      const resp = await fetch("https://vol-backend.onrender.com/public/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        // Si tu backend manda { field, message }, lo pintamos en el campo
        if (json?.field) {
          setError(json.field, { type: "server", message: json.message || "Error en el campo" });
        }
        throw new Error(json?.error || json?.message || `Error backend ${resp.status}`);
      }

      console.log("✅ RegistroDoble OK:", json);
      setSnackMsg("Registro completado. Redirigiendo…");
      setOpenSnackbar(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      setSnackMsg(err.message || "Error al completar registro");
      setOpenSnackbar(true);
    }
  };

  if (loadingAuth) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!firebaseUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Necesitas iniciar sesión para registrarte.</Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/login")}>
          Ir a login
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: BG, p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: PRIMARY, mb: 1 }}>
          Registro de Voluntariado
        </Typography>
        <Typography sx={{ mb: 3, opacity: 0.8 }}>
          Completa el formulario para registrar tu perfil como voluntaria/o.
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          {/* ===== PASO 1 ===== */}
          {activeStep === 0 && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Controller
                name="nombre"
                control={control}
                rules={{ required: "Nombre requerido" }}
                render={({ field }) => (
                  <TextField {...field} label="Nombre" error={!!errors.nombre} helperText={errors.nombre?.message} />
                )}
              />

              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } }}>
                <Controller
                  name="apellidoPat"
                  control={control}
                  rules={{ required: "Apellido paterno requerido" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Apellido paterno"
                      error={!!errors.apellidoPat}
                      helperText={errors.apellidoPat?.message}
                    />
                  )}
                />
                <Controller
                  name="apellidoMat"
                  control={control}
                  rules={{ required: "Apellido materno requerido" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Apellido materno"
                      error={!!errors.apellidoMat}
                      helperText={errors.apellidoMat?.message}
                    />
                  )}
                />
              </Box>

              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } }}>
                <Controller
                  name="fechaNacimiento"
                  control={control}
                  rules={{ required: "Fecha de nacimiento requerida" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Fecha de nacimiento"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.fechaNacimiento}
                      helperText={errors.fechaNacimiento?.message}
                    />
                  )}
                />
                <Controller
                  name="curp"
                  control={control}
                  rules={{ required: "CURP requerida" }}
                  render={({ field }) => (
                    <TextField {...field} label="CURP" error={!!errors.curp} helperText={errors.curp?.message} />
                  )}
                />
              </Box>

              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } }}>
                <Controller
                  name="sexo"
                  control={control}
                  rules={{ required: "Sexo requerido" }}
                  render={({ field }) => (
                    <TextField {...field} select label="Sexo" error={!!errors.sexo} helperText={errors.sexo?.message}>
                      <MenuItem value="Femenino">Femenino</MenuItem>
                      <MenuItem value="Masculino">Masculino</MenuItem>
                      <MenuItem value="Otro">Otro</MenuItem>
                      <MenuItem value="Prefiero no decir">Prefiero no decir</MenuItem>
                    </TextField>
                  )}
                />
                <Controller
                  name="estadoCivil"
                  control={control}
                  render={({ field }) => <TextField {...field} label="Estado civil" />}
                />
              </Box>

              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
                <Controller name="nacionalidad" control={control} render={({ field }) => <TextField {...field} label="Nacionalidad" />} />
                <Controller name="rfc" control={control} render={({ field }) => <TextField {...field} label="RFC" />} />
                <Controller name="nss" control={control} render={({ field }) => <TextField {...field} label="NSS" />} />
              </Box>
            </Box>
          )}

          {/* ===== PASO 2 ===== */}
          {activeStep === 1 && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } }}>
                <Controller
                  name="telefono"
                  control={control}
                  render={({ field }) => <TextField {...field} label="Teléfono" />}
                />
                <Controller
                  name="celular"
                  control={control}
                  rules={{ required: "Celular requerido" }}
                  render={({ field }) => (
                    <TextField {...field} label="Celular" error={!!errors.celular} helperText={errors.celular?.message} />
                  )}
                />
              </Box>

              <Typography variant="h6" sx={{ mt: 2 }}>
                Contacto de emergencia
              </Typography>

              <Controller
                name="emergenciaNombre"
                control={control}
                rules={{ required: "Nombre requerido" }}
                render={({ field }) => (
                  <TextField {...field} label="Nombre completo" error={!!errors.emergenciaNombre} helperText={errors.emergenciaNombre?.message} />
                )}
              />

              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } }}>
                <Controller
                  name="emergenciaRelacion"
                  control={control}
                  render={({ field }) => <TextField {...field} label="Relación" />}
                />
                <Controller
                  name="emergenciaTelefono"
                  control={control}
                  render={({ field }) => <TextField {...field} label="Teléfono" />}
                />
              </Box>

              <Controller
                name="emergenciaCelular"
                control={control}
                render={({ field }) => <TextField {...field} label="Celular" />}
              />

              <Typography variant="h6" sx={{ mt: 2 }}>
                Estudios / Trabajo
              </Typography>

              <Controller
                name="gradoEstudios"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Grado de estudios">
                    {gradosEstudios.map((g) => (
                      <MenuItem key={g} value={g}>
                        {g}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              {watchGrado === "Otro" && (
                <Controller
                  name="especificaEstudios"
                  control={control}
                  rules={{ required: "Especifica estudios" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Especifica estudios"
                      error={!!errors.especificaEstudios}
                      helperText={errors.especificaEstudios?.message}
                    />
                  )}
                />
              )}

              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } }}>
                <Controller name="ocupacion" control={control} render={({ field }) => <TextField {...field} label="Ocupación" />} />
                <Controller name="empresa" control={control} render={({ field }) => <TextField {...field} label="Empresa" />} />
              </Box>

              <Typography variant="h6" sx={{ mt: 2 }}>
                Idiomas
              </Typography>

              <Controller
                name="idiomas"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    freeSolo
                    value={field.value || []}
                    onChange={(_, v) => field.onChange(v)}
                    options={[]}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
                      ))
                    }
                    renderInput={(params) => <TextField {...params} label="Idiomas" placeholder="Ej. Inglés, Francés" />}
                  />
                )}
              />

              <Controller
                name="porcentajeIdioma"
                control={control}
                render={({ field }) => <TextField {...field} label="% dominio (aprox)" />}
              />
            </Box>
          )}

          {/* ===== PASO 3 ===== */}
          {activeStep === 2 && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Typography variant="h6">Licencias / Documentos</Typography>

              <Controller
                name="licencias"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    freeSolo
                    value={field.value || []}
                    onChange={(_, v) => field.onChange(v)}
                    options={[]}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
                      ))
                    }
                    renderInput={(params) => <TextField {...params} label="Licencias" placeholder="Ej. Automovilista, Motociclista" />}
                  />
                )}
              />

              <Controller name="tipoLicencia" control={control} render={({ field }) => <TextField {...field} label="Tipo de licencia" />} />
              <Controller name="pasaporte" control={control} render={({ field }) => <TextField {...field} label="Pasaporte" />} />
              <Controller name="otroDocumento" control={control} render={({ field }) => <TextField {...field} label="Otro documento" />} />

              <Typography variant="h6" sx={{ mt: 2 }}>
                Salud
              </Typography>

              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } }}>
                <Controller
                  name="tipoSangre"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Tipo de sangre">
                      {tiposSangre.map((t) => (
                        <MenuItem key={t} value={t}>
                          {t}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="rh"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="RH">
                      {rhList.map((r) => (
                        <MenuItem key={r} value={r}>
                          {r}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>

              <Controller name="enfermedades" control={control} render={({ field }) => <TextField {...field} label="Enfermedades" multiline minRows={2} />} />
              <Controller name="alergias" control={control} render={({ field }) => <TextField {...field} label="Alergias" multiline minRows={2} />} />
              <Controller name="medicamentos" control={control} render={({ field }) => <TextField {...field} label="Medicamentos" multiline minRows={2} />} />
              <Controller name="ejercicio" control={control} render={({ field }) => <TextField {...field} label="Ejercicio" />} />

              <Typography variant="h6" sx={{ mt: 2 }}>
                Dirección
              </Typography>

              <Controller name="estado" control={control} render={({ field }) => <TextField {...field} label="Estado" />} />
              <Controller name="colonia" control={control} render={({ field }) => <TextField {...field} label="Colonia" />} />
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } }}>
                <Controller name="cp" control={control} render={({ field }) => <TextField {...field} label="Código postal" />} />
                <Controller name="coordinacion" control={control} render={({ field }) => <TextField {...field} label="Coordinación" />} />
              </Box>

              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
                <Controller name="calle" control={control} render={({ field }) => <TextField {...field} label="Calle" />} />
                <Controller name="numExt" control={control} render={({ field }) => <TextField {...field} label="No. Ext" />} />
                <Controller name="numInt" control={control} render={({ field }) => <TextField {...field} label="No. Int" />} />
              </Box>
            </Box>
          )}

          {/* ===== PASO 4 ===== */}
          {activeStep === 3 && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Typography variant="h6">Motivación</Typography>
              <Controller name="comoSeEntero" control={control} render={({ field }) => <TextField {...field} label="¿Cómo te enteraste?" />} />
              <Controller name="motivoInteres" control={control} render={({ field }) => <TextField {...field} label="Motivo de interés" multiline minRows={3} />} />
              <Controller name="voluntariadoPrevio" control={control} render={({ field }) => <TextField {...field} label="Voluntariado previo" multiline minRows={2} />} />
              <Controller name="razonProyecto" control={control} render={({ field }) => <TextField {...field} label="¿Por qué este proyecto?" multiline minRows={2} />} />

              <Typography variant="h6" sx={{ mt: 2 }}>
                Disponibilidad
              </Typography>

              <Typography sx={{ fontWeight: 700, mt: 1 }}>Días</Typography>
              <FormGroup row>
                {diasSemana.map((d) => (
                  <FormControlLabel
                    key={d}
                    control={<Checkbox checked={(watchDias || []).includes(d)} onChange={() => toggleDia(d)} />}
                    label={d}
                  />
                ))}
              </FormGroup>

              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } }}>
                <Controller
                  name="turno"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Turno">
                      {turnos.map((t) => (
                        <MenuItem key={t} value={t}>
                          {t}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="horario"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Horario">
                      {horarios.map((h) => (
                        <MenuItem key={h} value={h}>
                          {h}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>

              <Typography sx={{ fontWeight: 700, mt: 1 }}>Proyecto(s) de interés</Typography>
              <FormGroup>
                {["Capacitación", "Logística", "Tecnología", "Operaciones", "Comunidad"].map((p) => (
                  <FormControlLabel
                    key={p}
                    control={<Checkbox checked={(watchProyectos || []).includes(p)} onChange={() => toggleProyecto(p)} />}
                    label={p}
                  />
                ))}
              </FormGroup>

              <Controller
                name="terminosyCondiciones"
                control={control}
                rules={{ required: "Debes aceptar los términos" }}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Acepto términos y condiciones"
                  />
                )}
              />
              {errors.terminosyCondiciones && (
                <Typography color="error" sx={{ mt: -1 }}>
                  {errors.terminosyCondiciones.message}
                </Typography>
              )}
            </Box>
          )}

          {/* ===== BOTONES ===== */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Atrás
            </Button>

            {activeStep < steps.length - 1 ? (
              <Button variant="contained" onClick={handleNext} sx={{ background: PRIMARY }}>
                Siguiente
              </Button>
            ) : (
              <Button type="submit" variant="contained" sx={{ background: PRIMARY }}>
                Finalizar registro
              </Button>
            )}
          </Box>
        </Box>

        <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)}>
          <Alert onClose={() => setOpenSnackbar(false)} severity="info" sx={{ width: "100%" }}>
            {snackMsg}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default RegistroDoble;
