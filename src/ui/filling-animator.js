/**
 * filling-animator.js — Interactive, concept-driven electron configuration & orbital filling animations.
 *
 * Visually demonstrates:
 *   1. The Aufbau Principle: Electrons occupy the lowest available potential energy levels first.
 *   2. Hund's Rule: In degenerate orbitals (same energy), electrons spread out singly with parallel spins before pairing.
 *   3. Energy Order vs Shell Order: 4s lies lower on the energy ladder than 3d, filling before 3d begins.
 *   4. Transition Metals (3d subshell): Once 4s is filled with 2 electrons, additional electrons enter 3d.
 *
 * Click anywhere to replay the sequential filling animation.
 */

const BG = '#0d0c0a';
const STEEL = '#544e46';
const PALE = '#dcd6cc';
const AMBER = '#d99423';
const AMBER_GLOW = 'rgba(217, 148, 35, 0.4)';
const MUTED = '#8c8376';
const GRID = 'rgba(140, 131, 118, 0.08)';
const BOX_BG = '#1a1815';
const BOX_BORDER = '#3e3933';
const BOX_ACTIVE = '#d99423';

/** Element metadata. */
const ELEMENTS = {
  6: { sym: 'C', name: 'Carbon', config: '1s² 2s² 2p²', core: null },
  7: { sym: 'N', name: 'Nitrogen', config: '1s² 2s² 2p³', core: null },
  8: { sym: 'O', name: 'Oxygen', config: '1s² 2s² 2p⁴', core: null },
  19: { sym: 'K', name: 'Potassium', config: '[Ar] 4s¹', core: 'Ar' },
  20: { sym: 'Ca', name: 'Calcium', config: '[Ar] 4s²', core: 'Ar' },
  21: { sym: 'Sc', name: 'Scandium', config: '[Ar] 4s² 3d¹', core: 'Ar' }
};

/**
 * Build the list of electron placement events for a given Z.
 * Each item: { num, row, box, spin, text }
 */
function buildElectronSteps(z) {
  const steps = [];

  if (z <= 10) {
    // Light elements: 1s, 2s, 2p
    // 1s
    if (z >= 1) steps.push({ num: 1, row: '1s', box: 0, spin: 'u', text: '1s¹' });
    if (z >= 2) steps.push({ num: 2, row: '1s', box: 0, spin: 'd', text: '1s²' });
    // 2s
    if (z >= 3) steps.push({ num: 3, row: '2s', box: 0, spin: 'u', text: '1s² 2s¹' });
    if (z >= 4) steps.push({ num: 4, row: '2s', box: 0, spin: 'd', text: '1s² 2s²' });
    // 2p
    if (z >= 5) steps.push({ num: 5, row: '2p', box: 0, spin: 'u', text: '1s² 2s² 2p¹' });
    if (z >= 6) steps.push({ num: 6, row: '2p', box: 1, spin: 'u', text: '1s² 2s² 2p²' });
    if (z >= 7) steps.push({ num: 7, row: '2p', box: 2, spin: 'u', text: '1s² 2s² 2p³' });
    if (z >= 8) steps.push({ num: 8, row: '2p', box: 0, spin: 'd', text: '1s² 2s² 2p⁴' });
    if (z >= 9) steps.push({ num: 9, row: '2p', box: 1, spin: 'd', text: '1s² 2s² 2p⁵' });
    if (z >= 10) steps.push({ num: 10, row: '2p', box: 2, spin: 'd', text: '1s² 2s² 2p⁶' });
  } else if (z === 19) {
    // Potassium: Argon core + 19th in 4s
    steps.push({ num: 19, row: '4s', box: 0, spin: 'u', text: '[Ar] 4s¹' });
  } else if (z === 20) {
    // Calcium
    steps.push({ num: 19, row: '4s', box: 0, spin: 'u', text: '[Ar] 4s¹' });
    steps.push({ num: 20, row: '4s', box: 0, spin: 'd', text: '[Ar] 4s²' });
  } else if (z >= 21) {
    // Scandium
    steps.push({ num: 19, row: '4s', box: 0, spin: 'u', text: '[Ar] 4s¹' });
    steps.push({ num: 20, row: '4s', box: 0, spin: 'd', text: '[Ar] 4s²' });
    steps.push({ num: 21, row: '3d', box: 0, spin: 'u', text: '[Ar] 4s² 3d¹' });
  }

  return steps;
}

/** Smoothstep ease. */
const ease = t => t * t * (3 - 2 * t);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Draw a single box with optional up/down arrows.
 */
