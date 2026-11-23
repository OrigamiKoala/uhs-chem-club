/**
 * electronegativity-explainer.js — Animated explainer showing a more electronegative atom
 * pulling shared bonding electrons closer to itself.
 *
 * Mounted by `model-viewer.js` for `reward.model = { type: 'electronegativity-pull', ... }`.
 * Pure 2D canvas (DPR-scaled, respects reduced motion, SCOURED PLATE palette).
 */

const BG = '#0d0c0a';
const AMBER = '#e59b24';
const AMBER_SOFT = 'rgba(229, 155, 36, 0.34)';
const CYAN = '#4db8e8';
const BONE = '#e8e4dc';
const DUST = '#8c8376';

const ATOM_COLORS = {
  H: { fill: '#c8c2b6', rim: '#f0ece4', text: '#16140f', r: 24 },
  C: { fill: '#4b4741', rim: '#8f877b', text: '#f0ece4', r: 30 },
  N: { fill: '#3f6b99', rim: '#7aa9d6', text: '#f0ece4', r: 29 },
  O: { fill: '#a94834', rim: '#e07a64', text: '#f0ece4', r: 28 },
  F: { fill: '#4b8f5c', rim: '#7cd091', text: '#121813', r: 27 },
  Cl: { fill: '#4f8c54', rim: '#83c988', text: '#121813', r: 33 }
};

const ease = x => {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
};

/** Pull fraction 0..1 over a 5.4 s cycle: starts centred, pulls smoothly toward the stronger atom, holds, resets. */
function pullPhase(tSec) {
  const p = (tSec % 5.4) / 5.4;
  if (p < 0.16) return 0;
  if (p < 0.52) return ease((p - 0.16) / 0.36);
  if (p < 0.84) return 1;
  return 1 - ease((p - 0.84) / 0.16);
}

