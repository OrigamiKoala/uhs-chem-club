/**
 * visual-devices.js — W4 Visual Devices for Learn Benches.
 *
 * SCOURED PLATE design contract:
 * - Plate grey (#6b625a / #1a1816), amber (#d99423) only when lit.
 * - Charge told by stencils (+ / -) not colour alone.
 * - Phosphor (#6f8f3f) for active readouts and measurements.
 * - Distinct geometry and stencils for all quantities.
 */

import { PLATE_COLORS, plateText } from './plates.js';

const PHOS = PLATE_COLORS.phosphor;
const AMBER = PLATE_COLORS.amber;
const STEEL = PLATE_COLORS.steel;
const DIM = PLATE_COLORS.dim;
const DUST = PLATE_COLORS.dust;

/* ==================================================================
   1. SEESAW / MASS LINE (q5-assay, boss-hopper)
   ================================================================== */

/**
 * Draw a seesaw / mass ruler under isotope bins.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {Array<{mass: number, n: number, x: number}>} bins
 * @param {number} avgMass
 * @param {object} [opts]
 */
export function drawSeesaw(ctx, x, y, w, h, bins, avgMass, opts = {}) {
  if (!bins || !bins.length) return;
  const masses = bins.map(b => b.mass);
  const minM = Math.min(...masses);
  const maxM = Math.max(...masses);
  const mSpan = Math.max(1, maxM - minM);

  const beamY = y + h * 0.45;
  const xOfMass = m => x + 20 + ((m - minM) / mSpan) * (w - 40);

  // The seesaw ruler beam
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 10, beamY);
  ctx.lineTo(x + w - 10, beamY);
  ctx.stroke();

  // Mass ticks
  const small = Math.max(9, Math.round(h * 0.22));
  for (let m = minM; m <= maxM; m++) {
    const mx = xOfMass(m);
    ctx.beginPath();
    ctx.moveTo(mx, beamY - 4);
    ctx.lineTo(mx, beamY + 4);
    ctx.stroke();
    plateText(ctx, `${m}`, mx, beamY + 6 + small, { align: 'center', size: small * 0.85, color: DIM });
  }

  // Weight tallies stacked at bin positions
  bins.forEach(b => {
    const bx = xOfMass(b.mass);
    const count = b.n || 0;
    const barH = Math.min(h * 0.35, count * 1.5);
    if (barH > 0) {
      ctx.fillStyle = DUST;
      ctx.fillRect(bx - 4, beamY - barH, 8, barH);
      ctx.strokeStyle = STEEL;
      ctx.strokeRect(bx - 4, beamY - barH, 8, barH);
    }
  });

  // Fulcrum triangle (pivot) at the average mass. It is drawn where the average falls and
  // never labelled with it: reading the position is the player's job.
  if (avgMass != null && Number.isFinite(avgMass)) {
    const fx = xOfMass(avgMass);
    const fH = Math.min(14, h * 0.35);
    ctx.fillStyle = AMBER;
    ctx.beginPath();
    ctx.moveTo(fx, beamY);
    ctx.lineTo(fx - 6, beamY + fH);
    ctx.lineTo(fx + 6, beamY + fH);
    ctx.closePath();
    ctx.fill();
    plateText(ctx, opts.fulcrumLabel || 'BALANCE POINT', fx, beamY + fH + small + 2, {
      align: 'center', size: small, color: AMBER, weight: 700
    });
  }

  // A mark the sample itself leaves on the ruler (where its weighed average falls).
  if (opts.mark != null && Number.isFinite(opts.mark)) {
    const mx = xOfMass(opts.mark);
    ctx.strokeStyle = PHOS;
    ctx.lineWidth = 2;
    ctx.setLineDash?.([4, 3]);
    ctx.beginPath();
    ctx.moveTo(mx, beamY - h * 0.4);
    ctx.lineTo(mx, beamY + 6);
    ctx.stroke();
    ctx.setLineDash?.([]);
    plateText(ctx, 'WEIGHED', mx, beamY - h * 0.4 - 2, { align: 'center', size: small * 0.85, color: PHOS, weight: 700 });
  }
}

