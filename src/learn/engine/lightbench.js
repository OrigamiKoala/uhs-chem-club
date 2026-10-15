/**
 * lightbench.js — The light bench, Lanternfall's instrument.
 *
 * One bench with interchangeable heads, the way the join bench is one bench at
 * two scales. A lamp you can tune (a wavelength dial, with the wavelength
 * printed beside it in nm) and a brightness dial; the light passes through a
 * slot and lands on a screen. What the screen shows depends on the head the
 * stage declares:
 *
 *   trace      the wave drawn against a ruler, and a timing gate that counts
 *              the crests passing each second
 *   scale      a log ruler from nanometres to kilometres, for sources too far
 *              from the eye to draw as a wave
 *   prism      the light spread into a band on a scale in nm, with detector
 *              strips past both ends (hot filament: unbroken; gas tube:
 *              bright lines; filament through cool gas: dark lines)
 *   ladder     the energy-ladder plate of hydrogen: rungs by energy, with the
 *              jump that makes a line lit when that line is tapped
 *   photocell  a metal plate in a vacuum tube, with a counter (electrons freed
 *              per second) and a speed meter (the fastest of them)
 *   cuvette    a solution in a cuvette, a path length, an absorbance readout,
 *              and the molecule's own motion under each kind of light
 *   plot       a calibration plot of absorbance against concentration
 *
 * EVERY READING IS DERIVED, NEVER AUTHORED. The pictures are drawn from the
 * pure planners in `lightdata.js` (`planTrace`, `planPrism`, `planPhotocell`,
 * `planAbsorb`, `planRegion`), over the real tables there, so the screen and
 * the answer a stage grades against cannot drift. The instrument knows no
 * chemistry: a quest declares its rigs and what words to print on them.
 *
 * Aesthetic contract (CLAUDE.md §4, §8): phosphor on a recessed plate, nothing
 * blooms. Colour is a convenience on the trace and the band; every reading is
 * also a number and a position, never colour alone.
 */

import { PlateBench, PLATE_COLORS, plateText, raster, aperture, mulberry32, hashId } from './plates.js';
import {
  planTrace, planPrism, planPhotocell, planAbsorb, planRegion, wavelengthRgb,
  isVisible, regionOf, detectorFor, planJump, jumpForLine, bohrJoules,
  VISIBLE, PRISM_RANGE, SOLUTES, METALS, LINES, ABSORBANCE_CEILING, photonEv,
  fmtSig, freqE14
} from './lightdata.js';

export { planTrace, planPrism, planPhotocell, planAbsorb, planRegion, wavelengthRgb };

const rgbCss = (rgb, a = 1) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;

/* ------------------------------------------------------------------
   WORDS. A word a stage has not earned is printed in plain English.
   ------------------------------------------------------------------ */
const PLAIN = {
  spacing: 'Crest to crest',
  rate: 'Crests per second',
  band: 'Band',
  lines: 'Lines',
  count: 'Electrons freed per second',
  speed: 'Fastest electron',
  absorb: 'Dimming'
};

function words(cfg) { return { ...PLAIN, ...(cfg.labels || {}) }; }

/* ------------------------------------------------------------------
   THE HEADS
   ------------------------------------------------------------------ */

/** Which wavelength a rig is lit at right now. */
export function rigNm(rig, cfg) {
  if (rig.tuned) return cfg.settings?.[Math.max(0, (cfg.setting || 1) - 1)] ?? null;
  return rig.nm ?? null;
}

/* ---- trace ---- */

