/**
 * kits/rate-vessel.js — Kinetic reaction vessel (`kvessel`), choice plate (`choice`), and predict lead clip (`lead`)
 * for Quicklight (unit11). Pure painters of state and `b.clock`.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { planKineticsRun, planTwoStepRun, planInitialRate } from '../../engine/ratedata.js';
import { registerFixture, shapesOff } from './rate-registry.js';
import { say, frameOf } from './matter-draw.js';

const A_COL = '#f0a030';
const B_COL = '#5cc8f0';
const I_COL = '#88e060';
const CAT_COL = '#ffe066';
const DIM = PLATE_COLORS.dim;
const DUST = PLATE_COLORS.dust;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;

const runStartFlat = new Map();
const runStart3d = new Map();

export function replayVessels() {
  // Intentionally a no-op so submitting or missing never wipes finished curves.
}

function hash01(i, salt) {
  const s = Math.sin((i + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Build a kinetic vessel fixture.
 */
export function kvesselFixture(id, at, {
  title = 'Vessel',
  equation = '',
  order = 1,
  k = 0.05,
  a0 = 0.4,
  tMax = 30,
  stoich = { a: 1, b: 1 },
  mode = 'product', // 'product' | 'reactant' | 'both' | 'twostep'
  twoStep = null,
  w = 64,
  h = 38,
  noRun = false,
  runLabel = 'Run',
  markedPoints = null,
  halfLives = false,
  showCounts = false,
  speciesLabels = null,
  showLegend = false,
  catalystCount = 0,
  baseline = null,
  changeDial = null,
  concDials = null,
  concRateLaw = null,
  logTo = null,
  tapZones = null,
  pick = null,
  twoStepDial = null,
  freezeAt = null,
  extendTo = null,
  readout = null
} = {}) {
  const dials = {};
  const hidden = [];
  if (changeDial) {
    dials.change = {
      min: 1,
      max: changeDial.options.length,
      step: 1,
      value: 1,
      label: changeDial.label || 'Change',
      labels: changeDial.options
    };
  }
  if (twoStepDial) {
    dials.stepSpeed = {
      min: 1,
      max: twoStepDial.options.length,
      step: 1,
      value: 1,
      label: twoStepDial.label || 'Speed up',
      labels: twoStepDial.options
    };
  }
  if (concDials) {
    for (const [sp, cfg] of Object.entries(concDials)) {
      dials[sp] = {
        min: 1,
        max: cfg.values.length,
        step: 1,
        value: cfg.start ?? 1,
        label: cfg.label || `[${sp}]`,
        labels: cfg.values.map(v => `${v.toFixed(2)}`)
      };
    }
  }
  if (tapZones) {
    dials.zone = {
      min: 1,
      max: tapZones.length + 1,
      step: 1,
      value: tapZones.length + 1,
      label: 'Region',
      labels: [...tapZones.map(z => z.label), ' ']
    };
    hidden.push('zone');
  }

  const visDials = Object.keys(dials).filter(d => !hidden.includes(d)).length;
  const noTickLabels = Boolean(changeDial && changeDial.options.length > 3);

  return {
    id,
    kind: 'kvessel',
    label: title,
    at: { ...at },
    size: { w, h },
    noRun,
    runLabel,
    dials,
    props: {
      title,
      equation,
      order,
      k,
      a0,
      tMax,
      stoich,
      mode,
      twoStep,
      markedPoints,
      halfLives,
      showCounts,
      speciesLabels,
      showLegend,
      catalystCount,
      baseline,
      changeDial,
      concDials,
      concRateLaw,
      logTo,
      tapZones,
      pick,
      twoStepDial,
      freezeAt,
      extendTo,
      readout,
      hidden,
      top: 8.2,
      rowPitch: visDials > 1 ? 8.2 : 6.0,
      tickLabels: !noTickLabels,
      noTickLabels,
      ran: freezeAt != null,
      runSeq: 0,
      logged: []
    }
  };
}