/* ==================================================================
   2. SHARE BARS (q4-mixtures)
   ================================================================== */

/**
 * Draw stacked comparison bars: share of particles vs share of push.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {Array<{label: string, molFraction: number, pressureShare: number}>} components
 */
export function drawShareBars(ctx, x, y, w, h, components = []) {
  if (!components.length) return;
  const barH = Math.max(12, h * 0.3);
  const small = Math.max(8, Math.round(h * 0.18));
  const colors = [
    { fill: '#6f8f3f', text: '#d5e8b0' },
    { fill: '#d99423', text: '#ffe3b0' },
    { fill: '#4a758c', text: '#c5e2f0' },
    { fill: '#7c6f64', text: '#dcd6cc' }
  ];

  // Bar 1: Share of particles
  plateText(ctx, 'SHARE OF PARTICLES', x, y + small * 0.8, { size: small * 0.9, color: DIM });
  let acc1 = 0;
  components.forEach((c, idx) => {
    const segW = c.molFraction * w;
    const col = colors[idx % colors.length];
    ctx.fillStyle = col.fill;
    ctx.fillRect(x + acc1, y + small + 2, segW, barH);
    ctx.strokeStyle = '#0d0c0a';
    ctx.strokeRect(x + acc1, y + small + 2, segW, barH);
    if (segW > 24) {
      plateText(ctx, `${(c.molFraction * 100).toFixed(0)}% ${c.label}`, x + acc1 + segW / 2, y + small + 2 + barH * 0.65, {
        align: 'center', size: small * 0.85, color: '#0d0c0a', weight: 700
      });
    }
    acc1 += segW;
  });

  // Bar 2: Share of push (partial pressure)
  const y2 = y + small + barH + 12;
  plateText(ctx, 'SHARE OF PUSH (PRESSURE)', x, y2 + small * 0.8, { size: small * 0.9, color: DIM });
  let acc2 = 0;
  components.forEach((c, idx) => {
    const segW = c.pressureShare * w;
    const col = colors[idx % colors.length];
    ctx.fillStyle = col.fill;
    ctx.fillRect(x + acc2, y2 + small + 2, segW, barH);
    ctx.strokeStyle = '#0d0c0a';
    ctx.strokeRect(x + acc2, y2 + small + 2, segW, barH);
    if (segW > 24) {
      plateText(ctx, `${(c.pressureShare * 100).toFixed(0)}% ${c.label}`, x + acc2 + segW / 2, y2 + small + 2 + barH * 0.65, {
        align: 'center', size: small * 0.85, color: '#0d0c0a', weight: 700
      });
    }
    acc2 += segW;
  });
}

/* ==================================================================
   5. TUG OF WAR (q7-polarity, q1-joins)
   ================================================================== */

/**
 * Draw shared electron pair sliding toward more electronegative atom with partial charges.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {{symbol: string, en: number}} atomA left atom
 * @param {{symbol: string, en: number}} atomB right atom
 */
