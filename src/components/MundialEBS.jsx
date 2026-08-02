import React, { useState, useMemo } from "react";

// ── CUOTAS ────────────────────────────────────────────────────
const ODDS = {
  "🇲🇽 México":       {bet365:1.80,bwin:1.75,codere:1.82,betway:1.78},
  "🇿🇦 Sudáfrica":    {bet365:5.50,bwin:5.20,codere:5.60,betway:5.40},
  "🇰🇷 Corea del Sur":{bet365:2.60,bwin:2.55,codere:2.65,betway:2.58},
  "🇨🇿 Rep. Checa":   {bet365:2.90,bwin:2.85,codere:2.95,betway:2.88},
  "🇨🇦 Canadá":       {bet365:2.20,bwin:2.15,codere:2.25,betway:2.18},
  "🇧🇦 Bosnia":       {bet365:3.10,bwin:3.05,codere:3.15,betway:3.08},
  "🇶🇦 Qatar":        {bet365:9.00,bwin:8.50,codere:9.20,betway:8.80},
  "🇨🇭 Suiza":        {bet365:1.55,bwin:1.52,codere:1.58,betway:1.54},
  "🇧🇷 Brasil":       {bet365:1.40,bwin:1.38,codere:1.42,betway:1.39},
  "🇲🇦 Marruecos":    {bet365:2.30,bwin:2.25,codere:2.35,betway:2.28},
  "🇭🇹 Haití":        {bet365:18.0,bwin:17.0,codere:18.5,betway:17.5},
  "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia":    {bet365:3.40,bwin:3.30,codere:3.45,betway:3.35},
  "🇺🇸 EE.UU.":       {bet365:2.00,bwin:1.95,codere:2.05,betway:1.98},
  "🇵🇾 Paraguay":     {bet365:3.60,bwin:3.50,codere:3.65,betway:3.55},
  "🇦🇺 Australia":    {bet365:3.80,bwin:3.70,codere:3.85,betway:3.75},
  "🇹🇷 Turquía":      {bet365:2.45,bwin:2.40,codere:2.50,betway:2.42},
  "🇩🇪 Alemania":     {bet365:1.22,bwin:1.20,codere:1.24,betway:1.21},
  "🇨🇼 Curazao":      {bet365:22.0,bwin:20.0,codere:23.0,betway:21.0},
  "🇨🇮 Costa de Marfil":{bet365:2.80,bwin:2.75,codere:2.85,betway:2.78},
  "🇪🇨 Ecuador":      {bet365:2.10,bwin:2.05,codere:2.15,betway:2.08},
  "🇳🇱 Países Bajos": {bet365:1.50,bwin:1.48,codere:1.52,betway:1.49},
  "🇯🇵 Japón":        {bet365:2.50,bwin:2.45,codere:2.55,betway:2.48},
  "🇸🇪 Suecia":       {bet365:2.20,bwin:2.15,codere:2.25,betway:2.18},
  "🇹🇳 Túnez":        {bet365:5.00,bwin:4.80,codere:5.10,betway:4.90},
  "🇧🇪 Bélgica":      {bet365:1.35,bwin:1.33,codere:1.37,betway:1.34},
  "🇪🇬 Egipto":       {bet365:3.20,bwin:3.10,codere:3.25,betway:3.15},
  "🇮🇷 Irán":         {bet365:4.00,bwin:3.90,codere:4.10,betway:3.95},
  "🇳🇿 Nueva Zelanda":{bet365:7.50,bwin:7.20,codere:7.70,betway:7.40},
  "🇪🇸 España":       {bet365:1.28,bwin:1.26,codere:1.30,betway:1.27},
  "🇨🇻 Cabo Verde":   {bet365:12.0,bwin:11.5,codere:12.5,betway:11.8},
  "🇸🇦 Arabia Saudita":{bet365:4.50,bwin:4.30,codere:4.60,betway:4.40},
  "🇺🇾 Uruguay":      {bet365:1.72,bwin:1.70,codere:1.75,betway:1.71},
  "🇫🇷 Francia":      {bet365:1.30,bwin:1.28,codere:1.32,betway:1.29},
  "🇸🇳 Senegal":      {bet365:2.60,bwin:2.55,codere:2.65,betway:2.58},
  "🇮🇶 Irak":         {bet365:8.00,bwin:7.80,codere:8.20,betway:7.90},
  "🇳🇴 Noruega":      {bet365:2.00,bwin:1.95,codere:2.05,betway:1.98},
  "🇦🇷 Argentina":    {bet365:1.25,bwin:1.23,codere:1.27,betway:1.24},
  "🇩🇿 Argelia":      {bet365:3.00,bwin:2.95,codere:3.05,betway:2.98},
  "🇦🇹 Austria":      {bet365:2.10,bwin:2.05,codere:2.15,betway:2.08},
  "🇯🇴 Jordania":     {bet365:14.0,bwin:13.5,codere:14.5,betway:13.8},
  "🇵🇹 Portugal":     {bet365:1.32,bwin:1.30,codere:1.34,betway:1.31},
  "🇨🇩 RD Congo":     {bet365:6.50,bwin:6.20,codere:6.70,betway:6.40},
  "🇺🇿 Uzbekistán":   {bet365:7.00,bwin:6.80,codere:7.20,betway:6.90},
  "🇨🇴 Colombia":     {bet365:1.85,bwin:1.82,codere:1.88,betway:1.84},
  "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra": {bet365:1.45,bwin:1.43,codere:1.47,betway:1.44},
  "🇭🇷 Croacia":      {bet365:2.30,bwin:2.25,codere:2.35,betway:2.28},
  "🇬🇭 Ghana":        {bet365:3.00,bwin:2.90,codere:3.05,betway:2.95},
  "🇵🇦 Panamá":       {bet365:5.50,bwin:5.30,codere:5.60,betway:5.40},
};

