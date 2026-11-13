/**
 * kits/rate-vessel.js — Kinetic reaction vessel (`kvessel`), choice plate (`choice`), and predict lead clip (`lead`)
 * for Quicklight (unit11). Pure painters of state and `b.clock`.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { planKineticsRun, planTwoStepRun, planInitialRate } from '../../engine/ratedata.js';
import { registerFixture } from './rate-registry.js';
import { say, frameOf } from './matter-draw.js';

const A_COL = '#d89236';
const B_COL = '#6f8fb0';
const I_COL = '#8fb86e';
const CAT_COL = '#e6c87a';
const DIM = PLATE_COLORS.dim;
const DUST = PLATE_COLORS.dust;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;

const runStart = new WeakMap();

export function replayVessels() {
  // WeakMap entries clear naturally when fixtures are replaced; kept for kit.replay/onMiss parity.
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
  h = 34,
  noRun = false,
  runLabel = 'Run',
  markedPoints = null,
  halfLives = false,
  showCounts = false,
  catalystCount = 0,
  baseline = null,
  changeDial = null,
  concDials = null,
  logTo = null,
  tapZones = null,
  pick = null,
  twoStepDial = null,
  freezeAt = null
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
      catalystCount,
      baseline,
      changeDial,
      concDials,
      logTo,
      tapZones,
      pick,
      twoStepDial,
      freezeAt,
      hidden,
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

function paintKvessel(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const hasDials = Object.keys(f.dials || {}).filter(d => !(p.hidden || []).includes(d)).length > 0;
  const topY = hasDials ? 10.5 : 4.2;

  // Title & equation
  say(ctx, p.title, F.x(2), F.y(2.5), F.size(2.3, 5.8), { color: TEXT, weight: 700, maxW: F.len(f.size.w * 0.55) });
  if (p.equation) {
    say(ctx, p.equation, F.x(f.size.w - 2), F.y(2.5), F.size(2.0, 5.2), { align: 'right', color: DIM, maxW: F.len(f.size.w * 0.42) });
  }

  // Track animation progress
  let frac = 0;
  if (p.freezeAt != null) {
    frac = p.freezeAt;
  } else if (p.ran) {
    const key = `${f.id}:${p.runSeq}`;
    if (!runStart.has(f)) runStart.set(f, { key, t0: b.clock });
    const rec = runStart.get(f);
    if (rec.key !== key) { rec.key = key; rec.t0 = b.clock; }
    const elapsed = Math.max(0, b.clock - rec.t0);
    frac = b.clock === 0 ? 1 : Math.min(1, elapsed / 1.4);
  }

  const { isTwoStep, data } = activeRunParams(f);
  const pts = data.points;
  const curIdx = Math.min(pts.length - 1, Math.round(frac * (pts.length - 1)));
  const curPt = pts[curIdx];

  // Left particle window
  const winX = 2;
  const winY = topY;
  const winW = Math.min(20, f.size.w * 0.31);
  const winH = f.size.h - topY - (p.showCounts || p.catalystCount ? 5.6 : 2.6);

  ctx.fillStyle = '#0e1116';
  ctx.fillRect(F.x(winX), F.y(winY), F.len(winW), F.len(winH));
  ctx.strokeStyle = DUST;
  ctx.strokeRect(Math.round(F.x(winX)) + 0.5, Math.round(F.y(winY)) + 0.5, Math.round(F.len(winW)), Math.round(F.len(winH)));

  const nParticles = 24;
  const aFrac = curPt.A / Math.max(1e-6, p.a0);
  const nA = Math.round(aFrac * nParticles);
  const speedScale = p.ran && frac < 1 ? 1.8 : 0.7;

  for (let i = 0; i < nParticles; i++) {
    const px = winX + 1.4 + ((hash01(i, 1) * (winW - 2.8) + b.clock * speedScale * (hash01(i, 3) - 0.5) * 4) % (winW - 2.8) + (winW - 2.8)) % (winW - 2.8);
    const py = winY + 1.4 + ((hash01(i, 2) * (winH - 2.8) + b.clock * speedScale * (hash01(i, 4) - 0.5) * 4) % (winH - 2.8) + (winH - 2.8)) % (winH - 2.8);
    let col = i < nA ? A_COL : B_COL;
    if (isTwoStep && curPt.I > 0.02 && i === nParticles - 1) col = I_COL;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(F.x(px), F.y(py), Math.max(2, F.len(0.65)), 0, Math.PI * 2);
    ctx.fill();
  }

  // Catalyst particles (unchanged count)
  for (let c = 0; c < (p.catalystCount || 0); c++) {
    const px = winX + 1.8 + ((hash01(c + 50, 5) * (winW - 3.6) + b.clock * 0.9 * (hash01(c + 50, 6) - 0.5) * 3) % (winW - 3.6) + (winW - 3.6)) % (winW - 3.6);
    const py = winY + 1.8 + ((hash01(c + 50, 7) * (winH - 3.6) + b.clock * 0.9 * (hash01(c + 50, 8) - 0.5) * 3) % (winH - 3.6) + (winH - 3.6)) % (winH - 3.6);
    ctx.strokeStyle = CAT_COL;
    ctx.lineWidth = Math.max(1.5, F.len(0.28));
    ctx.beginPath();
    ctx.arc(F.x(px), F.y(py), Math.max(2.5, F.len(0.8)), 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  if (p.showCounts) {
    const aUsed = Math.round((p.a0 - curPt.A) * 30);
    const bMade = Math.round(curPt.P * 30);
    say(ctx, `A used: ${aUsed}  B: ${bMade}`, F.x(winX), F.y(winY + winH + 2.8), F.size(1.8, 4.8), { color: AMBER, maxW: F.len(winW + 10) });
  } else if (p.catalystCount > 0) {
    say(ctx, `Catalyst: ${p.catalystCount} -> ${p.catalystCount}`, F.x(winX), F.y(winY + winH + 2.8), F.size(1.8, 4.8), { color: CAT_COL, maxW: F.len(winW + 10) });
  }

  // Right graph area
  const gx = winX + winW + 4.5;
  const gy = topY + 0.5;
  const gw = f.size.w - gx - 2.5;
  const gh = f.size.h - gy - 4.2;

  ctx.strokeStyle = DUST;
  ctx.beginPath();
  ctx.moveTo(F.x(gx), F.y(gy));
  ctx.lineTo(F.x(gx), F.y(gy + gh));
  ctx.lineTo(F.x(gx + gw), F.y(gy + gh));
  ctx.stroke();

  const maxY = Math.max(p.a0, p.stoich ? p.a0 * (p.stoich.b / p.stoich.a) : p.a0, 0.4);
  const toX = t => gx + (t / p.tMax) * gw;
  const toY = v => gy + gh - Math.min(1, Math.max(0, v / maxY)) * gh;

  say(ctx, `${maxY.toFixed(1)}`, F.x(gx - 0.8), F.y(gy + 1.2), F.size(1.5, 4.2), { align: 'right', color: DIM });
  say(ctx, `0`, F.x(gx - 0.8), F.y(gy + gh), F.size(1.5, 4.2), { align: 'right', color: DIM });
  say(ctx, `${p.tMax} s`, F.x(gx + gw), F.y(gy + gh + 2.4), F.size(1.5, 4.2), { align: 'right', color: DIM });
  say(ctx, `mol/L`, F.x(gx + 0.5), F.y(gy + 1.4), F.size(1.4, 4.0), { color: DIM });

  // Tap zones (highlight stretches along curve)
  if (p.tapZones) {
    const chosen = Math.round(f.dials.zone?.value ?? 0);
    p.tapZones.forEach((z, idx) => {
      const zx0 = gx + z.x0 * gw;
      const zx1 = gx + z.x1 * gw;
      const isChosen = chosen === idx + 1;
      ctx.fillStyle = isChosen ? 'rgba(229,155,36,0.22)' : 'rgba(255,255,255,0.04)';
      ctx.fillRect(F.x(zx0), F.y(gy), F.len(zx1 - zx0), F.len(gh));
      ctx.strokeStyle = isChosen ? AMBER : DUST;
      ctx.setLineDash(isChosen ? [] : [2, 2]);
      ctx.strokeRect(F.x(zx0), F.y(gy), F.len(zx1 - zx0), F.len(gh));
      ctx.setLineDash([]);
      say(ctx, z.label, F.x((zx0 + zx1) / 2), F.y(gy + gh - 1.5), F.size(1.6, 4.2), { align: 'center', color: isChosen ? AMBER : DIM });
    });
  }

  // Optional dashed baseline curve
  if (p.baseline) {
    const basePts = p.baseline.twoStep ? planTwoStepRun({ ...p.baseline.twoStep, tMax: p.tMax }).points : planKineticsRun({ ...p.baseline, tMax: p.tMax }).points;
    ctx.strokeStyle = DIM;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    basePts.forEach((pt, idx) => {
      const val = p.mode === 'reactant' ? pt.A : pt.P;
      if (idx === 0) ctx.moveTo(F.x(toX(pt.t)), F.y(toY(val)));
      else ctx.lineTo(F.x(toX(pt.t)), F.y(toY(val)));
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Active curve up to curIdx
  if (p.ran || p.freezeAt != null) {
    const drawCurve = (getter, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, F.len(0.38));
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
    } else if (p.mode === 'twostep') {
      drawCurve(pt => pt.P, B_COL);
      drawCurve(pt => pt.I, I_COL);
    }

    // Half-life markers
    if (p.halfLives && data.halfLives.length && frac >= 0.99) {
      let prevT = 0;
      data.halfLives.forEach(hl => {
        const hx = toX(hl.t);
        const hy = toY(hl.A);
        ctx.strokeStyle = AMBER;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(F.x(hx), F.y(gy + gh));
        ctx.lineTo(F.x(hx), F.y(hy));
        ctx.lineTo(F.x(gx), F.y(hy));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = AMBER;
        ctx.beginPath();
        ctx.arc(F.x(hx), F.y(hy), Math.max(2.5, F.len(0.55)), 0, Math.PI * 2);
        ctx.fill();
        const dt = Math.round(hl.t - prevT);
        say(ctx, `${dt} s`, F.x((toX(prevT) + hx) / 2), F.y(gy + 2.4), F.size(1.6, 4.4), { align: 'center', color: AMBER });
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
        ctx.arc(F.x(mx), F.y(my), Math.max(3, F.len(0.6)), 0, Math.PI * 2);
        ctx.fill();
        say(ctx, mp.label, F.x(mx + (mp.dx ?? 1)), F.y(my + (mp.dy ?? -1.5)), F.size(1.6, 4.3), { align: mp.align || 'left', color: AMBER, weight: 700 });
      });
    }
  } else {
    say(ctx, `Press "${p.runLabel}"`, F.x(gx + gw / 2), F.y(gy + gh / 2), F.size(1.9, 4.8), { align: 'center', color: DIM });
  }
}

function kvesselTapZones(f) {
  const p = f.props;
  if (!p.tapZones) return [];
  const hasDials = Object.keys(f.dials || {}).filter(d => !(p.hidden || []).includes(d)).length > 0;
  const topY = hasDials ? 10.5 : 4.2;
  const winW = Math.min(20, f.size.w * 0.31);
  const gx = 2 + winW + 4.5;
  const gy = topY + 0.5;
  const gw = f.size.w - gx - 2.5;
  const gh = f.size.h - gy - 4.2;
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
  const F = frameOf(b);
  const p = f.props;
  say(ctx, p.title, F.x(2), F.y(2.5), F.size(2.1, 5.4), { color: TEXT, weight: 700 });

  const gx = 4;
  const gy = 5.5;
  const gw = f.size.w - 8;
  const gh = f.size.h - 9.5;
  const phase = (b.clock * 0.45) % 1;

  if (p.scene === 'rates') {
    // Show a reaction curve climbing smoothly
    ctx.strokeStyle = DUST;
    ctx.beginPath();
    ctx.moveTo(F.x(gx), F.y(gy));
    ctx.lineTo(F.x(gx), F.y(gy + gh));
    ctx.lineTo(F.x(gx + gw), F.y(gy + gh));
    ctx.stroke();

    ctx.strokeStyle = B_COL;
    ctx.lineWidth = Math.max(2, F.len(0.35));
    ctx.beginPath();
    const steps = 30;
    const maxI = Math.max(1, Math.round(phase * steps));
    for (let i = 0; i <= maxI; i++) {
      const t = i / steps;
      const y = 1 - Math.exp(-3.5 * t);
      const px = F.x(gx + t * gw);
      const py = F.y(gy + gh - y * gh * 0.85);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    say(ctx, 'Product', F.x(gx + 1), F.y(gy + 1.5), F.size(1.6, 4.2), { color: DIM });
    say(ctx, 'Time', F.x(gx + gw), F.y(gy + gh + 2.2), F.size(1.6, 4.2), { align: 'right', color: DIM });
  } else if (p.scene === 'collide') {
    // Bouncing particles with occasional reaction flash
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(F.x(gx), F.y(gy), F.len(gw), F.len(gh));
    ctx.strokeStyle = DUST;
    ctx.strokeRect(F.x(gx), F.y(gy), F.len(gw), F.len(gh));
    for (let i = 0; i < 14; i++) {
      const px = gx + 2 + ((hash01(i, 11) * (gw - 4) + b.clock * 6 * (hash01(i, 12) - 0.5)) % (gw - 4) + (gw - 4)) % (gw - 4);
      const py = gy + 2 + ((hash01(i, 13) * (gh - 4) + b.clock * 6 * (hash01(i, 14) - 0.5)) % (gh - 4) + (gh - 4)) % (gh - 4);
      ctx.fillStyle = i < 2 ? B_COL : A_COL;
      ctx.beginPath();
      ctx.arc(F.x(px), F.y(py), Math.max(2.2, F.len(0.7)), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (p.scene === 'catalyst') {
    // Vessel with glowing catalyst particles staying bright
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(F.x(gx), F.y(gy), F.len(gw), F.len(gh));
    ctx.strokeStyle = DUST;
    ctx.strokeRect(F.x(gx), F.y(gy), F.len(gw), F.len(gh));
    for (let i = 0; i < 12; i++) {
      const px = gx + 2 + ((hash01(i, 21) * (gw - 4) + b.clock * 4 * (hash01(i, 22) - 0.5)) % (gw - 4) + (gw - 4)) % (gw - 4);
      const py = gy + 2 + ((hash01(i, 23) * (gh - 4) + b.clock * 4 * (hash01(i, 24) - 0.5)) % (gh - 4) + (gh - 4)) % (gh - 4);
      ctx.fillStyle = i % 3 === 0 ? B_COL : A_COL;
      ctx.beginPath();
      ctx.arc(F.x(px), F.y(py), Math.max(2, F.len(0.65)), 0, Math.PI * 2);
      ctx.fill();
    }
    for (let c = 0; c < 4; c++) {
      const px = gx + 3 + ((hash01(c, 31) * (gw - 6) + b.clock * 2 * (hash01(c, 32) - 0.5)) % (gw - 6) + (gw - 6)) % (gw - 6);
      const py = gy + 3 + ((hash01(c, 33) * (gh - 6) + b.clock * 2 * (hash01(c, 34) - 0.5)) % (gh - 6) + (gh - 6)) % (gh - 6);
      ctx.strokeStyle = CAT_COL;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(F.x(px), F.y(py), Math.max(2.6, F.len(0.85)), 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
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
      hidden: ['value'],
      ...(same ? { pick: { fixture: id, dial: 'value', value: same } } : {}),
      ...(plates ? { plates, taps: plates.map((v, i) => ({ x0: (w / plates.length) * i, x1: (w / plates.length) * (i + 1), y0: 0, y1: 9, dial: 'value', value: v })) } : {})
    }
  };
}

function paintChoice(ctx, f, state, b) {
  const F = frameOf(b);
  const i = Math.round(f.dials.value.value) - 1;
  const text = (f.props.options[i] ?? '').trim();
  const sz = F.size(2.6, 6.4);
  say(ctx, f.label, F.x(2), F.y(3), F.size(2.2, 5.8), { color: DIM, maxW: F.len(f.size.w - 4) });
  if (!f.props.plates) say(ctx, text || 'tap to choose', F.x(2), F.y(f.size.h - 2.6), sz, { color: text ? AMBER : DIM, weight: 700, maxW: F.len(f.size.w - 4) });
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

registerFixture('choice', { paint: paintChoice });

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