export function drawTugOfWar(ctx, x, y, w, h, atomA, atomB) {
  const small = Math.max(9, Math.round(h * 0.16));
  const cy = y + h * 0.5;
  const ax = x + w * 0.2;
  const bx = x + w * 0.8;

  // Connecting bond track
  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ax, cy);
  ctx.lineTo(bx, cy);
  ctx.stroke();

  // Atoms
  const r = Math.max(12, h * 0.22);
  const drawAtomDisc = (cx, atom) => {
    ctx.fillStyle = '#22201d';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = STEEL;
    ctx.stroke();
    plateText(ctx, atom.symbol, cx, cy + small * 0.35, { align: 'center', size: small * 1.1, color: '#dcd6cc', weight: 700 });
  };
  drawAtomDisc(ax, atomA);
  drawAtomDisc(bx, atomB);

  // Electronegativity difference and shift
  const delta = (atomB.en || 2.5) - (atomA.en || 2.5);
  // Shift fraction from centre: positive means sliding toward B
  const shift = Math.max(-0.25, Math.min(0.25, delta * 0.12));
  const pairX = (ax + bx) / 2 + shift * (bx - ax);

  // Shared electron pair (2 dots)
  ctx.fillStyle = PHOS;
  ctx.beginPath();
  ctx.arc(pairX - 4, cy, 3, 0, Math.PI * 2);
  ctx.arc(pairX + 4, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  // Partial charges: δ+ and δ-
  if (Math.abs(delta) >= 0.3) {
    const leftDelta = delta > 0 ? 'δ+' : 'δ−';
    const rightDelta = delta > 0 ? 'δ−' : 'δ+';
    plateText(ctx, leftDelta, ax, cy - r - 4, { align: 'center', size: small, color: AMBER, weight: 700 });
    plateText(ctx, rightDelta, bx, cy - r - 4, { align: 'center', size: small, color: AMBER, weight: 700 });

    // Dipole arrow above
    const arrowY = cy - r - small * 1.6;
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (delta > 0) {
      ctx.moveTo(ax + 10, arrowY);
      ctx.lineTo(bx - 10, arrowY);
      ctx.lineTo(bx - 16, arrowY - 4);
      ctx.moveTo(bx - 10, arrowY);
      ctx.lineTo(bx - 16, arrowY + 4);
      // Cross tail on positive end
      ctx.moveTo(ax + 14, arrowY - 4);
      ctx.lineTo(ax + 14, arrowY + 4);
    } else {
      ctx.moveTo(bx - 10, arrowY);
      ctx.lineTo(ax + 10, arrowY);
      ctx.lineTo(ax + 16, arrowY - 4);
      ctx.moveTo(ax + 10, arrowY);
      ctx.lineTo(ax + 16, arrowY + 4);
      ctx.moveTo(bx - 14, arrowY - 4);
      ctx.lineTo(bx - 14, arrowY + 4);
    }
    ctx.stroke();
  }
}

/** Row and column of each element on the first four periods of the 18-column table. */
const GRID_LAYOUT = {
  H: [0, 0], He: [0, 17],
  Li: [1, 0], Be: [1, 1], B: [1, 12], C: [1, 13], N: [1, 14], O: [1, 15], F: [1, 16], Ne: [1, 17],
  Na: [2, 0], Mg: [2, 1], Al: [2, 12], Si: [2, 13], P: [2, 14], S: [2, 15], Cl: [2, 16], Ar: [2, 17],
  K: [3, 0], Ca: [3, 1], Sc: [3, 2], Ti: [3, 3], V: [3, 4], Cr: [3, 5], Mn: [3, 6],
  Fe: [3, 7], Co: [3, 8], Ni: [3, 9], Cu: [3, 10], Zn: [3, 11],
  Ga: [3, 12], Ge: [3, 13], As: [3, 14], Se: [3, 15], Br: [3, 16], Kr: [3, 17]
};

/* ==================================================================
   7. TREND MAP (q8-trends, q7-pes)
   ================================================================== */

/**
 * Draw a mini periodic table whose cells fill as atoms are measured.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {Record<string, {val: number, label?: string}>} measured
 * @param {{minVal?: number, maxVal?: number, title?: string}} [spec]
 */
export function drawTrendMap(ctx, x, y, w, h, measured = {}, spec = {}) {
  const COLS = 18;
  const ROWS = 4;
  const cellW = (w - 4) / COLS;
  const cellH = (h - 20) / ROWS;
  const small = Math.max(7, Math.round(cellH * 0.45));

  if (spec.title) {
    plateText(ctx, spec.title.toUpperCase(), x + 2, y + 10, { size: small * 0.9, color: DIM });
  }


  const minV = spec.minVal ?? 0;
  const maxV = spec.maxVal ?? 100;

  for (const [sym, [row, col]] of Object.entries(GRID_LAYOUT)) {
    const cx = x + col * cellW;
    const cy = y + 16 + row * cellH;
    const data = measured[sym];

    ctx.strokeStyle = '#2b2824';
    ctx.lineWidth = 1;

    if (data && data.val != null) {
      const frac = Math.max(0, Math.min(1, (data.val - minV) / Math.max(1e-6, maxV - minV)));
      ctx.fillStyle = `rgba(111, 143, 63, ${0.25 + 0.65 * frac})`;
      ctx.fillRect(cx + 0.5, cy + 0.5, cellW - 1, cellH - 1);
      ctx.strokeRect(cx + 0.5, cy + 0.5, cellW - 1, cellH - 1);
      plateText(ctx, sym, cx + cellW / 2, cy + cellH * 0.45, { align: 'center', size: small * 0.85, color: '#dcd6cc', weight: 700 });
      plateText(ctx, `${data.val.toFixed(0)}`, cx + cellW / 2, cy + cellH * 0.88, { align: 'center', size: small * 0.72, color: PHOS });
    } else {
      ctx.strokeRect(cx + 0.5, cy + 0.5, cellW - 1, cellH - 1);
      plateText(ctx, sym, cx + cellW / 2, cy + cellH * 0.65, { align: 'center', size: small * 0.75, color: '#544e46' });
    }
  }
}