// ── ÚLTIMOS 5 PARTIDOS ────────────────────────────────────────
const FORM = {
  "🇲🇽 México":       [{r:"G",s:"2-0",vs:"Venezuela"},{r:"G",s:"1-0",vs:"Honduras"},{r:"G",s:"3-1",vs:"Jamaica"},{r:"E",s:"1-1",vs:"Uruguay"},{r:"G",s:"2-1",vs:"Perú"}],
  "🇿🇦 Sudáfrica":    [{r:"G",s:"1-0",vs:"Zimbabwe"},{r:"E",s:"0-0",vs:"Senegal"},{r:"P",s:"0-2",vs:"Marruecos"},{r:"G",s:"2-1",vs:"Mozambique"},{r:"P",s:"0-1",vs:"Nigeria"}],
  "🇰🇷 Corea del Sur":[{r:"G",s:"2-1",vs:"Japón"},{r:"G",s:"3-0",vs:"Tailandia"},{r:"E",s:"1-1",vs:"Australia"},{r:"G",s:"2-0",vs:"China"},{r:"P",s:"0-1",vs:"Arabia S."}],
  "🇨🇿 Rep. Checa":   [{r:"G",s:"3-0",vs:"Moldavia"},{r:"E",s:"1-1",vs:"Ucrania"},{r:"G",s:"2-1",vs:"Albania"},{r:"P",s:"1-2",vs:"Portugal"},{r:"G",s:"2-0",vs:"Kosovo"}],
  "🇨🇦 Canadá":       [{r:"G",s:"2-0",vs:"Honduras"},{r:"G",s:"3-1",vs:"Trinidad"},{r:"E",s:"1-1",vs:"EE.UU."},{r:"G",s:"2-1",vs:"Jamaica"},{r:"G",s:"4-0",vs:"Bermuda"}],
  "🇧🇦 Bosnia":       [{r:"G",s:"2-0",vs:"Kosovo"},{r:"P",s:"1-2",vs:"Turquía"},{r:"G",s:"1-0",vs:"Albania"},{r:"E",s:"2-2",vs:"Rumanía"},{r:"G",s:"3-1",vs:"Macedonia"}],
  "🇶🇦 Qatar":        [{r:"P",s:"0-3",vs:"Japón"},{r:"P",s:"1-3",vs:"Senegal"},{r:"P",s:"0-1",vs:"Ecuador"},{r:"E",s:"1-1",vs:"Omán"},{r:"G",s:"2-0",vs:"Bahréin"}],
  "🇨🇭 Suiza":        [{r:"G",s:"3-0",vs:"Kosovo"},{r:"G",s:"2-0",vs:"Hungría"},{r:"E",s:"1-1",vs:"España"},{r:"G",s:"3-1",vs:"Bielorrusia"},{r:"G",s:"2-0",vs:"Rumanía"}],
  "🇧🇷 Brasil":       [{r:"G",s:"4-1",vs:"Paraguay"},{r:"G",s:"3-0",vs:"Chile"},{r:"G",s:"2-0",vs:"Bolivia"},{r:"E",s:"1-1",vs:"Argentina"},{r:"G",s:"3-1",vs:"Ecuador"}],
  "🇲🇦 Marruecos":    [{r:"G",s:"2-0",vs:"Sudáfrica"},{r:"G",s:"1-0",vs:"Zambia"},{r:"E",s:"1-1",vs:"Senegal"},{r:"G",s:"3-0",vs:"Guinea"},{r:"G",s:"2-1",vs:"Tanzania"}],
  "🇭🇹 Haití":        [{r:"G",s:"1-0",vs:"Anguila"},{r:"P",s:"0-3",vs:"Jamaica"},{r:"E",s:"0-0",vs:"Barbados"},{r:"P",s:"0-2",vs:"Cuba"},{r:"G",s:"2-1",vs:"Bermuda"}],
  "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia":    [{r:"G",s:"2-0",vs:"Irlanda N."},{r:"E",s:"1-1",vs:"Grecia"},{r:"G",s:"3-0",vs:"San Marino"},{r:"P",s:"0-2",vs:"Portugal"},{r:"G",s:"2-1",vs:"Georgia"}],
  "🇺🇸 EE.UU.":       [{r:"G",s:"2-1",vs:"México"},{r:"G",s:"3-0",vs:"Trinidad"},{r:"E",s:"1-1",vs:"Canadá"},{r:"G",s:"2-0",vs:"Guatemala"},{r:"G",s:"4-0",vs:"Cuba"}],
  "🇵🇾 Paraguay":     [{r:"P",s:"0-2",vs:"Brasil"},{r:"G",s:"2-0",vs:"Bolivia"},{r:"E",s:"1-1",vs:"Venezuela"},{r:"G",s:"1-0",vs:"Chile"},{r:"P",s:"0-1",vs:"Argentina"}],
  "🇦🇺 Australia":    [{r:"G",s:"2-0",vs:"Nueva Zelanda"},{r:"E",s:"1-1",vs:"Corea del Sur"},{r:"G",s:"3-1",vs:"Filipinas"},{r:"P",s:"1-2",vs:"Japón"},{r:"G",s:"2-0",vs:"Indonesia"}],
  "🇹🇷 Turquía":      [{r:"G",s:"3-1",vs:"Bosnia"},{r:"G",s:"2-0",vs:"Montenegro"},{r:"E",s:"1-1",vs:"Bélgica"},{r:"G",s:"2-1",vs:"Georgia"},{r:"G",s:"3-0",vs:"Luxemburgo"}],
  "🇩🇪 Alemania":     [{r:"G",s:"5-0",vs:"Eslovaquia"},{r:"G",s:"3-0",vs:"Irlanda"},{r:"G",s:"4-1",vs:"Austria"},{r:"G",s:"2-0",vs:"Hungría"},{r:"E",s:"1-1",vs:"Francia"}],
  "🇨🇼 Curazao":      [{r:"G",s:"2-1",vs:"Surinam"},{r:"E",s:"0-0",vs:"Guatemala"},{r:"P",s:"0-3",vs:"Panamá"},{r:"G",s:"1-0",vs:"Montserrat"},{r:"P",s:"0-2",vs:"Trinidad"}],
  "🇨🇮 Costa de Marfil":[{r:"G",s:"2-0",vs:"Zambia"},{r:"E",s:"1-1",vs:"Senegal"},{r:"G",s:"3-1",vs:"Guinea"},{r:"P",s:"1-2",vs:"Nigeria"},{r:"G",s:"2-0",vs:"Camerún"}],
  "🇪🇨 Ecuador":      [{r:"G",s:"2-1",vs:"Bolivia"},{r:"G",s:"1-0",vs:"Venezuela"},{r:"P",s:"0-1",vs:"Brasil"},{r:"E",s:"1-1",vs:"Chile"},{r:"G",s:"3-0",vs:"Perú"}],
  "🇳🇱 Países Bajos": [{r:"G",s:"3-1",vs:"Alemania"},{r:"G",s:"4-0",vs:"Malta"},{r:"G",s:"2-0",vs:"Hungría"},{r:"E",s:"1-1",vs:"España"},{r:"G",s:"3-0",vs:"Turquía"}],
  "🇯🇵 Japón":        [{r:"G",s:"2-0",vs:"China"},{r:"G",s:"1-0",vs:"Corea del Sur"},{r:"G",s:"3-1",vs:"Tailandia"},{r:"E",s:"0-0",vs:"Australia"},{r:"G",s:"2-1",vs:"Irak"}],
  "🇸🇪 Suecia":       [{r:"G",s:"3-0",vs:"Moldavia"},{r:"G",s:"2-1",vs:"Eslovenia"},{r:"E",s:"1-1",vs:"Noruega"},{r:"G",s:"2-0",vs:"Albania"},{r:"G",s:"3-1",vs:"Kosovo"}],
  "🇹🇳 Túnez":        [{r:"P",s:"0-1",vs:"Senegal"},{r:"E",s:"1-1",vs:"Argelia"},{r:"G",s:"2-0",vs:"Guinea-Bisáu"},{r:"P",s:"1-2",vs:"Marruecos"},{r:"G",s:"1-0",vs:"Mauritania"}],
  "🇧🇪 Bélgica":      [{r:"G",s:"4-1",vs:"Azerbaiyán"},{r:"G",s:"3-0",vs:"Eslovenia"},{r:"E",s:"1-1",vs:"Turquía"},{r:"G",s:"2-0",vs:"Gales"},{r:"G",s:"3-1",vs:"Irlanda"}],
  "🇪🇬 Egipto":       [{r:"G",s:"3-0",vs:"Kenia"},{r:"G",s:"1-0",vs:"Guinea"},{r:"E",s:"1-1",vs:"Nigeria"},{r:"G",s:"2-0",vs:"Etiopía"},{r:"G",s:"2-1",vs:"Mozambique"}],
  "🇮🇷 Irán":         [{r:"G",s:"3-0",vs:"Hong Kong"},{r:"G",s:"2-0",vs:"Turkmenistán"},{r:"E",s:"1-1",vs:"Japón"},{r:"G",s:"4-0",vs:"Mongolia"},{r:"G",s:"2-1",vs:"Camboya"}],
  "🇳🇿 Nueva Zelanda":[{r:"P",s:"0-2",vs:"Australia"},{r:"E",s:"1-1",vs:"Fiji"},{r:"G",s:"3-0",vs:"Samoa"},{r:"P",s:"0-1",vs:"Tahití"},{r:"G",s:"2-0",vs:"Vanuatu"}],
  "🇪🇸 España":       [{r:"G",s:"3-0",vs:"Croacia"},{r:"G",s:"2-1",vs:"Francia"},{r:"G",s:"4-0",vs:"Suiza"},{r:"G",s:"3-1",vs:"Portugal"},{r:"E",s:"1-1",vs:"Alemania"}],
  "🇨🇻 Cabo Verde":   [{r:"G",s:"1-0",vs:"Liberia"},{r:"P",s:"0-2",vs:"Senegal"},{r:"E",s:"1-1",vs:"Guinea-Bisáu"},{r:"G",s:"2-0",vs:"Ruanda"},{r:"P",s:"0-1",vs:"Marruecos"}],
  "🇸🇦 Arabia Saudita":[{r:"P",s:"1-3",vs:"Corea del Sur"},{r:"E",s:"1-1",vs:"Irak"},{r:"G",s:"2-0",vs:"Kirguistán"},{r:"P",s:"0-2",vs:"Japón"},{r:"G",s:"3-1",vs:"Bahréin"}],
  "🇺🇾 Uruguay":      [{r:"G",s:"2-0",vs:"Bolivia"},{r:"G",s:"3-1",vs:"Ecuador"},{r:"E",s:"1-1",vs:"Brasil"},{r:"G",s:"2-1",vs:"Venezuela"},{r:"G",s:"1-0",vs:"Chile"}],
  "🇫🇷 Francia":      [{r:"G",s:"3-0",vs:"Bélgica"},{r:"G",s:"4-1",vs:"Luxemburgo"},{r:"G",s:"2-1",vs:"Portugal"},{r:"E",s:"1-1",vs:"Alemania"},{r:"G",s:"3-0",vs:"Italia"}],
  "🇸🇳 Senegal":      [{r:"G",s:"2-0",vs:"Túnez"},{r:"E",s:"1-1",vs:"Marruecos"},{r:"G",s:"2-1",vs:"Costa de Marfil"},{r:"G",s:"3-0",vs:"Guinea"},{r:"G",s:"1-0",vs:"Camerún"}],
  "🇮🇶 Irak":         [{r:"E",s:"1-1",vs:"Arabia Saudita"},{r:"G",s:"2-0",vs:"Bahréin"},{r:"P",s:"0-2",vs:"Japón"},{r:"G",s:"1-0",vs:"Kirguistán"},{r:"P",s:"0-1",vs:"Irán"}],
  "🇳🇴 Noruega":      [{r:"G",s:"4-0",vs:"Islandia"},{r:"G",s:"3-1",vs:"Letonia"},{r:"E",s:"1-1",vs:"Suecia"},{r:"G",s:"5-0",vs:"San Marino"},{r:"G",s:"2-0",vs:"Eslovenia"}],
  "🇦🇷 Argentina":    [{r:"G",s:"3-0",vs:"Bolivia"},{r:"G",s:"2-1",vs:"Chile"},{r:"E",s:"1-1",vs:"Brasil"},{r:"G",s:"2-0",vs:"Ecuador"},{r:"G",s:"4-1",vs:"Venezuela"}],
  "🇩🇿 Argelia":      [{r:"G",s:"2-0",vs:"Túnez"},{r:"E",s:"1-1",vs:"Marruecos"},{r:"G",s:"3-1",vs:"Libia"},{r:"G",s:"2-0",vs:"Mauritania"},{r:"P",s:"0-1",vs:"Senegal"}],
  "🇦🇹 Austria":      [{r:"G",s:"3-1",vs:"Turquía"},{r:"G",s:"2-0",vs:"Croacia"},{r:"E",s:"1-1",vs:"Francia"},{r:"P",s:"1-4",vs:"Alemania"},{r:"G",s:"2-1",vs:"Rumanía"}],
  "🇯🇴 Jordania":     [{r:"G",s:"2-0",vs:"Palestina"},{r:"P",s:"0-2",vs:"Australia"},{r:"E",s:"1-1",vs:"Irak"},{r:"G",s:"1-0",vs:"Vietnam"},{r:"P",s:"0-3",vs:"Irán"}],
  "🇵🇹 Portugal":     [{r:"G",s:"3-0",vs:"Rep. Checa"},{r:"G",s:"4-1",vs:"Irlanda"},{r:"G",s:"2-0",vs:"Polonia"},{r:"G",s:"3-1",vs:"Croacia"},{r:"E",s:"1-1",vs:"España"}],
  "🇨🇩 RD Congo":     [{r:"G",s:"2-0",vs:"Gabón"},{r:"P",s:"0-1",vs:"Marruecos"},{r:"G",s:"3-1",vs:"Etiopía"},{r:"E",s:"0-0",vs:"Senegal"},{r:"G",s:"1-0",vs:"Nigeria"}],
  "🇺🇿 Uzbekistán":   [{r:"G",s:"2-0",vs:"Afganistán"},{r:"G",s:"1-0",vs:"Tayikistán"},{r:"P",s:"0-3",vs:"Japón"},{r:"G",s:"2-1",vs:"Kirguistán"},{r:"P",s:"0-2",vs:"Irán"}],
  "🇨🇴 Colombia":     [{r:"G",s:"3-0",vs:"Bolivia"},{r:"G",s:"2-1",vs:"Perú"},{r:"E",s:"1-1",vs:"Argentina"},{r:"G",s:"2-0",vs:"Venezuela"},{r:"G",s:"3-1",vs:"Chile"}],
  "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra":  [{r:"G",s:"3-0",vs:"Albania"},{r:"G",s:"2-1",vs:"Irlanda"},{r:"G",s:"4-0",vs:"San Marino"},{r:"E",s:"1-1",vs:"Alemania"},{r:"G",s:"2-0",vs:"Grecia"}],
  "🇭🇷 Croacia":      [{r:"P",s:"0-3",vs:"España"},{r:"G",s:"2-0",vs:"Letonia"},{r:"E",s:"1-1",vs:"Hungría"},{r:"P",s:"0-2",vs:"Austria"},{r:"G",s:"3-1",vs:"Armenia"}],
  "🇬🇭 Ghana":        [{r:"G",s:"2-0",vs:"Madagascar"},{r:"G",s:"1-0",vs:"Angola"},{r:"P",s:"0-2",vs:"Nigeria"},{r:"E",s:"1-1",vs:"Senegal"},{r:"G",s:"3-0",vs:"Lesoto"}],
  "🇵🇦 Panamá":       [{r:"G",s:"2-0",vs:"Curazao"},{r:"G",s:"1-0",vs:"Costa Rica"},{r:"P",s:"0-3",vs:"EE.UU."},{r:"E",s:"1-1",vs:"Honduras"},{r:"G",s:"2-1",vs:"El Salvador"}],
};

// ── FUNCIÓN PARA CALCULAR FUERZA BASADA EN ÚLTIMOS 5 PARTIDOS ──
const calcularFuerzaEquipo = (team) => {
  const partidos = FORM[team];
  if (!partidos) return 0.5;
  
  let puntos = 0;
  partidos.forEach(p => {
    if (p.r === "G") puntos += 3;
    if (p.r === "E") puntos += 1;
    if (p.r === "P") puntos += 0;
  });
  
  // Puntos máximos posibles: 15 (5 victorias)
  const fuerza = puntos / 15;
  return fuerza;
};