function drawTrace(ctx, w, h, rig, cfg, o) {
  const nm = rigNm(rig, cfg);
  const L = words(cfg);
  const padX = Math.max(10, w * 0.035);
  const plotW = w - padX * 2;
  const top = h * 0.22;
  const rulerY = h * 0.86;
  const midY = (top + rulerY) / 2 - h * 0.02;
  const amp = (rulerY - top) * 0.34;
  const hits = [{ key: 'wave', x0: 0, y0: top - 8, x1: w, y1: rulerY + 8 }];

  if (nm == null) {
    plateText(ctx, 'LAMP OFF', w / 2, h / 2, { align: 'center', size: Math.max(12, h * 0.07), color: PLATE_COLORS.dim });
    return hits;
  }
  const plan = planTrace(nm);
  const rgb = plan.rgb;
  const wave = rgb ? rgbCss(rgb) : PLATE_COLORS.dust;
  const pxPerNm = plotW / plan.span;
  const wavelengthPx = nm * pxPerNm;

  // Shared time base and constant on-screen wave speed (px/sec)
  const t = (o.bench?.clock || 0);
  const waveSpeed = 130;
  const phase = (t * waveSpeed) / wavelengthPx;

  // The ruler: ticks every 100 nm, numbered every 400.
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, rulerY);
  ctx.lineTo(padX + plotW, rulerY);
  ctx.stroke();
  const small = Math.max(10, h * 0.055);
  for (let n = 0; n <= plan.span; n += 100) {
    const x = padX + n * pxPerNm;
    const major = n % 400 === 0;
    ctx.beginPath();
    ctx.moveTo(x, rulerY);
    ctx.lineTo(x, rulerY + (major ? h * 0.035 : h * 0.02));
    ctx.stroke();
    if (major) plateText(ctx, String(n), x, rulerY + h * 0.035 + small, { align: 'center', size: small * 0.9, color: PLATE_COLORS.dim });
  }
  plateText(ctx, 'nm', padX + plotW, rulerY + h * 0.035 + small, { align: 'right', size: small * 0.9, color: PLATE_COLORS.dim });

  // The wave, traveling left-to-right at constant on-screen speed.
  ctx.strokeStyle = wave;
  ctx.lineWidth = Math.max(2, h * 0.012);
  ctx.beginPath();
  const steps = Math.min(1600, Math.round(plotW * 2));
  for (let i = 0; i <= steps; i++) {
    const x = padX + (i / steps) * plotW;
    const y = midY - amp * Math.cos(2 * Math.PI * (((x - padX) / wavelengthPx) - phase));
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // A faint centre line, so a crest reads as a crest.
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.beginPath(); ctx.moveTo(padX, midY); ctx.lineTo(padX + plotW, midY); ctx.stroke();
  ctx.globalAlpha = 1;

  // The timing gate on the right: flashes on each crest
  const gateX = padX + plotW;
  const gatePhase = (plotW / wavelengthPx) - phase;
  const gateLit = Math.cos(2 * Math.PI * gatePhase) > 0.8;
  ctx.strokeStyle = gateLit ? PLATE_COLORS.amber : PLATE_COLORS.steel;
  ctx.lineWidth = gateLit ? 3 : 1.5;
  ctx.beginPath();
  ctx.moveTo(gateX, midY - amp * 1.15);
  ctx.lineTo(gateX, midY + amp * 1.15);
  ctx.stroke();
  if (gateLit) {
    ctx.fillStyle = PLATE_COLORS.amber;
    ctx.beginPath();
    ctx.arc(gateX, midY, Math.max(3, h * 0.02), 0, Math.PI * 2);
    ctx.fill();
  }

  // Top header: colour chip, wavelength box, frequency box side by side
  const gy = h * 0.04;
  const gh = h * 0.14;
  const chipW = Math.max(16, h * 0.12);

  // Colour chip
  ctx.fillStyle = rgb ? rgbCss(rgb) : '#2a2723';
  ctx.fillRect(padX, gy, chipW, gh);
  ctx.strokeStyle = PLATE_COLORS.rim;
  ctx.strokeRect(padX + 0.5, gy + 0.5, chipW - 1, gh - 1);
  if (!rgb) plateText(ctx, '--', padX + chipW / 2, gy + gh * 0.66, { align: 'center', size: gh * 0.4, color: PLATE_COLORS.dim });

  const readoutsX = padX + chipW + 8;
  const totalW = w - padX - readoutsX;
  const boxW = (totalW - 6) / 2;

  // Box 1: Wavelength
  ctx.fillStyle = '#16140f';
  ctx.fillRect(readoutsX, gy, boxW, gh);
  ctx.strokeStyle = PLATE_COLORS.rim;
  ctx.strokeRect(readoutsX + 0.5, gy + 0.5, boxW - 1, gh - 1);
  plateText(ctx, L.spacing.toUpperCase(), readoutsX + 6, gy + gh * 0.38, { size: Math.max(7, gh * 0.28), color: PLATE_COLORS.dim });
  plateText(ctx, `${fmtSig(nm)} nm`, readoutsX + boxW - 6, gy + gh * 0.84, {
    align: 'right', size: Math.max(10, gh * 0.46), color: PLATE_COLORS.phosphor, weight: 700
  });

  // Box 2: Frequency
  const fBoxX = readoutsX + boxW + 6;
  ctx.fillStyle = '#16140f';
  ctx.fillRect(fBoxX, gy, boxW, gh);
  ctx.strokeStyle = gateLit ? PLATE_COLORS.amber : PLATE_COLORS.rim;
  ctx.strokeRect(fBoxX + 0.5, gy + 0.5, boxW - 1, gh - 1);
  plateText(ctx, L.rate.toUpperCase(), fBoxX + 6, gy + gh * 0.38, { size: Math.max(7, gh * 0.28), color: PLATE_COLORS.dim });
  plateText(ctx, `${plan.e14.toFixed(2)} x 10^14 / s`, fBoxX + boxW - 6, gy + gh * 0.84, {
    align: 'right', size: Math.max(10, gh * 0.46), color: gateLit ? PLATE_COLORS.amber : PLATE_COLORS.phosphor, weight: 700
  });

  // A tap leaves a bracket across one crest-to-crest span and prints it as a ruler.
  const probed = o.probe && o.probe.plateId === rig.id && o.probe.nm === nm ? o.probe : null;
  if (probed) {
    const x0 = padX;
    const x1 = padX + wavelengthPx;
    const by = midY - amp - h * 0.05;
    ctx.strokeStyle = PLATE_COLORS.amber;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, by); ctx.lineTo(x1, by);
    ctx.moveTo(x0, by - 5); ctx.lineTo(x0, by + 5);
    ctx.moveTo(x1, by - 5); ctx.lineTo(x1, by + 5);
    ctx.stroke();
    plateText(ctx, `${L.spacing}: ${fmtSig(nm)} nm`, (x0 + x1) / 2, by - 8, {
      align: x1 - x0 < plotW * 0.4 ? 'left' : 'center', size: Math.max(10, h * 0.06), color: PLATE_COLORS.amber, weight: 700
    });
  }
  return hits;
}

/* ---- log scale ---- */

const LOG_LO = -1;   // 0.1 nm
const LOG_HI = 10;   // 10 m ... 10^10 nm

function fmtLength(nm) {
  if (nm >= 1e9) return `${fmtSig(nm / 1e9)} m`;
  if (nm >= 1e7) return `${fmtSig(nm / 1e7)} cm`;
  if (nm >= 1e6) return `${fmtSig(nm / 1e6)} mm`;
  if (nm >= 1e3) return `${fmtSig(nm / 1e3)} um`;
  return `${fmtSig(nm)} nm`;
}
export { fmtLength };

