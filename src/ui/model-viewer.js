/**
 * model-viewer.js — stands a reward card's model up in space, small enough to sit under the card's words.
 *
 * `mountModel(host, spec)` shows the model described by a `reward.model` spec (`learn/engine/model-parts.js`): at `3D On` as solid
 * spheres and rods that turn slowly and can be turned by dragging, and at `3D Off` (or with no WebGL) as the same parts painted flat
 * on a canvas. A wave is the exception: it is a trace lying on the desk, so it is drawn flat and animated, never turned. Reduced motion
 * shows it still. It draws nothing the spec did not say: the parts, and the words under them, come from `model-parts.js`. It owns one
 * small renderer and gives it back on `dispose()`.
 */

import { modelParts, captionOf, electronAt, ejectionState } from '../learn/engine/model-parts.js';
import { planTrace, bohrJoules } from '../learn/engine/lightdata.js';
import { tierManager } from '../three/tier.js';
import { session } from '../session.js';
import { mountDOrbitals3D, mountDebriefOrbitalViewer } from './orbital-3d-viewer.js';
import { mountFilling } from './filling-animator.js';
import { mountRadiiShrink } from './radii-shrink-animator.js';
import { mountShieldingExplainer } from './shielding-explainer.js';
import { mountIonicRadius } from './ionic-radius-animator.js';
import { mountCuvetteExplainer } from './cuvette-explainer.js';

export { mountDebriefOrbitalViewer };

const BG = '#0d0c0a';
/** The bench's trace moves at one on-screen speed, so a shorter wave passes more crests a second. */
const WAVE_SPEED = 130;

const smoothstep = x => x * x * (3 - 2 * x);
/** The trace is wide and short, so on a very wide card it is held to a readable length and centred. */
const plotWidth = w => Math.max(80, Math.min(1200, w - 2 * Math.max(16, w * 0.03)));
const plotPad = w => Math.max(Math.max(16, w * 0.03), (w - plotWidth(w)) / 2);
const rgbCss = rgb => `rgb(${rgb.map(v => Math.max(0, Math.min(255, Math.round(v)))).join(',')})`;

/** How far the wave has been tuned from its first wavelength to its last, 0..1, resting at each end. */
function waveTune(t) {
  const p = (t % 10) / 10;
  if (p < 0.4) return smoothstep(p / 0.4);
  if (p < 0.5) return 1;
  if (p < 0.9) return 1 - smoothstep((p - 0.5) / 0.4);
  return 0;
}

/** +1 while the wave shortens, -1 while it lengthens, 0 while it rests. */
function waveDir(t) {
  const p = (t % 10) / 10;
  return p < 0.4 ? 1 : p < 0.5 ? 0 : p < 0.9 ? -1 : 0;
}

/**
 * The wave, drawn flat on the desk: one trace against the bench's 2400 nm ruler, with the same
 * two readings the bench prints. The crests travel at one speed, so shortening the wavelength
 * crowds them together and raises the number passing the gate; the colour follows the wavelength.
 */
