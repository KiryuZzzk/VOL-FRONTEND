import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Actividad: Regulación de Emociones
 * - Paso 1: Reconocer la emoción (3–5 min)
 * - Paso 2: Identificar pensamientos automáticos (3–5 min)
 * - Paso 3: Cuestionar y reestructurar (5–7 min)
 * - Paso 4: Atención plena (5 min)
 * - Paso 5: Cierre y compartir
 *
 * Single-file, sin dependencias externas (más allá de React).
 * Incluye: timers por paso, guía de respiración, guardado en localStorage,
 * progreso, impresión/descarga JSON, validaciones suaves.
 */

const PALETTE = {
  base: "#ffffff",
  touch: "#fff8ff",
  detail: "#e6dfef",
  accent: "#ff3333",
  text: "#222222",
};

const DEFAULT_DURATIONS = {
  1: 4 * 60, // 3–5 min → 4 min
  2: 4 * 60, // 3–5 min → 4 min
  3: 6 * 60, // 5–7 min → 6 min
  4: 5 * 60, // 5 min
};

const STORAGE_KEY = "actividad_regulacion_emociones_v1";

function useCountdown(seconds, running) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, [running]);

  const pct = useMemo(() => (seconds <= 0 ? 0 : ((seconds - remaining) / seconds) * 100), [seconds, remaining]);
  return { remaining, pct, setRemaining };
}

function BreathCircle({ running }) {
  // 4s inhalar → 4s sostener → 6s exhalar (14s ciclo)
  const cycle = 14000;
  return (
    <div
      aria-label="Guía de respiración"
      style={{
        width: 180,
        height: 180,
        borderRadius: "50%",
        border: `6px solid ${PALETTE.detail}`,
        margin: "12px auto",
        position: "relative",
        overflow: "hidden",
        background: PALETTE.touch,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          color: PALETTE.text,
          fontWeight: 600,
        }}
      >
        <span style={{ opacity: 0.7, fontSize: 14 }}>Respira con el círculo</span>
      </div>
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: PALETTE.accent,
          opacity: 0.85,
          margin: "auto",
          transformOrigin: "center",
          animation: running ? `breath ${cycle}ms ease-in-out infinite` : "none",
        }}
      />
      <style>
        {`
          @keyframes breath {
            0% { transform: scale(1); }
            28.5% { transform: scale(1.9); } /* 0–4s inhalar */
            57% { transform: scale(1.9); }  /* 4–8s sostén */
            100% { transform: scale(1); }   /* 8–14s exhalar */
          }
        `}
      </style>
    </div>
  );
}