function drawScale(ctx, w, h, rig, cfg, o) {
  const nm = rig.nm;
  const padX = Math.max(14, w * 0.05);
  const plotW = w - padX * 2;
  const y = h * 0.6;
  const xOf = v => padX + ((v - LOG_LO) / (LOG_HI - LOG_LO)) * plotW;
  const small = Math.max(9, h * 0.055);

  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(padX + plotW, y); ctx.stroke();
  for (let d = LOG_LO; d <= LOG_HI; d++) {
    const x = xOf(d);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h * 0.04); ctx.stroke();
    const label = d === -1 ? '0.1 nm' : d === 0 ? '1 nm' : d === 3 ? '1 um' : d === 6 ? '1 mm' : d === 8 ? '10 cm' : d === 9 ? '1 m' : d === 10 ? '10 m' : null;
    if (label) plateText(ctx, label, x, y + h * 0.04 + small, { align: 'center', size: small, color: PLATE_COLORS.dim });
  }

  // Everyday-sized objects beside the ruler ticks
  const OBJECTS = {
    '-1': 'atom',
    '3': 'cell',
    '6': 'pinhead',
    '8': 'coin',
    '9': 'person',
    '10': 'building'
  };
  for (const [dStr, name] of Object.entries(OBJECTS)) {
    const dVal = Number(dStr);
    const ox = xOf(dVal);
    ctx.beginPath(); ctx.moveTo(ox, y - h * 0.035); ctx.lineTo(ox, y); ctx.stroke();
    plateText(ctx, name, ox, y - h * 0.035 - small * 0.25, { align: 'center', size: small * 0.85, color: PLATE_COLORS.amber });
  }

  plateText(ctx, 'WAVELENGTH, EACH TICK TEN TIMES THE LAST', w / 2, h * 0.9, { align: 'center', size: small * 0.9, color: PLATE_COLORS.dim });

  // The visible band, for a sense of where the eye sits on the ruler.
  ctx.fillStyle = 'rgba(184, 175, 160, 0.16)';
  ctx.fillRect(xOf(Math.log10(VISIBLE.min)), y - h * 0.08, xOf(Math.log10(VISIBLE.max)) - xOf(Math.log10(VISIBLE.min)), h * 0.16);

  if (nm) {
    const x = xOf(Math.log10(nm));
    ctx.fillStyle = PLATE_COLORS.phosphor;
    ctx.fillRect(x - 2, y - h * 0.25, 4, h * 0.25);
    plateText(ctx, fmtLength(nm), Math.min(w - padX, Math.max(padX, x)), y - h * 0.3, {
      align: x > w * 0.7 ? 'right' : x < w * 0.3 ? 'left' : 'center', size: Math.max(12, h * 0.1), color: PLATE_COLORS.phosphor, weight: 700
    });
  }
  return [{ key: 'scale', x0: 0, y0: 0, x1: w, y1: h }];
}

/* ---- prism ---- */

function drawPrism(ctx, w, h, rig, cfg, o) {
  const plan = planPrism(rig);
  const padX = Math.max(22, w * 0.1);
  const plotW = w - padX * 2;
  const bandY = h * 0.3;
  const bandH = h * 0.34;
  const xOf = nm => padX + ((nm - PRISM_RANGE.lo) / (PRISM_RANGE.hi - PRISM_RANGE.lo)) * plotW;
  const L = words(cfg);
  const small = Math.max(9, h * 0.055);

  // The band: dark, or an unbroken spread of the spectrum.
  ctx.fillStyle = '#080706';
  ctx.fillRect(padX, bandY, plotW, bandH);
  if (plan.continuous) {
    for (let x = 0; x < plotW; x++) {
      const nm = PRISM_RANGE.lo + (x / plotW) * (PRISM_RANGE.hi - PRISM_RANGE.lo);
      const rgb = wavelengthRgb(nm);
      if (rgb) { ctx.fillStyle = rgbCss(rgb); ctx.fillRect(padX + x, bandY, 1.2, bandH); }
    }
    for (const nm of plan.dark) {
      ctx.fillStyle = '#080706';
      ctx.fillRect(xOf(nm) - 1.5, bandY, 3, bandH);
    }
  } else {
    for (const nm of plan.bright) {
      const rgb = wavelengthRgb(nm) || [200, 200, 200];
      ctx.fillStyle = rgbCss(rgb);
      ctx.fillRect(xOf(nm) - 1.5, bandY, 3, bandH);
    }
  }
  ctx.strokeStyle = PLATE_COLORS.rim;
  ctx.strokeRect(padX + 0.5, bandY + 0.5, plotW - 1, bandH - 1);

  if (rig.overlay && Array.isArray(rig.overlay)) {
    const oy = bandY + bandH * 0.45;
    ctx.fillStyle = 'rgba(235, 175, 45, 0.15)';
    ctx.fillRect(padX, oy, plotW, bandH * 0.55);
    ctx.strokeStyle = PLATE_COLORS.amber;
    ctx.strokeRect(padX + 0.5, oy + 0.5, plotW - 1, bandH * 0.55 - 1);
    for (const nm of rig.overlay) {
      const x = xOf(nm);
      ctx.strokeStyle = PLATE_COLORS.amber;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy + bandH * 0.55); ctx.stroke();
    }
    plateText(ctx, 'REF STRIP', padX + 4, oy + small * 0.9, { size: small * 0.8, color: PLATE_COLORS.amber, weight: 700 });
  }

  // The scale.
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.fillStyle = PLATE_COLORS.steel;
  for (let nm = 400; nm <= 700; nm += 50) {
    const x = xOf(nm);
    const major = nm % 100 === 0;
    ctx.beginPath(); ctx.moveTo(x, bandY + bandH); ctx.lineTo(x, bandY + bandH + (major ? h * 0.04 : h * 0.025)); ctx.stroke();
    if (major) plateText(ctx, String(nm), x, bandY + bandH + h * 0.04 + small, { align: 'center', size: small, color: PLATE_COLORS.dim });
  }
  plateText(ctx, 'nm', padX + plotW, bandY + bandH + h * 0.04 + small, { align: 'right', size: small, color: PLATE_COLORS.dim });

  // Detector strips past each end of the band: they read what the eye cannot.
  if (cfg.detectors !== false) {
    const dw = Math.max(16, padX * 0.62);
    const strip = (x, label, lit) => {
      ctx.fillStyle = lit ? PLATE_COLORS.phosphor : '#17150f';
      ctx.fillRect(x, bandY, dw, bandH);
      ctx.strokeStyle = PLATE_COLORS.rim;
      ctx.strokeRect(x + 0.5, bandY + 0.5, dw - 1, bandH - 1);
      plateText(ctx, label, x + dw / 2, bandY - h * 0.025, { align: 'center', size: small, color: lit ? PLATE_COLORS.phosphor : PLATE_COLORS.dim, weight: 700 });
    };
    const uv = plan.glowsBeyond || plan.beyond.some(n => detectorFor(n) === 'ultraviolet');
    const ir = plan.glowsBeyond || plan.beyond.some(n => detectorFor(n) === 'infrared');
    strip(padX - dw - 3, 'UV', uv);
    strip(padX + plotW + 3, 'IR', ir);
  }

  // A tap reads the position under it; a line snaps to its own figure.
  const probed = o.probe && o.probe.plateId === rig.id && o.probe.prism ? o.probe : null;
  if (probed) {
    const x = xOf(probed.nm);
    ctx.strokeStyle = PLATE_COLORS.amber;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, bandY - 4); ctx.lineTo(x, bandY + bandH + 4); ctx.stroke();
    plateText(ctx, `${fmtSig(probed.nm)} nm`, Math.min(w - padX, Math.max(padX, x)), h * 0.9, {
      align: 'center', size: Math.max(12, h * 0.075), color: PLATE_COLORS.amber, weight: 700
    });
  } else if (plan.glowsBeyond || plan.continuous === false || plan.dark.length) {
    // Idle caption: what kind of picture this is is for the player to say.
  }
  plateText(ctx, L.band.toUpperCase(), padX, h * 0.12, { size: small, color: PLATE_COLORS.dim });
  return [{ key: 'band', x0: padX, y0: bandY - 4, x1: padX + plotW, y1: bandY + bandH + 4, plan }];
}

