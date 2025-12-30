import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { storage } from "./firebase";

export const UploadFile = async (file) => {
  if (!file) return null;

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error("❌ No hay usuario autenticado.");
    return null;
  }

  const uid = user.uid;
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/\s+/g, "_"); // para evitar problemas con espacios
  const fileRef = ref(storage, `usuarios/${uid}/${timestamp}-${sanitizedFileName}`);

  try {
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (err) {
    console.error("🚨 Error al subir archivo:", err);
    return null;
  }
};
