/**
 * slice-explainer.js — Interactive 3D explainer for orbital slicing and nodal planes.
 *
 * Demonstrates why an electron orbital's slice is empty along a nodal plane.
 * Provides free 3D rotation, real-time slice plane toggling, plane selection,
 * and live electron count in the slice.
 */

import { showModal, closeModal } from './modal.js';
import { sampleOrbital } from '../learn/engine/orbitals.js';
import { session } from '../session.js';
import { soundscape } from '../audio/soundscape.js';

const SLICE_HALF = 1.0;
const TOTAL_DOTS = 260;

/**
 * Mount the interactive 3D slice explainer inside an element.
 * @param {HTMLElement} mountEl
 * @returns {{ dispose: Function }}
 */
export function mountSliceExplainer(mountEl) {
  const points = sampleOrbital('2pz', TOTAL_DOTS, 1);

  let sliceOn = true;
  let planeMode = 'nodal'; // 'nodal' (z=0), 'lobes' (x=0), or 'free'
  let yaw = 0;
  let pitch = 0;
  let drag = null;
  let disposed = false;
  let rafId = 0;
  let animProgress = 0;

  const container = document.createElement('div');
  container.className = 'slice-explainer-view';
  container.style.cssText = 'position:relative;width:100%;background:#0d0c0a;border:1px solid #332d26;border-radius:2px;overflow:hidden;';

  // Header & Controls toolbar
  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'padding:8px 12px;background:#14120f;border-bottom:1px solid #29241f;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;';

  toolbar.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
      <span style="font-family:ui-monospace,monospace;font-size:11px;color:#8c8376;font-weight:700;">PLANE:</span>
      <button type="button" class="btn-secondary quest-btn-sm" data-plane="nodal" style="font-size:11px;padding:3px 8px;background:#1a2e1d;border-color:#4ade80;color:#4ade80;">Nodal Plane (z=0)</button>
      <button type="button" class="btn-secondary quest-btn-sm" data-plane="lobes" style="font-size:11px;padding:3px 8px;">Lobe Axis (z)</button>
    </div>
    <div style="display:flex;align-items:center;gap:6px;">
      <button type="button" class="btn-secondary quest-btn-sm" data-slice-toggle="true" style="font-size:11px;padding:3px 8px;color:#e59b24;border-color:#e59b24;">Slice: ON</button>
    </div>
  `;

  // Status readout
  const statusEl = document.createElement('div');
  statusEl.style.cssText = 'padding:6px 12px;background:#0f0e0c;border-bottom:1px solid #24201c;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;font-family:ui-monospace,monospace;font-size:11px;';

  // 3D Canvas wrapper
  const canvasWrap = document.createElement('div');
  canvasWrap.style.cssText = 'width:100%;height:260px;position:relative;cursor:grab;touch-action:none;';

  const hintEl = document.createElement('div');
  hintEl.style.cssText = 'position:absolute;bottom:6px;left:10px;font-family:ui-monospace,monospace;font-size:10px;color:#6b625a;pointer-events:none;';
  hintEl.textContent = 'Drag to freely rotate orbital in 3D';
  canvasWrap.appendChild(hintEl);

  container.appendChild(toolbar);
  container.appendChild(statusEl);
  container.appendChild(canvasWrap);
  mountEl.appendChild(container);

  const updateStatus = (dotsInSlice) => {
    const isNodal = planeMode === 'nodal';
    const tag = !sliceOn
      ? '<span style="padding:1px 6px;background:#38bdf822;color:#38bdf8;border:1px solid #38bdf844;border-radius:2px;font-weight:700;">FULL CLOUD</span>'
      : dotsInSlice <= 5
        ? '<span style="padding:1px 6px;background:#4ade8022;color:#4ade80;border:1px solid #4ade8044;border-radius:2px;font-weight:700;">EMPTY SLICE ★</span>'
        : '<span style="padding:1px 6px;background:#f59e0b22;color:#f59e0b;border:1px solid #f59e0b44;border-radius:2px;font-weight:700;">DENSE SLICE</span>';

    const desc = !sliceOn
      ? 'Viewing all 260 electron shots in 3D.'
      : dotsInSlice <= 5
        ? 'Nodal plane between lobes: almost no electrons touch this plane!'
        : 'Slice cutting through lobes: electrons caught inside slab.';

    statusEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;">
        ${tag}
        <span style="color:#dcd6cc;">${desc}</span>
      </div>
      <div style="color:#8c8376;">
        IN SLICE: <strong style="color:${dotsInSlice <= 5 ? '#4ade80' : '#e59b24'};">${dotsInSlice}</strong> / ${TOTAL_DOTS}
      </div>
    `;
  };

  // Drag interaction
  const onDown = e => {
    drag = { x: e.clientX, y: e.clientY };
    canvasWrap.style.cursor = 'grabbing';
    try { canvasWrap.setPointerCapture(e.pointerId); } catch (err) {}
  };
  const onMove = e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    yaw += dx * 0.015;
    pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, pitch + dy * 0.015));
    planeMode = 'free';
    updateButtons();
    drag = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => {
    drag = null;
    canvasWrap.style.cursor = 'grab';
  };

  canvasWrap.addEventListener('pointerdown', onDown);
  canvasWrap.addEventListener('pointermove', onMove);
  canvasWrap.addEventListener('pointerup', onUp);
  canvasWrap.addEventListener('pointercancel', onUp);

  const updateButtons = () => {
    toolbar.querySelectorAll('[data-plane]').forEach(btn => {
      const p = btn.dataset.plane;
      const act = p === planeMode;
      btn.style.background = act ? (p === 'nodal' ? '#1a2e1d' : '#26221d') : '';
      btn.style.borderColor = act ? (p === 'nodal' ? '#4ade80' : '#e59b24') : '';
      btn.style.color = act ? (p === 'nodal' ? '#4ade80' : '#e59b24') : '';
    });
    const toggleBtn = toolbar.querySelector('[data-slice-toggle]');
    if (toggleBtn) {
      toggleBtn.textContent = sliceOn ? 'Slice: ON' : 'Slice: OFF';
      toggleBtn.style.color = sliceOn ? '#e59b24' : '#8c8376';
      toggleBtn.style.borderColor = sliceOn ? '#e59b24' : '#332d26';
    }
  };

  toolbar.addEventListener('click', e => {
    const planeBtn = e.target.closest('[data-plane]');
    if (planeBtn) {
      planeMode = planeBtn.dataset.plane;
      if (planeMode === 'nodal') {
        yaw = 0;
        pitch = 0;
        sliceOn = true;
      } else if (planeMode === 'lobes') {
        yaw = Math.PI / 2;
        pitch = 0;
        sliceOn = true;
      }
      updateButtons();
      soundscape.playCrtTick?.();
      return;
    }
    const toggleBtn = e.target.closest('[data-slice-toggle]');
    if (toggleBtn) {
      sliceOn = !sliceOn;
      updateButtons();
      soundscape.playCrtTick?.();
    }
  });

  // Three.js renderer
  let cleanupThree = () => {};
  const init3D = async () => {
    const THREE = await import('three');
    if (disposed) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const w = canvasWrap.clientWidth || 320;
    const h = 260;
    renderer.setSize(w, h);
    canvasWrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    scene.add(new THREE.HemisphereLight(0xe8e2d4, 0x16140f, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(5, 6, 8);
    scene.add(sun);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Central Nucleus
    const nucMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 20, 16),
      new THREE.MeshStandardMaterial({ color: 0xd99423, emissive: 0xd99423, emissiveIntensity: 0.6, roughness: 0.3 })
    );
    rootGroup.add(nucMesh);

    // 2. Dots
    const dotGeo = new THREE.SphereGeometry(0.065, 8, 8);
    const dotMatActive = new THREE.MeshStandardMaterial({ color: 0x78a142, emissive: 0x78a142, emissiveIntensity: 0.5, roughness: 0.4 });
    const dotMatGhost = new THREE.MeshBasicMaterial({ color: 0x48423a, transparent: true, opacity: 0.16 });

    const meshes = points.map(p => {
      // 2pz lobes are along z. Scale to visual units (~2.4 reach)
      const scale = 0.52;
      const x = p.x * scale;
      const y = p.y * scale;
      const z = p.z * scale;
      const m = new THREE.Mesh(dotGeo, dotMatActive);
      m.position.set(x, z, y); // align z up in Three space
      rootGroup.add(m);
      return { mesh: m, orig: { x, y, z } };
    });

    // 3. Slicing Plane visual
    const planeGeo = new THREE.PlaneGeometry(6.4, 6.4);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    const planeBorder = new THREE.LineSegments(
      new THREE.EdgesGeometry(planeGeo),
      new THREE.LineBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.85, linewidth: 2 })
    );
    planeMesh.add(planeBorder);
    planeMesh.rotation.x = Math.PI / 2; // xy plane (z=0)
    rootGroup.add(planeMesh);

    // 4. Subtle guide grid on slicing plane
    const gridHelper = new THREE.GridHelper(6.4, 12, 0x4ade80, 0x332d26);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.25;
    rootGroup.add(gridHelper);

    const frame = () => {
      if (disposed) return;
      animProgress += 0.02;

      rootGroup.rotation.y = yaw;
      rootGroup.rotation.x = pitch;

      // Slice check: depth along the slicing plane normal
      // When plane is at z=0, depth is z
      let dotsInSlice = 0;
      for (const item of meshes) {
        // Project to view coordinate or plane
        const pz = item.orig.z;
        const inSlice = Math.abs(pz) <= SLICE_HALF * 0.52;
        if (!sliceOn) {
          item.mesh.visible = true;
          item.mesh.material = dotMatActive;
          dotsInSlice++;
        } else if (inSlice) {
          item.mesh.visible = true;
          item.mesh.material = dotMatActive;
          dotsInSlice++;
        } else {
          item.mesh.visible = true;
          item.mesh.material = dotMatGhost;
        }
      }

      const isEmpty = dotsInSlice <= 5;
      const color = isEmpty ? 0x4ade80 : 0xe59b24;
      planeMat.color.set(color);
      planeBorder.material.color.set(color);
      gridHelper.visible = sliceOn;
      planeMesh.visible = sliceOn;

      updateStatus(dotsInSlice);

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    cleanupThree = () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
      canvasWrap.innerHTML = '';
    };
  };

  init3D().catch(() => {
    // Canvas 2D fallback
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    canvas.style.cssText = 'width:100%;height:100%;';
    canvasWrap.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const render2D = () => {
      if (disposed) return;
      ctx.fillStyle = '#0d0c0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const k = 32;

      // Draw slice slab
      if (sliceOn) {
        ctx.fillStyle = planeMode === 'nodal' ? 'rgba(74,222,128,0.1)' : 'rgba(229,155,36,0.1)';
        ctx.fillRect(40, cy - SLICE_HALF * k * 0.6, canvas.width - 80, SLICE_HALF * k * 1.2);
        ctx.strokeStyle = planeMode === 'nodal' ? '#4ade80' : '#e59b24';
        ctx.strokeRect(40, cy - SLICE_HALF * k * 0.6, canvas.width - 80, SLICE_HALF * k * 1.2);
      }

      let inSliceCount = 0;
      for (const p of points) {
        const inSlice = Math.abs(p.z) <= SLICE_HALF;
        if (!sliceOn || inSlice) {
          ctx.fillStyle = inSlice ? '#78a142' : '#8c8376';
          ctx.fillRect(cx + p.x * k - 2, cy - p.y * k - 2, 4, 4);
          if (inSlice) inSliceCount++;
        }
      }
      updateStatus(inSliceCount);
      rafId = requestAnimationFrame(render2D);
    };
    rafId = requestAnimationFrame(render2D);
    cleanupThree = () => cancelAnimationFrame(rafId);
  });

  return {
    dispose() {
      disposed = true;
      cleanupThree();
      container.remove();
    }
  };
}

