import { useEffect, useState } from "react";
import RedBackground from "../assets/Banner.png";
import RedBackground2 from "../assets/Banner2.png";
import ProfilePlatform from "../components/ProfilePlatform";
import ProfilePlatformSmall from "../components/ProfilePlatformSmall";
import FormDocumentos from "../components/FormDocumentos";
import {
  Box,
  useMediaQuery,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import { auth } from "../firebase";
import CarrouselCursos from "../components/CarrouselCursos";
import { FiX } from "react-icons/fi";
// import AvisoSubeDocumentos from "../components/AvisoSubeDocumentos";
import CoordinationsShowcase from "../components/CoordinatorsShowcase";

const COLORS = {
  bg: "#fff8ff",
  white: "#fff",
  subtle: "#e6dfef",
  red: "#ff3333",
  lilac: "#f3eaff",
  redHover: "#e02a2a",
};

const BACKEND_URL = "https://vol-backend.onrender.com";
const STICKY_DISMISS_KEY = "coordinacion-activo-sticky-dismissed-v1";

const Platform = ({ user }) => {
  const isSmallScreen = useMediaQuery("(max-width:1232px)");

  // ---------------- Documentos (original) ----------------
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsCount, setDocsCount] = useState(0);
  const [docsError, setDocsError] = useState(null);

  const userId = user?.id;

  // ---------------- Perfil desde backend ----------------
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    let alive = true;

    const fetchProfile = async () => {
      try {
        if (!userId) {
          if (alive) {
            setProfile(null);
            setProfileLoading(false);
          }
          return;
        }

        setProfileLoading(true);
        const current = auth.currentUser;
        const token = await current?.getIdToken(true);

        const res = await fetch(`${BACKEND_URL}/users/${userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!alive) return;
        setProfile(data); // trae .coordinacion y .estatus desde getByUserId
        setProfileError(null);
      } catch (e) {
        if (!alive) return;
        setProfile(null);
        setProfileError(e?.message || "Error cargando perfil");
      } finally {
        if (alive) setProfileLoading(false);
      }
    };

    fetchProfile();
    return () => {
      alive = false;
    };
  }, [userId]);

  // ---------------- Docs (original) ----------------
  const extractCount = (data) => {
    try {
      if (data == null) return 0;
      if (typeof data === "number") return data;
      if (Array.isArray(data)) return data.length;
      if (Array.isArray(data?.items)) return data.items.length;
      if (Array.isArray(data?.documentos)) return data.documentos.length;
      if (typeof data?.count === "number") return data.count;
      if (typeof data?.total === "number") return data.total;
      return 0;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    let alive = true;

    const fetchDocs = async () => {
      if (!userId) {
        setDocsLoading(false);
        setDocsCount(0);
        setDocsError(null);
        return;
      }

      setDocsLoading(true);
      setDocsError(null);

      try {
        const current = auth.currentUser;
        const token = await current?.getIdToken(true);

        const endpoints = [
          `${BACKEND_URL}/users/${userId}/documentos`,
          `${BACKEND_URL}/documentos/mios`,
        ];

        let found = false;
        for (const url of endpoints) {
          try {
            const res = await fetch(url, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            if (res.ok) {
              const json = await res.json().catch(() => null);
              const count = extractCount(json);
              if (alive) {
                setDocsCount(count);
                setDocsLoading(false);
                setDocsError(null);
              }
              found = true;
              break;
            }

            if (res.status === 404) continue;

            const errJson = await res.json().catch(() => null);
            console.warn("Docs endpoint error:", res.status, errJson?.error || errJson);
          } catch (e) {
            console.warn("Docs fetch error:", e);
          }
        }

        if (!found && alive) {
          setDocsCount(0);
          setDocsLoading(false);
          setDocsError(null);
        }
      } catch (err) {
        if (!alive) return;
        setDocsError(err.message || "Error consultando documentos");
        setDocsLoading(false);
        setDocsCount(0);
      }
    };

    fetchDocs();
    return () => {
      alive = false;
    };
  }, [userId]);

  // ---------------- Condiciones de UI ----------------
  const meetsSticky =
    !profileLoading &&
    typeof profile?.coordinacion === "string" &&
    profile.coordinacion.trim() !== "" &&
    profile?.estatus?.toLowerCase() === "activo";

  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    if (meetsSticky) {
      const dismissed = localStorage.getItem(STICKY_DISMISS_KEY) === "1";
      setShowSticky(!dismissed);
    } else {
      setShowSticky(false);
    }
  }, [meetsSticky]);

  const handleCloseSticky = () => setShowSticky(false);
  const handleNeverShow = () => {
    localStorage.setItem(STICKY_DISMISS_KEY, "1");
    setShowSticky(false);
  };

  // Bloqueo total de contenido para inactivos SIN coordinación
  const isInactiveNoCoord =
    !profileLoading &&
    (!profile?.coordinacion || profile.coordinacion.trim() === "") &&
    profile?.estatus?.toLowerCase() === "inactivo";

  return (
    <Box sx={{ backgroundColor: COLORS.bg, minHeight: "100vh" }}>
      {/* Banner superior */}
      <Box
        sx={{
          maxWidth: "100%",
          overflowX: "hidden",
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
          m: 0,
          p: 0,
        }}
      />

      {/* Showcase solo para quienes NO han elegido coordinación */}
      {!profileLoading && (!profile?.coordinacion || profile.coordinacion.trim() === "") && (
        <CoordinationsShowcase />

)}
      {/* TERNARIO CORRECTO */}
      {isInactiveNoCoord ? (
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            minHeight: { xs: "50vh", md: "60vh" },
            px: 2,
          }}
        >
          <Box
            sx={{
              background: COLORS.white,
              border: `1px solid ${COLORS.subtle}`,
              boxShadow: `0 10px 24px rgba(0,0,0,0.08)`,
              borderRadius: "18px",
              p: { xs: 3, md: 4 },
              maxWidth: 720,
              textAlign: "center",
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: COLORS.red, mb: 1 }}
            >
              ¡Lo sentimos!
            </Typography>
            <Typography sx={{ color: "#2d2a32" }}>
              El proceso de selección ha finalizado. Te invitamos a que consultes
              nuestras redes y estés atento a nuevas convocatorias. <br />
              <strong>¡Empezamos el próximo año!</strong>
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          {/* Sticky Note (solo si perfil activo + coordinación) */}
          {showSticky && (
            <Box
              role="dialog"
              aria-label="Aviso de coordinación activa"
              sx={{
                position: "fixed",
                right: { xs: 12, sm: 24 },
                bottom: { xs: 12, sm: 24 },
                width: { xs: "calc(100% - 24px)", sm: 380 },
                background: COLORS.lilac,
                border: `2px solid ${COLORS.subtle}`,
                boxShadow:
                  "0 12px 30px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)",
                borderRadius: "18px",
                p: 2.5,
                zIndex: 1300,
                transform: "rotate(-1.2deg)",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: -10,
                  left: 22,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: COLORS.red,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
              />
              <IconButton
                aria-label="Cerrar aviso"
                onClick={handleCloseSticky}
                size="small"
                sx={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  color: COLORS.red,
                  "&:hover": { color: COLORS.redHover, background: "transparent" },
                }}
              >
                <FiX />
              </IconButton>

              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, color: COLORS.red, mb: 0.5 }}
              >
                ¡Gracias por tu interés!
              </Typography>

              <Typography sx={{ color: "#2d2a32" }}>
                Estamos analizando tu solicitud de ingreso. Si eres aprobado,
                podrás continuar con tu formación a partir de diciembre 2025.
              </Typography>

              <Box sx={{ display: "flex", gap: 1, mt: 1.75 }}>
                <Button
                  variant="contained"
                  onClick={handleCloseSticky}
                  sx={{
                    textTransform: "none",
                    background: COLORS.red,
                    "&:hover": { background: COLORS.redHover },
                    borderRadius: "12px",
                    px: 2,
                  }}
                >
                  Entendido
                </Button>
                <Button
                  variant="text"
                  onClick={handleNeverShow}
                  sx={{
                    textTransform: "none",
                    color: "#333",
                    borderRadius: "12px",
                    px: 1.5,
                    "&:hover": { background: COLORS.subtle },
                  }}
                >
                  No volver a mostrar
                </Button>
              </Box>
            </Box>
          )}

          {/* Contenido normal */}
          <Box
            sx={{
              display: "flex",
              flexDirection: isSmallScreen ? "column" : "row",
              gap: 2,
            }}
          >
            {/* Perfil */}
            <Box sx={{ width: isSmallScreen ? "100%" : "30%" }}>
              {isSmallScreen ? <ProfilePlatformSmall /> : <ProfilePlatform />}
            </Box>

            {/* Carrousel + Form */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <CarrouselCursos />
              <FormDocumentos />
            </Box>
          </Box>
        </>
      )}

      {/* Banner inferior */}
      <Box
        sx={{
          maxWidth: "100%",
          overflowX: "hidden",
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
          m: 0,
          p: 0,
        }}
      />
    </Box>
  );
};

export default Platform;
