/**
 * photoelectric-explainer.js — Interactive animation of the Photoelectric Effect.
 *
 * Demonstrates:
 * 1. Photon strikes metal surface → electron is liberated and ejected.
 * 2. Higher brightness (more photons) → more electrons emitted (higher current).
 * 3. Higher frequency / photon energy → electrons emitted with higher kinetic energy (higher speed).
 * 4. Below threshold frequency (e.g. red light) → no electrons emitted, regardless of brightness.
 */

import { planPhotocell, wavelengthRgb } from '../learn/engine/lightdata.js';

function lightColour(nm) {
  const rgb = wavelengthRgb(nm);
  if (rgb) return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  return nm < 380 ? '#9b59b6' : '#e74c3c';
}

const BG = '#0d0c0a';

// Work functions for common metals in eV
const WORK_FUNCTIONS = {
  Cs: 2.14,
  Na: 2.36,
  Zn: 4.31
};

export function mountPhotoelectricExplainer(view, wrap, spec, still) {
  let metal = spec.metal || 'Na';
  let nm = spec.nm || 400; // 400 nm = violet
  let brightness = Math.max(1, Math.min(4, spec.brightness || 2));
  let disposed = false;
  let rafId = 0;

  // Controls container
  const controls = document.createElement('div');
  controls.className = 'pe-controls';
  controls.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;background:#14120f;border-bottom:1px solid #2e2a26;font-family:ui-monospace,monospace;font-size:11px;';

  controls.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="color:#8c8376;font-weight:700;">LIGHT:</span>
        <button type="button" class="btn-secondary quest-btn-sm" data-pe-preset="red" style="padding:2px 7px;font-size:10px;">Red (700nm)</button>
        <button type="button" class="btn-secondary quest-btn-sm" data-pe-preset="violet" style="padding:2px 7px;font-size:10px;background:#2a2214;border-color:#d99423;color:#d99423;">Violet (400nm)</button>
        <button type="button" class="btn-secondary quest-btn-sm" data-pe-preset="uv" style="padding:2px 7px;font-size:10px;">UV (260nm)</button>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="color:#8c8376;font-weight:700;">BRIGHTNESS:</span>
        <button type="button" class="btn-secondary quest-btn-sm" data-pe-bright="1" style="padding:2px 6px;font-size:10px;">Low</button>
        <button type="button" class="btn-secondary quest-btn-sm" data-pe-bright="3" style="padding:2px 6px;font-size:10px;background:#2a2214;border-color:#d99423;color:#d99423;">High</button>
      </div>
    </div>
  `;

  // Canvas
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:220px;display:block;background:#0d0c0a;';
  view.appendChild(canvas);
  wrap.insertBefore(controls, view);

  const ctx = canvas.getContext('2d');

  const updateButtons = () => {
    controls.querySelectorAll('[data-pe-preset]').forEach(btn => {
      const p = btn.dataset.pePreset;
      const act = (p === 'red' && nm >= 600) || (p === 'violet' && nm >= 350 && nm < 550) || (p === 'uv' && nm < 350);
      btn.style.background = act ? '#2a2214' : '#1a1815';
      btn.style.borderColor = act ? '#d99423' : '#3e3933';
      btn.style.color = act ? '#d99423' : '#a59c86';
    });
    controls.querySelectorAll('[data-pe-bright]').forEach(btn => {
      const b = parseInt(btn.dataset.peBright, 10);
      const act = (b === 1 && brightness <= 1) || (b === 3 && brightness >= 3);
      btn.style.background = act ? '#2a2214' : '#1a1815';
      btn.style.borderColor = act ? '#d99423' : '#3e3933';
      btn.style.color = act ? '#d99423' : '#a59c86';
    });
  };

  controls.addEventListener('click', e => {
    const presetBtn = e.target.closest('[data-pe-preset]');
    if (presetBtn) {
      const mode = presetBtn.dataset.pePreset;
      if (mode === 'red') nm = 700;
      else if (mode === 'violet') nm = 400;
      else if (mode === 'uv') nm = 260;
      updateButtons();
      return;
    }
    const brightBtn = e.target.closest('[data-pe-bright]');
    if (brightBtn) {
      brightness = parseInt(brightBtn.dataset.peBright, 10);
      updateButtons();
    }
  });

  // Physical calculation
  // E_photon (eV) = 1240 / nm
  const getPhysics = () => {
    const ePhoton = 1240 / nm;
    const phi = WORK_FUNCTIONS[metal] || 2.36;
    const canFree = ePhoton >= phi;
    const ke = Math.max(0, ePhoton - phi);
    // Speed roughly sqrt(ke)
    const speed = canFree ? Math.sqrt(ke / 1.5) : 0;
    return { ePhoton, phi, canFree, ke, speed };
  };

  // Particles for continuous flow animation
  let animTime = 0;

  function render(time) {
    if (disposed) return;
    const w = canvas.clientWidth || 500;
    const h = 220;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    const phys = getPhysics();
    const colour = lightColour(nm);

    // Geometry coordinates
    const plateX = Math.round(w * 0.38);
    const collectorX = Math.round(w * 0.88);
    const plateTop = 26;
    const plateH = h - 52;
    const plateBottom = plateTop + plateH;

    // Draw Collector Anode on the right
    ctx.fillStyle = '#22201d';
    ctx.fillRect(collectorX, plateTop + 10, 10, plateH - 20);
    ctx.strokeStyle = '#443f38';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(collectorX, plateTop + 10, 10, plateH - 20);

    // Draw Sodium / Metal Plate Cathode
    const plateGrad = ctx.createLinearGradient(plateX - 18, 0, plateX, 0);
    plateGrad.addColorStop(0, '#5a554a');
    plateGrad.addColorStop(1, '#948d7c');
    ctx.fillStyle = plateGrad;
    ctx.fillRect(plateX - 18, plateTop, 18, plateH);
    ctx.strokeStyle = '#a8a292';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plateX - 18, plateTop, 18, plateH);

    // Metal lattice atom cores inside the plate
    const cols = 2;
    const rows = 6;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const ax = plateX - 13 + c * 8;
        const ay = plateTop + 14 + (r / (rows - 1)) * (plateH - 28);
        ctx.fillStyle = '#3a362e';
        ctx.beginPath();
        ctx.arc(ax, ay, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Plate label
    ctx.textAlign = 'center';
    ctx.fillStyle = '#dcd6cc';
    ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(`${metal} Plate`, plateX - 9, plateTop - 8);

    ctx.fillText('Collector', collectorX + 5, plateTop - 8);

    // Animation of photons arriving from left to plateX
    // And electrons flying from plateX to collectorX
    const lanes = brightness;
    const period = 2.4; // seconds per cycle
    const tCycle = (animTime % period) / period;

    for (let lane = 0; lane < lanes; lane++) {
      const y = plateTop + 16 + (lane + 0.5) * ((plateH - 32) / lanes);

      // Phase offset per lane
      const laneOffset = (lane * 0.28) % 1;
      const pLane = (tCycle + laneOffset) % 1;

      // Photon travels from x = 16 to plateX over pLane: 0.0 -> 0.45
      if (pLane < 0.45) {
        const u = pLane / 0.45;
        const photonX = 20 + u * (plateX - 32);
        const waveLen = Math.max(10, Math.min(26, nm * 0.04));
        const amp = 7;

        // Wave packet
        ctx.save();
        ctx.strokeStyle = colour;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = colour;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        const pts = 36;
        for (let i = 0; i <= pts; i++) {
          const dx = (i / pts - 0.5) * 36;
          const px = photonX + dx;
          const env = Math.exp(-(dx * dx) / 100);
          const py = y + Math.sin(dx * (Math.PI * 2 / waveLen)) * amp * env;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Photon core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(photonX, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Impact at plate surface
      if (pLane >= 0.42 && pLane <= 0.52) {
        const uImpact = (pLane - 0.42) / 0.10;
        ctx.save();
        ctx.strokeStyle = colour;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 1 - uImpact;
        ctx.beginPath();
        ctx.arc(plateX, y, 4 + uImpact * 18, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.restore();
      }

      // Ejected electron travels from plateX to collectorX over pLane: 0.45 -> 1.0
      if (phys.canFree && pLane >= 0.45) {
        // Speed determines how far it travels across the gap
        const uE = (pLane - 0.45) / 0.55;
        // High frequency = faster velocity
        const effectiveU = Math.min(1.0, uE * (0.7 + phys.speed * 0.65));
        const electronX = plateX + effectiveU * (collectorX - plateX);

        if (effectiveU < 1.0) {
          // Trail
          ctx.save();
          ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(Math.max(plateX, electronX - 16 * phys.speed), y);
          ctx.lineTo(electronX, y);
          ctx.stroke();

          // Electron particle
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#4ade80';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(electronX, y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        } else {
          // Reached collector: tiny spark
          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.arc(collectorX, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (!still) {
      animTime += 0.018;
      rafId = requestAnimationFrame(render);
    }
  }

  updateButtons();
  rafId = requestAnimationFrame(render);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(rafId);
      controls.remove();
      canvas.remove();
    }
  };
}