function drawBox(ctx, x, y, size, label, state = { u: false, d: false, active: false }) {
  const hw = size / 2;

  // Box background & border
  ctx.fillStyle = state.active ? '#2b2316' : BOX_BG;
  ctx.fillRect(x - hw, y - hw, size, size);

  ctx.strokeStyle = state.active ? BOX_ACTIVE : BOX_BORDER;
  ctx.lineWidth = state.active ? 2 : 1.5;
  if (state.active) {
    ctx.shadowColor = AMBER_GLOW;
    ctx.shadowBlur = 8;
  }
  ctx.strokeRect(x - hw, y - hw, size, size);
  ctx.shadowBlur = 0;

  // Sub-label below box if given
  if (label) {
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = state.active ? AMBER : MUTED;
    ctx.fillText(label, x, y + hw + 4);
  }

  // Draw Up arrow (↑) in amber
  if (state.u) {
    const ax = state.d ? x - hw * 0.38 : x - (state.standalone ? 0 : hw * 0.38);
    const topY = y - hw * 0.55;
    const botY = y + hw * 0.55;

    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ax, botY);
    ctx.lineTo(ax, topY);
    ctx.stroke();

    // Barb head pointing UP
    ctx.beginPath();
    ctx.moveTo(ax - 4.5, topY + 5.5);
    ctx.lineTo(ax, topY);
    ctx.stroke();
  }

  // Draw Down arrow (↓) in pale titanium
  if (state.d) {
    const ax = x + hw * 0.38;
    const topY = y - hw * 0.55;
    const botY = y + hw * 0.55;

    ctx.strokeStyle = PALE;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ax, topY);
    ctx.lineTo(ax, botY);
    ctx.stroke();

    // Barb head pointing DOWN
    ctx.beginPath();
    ctx.moveTo(ax + 4.5, botY - 5.5);
    ctx.lineTo(ax, botY);
    ctx.stroke();
  }
}

/**
 * Main draw function.
 */
