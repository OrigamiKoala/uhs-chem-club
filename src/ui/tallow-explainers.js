/**
 * tallow-explainers.js — Custom animated explainers for Tallow (Unit 1) reward cards:
 *   - rutherford-beam: closeup particles zooming past/bouncing off the nucleus (no text inside).
 *   - charge-plates: closeup proton deflecting toward − plate while neutron flies straight through.
 *   - shell-fill: electrons added to a nucleus in succession, filling shells 2 -> 8 -> 1.
 *   - mg-cation: two valence electrons leaving Mg, smiley face on stable nucleus + stability text.
 */

const AMBER = '#e59b24';
const AMBER_SOFT = 'rgba(229, 155, 36, 0.28)';
const BLUE = '#7dd3fc';
const STEEL = '#94a3b8';
const INK = '#e8e2d5';
const BG = '#12100d';

function makeCanvas(view, h = 210) {
  const cv = document.createElement('canvas');
  cv.style.cssText = `display:block;width:100%;height:${h}px;background:${BG};`;
  view.appendChild(cv);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    const w = Math.max(320, Math.floor(view.clientWidth || 440));
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    return { w, h };
  };
  let dims = resize();
  const ctx = cv.getContext('2d');
  return { cv, ctx, dpr, getDims: () => { dims = resize(); return dims; } };
}

function runLoop(cv, still, draw) {
  let raf = 0;
  let dead = false;
  const t0 = performance.now();
  const frame = (now) => {
    if (dead || !cv.isConnected) return;
    const t = still ? 2.4 : (now - t0) / 1000;
    draw(t);
    if (!still) raf = requestAnimationFrame(frame);
  };
  frame(t0);
  return () => { dead = true; cancelAnimationFrame(raf); };
}