/* ---- ladder ---- */

const LADDER_N = [1, 2, 3, 4, 5, 6];

function drawLadder(ctx, w, h, rig, cfg, o) {
  const padX = Math.max(14, w * 0.08);
  const top = h * 0.1;
  const bottom = h * 0.92;
  const E1 = Math.abs(bohrJoules(1));
  // level n sits at height proportional to its energy, with the top edge marked.
  const levelY = n => bottom - ((E1 - Math.abs(bohrJoules(n))) / E1) * (bottom - top) * 0.88;
  const small = Math.max(9, h * 0.05);

  const marks = o.probe && o.probe.plateId === rig.id && o.probe.jump ? o.probe.jump : null;
  const lineW = w * 0.5;
  const x0 = padX + w * 0.1;
  for (const n of LADDER_N) {
    const y = levelY(n);
    const lit = marks && (marks.hi === n || marks.lo === n);
    ctx.strokeStyle = lit ? PLATE_COLORS.amber : PLATE_COLORS.steel;
    ctx.lineWidth = lit ? 3 : 1.5;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + lineW, y); ctx.stroke();
    plateText(ctx, `n = ${n}`, x0 - 6, y + small * 0.35, { align: 'right', size: small, color: lit ? PLATE_COLORS.amber : PLATE_COLORS.dim });
    const e = bohrJoules(n);
    plateText(ctx, `${(e / 1e-18).toFixed(3)} x 10^-18 J`.replace('-0.', '-0.'), x0 + lineW + 8, y + small * 0.35, {
      size: small * 0.9, color: lit ? PLATE_COLORS.amber : PLATE_COLORS.dim
    });
  }
  // The open edge at the top: an electron there has left the atom.
  const yTop = top;
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = PLATE_COLORS.dim;
  ctx.beginPath(); ctx.moveTo(x0, yTop); ctx.lineTo(x0 + lineW, yTop); ctx.stroke();
  ctx.setLineDash([]);
  plateText(ctx, cfg.ladderTop || 'gone', x0 + lineW + 8, yTop + small * 0.35, { size: small * 0.9, color: PLATE_COLORS.dim });
  plateText(ctx, '0 J', x0 - 6, yTop + small * 0.35, { align: 'right', size: small, color: PLATE_COLORS.dim });

  if (marks) {
    const ya = levelY(marks.hi);
    const yb = levelY(marks.lo);
    const ax = x0 + lineW * 0.5;
    ctx.strokeStyle = PLATE_COLORS.amber;
    ctx.fillStyle = PLATE_COLORS.amber;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ax, ya); ctx.lineTo(ax, yb - 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, yb); ctx.lineTo(ax - 5, yb - 9); ctx.lineTo(ax + 5, yb - 9); ctx.fill();
  }
  return [{ key: 'ladder', x0: 0, y0: 0, x1: w, y1: h }];
}

/* ---- photocell ---- */