function drawAtom(ctx, x, y, r, sym, en, delta, deltaAlpha) {
  const st = ATOM_COLORS[sym] || { fill: '#6c655c', rim: '#b4aba0', text: '#f0ece4', r: 28 };
  const grad = ctx.createRadialGradient(x - r * 0.28, y - r * 0.28, r * 0.12, x, y, r);
  grad.addColorStop(0, st.rim);
  grad.addColorStop(1, st.fill);

  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Element symbol
  ctx.fillStyle = st.text;
  ctx.font = `700 ${Math.round(r * 0.72)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sym, x, y + 1);

  // Electronegativity readout below atom
  ctx.fillStyle = BONE;
  ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(`EN ${en.toFixed(1)}`, x, y + r + 10);

  // Optional partial charge badge above atom
  if (delta && deltaAlpha > 0.02) {
    ctx.globalAlpha = deltaAlpha;
    ctx.fillStyle = delta.includes('−') ? AMBER : CYAN;
    ctx.font = '700 13px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textBaseline = 'bottom';
    ctx.fillText(delta, x, y - r - 8);
  }
  ctx.restore();
}

function drawFrame(ctx, w, h, spec, tSec, still) {
  const leftSym = spec.left || 'H';
  const rightSym = spec.right || 'F';
  const enLeft = spec.enLeft ?? 2.2;
  const enRight = spec.enRight ?? 4.0;
  const showDelta = Boolean(spec.showDelta);

  const pull = still ? 1 : pullPhase(tSec);
  const diff = Math.max(0.2, enRight - enLeft);
  const maxShift = Math.min(0.68, 0.36 + diff * 0.16);
  const shift = pull * maxShift; // 0 = midpoint, >0 = shifted toward right atom

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  // Subtle desk grid
  ctx.strokeStyle = 'rgba(140,131,118,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = 24; gx < w; gx += 36) { ctx.moveTo(gx, 0); ctx.lineTo(gx, h); }
  for (let gy = 24; gy < h; gy += 36) { ctx.moveTo(0, gy); ctx.lineTo(w, gy); }
  ctx.stroke();

  const cy = Math.round(h * 0.52);
  const span = Math.min(w * 0.52, 230);
  const lx = w * 0.5 - span * 0.5;
  const rx = w * 0.5 + span * 0.5;
  const rL = (ATOM_COLORS[leftSym]?.r || 24) * Math.min(1, w / 360);
  const rR = (ATOM_COLORS[rightSym]?.r || 28) * Math.min(1, w / 360);

  // Bond line between nuclei
  ctx.strokeStyle = 'rgba(200, 192, 178, 0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(lx + rL * 0.7, cy);
  ctx.lineTo(rx - rR * 0.7, cy);
  ctx.stroke();

  // Shared electron density cloud: shifts & swells around the more electronegative atom
  const midX = (lx + rx) * 0.5;
  const pairMinX = lx + rL + 14;
  const pairMaxX = rx - rR - 14;
  const eX = midX + shift * (pairMaxX - midX);

  const cloudCx = midX + shift * (rx - midX) * 0.55;
  const cloudRx = span * 0.34 + rR * 0.55;
  const cloudRy = Math.max(rL, rR) * (1.28 + shift * 0.25);

  ctx.save();
  const cloudGrad = ctx.createRadialGradient(
    eX + shift * 14, cy, 4,
    cloudCx, cy, cloudRx * 1.15
  );
  cloudGrad.addColorStop(0, `rgba(229, 155, 36, ${0.26 + pull * 0.14})`);
  cloudGrad.addColorStop(0.55, `rgba(229, 155, 36, ${0.11 + pull * 0.08})`);
  cloudGrad.addColorStop(1, 'rgba(229, 155, 36, 0)');
  ctx.fillStyle = cloudGrad;
  ctx.beginPath();
  ctx.ellipse(cloudCx, cy, cloudRx, cloudRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Animated tug / pull chevrons from the right (stronger) atom pulling the electrons in
  if (pull > 0.05) {
    ctx.save();
    const chevStart = eX + 16;
    const chevEnd = rx - rR - 4;
    if (chevEnd > chevStart + 6) {
      const nChev = 3;
      const travel = still ? 0.5 : (tSec * 1.6) % 1;
      for (let i = 0; i < nChev; i++) {
        const u = (i / nChev + travel) % 1;
        const cx = chevStart + u * (chevEnd - chevStart);
        const a = Math.sin(u * Math.PI) * pull * 0.75;
        ctx.strokeStyle = `rgba(229, 155, 36, ${a.toFixed(3)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy - 6);
        ctx.lineTo(cx + 2, cy);
        ctx.lineTo(cx - 4, cy + 6);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Pull arrow above the bond (shows direction of stronger pull)
  const arrowY = cy - Math.max(rL, rR) - 18;
  const arrowLen = (rx - lx) * (0.28 + 0.44 * pull);
  const a0 = midX - arrowLen * 0.5;
  const a1 = midX + arrowLen * 0.5;
  if (pull > 0.06) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, pull * 1.35);
    ctx.strokeStyle = AMBER;
    ctx.fillStyle = AMBER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a0, arrowY);
    ctx.lineTo(a1, arrowY);
    ctx.stroke();
    // Plus cross on the left tail
    ctx.beginPath();
    ctx.moveTo(a0 + 6, arrowY - 4);
    ctx.lineTo(a0 + 6, arrowY + 4);
    ctx.stroke();
    // Arrowhead on the right
    ctx.beginPath();
    ctx.moveTo(a1, arrowY);
    ctx.lineTo(a1 - 7, arrowY - 4.5);
    ctx.lineTo(a1 - 7, arrowY + 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('stronger pull', midX, arrowY - 5);
    ctx.restore();
  }

  // Atoms
  drawAtom(ctx, lx, cy, rL, leftSym, enLeft, showDelta ? 'δ+' : null, pull);
  drawAtom(ctx, rx, cy, rR, rightSym, enRight, showDelta ? 'δ−' : null, pull);

  // The two shared electrons (bright amber dots) moving smoothly toward the more electronegative atom
  const bob = still ? 0 : Math.sin(tSec * 4.2) * 1.6;
  const eOffsets = [
    { dx: 0, dy: -7 + bob },
    { dx: 0, dy: 7 - bob }
  ];
  for (const off of eOffsets) {
    const ex = eX + off.dx;
    const ey = cy + off.dy;
    ctx.save();
    const glow = ctx.createRadialGradient(ex, ey, 1, ex, ey, 10);
    glow.addColorStop(0, 'rgba(255, 244, 200, 0.95)');
    glow.addColorStop(0.45, AMBER_SOFT);
    glow.addColorStop(1, 'rgba(229, 155, 36, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ex, ey, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff5cc';
    ctx.beginPath();
    ctx.arc(ex, ey, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  // Label under the shared pair
  ctx.save();
  ctx.fillStyle = pull > 0.45 ? AMBER : DUST;
  ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('shared e⁻', eX, cy + 16);
  ctx.restore();
}

export function mountElectronegativityExplainer(view, spec, still) {
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  view.appendChild(canvas);

  let raf = 0;
  let dead = false;
  const t0 = performance.now();

  const render = (now) => {
    if (dead) return;
    const rect = view.getBoundingClientRect();
    const w = Math.max(260, Math.round(rect.width || 380));
    const h = Math.max(140, Math.round(rect.height || 184));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.scale(dpr, dpr);
      drawFrame(ctx, w, h, spec, (now - t0) / 1000, still);
      ctx.restore();
    }
    if (!still) raf = requestAnimationFrame(render);
  };

  render(t0);

  return () => {
    dead = true;
    cancelAnimationFrame(raf);
    canvas.remove();
  };
}