function Section({ title, subtitle, children, right }) {
  return (
    <div
      style={{
        background: PALETTE.base,
        border: `1px solid ${PALETTE.detail}`,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        boxShadow: `0 6px 24px rgba(0,0,0,0.04)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div
          style={{ width: 10, height: 10, borderRadius: 12, background: PALETTE.accent, opacity: 0.8 }}
        />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: PALETTE.text }}>{title}</h3>
          {subtitle && (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#555" }}>{subtitle}</p>
          )}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {children}
    </div>
  );
}

function TextArea({ label, placeholder, value, onChange, required }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>
        {label} {required && <span style={{ color: PALETTE.accent }}>*</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 12,
          border: `1px solid ${PALETTE.detail}`,
          background: PALETTE.touch,
          outline: "none",
        }}
      />
    </label>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", required }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>
        {label} {required && <span style={{ color: PALETTE.accent }}>*</span>}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 12,
          border: `1px solid ${PALETTE.detail}`,
          background: PALETTE.touch,
          outline: "none",
        }}
      />
    </label>
  );
}

function Slider({ label, value, onChange, min = 0, max = 10 }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>{label}</div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ width: "100%" }}
      />
      <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Intensidad: {value}</div>
    </label>
  );
}

function ToolbarButton({ children, onClick, kind = "default", disabled }) {
  const styles = {
    default: {
      background: PALETTE.touch,
      border: `1px solid ${PALETTE.detail}`,
      color: PALETTE.text,
    },
    primary: {
      background: PALETTE.accent,
      border: `1px solid ${PALETTE.accent}`,
      color: "#fff",
    },
    ghost: {
      background: "transparent",
      border: `1px dashed ${PALETTE.detail}`,
      color: "#444",
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[kind],
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "10px 14px",
        borderRadius: 12,
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}

function Progress({ step, total, pct }) {
  return (
    <div style={{ margin: "8px 0 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666" }}>
        <span>Paso {step} de {total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 10, background: PALETTE.detail, borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: PALETTE.accent }} />
      </div>
    </div>
  );
}

export default function ActividadRegulacionEmociones() {
  const totalSteps = 5; // 1..4 + cierre
  const [step, setStep] = useState(1);
  const [running, setRunning] = useState(false);
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);

  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      fecha: new Date().toISOString(),
      situacion: "",
      emocion: "",
      intensidadAntes: 5,
      sensaciones: "",
      pensamientos: "",
      esDistorsionado: false,
      evidenciaEnContra: "",
      reinterpretacion: "",
      repeticion: 3,
      mindfulnessNotas: "",
      intensidadDespues: 3,
      reflexionFinal: "",
    };
  });

  const stepPct = useMemo(() => ((step - 1) / (totalSteps - 1)) * 100, [step]);
  const { remaining, pct, setRemaining } = useCountdown(durations[step] || 0, running);

  useEffect(() => {
    if (remaining === 0 && running) setRunning(false);
  }, [remaining, running]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const update = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const requiredOk = useMemo(() => {
    if (step === 1) return form.emocion.trim() && form.sensaciones.trim();
    if (step === 2) return form.pensamientos.trim().length > 0;
    if (step === 3) return form.reinterpretacion.trim().length > 0;
    if (step === 4) return true; // mindfulness libre
    return true;
  }, [step, form]);

  const onNext = () => setStep((s) => Math.min(totalSteps, s + 1));
  const onPrev = () => setStep((s) => Math.max(1, s - 1));

  const resetTimers = (s) => {
    setRemaining(durations[s] || 0);
  };

  useEffect(() => {
    resetTimers(step);
    setRunning(false);
  }, [step]);

  const clearAll = () => {
    if (!window.confirm("¿Seguro que quieres limpiar todo?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setForm({
      fecha: new Date().toISOString(),
      situacion: "",
      emocion: "",
      intensidadAntes: 5,
      sensaciones: "",
      pensamientos: "",
      esDistorsionado: false,
      evidenciaEnContra: "",
      reinterpretacion: "",
      repeticion: 3,
      mindfulnessNotas: "",
      intensidadDespues: 3,
      reflexionFinal: "",
    });
    setStep(1);
    setRunning(false);
    setDurations(DEFAULT_DURATIONS);
    resetTimers(1);
  };

  const timerPretty = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  const canNext = requiredOk;

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: 16,
        background: PALETTE.base,
      }}
    >
      <header
        style={{
          background: PALETTE.touch,
          border: `1px solid ${PALETTE.detail}`,
          padding: 16,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: PALETTE.text }}>Ejercicio de regulación de emociones</h2>
          <p style={{ margin: "4px 0 0", color: "#555" }}>
            Objetivo: identificar emociones y pensamientos, reestructurar lo disfuncional y practicar atención plena.
          </p>
        </div>
        <div style={{ flexBasis: "100%" }}>
          <Progress step={step} total={totalSteps} pct={stepPct} />
        </div>
      </header>

      {/* CONTROLES DEL TIMER */}
      {step <= 4 && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              border: `1px solid ${PALETTE.detail}`,
              padding: 10,
              borderRadius: 12,
              background: PALETTE.touch,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <strong>Timer:</strong> <span>{timerPretty(remaining)}</span>
            <div style={{ width: 160, height: 8, background: PALETTE.detail, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: PALETTE.accent }} />
            </div>
            <ToolbarButton onClick={() => setRunning((r) => !r)} kind="primary">
              {running ? "Pausar" : "Iniciar"}
            </ToolbarButton>
            <ToolbarButton onClick={() => resetTimers(step)}>Reiniciar</ToolbarButton>
          </div>

          <div
            style={{
              border: `1px dashed ${PALETTE.detail}`,
              padding: 10,
              borderRadius: 12,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>Duración (min):</span>
            <input
              type="number"
              min={1}
              max={30}
              value={Math.round((durations[step] || 0) / 60)}
              onChange={(e) =>
                setDurations((d) => ({ ...d, [step]: Math.max(1, Math.min(30, Number(e.target.value))) * 60 }))
              }
              style={{ width: 70, padding: 6, borderRadius: 8, border: `1px solid ${PALETTE.detail}` }}
            />
          </div>
        </div>
      )}

      {/* PASO 1 */}
      {step === 1 && (
        <Section title="1) Reconocer la emoción" subtitle="3–5 minutos. Observa la emoción y el cuerpo.">
          <Row>
            <Input
              label="Situación reciente que generó una emoción intensa"
              placeholder="Describe brevemente la situación"
              value={form.situacion}
              onChange={update("situacion")}
            />
            <Input
              label="¿Qué emoción sientes?"
              placeholder="Tristeza, enojo, ansiedad, miedo, etc."
              value={form.emocion}
              onChange={update("emocion")}
              required
            />
          </Row>
          <Row>
            <Slider label="Intensidad antes (0–10)" value={form.intensidadAntes} onChange={update("intensidadAntes")} />
            <Input
              label="Síntomas físicos"
              placeholder="Tensión, sudor, nudo en el estómago, respiración acelerada…"
              value={form.sensaciones}
              onChange={update("sensaciones")}
              required
            />
          </Row>
          <TextArea
            label="Describe cómo se siente esa emoción en tu cuerpo y mente"
            placeholder="Escribe en unas líneas tus sensaciones y pensamientos presentes."
            value={form.descripcion1 || ""}
            onChange={update("descripcion1")}
          />
        </Section>
      )}

      {/* PASO 2 */}
      {step === 2 && (
        <Section title="2) Identificar pensamientos automáticos" subtitle="3–5 minutos. Observa los pensamientos rápidos y etiquetas posibles distorsiones.">
          <TextArea
            label="¿Qué pensamientos rápidos y automáticos tuviste?"
            placeholder="Ej. ‘Nunca voy a poder’, ‘Todo está perdido’, etc."
            value={form.pensamientos}
            onChange={update("pensamientos")}
            required
          />
          <Row>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.esDistorsionado}
                onChange={(e) => update("esDistorsionado")(e.target.checked)}
              />
              <span style={{ fontSize: 14 }}>¿Identificas que alguno es negativo o distorsionado?</span>
            </label>
            <Input
              label="Si quieres, nombra la distorsión (opcional)"
              placeholder="Generalización, catastrofismo, pensamiento dicotómico…"
              value={form.tipoDistorsion || ""}
              onChange={update("tipoDistorsion")}
            />
          </Row>
        </Section>
      )}

      {/* PASO 3 */}
      {step === 3 && (
        <Section title="3) Cuestionar y reestructurar" subtitle="5–7 minutos. Busca evidencias y formula una interpretación más realista.">
          <TextArea
            label="¿Ese pensamiento es 100% cierto? ¿Qué evidencias hay en contra?"
            placeholder="Anota pruebas reales que cuestionen el pensamiento."
            value={form.evidenciaEnContra}
            onChange={update("evidenciaEnContra")}
          />
          <Row>
            <TextArea
              label="Reemplazo: pensamiento más adaptativo y positivo"
              placeholder="Ej. ‘Puedo aprender y mejorar con práctica’."
              value={form.reinterpretacion}
              onChange={update("reinterpretacion")}
              required
            />
            <Input
              type="number"
              label="Repite este nuevo pensamiento (veces)"
              value={form.repeticion}
              onChange={(v) => update("repeticion")(Math.max(1, Number(v)))}
              placeholder="3"
            />
          </Row>
        </Section>
      )}

      {/* PASO 4 */}
      {step === 4 && (
        <Section
          title="4) Practicar atención plena (Mindfulness)"
          subtitle="5 minutos. Enfócate en tu respiración sin juzgar; si aparecen pensamientos/emociones, obsérvalos y vuelve a la respiración."
          right={<ToolbarButton onClick={() => setRunning((r) => !r)} kind="primary">{running ? "Pausar guía" : "Iniciar guía"}</ToolbarButton>}
        >
          <BreathCircle running={running} />
          <TextArea
            label="Notas de la práctica"
            placeholder="¿Qué notaste en tu respiración? ¿Aparecieron pensamientos? ¿Cómo los observaste?"
            value={form.mindfulnessNotas}
            onChange={update("mindfulnessNotas")}
          />
          <Row>
            <Slider label="Intensidad después (0–10)" value={form.intensidadDespues} onChange={update("intensidadDespues")} />
            <Input
              label="¿Cómo te sientes ahora? (breve)"
              placeholder="Palabras clave o una frase corta"
              value={form.comoAhora || ""}
              onChange={update("comoAhora")}
            />
          </Row>
        </Section>
      )}

      {/* CIERRE */}
      {step === 5 && (
        <Section title="Cierre y reflexión" subtitle="Comparte cómo fue la experiencia y qué te llevas de este ejercicio.">
          <TextArea
            label="Reflexión final"
            placeholder="¿Disminuyó la intensidad? ¿Qué te funcionó? ¿Qué aprendiste sobre ti?"
            value={form.reflexionFinal}
            onChange={update("reflexionFinal")}
          />
          <div
            style={{
              borderTop: `1px solid ${PALETTE.detail}`,
              marginTop: 12,
              paddingTop: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              fontSize: 14,
            }}
          >
            <div>
              <strong>Resumen</strong>
              <ul style={{ marginTop: 8 }}>
                <li><strong>Emoción:</strong> {form.emocion || "—"}</li>
                <li><strong>Intensidad antes/después:</strong> {form.intensidadAntes} → {form.intensidadDespues}</li>
                <li><strong>Pensamientos automáticos:</strong> {form.pensamientos || "—"}</li>
                <li><strong>Reinterpretación:</strong> {form.reinterpretacion || "—"}</li>
              </ul>
            </div>
            <div>
              <strong>Notas</strong>
              <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{form.mindfulnessNotas || ""}</p>
            </div>
          </div>
        </Section>
      )}

      {/* NAV */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          gap: 8,
          position: "sticky",
          bottom: 0,
          background: PALETTE.base,
          padding: 8,
          borderTop: `1px solid ${PALETTE.detail}`,
        }}
      >
        <ToolbarButton onClick={onPrev} disabled={step === 1}>Anterior</ToolbarButton>
        {step < 5 ? (
          <ToolbarButton onClick={onNext} kind="primary" disabled={!canNext}>Siguiente</ToolbarButton>
        ) : (
<></>
        )}
      </div>

      {/* FOOTER INFO */}
      <p style={{ marginTop: 16, fontSize: 12, color: "#666" }}>
        Este ejercicio promueve la autorregulación y el autoconocimiento. Puedes practicarlo en distintas situaciones para fortalecer tu bienestar emocional.
      </p>
    </div>
  );
}
