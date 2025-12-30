import React, { useMemo, useState } from "react";

/**
 * ActividadesID – Match + Risk (EDAN)
 * - Nivel 1: Emparejar Término → Definición (drag & drop)
 * - Nivel 2: Clasificar ítems de micro-escenarios en Daño / Capacidad / Necesidad
 * 
 */

const ESTILOS = {
  wrap: {
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
    background: "#fff8ff",
    color: "#1f1f1f",
    padding: "20px",
    maxWidth: 1100,
    margin: "0 auto",
  },
  h1: { fontSize: 24, margin: "0 0 8px" },
  p: { margin: "8px 0 16px", lineHeight: 1.4 },
  card: {
    background: "#ffffff",
    border: "1px solid #e6dfef",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
    marginBottom: 16,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  termBox: {
    border: "1px dashed #cfc7dd",
    borderRadius: 12,
    padding: 12,
    minHeight: 84,
    background: "#faf7ff",
  },
  termTitle: { fontWeight: 700, marginBottom: 8 },
  defBank: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 8,
  },
  chip: {
    cursor: "grab",
    borderRadius: 12,
    border: "1px solid #e6dfef",
    padding: "10px 12px",
    background: "white",
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
    userSelect: "none",
  },
  dropSlot: {
    marginTop: 8,
    minHeight: 46,
    borderRadius: 10,
    background: "#fff",
    border: "1px solid #e6dfef",
    padding: 8,
    display: "flex",
    alignItems: "center",
  },
  btnRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 },
  btn: {
    background: "#e6dfef",
    border: "1px solid #d5cce4",
    borderRadius: 12,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  btnPrimary: {
    background: "#6b5fb8",
    color: "white",
    border: "1px solid #5b52a1",
  },
  tagPill: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e6dfef",
    background: "white",
    margin: "2px 4px 0 0",
    fontSize: 13,
  },
  correct: { background: "#e9fbef", borderColor: "#c8efd6" },
  wrong: { background: "#fff0f0", borderColor: "#ffd2d2" },
  headingSmall: { fontWeight: 700, fontSize: 14, opacity: 0.75, margin: "0 0 6px" },
  scenarioWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: 12,
  },
  scenarioCard: {
    background: "#ffffff",
    border: "1px solid #e6dfef",
    borderRadius: 14,
    padding: 12,
  },
  columns3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },
  colTitle: { fontWeight: 700, fontSize: 14, marginBottom: 6 },
  slotArea: {
    minHeight: 70,
    background: "#faf7ff",
    border: "1px dashed #cfc7dd",
    borderRadius: 12,
    padding: 8,
  },
  divider: { height: 1, background: "#eee", margin: "14px 0" },
};

const NIVEL1_TERMINOS = [
  {
    key: "amenaza",
    term: "Amenaza",
    def: "Fenómeno o evento con potencial de causar daño (p. ej., sismo, huracán, inundación).",
  },
  {
    key: "exposicion",
    term: "Exposición",
    def: "Personas, bienes o servicios ubicados en zonas potencialmente afectadas.",
  },
  {
    key: "vulnerabilidad",
    term: "Vulnerabilidad",
    def: "Condiciones que aumentan la probabilidad de daño (materiales, ingresos, discapacidad, aislamiento).",
  },
  {
    key: "capacidades",
    term: "Capacidades",
    def: "Recursos/fortalezas disponibles para enfrentar el evento (comunitarias, institucionales, logísticas).",
  },
  {
    key: "riesgo",
    term: "Riesgo",
    def: "Función de amenaza × exposición × vulnerabilidad ÷ capacidades.",
  },
  {
    key: "dano",
    term: "Daño",
    def: "Afectaciones a personas, bienes o servicios (vivienda, infraestructura, agua, salud, energía).",
  },
  {
    key: "necesidad",
    term: "Necesidad",
    def: "Brecha crítica derivada del daño menos las capacidades existentes; guía la respuesta.",
  },
  {
    key: "edan_rapido",
    term: "EDAN rápido",
    def: "Levantamiento inicial (24–72 h) para orientar la primera respuesta.",
  },
  {
    key: "sectores",
    term: "Sectores (salud, WASH, albergues)",
    def: "Áreas de análisis para priorizar la asistencia por tipo de servicio/impacto.",
  },
];