function drawPhotocell(ctx, w, h, rig, cfg, o) {
  const nm = rigNm(rig, cfg);
  const L = words(cfg);
  const metal = METALS[rig.metal];
  const padX = Math.max(12, w * 0.05);
  const tubeX = w * 0.2;
  const tubeW = w * 0.6;
  const tubeY = h * 0.26;
  const tubeH = h * 0.36;
  const small = Math.max(9, h * 0.052);

  // The tube, its plate on the left and a collector on the right.
  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.lineWidth = 2;
  ctx.strokeRect(tubeX, tubeY, tubeW, tubeH);
  ctx.fillStyle = '#2d2924';
  ctx.fillRect(tubeX + 4, tubeY + 8, w * 0.04, tubeH - 16);
  ctx.fillRect(tubeX + tubeW - 4 - w * 0.025, tubeY + 8, w * 0.025, tubeH - 16);
  plateText(ctx, metal.name.toUpperCase(), tubeX + 4 + w * 0.02, tubeY - 8, { align: 'center', size: small, color: PLATE_COLORS.dust, weight: 700 });
  plateText(ctx, 'COLLECTOR', tubeX + tubeW - w * 0.0125, tubeY + tubeH + small + 2, { align: 'center', size: small * 0.85, color: PLATE_COLORS.dim });

  if (nm == null) {
    plateText(ctx, 'LAMP OFF', w / 2, h * 0.85, { align: 'center', size: small * 1.3, color: PLATE_COLORS.dim });
    return [];
  }
  const rgb = wavelengthRgb(nm);
  const bright = cfg.brightness || 3;
  const plan = planPhotocell(rig.metal, nm, bright);
  const beamY = tubeY + tubeH / 2;
  const t = (o.bench?.clock || 0);
  const ev = photonEv(nm);
  const workEv = metal.workEv;
  const clearsGrip = ev >= workEv;

  const plateBottom = tubeY + tubeH - 8;
  const maxBarH = tubeH - 24;
  const gripBarH = Math.min(maxBarH, (workEv / 6.0) * maxBarH);
  const gripY = plateBottom - gripBarH;

  if (cfg.packetView) {
    // Discrete photon packets with energy bars
    const startX = padX;
    const endX = tubeX + 4;
    const beamW = endX - startX;
    const count = Math.max(1, bright);
    const spacing = Math.max(22, beamW / (count * 1.5));
    const speed = 75;
    const offset = (t * speed) % spacing;

    for (let px = startX + offset; px < endX; px += spacing) {
      // Wave packet
      const packetRgb = rgb ? rgbCss(rgb, 0.95) : PLATE_COLORS.dust;
      ctx.strokeStyle = packetRgb;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let s = -7; s <= 7; s++) {
        const sy = beamY + Math.sin(s * 0.9) * 4 * Math.cos((s / 7) * (Math.PI / 2));
        if (s === -7) ctx.moveTo(px + s, sy); else ctx.lineTo(px + s, sy);
      }
      ctx.stroke();

      // Energy bar above the packet
      const packetBarH = Math.min(maxBarH, (ev / 6.0) * maxBarH);
      const barY = beamY - 6 - packetBarH;
      ctx.fillStyle = clearsGrip ? PLATE_COLORS.phosphor : PLATE_COLORS.steel;
      ctx.fillRect(px - 1.5, barY, 3, packetBarH);
    }

    // Grip indicator on the metal plate
    ctx.strokeStyle = PLATE_COLORS.amber;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tubeX + 4, gripY);
    ctx.lineTo(tubeX + 4 + w * 0.04, gripY);
    ctx.stroke();
    plateText(ctx, cfg.namedWorkFunction ? 'WORK FUNCTION' : 'GRIP', tubeX + 4 + w * 0.02, gripY - 3, {
      align: 'center', size: Math.max(7, small * 0.72), color: PLATE_COLORS.amber, weight: 700
    });

    if (cfg.showPhotonEnergy || cfg.stageIndex >= 4) {
      const zJ = (198.8 / nm).toFixed(2);
      plateText(ctx, `${zJ} zJ`, padX, beamY - 18, { size: small * 0.85, color: PLATE_COLORS.phosphor, weight: 700 });
    }
  } else {
    // The continuous wave beam (stages 1-2)
    ctx.fillStyle = rgb ? rgbCss(rgb, 0.5 + bright * 0.1) : 'rgba(184, 175, 160, 0.3)';
    const bt = 2 + bright * 2.2;
    ctx.fillRect(padX, beamY - bt / 2, tubeX - padX + 4, bt);
    plateText(ctx, `${fmtSig(nm)} nm`, padX, beamY - bt / 2 - 6, { size: small, color: rgb ? rgbCss(rgb) : PLATE_COLORS.dust });
  }

  // Electrons leaving the plate: a dot per twenty freed, each fast as the meter says.
  if (plan.freed) {
    const n = plan.count / 20 * 2;
    const rnd = mulberry32(hashId(rig.id + rig.metal));
    for (let i = 0; i < n; i++) {
      const lane = (rnd() * 0.8 + 0.1) * (tubeH - 24) + tubeY + 12;
      const rate = 0.12 + plan.speed * 0.045;
      const ph = (t * rate + rnd() * 3) % 1;
      const x = tubeX + 4 + w * 0.04 + ph * (tubeW - w * 0.09);
      ctx.fillStyle = PLATE_COLORS.dust;
      ctx.beginPath(); ctx.arc(x, lane, Math.max(2, h * 0.012), 0, Math.PI * 2); ctx.fill();
    }
  }

  // The two meters.
  const my = h * 0.74;
  const mh = h * 0.2;
  const mw = (w - padX * 2 - 12) / 2;
  const meter = (x, title, value, fill, unit) => {
    ctx.fillStyle = '#16140f';
    ctx.fillRect(x, my, mw, mh);
    ctx.strokeStyle = PLATE_COLORS.rim;
    ctx.strokeRect(x + 0.5, my + 0.5, mw - 1, mh - 1);
    plateText(ctx, title.toUpperCase(), x + 6, my + mh * 0.3, { size: Math.max(8, mh * 0.2), color: PLATE_COLORS.dim });
    plateText(ctx, value, x + 6, my + mh * 0.72, { size: Math.max(12, mh * 0.36), color: PLATE_COLORS.phosphor, weight: 700 });
    ctx.fillStyle = PLATE_COLORS.phosphor;
    ctx.fillRect(x + 6, my + mh - 7, (mw - 12) * fill, 3);
    if (unit) plateText(ctx, unit, x + mw - 6, my + mh * 0.3, { align: 'right', size: Math.max(8, mh * 0.18), color: PLATE_COLORS.dim });
  };
  meter(padX, L.count, String(plan.count), plan.count / 100, 'per s');
  meter(padX + mw + 12, L.speed, plan.freed ? plan.speed.toFixed(1) : '0.0', Math.min(1, plan.speed / 10), 'x 10^5 m/s');
  return [];
}