/** 1. Rutherford beam closeup — no text inside the canvas. */
export function mountRutherfordBeam(view, still) {
  const { cv, ctx, dpr, getDims } = makeCanvas(view, 200);
  // Predefined trajectories: { yFrac, offset, mode: 'through' | 'deflect' | 'bounce', sign }
  const shots = [
    { yOff: -0.34, phase: 0.00, mode: 'through' },
    { yOff:  0.28, phase: 0.22, mode: 'through' },
    { yOff: -0.14, phase: 0.45, mode: 'deflect', sign: -1 },
    { yOff:  0.00, phase: 0.68, mode: 'bounce' },
    { yOff:  0.15, phase: 0.90, mode: 'deflect', sign: 1 },
    { yOff: -0.26, phase: 1.12, mode: 'through' },
    { yOff:  0.35, phase: 1.35, mode: 'through' }
  ];
  const PERIOD = 2.6;

  return runLoop(cv, still, (t) => {
    const { w, h } = getDims();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.60;
    const cy = h * 0.50;
    const atomR = Math.min(w * 0.28, h * 0.44);
    const nucR = 9;

    // Outer atom boundary (mostly empty space)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.26)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, atomR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Faint inner shell
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.beginPath();
    ctx.arc(cx, cy, atomR * 0.52, 0, Math.PI * 2);
    ctx.stroke();

    // Dense central nucleus
    const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, nucR * 2.2);
    grad.addColorStop(0, '#fde68a');
    grad.addColorStop(0.45, AMBER);
    grad.addColorStop(1, 'rgba(229, 155, 36, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, nucR * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = AMBER;
    ctx.beginPath();
    ctx.arc(cx, cy, nucR, 0, Math.PI * 2);
    ctx.fill();

    // Draw zoomed particles & trails
    for (const s of shots) {
      const u = ((t + s.phase) % PERIOD) / PERIOD; // 0..1
      const startX = w * 0.05;
      const endX = w * 0.96;
      const y0 = cy + s.yOff * h;
      const hitU = (cx - nucR * 1.4 - startX) / (endX - startX);

      const posAt = (p) => {
        if (s.mode === 'through') {
          return { x: startX + (endX - startX) * p, y: y0 };
        }
        if (s.mode === 'deflect') {
          const x = startX + (endX - startX) * p;
          if (p <= hitU) return { x, y: y0 };
          const k = (p - hitU) / (1 - hitU);
          return { x, y: y0 + s.sign * k * k * h * 0.34 };
        }
        // Bounce off the nucleus
        if (p <= hitU) {
          return { x: startX + (endX - startX) * p, y: y0 };
        }
        const k = (p - hitU) / (1 - hitU);
        const bx = cx - nucR * 1.4 - k * (cx - startX) * 1.05;
        const by = y0 - k * h * 0.14;
        return { x: bx, y: by };
      };

      const cur = posAt(u);
      // Faint trail
      ctx.strokeStyle = s.mode === 'bounce' ? 'rgba(251, 191, 36, 0.55)' : 'rgba(125, 211, 252, 0.35)';
      ctx.lineWidth = s.mode === 'bounce' ? 2.4 : 1.6;
      ctx.beginPath();
      const trailSteps = 12;
      for (let i = 0; i <= trailSteps; i++) {
        const pu = Math.max(0, u - 0.12 * (1 - i / trailSteps));
        const pt = posAt(pu);
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Particle dot
      ctx.fillStyle = s.mode === 'bounce' ? '#fde68a' : BLUE;
      ctx.beginPath();
      ctx.arc(cur.x, cur.y, s.mode === 'bounce' ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** 2. Charged plates closeup: proton bends toward − plate, neutron flies straight through. */
export function mountChargePlates(view, still) {
  const { cv, ctx, dpr, getDims } = makeCanvas(view, 200);
  const PERIOD = 3.0;

  return runLoop(cv, still, (t) => {
    const { w, h } = getDims();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    const px0 = w * 0.28;
    const px1 = w * 0.78;
    const topY = h * 0.18;
    const botY = h * 0.82;
    const midY = h * 0.50;

    // Top (+) plate
    ctx.fillStyle = AMBER;
    ctx.fillRect(px0, topY - 5, px1 - px0, 10);
    // Bottom (−) plate
    ctx.fillStyle = STEEL;
    ctx.fillRect(px0, botY - 5, px1 - px0, 10);

    // Minimal + / − polarity signs on the plates
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = AMBER;
    ctx.fillText('+', px1 + 14, topY);
    ctx.fillStyle = STEEL;
    ctx.fillText('−', px1 + 14, botY);

    // Subtle vertical electric field lines
    ctx.strokeStyle = 'rgba(229, 155, 36, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const fx = px0 + ((px1 - px0) * i) / 6;
      ctx.beginPath();
      ctx.moveTo(fx, topY + 8);
      ctx.lineTo(fx, botY - 8);
      ctx.stroke();
    }

    const u = (t % PERIOD) / PERIOD;
    const startX = w * 0.06;
    const endX = w * 0.94;
    const x = startX + (endX - startX) * u;

    // Neutron trajectory: straight through
    const nY = midY - 12;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(startX, nY);
    ctx.lineTo(x, nY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = STEEL;
    ctx.beginPath();
    ctx.arc(x, nY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Proton trajectory: curves down toward − plate once between plates
    const pPos = (px) => {
      if (px <= px0) return midY + 12;
      const k = Math.min(1.25, (px - px0) / (px1 - px0));
      return Math.min(botY - 14, midY + 12 + k * k * (botY - midY - 26));
    };
    ctx.strokeStyle = 'rgba(229, 155, 36, 0.65)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i <= 32; i++) {
      const sx = startX + ((x - startX) * i) / 32;
      const sy = pPos(sx);
      if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    const py = pPos(x);
    ctx.fillStyle = AMBER;
    ctx.beginPath();
    ctx.arc(x, py, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#12100d';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillText('+', x, py + 0.5);
  });
}

/** 3. Shell-filling animation: electrons added one by one into shells 2, 8, 1. */
export function mountShellFill(view, spec, still) {
  const { cv, ctx, dpr, getDims } = makeCanvas(view, 210);
  const shells = spec.shells || [2, 8, 1];
  const total = shells.reduce((a, b) => a + b, 0);
  const STEP = 0.55;
  const HOLD = 1.8;
  const PERIOD = total * STEP + HOLD;

  // Build ordered list of (shellIdx, slotIdx, slotCount)
  const slots = [];
  shells.forEach((n, si) => {
    for (let j = 0; j < n; j++) slots.push({ si, j, n });
  });

  return runLoop(cv, still, (t) => {
    const { w, h } = getDims();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const maxR = Math.min(w, h) * 0.42;
    const radii = shells.map((_, i) => maxR * (0.36 + (i / Math.max(1, shells.length - 1)) * 0.60));

    // Shell rings
    radii.forEach((rr) => {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.38)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Nucleus
    ctx.fillStyle = AMBER;
    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.fill();

    const localT = still ? total * STEP : (t % PERIOD);
    const spin = t * 0.45;

    for (let idx = 0; idx < slots.length; idx++) {
      const start = idx * STEP;
      if (localT < start) break;
      const p = Math.min(1, (localT - start) / (STEP * 0.85));
      const ease = 1 - Math.pow(1 - p, 3);
      const { si, j, n } = slots[idx];
      const rr = radii[si];
      const ang = -Math.PI / 2 + (j / n) * Math.PI * 2 + spin * (si % 2 === 0 ? 1 : -1) * (1 / (1 + si * 0.35));
      const tx = cx + Math.cos(ang) * rr;
      const ty = cy + Math.sin(ang) * rr;
      const sx = cx + Math.cos(ang) * (maxR * 1.45);
      const sy = cy + Math.sin(ang) * (maxR * 1.45);
      const ex = sx + (tx - sx) * ease;
      const ey = sy + (ty - sy) * ease;

      if (p < 1) {
        ctx.fillStyle = AMBER_SOFT;
        ctx.beginPath();
        ctx.arc(ex, ey, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = p < 1 ? '#fde68a' : BLUE;
      ctx.beginPath();
      ctx.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** 4. Magnesium cation animation: 2 outer electrons leave, smiley face on stable Mg2+ nucleus. */
export function mountMgCation(view, still) {
  const { cv, ctx, dpr, getDims } = makeCanvas(view, 220);
  const PERIOD = 5.2;

  return runLoop(cv, still, (t) => {
    const { w, h } = getDims();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.46;
    const r1 = 30;
    const r2 = 54;
    const r3 = 78;

    const u = still ? 0.72 : (t % PERIOD) / PERIOD;
    // 0..0.22: intact Mg (2,8,2); 0.22..0.55: 2 valence electrons fly away; 0.55..1: stable Mg2+ with smiley
    const leaveP = Math.max(0, Math.min(1, (u - 0.22) / 0.33));
    const easeLeave = 1 - Math.pow(1 - leaveP, 2);
    const stableA = Math.max(0, Math.min(1, (u - 0.52) / 0.14));

    // Inner 2 shells
    [r1, r2].forEach((rr, idx) => {
      ctx.strokeStyle = idx === 1 && stableA > 0 ? `rgba(229, 155, 36, ${0.42 + 0.45 * stableA})` : 'rgba(148, 163, 184, 0.42)';
      ctx.lineWidth = idx === 1 && stableA > 0 ? 2.2 : 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Outer 3rd shell fades out as valence electrons leave
    if (leaveP < 0.95) {
      ctx.strokeStyle = `rgba(148, 163, 184, ${0.35 * (1 - leaveP)})`;
      ctx.lineWidth = 1.3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, r3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Inner 2 + 8 electrons orbiting gently
    const spin = t * 0.45;
    [[r1, 2, 1], [r2, 8, -0.75]].forEach(([rr, n, dir]) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + spin * dir;
        ctx.fillStyle = BLUE;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Two outer valence electrons flying away (left and right)
    if (leaveP < 1) {
      [-1, 1].forEach((side) => {
        const ex = cx + side * (r3 + easeLeave * (w * 0.45));
        const ey = cy - Math.sin(easeLeave * Math.PI) * 18;
        ctx.fillStyle = AMBER_SOFT;
        ctx.beginPath();
        ctx.arc(ex, ey, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.arc(ex, ey, 5.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Nucleus
    ctx.fillStyle = AMBER;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();

    // Smiley face on nucleus when stable
    if (stableA > 0) {
      ctx.save();
      ctx.globalAlpha = stableA;
      ctx.fillStyle = '#12100d';
      ctx.beginPath();
      ctx.arc(cx - 5.5, cy - 4, 2.2, 0, Math.PI * 2);
      ctx.arc(cx + 5.5, cy - 4, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#12100d';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy + 1, 7.5, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }

    // Bottom text
    ctx.save();
    ctx.globalAlpha = Math.max(0.25, stableA);
    ctx.fillStyle = INK;
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Magnesium 2+ has a full outer shell, so it is stable', cx, h - 18);
    ctx.restore();
  });
}

/** 5. Absorption ladder animation (Lanternfall Q3 S5): matching photon lifts electron up ladder; wrong colours pass through. */
export function mountAbsorptionLadder(view, still) {
  const { cv, ctx, dpr, getDims } = makeCanvas(view, 210);
  // 3 sequential photons: green (passes through), red (matches n=2 -> n=3, absorbed & lifts electron), blue (passes through)
  const CYCLE = 7.2;

  return runLoop(cv, still, (t) => {
    const { w, h } = getDims();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    const lx0 = w * 0.42;
    const lx1 = w * 0.72;
    const midX = (lx0 + lx1) / 2;
    const rungs = [h * 0.80, h * 0.56, h * 0.34, h * 0.16]; // n=1, 2, 3, 4

    // Draw energy ladder rungs
    rungs.forEach((ry, idx) => {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx0, ry);
      ctx.lineTo(lx1, ry);
      ctx.stroke();
      ctx.fillStyle = STEEL;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`n = ${idx + 1}`, lx1 + 10, ry);
    });

    const u = still ? 4.4 : (t % CYCLE);
    // Shot 1 (0..2.2): green photon passes straight through
    // Shot 2 (2.2..5.0): red photon hits electron at n=2, gets absorbed, electron climbs to n=3!
    // Shot 3 (5.0..7.2): violet photon passes straight through while electron returns
    let eY = rungs[1];
    let hitGlow = 0;

    if (u < 2.2) {
      const p = u / 2.2;
      const px = w * 0.06 + (w * 0.88) * p;
      drawPhotonWave(ctx, px, rungs[1], '#4ade80');
    } else if (u < 5.0) {
      const p = (u - 2.2) / 2.8;
      const hitAt = 0.42;
      if (p < hitAt) {
        const px = w * 0.06 + (midX - w * 0.06) * (p / hitAt);
        drawPhotonWave(ctx, px, rungs[1], '#ef4444');
      } else {
        const climbP = Math.min(1, (p - hitAt) / 0.30);
        const ease = 1 - Math.pow(1 - climbP, 3);
        eY = rungs[1] + (rungs[2] - rungs[1]) * ease;
        hitGlow = Math.max(0, 1 - (p - hitAt) / 0.35);
      }
    } else {
      const p = (u - 5.0) / 2.2;
      const backP = Math.min(1, p / 0.25);
      eY = rungs[2] + (rungs[1] - rungs[2]) * backP;
      const px = w * 0.06 + (w * 0.88) * p;
      drawPhotonWave(ctx, px, rungs[1], '#60a5fa');
    }

    // Absorption ring flash
    if (hitGlow > 0) {
      ctx.strokeStyle = `rgba(239, 68, 68, ${hitGlow * 0.8})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(midX, rungs[1], 10 + (1 - hitGlow) * 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Electron dot
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.arc(midX, eY, 7, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPhotonWave(ctx, cx, cy, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = -16; i <= 16; i++) {
    const x = cx + i;
    const y = cy + Math.sin(i * 0.55) * 5;
    if (i === -16) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx + 17, cy, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