// Para evitar usar librerías de shuffle
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const NIVEL2_ESCENARIOS = [
  {
    id: "esc1",
    titulo: "Barrio La Esperanza",
    descripcion:
      "Tras lluvias intensas, 20 viviendas con techos dañados. Pozo principal sin energía por 48 h. Clínica familiar funciona con 2 médicos y un generador. Comité vecinal con herramienta básica.",
    // Ítems disponibles y su clasificación correcta
    items: [
      { id: "e1_i1", text: "20 viviendas con techos dañados", clas: "dano" },
      { id: "e1_i2", text: "Pozo sin energía por 48 h", clas: "dano" },
      { id: "e1_i3", text: "Clínica operativa con generador", clas: "capacidad" },
      { id: "e1_i4", text: "Comité vecinal con herramienta", clas: "capacidad" },
      { id: "e1_i5", text: "Requiere lonas y kits de reparación", clas: "necesidad" },
      { id: "e1_i6", text: "Cloración temporal de agua", clas: "necesidad" },
    ],
  },
  {
    id: "esc2",
    titulo: "Comunidad El Río",
    descripcion:
      "Crecida dejó el camino rural intransitable. Escuela usada como refugio temporal (30 familias). Sistema de agua con daño moderado; hay cisternas móviles estatales.",
    items: [
      { id: "e2_i1", text: "Camino rural intransitable", clas: "dano" },
      { id: "e2_i2", text: "Escuela como refugio (30 familias)", clas: "dano" },
      { id: "e2_i3", text: "Cisternas móviles estatales", clas: "capacidad" },
      { id: "e2_i4", text: "Apoyo en gestión de albergue", clas: "necesidad" },
      { id: "e2_i5", text: "Restablecimiento de accesos", clas: "necesidad" },
      { id: "e2_i6", text: "Daño moderado en sistema de agua", clas: "dano" },
    ],
  },
  {
    id: "esc3",
    titulo: "Colonia Centro",
    descripcion:
      "Corte de energía en subestación. Hospital general al 60% (quirófanos cerrados), red de voluntariado con 3 ambulancias y donaciones locales de alimentos.",
    items: [
      { id: "e3_i1", text: "Corte de energía en subestación", clas: "dano" },
      { id: "e3_i2", text: "Hospital al 60% (quirófanos cerrados)", clas: "dano" },
      { id: "e3_i3", text: "3 ambulancias voluntarias", clas: "capacidad" },
      { id: "e3_i4", text: "Donaciones locales de alimentos", clas: "capacidad" },
      { id: "e3_i5", text: "Plantas de luz y combustible", clas: "necesidad" },
      { id: "e3_i6", text: "Referencias a hospitales alternos", clas: "necesidad" },
    ],
  },
];