function activeRunParams(f) {
  const p = f.props;
  let k = p.k;
  let a0 = p.a0;
  let order = p.order;
  let tMax = p.tMax;
  let stoich = p.stoich;
  let twoStep = p.twoStep ? { ...p.twoStep } : null;

  if (p.changeDial && f.dials.change) {
    const idx = Math.round(f.dials.change.value) - 1;
    const preset = p.changeDial.presets[idx];
    if (preset) {
      if (preset.k != null) k = preset.k;
      if (preset.a0 != null) a0 = preset.a0;
    }
  }
  if (p.twoStepDial && f.dials.stepSpeed && twoStep) {
    const idx = Math.round(f.dials.stepSpeed.value) - 1;
    const preset = p.twoStepDial.presets[idx];
    if (preset) {
      if (preset.k1f != null) twoStep.k1f = preset.k1f;
      if (preset.k2 != null) twoStep.k2 = preset.k2;
    }
  }
  if (twoStep) {
    return { isTwoStep: true, data: planTwoStepRun({ ...twoStep, tMax }) };
  }
  return { isTwoStep: false, data: planKineticsRun({ order, k, a0, tMax, stoich }) };
}

function runKvessel(state, fid) {
  const f = state.fixtures[fid];
  if (!f) return null;
  const p = f.props;
  p.ran = true;
  p.runSeq = (p.runSeq || 0) + 1;

  // If linked to an initial-rates log, append the measured run
  if (p.logTo && p.concDials && state.fixtures[p.logTo]) {
    const logFx = state.fixtures[p.logTo];
    const conc = {};
    for (const [sp, cfg] of Object.entries(p.concDials)) {
      const idx = Math.round(f.dials[sp]?.value ?? 1) - 1;
      conc[sp] = cfg.values[Math.max(0, Math.min(cfg.values.length - 1, idx))];
    }
    const rate = planInitialRate({
      k: p.concRateLaw?.k ?? p.k,
      orders: p.concRateLaw?.orders ?? { A: 1 },
      conc
    });
    const rows = logFx.props.rows || [];
    const exists = rows.some(r => Object.entries(conc).every(([sp, v]) => Math.abs((r[sp] ?? 0) - v) < 1e-6));
    if (!exists) {
      rows.push({ ...conc, rate });
      logFx.props.rows = rows;
    }
    p.lastConc = conc;
    p.lastRate = rate;
  }
  return { msg: `${p.title} ran.` };
}

function vesselGeom(f) {
  const p = f.props;
  const visDials = Object.keys(f.dials || {}).filter(d => !(p.hidden || []).includes(d)).length;
  const topY = visDials === 0 ? 5.2 : visDials === 1 ? 15.0 : 8.2 + (visDials - 1) * 8.2 + 6.4;
  const bottomPad = f.noRun ? 5.0 : 8.6;
  const winX = 2.5;
  const winW = Math.min(18.5, f.size.w * 0.27);
  const countH = (p.showCounts ? 2.6 : 0) + (p.catalystCount > 0 ? 2.4 : 0);
  const winH = Math.max(8, f.size.h - topY - bottomPad - countH);
  const gx = winX + winW + 6.2;
  const gy = topY + 0.4;
  const gw = Math.max(12, f.size.w - gx - 3.0);
  const gh = Math.max(8, f.size.h - gy - bottomPad);
  return { topY, bottomPad, winX, winW, winH, gx, gy, gw, gh };
}

