import { useEffect } from "react";
import { auth } from "../firebase";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";
import { EmailAuthProvider } from "firebase/auth";

// Instancia global de FirebaseUI
let firebaseUIInstance = firebaseui.auth.AuthUI.getInstance() || null;

const FirebaseLoginUI = () => {
  useEffect(() => {
    console.log("🧪 Montando Login-Only UI...");

    // 🔐 Cerramos cualquier sesión previa (por si el usuario fue eliminado o la sesión es inválida)
    auth
      .signOut()
      .then(() => {
        console.log("🔓 Sesión previa cerrada.");

        // Creamos instancia solo si no existe ya
        if (!firebaseUIInstance) {
          firebaseUIInstance = new firebaseui.auth.AuthUI(auth);
        }

        // Iniciamos FirebaseUI
        firebaseUIInstance.start("#firebaseui-login-container", {
          signInOptions: [
            {
              provider: EmailAuthProvider.PROVIDER_ID,
              disableSignUp: { status: false }, // 👈 No permitir creación de cuentas aquí
            },
          ],
          signInFlow: "popup", // o 'redirect' si prefieres
          callbacks: {
            signInSuccessWithAuthResult: (authResult) => {
              console.log("🎉 Usuario logueado:", authResult.user);
              return false; // 👈 Evita redirección automática
            },
            uiShown: () => {
              console.log("✨ UI de Login mostrada");
            },
          },
        });
      })
      .catch((error) => {
        console.error("❌ Error al cerrar sesión previa:", error);
      });

    // Cleanup cuando se desmonte
    return () => {
      console.log("🧹 Limpiando instancia de FirebaseUI");
      if (firebaseUIInstance) {
        firebaseUIInstance.reset();
      }
    };
  }, []);

  return (
    <div>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
        Inicia sesión
      </h2>
      <div
        id="firebaseui-login-container"
        style={{
          minHeight: 300,
          backgroundColor: "#fafafa",
          padding: "1rem",
          borderRadius: "8px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }}
      ></div>
    </div>
  );
};

export default FirebaseLoginUI;
