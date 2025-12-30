import React, { useMemo, useState, useEffect } from "react";
import { Box, Tabs, Tab, Card, CardContent, Typography, Button, TextField, Chip, Divider, Grid, IconButton, LinearProgress } from "@mui/material";
import { FiRefreshCw, FiCheckCircle, FiXCircle } from "react-icons/fi";

/**
 * ACTIVIDADES DIDÁCTICAS – React + MUI
 * - Sopa de Letras
 * - Crucigrama (autogenerado desde entries, sin plantilla frágil)
 * - Conectar (emparejar conceptos-definiciones)
 * - Rellenar la palabra (fill in the blanks)
 *
 * Paleta (según indicación):
 * Fondo base: blanco (#ffffff)
 * Toques del fondo: #fff8ff
 * Detalles del fondo: #e6dfef
 * Detalles y contrastes: #ff3333
 */

const COLOR_BASE = "#ffffff";      // fondo blanco
const COLOR_TOUCH = "#fff8ff";     // toques del fondo
const COLOR_DETAIL = "#e6dfef";    // detalles/bordes
const COLOR_CONTRAST = "#ff3333";  // contrastes y acentos

export default function ActividadesPA() {
  const [tab, setTab] = useState(0);
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, background: COLOR_TOUCH, minHeight: "100vh" }}>
      <Card sx={{ borderRadius: 3, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", border: `1px solid ${COLOR_DETAIL}` }}>
        <CardContent>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 1, color: COLOR_CONTRAST }}>
            Actividades Didácticas · Primeros Auxilios
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Emparejar conceptos y completar oraciones.
          </Typography>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
            ".MuiTabs-indicator": { backgroundColor: COLOR_CONTRAST },
            ".MuiTab-root": { textTransform: "none", fontWeight: 700 },
            ".Mui-selected": { color: COLOR_CONTRAST + " !important" },
          }}>
            <Tab label="Conectar" />
            <Tab label="Rellenar" />
          </Tabs>

          <Divider sx={{ my: 2 }} />

          {tab === 0 && <MatchPairs />}
          {tab === 1 && <FillInTheBlanks />}
        </CardContent>
      </Card>
    </Box>
  );
}

/****************************
 * 1) SOPA DE LETRAS
 ****************************/
const WORDS = [
  "INTOXICACION", "DESFIBRILADOR", "REANIMACION", "OBSTRUCCION", "HEMORRAGIA", "EMERGENCIA", "QUEMADURA",
  "SEGURIDAD", "SITUACION", "VIAAEREA", "URGENCIA", "HERIDAS", "ESCENA", "SANGRE", "VENDA"
];

function randomLetter() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // unificamos Ñ->N
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}

function placeWord(grid, word) {
  const size = grid.length;
  const dirs = [
    [0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]
  ];
  for (let attempt = 0; attempt < 300; attempt++) {
    const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
    const r0 = Math.floor(Math.random() * size);
    const c0 = Math.floor(Math.random() * size);
    let r = r0, c = c0;
    let ok = true;
    for (let i = 0; i < word.length; i++) {
      if (r < 0 || c < 0 || r >= size || c >= size) { ok = false; break; }
      const cell = grid[r][c];
      if (cell !== "" && cell !== word[i]) { ok = false; break; }
      r += dr; c += dc;
    }
    if (!ok) continue;
    // place
    r = r0; c = c0;
    for (let i = 0; i < word.length; i++) { grid[r][c] = word[i]; r += dr; c += dc; }
    return true;
  }
  return false;
}

function buildGrid(size, words) {
  const grid = Array.from({ length: size }, () => Array(size).fill(""));
  const sorted = [...words].sort((a, b) => b.length - a.length);
  sorted.forEach(w => placeWord(grid, w));
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!grid[r][c]) grid[r][c] = randomLetter();
  return grid;
}

