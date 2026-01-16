// src/App.js
import "./App.css";
import Navbar from "./components/Navbar";
import NavbarLogIn from "./components/NavbarLogIn";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import Programas from "./pages/Programas";
import Register from "./pages/Register";
import Login from "./pages/Login";

import Platform from "./pages/Platformv2"; // Nueva versión :)
import PlatformLayout from "./components/PlatformLayout";
import Calendario from "./components/Calendario";
import UsuariosPage from "./pages/Usuarios";
import Trayectoria from "./pages/Trayectoria";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useEffect, useState, useMemo } from "react";

import Conocenos from "./pages/Conocenos";
import RegistroDoble from "./components/RegistroDoble";
import MiPerfil from "./components/MiPerfil";
import AdminSidebarMenu from "./components/AdminSideMenu";

// páginas / componentes
import BlockTimeline from "./pages/BlockTimeline";
import rawProgramsData from "./components/datav2.json";

// =======================
// 🔧 Helpers para programas
// =======================
const normalizePrograms = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.programs)) return data.programs;
  if (data.id) return [data];
  return [];
};

const ALL_PROGRAMS = normalizePrograms(rawProgramsData);

function AppInner() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [backendError, setBackendError] = useState(null);
  const [modOrAdmin, setModOrAdmin] = useState(false);
  const [needsDoubleRegister, setNeedsDoubleRegister] = useState(false);

  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const hideNavbar = ["/plataforma", "/miperfil"].includes(path);

  useEffect(() => {
    let active = true;
    console.log("🔄 App montada: registrando onAuthStateChanged...");

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      setCheckingAuth(true);
      setBackendError(null);

      if (user) {
        console.log("👤 Firebase user detectado:", {
          uid: user.uid,
          email: user.email,
        });
        setFirebaseUser(user);

        try {
          const token = await user.getIdToken(true);
          console.log("🛡️ Validando en backend /public/validar-usuario …");

          const res = await fetch(
            "https://vol-backend.onrender.com/public/validar-usuario",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (res.status === 404) {
            console.warn("⚠️ UID válido, NO existe en BD → activar RegistroDoble");
            setUserInfo(null);
            setModOrAdmin(false);
            setNeedsDoubleRegister(true);
          } else if (res.ok) {
            const data = await res.json();
            console.log("✅ Usuario en BD:", {
              id: data?.id,
              uid: data?.uid,
              rol: data?.rol?.nombre_rol || null,
            });
            setUserInfo(data);
            setNeedsDoubleRegister(false);

            const rolNombre = data?.rol?.nombre_rol || "";
            setModOrAdmin(["admin", "moderador"].includes(rolNombre));
          } else if (res.status === 401 || res.status === 403) {
            const errJson = await res.json().catch(() => null);
            const msg = errJson?.error || `Token inválido (${res.status})`;
            console.error("⛔ Auth backend rechazó token:", res.status, msg);
            setBackendError(msg);
            setNeedsDoubleRegister(false);
            await signOut(auth);
            setFirebaseUser(null);
            setUserInfo(null);
            setModOrAdmin(false);
          } else {
            const errJson = await res.json().catch(() => null);
            const msg = errJson?.error || `Error backend: ${res.status}`;
            console.error("💥 Backend error no esperado:", res.status, msg);
            setBackendError(msg);
            setUserInfo(null);
            setModOrAdmin(false);
            setNeedsDoubleRegister(false);
          }
        } catch (error) {
          console.error("🌐 Error de red/otro al validar usuario:", error);
          setBackendError(error.message || "Error de red al validar usuario");
          setUserInfo(null);
          setModOrAdmin(false);
          setNeedsDoubleRegister(false);
        }
      } else {
        console.log("🚪 No hay sesión Firebase.");
        setFirebaseUser(null);
        setUserInfo(null);
        setModOrAdmin(false);
        setNeedsDoubleRegister(false);
      }

      if (active) setCheckingAuth(false);
    });

    return () => {
      active = false;
      unsubscribe();
      console.log("🧹 App desmontada: onAuthStateChanged desuscrito.");
    };
  }, []);

  if (checkingAuth) return <div className="loading">Cargando la app...</div>;

  if (backendError) {
    return (
      <div className="error">
        <p>Error validando usuario: {backendError}</p>
        <button onClick={() => signOut(auth)}>Cerrar sesión</button>
      </div>
    );
  }

  if (needsDoubleRegister) {
    const current = firebaseUser || auth.currentUser;

    console.log("🧩 Render: RegistroDoble (needsDoubleRegister=true)", {
      hasFirebaseUser: !!current,
      uid: current?.uid || null,
    });

    return (
      <div className="App">
        {!hideNavbar && <NavbarLogIn />}
        <RegistroDoble firebaseUser={current} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="App">
      {!hideNavbar && (userInfo ? <NavbarLogIn /> : <Navbar />)}
      {modOrAdmin && <AdminSidebarMenu />}

      <Routes>
        {userInfo ? (
          <>
            <Route
              path="/Plataforma"
              element={
                <PlatformLayout modOrAdmin={modOrAdmin}>
                  <Platform user={userInfo} />
                </PlatformLayout>
              }
            />

            <Route
              path="/MiPerfil"
              element={
                <PlatformLayout modOrAdmin={modOrAdmin}>
                  <MiPerfil user={userInfo} />
                </PlatformLayout>
              }
            />

            <Route
              path="/Programa"
              element={
                <PlatformLayout modOrAdmin={modOrAdmin}>
                  <ProgramaPage />
                </PlatformLayout>
              }
            />


            <Route
              path="/Trayectoria"
              element={
                <PlatformLayout modOrAdmin={modOrAdmin}>
                  <Trayectoria />
                </PlatformLayout>
              }
            />

            <Route
              path="/Usuarios"
              element={
                <PlatformLayout modOrAdmin={modOrAdmin}>
                  <UsuariosPage />
                </PlatformLayout>
              }
            />

            <Route
              path="/Calendario"
              element={
                <PlatformLayout modOrAdmin={modOrAdmin}>
                  <Calendario />
                </PlatformLayout>
              }
            />

            <Route path="*" element={<Navigate to="/Plataforma" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/Inicio" element={<HomePage />} />
            <Route path="/Programas" element={<Programas />} />
            <Route path="/Conocenos" element={<Conocenos />} />
            <Route path="/Registrate" element={<Register />} />
            <Route path="/Ingresa" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>

      <Footer />
    </div>
  );
}

// ✅ NUEVO: acepta ?code= o ?id=
// Página que muestra el timeline según el ?code= del programa (backend-driven)
function ProgramaPage() {
  const [searchParams] = useSearchParams();
  const programCode = (searchParams.get("code") || "").trim().toUpperCase();

  if (!programCode) {
    return (
      <div style={{ padding: "16px" }}>
        Selecciona un programa desde la sección &quot;Tus Programas&quot;.
      </div>
    );
  }

  return (
    <BlockTimeline
      programCode={programCode}
      onActivityClick={(payload) => {
        console.log("Actividad clickeada:", payload);
      }}
    />
  );
}


export default function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}