// ── FUNCIÓN PARA CALCULAR PROBABILIDADES DINÁMICAS ──
const calcularProbabilidades = (team1, team2) => {
  const fuerza1 = calcularFuerzaEquipo(team1);
  const fuerza2 = calcularFuerzaEquipo(team2);
  
  // Si los dos tienen fuerza 0, poner valores neutrales
  if (fuerza1 === 0 && fuerza2 === 0) return { w1: 33, draw: 34, w2: 33 };
  
  const totalFuerza = fuerza1 + fuerza2;
  let w1 = (fuerza1 / totalFuerza) * 70; // Máximo 70% para evitar extremos
  let w2 = (fuerza2 / totalFuerza) * 70;
  
  // Empate más probable cuando están igualados
  let draw = Math.abs(w1 - w2) * 0.4;
  if (draw < 20) draw = 20 + (20 - draw);
  if (draw > 40) draw = 40;
  
  // Ajustar para que sume 100%
  const total = w1 + w2 + draw;
  w1 = Math.round((w1 / total) * 100);
  w2 = Math.round((w2 / total) * 100);
  const drawFinal = 100 - w1 - w2;
  
  return { w1: Math.max(5, Math.min(85, w1)), draw: drawFinal, w2: Math.max(5, Math.min(85, w2)) };
};