/* ---- cuvette ---- */

function drawCuvette(ctx, w, h, rig, cfg, o) {
  const nm = rigNm(rig, cfg);
  const L = words(cfg);
  const solute = SOLUTES[rig.solute] || { looks: 'none' };
  const small = Math.max(9, h * 0.052);
  const path = cfg.path || 1;
  const hits = [];

  // The cuvette: width follows the path length through it.
  const cw = w * (0.1 + 0.07 * path);
  const cx = w * 0.46 - cw / 2;
  const cy = h * 0.2;
  const ch = h * 0.5;
  const tint = { blue: [86, 132, 176], purple: [128, 70, 150] }[solute.looks] || [150, 150, 150];
  const conc = rig.conc ?? 0.01;
  const k = Math.min(1, 0.3 + (conc / 0.02) * 0.5);
  ctx.fillStyle = `rgba(${tint[0]}, ${tint[1]}, ${tint[2]}, ${0.25 + 0.5 * k})`;
  ctx.fillRect(cx, cy + ch * 0.1, cw, ch * 0.9);
  ctx.strokeStyle = PLATE_COLORS.dust;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx, cy, cw, ch);

  // Path length dimension line under it.
  ctx.strokeStyle = PLATE_COLORS.amber;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy + ch + 10); ctx.lineTo(cx + cw, cy + ch + 10);
  ctx.moveTo(cx, cy + ch + 5); ctx.lineTo(cx, cy + ch + 15);
  ctx.moveTo(cx + cw, cy + ch + 5); ctx.lineTo(cx + cw, cy + ch + 15);
  ctx.stroke();
  plateText(ctx, `${path} cm`, cx + cw / 2, cy + ch + 10 + small + 2, { align: 'center', size: small, color: PLATE_COLORS.amber, weight: 700 });

  // The light going in, and what comes out.
  const rgb = nm != null ? wavelengthRgb(nm) : null;
  const beamY = cy + ch / 2;
  const mode = cfg.region || 'uv-visible';
  if (cfg.mode === 'region') {
    // The molecule in the cuvette, doing what this light makes it do.
    const motion = planRegion(rig.molecule, mode);
    const t = o.bench?.clock || 0;
    const mx = cx + cw / 2;
    const my = cy + ch * 0.55;
    ctx.fillStyle = PLATE_COLORS.dust;
    ctx.strokeStyle = PLATE_COLORS.dust;
    ctx.lineWidth = 3;
    const r = Math.max(5, h * 0.035);
    if (motion.motion === 'spins') {
      const a = t * 3;
      const dx = Math.cos(a) * cw * 0.28, dy = Math.sin(a) * cw * 0.28;
      ctx.beginPath(); ctx.moveTo(mx - dx, my - dy); ctx.lineTo(mx + dx, my + dy); ctx.stroke();
      ctx.beginPath(); ctx.arc(mx - dx, my - dy, r, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + dx, my + dy, r * 1.5, 0, 7); ctx.fill();
    } else if (motion.motion === 'vibrates') {
      const s = 1 + 0.35 * Math.sin(t * 9);
      const dx = cw * 0.2 * s;
      ctx.beginPath(); ctx.moveTo(mx - dx, my); ctx.lineTo(mx + dx, my); ctx.stroke();
      ctx.beginPath(); ctx.arc(mx - dx, my, r, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + dx, my, r * 1.5, 0, 7); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(mx, my, r * 2.2, 0, 7); ctx.stroke();
      const up = (Math.sin(t * 2) > 0);
      ctx.beginPath(); ctx.arc(mx + (up ? r * 3.4 : 0), my - (up ? r * 3.0 : 0), r * 0.7, 0, 7); ctx.fill();
    }
    const label = { microwave: 'MICROWAVE', infrared: 'INFRARED', 'uv-visible': 'ULTRAVIOLET AND VISIBLE' }[mode];
    plateText(ctx, label, w / 2, h * 0.09, { align: 'center', size: small * 1.1, color: PLATE_COLORS.phosphor, weight: 700 });
    plateText(ctx, rig.label, cx + cw / 2, cy - 8, { align: 'center', size: small, color: PLATE_COLORS.dim });
    return hits;
  }

  if (rgb && rig.solute) {
    ctx.fillStyle = rgbCss(rgb, 0.8);
    ctx.fillRect(w * 0.06, beamY - 3, cx - w * 0.06, 6);
    const a = planAbsorb(rig.solute, nm, path, conc);
    const passed = Math.max(0.05, Math.pow(10, -a));
    ctx.fillStyle = rgbCss(rgb, Math.min(0.85, 0.15 + passed * 0.7));
    ctx.fillRect(cx + cw, beamY - 3, w * 0.64 - (cx + cw), 6);
  }
  plateText(ctx, nm != null ? `${fmtSig(nm)} nm` : 'LAMP OFF', w * 0.06, beamY - 12, { size: small, color: rgb ? rgbCss(rgb) : PLATE_COLORS.dim });

  // The absorbance readout.
  if (nm != null && rig.solute) {
    const a = planAbsorb(rig.solute, nm, path, conc);
    const bx = w * 0.7, by = h * 0.22, bw = w * 0.26, bh = h * 0.3;
    ctx.fillStyle = '#16140f';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = PLATE_COLORS.rim;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    plateText(ctx, L.absorb.toUpperCase(), bx + 6, by + bh * 0.28, { size: Math.max(8, bh * 0.16), color: PLATE_COLORS.dim });
    plateText(ctx, a >= ABSORBANCE_CEILING ? 'OVER' : a.toFixed(3), bx + 6, by + bh * 0.7, { size: Math.max(13, bh * 0.34), color: PLATE_COLORS.phosphor, weight: 700 });
    ctx.fillStyle = PLATE_COLORS.phosphor;
    ctx.fillRect(bx + 6, by + bh - 8, (bw - 12) * Math.min(1, a / 1.5), 3);
  }

  // The label of what is in it, and (when asked for) its concentration.
  plateText(ctx, rig.shows || rig.label, cx + cw / 2, cy - 8, { align: 'center', size: small, color: PLATE_COLORS.dust });

  // What is left of white light after the cuvette: a band with the missing colour.
  if (cfg.after && rig.solute) {
    const bx = w * 0.08, bw = w * 0.84, by = h * 0.8, bh = h * 0.1;
    for (let x = 0; x < bw; x++) {
      const n = PRISM_RANGE.lo + (x / bw) * (PRISM_RANGE.hi - PRISM_RANGE.lo);
      const c = wavelengthRgb(n);
      if (!c) continue;
      const a = planAbsorb(rig.solute, n, path, conc);
      const pass = Math.pow(10, -a);
      ctx.fillStyle = rgbCss(c, Math.max(0.03, pass));
      ctx.fillRect(bx + x, by, 1.2, bh);
    }
    ctx.strokeStyle = PLATE_COLORS.rim;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    plateText(ctx, 'LIGHT THAT GETS THROUGH', bx, by - 5, { size: small * 0.9, color: PLATE_COLORS.dim });
    for (let n = 400; n <= 700; n += 100) {
      const x = bx + ((n - PRISM_RANGE.lo) / (PRISM_RANGE.hi - PRISM_RANGE.lo)) * bw;
      ctx.fillStyle = PLATE_COLORS.steel;
      ctx.fillRect(x, by + bh, 1, 4);
      plateText(ctx, String(n), x, by + bh + 4 + small * 0.9, { align: 'center', size: small * 0.8, color: PLATE_COLORS.dim });
    }
  }
  hits.push({ key: 'cuvette', x0: 0, y0: 0, x1: w, y1: h });
  return hits;
}