function Nivel1Match({
  barajaDefs,
  respuestas,
  setRespuestas,
  calificado,
  correctMap,
}) {
  // Drag: pasamos defIndex como dataTransfer
  const onDragStart = (e, defIndex) => {
    e.dataTransfer.setData("text/plain", String(defIndex));
  };

  const onDrop = (e, termKey) => {
    e.preventDefault();
    const defIdxStr = e.dataTransfer.getData("text/plain");
    if (!defIdxStr) return;
    const defIndex = parseInt(defIdxStr, 10);

    // Evitar que una definición se use en dos términos:
    // removemos donde esté usada y la reasignamos a este termKey
    setRespuestas((prev) => {
      const nuevo = { ...prev };
      // Quitar de cualquier otro slot
      Object.keys(nuevo).forEach((k) => {
        if (nuevo[k] === defIndex) nuevo[k] = null;
      });
      // Asignar
      nuevo[termKey] = defIndex;
      return nuevo;
    });
  };

  const onDragOver = (e) => e.preventDefault();

  const bancoDefsUsadas = new Set(Object.values(respuestas).filter((v) => v !== null));

  return (
    <div style={ESTILOS.card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={ESTILOS.headingSmall}>Términos</div>
          <div style={{ ...ESTILOS.grid2 }}>
            {NIVEL1_TERMINOS.map((t) => {
              const droppedIndex = respuestas[t.key];
              const droppedText =
                droppedIndex !== null ? barajaDefs[droppedIndex] : null;

              let slotStyle = { ...ESTILOS.dropSlot };
              let pillStyle = { ...ESTILOS.tagPill };
              if (calificado && droppedIndex !== null) {
                const ok = correctMap[t.key] === droppedIndex;
                slotStyle = { ...slotStyle, ...(ok ? ESTILOS.correct : ESTILOS.wrong) };
                pillStyle = { ...pillStyle, ...(ok ? ESTILOS.correct : ESTILOS.wrong) };
              }

              return (
                <div key={t.key} style={ESTILOS.termBox}>
                  <div style={ESTILOS.termTitle}>{t.term}</div>
                  <div
                    style={slotStyle}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, t.key)}
                  >
                    {droppedText ? (
                      <span style={pillStyle}>{droppedText}</span>
                    ) : (
                      <span style={{ opacity: 0.5 }}>Suelta aquí la definición</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={ESTILOS.headingSmall}>Banco de definiciones</div>
          <div style={ESTILOS.defBank}>
            {barajaDefs.map((text, idx) => {
              const alreadyUsed = bancoDefsUsadas.has(idx);
              return (
                <div
                  key={idx}
                  draggable={!alreadyUsed}
                  onDragStart={(e) => onDragStart(e, idx)}
                  style={{
                    ...ESTILOS.chip,
                    opacity: alreadyUsed ? 0.45 : 1,
                    cursor: alreadyUsed ? "not-allowed" : "grab",
                  }}
                  title={alreadyUsed ? "Ya usada" : "Arrastra esta definición"}
                >
                  {text}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Nivel2Risk({ escenarios, tablero, setTablero, calificado }) {
  // tablero: { [escId]: { dano: string[], capacidad: string[], necesidad: string[], banco: string[] } }
  const onDragStart = (e, escId, itemId) => {
    e.dataTransfer.setData("text/item", JSON.stringify({ escId, itemId }));
  };
  const onDrop = (e, escId, destino) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/item");
    if (!data) return;
    const { escId: fromEsc, itemId } = JSON.parse(data);
    if (fromEsc !== escId) return; // no permitir mover entre escenarios

    setTablero((prev) => {
      const copia = { ...prev };
      const colNames = ["banco", "dano", "capacidad", "necesidad"];
      // quitar el item de donde esté
      for (const col of colNames) {
        copia[escId][col] = copia[escId][col].filter((id) => id !== itemId);
      }
      // agregar a destino
      copia[escId][destino].push(itemId);
      return copia;
    });
  };
  const onDragOver = (e) => e.preventDefault();

  // Mapa rápido para texto y solución correcta
  const itemTexto = {};
  const itemCorrecta = {};
  escenarios.forEach((esc) => {
    esc.items.forEach((it) => {
      itemTexto[it.id] = it.text;
      itemCorrecta[it.id] = it.clas; // dano | capacidad | necesidad
    });
  });

  const renderCol = (escId, titulo, colKey, correctMapForEsc) => {
    const lista = tablero[escId][colKey];
    const estiloSlot = { ...ESTILOS.slotArea };
    return (
      <div>
        <div style={ESTILOS.colTitle}>{titulo}</div>
        <div
          style={estiloSlot}
          onDrop={(e) => onDrop(e, escId, colKey)}
          onDragOver={onDragOver}
        >
          {lista.length === 0 && (
            <div style={{ opacity: 0.5, fontSize: 13 }}>Suelta aquí</div>
          )}
          {lista.map((itemId) => {
            const base = { ...ESTILOS.tagPill, display: "block", margin: "4px 0" };
            let style = base;
            if (calificado) {
              const ok = itemCorrecta[itemId] === colKey;
              style = { ...style, ...(ok ? ESTILOS.correct : ESTILOS.wrong) };
            }
            return (
              <div
                key={itemId}
                draggable
                onDragStart={(e) => onDragStart(e, escId, itemId)}
                style={style}
              >
                {itemTexto[itemId]}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={ESTILOS.card}>
      {escenarios.map((esc) => (
        <div key={esc.id} style={{ marginBottom: 16 }}>
          <div style={ESTILOS.scenarioWrap}>
            <div style={ESTILOS.scenarioCard}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>{esc.titulo}</div>
              <div style={{ fontSize: 14, lineHeight: 1.4 }}>{esc.descripcion}</div>
              <div style={{ ...ESTILOS.divider }} />
              <div style={ESTILOS.headingSmall}>Banco de ítems</div>
              <div style={{ ...ESTILOS.slotArea, minHeight: 90 }}>
                {tablero[esc.id].banco.length === 0 && (
                  <div style={{ opacity: 0.5, fontSize: 13 }}>Sin ítems</div>
                )}
                {tablero[esc.id].banco.map((itemId) => (
                  <div
                    key={itemId}
                    draggable
                    onDragStart={(e) => onDragStart(e, esc.id, itemId)}
                    style={{ ...ESTILOS.tagPill, display: "inline-block", margin: 4 }}
                  >
                    {itemTexto[itemId]}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...ESTILOS.columns3 }}>
              {renderCol(esc.id, "Daño", "dano")}
              {renderCol(esc.id, "Capacidad", "capacidad")}
              {renderCol(esc.id, "Necesidad", "necesidad")}
            </div>
          </div>
          <div style={ESTILOS.divider} />
        </div>
      ))}
    </div>
  );
}

export default function ActividadesID() {
  // -------- NIVEL 1 (MATCH) --------
  const defs = useMemo(() => NIVEL1_TERMINOS.map((t) => t.def), []);
  const defsBarajadas = useMemo(() => shuffle(defs), [defs]);
  // mapa término -> índice correcto en defsBarajadas
  const correctMapNivel1 = useMemo(() => {
    const map = {};
    NIVEL1_TERMINOS.forEach((t) => {
      const idx = defsBarajadas.indexOf(t.def);
      map[t.key] = idx;
    });
    return map;
  }, [defsBarajadas]);

  const [respuestasNivel1, setRespuestasNivel1] = useState(
    NIVEL1_TERMINOS.reduce((acc, t) => ({ ...acc, [t.key]: null }), {})
  );
  const [calificado1, setCalificado1] = useState(false);
  const puntajeNivel1 = useMemo(() => {
    let ok = 0;
    NIVEL1_TERMINOS.forEach((t) => {
      if (respuestasNivel1[t.key] === correctMapNivel1[t.key]) ok++;
    });
    return ok;
  }, [respuestasNivel1, correctMapNivel1]);

  // -------- NIVEL 2 (RISK) --------
  // construir tablero inicial por escenario
  const tableroInicial = useMemo(() => {
    const obj = {};
    NIVEL2_ESCENARIOS.forEach((esc) => {
      obj[esc.id] = {
        banco: esc.items.map((i) => i.id),
        dano: [],
        capacidad: [],
        necesidad: [],
      };
    });
    return obj;
  }, []);
  const [tablero, setTablero] = useState(tableroInicial);
  const [calificado2, setCalificado2] = useState(false);

  // Cálculo de puntaje nivel 2
  const mapaCorrecto = useMemo(() => {
    const m = {};
    NIVEL2_ESCENARIOS.forEach((esc) => {
      esc.items.forEach((i) => (m[i.id] = i.clas));
    });
    return m;
  }, []);

  const puntajeNivel2 = useMemo(() => {
    let total = 0;
    NIVEL2_ESCENARIOS.forEach((esc) => {
      ["dano", "capacidad", "necesidad"].forEach((col) => {
        tablero[esc.id][col].forEach((itemId) => {
          if (mapaCorrecto[itemId] === col) total++;
        });
      });
    });
    return total;
  }, [tablero, mapaCorrecto]);

  const totalItemsNivel2 = useMemo(
    () => NIVEL2_ESCENARIOS.reduce((s, esc) => s + esc.items.length, 0),
    []
  );

  // -------- ACCIONES --------
  const calificarTodo = () => {
    setCalificado1(true);
    setCalificado2(true);
  };
  const reiniciar = () => {
    setRespuestasNivel1(
      NIVEL1_TERMINOS.reduce((acc, t) => ({ ...acc, [t.key]: null }), {})
    );
    setCalificado1(false);
    setTablero(tableroInicial);
    setCalificado2(false);
  };

  // -------- RENDER --------
  return (
    <div style={ESTILOS.wrap}>
      <h1 style={ESTILOS.h1}>Actividad didáctica EDAN</h1>
      <p style={ESTILOS.p}>
        <strong>Nivel 1 – Match:</strong> arrastra cada <em>definición</em> al{" "}
        <em>término</em> correcto. <br />
        <strong>Nivel 2 – Risk:</strong> clasifica elementos en{" "}
        <em>Daño</em>, <em>Capacidad</em> o <em>Necesidad</em> para cada
        micro-escenario (simulación 24–72 h).
      </p>

      <div style={ESTILOS.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button style={{ ...ESTILOS.btn, ...ESTILOS.btnPrimary }} onClick={calificarTodo}>
            Calificar
          </button>
          <button style={ESTILOS.btn} onClick={reiniciar}>Reiniciar</button>
          <div style={{ marginLeft: "auto", fontWeight: 700 }}>
            Puntaje total:{" "}
            {puntajeNivel1 + puntajeNivel2} / {NIVEL1_TERMINOS.length + totalItemsNivel2}
          </div>
        </div>
      </div>

      {/* NIVEL 1 */}
      <h2 style={{ ...ESTILOS.h1, fontSize: 18, marginTop: 8 }}>Nivel 1 — Emparejar Términos</h2>
      <Nivel1Match
        barajaDefs={defsBarajadas}
        respuestas={respuestasNivel1}
        setRespuestas={setRespuestasNivel1}
        calificado={calificado1}
        correctMap={correctMapNivel1}
      />

      {/* NIVEL 2 */}
      <h2 style={{ ...ESTILOS.h1, fontSize: 18, marginTop: 8 }}>Nivel 2 — Clasificar Daño / Capacidad / Necesidad</h2>
      <Nivel2Risk
        escenarios={NIVEL2_ESCENARIOS}
        tablero={tablero}
        setTablero={setTablero}
        calificado={calificado2}
      />

      <div style={{ ...ESTILOS.card, background: "#fffbff" }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Sugerencia didáctica</div>
        <div style={{ fontSize: 14, lineHeight: 1.5 }}>
          Tras calificar, invita a reflexionar: <em>“¿Qué variables te faltaron para
          priorizar mejor?”</em>, <em>“¿Qué capacidad puedes potenciar para reducir la
          necesidad?”</em>. Conecta la lógica <strong>daños ↔ capacidades → necesidades</strong> con
          la elaboración de un <em>Informe EDAN</em>.
        </div>
      </div>
    </div>
  );
}
