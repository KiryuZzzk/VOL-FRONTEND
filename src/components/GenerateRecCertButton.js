// src/components/GenerateRecCertButton.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button, CircularProgress, Box, Typography } from "@mui/material";
import { jsPDF } from "jspdf";
import axios from "axios";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import MontserratBold from "../assets/fonts/Montserrat-Bold.ttf";
import MontserratRegular from "../assets/fonts/Montserrat-Regular.ttf";
const BACKEND_URL = "https://vol-backend.onrender.com";

/* ===================== rutas ===================== */
function getPublicBase() {
  if (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) return import.meta.env.BASE_URL || "/";
  if (typeof process !== "undefined" && process.env?.PUBLIC_URL) return process.env.PUBLIC_URL || "/";
  return "/";
}
function joinUrl(base, path) {
  const b = (base || "/").replace(/\/+$/, "");
  const p = (path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

/* ===================== utils ===================== */
function formatearFecha(iso) {
  try {
    return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso));
  } catch { return iso || ""; }
}

// Carga IMG sin HEAD, con cache-busting y diagnóstico
function tryLoadImage(src, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let done = false;
    const to = setTimeout(() => { if (!done) { done = true; reject(new Error(`IMG timeout: ${src}`)); } }, timeoutMs);
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => { if (done) return; done = true; clearTimeout(to); resolve(img); };
    img.onerror = async () => {
      clearTimeout(to);
      try {
        const r = await fetch(src, { cache: "no-store" });
        const ct = (r.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("text/html")) {
          const txt = await r.text();
          return reject(new Error(`La plantilla devolvió HTML (404/fallback SPA): ${src}\nStatus:${r.status}\nCT:${ct}\n${txt.slice(0,120)}...`));
        }
        return reject(new Error(`No se pudo cargar la plantilla: ${src} (status ${r.status}, ct: ${ct || "n/a"})`));
      } catch (e) {
        return reject(new Error(`Error de red al cargar plantilla: ${src} -> ${String(e?.message || e)}`));
      }
    };
    const withBust = src.includes("?") ? `${src}&v=${Date.now()}` : `${src}?v=${Date.now()}`;
    img.src = withBust;
  });
}

// === NUEVO: estricto por código, SIN fallback ===

/* ===================== fuentes ===================== */
function ab2base64(buf) {
  let binary = ""; const bytes = new Uint8Array(buf); const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(binary);
}
async function registerFontFromPublic(doc, relativePath, vfsName, familyName) {
  const url = joinUrl(getPublicBase(), relativePath);
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Fuente no accesible (${res.status}): ${url}`);
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("text/html")) throw new Error(`La URL de la fuente devolvió HTML: ${url}`);
  const buf = await res.arrayBuffer();
  if (!buf || buf.byteLength < 10 * 1024) throw new Error(`TTF inválida (${buf?.byteLength || 0} bytes): ${url}`);
  const b64 = ab2base64(buf);
  doc.addFileToVFS(vfsName, b64);
  doc.addFont(vfsName, familyName, "normal");
}

/* ===================== componente ===================== */
export default function GenerateRecCertButton({ cursoId, userId, label = "Generar reconocimiento", fileName }) {
  const [loading, setLoading] = useState(false);
  const [debugMsg, setDebugMsg] = useState("");
  const [certData, setCertData] = useState(null);
  const [checking, setChecking] = useState(true);
  const fontsReadyRef = useRef(false);

  useEffect(() => {
    const curso = String(cursoId || "").toUpperCase();
    if (!curso) { setChecking(false); setCertData(null); return; }

    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) { setCertData(null); return; }
        const token = await user.getIdToken(true);
        const url = userId
          ? `${BACKEND_URL}/inscripciones/${encodeURIComponent(userId)}/${encodeURIComponent(curso)}/cert-data`
          : `${BACKEND_URL}/inscripciones/me/${encodeURIComponent(curso)}/cert-data`;

        const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true });
        if (resp.status === 200 && resp.data?.fullName && resp.data?.curso_id) setCertData(resp.data);
        else setCertData(null);
      } catch { setCertData(null); }
      finally { setChecking(false); }
    });

    return () => unsub();
  }, [cursoId, userId]);

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

    
  // Helpers para jsPDF
  const toBase64 = async (url) => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    // Convertimos a base64
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  };

  const addFontToDoc = async (doc, srcUrl, vfsName, fontName) => {
    const b64 = await toBase64(srcUrl);
    doc.addFileToVFS(vfsName, b64);
    doc.addFont(vfsName, fontName, "normal");
  };

  const handleClick = async () => {
    if (!certData) return;
    try {
      setLoading(true);
      setDebugMsg("");

      const { fullName, fecha_finalizacion, curso_id } = certData;
      const code = String(curso_id || "").trim().toUpperCase(); // ej. "PA", "RE", etc.

      // Asegúrate de que el archivo exista en /public/assets/certificate/CLAVE.png
      const bgImg = await loadImage(`/assets/rec/${curso_id}.png`);

      const doc = new jsPDF({ orientation: "landscape", unit: "px", format: [932, 612] });

       // ✅ Carga de fuentes al VFS
    try {
      await Promise.all([
        addFontToDoc(doc, MontserratBold, "Montserrat-Bold.ttf", "MontserratBold"),
        addFontToDoc(doc, MontserratRegular, "Montserrat-Regular.ttf", "MontserratRegular"),

      ]);
    } catch (e) {
      console.warn("No se pudieron cargar fuentes personalizadas, uso helvetica.", e);
    }

      // Fondo
      doc.addImage(bgImg, "PNG", 0, 0, 932, 612);

      // Nombre
      doc.setFont("MontserratBold", "normal");
      doc.setFontSize(40);
      const nombreLines = doc.splitTextToSize((fullName || "").toUpperCase(), 500);
      nombreLines.forEach((line, idx) => doc.text(line, 467, 330 + idx * 34, { align: "center" }));

      // Fecha
      doc.setFont("MontserratRegular", "normal");
      doc.setFontSize(20);
      doc.text(`Finalizado el ${formatearFecha(fecha_finalizacion)}`, 467, 430, { align: "center" });

      const safeName = fileName || `REC_${code}_${new Date(fecha_finalizacion).toISOString().slice(0, 10)}.pdf`;
      doc.save(safeName);
      setDebugMsg(`Generado ${safeName}`);
    } catch (e) {
      console.error("GenerateRecCertButton:", e);
      setDebugMsg(`Error: ${String(e?.message || e)}`);
      alert(`No se pudo generar el reconocimiento.\n${String(e?.message || e)}`);
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;
  if (!certData) return null;

  return (
    <Box>
      <Button
        variant="contained"
        onClick={handleClick}
        disabled={loading}
        disableElevation
        sx={{
          bgcolor: "#ff3333",
          "&:hover": { bgcolor: "#e62e2e" },
          color: "#fff",
          textTransform: "none",
          borderRadius: "16px",
          px: 2.5,
          py: 1.25,
          mb: "10px",
          boxShadow: "0 6px 20px rgba(230,223,239,0.8)",
        }}
      >
        {loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : label}
      </Button>
      {!!debugMsg && (
        <Typography variant="caption" sx={{ display: "block", mt: 1, color: /error/i.test(debugMsg) ? "error.main" : "text.secondary" }}>
          {debugMsg}
        </Typography>
      )}
    </Box>
  );
}