function paintKvessel(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const { topY, winX, winW, winH, gx, gy, gw, gh } = vesselGeom(f);

  // Title & equation
  say(ctx, p.title, F.x(2), F.y(2.6), F.size(2.3, 5.8), { color: TEXT, weight: 700, maxW: F.len(f.size.w * 0.56) });
  if (p.equation) {
    say(ctx, p.equation, F.x(f.size.w - 2), F.y(2.6), F.size(2.1, 5.4), { align: 'right', color: AMBER, weight: 700, maxW: F.len(f.size.w * 0.44) });
  }

  // Track animation progress persistently by fixture id so submit/miss never wipes finished curves
  let frac = 0;
  const runStart = b.scope === '3d' ? runStart3d : runStartFlat;
  if (p.freezeAt != null) {
    frac = p.freezeAt;
  } else if (p.ran) {
    const key = `${f.id}:${p.runSeq}`;
    let rec = runStart.get(f.id);
    if (!rec || rec.key !== key || b.clock < rec.t0) {
      rec = { key, t0: b.clock };
      runStart.set(f.id, rec);
    }
    const elapsed = Math.max(0, b.clock - rec.t0);
    frac = b.clock === 0 ? 1 : Math.min(1, elapsed / 1.4);
  } else {
    runStart.delete(f.id);
  }

  const { isTwoStep, data } = activeRunParams(f);
  const pts = data.points;
  const curIdx = Math.min(pts.length - 1, Math.round(frac * (pts.length - 1)));
  const curPt = pts[curIdx];

  const W = b.bodies ? shapesOff(ctx) : ctx;
  // Left particle window
  const winY = topY;

  W.fillStyle = '#0e1116';
  W.fillRect(F.x(winX), F.y(winY), F.len(winW), F.len(winH));
  W.strokeStyle = '#7e8c9e';
  W.strokeRect(Math.round(F.x(winX)) + 0.5, Math.round(F.y(winY)) + 0.5, Math.round(F.len(winW)), Math.round(F.len(winH)));

  const changeIdx = p.changeDial && f.dials.change ? Math.round(f.dials.change.value) - 1 : -1;
  const activePreset = changeIdx >= 0 ? p.changeDial.presets[changeIdx] : null;

  const nParticles = activePreset?.moreParticles ? 32 : 22;
  const aFrac = curPt.A / Math.max(1e-6, p.a0);
  const nA = Math.round(aFrac * nParticles);
  const nI = isTwoStep ? Math.round((curPt.I / Math.max(1e-6, p.a0)) * nParticles) : 0;
  const speedScale = (p.ran && frac < 1 ? 1.8 : 0.7) * (activePreset?.hot ? 1.7 : 1.0);

  for (let i = 0; i < nParticles; i++) {
    const px = winX + 1.4 + ((hash01(i, 1) * (winW - 2.8) + b.clock * speedScale * (hash01(i, 3) - 0.5) * 4) % (winW - 2.8) + (winW - 2.8)) % (winW - 2.8);
    const py = winY + 1.4 + ((hash01(i, 2) * (winH - 2.8) + b.clock * speedScale * (hash01(i, 4) - 0.5) * 4) % (winH - 2.8) + (winH - 2.8)) % (winH - 2.8);
    let col = i < nA ? A_COL : B_COL;
    if (isTwoStep && i >= nA && i < nA + nI) col = I_COL;
    W.fillStyle = col;
    W.beginPath();
    W.arc(F.x(px), F.y(py), Math.max(2.4, F.len(0.7)), 0, Math.PI * 2);
    W.fill();
  }

  // Solid lump vs powdered solid visual for surface-area comparison
  if (activePreset?.powder) {
    W.fillStyle = '#d4b483';
    for (let s = 0; s < 10; s++) {
      const sx = winX + 2 + (s % 5) * ((winW - 4) / 4);
      const sy = winY + winH - 1.6 - Math.floor(s / 5) * 1.4;
      W.beginPath();
      W.arc(F.x(sx), F.y(sy), Math.max(1.8, F.len(0.45)), 0, Math.PI * 2);
      W.fill();
    }
  } else if (p.changeDial && p.changeDial.presets.some(pr => pr.powder)) {
    W.fillStyle = '#9e845c';
    W.fillRect(F.x(winX + winW * 0.28), F.y(winY + winH - 3.4), F.len(winW * 0.44), F.len(2.6));
  }

  // Catalyst particles (unchanged bright gold rings)
  for (let c = 0; c < (p.catalystCount || 0); c++) {
    const px = winX + 1.8 + ((hash01(c + 50, 5) * (winW - 3.6) + b.clock * 0.9 * (hash01(c + 50, 6) - 0.5) * 3) % (winW - 3.6) + (winW - 3.6)) % (winW - 3.6);
    const py = winY + 1.8 + ((hash01(c + 50, 7) * (winH - 3.6) + b.clock * 0.9 * (hash01(c + 50, 8) - 0.5) * 3) % (winH - 3.6) + (winH - 3.6)) % (winH - 3.6);
    W.strokeStyle = CAT_COL;
    W.lineWidth = Math.max(2.0, F.len(0.36));
    W.beginPath();
    W.arc(F.x(px), F.y(py), Math.max(3.0, F.len(0.95)), 0, Math.PI * 2);
    W.stroke();
    W.lineWidth = 1;
  }

  let countY = winY + winH + 2.4;
  if (p.showCounts) {
    const sa = p.stoich?.a || 1; const sb = p.stoich?.b || 1;
    const events = Math.round(((p.a0 - curPt.A) * 30) / sa);
    const aUsed = events * sa;
    const bMade = events * sb;
    const aLbl = p.speciesLabels?.a || 'A';
    const bLbl = p.speciesLabels?.b || 'B';
    say(ctx, `${aLbl} used: ${aUsed}  ${bLbl}: ${bMade}`, F.x(winX), F.y(countY), F.size(1.9, 5.0), { color: AMBER, weight: 700, maxW: F.len(winW + 14) });
    countY += 2.5;
  }
  if (p.catalystCount > 0) {
    say(ctx, `Catalyst: ${p.catalystCount}`, F.x(winX), F.y(countY), F.size(1.9, 5.0), { color: CAT_COL, weight: 700, maxW: F.len(winW + 10) });
  }

  // Right graph backdrop & grid
  ctx.fillStyle = '#141922';
  ctx.fillRect(F.x(gx), F.y(gy), F.len(gw), F.len(gh));

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(F.x(gx), F.y(gy + gh * 0.5));
  ctx.lineTo(F.x(gx + gw), F.y(gy + gh * 0.5));
  ctx.stroke();

  ctx.strokeStyle = '#8a96a6';
  ctx.beginPath();
  ctx.moveTo(F.x(gx), F.y(gy));
  ctx.lineTo(F.x(gx), F.y(gy + gh));
  ctx.lineTo(F.x(gx + gw), F.y(gy + gh));
  ctx.stroke();

  const axisTMax = p.extendTo ? Math.max(p.tMax, p.extendTo) : p.tMax;
  const maxY = Math.max(p.a0, p.stoich ? p.a0 * (p.stoich.b / p.stoich.a) : p.a0, 0.4);
  const toX = t => gx + (t / axisTMax) * gw;
  const toY = v => gy + gh - Math.min(1, Math.max(0, v / maxY)) * gh;

  say(ctx, `${maxY.toFixed(2)}`, F.x(gx - 1.0), F.y(gy + 1.4), F.size(1.65, 4.5), { align: 'right', color: TEXT });
  say(ctx, `${(maxY / 2).toFixed(2)}`, F.x(gx - 1.0), F.y(gy + gh * 0.5 + 0.6), F.size(1.5, 4.2), { align: 'right', color: DIM });
  say(ctx, `0`, F.x(gx - 1.0), F.y(gy + gh), F.size(1.65, 4.5), { align: 'right', color: TEXT });
  say(ctx, `0`, F.x(gx), F.y(gy + gh + 2.5), F.size(1.6, 4.4), { color: DIM });
  say(ctx, `${Math.round(axisTMax / 2)} s`, F.x(gx + gw * 0.5), F.y(gy + gh + 2.5), F.size(1.6, 4.4), { align: 'center', color: DIM });
  say(ctx, `${axisTMax} s`, F.x(gx + gw), F.y(gy + gh + 2.5), F.size(1.65, 4.5), { align: 'right', color: TEXT });
  const yTitle = p.mode === 'product' ? 'Product (mol/L)' : p.mode === 'reactant' ? 'Reactant (mol/L)' : 'mol/L';
  say(ctx, yTitle, F.x(gx + 0.8), F.y(gy + 1.8), F.size(1.6, 4.4), { color: TEXT });

  // Tap zones drawn as thin bottom bands so the curve stays completely uncovered
  if (p.tapZones) {
    const chosen = Math.round(f.dials.zone?.value ?? 0);
    const bandH = Math.min(6.5, gh * 0.30);
    p.tapZones.forEach((z, idx) => {
      const zx0 = gx + z.x0 * gw;
      const zx1 = gx + z.x1 * gw;
      const isChosen = chosen === idx + 1;
      ctx.fillStyle = isChosen ? 'rgba(229,155,36,0.28)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(F.x(zx0), F.y(gy + gh - bandH), F.len(zx1 - zx0), F.len(bandH));
      ctx.strokeStyle = isChosen ? AMBER : '#8a96a6';
      ctx.lineWidth = isChosen ? 2 : 1;
      ctx.strokeRect(F.x(zx0), F.y(gy + gh - bandH), F.len(zx1 - zx0), F.len(bandH));
      ctx.lineWidth = 1;
      say(ctx, z.label, F.x((zx0 + zx1) / 2), F.y(gy + gh - bandH / 2 + 0.7), F.size(1.85, 4.8), { align: 'center', color: isChosen ? AMBER : TEXT, weight: 700 });
    });
  }

  // Optional dashed baseline curve (bright and clear)
  if (p.baseline) {
    const basePts = p.baseline.twoStep ? planTwoStepRun({ ...p.baseline.twoStep, tMax: p.tMax }).points : planKineticsRun({ ...p.baseline, tMax: p.tMax }).points;
    ctx.strokeStyle = '#c2cedc';
    ctx.lineWidth = Math.max(1.8, F.len(0.32));
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    basePts.forEach((pt, idx) => {
      const val = p.mode === 'reactant' ? pt.A : pt.P;
      if (idx === 0) ctx.moveTo(F.x(toX(pt.t)), F.y(toY(val)));
      else ctx.lineTo(F.x(toX(pt.t)), F.y(toY(val)));
    });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    say(ctx, 'dashed = baseline', F.x(gx + gw - 1), F.y(gy + 1.8), F.size(1.5, 4.2), { align: 'right', color: '#c2cedc' });
  }

  // Active curve up to curIdx
  if (p.ran || p.freezeAt != null) {
    const drawCurve = (getter, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2.2, F.len(0.42));
      ctx.beginPath();
      for (let i = 0; i <= curIdx; i++) {
        const pt = pts[i];
        const x = F.x(toX(pt.t));
        const y = F.y(toY(getter(pt)));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.lineWidth = 1;
    };

    if (p.mode === 'product') drawCurve(pt => pt.P, B_COL);
    else if (p.mode === 'reactant') drawCurve(pt => pt.A, A_COL);
    else if (p.mode === 'both') {
      drawCurve(pt => pt.A, A_COL);
      drawCurve(pt => pt.P, B_COL);
      const aLbl = p.speciesLabels?.a || 'A';
      const bLbl = p.speciesLabels?.b || 'B';
      say(ctx, `— ${aLbl}`, F.x(gx + gw - 1), F.y(gy + 1.8), F.size(1.65, 4.5), { align: 'right', color: A_COL, weight: 700 });
      say(ctx, `— ${bLbl}`, F.x(gx + gw - 1), F.y(gy + 4.0), F.size(1.65, 4.5), { align: 'right', color: B_COL, weight: 700 });
    } else if (p.mode === 'twostep') {
      drawCurve(pt => pt.P, B_COL);
      drawCurve(pt => pt.I, I_COL);
      const pLbl = p.speciesLabels?.b || 'Product P';
      const iLbl = p.speciesLabels?.i || 'Interm. I';
      say(ctx, `— ${pLbl}`, F.x(gx + gw - 1), F.y(gy + 1.8), F.size(1.65, 4.5), { align: 'right', color: B_COL, weight: 700 });
      say(ctx, `— ${iLbl}`, F.x(gx + gw - 1), F.y(gy + 4.0), F.size(1.65, 4.5), { align: 'right', color: I_COL, weight: 700 });
    }

    // Optional dashed unmeasured extension beyond tMax (e.g. q3 stage 6)
    if (p.extendTo && p.extendTo > p.tMax && frac >= 0.99) {
      const ext = planKineticsRun({ order: p.order, k: p.k, a0: p.a0, tMax: p.extendTo, stoich: p.stoich }).points;
      ctx.strokeStyle = 'rgba(240,160,48,0.55)';
      ctx.lineWidth = Math.max(1.6, F.len(0.3));
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      let started = false;
      for (const pt of ext) {
        if (pt.t < p.tMax) continue;
        const x = F.x(toX(pt.t));
        const y = F.y(toY(pt.A));
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      say(ctx, 'not measured', F.x(toX((p.tMax + p.extendTo) / 2)), F.y(gy + gh - 2.2), F.size(1.45, 4.0), { align: 'center', color: DIM });
    }

    // Half-life markers with fraction labels
    if (p.halfLives && data.halfLives.length && frac >= 0.99) {
      const fracLabels = ['½ left', '¼ left', '⅛ left'];
      let prevT = 0;
      data.halfLives.forEach((hl, idx) => {
        const hx = toX(hl.t);
        const hy = toY(hl.A);
        ctx.strokeStyle = AMBER;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(F.x(hx), F.y(gy + gh));
        ctx.lineTo(F.x(hx), F.y(hy));
        ctx.lineTo(F.x(gx), F.y(hy));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = AMBER;
        ctx.beginPath();
        ctx.arc(F.x(hx), F.y(hy), Math.max(3.0, F.len(0.6)), 0, Math.PI * 2);
        ctx.fill();
        const dt = Math.round(hl.t - prevT);
        say(ctx, `${dt} s`, F.x((toX(prevT) + hx) / 2), F.y(gy + 3.0), F.size(1.85, 4.8), { align: 'center', color: AMBER, weight: 700 });
        if (fracLabels[idx]) {
          say(ctx, fracLabels[idx], F.x(gx + 1.0), F.y(hy - 0.8), F.size(1.5, 4.2), { color: AMBER });
        }
        prevT = hl.t;
      });
    }

    // Marked points
    if (p.markedPoints && frac >= 0.99) {
      p.markedPoints.forEach(mp => {
        const mx = toX(mp.t);
        const my = toY(mp.v);
        ctx.fillStyle = AMBER;
        ctx.beginPath();
        ctx.arc(F.x(mx), F.y(my), Math.max(3.4, F.len(0.7)), 0, Math.PI * 2);
        ctx.fill();
        say(ctx, mp.label, F.x(mx + (mp.dx ?? 1.4)), F.y(my + (mp.dy ?? -1.8)), F.size(1.9, 5.0), { align: mp.align || 'left', color: AMBER, weight: 700 });
      });
    }
  } else {
    say(ctx, `Press "${f.runLabel || 'Run'}"`, F.x(gx + gw / 2), F.y(gy + gh / 2), F.size(2.1, 5.4), { align: 'center', color: TEXT });
  }

  // Optional large readout strip in top-right of graph
  if (p.readout) {
    say(ctx, p.readout, F.x(gx + gw - 1), F.y(gy + 2.2), F.size(2.0, 5.2), { align: 'right', color: AMBER, weight: 700 });
  }
}

function kvesselTapZones(f) {
  const p = f.props;
  if (!p.tapZones) return [];
  const { gx, gy, gw, gh } = vesselGeom(f);
  return p.tapZones.map((z, idx) => ({
    x0: gx + z.x0 * gw,
    x1: gx + z.x1 * gw,
    y0: gy,
    y1: gy + gh,
    dial: 'zone',
    value: idx + 1
  }));
}

registerFixture('kvessel', {
  paint: paintKvessel,
  run: runKvessel,
  tapZones: kvesselTapZones,
  live: f => Boolean(f.props.ran && f.props.freezeAt == null)
});

/**
 * Predict lead clip fixture (`kind: 'lead'`) for Quicklight predict stages.
 */
export function rateLeadFixture(id, at, { scene = 'rates', title = 'Watch first', w = 66, h = 30 } = {}) {
  return {
    id,
    kind: 'lead',
    label: title,
    at: { ...at },
    size: { w, h },
    noRun: true,
    dials: {},
    props: { scene, title }
  };
}

function paintRateLead(ctx, f, state, b) {
  const W = b.bodies ? shapesOff(ctx) : ctx;
  const F = frameOf(b);
  const p = f.props;
  say(ctx, p.title, F.x(2), F.y(2.6), F.size(2.2, 5.6), { color: TEXT, weight: 700 });

  const gx = 5;
  const gy = 6.0;
  const gw = f.size.w - 10;
  const gh = f.size.h - 10.5;
  const phase = (b.clock * 0.42) % 1;

  if (p.scene === 'rates') {
    ctx.fillStyle = '#141922';
    ctx.fillRect(F.x(gx), F.y(gy), F.len(gw), F.len(gh));
    ctx.strokeStyle = '#8a96a6';
    ctx.beginPath();
    ctx.moveTo(F.x(gx), F.y(gy));
    ctx.lineTo(F.x(gx), F.y(gy + gh));
    ctx.lineTo(F.x(gx + gw), F.y(gy + gh));
    ctx.stroke();

    const drawLeadCurve = (rateK, col) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(2.2, F.len(0.4));
      ctx.beginPath();
      const steps = 36;
      const maxI = Math.max(1, Math.round(phase * steps));
      for (let i = 0; i <= maxI; i++) {
        const t = i / steps;
        const y = 1 - Math.exp(-rateK * t);
        const px = F.x(gx + t * gw);
        const py = F.y(gy + gh - y * gh * 0.85);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.lineWidth = 1;
    };
    drawLeadCurve(6.0, AMBER);
    drawLeadCurve(1.8, B_COL);
    say(ctx, 'Fast', F.x(gx + gw * 0.28), F.y(gy + gh * 0.22), F.size(1.9, 5.0), { color: AMBER, weight: 700 });
    say(ctx, 'Slow', F.x(gx + gw * 0.62), F.y(gy + gh * 0.52), F.size(1.9, 5.0), { color: B_COL, weight: 700 });
    say(ctx, 'Product', F.x(gx + 1.2), F.y(gy + 2.0), F.size(1.9, 5.0), { color: TEXT, weight: 700 });
    say(ctx, 'Time', F.x(gx + gw), F.y(gy + gh + 2.8), F.size(1.9, 5.0), { align: 'right', color: TEXT, weight: 700 });
  } else if (p.scene === 'collide') {
    const cCount = Math.floor(b.clock * 14) % 99 + 12;
    const rCount = Math.max(1, Math.floor(cCount / 22));
    say(ctx, `Collisions: ${cCount} · Reacted: ${rCount}`, F.x(f.size.w - 2), F.y(2.6), F.size(1.85, 4.8), { align: 'right', color: AMBER, weight: 700 });
    W.fillStyle = '#0e1116';
    W.fillRect(F.x(gx), F.y(gy), F.len(gw), F.len(gh));
    W.strokeStyle = '#7e8c9e';
    W.strokeRect(F.x(gx), F.y(gy), F.len(gw), F.len(gh));
    for (let i = 0; i < 16; i++) {
      const px = gx + 2 + ((hash01(i, 11) * (gw - 4) + b.clock * 9 * (hash01(i, 12) - 0.5)) % (gw - 4) + (gw - 4)) % (gw - 4);
      const py = gy + 2 + ((hash01(i, 13) * (gh - 4) + b.clock * 9 * (hash01(i, 14) - 0.5)) % (gh - 4) + (gh - 4)) % (gh - 4);
      W.fillStyle = i < 2 ? I_COL : A_COL;
      W.beginPath();
      W.arc(F.x(px), F.y(py), Math.max(2.6, F.len(0.8)), 0, Math.PI * 2);
      W.fill();
    }
  } else if (p.scene === 'catalyst') {
    const gap = 3;
    const cw = (gw - gap) / 2;
    const drawBox = (bx, label, withDust) => {
      W.fillStyle = '#0e1116';
      W.fillRect(F.x(bx), F.y(gy + 2.4), F.len(cw), F.len(gh - 2.4));
      W.strokeStyle = '#7e8c9e';
      W.strokeRect(F.x(bx), F.y(gy + 2.4), F.len(cw), F.len(gh - 2.4));
      say(ctx, label, F.x(bx + cw / 2), F.y(gy + 1.4), F.size(1.75, 4.6), { align: 'center', color: withDust ? CAT_COL : TEXT, weight: 700 });
      const nProd = withDust ? 8 : 2;
      for (let i = 0; i < 11; i++) {
        const px = bx + 2 + ((hash01(i, withDust ? 21 : 41) * (cw - 4) + b.clock * 5 * (hash01(i, 22) - 0.5)) % (cw - 4) + (cw - 4)) % (cw - 4);
        const py = gy + 4.4 + ((hash01(i, withDust ? 23 : 43) * (gh - 6.4) + b.clock * 5 * (hash01(i, 24) - 0.5)) % (gh - 6.4) + (gh - 6.4)) % (gh - 6.4);
        W.fillStyle = i < nProd ? B_COL : A_COL;
        W.beginPath();
        W.arc(F.x(px), F.y(py), Math.max(2.4, F.len(0.7)), 0, Math.PI * 2);
        W.fill();
      }
      if (withDust) {
        for (let c = 0; c < 5; c++) {
          const px = bx + 3 + ((hash01(c, 31) * (cw - 6) + b.clock * 2.5 * (hash01(c, 32) - 0.5)) % (cw - 6) + (cw - 6)) % (cw - 6);
          const py = gy + 5.2 + ((hash01(c, 33) * (gh - 8) + b.clock * 2.5 * (hash01(c, 34) - 0.5)) % (gh - 8) + (gh - 8)) % (gh - 8);
          W.strokeStyle = CAT_COL;
          W.lineWidth = 2.4;
          W.beginPath();
          W.arc(F.x(px), F.y(py), Math.max(3.4, F.len(1.1)), 0, Math.PI * 2);
          W.stroke();
          W.lineWidth = 1;
        }
      }
    };
    drawBox(gx, 'No dust (slow)', false);
    drawBox(gx + cw + gap, 'With yellow dust (fast)', true);
  }
}

registerFixture('lead', {
  paint: paintRateLead,
  live: () => true
});

/**
 * Choice plate fixture (`kind: 'choice'`), copied cleanly for `rate` kit.
 */
export function choiceFixture(id, label, at, { options, start, w = 46, same = null, plates = null } = {}) {
  const realCount = options.filter(o => String(o).trim().length > 0).length;
  return {
    id,
    kind: 'choice',
    label,
    at: { ...at },
    size: { w, h: 9 },
    noRun: true,
    dials: { value: { min: 1, max: options.length, step: 1, value: start ?? options.length, label: 'Chosen', labels: options } },
    props: {
      options,
      realCount,
      hidden: ['value'],
      ...(same ? { pick: { fixture: id, dial: 'value', value: same } } : {}),
      ...(plates ? { plates, taps: plates.map((v, i) => ({ x0: (w / plates.length) * i, x1: (w / plates.length) * (i + 1), y0: 0, y1: 9, dial: 'value', value: v })) } : {})
    }
  };
}

function choiceTapZones(f) {
  if (f.props.plates) return [];
  const n = f.props.realCount || Math.max(1, (f.props.options?.length || 1) - 1);
  const cur = Math.round(f.dials?.value?.value ?? 1);
  const next = cur >= n ? 1 : cur + 1;
  return [{ x0: 0, x1: f.size.w, y0: 0, y1: f.size.h, dial: 'value', value: next }];
}

function paintChoice(ctx, f, state, b) {
  const F = frameOf(b);
  const i = Math.round(f.dials.value.value) - 1;
  const text = (f.props.options[i] ?? '').trim();
  const sz = F.size(2.6, 6.4);
  say(ctx, f.label, F.x(2), F.y(3), F.size(2.2, 5.8), { color: DIM, maxW: F.len(f.size.w - 4) });
  if (!f.props.plates) say(ctx, text || 'tap a vessel or here', F.x(2), F.y(f.size.h - 2.6), sz, { color: text ? AMBER : DIM, weight: 700, maxW: F.len(f.size.w - 4) });
  if (f.props.plates) {
    const n = f.props.plates.length;
    const cw = f.size.w / n;
    f.props.plates.forEach((v, k) => {
      ctx.strokeStyle = i + 1 === v ? AMBER : DUST;
      ctx.strokeRect(Math.round(F.x(k * cw + 0.5)) + 0.5, Math.round(F.y(5)) + 0.5, Math.round(F.len(cw - 1)), Math.round(F.len(4)));
      say(ctx, f.props.options[v - 1], F.x(k * cw + cw / 2), F.y(7), F.size(2.1, 5.4), { align: 'center', color: i + 1 === v ? AMBER : DIM, maxW: F.len(cw - 1.4) });
    });
  }
}

registerFixture('choice', { paint: paintChoice, tapZones: choiceTapZones });

export const pickable = (fx, value, target = 'pick') => ({ ...fx, props: { ...fx.props, pick: { fixture: target, dial: 'value', value } } });

export function paintPickFrame(ctx, f, state, b) {
  const pk = f.props?.pick;
  if (!pk || pk.fixture === f.id) return;
  const chosen = Math.round(state.fixtures[pk.fixture]?.dials?.[pk.dial || 'value']?.value ?? 0);
  if (pk.value !== chosen) return;
  const F = frameOf(b);
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = Math.max(1.6, F.len(0.45));
  ctx.strokeRect(F.x(0.4), F.y(0.4), F.len(f.size.w - 0.8), F.len(f.size.h - 0.8));
  ctx.lineWidth = 1;
}

export function paintPickHint(ctx, f, state, b) {
  const pk = f.props?.pick;
  if (!pk || pk.fixture === f.id) return;
  const F = frameOf(b);
  ctx.strokeStyle = DIM;
  ctx.setLineDash([2, 3]);
  ctx.strokeRect(F.x(0.4), F.y(0.4), F.len(f.size.w - 0.8), F.len(f.size.h - 0.8));
  ctx.setLineDash([]);
}