export function drawFilling(ctx, w, h, spec, progress, still) {
  const z = spec.z || 6;
  const info = ELEMENTS[z] || { sym: 'X', name: `Z = ${z}`, config: '' };
  const steps = buildElectronSteps(z);

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  // Subtle survey grid
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 20; x <= w - 20; x += 36) { ctx.moveTo(x, 16); ctx.lineTo(x, h - 16); }
  for (let y = 16; y <= h - 16; y += 24) { ctx.moveTo(20, y); ctx.lineTo(w - 20, y); }
  ctx.stroke();

  // Animation timing
  // Progress in [0, 1]. Total step slots = steps.length + hold window
  const totalSlots = steps.length + 1.6;
  const slotProgress = still ? totalSlots : progress * totalSlots;
  const currentStepIdx = Math.min(steps.length, Math.floor(slotProgress));
  const activeSubStep = slotProgress - Math.floor(slotProgress);

  // Current electron count placed so far
  const placedCount = still ? steps.length : currentStepIdx;
  const currentConfig = placedCount > 0 ? steps[Math.min(steps.length - 1, placedCount - 1)].text : (info.core ? `[${info.core}]` : 'Empty');

  // Top Header: Element & Configuration
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = AMBER;
  ctx.fillText(`${info.name.toUpperCase()} (Z = ${z})`, 28, 12);

  ctx.textAlign = 'right';
  ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = PALE;
  ctx.fillText(currentConfig, w - 28, 12);

  // Draw Energy Axis on Left
  const axisX = 38;
  const axisTop = 38;
  const axisBot = h - 42;

  ctx.strokeStyle = STEEL;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(axisX, axisBot);
  ctx.lineTo(axisX, axisTop);
  ctx.stroke();

  // Arrowhead on Energy Axis
  ctx.fillStyle = STEEL;
  ctx.beginPath();
  ctx.moveTo(axisX, axisTop - 6);
  ctx.lineTo(axisX - 4, axisTop + 2);
  ctx.lineTo(axisX + 4, axisTop + 2);
  ctx.closePath();
  ctx.fill();

  // Axis label: ENERGY (vertical)
  ctx.save();
  ctx.translate(axisX - 12, (axisTop + axisBot) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.font = 'bold 9px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = MUTED;
  ctx.fillText('ENERGY (E)', 0, 0);
  ctx.restore();

  // Draw based on Mode
  if (z <= 10) {
    // -------------------------------------------------------------
    // LIGHT ELEMENTS (1s, 2s, 2p)
    // -------------------------------------------------------------
    const boxSize = Math.max(26, Math.min(36, h * 0.14));
    const gap = boxSize + 6;

    const y1s = axisBot - boxSize * 0.8;
    const y2s = y1s - (axisBot - axisTop) * 0.32;
    const y2p = y2s - (axisBot - axisTop) * 0.32;

    const centerX = w * 0.52;

    // Subshell row tick guides from axis
    const drawRowGuide = (label, y) => {
      ctx.strokeStyle = 'rgba(140, 131, 118, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(axisX + 4, y);
      ctx.lineTo(w * 0.32, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillStyle = PALE;
      ctx.fillText(label, w * 0.30, y);
    };

    drawRowGuide('1s', y1s);
    drawRowGuide('2s', y2s);
    drawRowGuide('2p', y2p);

    // Track box occupancy from steps
    const state = {
      '1s:0': { u: false, d: false, active: false },
      '2s:0': { u: false, d: false, active: false },
      '2p:0': { u: false, d: false, active: false },
      '2p:1': { u: false, d: false, active: false },
      '2p:2': { u: false, d: false, active: false }
    };

    for (let i = 0; i < placedCount; i++) {
      const st = steps[i];
      const key = `${st.row}:${st.box}`;
      if (state[key]) state[key][st.spin] = true;
    }

    // Active box highlight
    if (!still && currentStepIdx < steps.length) {
      const nextStep = steps[currentStepIdx];
      const nextKey = `${nextStep.row}:${nextStep.box}`;
      if (state[nextKey]) state[nextKey].active = true;
    }

    // Draw 1s (1 box)
    drawBox(ctx, centerX, y1s, boxSize, '', state['1s:0']);

    // Draw 2s (1 box)
    drawBox(ctx, centerX, y2s, boxSize, '', state['2s:0']);

    // Draw 2p (3 boxes side by side)
    const pSubLabels = ['2px', '2py', '2pz'];
    for (let b = 0; b < 3; b++) {
      const bx = centerX + (b - 1) * gap;
      drawBox(ctx, bx, y2p, boxSize, pSubLabels[b], state[`2p:${b}`]);
    }

    // If currently placing an electron, draw the dropping particle
    if (!still && currentStepIdx < steps.length) {
      const st = steps[currentStepIdx];
      let targetX = centerX;
      let targetY = y1s;
      if (st.row === '2s') targetY = y2s;
      else if (st.row === '2p') { targetY = y2p; targetX = centerX + (st.box - 1) * gap; }

      const dropY = (targetY - 32) + 32 * ease(clamp(activeSubStep * 2.2, 0, 1));
      ctx.fillStyle = st.spin === 'u' ? AMBER : PALE;
      ctx.beginPath();
      ctx.arc(targetX, dropY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Impact ripple
      if (activeSubStep > 0.45) {
        const rk = (activeSubStep - 0.45) / 0.55;
        ctx.strokeStyle = `rgba(217, 148, 35, ${1 - rk})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(targetX, targetY, boxSize * 0.5 + rk * 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

  } else {
    // -------------------------------------------------------------
    // POTASSIUM & SCANDIUM (Argon core, 4s, 3d)
    // -------------------------------------------------------------
    const boxSize = Math.max(26, Math.min(34, h * 0.13));
    const gap = boxSize + 6;

    // [Ar] Core at bottom
    const coreY = axisBot - 18;
    const coreW = Math.min(360, w * 0.62);
    const coreH = 26;
    const coreX = w * 0.54;

    ctx.fillStyle = '#1c1915';
    ctx.fillRect(coreX - coreW / 2, coreY - coreH / 2, coreW, coreH);
    ctx.strokeStyle = STEEL;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(coreX - coreW / 2, coreY - coreH / 2, coreW, coreH);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = PALE;
    ctx.fillText('[Ar] Noble Gas Core (18 e⁻) · 1s² 2s² 2p⁶ 3s² 3p⁶ Full', coreX, coreY);

    // 4s sits at lower energy than 3d!
    const y4s = axisBot - (axisBot - axisTop) * 0.38;
    const y3d = y4s - (axisBot - axisTop) * 0.32;

    const x4s = w * 0.35;
    const center3d = w * 0.68;

    // Row guides
    ctx.strokeStyle = 'rgba(140, 131, 118, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    // 4s guide
    ctx.beginPath();
    ctx.moveTo(axisX + 4, y4s);
    ctx.lineTo(x4s - boxSize / 2 - 6, y4s);
    ctx.stroke();

    // 3d guide
    ctx.beginPath();
    ctx.moveTo(axisX + 4, y3d);
    ctx.lineTo(center3d - gap * 2 - boxSize / 2 - 6, y3d);
    ctx.stroke();
    ctx.setLineDash([]);

    // Subshell labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = AMBER;
    ctx.fillText('4s', x4s - boxSize / 2 - 10, y4s);

    ctx.fillStyle = PALE;
    ctx.fillText('3d', center3d - gap * 2 - boxSize / 2 - 10, y3d);

    // ΔE Bracket on Energy Axis showing 4s < 3d
    const bktX = axisX + 16;
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bktX + 4, y3d);
    ctx.lineTo(bktX, y3d);
    ctx.lineTo(bktX, y4s);
    ctx.lineTo(bktX + 4, y4s);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = 'bold 10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = AMBER;
    ctx.fillText('E(4s) < E(3d)', bktX + 8, (y3d + y4s) / 2);

    // Track states
    const state = {
      '4s:0': { u: false, d: false, active: false },
      '3d:0': { u: false, d: false, active: false },
      '3d:1': { u: false, d: false, active: false },
      '3d:2': { u: false, d: false, active: false },
      '3d:3': { u: false, d: false, active: false },
      '3d:4': { u: false, d: false, active: false }
    };

    for (let i = 0; i < placedCount; i++) {
      const st = steps[i];
      const key = `${st.row}:${st.box}`;
      if (state[key]) state[key][st.spin] = true;
    }

    if (!still && currentStepIdx < steps.length) {
      const nextStep = steps[currentStepIdx];
      const nextKey = `${nextStep.row}:${nextStep.box}`;
      if (state[nextKey]) state[nextKey].active = true;
    }

    // Draw 4s box
    drawBox(ctx, x4s, y4s, boxSize, '4s', state['4s:0']);

    // Draw 3d boxes (5 boxes)
    const dLabels = ['xy', 'yz', 'xz', 'x²-y²', 'z²'];
    for (let b = 0; b < 5; b++) {
      const bx = center3d + (b - 2) * gap;
      drawBox(ctx, bx, y3d, boxSize, dLabels[b], state[`3d:${b}`]);
    }

    // If placing, animate falling electron
    if (!still && currentStepIdx < steps.length) {
      const st = steps[currentStepIdx];
      let targetX = x4s;
      let targetY = y4s;
      if (st.row === '3d') {
        targetX = center3d + (st.box - 2) * gap;
        targetY = y3d;
      }

      const dropY = (targetY - 36) + 36 * ease(clamp(activeSubStep * 2.2, 0, 1));
      ctx.fillStyle = st.spin === 'u' ? AMBER : PALE;
      ctx.beginPath();
      ctx.arc(targetX, dropY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      if (activeSubStep > 0.45) {
        const rk = (activeSubStep - 0.45) / 0.55;
        ctx.strokeStyle = `rgba(217, 148, 35, ${1 - rk})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(targetX, targetY, boxSize * 0.5 + rk * 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}

/**
 * Mount filling explainer canvas on host element.
 * Returns { dispose }.
 */
export function mountFilling(view, spec, still) {
  const canvas = document.createElement('canvas');
  view.appendChild(canvas);
  view.style.cursor = 'pointer';
  view.title = 'Click to replay animation';

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let W = 0;
  let H = 0;
  let raf = 0;
  let ro = null;

  let t0 = performance.now();
  const CYCLE = 5.2; // seconds

  const paint = now => {
    const t = still ? 0 : (now - t0) / 1000;
    const progress = (t % CYCLE) / CYCLE;
    drawFilling(ctx, W, H, spec, progress, still);
  };

  const resize = () => {
    const w = Math.max(260, view.clientWidth || 320);
    const h = Math.max(180, view.clientHeight || 220);
    if (w === W && h === H) return;
    W = w;
    H = h;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    paint(performance.now());
  };

  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(resize);
    ro.observe(view);
  }
  window.addEventListener('resize', resize);
  resize();

  // Click to replay
  const onClick = () => {
    t0 = performance.now();
    if (still) paint(t0);
  };
  view.addEventListener('click', onClick);

  if (!still) {
    const frame = now => {
      paint(now);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  } else {
    paint(t0);
  }

  return () => {
    cancelAnimationFrame(raf);
    ro?.disconnect();
    window.removeEventListener('resize', resize);
    view.removeEventListener('click', onClick);
    canvas.remove();
  };
}