/* ---- plot ---- */

function drawPlot(ctx, w, h, rig, cfg, o) {
  const padL = w * 0.14, padR = w * 0.06, padT = h * 0.1, padB = h * 0.2;
  const pw = w - padL - padR, ph = h - padT - padB;
  const small = Math.max(9, h * 0.05);
  const maxC = rig.maxConc || 0.008;
  const maxA = rig.maxAbs || 0.25;
  const xOf = c => padL + (c / maxC) * pw;
  const yOf = a => padT + ph - (a / maxA) * ph;

  ctx.strokeStyle = PLATE_COLORS.steel;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + ph); ctx.lineTo(padL + pw, padT + ph); ctx.stroke();
  // Grid and numbers.
  for (let i = 0; i <= 4; i++) {
    const a = (maxA / 4) * i;
    ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.moveTo(padL, yOf(a)); ctx.lineTo(padL + pw, yOf(a)); ctx.stroke();
    ctx.globalAlpha = 1;
    plateText(ctx, a.toFixed(2), padL - 5, yOf(a) + small * 0.35, { align: 'right', size: small * 0.9, color: PLATE_COLORS.dim });
    const c = (maxC / 4) * i;
    plateText(ctx, (c * 1000).toFixed(0), xOf(c), padT + ph + small + 4, { align: 'center', size: small * 0.9, color: PLATE_COLORS.dim });
  }
  plateText(ctx, 'mmol/L', padL + pw, padT + ph + small * 2.2 + 4, { align: 'right', size: small * 0.9, color: PLATE_COLORS.dim });
  plateText(ctx, 'ABSORBANCE', padL, padT - 6, { size: small * 0.9, color: PLATE_COLORS.dim });

  for (const pt of rig.points || []) {
    ctx.fillStyle = PLATE_COLORS.phosphor;
    ctx.beginPath(); ctx.arc(xOf(pt.conc), yOf(pt.abs), Math.max(4, h * 0.022), 0, Math.PI * 2); ctx.fill();
  }
  // A ruler laid through the standards: drawn from the points, never beyond them.
  if ((rig.points || []).length >= 2) {
    const p0 = rig.points[0], p1 = rig.points[rig.points.length - 1];
    const slope = (p1.abs - p0.abs) / (p1.conc - p0.conc);
    ctx.strokeStyle = PLATE_COLORS.amber;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(p0.abs - slope * p0.conc));
    ctx.lineTo(xOf(maxC), yOf(p0.abs + slope * (maxC - p0.conc)));
    ctx.stroke();
  }
  if (rig.unknownAbs != null) {
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = PLATE_COLORS.dust;
    ctx.beginPath(); ctx.moveTo(padL, yOf(rig.unknownAbs)); ctx.lineTo(padL + pw, yOf(rig.unknownAbs)); ctx.stroke();
    ctx.setLineDash([]);
    plateText(ctx, `SEALED ${rig.unknownAbs.toFixed(3)}`, padL + pw, yOf(rig.unknownAbs) - 5, { align: 'right', size: small, color: PLATE_COLORS.dust });
  }
  return [];
}