function WordSearch() {
  const size = 14;
  const [grid, setGrid] = useState(() => buildGrid(size, WORDS));
  const [found, setFound] = useState([]);
  const [selStart, setSelStart] = useState(null);
  const [selEnd, setSelEnd] = useState(null);

  const reset = () => { setGrid(buildGrid(size, WORDS)); setFound([]); setSelStart(null); setSelEnd(null); };

  const handleCellClick = (r, c) => {
    if (!selStart) { setSelStart({ r, c }); setSelEnd(null); return; }
    if (!selEnd) {
      const end = { r, c };
      setSelEnd(end);
      const word = extractWord(grid, selStart, end);
      const rev = word.split("").reverse().join("");
      const match = WORDS.find(w => w === word || w === rev);
      if (match && !found.includes(match)) setFound(prev => [...prev, match]);
      setSelStart(null); setSelEnd(null);
    }
  };

  const progress = (found.length / WORDS.length) * 100;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={800}>Encuentra las palabras</Typography>
        <IconButton onClick={reset}><FiRefreshCw /></IconButton>
      </Box>
      <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />

      <Grid container spacing={1} justifyContent="center" sx={{ userSelect: "none" }}>
        {grid.map((row, r) => (
          <Grid item xs={12} key={r} sx={{ display: "flex", justifyContent: "center" }}>
            {row.map((ch, c) => (
              <Box key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                sx={{
                  width: 34, height: 34, display: "grid", placeItems: "center",
                  border: `1px solid ${COLOR_DETAIL}`, cursor: "pointer",
                  background: COLOR_BASE, fontWeight: 800, letterSpacing: 1,
                  '&:hover': { background: COLOR_TOUCH }
                }}>
                {ch}
              </Box>
            ))}
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {WORDS.map(w => (
          <Chip key={w} label={w}
            icon={found.includes(w) ? <FiCheckCircle /> : undefined}
            sx={{
              borderRadius: 2,
              border: `1px solid ${COLOR_DETAIL}`,
              background: found.includes(w) ? COLOR_CONTRAST : COLOR_BASE,
              color: found.includes(w) ? "#fff" : "#333",
              fontWeight: 700
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

function extractWord(grid, a, b) {
  if (!a || !b) return "";
  const dr = Math.sign(b.r - a.r);
  const dc = Math.sign(b.c - a.c);
  // línea recta (horizontal, vertical o diagonal 45°)
  if ((dr === 0 && dc === 0) || (dr !== 0 && dc !== 0 && Math.abs(b.r - a.r) !== Math.abs(b.c - a.c)) ) return "";
  const len = Math.max(Math.abs(b.r - a.r), Math.abs(b.c - a.c)) + 1;
  let r = a.r, c = a.c, out = "";
  for (let i = 0; i < len; i++) { out += grid[r][c]; r += dr; c += dc; }
  return out;
}

/****************************
 * 2) CRUCIGRAMA (autogenerado desde entries)
 ****************************/
const CROSS_ENTRIES = [
  { num: 1, dir: 'across', row: 1, col: 1, answer: 'ANALGESIA', clue: 'Alivio del dolor sin pérdida de conciencia.' },
  { num: 6, dir: 'across', row: 3, col: 0, answer: 'FRACTURA', clue: 'Rotura parcial o total de un hueso.' },
  { num: 8, dir: 'across', row: 5, col: 2, answer: 'ASFIXIA', clue: 'Falta de oxígeno por obstrucción de la vía aérea.' },
  { num: 9, dir: 'across', row: 7, col: 1, answer: 'CONTUSION', clue: 'Lesión por golpe sin ruptura de la piel.' },

  { num: 2, dir: 'down', row: 0, col: 5, answer: 'HEMORRAGIA', clue: 'Pérdida de sangre por ruptura de vasos.' },
  { num: 3, dir: 'down', row: 0, col: 8, answer: 'HIPOTERMIA', clue: 'Disminución peligrosa de la temperatura corporal.' },
  { num: 4, dir: 'down', row: 0, col: 1, answer: 'ANALGESIA', clue: 'Alivio del dolor sin pérdida de conciencia.' },
  { num: 5, dir: 'down', row: 0, col: 6, answer: 'VENDAJE', clue: 'Técnica para proteger una herida o inmovilizar.' },
  { num: 7, dir: 'down', row: 0, col: 7, answer: 'TORNIQUETE', clue: 'Dispositivo para detener temporalmente una hemorragia.' },
  { num: 10, dir: 'down', row: 0, col: 4, answer: 'SHOCK', clue: 'Estado crítico por falta de riego sanguíneo.' },
  { num: 11, dir: 'down', row: 0, col: 3, answer: 'RCP', clue: 'Maniobra para restablecer circulación y respiración.' },
];

function buildCrossGrid(entries) {
  let maxR = 0, maxC = 0;
  for (const e of entries) {
    const len = e.answer.length;
    const endR = e.dir === 'across' ? e.row : e.row + len - 1;
    const endC = e.dir === 'across' ? e.col + len - 1 : e.col;
    maxR = Math.max(maxR, endR);
    maxC = Math.max(maxC, endC);
  }
  const rows = Math.max(10, maxR + 2);
  const cols = Math.max(10, maxC + 2);
  const grid = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => ({ r, c, ch: '', used: false, num: 0 })));

  for (const e of entries) {
    let r = e.row, c = e.col;
    for (let i = 0; i < e.answer.length; i++) {
      const cell = grid[r][c];
      if (cell.ch && cell.ch !== e.answer[i]) {
        // conflicto de cruce (no esperado con estas entries)
      }
      cell.ch = cell.ch || e.answer[i];
      cell.used = true;
      if (e.dir === 'across') c++; else r++;
    }
  }

  for (const e of entries) {
    grid[e.row][e.col].num = e.num;
  }

  return grid.map(row => row.map(cell => ({ ...cell, block: !cell.used })));
}

function Crossword() {
  const [cells, setCells] = useState(() => buildCrossGrid(CROSS_ENTRIES));
  const [complete, setComplete] = useState(false);

  useEffect(() => { setComplete(validateCross(cells)); }, [cells]);

  const handleChange = (r, c, v) => {
    setCells(prev => prev.map((row, ri) => row.map((cell, ci) => {
      if (ri === r && ci === c) return { ...cell, ch: (v || '').toUpperCase().slice(0,1) };
      return cell;
    })));
  };

  const reset = () => setCells(buildCrossGrid(CROSS_ENTRIES));

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={800}>Completa el crucigrama</Typography>
        <IconButton onClick={reset}><FiRefreshCw/></IconButton>
        {complete ? <Chip color="success" icon={<FiCheckCircle/>} label="¡Completado!"/> : null}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${cells[0].length}, 36px)`, gap: 0.5, justifyContent: 'center' }}>
        {cells.flat().map((cell, idx) => (
          <Box key={idx} sx={{ position: 'relative' }}>
            {cell.num ? (
              <Typography variant="caption" sx={{ position: 'absolute', top: 2, left: 4, opacity: 0.6, fontWeight: 700 }}>{cell.num}</Typography>
            ) : null}
            {cell.block ? (
              <Box sx={{ width: 36, height: 36, background: COLOR_DETAIL }} />
            ) : (
              <TextField value={cell.ch} onChange={(e)=>handleChange(cell.r, cell.c, e.target.value)}
                inputProps={{ style: { textAlign: 'center', fontWeight: 800, letterSpacing: 2 } }}
                sx={{ width: 36, '& input': { p: 0.5 }, '& fieldset': { borderColor: COLOR_DETAIL } }}
              />
            )}
          </Box>
        ))}
      </Box>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Typography fontWeight={800} sx={{ mb: 1, color: COLOR_CONTRAST }}>Horizontal</Typography>
          {CROSS_ENTRIES.filter(e=>e.dir==='across').map(e => (
            <Typography key={e.num} sx={{ mb: 0.5 }}><b>{e.num}.</b> {e.clue}</Typography>
          ))}
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography fontWeight={800} sx={{ mb: 1, color: COLOR_CONTRAST }}>Vertical</Typography>
          {CROSS_ENTRIES.filter(e=>e.dir==='down').map(e => (
            <Typography key={e.num} sx={{ mb: 0.5 }}><b>{e.num}.</b> {e.clue}</Typography>
          ))}
        </Grid>
      </Grid>
    </Box>
  );
}

function validateCross(cells) {
  for (const e of CROSS_ENTRIES) {
    let r = e.row, c = e.col;
    for (let i=0;i<e.answer.length;i++){
      const cell = cells[r]?.[c];
      if (!cell || cell.block) return false;
      if ((cell.ch || '').toUpperCase() !== e.answer[i]) return false;
      if (e.dir==='across') c++; else r++;
    }
  }
  return true;
}
// Lista izquierda con la respuesta correcta asociada
const MATCH_LEFT = [
  { key: "1", term: "RCP", answer: "a" },
  { key: "2", term: "Hemorragia", answer: "b" },
  { key: "3", term: "Fractura", answer: "c" },
  { key: "4", term: "Torniquete", answer: "d" },
  { key: "5", term: "Hipotermia", answer: "e" },
  { key: "6", term: "Vendaje", answer: "f" },
  { key: "7", term: "Shock", answer: "g" },
  { key: "8", term: "Asfixia", answer: "h" },
  { key: "9", term: "Contusión", answer: "i" },
  { key: "10", term: "Analgesia", answer: "j" },
];

const MATCH_RIGHT = [
  { id: "a", text: "Maniobra para restablecer respiración y circulación." },
  { id: "b", text: "Pérdida de sangre por ruptura de vasos sanguíneos." },
  { id: "c", text: "Rotura parcial o total de un hueso." },
  { id: "d", text: "Banda/dispositivo para detener temporalmente una hemorragia." },
  { id: "e", text: "Disminución peligrosa de la temperatura corporal." },
  { id: "f", text: "Técnica para cubrir/proteger herida o inmovilizar." },
  { id: "g", text: "Estado crítico por insuficiente perfusión a órganos vitales." },
  { id: "h", text: "Falta de oxígeno por obstrucción de la vía aérea." },
  { id: "i", text: "Lesión por golpe sin ruptura de la piel." },
  { id: "j", text: "Alivio del dolor sin pérdida de conciencia." },
];

// ——— REEMPLAZA desde aquí ——–
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// OJO: MatchPairs SIN "export default"
function MatchPairs() {
  const [left, setLeft] = useState(() => shuffle(MATCH_LEFT));
  const [right, setRight] = useState(() => shuffle(MATCH_RIGHT));
  const [links, setLinks] = useState({});
  const [result, setResult] = useState(null);

  const handlePick = (leftKey, rightId) =>
    setLinks((prev) => ({ ...prev, [leftKey]: rightId }));

  const check = () => {
    const ok = left.every((l) => links[l.key] === l.answer);
    setResult(ok);
  };

  const reset = () => {
    setLeft(shuffle(MATCH_LEFT));
    setRight(shuffle(MATCH_RIGHT));
    setLinks({});
    setResult(null);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          Conecta cada concepto con su definición
        </Typography>
        <IconButton onClick={reset} aria-label="Reiniciar conectar">
          <FiRefreshCw />
        </IconButton>
        {result !== null &&
          (result ? (
            <Chip
              sx={{ background: COLOR_CONTRAST, color: "#fff" }}
              icon={<FiCheckCircle />}
              label="¡Correcto!"
            />
          ) : (
            <Chip color="error" icon={<FiXCircle />} label="Hay errores" />
          ))}
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: COLOR_DETAIL }}>
            <CardContent>
              {left.map((l) => (
                <Box
                  key={l.key}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                    p: 1,
                    border: `1px dashed ${COLOR_DETAIL}`,
                    borderRadius: 2,
                    background: COLOR_BASE,
                  }}
                >
                  <Typography fontWeight={800}>
                    {l.key}) {l.term}
                  </Typography>
                  <SelectRight
                    right={right}
                    current={links[l.key]}
                    onPick={(id) => handlePick(l.key, id)}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderColor: COLOR_DETAIL }}>
            <CardContent>
              {right.map((r) => (
                <Box
                  key={r.id}
                  sx={{
                    p: 1,
                    mb: 1,
                    borderRadius: 2,
                    border: `1px solid ${COLOR_DETAIL}`,
                    background: COLOR_BASE,
                  }}
                >
                  <Typography>
                    <b>({r.id})</b> {r.text}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        <Button
          variant="contained"
          onClick={check}
          sx={{ background: COLOR_CONTRAST, "&:hover": { background: "#e02a2a" } }}
        >
          Revisar
        </Button>
        <Button
          variant="outlined"
          onClick={reset}
          sx={{ borderColor: COLOR_DETAIL }}
        >
          Reiniciar
        </Button>
      </Box>
    </Box>
  );
}

function SelectRight({ right, current, onPick }) {
  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
      {right.map((r) => (
        <Chip
          key={r.id}
          label={r.id}
          onClick={() => onPick(r.id)}
          sx={{
            borderRadius: 2,
            border: `1px solid ${COLOR_DETAIL}`,
            background: current === r.id ? COLOR_CONTRAST : COLOR_BASE,
            color: current === r.id ? "#fff" : "#333",
            fontWeight: 800,
            cursor: "pointer",
          }}
        />
      ))}
    </Box>
  );
}

/****************************
 * 4) RELLENAR LA PALABRA
 ****************************/
const FILL_ITEMS = [
  { q: 'La __________ es una maniobra utilizada para liberar la vía aérea en casos de atragantamiento.', a: 'DESOBSTRUCCIONDELAVIAAEREA' },
  { q: 'La __________ en primeros auxilios es fundamental para responder correctamente ante una emergencia.', a: 'CAPACITACION' },
  { q: 'En caso de quemadura, se debe enfriar la zona con ______ durante al menos 10 minutos.', a: 'AGUA' },
  { q: 'El botiquín debe incluir gasas, vendas, tijeras y __________.', a: 'GUANTES' },
  { q: 'La __________ de la escena es una evaluación rápida para identificar riesgos.', a: 'EVALUACIONDELAESCENA' },
  { q: 'La posición de __________ se usa para evitar que se ahoguen personas inconscientes que respiran.', a: 'RECUPERACION' },
  { q: 'El número de emergencias en México es __________.', a: '911' },
  { q: 'En una hemorragia externa, se debe aplicar __________ directa sobre la herida.', a: 'PRESION' },
  { q: 'La __________ es la pérdida de calor corporal por exposición a bajas temperaturas.', a: 'HIPOTERMIA' },
  { q: 'Para prevenir infecciones, es importante utilizar __________ antes de atender una herida.', a: 'GUANTES' },
];

function normalizeAnswer(str){
  return (str||'')
    .toString()
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,'');
}

function FillInTheBlanks(){
  const [values, setValues] = useState(FILL_ITEMS.map(()=>""));
  const [checked, setChecked] = useState(false);

  const correctCount = useMemo(()=> values.reduce((acc,v,i)=> acc + (normalizeAnswer(v)===FILL_ITEMS[i].a ? 1:0), 0), [values]);

  const check = ()=> setChecked(true);
  const reset = ()=> { setValues(FILL_ITEMS.map(()=>"")); setChecked(false); };

  return (
    <Box>
      <Box sx={{ display:'flex', alignItems:'center', gap:2, mb:2 }}>
        <Typography variant="h6" fontWeight={800}>Completa las oraciones</Typography>
        <IconButton onClick={reset}><FiRefreshCw/></IconButton>
      </Box>
      <LinearProgress variant="determinate" value={(correctCount/FILL_ITEMS.length)*100} sx={{ mb:2 }}/>

      {FILL_ITEMS.map((item, idx) => {
        const isCorrect = normalizeAnswer(values[idx]) === item.a;
        return (
          <Card key={idx} variant="outlined" sx={{ mb:1, borderRadius:2, borderColor: checked ? (isCorrect ? 'success.main' : COLOR_CONTRAST) : COLOR_DETAIL }}>
            <CardContent>
              <Typography sx={{ mb:1 }}>{idx+1}. {item.q}</Typography>
              <TextField fullWidth placeholder="Tu respuesta"
                value={values[idx]}
                onChange={(e)=>{
                  const v = [...values]; v[idx] = e.target.value; setValues(v);
                }}
                sx={{ '& fieldset': { borderColor: COLOR_DETAIL }, background: COLOR_BASE }}
              />
              {checked && (
                <Typography sx={{ mt:1 }} color={isCorrect ? 'success.main' : COLOR_CONTRAST}>
                  {isCorrect ? '¡Correcto!' : `Respuesta esperada (también acepta tildes y espacios): ${item.a}`}
                </Typography>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Box sx={{ display:'flex', gap:1, mt:1 }}>
        <Button variant="contained" onClick={check} sx={{ background: COLOR_CONTRAST, '&:hover': { background: '#e62d2d' } }}>Revisar</Button>
        <Button variant="outlined" onClick={reset} sx={{ borderColor: COLOR_DETAIL, color: 'inherit' }}>Reiniciar</Button>
      </Box>
    </Box>
  );
}