/* ==================================================================
   8. MOLE MAP (q6-weigh, q3-ideal, Kettle)
   ================================================================== */

/**
 * Draw grams ⇄ moles ⇄ particles conversion road map.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {'mass-to-moles'|'moles-to-mass'|'moles-to-particles'|'particles-to-moles'|null} [activeArrow]
 * @param {{molarMass?: number}} [opts]
 */
export function drawMoleMap(ctx, x, y, w, h, activeArrow = null, opts = {}) {
  const boxW = w * 0.26;
  const boxH = Math.max(24, h * 0.45);
  const small = Math.max(8, Math.round(boxH * 0.28));
  const by = y + h * 0.35;

  const bx1 = x;
  const bx2 = x + w * 0.37;
  const bx3 = x + w * 0.74;

  const drawBox = (bx, title, sub) => {
    ctx.fillStyle = '#1a1816';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = STEEL;
    ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);
    plateText(ctx, title, bx + boxW / 2, by + boxH * 0.42, { align: 'center', size: small, color: '#dcd6cc', weight: 700 });
    plateText(ctx, sub, bx + boxW / 2, by + boxH * 0.8, { align: 'center', size: small * 0.75, color: DIM });
  };

  drawBox(bx1, 'MASS', 'grams (g)');
  drawBox(bx2, 'AMOUNT', 'moles (mol)');
  drawBox(bx3, 'COUNT', 'particles');

  const mm = opts.molarMass ? `M (${opts.molarMass} g/mol)` : 'Molar Mass (M)';

  // Arrow 1: Mass ⇄ Moles
  const a1X0 = bx1 + boxW + 2;
  const a1X1 = bx2 - 2;
  const a1Mid = (a1X0 + a1X1) / 2;

  // Forward: Mass -> Moles (divide by M)
  const isA1Fwd = activeArrow === 'mass-to-moles';
  ctx.strokeStyle = isA1Fwd ? AMBER : STEEL;
  ctx.fillStyle = isA1Fwd ? AMBER : STEEL;
  ctx.lineWidth = isA1Fwd ? 2 : 1;
  ctx.beginPath();
  ctx.moveTo(a1X0, by + boxH * 0.3);
  ctx.lineTo(a1X1, by + boxH * 0.3);
  ctx.lineTo(a1X1 - 4, by + boxH * 0.3 - 3);
  ctx.moveTo(a1X1, by + boxH * 0.3);
  ctx.lineTo(a1X1 - 4, by + boxH * 0.3 + 3);
  ctx.stroke();
  plateText(ctx, `÷ ${mm}`, a1Mid, by + boxH * 0.3 - 4, { align: 'center', size: small * 0.7, color: isA1Fwd ? AMBER : DIM });

  // Reverse: Moles -> Mass (multiply by M)
  const isA1Rev = activeArrow === 'moles-to-mass';
  ctx.strokeStyle = isA1Rev ? AMBER : STEEL;
  ctx.fillStyle = isA1Rev ? AMBER : STEEL;
  ctx.lineWidth = isA1Rev ? 2 : 1;
  ctx.beginPath();
  ctx.moveTo(a1X1, by + boxH * 0.7);
  ctx.lineTo(a1X0, by + boxH * 0.7);
  ctx.lineTo(a1X0 + 4, by + boxH * 0.7 - 3);
  ctx.moveTo(a1X0, by + boxH * 0.7);
  ctx.lineTo(a1X0 + 4, by + boxH * 0.7 + 3);
  ctx.stroke();
  plateText(ctx, `× ${mm}`, a1Mid, by + boxH * 0.7 + small * 0.9, { align: 'center', size: small * 0.7, color: isA1Rev ? AMBER : DIM });

  // Arrow 2: Moles ⇄ Particles
  const a2X0 = bx2 + boxW + 2;
  const a2X1 = bx3 - 2;
  const a2Mid = (a2X0 + a2X1) / 2;

  // Forward: Moles -> Particles (multiply by N_A)
  const isA2Fwd = activeArrow === 'moles-to-particles';
  ctx.strokeStyle = isA2Fwd ? AMBER : STEEL;
  ctx.fillStyle = isA2Fwd ? AMBER : STEEL;
  ctx.lineWidth = isA2Fwd ? 2 : 1;
  ctx.beginPath();
  ctx.moveTo(a2X0, by + boxH * 0.3);
  ctx.lineTo(a2X1, by + boxH * 0.3);
  ctx.lineTo(a2X1 - 4, by + boxH * 0.3 - 3);
  ctx.moveTo(a2X1, by + boxH * 0.3);
  ctx.lineTo(a2X1 - 4, by + boxH * 0.3 + 3);
  ctx.stroke();
  plateText(ctx, '× 6.02 × 10²³', a2Mid, by + boxH * 0.3 - 4, { align: 'center', size: small * 0.7, color: isA2Fwd ? AMBER : DIM });

  // Reverse: Particles -> Moles (divide by N_A)
  const isA2Rev = activeArrow === 'particles-to-moles';
  ctx.strokeStyle = isA2Rev ? AMBER : STEEL;
  ctx.fillStyle = isA2Rev ? AMBER : STEEL;
  ctx.lineWidth = isA2Rev ? 2 : 1;
  ctx.beginPath();
  ctx.moveTo(a2X1, by + boxH * 0.7);
  ctx.lineTo(a2X0, by + boxH * 0.7);
  ctx.lineTo(a2X0 + 4, by + boxH * 0.7 - 3);
  ctx.moveTo(a2X0, by + boxH * 0.7);
  ctx.lineTo(a2X0 + 4, by + boxH * 0.7 + 3);
  ctx.stroke();
  plateText(ctx, '÷ 6.02 × 10²³', a2Mid, by + boxH * 0.7 + small * 0.9, { align: 'center', size: small * 0.7, color: isA2Rev ? AMBER : DIM });
}