/* ------------------------------------------------------------------
   THE BENCH
   ------------------------------------------------------------------ */

export class LightBench extends PlateBench {
  /**
   * @param {HTMLElement} host
   * @param {{onProbe?: Function, onSelect?: Function, onSetting?: Function, onBrightness?: Function}} opts
   *   `onSetting` / `onBrightness` are heard only on the built bench, where the
   *   dials are real; the drawn bench's dials are the quest's own panel dials.
   */
  constructor(host, opts = {}) {
    super(host, opts);
    this.onSetting = opts.onSetting || null;
    this.onBrightness = opts.onBrightness || null;
    this.cfg = { settings: [], setting: 1, brightness: 3, path: 1, region: 'uv-visible', labels: {} };
    this.clock = 0;
  }

  prepare(item) { return { ...item }; }

  apertureClass(item) {
    return item.head === 'photocell' || item.head === 'cuvette' || item.head === 'plot' || item.head === 'ladder'
      ? 'light-aperture light-tall' : 'light-aperture';
  }

  gridClass() { return 'light-grid'; }

  /**
   * Lay out the rigs for a stage.
   * @param {Array<object>} rigs  each `{ id, label, note, head, ...head fields }`
   * @param {object} cfg  `{ settings, setting, brightness, path, region, labels, mode, after }`
   */
  setRigs(rigs, cfg = {}) {
    this.cfg = {
      settings: [], setting: 1, brightness: 3, path: 1, region: 'uv-visible', labels: {},
      ...cfg
    };
    this.setPlates(rigs);
    if (this.items.some(r => this.animated(r))) this.startAnim();
  }

  animated(rig) { return rig.head === 'trace' || rig.head === 'photocell' || this.cfg.mode === 'region'; }

  setSetting(i) { this.cfg.setting = i; this.probe = null; this.setDialValue?.('setting', i); this.drawAll(); }
  setBrightness(n) { this.cfg.brightness = n; this.setDialValue?.('brightness', n); this.drawAll(); }
  setPath(cm) { this.cfg.path = cm; this.drawAll(); }
  setRegion(r) { this.cfg.region = r; this.drawAll(); }

  /** The wavelength a rig is lit at under the present settings. */
  nmOf(id) { return rigNm(this.itemFor(id), this.cfg); }

  draw(ctx, w, h, rig, o) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PLATE_COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    let hits = [];
    switch (rig.head) {
      case 'trace': hits = drawTrace(ctx, w, h, rig, this.cfg, o); break;
      case 'scale': hits = drawScale(ctx, w, h, rig, this.cfg, o); break;
      case 'prism': hits = drawPrism(ctx, w, h, rig, this.cfg, o); break;
      case 'ladder': hits = drawLadder(ctx, w, h, rig, this.cfg, o); break;
      case 'photocell': hits = drawPhotocell(ctx, w, h, rig, this.cfg, o); break;
      case 'cuvette': hits = drawCuvette(ctx, w, h, rig, this.cfg, o); break;
      case 'plot': hits = drawPlot(ctx, w, h, rig, this.cfg, o); break;
      default: break;
    }
    raster(ctx, w, h, o.sweep, 0, h);
    aperture(ctx, w, h);
    rig.layout = { w, h };
    return hits;
  }

  /** A tap on a plate reads something off it. Nothing is read from empty plate. */
  press(rig, hit, px, py) {
    if (!hit) return null;
    const nm = rigNm(rig, this.cfg);
    if (rig.head === 'trace' && nm != null) {
      return { mark: { nm }, read: { kind: 'trace', rig, nm } };
    }
    if (rig.head === 'scale') {
      return { mark: {}, read: { kind: 'scale', rig, nm: rig.nm } };
    }
    if (rig.head === 'prism') {
      const plan = hit.plan;
      const padX = hit.x0;
      const plotW = hit.x1 - hit.x0;
      let at = PRISM_RANGE.lo + ((px - padX) / plotW) * (PRISM_RANGE.hi - PRISM_RANGE.lo);
      at = Math.max(PRISM_RANGE.lo, Math.min(PRISM_RANGE.hi, at));
      const near = (plan.continuous ? plan.dark : plan.bright)
        .map(n => ({ n, d: Math.abs(n - at) }))
        .sort((a, b) => a.d - b.d)[0];
      const snapped = near && near.d <= 6 ? near.n : Math.round(at);
      return { mark: { prism: true, nm: snapped }, read: { kind: 'prism', rig, nm: snapped, onLine: Boolean(near && near.d <= 6), plan } };
    }
    if (rig.head === 'ladder') {
      // A tap near a rung reads that rung; elsewhere on the ladder reads the lines.
      const read = this.ladderRead(rig, py);
      return read;
    }
    if (rig.head === 'cuvette') {
      return { mark: {}, read: { kind: 'cuvette', rig, nm } };
    }
    return null;
  }

  /** The ladder plate is driven by line taps from the stage, not by taps on the picture. */
  ladderRead() { return null; }

  /** Light the rung pair for a jump, as the quest taps a line. */
  showJump(id, hi, lo) {
    this.probe = { plateId: id, jump: { hi, lo } };
    this.sweep = 1;
    this.startAnim();
    this.drawAll();
  }

  clearJump() { this.probe = null; this.drawAll(); }

  tick(dt) {
    this.clock += dt;
    return this.items.some(r => this.animated(r));
  }
}

export { fmtSig, freqE14, LINES, SOLUTES, METALS, jumpForLine, planJump, photonEv, isVisible, regionOf, VISIBLE };