/**
 * Open the interactive 3D slice explainer modal.
 */
export function showSliceExplainerModal() {
  let explainer = null;

  const html = `
    <div class="lq-slice-explainer-modal" style="max-width:580px;margin:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid #29241f;padding-bottom:8px;">
        <div>
          <span class="eyebrow lit" style="color:#e59b24;font-size:10px;letter-spacing:1px;font-weight:700;">3D ORBITAL SLICING</span>
          <h3 style="margin:2px 0 0;font-size:1.15rem;color:#dcd6cc;font-weight:700;">What is a Slice?</h3>
        </div>
        <button type="button" class="btn-secondary quest-btn-sm" data-close-modal="true" style="padding:3px 8px;">✕</button>
      </div>

      <div id="slice-explainer-mount" style="margin-bottom:14px;"></div>

      <div style="background:#14120f;border:1px solid #29241f;padding:12px;font-size:12px;line-height:1.6;color:#dcd6cc;margin-bottom:14px;border-radius:2px;">
        <div style="margin-bottom:8px;">
          <strong style="color:#e59b24;">1. Orbitals are 3D clouds:</strong> Electrons do not orbit on rings; they form a 3D probability cloud. When looking at a 3D cloud from the front, electrons in front and back overlap in your sight, hiding the empty space inside.
        </div>
        <div style="margin-bottom:8px;">
          <strong style="color:#38bdf8;">2. A slice is a thin flat slab:</strong> Turning "Slice" ON keeps only the electrons lying inside a thin flat slab cut through the middle. Everything outside the slab is cut away.
        </div>
        <div>
          <strong style="color:#4ade80;">3. The Nodal Plane:</strong> Between the two lobes of a p orbital lies a flat plane where the electron is <em>never found</em> (probability density = 0). When you rotate the cloud so your slice aligns with this plane, the slice shows almost no dots!
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button type="button" class="btn-primary" data-close-modal="true">Back to Bench</button>
      </div>
    </div>
  `;

  showModal(html, {
    dismissible: true,
    onClose: () => explainer?.dispose()
  });

  const mountEl = document.getElementById('slice-explainer-mount');
  if (mountEl) {
    explainer = mountSliceExplainer(mountEl);
  }

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(() => explainer?.dispose()));
  });
}