/* ==================================================================
   9. PERIODIC STRIP (q6-filling)
   ================================================================== */

/**
 * The first four periods of the table with the element for `z` lit and the ones before it
 * shaded, so adding an electron to a rack walks a lit cell across the table.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} z electrons on the rack
 * @param {(z: number) => string|null} symbolOf
 */
export function drawPeriodicStrip(ctx, x, y, w, h, z, symbolOf) {
  const COLS = 18;
  const ROWS = 4;
  const cellW = (w - 4) / COLS;
  const cellH = (h - 4) / ROWS;
  const small = Math.max(7, Math.round(Math.min(cellH * 0.55, cellW * 0.55)));
  const bySym = {};
  for (let n = 1; n <= 36; n++) { const sym = symbolOf(n); if (sym) bySym[sym] = n; }
  for (const [sym, [row, col]] of Object.entries(GRID_LAYOUT)) {
    const n = bySym[sym];
    const cx = x + 2 + col * cellW;
    const cy = y + 2 + row * cellH;
    const here = n === z;
    const before = n != null && n < z;
    ctx.fillStyle = here ? AMBER : before ? '#2e2a26' : '#141311';
    ctx.fillRect(cx + 0.5, cy + 0.5, cellW - 1, cellH - 1);
    ctx.strokeStyle = STEEL;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx + 0.5, cy + 0.5, cellW - 1, cellH - 1);
    plateText(ctx, sym, cx + cellW / 2, cy + cellH * 0.68, { align: 'center', size: small, color: here ? '#0d0c0a' : before ? '#b8afa0' : '#544e46', weight: here ? 700 : 400 });
  }
}