function drawWave(ctx, w, h, wave, state, still) {
  const pad = plotPad(w);
  const plotW = plotWidth(w);
  const top = 52;
  const rulerY = h - 26;
  const midY = (top + rulerY) / 2;
  const amp = Math.max(12, (rulerY - top) * 0.34);
  const span = wave.span || 2400;
  const plan = planTrace(state.nm, span);
  const colour = rgbCss(plan.rgb || [220, 214, 204]);

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  // A slate under the wave: faint graph lines, so the wave reads as lying on the desk.
  ctx.strokeStyle = 'rgba(140,131,118,0.09)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = pad; x <= pad + plotW + 0.5; x += 48) { ctx.moveTo(x, top - 6); ctx.lineTo(x, rulerY); }
  for (let y = top - 6; y <= rulerY + 0.5; y += 24) { ctx.moveTo(pad, y); ctx.lineTo(pad + plotW, y); }
  ctx.stroke();

  // The ruler: ticks every 100 nm, numbered every 400, the bench's 2400 nm span.
  ctx.strokeStyle = '#544e46';
  ctx.beginPath();
  ctx.moveTo(pad, rulerY);
  ctx.lineTo(pad + plotW, rulerY);
  ctx.stroke();
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let n = 0; n <= span; n += 100) {
    const x = pad + (n / span) * plotW;
    const major = n % 400 === 0;
    ctx.beginPath();
    ctx.moveTo(x, rulerY);
    ctx.lineTo(x, rulerY + (major ? 7 : 4));
    ctx.stroke();
    if (major && n < span) {
      ctx.fillStyle = '#6b625a';
      ctx.fillText(String(n), x, rulerY + 9);
    }
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6b625a';
  ctx.fillText('nm', pad + plotW, rulerY + 9);

  // The header: the same two readings the bench prints, live.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = colour;
  ctx.fillRect(pad, 10, 16, 16);
  ctx.strokeStyle = '#544e46';
  ctx.strokeRect(pad + 0.5, 10.5, 15, 15);
  ctx.fillStyle = '#8c8376';
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText('CREST TO CREST', pad + 24, 17);
  ctx.fillStyle = '#dcd6cc';
  ctx.font = 'bold 15px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(`${Math.round(state.nm)} nm`, pad + 24, 35);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#8c8376';
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText('CRESTS A SECOND', w - pad, 17);
  ctx.fillStyle = '#dcd6cc';
  ctx.font = 'bold 15px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(`${plan.e14.toFixed(2)} x 10^14 /s`, w - pad, 35);

  // The trade, in the middle: one goes up exactly as the other goes down.
  if (plotW >= 560) {
    ctx.textAlign = 'center';
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = state.dir ? '#d99423' : '#6b625a';
    ctx.fillText(
      state.dir > 0 ? 'WAVELENGTH \u2193   FREQUENCY \u2191'
        : state.dir < 0 ? 'WAVELENGTH \u2191   FREQUENCY \u2193'
          : still ? 'SHORTER WAVE \u00b7 FASTER CRESTS' : 'HOLDING',
      pad + plotW / 2, 28
    );
  }

  // A faint centre line, so a crest reads as a crest.
  ctx.strokeStyle = 'rgba(140,131,118,0.28)';
  ctx.beginPath();
  ctx.moveTo(pad, midY);
  ctx.lineTo(pad + plotW, midY);
  ctx.stroke();

  // The wave, travelling left to right at one on-screen speed. As the wavelength shortens,
  // more crests pass the gate each second, and the colour follows the wavelength.
  const wavelengthPx = Math.max(8, (state.nm / span) * plotW);
  const steps = Math.min(2000, Math.round(plotW * 2));
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const x = pad + (i / steps) * plotW;
    const y = midY - amp * Math.cos(2 * Math.PI * ((x - pad) / wavelengthPx - state.phase));
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = colour;
  ctx.lineWidth = 3;
  ctx.shadowColor = colour;
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // The timing gate on the right: it lights as each crest reaches it.
  const gateX = pad + plotW;
  const gateLit = Math.cos(2 * Math.PI * (plotW / wavelengthPx - state.phase)) > 0.8;
  ctx.strokeStyle = gateLit ? '#d99423' : '#544e46';
  ctx.lineWidth = gateLit ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.moveTo(gateX, midY - amp * 1.15);
  ctx.lineTo(gateX, midY + amp * 1.15);
  ctx.stroke();
  if (gateLit) {
    ctx.fillStyle = '#d99423';
    ctx.beginPath();
    ctx.arc(gateX, midY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Label the wavelength between two adjacent crests directly on the wave
  const p = ((state.phase % 1) + 1) % 1;
  const maxK = Math.ceil(plotW / wavelengthPx);
  let bestX1 = null;
  let bestDist = Infinity;
  for (let k = -2; k <= maxK; k++) {
    const c1 = pad + (k + p) * wavelengthPx;
    const c2 = c1 + wavelengthPx;
    if (c1 >= pad + 8 && c2 <= pad + plotW - 8) {
      const mid = (c1 + c2) / 2;
      const d = Math.abs(mid - (pad + plotW / 2));
      if (d < bestDist) {
        bestDist = d;
        bestX1 = c1;
      }
    }
  }
  if (bestX1 != null) {
    const x1 = bestX1;
    const x2 = bestX1 + wavelengthPx;
    const yCrest = midY - amp;
    const yDim = Math.max(38, yCrest - 14);

    ctx.save();
    // Vertical dashed guides from peak to dimension line
    ctx.strokeStyle = 'rgba(217, 148, 35, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(x1, yCrest); ctx.lineTo(x1, yDim - 2);
    ctx.moveTo(x2, yCrest); ctx.lineTo(x2, yDim - 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Double-headed arrow line
    ctx.strokeStyle = '#d99423';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, yDim); ctx.lineTo(x2, yDim);
    ctx.moveTo(x1 + 5, yDim - 3); ctx.lineTo(x1, yDim); ctx.lineTo(x1 + 5, yDim + 3);
    ctx.moveTo(x2 - 5, yDim - 3); ctx.lineTo(x2, yDim); ctx.lineTo(x2 - 5, yDim + 3);
    ctx.stroke();

    // Wavelength label
    const text = `Wavelength: ${Math.round(state.nm)} nm`;
    ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const tw = ctx.measureText(text).width;
    const tx = (x1 + x2) / 2;
    ctx.fillStyle = 'rgba(20, 18, 16, 0.85)';
    ctx.fillRect(tx - tw / 2 - 4, yDim - 15, tw + 8, 13);
    ctx.fillStyle = '#fffae0';
    ctx.fillText(text, tx, yDim - 3);
    ctx.restore();
  }
}

/** Animate a wave model on its own canvas; it lies flat, so there is nothing to turn. */
function mountWave(view, wave, still) {
  const canvas = document.createElement('canvas');
  view.appendChild(canvas);
  view.style.cursor = 'default';
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const list = wave.nm && wave.nm.length ? wave.nm : [550];
  const long = Math.max(...list);
  const short = Math.min(...list);
  const state = { nm: still ? (long + short) / 2 : long, phase: 0.15, dir: still ? 0 : 1 };
  let W = 0;
  let H = 0;
  let raf = 0;
  let ro = null;

  const paint = () => drawWave(ctx, W, H, wave, state, still);
  const resize = () => {
    const w = Math.max(240, view.clientWidth || 320);
    const h = Math.max(160, view.clientHeight || 220);
    if (w === W && h === H) return;
    W = w;
    H = h;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint();
  };
  resize();
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(resize);
    ro.observe(view);
  } else {
    window.addEventListener('resize', resize);
  }

  if (!still) {
    const t0 = performance.now();
    let last = t0;
    const frame = now => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const t = (now - t0) / 1000;
      const u = waveTune(t);
      state.nm = long + (short - long) * u;
      state.dir = waveDir(t);
      const wavelengthPx = Math.max(8, (state.nm / (wave.span || 2400)) * plotWidth(W));
      state.phase += (dt * WAVE_SPEED) / wavelengthPx;
      paint();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }

  return () => {
    cancelAnimationFrame(raf);
    ro?.disconnect();
    window.removeEventListener('resize', resize);
    canvas.remove();
  };
}

/**
 * Animate the Bohr energy ladder: rungs at their energies, an electron dropping
 * from a higher rung to a lower one, and the emission of a photon wavepacket / energy packet.
 * Fixed front-on, never rotated, so the levels and drop are completely clear.
 */
function drawLadder(ctx, w, h, ladder, progress, still) {
  const pad = Math.max(16, Math.min(32, w * 0.035));
  const top = 38;
  const bottom = h - 34;
  const hSpan = bottom - top;

  // Background and slate grid
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(140,131,118,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = pad; x <= w - pad + 0.5; x += 40) { ctx.moveTo(x, top - 8); ctx.lineTo(x, bottom + 12); }
  for (let y = top - 8; y <= bottom + 12.5; y += 24) { ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); }
  ctx.stroke();

  // Spacing of rungs: physical Bohr model -1/n^2 crowding
  // n = 1 at bottom; n = 2, 3, 4, 5 crowd towards top
  const yOf = n => {
    if (n === 1) return bottom;
    if (n === 2) return bottom - 0.44 * hSpan;
    if (n === 3) return bottom - 0.70 * hSpan;
    if (n === 4) return bottom - 0.85 * hSpan;
    if (n === 5) return bottom - 0.93 * hSpan;
    return top; // top / infinity
  };

  const hi = ladder.hi || 3;
  const lo = ladder.lo || 2;
  const yHi = yOf(hi);
  const yLo = yOf(lo);
  const colour = ladder.colour || '#ff3b30';

  // Horizontal layout
  const labelW = w >= 560 ? 80 : 54;
  const ladX0 = pad + labelW;
  const ladW = Math.max(70, Math.min(150, (w - pad * 2) * 0.22));
  const ladX1 = ladX0 + ladW;
  const xElectron = ladX0 + ladW * 0.5;
  const xEmitStart = ladX1 + 10;
  const xEmitEnd = w - pad - 12;

  // Header: Clear description of the process
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#dcd6cc';
  ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(`DROP: n = ${hi} \u2192 n = ${lo}`, pad, 10);

  // Ladder upright rails
  ctx.strokeStyle = '#3e3933';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ladX0, top - 6);
  ctx.lineTo(ladX0, bottom + 6);
  ctx.moveTo(ladX1, top - 6);
  ctx.lineTo(ladX1, bottom + 6);
  ctx.stroke();

  // Draw the rungs
  const rungs = [1, 2, 3, 4, 5];
  for (const n of rungs) {
    const y = yOf(n);
    const isHi = n === hi;
    const isLo = n === lo;
    const isTarget = isHi || isLo;

    // Rung line
    ctx.strokeStyle = isHi ? '#d99423' : isLo ? '#dcd6cc' : '#544e46';
    ctx.lineWidth = isTarget ? 3 : 1.5;
    if (isTarget) {
      ctx.shadowColor = isHi ? 'rgba(217, 148, 35, 0.4)' : 'rgba(220, 214, 204, 0.3)';
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.moveTo(ladX0 - 2, y);
    ctx.lineTo(ladX1 + 2, y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Labels on left
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = isTarget ? 'bold 11px ui-monospace, SFMono-Regular, Menlo, monospace' : '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = isHi ? '#d99423' : isLo ? '#dcd6cc' : n === 1 ? '#8c8376' : '#6b625a';
    const tag = n === 1 ? (w >= 540 ? 'n = 1 (ground)' : 'n = 1')
      : isHi ? (w >= 540 ? `n = ${n} (excited)` : `n = ${n}`)
      : isLo ? (w >= 540 ? `n = ${n} (lower)` : `n = ${n}`)
      : `n = ${n}`;
    ctx.fillText(tag, ladX0 - 8, y);

    // Energy on right (if space permits)
    if (w >= 520) {
      ctx.textAlign = 'left';
      ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillStyle = isTarget ? (isHi ? '#d99423' : '#dcd6cc') : '#544e46';
      const joules = bohrJoules(n);
      ctx.fillText(`${(joules / 1e-18).toFixed(3)} \u00d7 10^-18 J`, ladX1 + 8, y);
    }
  }

  // Top open limit (n = infinity, 0 J)
  const yTopLine = yOf(6);
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#544e46';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ladX0 - 2, yTopLine);
  ctx.lineTo(ladX1 + 2, yTopLine);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6b625a';
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText('0 J (top)', ladX0 - 8, yTopLine);

  // Transition vertical arrow between rungs hi and lo
  const xArrow = ladX0 + 16;
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xArrow, yHi + 3);
  ctx.lineTo(xArrow, yLo - 6);
  ctx.stroke();
  // Arrow head pointing down
  ctx.beginPath();
  ctx.moveTo(xArrow, yLo - 1);
  ctx.lineTo(xArrow - 4, yLo - 7);
  ctx.lineTo(xArrow + 4, yLo - 7);
  ctx.closePath();
  ctx.fill();

  // Energy delta label on the arrow
  if (w >= 600) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colour;
    ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(`\u0394E = ${(ladder.joules / 1e-18).toFixed(3)} \u00d7 10^-18 J`, xArrow + 6, (yHi + yLo) / 2);
  }

  // Animation timeline (progress in 0..1):
  // 0.00..0.22 : Electron rests on rung hi (excited)
  // 0.22..0.40 : Electron drops down to rung lo
  // 0.38..0.88 : Photon wavepacket emerges from drop point and travels right
  // 0.88..1.00 : Rest on lo before looping
  const p = still ? 0.6 : progress;

  let electronY = yHi;
  let electronSettled = false;
  let showGhost = false;

  if (p < 0.22) {
    // Excited state
    electronY = yHi;
  } else if (p < 0.40) {
    // Dropping
    const uDrop = smoothstep((p - 0.22) / 0.18);
    electronY = yHi + uDrop * (yLo - yHi);
    showGhost = true;
  } else {
    // Settled on lower rung
    electronY = yLo;
    electronSettled = true;
    showGhost = true;
  }

  // Ghost origin marker on rung hi
  if (showGhost) {
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(217, 148, 35, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(xElectron, yHi, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Drop ripple on impact
  if (!still && p >= 0.38 && p <= 0.55) {
    const rip = (p - 0.38) / 0.17;
    ctx.save();
    ctx.strokeStyle = `rgba(220, 214, 204, ${1 - rip})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(xElectron, yLo, 6 + rip * 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Draw the electron
  ctx.save();
  ctx.shadowColor = electronSettled ? '#dcd6cc' : '#d99423';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(xElectron, electronY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = electronSettled ? '#8c8376' : '#d99423';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Photon / Wave emission
  // Active when p >= 0.36
  if (p >= 0.36) {
    const pWave = still ? 0.5 : (p - 0.36) / 0.52;
    const waveAlpha = still ? 1 : (pWave < 0.1 ? pWave / 0.1 : pWave > 0.85 ? Math.max(0, (1 - pWave) / 0.15) : 1);

    if (waveAlpha > 0) {
      const yWaveMid = (yHi + yLo) / 2;
      const xPkt = xEmitStart + pWave * (xEmitEnd - xEmitStart);
      const pktLen = Math.min(120, (xEmitEnd - xEmitStart) * 0.45);
      const sigma = pktLen * 0.28;
      const wavePx = 15;
      const amp = 16;

      ctx.save();
      ctx.globalAlpha = waveAlpha;

      // Concentric emission ripples at start of release
      if (!still && pWave < 0.35) {
        const arcProg = pWave / 0.35;
        for (let k = 0; k < 3; k++) {
          const arcR = (arcProg * 45 + k * 14) % 45;
          const arcAlpha = Math.max(0, 1 - arcR / 45) * 0.6;
          ctx.strokeStyle = colour;
          ctx.globalAlpha = waveAlpha * arcAlpha;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ladX1 + 4, yWaveMid, arcR, -Math.PI * 0.4, Math.PI * 0.4);
          ctx.stroke();
        }
        ctx.globalAlpha = waveAlpha;
      }

      // Sine wavepacket with Gaussian envelope
      ctx.strokeStyle = colour;
      ctx.lineWidth = 3;
      ctx.shadowColor = colour;
      ctx.shadowBlur = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      const steps = 80;
      for (let i = 0; i <= steps; i++) {
        const x = xPkt - pktLen / 2 + (i / steps) * pktLen;
        const dx = x - xPkt;
        const env = Math.exp(-(dx * dx) / (2 * sigma * sigma));
        const y = yWaveMid - amp * env * Math.sin((2 * Math.PI * dx) / wavePx - pWave * 26);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Glowing photon particle core
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(xPkt, yWaveMid, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colour;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(xPkt, yWaveMid, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Explanatory badge accompanying the photon
      if (w >= 440) {
        const badgeX = Math.min(w - pad - 80, Math.max(xEmitStart + 70, xPkt));
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = colour;
        ctx.fillText(`PHOTON EMITTED \u00b7 ${ladder.nm} nm`, badgeX, yWaveMid - 22);

        ctx.textBaseline = 'top';
        ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = '#dcd6cc';
        ctx.fillText('Lost energy released as light', badgeX, yWaveMid + 22);
      }
      ctx.restore();
    }
  }

  // Footer note
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#8c8376';
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText('When an electron drops a rung, the atom loses energy and releases one photon of light.', w / 2, h - 8);
}

/**
 * Animate a 3D standing wave on an orbit: shows why non-integer wavelengths cancel out.
 * Features interactive orbit tilt & turn, wavelength mode switching (1.5λ cancels, 1.33λ smears, 2λ fits, 3λ fits),
 * and dynamic visualization of Lap 1 (crest) vs Lap 2 (trough) destructive interference.
 */
function mountStandingWave3D(view, wrap, config, still) {
  const modes = config.modes || [
    { id: '1.5', n: 1.5, label: '1.5λ (Cancels)', desc: 'Lap 1 (+1 crest) meets Lap 2 (-1 trough) at the exact same spot → 1 + (-1) = 0 (destructive cancellation)', fits: false },
    { id: '1.33', n: 1.333, label: '1.33λ (Smears)', desc: 'Fractional laps shift phase continuously, smearing into zero standing amplitude over time', fits: false },
    { id: '2', n: 2.0, label: '2.0λ (Fits)', desc: 'Laps land peak-to-peak in phase → reinforces into a resonant 2-wavelength standing wave', fits: true },
    { id: '3', n: 3.0, label: '3.0λ (Fits)', desc: 'Whole number of 3 wavelengths reinforces into a permanent 6-node standing wave', fits: true }
  ];

  let currentMode = modes.find(m => m.id === config.defaultMode) || modes[0];
  let viewMode = 'all'; // 'all', 'laps', 'net'

  // 1. Controls bar
  const bar = document.createElement('div');
  bar.className = 'lq-sw-bar';
  bar.style.cssText = 'display:flex;gap:4px;padding:6px 8px;background:#14120f;border-bottom:1px solid #2e2a26;flex-wrap:wrap;align-items:center;';

  const label = document.createElement('span');
  label.textContent = 'WAVE:';
  label.style.cssText = 'font-family:ui-monospace,monospace;font-size:10px;font-weight:bold;color:#8c8376;margin-right:2px;';
  bar.appendChild(label);

  const modeButtons = [];
  modes.forEach(m => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = m.label;
    const isAct = m.id === currentMode.id;
    btn.style.cssText = `font-family:ui-monospace,monospace;font-size:10px;padding:3px 7px;cursor:pointer;border:1px solid ${isAct ? '#d99423' : '#3e3933'};background:${isAct ? '#2a2214' : '#1a1815'};color:${isAct ? '#d99423' : '#a59c86'};border-radius:2px;`;
    btn.addEventListener('click', () => {
      currentMode = m;
      modeButtons.forEach(({ b, mode }) => {
        const act = mode.id === currentMode.id;
        b.style.borderColor = act ? '#d99423' : '#3e3933';
        b.style.background = act ? '#2a2214' : '#1a1815';
        b.style.color = act ? '#d99423' : '#a59c86';
      });
      updateStatus();
    });
    bar.appendChild(btn);
    modeButtons.push({ b: btn, mode: m });
  });

  // Layer toggle
  const layerWrap = document.createElement('div');
  layerWrap.style.cssText = 'margin-left:auto;display:flex;gap:3px;align-items:center;';
  const layerLabel = document.createElement('span');
  layerLabel.textContent = 'SHOW:';
  layerLabel.style.cssText = 'font-family:ui-monospace,monospace;font-size:9px;color:#6b625a;margin-right:2px;';
  layerWrap.appendChild(layerLabel);

  const layerBtns = [
    { id: 'all', label: 'All' },
    { id: 'laps', label: 'Laps 1 & 2' },
    { id: 'net', label: 'Net Sum' }
  ].map(ly => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = ly.label;
    const isAct = ly.id === viewMode;
    btn.style.cssText = `font-family:ui-monospace,monospace;font-size:9px;padding:2px 5px;cursor:pointer;border:1px solid ${isAct ? '#8c8376' : '#2e2a26'};background:${isAct ? '#26221d' : '#14120f'};color:${isAct ? '#dcd6cc' : '#6b625a'};border-radius:2px;`;
    btn.addEventListener('click', () => {
      viewMode = ly.id;
      layerBtns.forEach(({ b, id }) => {
        const act = id === viewMode;
        b.style.borderColor = act ? '#8c8376' : '#2e2a26';
        b.style.background = act ? '#26221d' : '#14120f';
        b.style.color = act ? '#dcd6cc' : '#6b625a';
      });
    });
    layerWrap.appendChild(btn);
    return { b: btn, id: ly.id };
  });
  bar.appendChild(layerWrap);

  // Status banner with live explanation
  const statusBar = document.createElement('div');
  statusBar.className = 'lq-sw-status';
  statusBar.style.cssText = 'padding:5px 10px;font-family:ui-monospace,monospace;font-size:11px;background:#0d0c0a;border-bottom:1px solid #24201c;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px;';

  const updateStatus = () => {
    const badgeColor = currentMode.fits ? '#4ade80' : '#f59e0b';
    const tag = currentMode.fits ? 'REINFORCES' : 'CANCELS OUT';
    statusBar.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="display:inline-block;padding:1px 5px;background:${badgeColor}22;color:${badgeColor};border:1px solid ${badgeColor}44;font-size:9px;font-weight:bold;border-radius:2px;">${tag}</span>
      </div>
      <div style="font-size:10px;display:flex;gap:8px;">
        <span style="color:#34d399;font-weight:bold;">— Lap 1</span>
        <span style="color:#fb923c;font-weight:bold;">— Lap 2</span>
        <span style="color:#38bdf8;font-weight:bold;">— Net Wave</span>
      </div>
    `;
  };
  updateStatus();

  wrap.insertBefore(statusBar, view);
  wrap.insertBefore(bar, statusBar);

  let disposed = false;
  let raf = 0;
  let ro = null;
  let teardown = () => {};

  // Drag tilt & turn
  let ay = 0.55;
  let ax = 0.45;
  let drag = null;
  const onDown = e => { drag = { x: e.clientX, y: e.clientY }; try { view.setPointerCapture(e.pointerId); } catch (err) {} };
  const onMove = e => {
    if (!drag) return;
    ay += (e.clientX - drag.x) * 0.01;
    ax = Math.max(-0.1, Math.min(1.4, ax + (e.clientY - drag.y) * 0.01));
    drag = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => { drag = null; };
  view.addEventListener('pointerdown', onDown);
  view.addEventListener('pointermove', onMove);
  view.addEventListener('pointerup', onUp);
  view.addEventListener('pointercancel', onUp);

  const initSolid = async () => {
    const THREE = await import('three');
    if (disposed) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const getW = () => Math.max(240, view.clientWidth || 320);
    const getH = () => Math.max(200, view.clientHeight || 220);
    renderer.setSize(getW(), getH());
    view.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, getW() / getH(), 0.1, 100);
    camera.position.set(0, 2.5, 4.4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xe8e2d4, 0x1a1814, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(4, 5, 3);
    scene.add(sun);

    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    // 1. Central Nucleus
    const nucGeo = new THREE.SphereGeometry(0.18, 20, 16);
    const nucMat = new THREE.MeshStandardMaterial({ color: 0xd99423, emissive: 0xd99423, emissiveIntensity: 0.8, roughness: 0.3 });
    const nucleus = new THREE.Mesh(nucGeo, nucMat);
    orbitGroup.add(nucleus);

    // Nucleus glow ring
    const nucHaloGeo = new THREE.RingGeometry(0.22, 0.26, 32);
    const nucHaloMat = new THREE.MeshBasicMaterial({ color: 0xd99423, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
    const nucHalo = new THREE.Mesh(nucHaloGeo, nucHaloMat);
    nucHalo.rotation.x = Math.PI / 2;
    orbitGroup.add(nucHalo);

    // 2. Base circular track (Bohr orbit plane)
    const R = config.r || 1.6;
    const trackGeo = new THREE.RingGeometry(R - 0.008, R + 0.008, 96);
    const trackMat = new THREE.MeshBasicMaterial({ color: 0x48423a, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.rotation.x = Math.PI / 2;
    orbitGroup.add(trackMesh);

    // Spoke grid lines
    const gridMat = new THREE.LineBasicMaterial({ color: 0x2e2924, transparent: true, opacity: 0.4 });
    const gridGeo = new THREE.BufferGeometry();
    const gridPts = [];
    for (let a = 0; a < 8; a++) {
      const th = (a / 8) * Math.PI * 2;
      gridPts.push(0, 0, 0, R * 1.2 * Math.cos(th), 0, R * 1.2 * Math.sin(th));
    }
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3));
    orbitGroup.add(new THREE.LineSegments(gridGeo, gridMat));

    // 3. Dynamic Wave Meshes
    const SEGMENTS = 240;
    const lap1Geo = new THREE.BufferGeometry();
    const lap1Pos = new Float32Array((SEGMENTS + 1) * 3);
    lap1Geo.setAttribute('position', new THREE.BufferAttribute(lap1Pos, 3));
    const lap1Mat = new THREE.LineBasicMaterial({ color: 0x34d399, linewidth: 2.5 });
    const lap1Line = new THREE.Line(lap1Geo, lap1Mat);
    orbitGroup.add(lap1Line);

    const lap2Geo = new THREE.BufferGeometry();
    const lap2Pos = new Float32Array((SEGMENTS + 1) * 3);
    lap2Geo.setAttribute('position', new THREE.BufferAttribute(lap2Pos, 3));
    const lap2Mat = new THREE.LineBasicMaterial({ color: 0xfb923c, linewidth: 2.5 });
    const lap2Line = new THREE.Line(lap2Geo, lap2Mat);
    orbitGroup.add(lap2Line);

    const sumGeo = new THREE.BufferGeometry();
    const sumPos = new Float32Array((SEGMENTS + 1) * 3);
    sumGeo.setAttribute('position', new THREE.BufferAttribute(sumPos, 3));
    const sumMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 });
    const sumLine = new THREE.Line(sumGeo, sumMat);
    orbitGroup.add(sumLine);

    // 4. Vertical Connector Struts (showing crest-to-trough cancellation)
    const STRUTS = 24;
    const strutGeo = new THREE.BufferGeometry();
    const strutPos = new Float32Array(STRUTS * 2 * 3);
    strutGeo.setAttribute('position', new THREE.BufferAttribute(strutPos, 3));
    const strutMat = new THREE.LineDashedMaterial({ color: 0xa8a29e, dashSize: 0.04, gapSize: 0.02, transparent: true, opacity: 0.5 });
    const strutLines = new THREE.LineSegments(strutGeo, strutMat);
    orbitGroup.add(strutLines);

    const A = config.amp || 0.36;
    const t0 = performance.now();

    const updateWaveBuffers = (timeSec) => {
      const n = currentMode.n;
      const omega = still ? 0 : 2.2;
      const phase = timeSec * omega;

      lap1Line.visible = viewMode === 'all' || viewMode === 'laps';
      lap2Line.visible = viewMode === 'all' || viewMode === 'laps';
      sumLine.visible = viewMode === 'all' || viewMode === 'net';
      strutLines.visible = (viewMode === 'all' || viewMode === 'laps') && !currentMode.fits;

      for (let i = 0; i <= SEGMENTS; i++) {
        const u = i / SEGMENTS;
        const th = u * Math.PI * 2;
        const cosTh = Math.cos(th);
        const sinTh = Math.sin(th);

        const y1 = A * Math.cos(n * th - phase);
        const y2 = A * Math.cos(n * (th + Math.PI * 2) - phase);
        const ySum = (y1 + y2) * 0.7;

        const idx = i * 3;
        lap1Pos[idx] = R * cosTh;
        lap1Pos[idx + 1] = y1;
        lap1Pos[idx + 2] = R * sinTh;

        lap2Pos[idx] = R * cosTh;
        lap2Pos[idx + 1] = y2;
        lap2Pos[idx + 2] = R * sinTh;

        sumPos[idx] = R * cosTh;
        sumPos[idx + 1] = ySum;
        sumPos[idx + 2] = R * sinTh;
      }
      lap1Geo.attributes.position.needsUpdate = true;
      lap2Geo.attributes.position.needsUpdate = true;
      sumGeo.attributes.position.needsUpdate = true;

      for (let s = 0; s < STRUTS; s++) {
        const u = s / STRUTS;
        const th = u * Math.PI * 2;
        const cosTh = Math.cos(th);
        const sinTh = Math.sin(th);
        const y1 = A * Math.cos(n * th - phase);
        const y2 = A * Math.cos(n * (th + Math.PI * 2) - phase);

        const sIdx = s * 6;
        strutPos[sIdx] = R * cosTh;
        strutPos[sIdx + 1] = y1;
        strutPos[sIdx + 2] = R * sinTh;

        strutPos[sIdx + 3] = R * cosTh;
        strutPos[sIdx + 4] = y2;
        strutPos[sIdx + 5] = R * sinTh;
      }
      strutGeo.attributes.position.needsUpdate = true;
      strutLines.computeLineDistances();
    };

    const resize = () => {
      const w = getW();
      const h = getH();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(resize);
      ro.observe(view);
    } else {
      window.addEventListener('resize', resize);
    }

    const frame = now => {
      if (disposed) return;
      if (!still && !drag) ay += 0.005;
      orbitGroup.rotation.set(ax, ay, 0);

      const t = (now - t0) / 1000;
      updateWaveBuffers(t);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    teardown = () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener('resize', resize);
      renderer.dispose();
      nucGeo.dispose();
      nucMat.dispose();
      nucHaloGeo.dispose();
      nucHaloMat.dispose();
      trackGeo.dispose();
      trackMat.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      lap1Geo.dispose();
      lap1Mat.dispose();
      lap2Geo.dispose();
      lap2Mat.dispose();
      sumGeo.dispose();
      sumMat.dispose();
      strutGeo.dispose();
      strutMat.dispose();
      renderer.domElement.remove();
    };
  };

  // 2D flat canvas fallback
  const initFlat = () => {
    const canvas = document.createElement('canvas');
    view.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const t0 = performance.now();

    const paint = now => {
      if (disposed) return;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) * 0.32;
      const A = R * 0.24;

      ctx.fillStyle = '#d99423';
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#3e3933';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      const n = currentMode.n;
      const t = still ? 0 : (now - t0) / 1000;
      const phase = t * 2.2;

      if (viewMode === 'all' || viewMode === 'laps') {
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i <= 180; i++) {
          const th = (i / 180) * Math.PI * 2;
          const r = R + A * Math.cos(n * th - phase);
          const px = cx + r * Math.cos(th);
          const py = cy - r * Math.sin(th);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 180; i++) {
          const th = (i / 180) * Math.PI * 2;
          const r = R + A * Math.cos(n * (th + Math.PI * 2) - phase);
          const px = cx + r * Math.cos(th);
          const py = cy - r * Math.sin(th);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      if (viewMode === 'all' || viewMode === 'net') {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= 180; i++) {
          const th = (i / 180) * Math.PI * 2;
          const y1 = A * Math.cos(n * th - phase);
          const y2 = A * Math.cos(n * (th + Math.PI * 2) - phase);
          const r = R + (y1 + y2) * 0.7;
          const px = cx + r * Math.cos(th);
          const py = cy - r * Math.sin(th);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    };

    const resize = () => {
      W = Math.max(240, view.clientWidth || 320);
      H = Math.max(200, view.clientHeight || 220);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(performance.now());
    };
    resize();

    const frame = now => {
      if (disposed) return;
      paint(now);
      raf = requestAnimationFrame(frame);
    };
    if (!still) raf = requestAnimationFrame(frame);

    teardown = () => {
      cancelAnimationFrame(raf);
      canvas.remove();
    };
  };

  const wants3D = tierManager.currentTier !== 'T1';
  if (wants3D) {
    initSolid().catch(() => { if (!disposed) initFlat(); });
  } else {
    initFlat();
  }

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    view.removeEventListener('pointerdown', onDown);
    view.removeEventListener('pointermove', onMove);
    view.removeEventListener('pointerup', onUp);
    view.removeEventListener('pointercancel', onUp);
    try { teardown(); } catch (err) {}
    bar.remove();
    statusBar.remove();
  };
}

/** Animate a ladder model on its own canvas; flat, front-on, never rotated. */
function mountLadder(view, ladder, still) {
  const canvas = document.createElement('canvas');
  view.appendChild(canvas);
  view.style.cursor = 'pointer';
  view.title = 'Click to replay drop';
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0;
  let H = 0;
  let raf = 0;
  let ro = null;

  let t0 = performance.now();
  const CYCLE = 4.2; // seconds

  const paint = now => {
    const t = still ? 0 : (now - t0) / 1000;
    const progress = (t % CYCLE) / CYCLE;
    drawLadder(ctx, W, H, ladder, progress, still);
  };

  const resize = () => {
    const w = Math.max(240, view.clientWidth || 320);
    const h = Math.max(160, view.clientHeight || 220);
    if (w === W && h === H) return;
    W = w;
    H = h;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(performance.now());
  };
  resize();

  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(resize);
    ro.observe(view);
  } else {
    window.addEventListener('resize', resize);
  }

  const restart = () => { t0 = performance.now(); };
  canvas.addEventListener('click', restart);

  if (!still) {
    const frame = now => {
      paint(now);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }

  return () => {
    cancelAnimationFrame(raf);
    ro?.disconnect();
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('click', restart);
    canvas.remove();
  };
}

/** Rotate a point about y then x. */
function turn([x, y, z], ay, ax) {
  const cy = Math.cos(ay), sy = Math.sin(ay);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cx = Math.cos(ax), sx = Math.sin(ax);
  return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
}

function cleaveState(parts, t) {
  if (!parts.cleave) return null;
  const cycle = t % 4.0;
  let shear = 0;
  let lift = 0;
  let broken = false;
  if (cycle < 1.0) {
    shear = 0;
    lift = 0;
  } else if (cycle < 1.8) {
    const u = (cycle - 1.0) / 0.8;
    const s = u * u * (3 - 2 * u);
    shear = s * 1.0;
    lift = 0;
    broken = s > 0.35;
  } else if (cycle < 2.8) {
    const u = (cycle - 1.8) / 1.0;
    const s = u * u * (3 - 2 * u);
    shear = 1.0;
    lift = s * 0.75;
    broken = true;
  } else if (cycle < 3.5) {
    shear = 1.0;
    lift = 0.75;
    broken = true;
  } else {
    const u = (cycle - 3.5) / 0.5;
    const s = 1 - u * u * (3 - 2 * u);
    shear = s * 1.0;
    lift = s * 0.75;
    broken = s > 0.1;
  }
  return { shear, lift, broken, active: lift > 0.02 };
}

/** The flat picture: the same parts, projected, back to front. */
function paintFlat(ctx, w, h, parts, t, ay, ax) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  const k = (Math.min(w, h) * 0.42) / Math.max(1, parts.radius);
  const px = ([x, y, z]) => { const [a, b, c] = turn([x, y, z], ay, ax); return [w / 2 + a * k, h / 2 - b * k, c]; };
  const items = [];
  const cs = parts.cleave ? cleaveState(parts, t) : null;
  for (const r of parts.rings) {
    const steps = 48;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      pts.push(px([r.center[0] + Math.cos(a) * r.r, r.center[1] + Math.sin(a) * r.r * Math.sin(r.tilt), r.center[2] + Math.sin(a) * r.r * Math.cos(r.tilt)]));
    }
    items.push({ z: -99, draw: () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.strokeStyle = '#544e46'; ctx.lineWidth = 1; ctx.stroke(); } });
  }
  for (const b of parts.bonds) {
    const isTopA = b.a[1] > 0.4;
    const isTopB = b.b[1] > 0.4;
    if (cs && cs.broken && (isTopA !== isTopB)) continue;
    const aPos = cs && isTopA ? [b.a[0] + cs.shear, b.a[1] + cs.lift, b.a[2]] : b.a;
    const bPos = cs && isTopB ? [b.b[0] + cs.shear, b.b[1] + cs.lift, b.b[2]] : b.b;
    const [x0, y0, z0] = px(aPos);
    const [x1, y1, z1] = px(bPos);
    items.push({ z: (z0 + z1) / 2 - 0.01, draw: () => { ctx.strokeStyle = '#8c8376'; ctx.lineWidth = b.thin ? 1.2 : b.r ? Math.max(1, b.r * k * 2) : (b.order >= 3 ? 9 : b.order > 1 ? 6 : 3); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); } });
  }
  for (const s of parts.spheres) {
    const isTop = s.pos[1] > 0.4;
    const sPos = cs && isTop ? [s.pos[0] + cs.shear, s.pos[1] + cs.lift, s.pos[2]] : s.pos;
    const [x, y, z] = px(sPos);
    items.push({ z, draw: () => { ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, s.r * k), 0, Math.PI * 2); ctx.fillStyle = s.color; ctx.fill(); ctx.strokeStyle = '#2e2a26'; ctx.lineWidth = 1; ctx.stroke(); } });
  }
  const es = parts.eject ? ejectionState(parts, t) : null;
  if (es && es.rayVisible) {
    const [x0, y0] = px(es.rayTail);
    const [x1, y1, z1] = px(es.rayHead);
    items.push({
      z: z1,
      draw: () => {
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x1, y1, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    });
  }
  if (es && es.flash > 0) {
    const [fx, fy, fz] = px(es.hitPos);
    items.push({
      z: fz + 0.05,
      draw: () => {
        ctx.beginPath();
        ctx.arc(fx, fy, Math.max(3, es.flashR * k * 2), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${es.flash * 0.85})`;
        ctx.fill();
      }
    });
  }
  for (let i = 0; i < parts.electrons.length; i++) {
    const e = parts.electrons[i];
    const isOuter = es && i === es.outerIdx;
    const pos = isOuter ? es.electronPos : electronAt(e, t);
    const scale = isOuter ? es.electronScale : 1;
    const color = isOuter ? es.electronColor : '#dcd6cc';
    if (scale > 0.01) {
      const [x, y, z] = px(pos);
      items.push({
        z,
        draw: () => {
          ctx.beginPath();
          ctx.arc(x, y, Math.max(1.5, k * 0.05 * scale), 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      });
    }
  }
  items.sort((a, b) => a.z - b.z).forEach(i => i.draw());
}

/**
 * Mount a model in `host`. Returns `{ dispose }`.
 * @param {HTMLElement} host
 * @param {object} spec a `reward.model` spec
 */
export function mountModel(host, spec) {
  const parts = modelParts(spec);
  const still = Boolean(session.reduceMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const wrap = document.createElement('div');
  wrap.className = 'lq-model';
  const caption = (captionOf(spec) || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  wrap.innerHTML = `<div class="lq-model-view"></div>${caption ? `<p class="lq-model-caption">${caption}</p>` : ''}`;
  host.appendChild(wrap);
  const view = wrap.querySelector('.lq-model-view');

  // Electron shielding and effective nuclear charge (Zeff): 3D animated explainer
  if (parts.shielding || spec.type === 'shielding') {
    const teardownShielding = mountShieldingExplainer(view, wrap, parts.shielding || spec, still);
    return {
      dispose() {
        try { teardownShielding?.dispose?.(); } catch (err) { /* gone */ }
        wrap.remove();
      }
    };
  }

  // An orbital filling / electron configuration model: 2D animated energy ladder, boxes & spin arrows.
  if (parts.filling) {
    const teardownFilling = mountFilling(view, parts.filling, still);
    return {
      dispose() {
        try { teardownFilling(); } catch (err) { /* gone */ }
        wrap.remove();
      }
    };
  }

  // A wave is a trace on the desk, not a solid to turn: it gets its own flat, animated canvas.
  if (parts.wave) {
    const teardownWave = mountWave(view, parts.wave, still);
    return {
      dispose() {
        try { teardownWave(); } catch (err) { /* gone */ }
        wrap.remove();
      }
    };
  }

  // A ladder is an energy scale, not a solid to turn: it gets its own flat, animated drop and photon emission.
  if (parts.ladder) {
    const teardownLadder = mountLadder(view, parts.ladder, still);
    return {
      dispose() {
        try { teardownLadder(); } catch (err) { /* gone */ }
        wrap.remove();
      }
    };
  }

  // A standing wave on an orbit: 3D animated model showing why non-integer waves cancel out.
  if (parts.standingWave) {
    const teardownStandingWave = mountStandingWave3D(view, wrap, parts.standingWave, still);
    return {
      dispose() {
        try { teardownStandingWave(); } catch (err) { /* gone */ }
        wrap.remove();
      }
    };
  }

  // The five d-orbitals: interactive 3D model with individual orbital selection, lobe boundary surfaces, and donut ring
  if (parts.dOrbitals) {
    const teardownDOrbitals = mountDOrbitals3D(view, wrap, parts.dOrbitals, still);
    return {
      dispose() {
        try { teardownDOrbitals(); } catch (err) { /* gone */ }
        wrap.remove();
      }
    };
  }

  // Periodic atomic radius trend: 3D animated atom shrinking as protons & electrons are added
  if (parts.radiiShrink) {
    const teardownRadiiShrink = mountRadiiShrink(view, wrap, parts.radiiShrink, still);
    return {
      dispose() {
        try { teardownRadiiShrink(); } catch (err) { /* gone */ }
        wrap.remove();
      }
    };
  }

  // Ionic radius trend: 3D animated explainer showing how adding/removing an electron affects size
  if (parts.ionicRadius) {
    const teardownIonicRadius = mountIonicRadius(view, wrap, parts.ionicRadius, still);
    return {
      dispose() {
        try { teardownIonicRadius(); } catch (err) { /* gone */ }
        wrap.remove();
      }
    };
  }

  // Cuvette: 3D interactive explainer demonstrating complementary colour and Beer's law absorbance
  if (parts.cuvette || spec.type === 'cuvette') {
    const teardownCuvette = mountCuvetteExplainer(view, wrap, parts.cuvette || spec, still);
    return {
      dispose() {
        try { teardownCuvette?.dispose?.(); } catch (err) { /* gone */ }
        wrap.remove();
      }
    };
  }

  // An orbital with slice active: 3D slice explainer showing nodal planes.
  if (spec.type === 'orbital' && spec.slice) {
    let explainerObj = null;
    let isDisposed = false;
    import('./slice-explainer.js').then(m => {
      if (isDisposed) return;
      explainerObj = m.mountSliceExplainer(view);
    });
    return {
      dispose() {
        isDisposed = true;
        try { explainerObj?.dispose(); } catch (err) {}
        wrap.remove();
      }
    };
  }

  let ay = 0.5;
  let ax = 0.25;
  let drag = null;
  let raf = 0;
  let disposed = false;
  let teardown = () => {};

  const onDown = e => { drag = { x: e.clientX, y: e.clientY }; try { view.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } };
  const onMove = e => {
    if (!drag) return;
    ay += (e.clientX - drag.x) * 0.012;
    ax = Math.max(-1.2, Math.min(1.2, ax + (e.clientY - drag.y) * 0.012));
    drag = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => { drag = null; };
  view.addEventListener('pointerdown', onDown);
  view.addEventListener('pointermove', onMove);
  view.addEventListener('pointerup', onUp);
  view.addEventListener('pointercancel', onUp);

  const flat = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 320;
    view.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const t0 = performance.now();
    const tStill = parts.eject ? 1.0 : parts.cleave ? 2.5 : 0;
    const frame = now => {
      if (disposed) return;
      if (!still && !drag) ay += 0.004;
      paintFlat(ctx, canvas.width, canvas.height, parts, still ? tStill : (now - t0) / 1000, ay, ax);
      if (!still || drag) raf = requestAnimationFrame(frame);
    };
    frame(t0);
    if (still) { // a still picture repaints only when it is turned
      const repaint = () => paintFlat(ctx, canvas.width, canvas.height, parts, tStill, ay, ax);
      view.addEventListener('pointermove', repaint);
    }
    teardown = () => canvas.remove();
  };

  const solid = async () => {
    const THREE = await import('three');
    if (disposed) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const w = Math.max(240, view.clientWidth || 320);
    const h = 220;
    renderer.setSize(w, h);
    view.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);
    camera.position.set(0, 0, parts.radius * 3.2 + 1.5);
    scene.add(new THREE.HemisphereLight(0xe8e2d4, 0x1a1814, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(3, 4, 5);
    scene.add(sun);
    const group = new THREE.Group();
    scene.add(group);
    const mats = new Map();
    const mat = color => { if (!mats.has(color)) mats.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.15 })); return mats.get(color); };
    const geos = [];
    const sphereGeos = new Map();
    const sphere = (r, seg = 20) => {
      const key = `${r}|${seg}`;
      if (!sphereGeos.has(key)) { const g = new THREE.SphereGeometry(r, seg, Math.max(4, Math.round(seg * 0.7))); geos.push(g); sphereGeos.set(key, g); }
      return sphereGeos.get(key);
    };
    const sphereEntries = [];
    for (const s of parts.spheres) {
      const m = new THREE.Mesh(sphere(s.r, s.seg || 20), mat(s.color));
      m.position.set(...s.pos);
      group.add(m);
      if (parts.cleave) sphereEntries.push({ mesh: m, orig: [...s.pos], isTop: s.pos[1] > 0.4 });
    }
    const bondEntries = [];
    for (const b of parts.bonds) {
      const a = new THREE.Vector3(...b.a);
      const c = new THREE.Vector3(...b.b);
      const len = a.distanceTo(c);
      const n = b.thin ? 1 : b.order >= 3 ? 3 : b.order > 1 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const rad = b.thin ? 0.025 : (b.r ?? (Number.isInteger(b.order) ? 0.07 : 0.05));
        const g = new THREE.CylinderGeometry(rad, rad, len, 10);
        geos.push(g);
        const m = new THREE.Mesh(g, mat('#8c8376'));
        m.position.copy(a).lerp(c, 0.5);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.clone().sub(a).normalize());
        // Rods of a multiple bond lie side by side across the bond's axis (a pair above and below, or three in a row).
        if (n === 2) m.position.y += (i ? 0.1 : -0.1);
        else if (n === 3) m.position.y += (i - 1) * 0.16;
        group.add(m);
        if (parts.cleave) {
          const isCross = (b.a[1] > 0.4) !== (b.b[1] > 0.4);
          const isBothTop = (b.a[1] > 0.4) && (b.b[1] > 0.4);
          bondEntries.push({ mesh: m, isCross, isBothTop, origPos: m.position.clone() });
        }
      }
    }
    for (const r of parts.rings) {
      const g = new THREE.TorusGeometry(r.r, 0.008, 6, 72);
      geos.push(g);
      const m = new THREE.Mesh(g, mat('#6b625a'));
      m.position.set(...r.center);
      m.rotation.x = Math.PI / 2 - r.tilt;
      group.add(m);
    }
    let rayMesh = null;
    let rayTip = null;
    let flashMesh = null;
    let flashMat = null;
    let trailMeshes = [];
    let outerMat = null;
    let outerIdx = -1;

    if (parts.eject) {
      for (let i = 0; i < parts.electrons.length; i++) {
        if (outerIdx === -1 || parts.electrons[i].ring >= parts.electrons[outerIdx].ring) outerIdx = i;
      }
      outerMat = new THREE.MeshStandardMaterial({ color: 0xdcd6cc, roughness: 0.62, metalness: 0.15 });
      mats.set('outerMat', outerMat);

      const rayGeo = new THREE.CylinderGeometry(0.022, 0.022, 1, 8);
      geos.push(rayGeo);
      const rayMat = new THREE.MeshStandardMaterial({
        color: 0xffd54f,
        emissive: 0xffb300,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        transparent: true,
        opacity: 0.95
      });
      mats.set('rayMat', rayMat);
      rayMesh = new THREE.Mesh(rayGeo, rayMat);
      rayMesh.visible = false;
      group.add(rayMesh);

      const tipGeo = sphere(0.055, 10);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      mats.set('tipMat', tipMat);
      rayTip = new THREE.Mesh(tipGeo, tipMat);
      rayTip.visible = false;
      group.add(rayTip);

      const flashGeo = sphere(1, 16);
      flashMat = new THREE.MeshBasicMaterial({
        color: 0xfff9c4,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      mats.set('flashMat', flashMat);
      flashMesh = new THREE.Mesh(flashGeo, flashMat);
      flashMesh.visible = false;
      group.add(flashMesh);

      trailMeshes = [0, 1, 2].map(k => {
        const trMat = new THREE.MeshBasicMaterial({
          color: 0xffe082,
          transparent: true,
          opacity: 0,
          depthWrite: false
        });
        mats.set(`trailMat_${k}`, trMat);
        const trMesh = new THREE.Mesh(sphere(0.038 - k * 0.008, 8), trMat);
        trMesh.visible = false;
        group.add(trMesh);
        return { mesh: trMesh, mat: trMat };
      });
    }

    const eMeshes = parts.electrons.map((e, i) => {
      const m = new THREE.Mesh(sphere(0.06, 12), (parts.eject && i === outerIdx) ? outerMat : mat('#dcd6cc'));
      group.add(m);
      return m;
    });
    const t0 = performance.now();
    const frame = now => {
      if (disposed) return;
      if (!still && !drag) ay += 0.006;
      group.rotation.set(ax, ay, 0);
      const t = (still && parts.eject) ? 1.0 : (still && parts.cleave) ? 2.5 : still ? 0 : (now - t0) / 1000;
      if (parts.cleave) {
        const cs = cleaveState(parts, t);
        if (cs) {
          for (const se of sphereEntries) {
            if (se.isTop) se.mesh.position.set(se.orig[0] + cs.shear, se.orig[1] + cs.lift, se.orig[2]);
          }
          for (const be of bondEntries) {
            if (be.isCross) be.mesh.visible = !cs.broken;
            else if (be.isBothTop) be.mesh.position.set(be.origPos.x + cs.shear, be.origPos.y + cs.lift, be.origPos.z);
          }
        }
      }
      if (parts.eject) {
        const es = ejectionState(parts, t);
        if (es) {
          parts.electrons.forEach((e, i) => {
            if (i === es.outerIdx) {
              eMeshes[i].position.set(...es.electronPos);
              eMeshes[i].scale.setScalar(es.electronScale);
              eMeshes[i].visible = es.electronScale > 0.01;
              if (es.electronColor === '#ffffff') {
                outerMat.color.set(0xffffff);
                outerMat.emissive.set(0xffe082);
                outerMat.emissiveIntensity = 0.9;
              } else if (es.electronColor === '#ffe082') {
                outerMat.color.set(0xffe082);
                outerMat.emissive.set(0xffd54f);
                outerMat.emissiveIntensity = 0.5;
              } else {
                outerMat.color.set(0xdcd6cc);
                outerMat.emissive.set(0x000000);
                outerMat.emissiveIntensity = 0;
              }
            } else {
              eMeshes[i].position.set(...electronAt(e, t));
              eMeshes[i].scale.setScalar(1);
              eMeshes[i].visible = true;
            }
          });

          if (es.rayVisible) {
            rayMesh.visible = true;
            rayTip.visible = true;
            const a = new THREE.Vector3(...es.rayTail);
            const b = new THREE.Vector3(...es.rayHead);
            const len = a.distanceTo(b);
            if (len > 0.001) {
              rayMesh.position.copy(a).lerp(b, 0.5);
              rayMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
              rayMesh.scale.set(1, len, 1);
            }
            rayTip.position.copy(b);
          } else {
            rayMesh.visible = false;
            rayTip.visible = false;
          }

          if (es.flash > 0) {
            flashMesh.visible = true;
            flashMesh.position.set(...es.hitPos);
            flashMesh.scale.setScalar(es.flashR);
            flashMat.opacity = es.flash * 0.85;
          } else {
            flashMesh.visible = false;
          }

          if (es.isEjecting) {
            trailMeshes.forEach((tr, k) => {
              const dtTrail = (k + 1) * 0.05;
              const pos = es.trailPos(dtTrail);
              if (pos) {
                tr.mesh.visible = true;
                tr.mesh.position.set(...pos);
                tr.mat.opacity = Math.max(0, (0.55 - k * 0.16) * es.electronScale);
              } else {
                tr.mesh.visible = false;
              }
            });
          } else {
            trailMeshes.forEach(tr => { tr.mesh.visible = false; });
          }
        }
      } else {
        parts.electrons.forEach((e, i) => eMeshes[i].position.set(...electronAt(e, t)));
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    teardown = () => {
      renderer.dispose();
      geos.forEach(g => g.dispose());
      mats.forEach(m => m.dispose());
      renderer.domElement.remove();
    };
  };

  const wants3D = tierManager.currentTier !== 'T1';
  if (wants3D) solid().catch(() => { if (!disposed) flat(); });
  else flat();

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      try { teardown(); } catch (err) { /* gone */ }
      wrap.remove();
    }
  };
}