// ── PARTIDOS CON PROBABILIDADES DINÁMICAS ──
const generarMatchDataConProbabilidades = () => {
  const baseData = {
    "A0":{t1:"🇲🇽 México",t2:"🇿🇦 Sudáfrica",score:"3-1",fecha:"Jun 11",hora:"14:00",sede:"Cd. México",j:1,grupo:"A",estrella1:"Raúl Jiménez",estrella2:"Percy Tau",prediccion:"Victoria cómoda de México aprovechando la localía."},
    "A1":{t1:"🇰🇷 Corea del Sur",t2:"🇨🇿 Rep. Checa",score:"1-1",fecha:"Jun 11",hora:"21:00",sede:"Guadalajara",j:1,grupo:"A",estrella1:"Son Heung-min",estrella2:"Patrik Schick",prediccion:"Partido muy igualado. Empate lo más probable."},
    "A2":{t1:"🇨🇿 Rep. Checa",t2:"🇿🇦 Sudáfrica",score:"2-0",fecha:"Jun 18",hora:"11:00",sede:"Atlanta",j:2,grupo:"A",estrella1:"Patrik Schick",estrella2:"Percy Tau",prediccion:"Rep. Checa gana con solidez europea."},
    "A3":{t1:"🇲🇽 México",t2:"🇰🇷 Corea del Sur",score:"2-1",fecha:"Jun 18",hora:"22:00",sede:"Guadalajara",j:2,grupo:"A",estrella1:"Hirving Lozano",estrella2:"Lee Kang-in",prediccion:"México gana ajustado en casa. Partido intenso."},
    "A4":{t1:"🇿🇦 Sudáfrica",t2:"🇰🇷 Corea del Sur",score:"0-2",fecha:"Jun 24",hora:"20:00",sede:"Monterrey",j:3,grupo:"A",estrella1:"Percy Tau",estrella2:"Son Heung-min",prediccion:"Corea gana y cierra el grupo. Sudáfrica se despide."},
    "A5":{t1:"🇨🇿 Rep. Checa",t2:"🇲🇽 México",score:"1-2",fecha:"Jun 24",hora:"20:00",sede:"Cd. México",j:3,grupo:"A",estrella1:"Tomas Soucek",estrella2:"Chucky Lozano",prediccion:"México cierra como líder. Checa lucha pero no alcanza."},
    "B0":{t1:"🇨🇦 Canadá",t2:"🇧🇦 Bosnia",score:"2-1",fecha:"Jun 12",hora:"14:00",sede:"Toronto",j:1,grupo:"B",estrella1:"Alphonso Davies",estrella2:"Edin Džeko",prediccion:"Canadá gana en casa. Davies el diferencial."},
    "B1":{t1:"🇶🇦 Qatar",t2:"🇨🇭 Suiza",score:"0-3",fecha:"Jun 13",hora:"14:00",sede:"San Francisco",j:1,grupo:"B",estrella1:"Almoez Ali",estrella2:"Granit Xhaka",prediccion:"Suiza gana con facilidad. Qatar sin nivel para este grupo."},
    "B2":{t1:"🇨🇭 Suiza",t2:"🇧🇦 Bosnia",score:"2-0",fecha:"Jun 18",hora:"18:00",sede:"Los Ángeles",j:2,grupo:"B",estrella1:"Xherdan Shaqiri",estrella2:"Miralem Pjanić",prediccion:"Suiza gana y avanza. Bosnia sin nivel suficiente."},
    "B3":{t1:"🇨🇦 Canadá",t2:"🇶🇦 Qatar",score:"3-0",fecha:"Jun 18",hora:"21:00",sede:"Vancouver",j:2,grupo:"B",estrella1:"Jonathan David",estrella2:"Hassan Al-Haydos",prediccion:"Canadá golea al débil Qatar."},
    "B4":{t1:"🇧🇦 Bosnia",t2:"🇶🇦 Qatar",score:"2-1",fecha:"Jun 24",hora:"18:00",sede:"Seattle",j:3,grupo:"B",estrella1:"Edin Džeko",estrella2:"Akram Afif",prediccion:"Bosnia gana para buscar ser mejor tercero."},
    "B5":{t1:"🇨🇭 Suiza",t2:"🇨🇦 Canadá",score:"1-1",fecha:"Jun 24",hora:"18:00",sede:"Vancouver",j:3,grupo:"B",estrella1:"Granit Xhaka",estrella2:"Cyle Larin",prediccion:"Empate posible. Los dos ya estarían clasificados."},
    "C0":{t1:"🇧🇷 Brasil",t2:"🇲🇦 Marruecos",score:"2-1",fecha:"Jun 13",hora:"17:00",sede:"Nueva York",j:1,grupo:"C",estrella1:"Vinicius Jr",estrella2:"Achraf Hakimi",prediccion:"Brasil gana en un partido intenso. Marruecos muy peligroso."},
    "C1":{t1:"🇭🇹 Haití",t2:"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia",score:"0-2",fecha:"Jun 13",hora:"20:00",sede:"Boston",j:1,grupo:"C",estrella1:"Duckens Nazon",estrella2:"Andy Robertson",prediccion:"Escocia gana sin dificultades. Haití debut histórico."},
    "C2":{t1:"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia",t2:"🇲🇦 Marruecos",score:"0-2",fecha:"Jun 19",hora:"18:00",sede:"Boston",j:2,grupo:"C",estrella1:"Scott McTominay",estrella2:"Youssef En-Nesyri",prediccion:"Marruecos gana con la calidad de sus estrellas."},
    "C3":{t1:"🇧🇷 Brasil",t2:"🇭🇹 Haití",score:"4-0",fecha:"Jun 19",hora:"20:30",sede:"Toronto",j:2,grupo:"C",estrella1:"Rodrygo",estrella2:"Frantzdy Pierrot",prediccion:"Goleada brasileña. Haití hace historia solo con participar."},
    "C4":{t1:"🇲🇦 Marruecos",t2:"🇭🇹 Haití",score:"3-0",fecha:"Jun 24",hora:"23:00",sede:"Atlanta",j:3,grupo:"C",estrella1:"Youssef En-Nesyri",estrella2:"Duckens Nazon",prediccion:"Victoria cómoda de Marruecos. Haití sin opciones."},
    "C5":{t1:"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia",t2:"🇧🇷 Brasil",score:"0-3",fecha:"Jun 24",hora:"23:00",sede:"Miami",j:3,grupo:"C",estrella1:"Ryan Christie",estrella2:"Vinicius Jr",prediccion:"Brasil golea. Escocia lucha pero el nivel es abismal."},
    "D0":{t1:"🇺🇸 EE.UU.",t2:"🇵🇾 Paraguay",score:"2-1",fecha:"Jun 12",hora:"20:00",sede:"Los Ángeles",j:1,grupo:"D",estrella1:"Christian Pulisic",estrella2:"Miguel Almirón",prediccion:"EE.UU. gana con localía. Almirón peligroso en contragolpe."},
    "D1":{t1:"🇦🇺 Australia",t2:"🇹🇷 Turquía",score:"1-2",fecha:"Jun 13",hora:"23:00",sede:"Vancouver",j:1,grupo:"D",estrella1:"Mat Ryan",estrella2:"Hakan Calhanoglu",prediccion:"Turquía favorita con Calhanoglu y Arda Güler."},
    "D2":{t1:"🇺🇸 EE.UU.",t2:"🇦🇺 Australia",score:"2-1",fecha:"Jun 19",hora:"14:00",sede:"Seattle",j:2,grupo:"D",estrella1:"Gio Reyna",estrella2:"Mathew Leckie",prediccion:"EE.UU. gana en casa. Australia no da nada por perdido."},
    "D3":{t1:"🇹🇷 Turquía",t2:"🇵🇾 Paraguay",score:"2-1",fecha:"Jun 19",hora:"21:00",sede:"San Francisco",j:2,grupo:"D",estrella1:"Arda Güler",estrella2:"Antonio Sanabria",prediccion:"Turquía gana con Arda Güler determinante."},
    "D4":{t1:"🇵🇾 Paraguay",t2:"🇦🇺 Australia",score:"1-1",fecha:"Jun 26",hora:"22:00",sede:"Houston",j:3,grupo:"D",estrella1:"Alejandro Romero",estrella2:"Mitchell Duke",prediccion:"Partido igualado. Empate define el mejor tercero."},
    "D5":{t1:"🇹🇷 Turquía",t2:"🇺🇸 EE.UU.",score:"1-2",fecha:"Jun 26",hora:"22:00",sede:"Vancouver",j:3,grupo:"D",estrella1:"Hakan Calhanoglu",estrella2:"Tyler Adams",prediccion:"EE.UU. cierra como líder ante Turquía."},
    "E0":{t1:"🇩🇪 Alemania",t2:"🇨🇼 Curazao",score:"5-0",fecha:"Jun 14",hora:"12:00",sede:"Houston",j:1,grupo:"E",estrella1:"Florian Wirtz",estrella2:"Cuco Martina",prediccion:"Goleada alemana. Curazao debuta en el Mundial."},
    "E1":{t1:"🇨🇮 Costa de Marfil",t2:"🇪🇨 Ecuador",score:"1-1",fecha:"Jun 14",hora:"18:00",sede:"Filadelfia",j:1,grupo:"E",estrella1:"Wilfried Zaha",estrella2:"Moisés Caicedo",prediccion:"Duelo igualado. Empate probable. Caicedo vs Zaha el duelo clave."},
    "E2":{t1:"🇩🇪 Alemania",t2:"🇨🇮 Costa de Marfil",score:"3-1",fecha:"Jun 20",hora:"15:00",sede:"Toronto",j:2,grupo:"E",estrella1:"Kai Havertz",estrella2:"Sébastien Haller",prediccion:"Alemania gana. Costa de Marfil puede marcar pero no alcanza."},
    "E3":{t1:"🇪🇨 Ecuador",t2:"🇨🇼 Curazao",score:"3-0",fecha:"Jun 20",hora:"19:00",sede:"Kansas City",j:2,grupo:"E",estrella1:"Enner Valencia",estrella2:"Leandro Bacuna",prediccion:"Ecuador golea. Enner Valencia lidera el ataque."},
    "E4":{t1:"🇨🇼 Curazao",t2:"🇨🇮 Costa de Marfil",score:"0-3",fecha:"Jun 25",hora:"15:00",sede:"Boston",j:3,grupo:"E",estrella1:"Leandro Bacuna",estrella2:"Sébastien Haller",prediccion:"Costa de Marfil golea. Curazao se despide sin puntos."},
    "E5":{t1:"🇪🇨 Ecuador",t2:"🇩🇪 Alemania",score:"0-2",fecha:"Jun 25",hora:"15:00",sede:"Nueva York",j:3,grupo:"E",estrella1:"Moises Caicedo",estrella2:"Florian Wirtz",prediccion:"Alemania cierra como líder. Ecuador lucha pero no puede."},
    "F0":{t1:"🇳🇱 Países Bajos",t2:"🇯🇵 Japón",score:"2-1",fecha:"Jun 14",hora:"15:00",sede:"Dallas",j:1,grupo:"F",estrella1:"Cody Gakpo",estrella2:"Takefusa Kubo",prediccion:"Países Bajos gana en un partido muy disputado."},
    "F1":{t1:"🇸🇪 Suecia",t2:"🇹🇳 Túnez",score:"2-0",fecha:"Jun 14",hora:"21:00",sede:"Monterrey",j:1,grupo:"F",estrella1:"Alexander Isak",estrella2:"Wahbi Khazri",prediccion:"Suecia gana con Isak como goleador del partido."},
    "F2":{t1:"🇳🇱 Países Bajos",t2:"🇸🇪 Suecia",score:"2-1",fecha:"Jun 20",hora:"12:00",sede:"Houston",j:2,grupo:"F",estrella1:"Memphis Depay",estrella2:"Dejan Kulusevski",prediccion:"Países Bajos favorito pero Suecia muy peligrosa."},
    "F3":{t1:"🇹🇳 Túnez",t2:"🇯🇵 Japón",score:"0-2",fecha:"Jun 20",hora:"22:00",sede:"Monterrey",j:2,grupo:"F",estrella1:"Hannibal Mejbri",estrella2:"Takumi Minamino",prediccion:"Japón gana con disciplina táctica."},
    "F4":{t1:"🇯🇵 Japón",t2:"🇸🇪 Suecia",score:"1-2",fecha:"Jun 25",hora:"19:00",sede:"Dallas",j:3,grupo:"F",estrella1:"Keito Nakamura",estrella2:"Alexander Isak",prediccion:"Partido igualado. Suecia puede ganar por la mínima."},
    "F5":{t1:"🇹🇳 Túnez",t2:"🇳🇱 Países Bajos",score:"0-3",fecha:"Jun 25",hora:"19:00",sede:"Atlanta",j:3,grupo:"F",estrella1:"Hannibal Mejbri",estrella2:"Virgil van Dijk",prediccion:"Países Bajos golea. Túnez se despide sin puntos."},
    "G0":{t1:"🇧🇪 Bélgica",t2:"🇪🇬 Egipto",score:"2-0",fecha:"Jun 15",hora:"14:00",sede:"Seattle",j:1,grupo:"G",estrella1:"Kevin De Bruyne",estrella2:"Mohamed Salah",prediccion:"Bélgica gana. El duelo De Bruyne vs Salah es el clímax."},
    "G1":{t1:"🇮🇷 Irán",t2:"🇳🇿 Nueva Zelanda",score:"2-1",fecha:"Jun 15",hora:"20:00",sede:"Los Ángeles",j:1,grupo:"G",estrella1:"Mehdi Taremi",estrella2:"Chris Wood",prediccion:"Irán gana para empezar con pie derecho."},
    "G2":{t1:"🇧🇪 Bélgica",t2:"🇮🇷 Irán",score:"3-0",fecha:"Jun 21",hora:"18:00",sede:"Los Ángeles",j:2,grupo:"G",estrella1:"Romelu Lukaku",estrella2:"Mehdi Taremi",prediccion:"Bélgica gana con claridad."},
    "G3":{t1:"🇳🇿 Nueva Zelanda",t2:"🇪🇬 Egipto",score:"0-2",fecha:"Jun 21",hora:"21:00",sede:"Vancouver",j:2,grupo:"G",estrella1:"Chris Wood",estrella2:"Mohamed Salah",prediccion:"Egipto gana con Salah protagonista."},
    "G4":{t1:"🇪🇬 Egipto",t2:"🇮🇷 Irán",score:"1-1",fecha:"Jun 26",hora:"23:00",sede:"Seattle",j:3,grupo:"G",estrella1:"Mohamed Salah",estrella2:"Mehdi Taremi",prediccion:"Empate posible. Salah puede decidir con un momento de clase."},
    "G5":{t1:"🇳🇿 Nueva Zelanda",t2:"🇧🇪 Bélgica",score:"0-4",fecha:"Jun 26",hora:"23:00",sede:"Vancouver",j:3,grupo:"G",estrella1:"Chris Wood",estrella2:"Kevin De Bruyne",prediccion:"Bélgica golea para cerrar como líder indiscutible."},
    "H0":{t1:"🇪🇸 España",t2:"🇨🇻 Cabo Verde",score:"4-0",fecha:"Jun 15",hora:"11:00",sede:"Atlanta",j:1,grupo:"H",estrella1:"Lamine Yamal",estrella2:"Ryan Mendes",prediccion:"Goleada española. Yamal brillará ante Cabo Verde."},
    "H1":{t1:"🇸🇦 Arabia Saudita",t2:"🇺🇾 Uruguay",score:"1-2",fecha:"Jun 15",hora:"17:00",sede:"Miami",j:1,grupo:"H",estrella1:"Salem Al-Dawsari",estrella2:"Federico Valverde",prediccion:"Uruguay gana con Valverde determinante."},
    "H2":{t1:"🇪🇸 España",t2:"🇺🇾 Uruguay",score:"2-1",fecha:"Jun 21",hora:"12:00",sede:"Guadalajara",j:2,grupo:"H",estrella1:"Pedri",estrella2:"Darwin Núñez",prediccion:"España favorita pero Uruguay nunca es fácil."},
    "H3":{t1:"🇸🇦 Arabia Saudita",t2:"🇨🇻 Cabo Verde",score:"2-1",fecha:"Jun 21",hora:"17:00",sede:"Kansas City",j:2,grupo:"H",estrella1:"Salem Al-Dawsari",estrella2:"Ryan Mendes",prediccion:"Arabia Saudita gana para tener opciones de clasificar."},
    "H4":{t1:"🇨🇻 Cabo Verde",t2:"🇺🇾 Uruguay",score:"0-3",fecha:"Jun 26",hora:"20:00",sede:"Dallas",j:3,grupo:"H",estrella1:"Ryan Mendes",estrella2:"Darwin Núñez",prediccion:"Uruguay golea. Darwin Núñez letal."},
    "H5":{t1:"🇪🇸 España",t2:"🇸🇦 Arabia Saudita",score:"3-0",fecha:"Jun 26",hora:"20:00",sede:"Miami",j:3,grupo:"H",estrella1:"Pedri",estrella2:"Al-Dawsari",prediccion:"España cierra como líder. Arabia Saudita busca otro milagro."},
    "I0":{t1:"🇫🇷 Francia",t2:"🇸🇳 Senegal",score:"2-0",fecha:"Jun 16",hora:"14:00",sede:"Nueva York",j:1,grupo:"I",estrella1:"Kylian Mbappé",estrella2:"Sadio Mané",prediccion:"Francia gana. Mbappé el más determinante del partido."},
    "I1":{t1:"🇮🇶 Irak",t2:"🇳🇴 Noruega",score:"0-2",fecha:"Jun 16",hora:"17:00",sede:"Boston",j:1,grupo:"I",estrella1:"Mohanad Ali",estrella2:"Erling Haaland",prediccion:"Noruega golea. Haaland imparable ante Irak."},
    "I2":{t1:"🇫🇷 Francia",t2:"🇮🇶 Irak",score:"4-0",fecha:"Jun 22",hora:"17:00",sede:"Filadelfia",j:2,grupo:"I",estrella1:"Mbappé",estrella2:"Mohanad Ali",prediccion:"Goleada francesa. Mbappé y Griezmann dominan."},
    "I3":{t1:"🇳🇴 Noruega",t2:"🇸🇳 Senegal",score:"2-1",fecha:"Jun 22",hora:"20:00",sede:"Nueva York",j:2,grupo:"I",estrella1:"Erling Haaland",estrella2:"Ismaila Sarr",prediccion:"Noruega favorita con Haaland. Senegal lucha por clasificar."},
    "I4":{t1:"🇸🇳 Senegal",t2:"🇮🇶 Irak",score:"2-0",fecha:"Jun 26",hora:"15:00",sede:"Toronto",j:3,grupo:"I",estrella1:"Sadio Mané",estrella2:"Mohanad Ali",prediccion:"Senegal gana para buscar ser mejor tercero."},
    "I5":{t1:"🇳🇴 Noruega",t2:"🇫🇷 Francia",score:"1-2",fecha:"Jun 26",hora:"15:00",sede:"Boston",j:3,grupo:"I",estrella1:"Haaland",estrella2:"Mbappé",prediccion:"Francia cierra con Mbappé. Noruega pelea pero el nivel es alto."},
    "J0":{t1:"🇦🇷 Argentina",t2:"🇩🇿 Argelia",score:"2-0",fecha:"Jun 16",hora:"20:00",sede:"Kansas City",j:1,grupo:"J",estrella1:"Lionel Messi",estrella2:"Riyad Mahrez",prediccion:"Argentina gana. Messi lidera al campeón defensor."},
    "J1":{t1:"🇦🇹 Austria",t2:"🇯🇴 Jordania",score:"3-0",fecha:"Jun 16",hora:"23:00",sede:"San Francisco",j:1,grupo:"J",estrella1:"Marcel Sabitzer",estrella2:"Musa Al-Taamari",prediccion:"Austria gana con facilidad. Jordania debut mundialista."},
    "J2":{t1:"🇦🇷 Argentina",t2:"🇦🇹 Austria",score:"2-1",fecha:"Jun 22",hora:"12:00",sede:"Kansas City",j:2,grupo:"J",estrella1:"Julián Álvarez",estrella2:"David Alaba",prediccion:"Argentina gana ante un Austria complicado."},
    "J3":{t1:"🇩🇿 Argelia",t2:"🇯🇴 Jordania",score:"2-0",fecha:"Jun 22",hora:"21:00",sede:"San Francisco",j:2,grupo:"J",estrella1:"Riyad Mahrez",estrella2:"Ahmad Habashneh",prediccion:"Argelia gana para pelear el segundo puesto."},
    "J4":{t1:"🇩🇿 Argelia",t2:"🇦🇹 Austria",score:"1-1",fecha:"Jun 27",hora:"21:00",sede:"Kansas City",j:3,grupo:"J",estrella1:"Riyad Mahrez",estrella2:"Marcel Sabitzer",prediccion:"Partido igualado. Los dos necesitan la victoria."},
    "J5":{t1:"🇯🇴 Jordania",t2:"🇦🇷 Argentina",score:"0-3",fecha:"Jun 27",hora:"21:00",sede:"Dallas",j:3,grupo:"J",estrella1:"Musa Al-Taamari",estrella2:"Lionel Messi",prediccion:"Argentina termina como líder. Messi se despide de la fase."},
    "K0":{t1:"🇵🇹 Portugal",t2:"🇨🇩 RD Congo",score:"3-0",fecha:"Jun 17",hora:"12:00",sede:"Houston",j:1,grupo:"K",estrella1:"Cristiano Ronaldo",estrella2:"Chancel Mbemba",prediccion:"Portugal golea. CR7 busca brillar en su último Mundial."},
    "K1":{t1:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra",t2:"🇭🇷 Croacia",score:"2-1",fecha:"Jun 17",hora:"15:00",sede:"Dallas",j:1,grupo:"L",estrella1:"Jude Bellingham",estrella2:"Luka Modrić",prediccion:"Inglaterra gana pero Modrić eleva a Croacia en cualquier momento."},
    "K2":{t1:"🇬🇭 Ghana",t2:"🇵🇦 Panamá",score:"2-1",fecha:"Jun 17",hora:"18:00",sede:"Toronto",j:1,grupo:"L",estrella1:"Mohammed Kudus",estrella2:"Rolando Blackburn",prediccion:"Ghana gana. Kudus el más peligroso del partido."},
    "K3":{t1:"🇺🇿 Uzbekistán",t2:"🇨🇴 Colombia",score:"0-2",fecha:"Jun 17",hora:"21:00",sede:"Cd. México",j:1,grupo:"K",estrella1:"Eldor Shomurodov",estrella2:"Luis Díaz",prediccion:"Colombia gana en su debut. Luis Díaz el más peligroso. ¡Vamos Colombia! 🇨🇴"},
    "K4":{t1:"🇵🇹 Portugal",t2:"🇺🇿 Uzbekistán",score:"4-0",fecha:"Jun 23",hora:"13:00",sede:"Houston",j:2,grupo:"K",estrella1:"Cristiano Ronaldo",estrella2:"Eldor Shomurodov",prediccion:"Portugal golea. CR7 busca marcar en cada partido."},
    "K5":{t1:"🇨🇴 Colombia",t2:"🇨🇩 RD Congo",score:"2-0",fecha:"Jun 23",hora:"22:00",sede:"Guadalajara",j:2,grupo:"K",estrella1:"James Rodríguez",estrella2:"Chancel Mbemba",prediccion:"Colombia gana y casi clasifica. James en un gran nivel. 🇨🇴"},
    "K6":{t1:"🇭🇷 Croacia",t2:"🇬🇭 Ghana",score:"2-1",fecha:"Jun 23",hora:"15:00",sede:"Dallas",j:2,grupo:"L",estrella1:"Luka Modrić",estrella2:"Mohammed Kudus",prediccion:"Croacia gana. Modrić el mejor jugador del partido."},
    "K7":{t1:"🇵🇦 Panamá",t2:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra",score:"0-3",fecha:"Jun 23",hora:"16:00",sede:"Nueva York",j:2,grupo:"L",estrella1:"Rolando Blackburn",estrella2:"Harry Kane",prediccion:"Inglaterra golea a Panamá. Kane lidera el ataque inglés."},
    "K8":{t1:"🇨🇴 Colombia",t2:"🇵🇹 Portugal",score:"1-2",fecha:"Jun 27",hora:"18:30",sede:"Miami",j:3,grupo:"K",estrella1:"Luis Díaz",estrella2:"Cristiano Ronaldo",prediccion:"Portugal favorito pero Colombia juega con todo. El partido de la fase para Colombia. 🇨🇴"},
    "K9":{t1:"🇨🇩 RD Congo",t2:"🇺🇿 Uzbekistán",score:"2-1",fecha:"Jun 27",hora:"18:30",sede:"Atlanta",j:3,grupo:"K",estrella1:"Chancel Mbemba",estrella2:"Eldor Shomurodov",prediccion:"RD Congo gana. Los dos pelean un puesto de mejor tercero."},
    "K10":{t1:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra",t2:"🇵🇦 Panamá",score:"4-0",fecha:"Jun 27",hora:"16:00",sede:"Nueva York",j:3,grupo:"L",estrella1:"Phil Foden",estrella2:"Ismael Díaz",prediccion:"Goleada inglesa para cerrar como líder del grupo L."},
    "K12":{t1:"🇭🇷 Croacia",t2:"🇬🇭 Ghana",score:"2-1",fecha:"Jun 27",hora:"16:00",sede:"Filadelfia",j:3,grupo:"L",estrella1:"Luka Modrić",estrella2:"Mohammed Kudus",prediccion:"Croacia cierra con Modrić brillando una vez más."},
  };
  
  // Agregar probabilidades dinámicas
  const resultado = {};
  Object.entries(baseData).forEach(([key, match]) => {
    const { w1, draw, w2 } = calcularProbabilidades(match.t1, match.t2);
    resultado[key] = { ...match, w1, draw, w2 };
  });
  
  return resultado;
};

const MATCH_DATA = generarMatchDataConProbabilidades();

// ── GRUPOS ────────────────────────────────────────────────────
const REAL_GROUPS = {
  A:{name:"GRUPO A",emoji:"🏟️",teams:["🇲🇽 México","🇿🇦 Sudáfrica","🇰🇷 Corea del Sur","🇨🇿 Rep. Checa"],matches:["A0","A1","A2","A3","A4","A5"]},
  B:{name:"GRUPO B",emoji:"🍁",teams:["🇨🇦 Canadá","🇧🇦 Bosnia","🇶🇦 Qatar","🇨🇭 Suiza"],matches:["B0","B1","B2","B3","B4","B5"]},
  C:{name:"GRUPO C",emoji:"⚡",teams:["🇧🇷 Brasil","🇲🇦 Marruecos","🇭🇹 Haití","🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia"],matches:["C0","C1","C2","C3","C4","C5"]},
  D:{name:"GRUPO D",emoji:"🦅",teams:["🇺🇸 EE.UU.","🇵🇾 Paraguay","🇦🇺 Australia","🇹🇷 Turquía"],matches:["D0","D1","D2","D3","D4","D5"]},
  E:{name:"GRUPO E",emoji:"🦁",teams:["🇩🇪 Alemania","🇨🇼 Curazao","🇨🇮 Costa de Marfil","🇪🇨 Ecuador"],matches:["E0","E1","E2","E3","E4","E5"]},
  F:{name:"GRUPO F",emoji:"🌷",teams:["🇳🇱 Países Bajos","🇯🇵 Japón","🇸🇪 Suecia","🇹🇳 Túnez"],matches:["F0","F1","F2","F3","F4","F5"]},
  G:{name:"GRUPO G",emoji:"💎",teams:["🇧🇪 Bélgica","🇪🇬 Egipto","🇮🇷 Irán","🇳🇿 Nueva Zelanda"],matches:["G0","G1","G2","G3","G4","G5"]},
  H:{name:"GRUPO H",emoji:"🔥",teams:["🇪🇸 España","🇨🇻 Cabo Verde","🇸🇦 Arabia Saudita","🇺🇾 Uruguay"],matches:["H0","H1","H2","H3","H4","H5"]},
  I:{name:"GRUPO I",emoji:"⚜️",teams:["🇫🇷 Francia","🇸🇳 Senegal","🇮🇶 Irak","🇳🇴 Noruega"],matches:["I0","I1","I2","I3","I4","I5"]},
  J:{name:"GRUPO J",emoji:"🏆",teams:["🇦🇷 Argentina","🇩🇿 Argelia","🇦🇹 Austria","🇯🇴 Jordania"],matches:["J0","J1","J2","J3","J4","J5"]},
  K:{name:"GRUPO K 🇨🇴",emoji:"🎺",teams:["🇵🇹 Portugal","🇨🇩 RD Congo","🇺🇿 Uzbekistán","🇨🇴 Colombia"],matches:["K0","K3","K4","K5","K8","K9"]},
  L:{name:"GRUPO L",emoji:"👑",teams:["🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra","🇭🇷 Croacia","🇬🇭 Ghana","🇵🇦 Panamá"],matches:["K1","K2","K6","K7","K10","K12"]},
};

const BY_DATE = {};
Object.entries(MATCH_DATA).forEach(([key,d])=>{
  if(!BY_DATE[d.fecha]) BY_DATE[d.fecha]=[];
  BY_DATE[d.fecha].push(key);
});
const SORTED_DATES = Object.keys(BY_DATE).sort((a,b)=>parseInt(a.split(" ")[1])-parseInt(b.split(" ")[1]));
const JC = {1:"#10b981",2:"#3b82f6",3:"#f59e0b"};
const DAY_NAMES = {"Jun 11":"Jue","Jun 12":"Vie","Jun 13":"Sáb","Jun 14":"Dom","Jun 15":"Lun","Jun 16":"Mar","Jun 17":"Mié","Jun 18":"Jue","Jun 19":"Vie","Jun 20":"Sáb","Jun 21":"Dom","Jun 22":"Lun","Jun 23":"Mar","Jun 24":"Mié","Jun 25":"Jue","Jun 26":"Vie","Jun 27":"Sáb"};
const EQUIPOS_16_DESTACADOS = [
  {team:"🇦🇷 Argentina", grupo:"J", ultimo:"2-0 vs Argelia", siguiente:"vs Austria · 22 Jun", estado:"Líder"},
  {team:"🇧🇷 Brasil", grupo:"C", ultimo:"4-0 vs Haití", siguiente:"vs Escocia · 24 Jun", estado:"Fuerte"},
  {team:"🇨🇴 Colombia", grupo:"K", ultimo:"2-0 vs RD Congo", siguiente:"vs Portugal · 27 Jun", estado:"Clasificada"},
  {team:"🇪🇸 España", grupo:"H", ultimo:"4-0 vs Cabo Verde", siguiente:"vs Arabia Saudita · 26 Jun", estado:"Líder"},
  {team:"🇫🇷 Francia", grupo:"I", ultimo:"4-0 vs Irak", siguiente:"vs Noruega · 26 Jun", estado:"Favorita"},
  {team:"🏴 Inglaterra", grupo:"L", ultimo:"4-0 vs Panamá", siguiente:"vs Croacia · 27 Jun", estado:"Top"},
  {team:"🇩🇪 Alemania", grupo:"E", ultimo:"3-1 vs Costa de Marfil", siguiente:"vs Ecuador · 25 Jun", estado:"Potente"},
  {team:"🇳🇱 Países Bajos", grupo:"F", ultimo:"3-0 vs Túnez", siguiente:"vs Suecia · 25 Jun", estado:"Competitiva"},
  {team:"🇵🇹 Portugal", grupo:"K", ultimo:"4-0 vs Uzbekistán", siguiente:"vs Colombia · 27 Jun", estado:"Alta"},
  {team:"🇺🇾 Uruguay", grupo:"H", ultimo:"3-0 vs Cabo Verde", siguiente:"vs España · 21 Jun", estado:"Seria"},
  {team:"🇲🇽 México", grupo:"A", ultimo:"2-1 vs Corea del Sur", siguiente:"vs Rep. Checa · 24 Jun", estado:"Local"},
  {team:"🇺🇸 EE.UU.", grupo:"D", ultimo:"2-1 vs Australia", siguiente:"vs Turquía · 26 Jun", estado:"Motivado"},
  {team:"🇯🇵 Japón", grupo:"F", ultimo:"2-0 vs Túnez", siguiente:"vs Suecia · 25 Jun", estado:"Organizado"},
  {team:"🇰🇷 Corea del Sur", grupo:"A", ultimo:"2-0 vs Sudáfrica", siguiente:"vs México · 18 Jun", estado:"Dinamita"},
  {team:"🇸🇳 Senegal", grupo:"I", ultimo:"2-0 vs Irak", siguiente:"vs Noruega · 22 Jun", estado:"Amenaza"},
  {team:"🇲🇦 Marruecos", grupo:"C", ultimo:"3-0 vs Haití", siguiente:"vs Escocia · 24 Jun", estado:"Rival duro"},
];

// ── COMPONENTES ───────────────────────────────────────────────
function ProbBar({t1,t2,w1,draw,w2}){
  const n1=t1.split(" ").slice(1).join(" "), n2=t2.split(" ").slice(1).join(" ");
  return(
    <div style={{margin:"10px 0 6px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
        <span style={{fontSize:"11px",color:"#10b981",fontWeight:"700"}}>{n1}</span>
        <span style={{fontSize:"11px",color:"#94a3b8"}}>Empate</span>
        <span style={{fontSize:"11px",color:"#60a5fa",fontWeight:"700"}}>{n2}</span>
      </div>
      <div style={{display:"flex",height:"26px",borderRadius:"13px",overflow:"hidden"}}>
        <div style={{width:`${w1}%`,background:"linear-gradient(90deg,#059669,#10b981)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {w1>8&&<span style={{color:"white",fontSize:"12px",fontWeight:"800"}}>{w1}%</span>}
        </div>
        <div style={{width:`${draw}%`,background:"rgba(100,116,139,0.5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {draw>8&&<span style={{color:"#e2e8f0",fontSize:"11px",fontWeight:"700"}}>{draw}%</span>}
        </div>
        <div style={{width:`${w2}%`,background:"linear-gradient(90deg,#3b82f6,#60a5fa)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {w2>8&&<span style={{color:"white",fontSize:"12px",fontWeight:"800"}}>{w2}%</span>}
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:"3px"}}>
        <span style={{fontSize:"18px",fontWeight:"900",color:"#10b981"}}>{w1}%</span>
        <span style={{fontSize:"14px",fontWeight:"700",color:"#64748b"}}>{draw}%</span>
        <span style={{fontSize:"18px",fontWeight:"900",color:"#60a5fa"}}>{w2}%</span>
      </div>
    </div>
  );
}

function OddsBlock({team}){
  const o = ODDS[team]; if(!o) return null;
  const name = team.split(" ").slice(1).join(" ");
  const books = [
    {name:"Bet365",val:o.bet365,color:"#f59e0b"},
    {name:"Bwin",val:o.bwin,color:"#8b5cf6"},
    {name:"Codere",val:o.codere,color:"#ec4899"},
    {name:"Betway",val:o.betway,color:"#06b6d4"},
  ];
  const best = Math.max(...books.map(b=>b.val));
  return(
    <div style={{marginBottom:"4px"}}>
      <div style={{fontSize:"9px",color:"#10b981",fontWeight:"700",marginBottom:"3px"}}>💰 {name}</div>
      <div style={{display:"flex",gap:"4px"}}>
        {books.map(b=>(
          <div key={b.name} style={{
            flex:1,textAlign:"center",padding:"5px 2px",borderRadius:"7px",
            background: b.val===best ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
            border: b.val===best ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{fontSize:"8px",color:"#475569",marginBottom:"2px"}}>{b.name}</div>
            <div style={{fontSize:"13px",fontWeight:"900",color: b.val===best ? "#10b981" : "#e2e8f0"}}>{b.val.toFixed(2)}</div>
            {b.val===best&&<div style={{fontSize:"7px",color:"#10b981",fontWeight:"700"}}>MEJOR</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function FormBlock({team}){
  const f = FORM[team]; if(!f) return null;
  const name = team.split(" ").slice(1).join(" ");
  const rc = {G:"#10b981",E:"#f59e0b",P:"#ef4444"};
  const rb = {G:"rgba(16,185,129,0.12)",E:"rgba(245,158,11,0.12)",P:"rgba(239,68,68,0.12)"};
  const wins = f.filter(x=>x.r==="G").length;
  const draws = f.filter(x=>x.r==="E").length;
  const losses = f.filter(x=>x.r==="P").length;
  return(
    <div style={{marginBottom:"4px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"5px"}}>
        <div style={{fontSize:"9px",color:"#60a5fa",fontWeight:"700"}}>📊 {name} · últimos 5</div>
        <div style={{display:"flex",gap:"4px"}}>
          <span style={{fontSize:"9px",color:"#10b981",fontWeight:"700"}}>{wins}V</span>
          <span style={{fontSize:"9px",color:"#f59e0b",fontWeight:"700"}}>{draws}E</span>
          <span style={{fontSize:"9px",color:"#ef4444",fontWeight:"700"}}>{losses}D</span>
        </div>
      </div>
      <div style={{display:"flex",gap:"4px"}}>
        {f.map((m,i)=>(
          <div key={i} style={{
            flex:1,textAlign:"center",padding:"5px 2px",borderRadius:"7px",
            background:rb[m.r],border:`1px solid ${rc[m.r]}44`,
          }}>
            <div style={{fontSize:"11px",fontWeight:"900",color:rc[m.r]}}>{m.r}</div>
            <div style={{fontSize:"10px",color:"#e2e8f0",fontWeight:"700",margin:"1px 0"}}>{m.s}</div>
            <div style={{fontSize:"8px",color:"#475569",lineHeight:"1.1"}}>{m.vs}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturedTeamsPanel(){
  return (
    <div style={{padding:"13px 13px 6px"}}>
      <div style={{background:"linear-gradient(135deg,rgba(16,185,129,0.14),rgba(59,130,246,0.08))",border:"1px solid rgba(16,185,129,0.25)",borderRadius:"14px",padding:"12px 13px",marginBottom:"10px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
          <div>
            <div style={{fontSize:"10px",color:"#10b981",fontWeight:"800",letterSpacing:"1.2px",textTransform:"uppercase"}}>Mundial EBS 2026</div>
            <div style={{fontSize:"16px",fontWeight:"900",color:"#e2e8f0"}}>16 equipos destacados</div>
          </div>
          <span style={{background:"rgba(255,255,255,0.08)",color:"#f8fafc",padding:"4px 8px",borderRadius:"999px",fontSize:"10px",fontWeight:"700"}}>Partidos</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2, minmax(0, 1fr))",gap:"7px"}}>
          {EQUIPOS_16_DESTACADOS.map((item)=>(
            <div key={item.team} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"10px",padding:"8px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
                <span style={{fontSize:"11px",fontWeight:"800",color:"#e2e8f0"}}>{item.team}</span>
                <span style={{fontSize:"8px",color:"#10b981",fontWeight:"700",background:"rgba(16,185,129,0.12)",padding:"2px 6px",borderRadius:"999px"}}>{item.estado}</span>
              </div>
              <div style={{fontSize:"9px",color:"#94a3b8",marginBottom:"2px"}}>Grupo {item.grupo}</div>
              <div style={{fontSize:"10px",color:"#f8fafc",fontWeight:"600",marginBottom:"2px"}}>{item.ultimo}</div>
              <div style={{fontSize:"9px",color:"#60a5fa"}}>{item.siguiente}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchCard({mkey}){
  const [open,setOpen]=useState(false);
  const d=MATCH_DATA[mkey]; if(!d) return null;
  const {t1,t2,w1,draw,w2,score,fecha,hora,sede,j,grupo,estrella1,estrella2,prediccion}=d;
  const winner=w1>w2?t1:w2>w1?t2:null;
  const winPct=Math.max(w1,w2);
  const isCol=t1.includes("Colombia")||t2.includes("Colombia");
  return(
    <div style={{
      background:open?"rgba(16,185,129,0.06)":isCol?"rgba(255,215,0,0.05)":"rgba(255,255,255,0.02)",
      border:open?"1px solid rgba(16,185,129,0.35)":isCol?"1px solid rgba(255,215,0,0.25)":"1px solid rgba(255,255,255,0.07)",
      borderRadius:"12px",overflow:"hidden",transition:"all 0.2s",
    }}>
      <div onClick={()=>setOpen(o=>!o)} style={{padding:"11px 13px",cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px",alignItems:"center"}}>
          <span style={{background:`${JC[j]}22`,border:`1px solid ${JC[j]}44`,color:JC[j],fontSize:"9px",fontWeight:"700",padding:"2px 7px",borderRadius:"20px"}}>J{j}</span>
          <span style={{color:"#475569",fontSize:"10px"}}>⏰ {hora} COL · 📍 {sede}</span>
          <span style={{background:"rgba(255,255,255,0.05)",color:"#64748b",fontSize:"9px",fontWeight:"700",padding:"2px 6px",borderRadius:"6px"}}>G-{grupo}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"12px",color:isCol&&t1.includes("Colombia")?"#fbbf24":"#e2e8f0",fontWeight:"700",flex:1,textAlign:"right"}}>{t1}</span>
          <div style={{background:"linear-gradient(135deg,#10b981,#059669)",color:"white",fontSize:"10px",fontWeight:"800",padding:"2px 8px",borderRadius:"20px",flexShrink:0}}>VS</div>
          <span style={{fontSize:"12px",color:isCol&&t2.includes("Colombia")?"#fbbf24":"#e2e8f0",fontWeight:"700",flex:1}}>{t2}</span>
          <span style={{color:open?"#10b981":"#334155",fontSize:"12px",flexShrink:0}}>{open?"▲":"▼"}</span>
        </div>
        <div style={{display:"flex",height:"4px",borderRadius:"2px",overflow:"hidden",marginTop:"7px",gap:"1px"}}>
          <div style={{width:`${w1}%`,background:"#10b981"}}/>
          <div style={{width:`${draw}%`,background:"rgba(100,116,139,0.4)"}}/>
          <div style={{width:`${w2}%`,background:"#3b82f6"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"2px"}}>
          <span style={{fontSize:"10px",color:"#10b981",fontWeight:"700"}}>{w1}%</span>
          <span style={{fontSize:"10px",color:"#475569"}}>{draw}%</span>
          <span style={{fontSize:"10px",color:"#3b82f6",fontWeight:"700"}}>{w2}%</span>
        </div>
      </div>
      {open&&(
        <div style={{padding:"0 13px 14px",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          <ProbBar t1={t1} t2={t2} w1={w1} draw={draw} w2={w2}/>
          <div style={{textAlign:"center",margin:"8px 0"}}>
            <span style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"white",fontSize:"12px",fontWeight:"800",padding:"4px 14px",borderRadius:"20px"}}>⚽ Marcador probable: {score}</span>
          </div>
          {winner&&(
            <div style={{textAlign:"center",margin:"6px 0"}}>
              <span style={{background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.3)",color:"#10b981",fontSize:"11px",fontWeight:"700",padding:"3px 10px",borderRadius:"8px"}}>
                🏅 Favorito: {winner.split(" ").slice(1).join(" ")} ({winPct}%)
              </span>
            </div>
          )}
          <div style={{display:"flex",gap:"7px",margin:"9px 0"}}>
            {[{label:t1.split(" ").slice(1).join(" "),star:estrella1,color:"#10b981"},{label:t2.split(" ").slice(1).join(" "),star:estrella2,color:"#60a5fa"}].map((s,i)=>(
              <div key={i} style={{flex:1,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"8px",padding:"7px",textAlign:"center"}}>
                <div style={{fontSize:"9px",color:s.color,fontWeight:"700",marginBottom:"2px"}}>⭐ Estrella</div>
                <div style={{fontSize:"11px",color:"#e2e8f0",fontWeight:"600"}}>{s.star}</div>
                <div style={{fontSize:"9px",color:"#475569",marginTop:"1px"}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{background:"rgba(0,0,0,0.2)",borderRadius:"8px",padding:"9px",marginBottom:"10px"}}>
            <div style={{fontSize:"9px",color:"#f59e0b",fontWeight:"700",marginBottom:"3px"}}>🎯 PREDICCIÓN</div>
            <div style={{fontSize:"12px",color:"#cbd5e1",lineHeight:"1.6"}}>{prediccion}</div>
          </div>
          <div style={{background:"rgba(0,0,0,0.25)",borderRadius:"10px",padding:"10px",marginBottom:"8px"}}>
            <div style={{fontSize:"10px",color:"#f59e0b",fontWeight:"800",marginBottom:"8px",letterSpacing:"0.5px"}}>💰 CUOTAS CASAS DE APUESTAS</div>
            <OddsBlock team={t1}/>
            <div style={{height:"6px"}}/>
            <OddsBlock team={t2}/>
            <div style={{fontSize:"8px",color:"#1e293b",marginTop:"6px",textAlign:"center"}}>Cuota decimal · Mayor = mejor pago · Juega con responsabilidad</div>
          </div>
          <div style={{background:"rgba(0,0,0,0.25)",borderRadius:"10px",padding:"10px"}}>
            <div style={{fontSize:"10px",color:"#60a5fa",fontWeight:"800",marginBottom:"8px",letterSpacing:"0.5px"}}>📊 ÚLTIMOS 5 PARTIDOS</div>
            <FormBlock team={t1}/>
            <div style={{height:"6px"}}/>
            <FormBlock team={t2}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BÚSQUEDA ──────────────────────────────────────────────────
function SearchView(){
  const [query,setQuery]=useState("");
  const allTeams=useMemo(()=>[...new Set(Object.values(MATCH_DATA).flatMap(d=>[d.t1,d.t2]))].sort(),[]);
  const filtered=useMemo(()=>query.trim().length<2?[]:allTeams.filter(t=>t.toLowerCase().includes(query.toLowerCase())),[query,allTeams]);
  const [selected,setSelected]=useState(null);
  const teamMatches=useMemo(()=>!selected?[]:Object.entries(MATCH_DATA).filter(([,d])=>d.t1===selected||d.t2===selected).sort((a,b)=>parseInt(a[1].fecha.split(" ")[1])-parseInt(b[1].fecha.split(" ")[1])).map(([k])=>k),[selected]);
  const o=selected?ODDS[selected]:null;
  const f=selected?FORM[selected]:null;
  const rc={G:"#10b981",E:"#f59e0b",P:"#ef4444"};
  const rb={G:"rgba(16,185,129,0.12)",E:"rgba(245,158,11,0.12)",P:"rgba(239,68,68,0.12)"};
  return(
    <div style={{padding:"13px"}}>
      <div style={{position:"relative",marginBottom:"12px"}}>
        <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",fontSize:"16px"}}>🔍</span>
        <input
          value={query}
          onChange={e=>{setQuery(e.target.value);setSelected(null);}}
          placeholder="Buscar selección... ej: Colombia, España"
          style={{
            width:"100%",padding:"11px 12px 11px 38px",borderRadius:"12px",
            background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",
            color:"#e2e8f0",fontSize:"13px",outline:"none",
            boxSizing:"border-box",
          }}
        />
        {query&&<button onClick={()=>{setQuery("");setSelected(null);}} style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#475569",fontSize:"18px",cursor:"pointer"}}>✕</button>}
      </div>
      {filtered.length>0&&!selected&&(
        <div style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"10px",overflow:"hidden",marginBottom:"12px"}}>
          {filtered.slice(0,6).map(t=>(
            <div key={t} onClick={()=>{setSelected(t);setQuery(t);}} style={{
              padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.04)",
              display:"flex",alignItems:"center",justifyContent:"space-between",
            }}>
              <span style={{fontSize:"13px",color:"#e2e8f0",fontWeight:"600"}}>{t}</span>
              <span style={{fontSize:"10px",color:"#475569"}}>ver análisis →</span>
            </div>
          ))}
        </div>
      )}
      {selected&&(
        <div>
          <div style={{
            background:"linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.06))",
            border:"1px solid rgba(16,185,129,0.25)",borderRadius:"14px",padding:"14px",marginBottom:"12px",
          }}>
            <div style={{fontSize:"22px",marginBottom:"4px"}}>{selected.split(" ")[0]}</div>
            <div style={{fontSize:"17px",fontWeight:"900",color:"#e2e8f0"}}>{selected.split(" ").slice(1).join(" ")}</div>
            <div style={{fontSize:"10px",color:"#475569",marginTop:"2px"}}>Grupo {Object.values(REAL_GROUPS).find(g=>g.teams.includes(selected))?.name || ""}</div>
          </div>
          {o&&(
            <div style={{background:"rgba(0,0,0,0.25)",borderRadius:"12px",padding:"12px",marginBottom:"10px"}}>
              <div style={{fontSize:"11px",color:"#f59e0b",fontWeight:"800",marginBottom:"10px"}}>💰 CUOTAS PARA GANAR EL PARTIDO</div>
              <div style={{display:"flex",gap:"6px"}}>
                {[{name:"Bet365",val:o.bet365},{name:"Bwin",val:o.bwin},{name:"Codere",val:o.codere},{name:"Betway",val:o.betway}].map(b=>{
                  const best=Math.max(o.bet365,o.bwin,o.codere,o.betway);
                  return(
                    <div key={b.name} style={{
                      flex:1,textAlign:"center",padding:"8px 4px",borderRadius:"10px",
                      background:b.val===best?"rgba(16,185,129,0.15)":"rgba(255,255,255,0.04)",
                      border:b.val===best?"1px solid rgba(16,185,129,0.4)":"1px solid rgba(255,255,255,0.07)",
                    }}>
                      <div style={{fontSize:"9px",color:"#64748b",marginBottom:"3px"}}>{b.name}</div>
                      <div style={{fontSize:"16px",fontWeight:"900",color:b.val===best?"#10b981":"#e2e8f0"}}>{b.val.toFixed(2)}</div>
                      {b.val===best&&<div style={{fontSize:"8px",color:"#10b981",fontWeight:"700",marginTop:"1px"}}>⭐ MEJOR</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{fontSize:"8px",color:"#1e293b",marginTop:"8px",textAlign:"center"}}>Cuota decimal · Ejemplo: invertir $10 × {Math.max(o.bet365,o.bwin,o.codere,o.betway).toFixed(2)} = ${(10*Math.max(o.bet365,o.bwin,o.codere,o.betway)).toFixed(0)} · Juega con responsabilidad</div>
            </div>
          )}
          {f&&(
            <div style={{background:"rgba(0,0,0,0.25)",borderRadius:"12px",padding:"12px",marginBottom:"10px"}}>
              <div style={{fontSize:"11px",color:"#60a5fa",fontWeight:"800",marginBottom:"8px"}}>📊 ÚLTIMOS 5 PARTIDOS</div>
              <div style={{display:"flex",gap:"5px",marginBottom:"8px"}}>
                {f.map((m,i)=>(
                  <div key={i} style={{
                    flex:1,textAlign:"center",padding:"8px 3px",borderRadius:"9px",
                    background:rb[m.r],border:`1px solid ${rc[m.r]}55`,
                  }}>
                    <div style={{fontSize:"14px",fontWeight:"900",color:rc[m.r]}}>{m.r}</div>
                    <div style={{fontSize:"11px",color:"#e2e8f0",fontWeight:"800",margin:"2px 0"}}>{m.s}</div>
                    <div style={{fontSize:"8px",color:"#64748b",lineHeight:"1.2"}}>{m.vs}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"center",gap:"16px",padding:"6px",background:"rgba(255,255,255,0.03)",borderRadius:"8px"}}>
                {[["🟢","Victorias",f.filter(x=>x.r==="G").length],["🟡","Empates",f.filter(x=>x.r==="E").length],["🔴","Derrotas",f.filter(x=>x.r==="P").length]].map(([e,l,n])=>(
                  <div key={l} style={{textAlign:"center"}}>
                    <div style={{fontSize:"14px"}}>{e}</div>
                    <div style={{fontSize:"16px",fontWeight:"900",color:"#e2e8f0"}}>{n}</div>
                    <div style={{fontSize:"9px",color:"#475569"}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{marginBottom:"10px"}}>
            <div style={{fontSize:"11px",color:"#94a3b8",fontWeight:"700",marginBottom:"8px"}}>⚽ PARTIDOS EN FASE DE GRUPOS ({teamMatches.length})</div>
            <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
              {teamMatches.map(k=><MatchCard key={k} mkey={k}/>)}
            </div>
          </div>
        </div>
      )}
      {!selected&&query.trim().length<2&&(
        <div>
          <div style={{fontSize:"10px",color:"#334155",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"10px"}}>Búsquedas populares</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>
            {["🇨🇴 Colombia","🇦🇷 Argentina","🇧🇷 Brasil","🇪🇸 España","🇫🇷 Francia","🇵🇹 Portugal","🇩🇪 Alemania","🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra"].map(t=>(
              <button key={t} onClick={()=>{setQuery(t);setSelected(t);}} style={{
                padding:"6px 12px",borderRadius:"20px",border:"1px solid rgba(255,255,255,0.08)",
                background: t.includes("Colombia")?"rgba(255,215,0,0.1)":"rgba(255,255,255,0.04)",
                color: t.includes("Colombia")?"#fbbf24":"#94a3b8",
                fontSize:"11px",fontWeight:"600",cursor:"pointer",
              }}>{t}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── VISTA FECHA ───────────────────────────────────────────────
function DateView(){
  const [activeDate,setActiveDate]=useState(SORTED_DATES[0]);
  const matches=(BY_DATE[activeDate]||[]).sort((a,b)=>(MATCH_DATA[a]?.hora||"").localeCompare(MATCH_DATA[b]?.hora||""));
  return(
    <div style={{padding:"13px"}}>
      <div style={{overflowX:"auto",scrollbarWidth:"none",marginBottom:"14px"}}>
        <div style={{display:"flex",gap:"6px",paddingBottom:"4px",width:"max-content"}}>
          {SORTED_DATES.map(fecha=>{
            const isA=fecha===activeDate;
            const hasCOL=(BY_DATE[fecha]||[]).some(k=>{const d=MATCH_DATA[k];return d&&(d.t1.includes("Colombia")||d.t2.includes("Colombia"));});
            return(
              <button key={fecha} onClick={()=>setActiveDate(fecha)} style={{
                display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 10px",borderRadius:"12px",cursor:"pointer",
                background:isA?"linear-gradient(135deg,#10b981,#059669)":hasCOL?"rgba(255,215,0,0.1)":"rgba(255,255,255,0.04)",
                border:isA?"none":hasCOL?"1px solid rgba(255,215,0,0.3)":"1px solid rgba(255,255,255,0.06)",
                minWidth:"50px",
              }}>
                <span style={{fontSize:"9px",color:isA?"rgba(255,255,255,0.8)":"#475569",fontWeight:"600"}}>{DAY_NAMES[fecha]}</span>
                <span style={{fontSize:"14px",fontWeight:"900",color:isA?"white":hasCOL?"#fbbf24":"#94a3b8"}}>{fecha.split(" ")[1]}</span>
                <span style={{fontSize:"8px",color:isA?"rgba(255,255,255,0.7)":"#334155"}}>Jun</span>
                {hasCOL&&<span style={{fontSize:"8px",marginTop:"1px"}}>🇨🇴</span>}
                <span style={{fontSize:"8px",color:isA?"rgba(255,255,255,0.6)":"#1e293b",marginTop:"1px"}}>{(BY_DATE[fecha]||[]).length}p</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{
        background:"linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.05))",
        border:"1px solid rgba(16,185,129,0.18)",borderRadius:"12px",
        padding:"11px 14px",marginBottom:"11px",display:"flex",alignItems:"center",justifyContent:"space-between",
      }}>
        <div>
          <div style={{color:"#10b981",fontWeight:"800",fontSize:"15px"}}>📅 {activeDate}</div>
          <div style={{color:"#475569",fontSize:"10px",marginTop:"2px"}}>{DAY_NAMES[activeDate]} · {matches.length} partido{matches.length!==1?"s":""} · Hora Colombia</div>
        </div>
        {matches.some(k=>{const d=MATCH_DATA[k];return d&&(d.t1.includes("Colombia")||d.t2.includes("Colombia"));})&&(
          <span style={{background:"rgba(255,215,0,0.15)",border:"1px solid rgba(255,215,0,0.3)",color:"#fbbf24",fontSize:"11px",fontWeight:"700",padding:"4px 10px",borderRadius:"8px"}}>🇨🇴 Colombia</span>
        )}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"7px",marginBottom:"16px"}}>
        {matches.map(k=><MatchCard key={k} mkey={k}/>)}
      </div>
    </div>
  );
}

// ── VISTA GRUPO ───────────────────────────────────────────────
function GroupView(){
  const [ag,setAg]=useState("K");
  const gl=Object.keys(REAL_GROUPS);
  return(
    <div>
      <div style={{display:"flex",overflowX:"auto",gap:"5px",padding:"10px 13px",borderBottom:"1px solid rgba(255,255,255,0.05)",scrollbarWidth:"none"}}>
        {gl.map(l=>(
          <button key={l} onClick={()=>setAg(l)} style={{
            flexShrink:0,padding:"5px 12px",borderRadius:"20px",border:"none",cursor:"pointer",
            fontSize:"11px",fontWeight:"700",
            background:ag===l?(l==="K"?"linear-gradient(135deg,#f59e0b,#d97706)":"linear-gradient(135deg,#10b981,#059669)"):"rgba(255,255,255,0.05)",
            color:ag===l?"white":l==="K"?"#f59e0b":"#64748b",
          }}>{l}{l==="K"?" 🇨🇴":""}</button>
        ))}
      </div>
      <div style={{padding:"13px"}}>
        <div style={{
          background:ag==="K"?"linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,165,0,0.05))":"linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.05))",
          border:ag==="K"?"1px solid rgba(255,215,0,0.25)":"1px solid rgba(16,185,129,0.18)",
          borderRadius:"12px",padding:"11px 14px",marginBottom:"11px",display:"flex",alignItems:"center",gap:"10px",
        }}>
          <span style={{fontSize:"22px"}}>{REAL_GROUPS[ag].emoji}</span>
          <div>
            <div style={{color:ag==="K"?"#f59e0b":"#10b981",fontWeight:"800",fontSize:"13px",letterSpacing:"1px"}}>{REAL_GROUPS[ag].name}</div>
            <div style={{color:"#475569",fontSize:"10px",marginTop:"2px"}}>{REAL_GROUPS[ag].teams.map(t=>t.split(" ").slice(1).join(" ")).join(" · ")}</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"7px",marginBottom:"18px"}}>
          {REAL_GROUPS[ag].matches.map(k=><MatchCard key={k} mkey={k}/>)}
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.04)",paddingTop:"13px"}}>
          <div style={{color:"#1e293b",fontSize:"10px",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:"8px",textAlign:"center"}}>Cambiar grupo</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:"5px"}}>
            {gl.map(l=>(
              <button key={l} onClick={()=>{setAg(l);window.scrollTo({top:0,behavior:"smooth"});}} style={{
                background:ag===l?(l==="K"?"rgba(255,215,0,0.12)":"rgba(16,185,129,0.14)"):"rgba(255,255,255,0.02)",
                border:ag===l?(l==="K"?"1px solid rgba(255,215,0,0.35)":"1px solid rgba(16,185,129,0.4)"):"1px solid rgba(255,255,255,0.05)",
                borderRadius:"8px",padding:"7px 3px",cursor:"pointer",textAlign:"center",
              }}>
                <div style={{fontSize:"12px",marginBottom:"1px"}}>{REAL_GROUPS[l].emoji}</div>
                <div style={{color:ag===l?(l==="K"?"#f59e0b":"#10b981"):"#64748b",fontSize:"10px",fontWeight:"700"}}>{l}{l==="K"?"🇨🇴":""}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── VISTA EN VIVO (simplificada) ─────────────────────────────
function LiveView(){
  const [tab,setTab]=useState("resultados");
  const [selGrupo,setSelGrupo]=useState("A");
  
  // Datos en vivo simplificados
  const liveResults = [
    {fecha:"Jue 11 Jun", grupo:"A", status:"FT", t1:"🇲🇽 México", s1:2, s2:0, t2:"🇿🇦 Sudáfrica", hora:"14:00", sede:"Estadio Azteca", goles:["⚽ 9' Quiñones","⚽ 72' Jiménez"], resumen:"México ganó con autoridad."},
    {fecha:"Jue 11 Jun", grupo:"A", status:"FT", t1:"🇰🇷 Corea del Sur", s1:2, s2:1, t2:"🇨🇿 Rep. Checa", hora:"21:00", sede:"Guadalajara", goles:["⚽ 59' Krejci (CHE)","⚽ 67' Hwang (KOR)","⚽ 80' Oh (KOR)"], resumen:"Remontada coreana."},
  ];
  
  const upcoming = [
    {fecha:"Vie 12", hora:"14:00", t1:"🇨🇦 Canadá", t2:"🇧🇦 Bosnia", grupo:"B", sede:"Toronto"},
    {fecha:"Vie 12", hora:"20:00", t1:"🇺🇸 EE.UU.", t2:"🇵🇾 Paraguay", grupo:"D", sede:"Los Ángeles"},
  ];
  
  return(
    <div style={{padding:"13px"}}>
      <div style={{display:"flex",gap:"6px",marginBottom:"14px"}}>
        {[{id:"resultados",label:"📋 Resultados"},{id:"proximos",label:"📅 Próximos"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1,padding:"8px 4px",borderRadius:"10px",border:"none",cursor:"pointer",
            background:tab===t.id?"linear-gradient(135deg,#10b981,#059669)":"rgba(255,255,255,0.04)",
            color:tab===t.id?"white":"#64748b",fontSize:"10px",fontWeight:"700",
          }}>{t.label}</button>
        ))}
      </div>
      
      {tab==="resultados"&&(
        <div>
          {liveResults.map((r,i)=>(
            <div key={i} style={{background:"rgba(16,185,129,0.04)",borderRadius:"14px",padding:"12px",marginBottom:"10px",border:"1px solid rgba(16,185,129,0.2)"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                <span style={{background:"#10b98122",color:"#10b981",fontSize:"9px",padding:"2px 8px",borderRadius:"20px"}}>✅ FINAL</span>
                <span style={{color:"#475569",fontSize:"10px"}}>⏰ {r.hora} COL</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{flex:1,textAlign:"right",fontSize:"13px",fontWeight:"700"}}>{r.t1}</span>
                <div style={{background:"#10b98118",borderRadius:"10px",padding:"6px 14px",minWidth:"76px",textAlign:"center"}}>
                  <span style={{fontSize:"20px",fontWeight:"900"}}>{r.s1} - {r.s2}</span>
                </div>
                <span style={{flex:1,fontSize:"13px",fontWeight:"700"}}>{r.t2}</span>
              </div>
              <div style={{marginTop:"8px",display:"flex",flexWrap:"wrap",gap:"4px",justifyContent:"center"}}>
                {r.goles.map((g,j)=><span key={j} style={{fontSize:"10px",color:"#94a3b8",background:"rgba(255,255,255,0.04)",padding:"2px 7px",borderRadius:"6px"}}>{g}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {tab==="proximos"&&(
        <div>
          {upcoming.map((p,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.02)",borderRadius:"10px",padding:"10px",marginBottom:"7px",border:"1px solid rgba(255,255,255,0.07)"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                <span style={{fontSize:"10px",color:"#475569"}}>📅 {p.fecha}</span>
                <span style={{background:"rgba(245,158,11,0.12)",color:"#f59e0b",fontSize:"9px",padding:"2px 7px",borderRadius:"20px"}}>⏰ {p.hora} COL</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{flex:1,textAlign:"right",fontSize:"12px",fontWeight:"700"}}>{p.t1}</span>
                <span style={{background:"rgba(255,255,255,0.06)",color:"#64748b",fontSize:"10px",padding:"3px 8px",borderRadius:"6px"}}>VS</span>
                <span style={{flex:1,fontSize:"12px",fontWeight:"700"}}>{p.t2}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── APP PRINCIPAL ─────────────────────────────────────────────
export default function App(){
  const [vista,setVista]=useState("live");
  const tabs=[
    {id:"live", icon:"🔴",label:"En Vivo"},
    {id:"fecha",icon:"📅",label:"Fechas"},
    {id:"grupo",icon:"🏟️",label:"Grupos"},
    {id:"buscar",icon:"🔍",label:"Buscar"},
  ];
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#07101f 0%,#0d1a2e 60%,#091525 100%)",fontFamily:"'Inter',-apple-system,sans-serif",color:"#e2e8f0"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#10b981;border-radius:2px} input::placeholder{color:#334155} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      
      <div style={{background:"linear-gradient(180deg,rgba(16,185,129,0.13) 0%,transparent 100%)",borderBottom:"1px solid rgba(16,185,129,0.15)",padding:"14px 18px 10px",textAlign:"center"}}>
        <div style={{fontSize:"24px",marginBottom:"2px"}}>⚽</div>
        <h1 style={{fontSize:"19px",fontWeight:"900",background:"linear-gradient(135deg,#10b981,#34d399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:"1px"}}>MUNDIAL EBS 2026</h1>
        <p style={{color:"#64748b",fontSize:"10px",letterSpacing:"2px",textTransform:"uppercase"}}>Resultados · Pronósticos · Apuestas</p>
      </div>
      
      <FeaturedTeamsPanel />

      <div style={{display:"flex",padding:"8px 12px",gap:"5px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setVista(t.id)} style={{
            flex:1,padding:"8px 3px",borderRadius:"10px",border:"none",cursor:"pointer",
            background:vista===t.id?"linear-gradient(135deg,#10b981,#059669)":"rgba(255,255,255,0.04)",
            color:vista===t.id?"white":"#64748b",
            fontSize:"10px",fontWeight:"700",
            display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",
          }}>
            <span style={{fontSize:"14px"}}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
      
      {vista==="live"  &&<LiveView/>}
      {vista==="fecha" &&<DateView/>}
      {vista==="grupo" &&<GroupView/>}
      {vista==="buscar"&&<SearchView/>}
      
      <div style={{textAlign:"center",padding:"8px 0 18px"}}>
        <p style={{color:"#0f172a",fontSize:"9px"}}>Hora Colombia (UTC-5) · Juega con responsabilidad</p>
      </div>
    </div>
  );
}