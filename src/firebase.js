import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 👈 Agregado para archivos

const firebaseConfig = {
  apiKey: "AIzaSyCQgH6Jjkhd2x9FBMvqder-TpKkotE3Waw",
  authDomain: "soyvoluntarioregistros.firebaseapp.com",
  projectId: "soyvoluntarioregistros",
  storageBucket: "gs://soyvoluntarioregistros.firebasestorage.app",
  messagingSenderId: "793970827889",
  appId: "1:793970827889:web:4c251a6e684e1cb4e471d0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // 👈 Exporta el storage también
