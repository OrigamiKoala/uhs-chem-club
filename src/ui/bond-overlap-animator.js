/**
 * bond-overlap-animator.js — 3D explainer for how atomic orbitals become a sigma bond and a pi bond.
 *
 * Two carbon atoms start apart, each with its own orbital cloud. As they approach, the two clouds are added together (the
 * linear combination of the two atomic orbitals), so the picture is the sum of what each atom would have alone and the
 * clouds smoothly blur into one:
 *   SIGMA  lobes pointing at each other, overlapping head-on along the line between the nuclei (a thickening between them).
 *   PI     p orbitals standing side by side, overlapping above and below that line (the line itself stays empty).
 * The volume is ray-marched in a fragment shader from the analytic orbitals, so every frame is the true sum for the
 * current distance. Colour is the sign of the wave (amber +, cyan −); the region both atoms contribute to turns green.
 *
 * Mounted by `model-viewer.js` for a reward `model: { type: 'sigma-pi' }`. Labels only, no instructions.
 */

import * as THREE from 'three';

const BG = '#0d0c0a';
const SEP_FAR = 3.8;
const SEP_BOND = 1.5;
const PM_PER_UNIT = 134 / SEP_BOND;
const BOX = [3.6, 2.7, 2.7];

const MODES = [
  { id: 'sigma', label: 'σ  Head-on', tag: 'σ BOND', tagColor: '#d99423', mode: 0 },
  { id: 'pi', label: 'π  Side by side', tag: 'π BOND', tagColor: '#38bdf8', mode: 1 },
  { id: 'both', label: 'σ + π', tag: 'DOUBLE BOND', tagColor: '#84b93e', mode: 2 }
];

const smooth = u => { const c = Math.max(0, Math.min(1, u)); return c * c * (3 - 2 * c); };

const VERT = `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/** Bond axis is x; the p orbitals stand along y (up). */
const FRAG = `
precision highp float;
varying vec3 vPos;
uniform vec3 uCam;
uniform vec3 uBox;
uniform float uH;
uniform float uMode;
uniform float uSoft;
const float K = 0.85;
const float S_MIX = 0.35;
const int STEPS = 84;

vec3 AMBER = vec3(0.90, 0.61, 0.14);
vec3 CYAN = vec3(0.10, 0.60, 0.88);
vec3 GREEN = vec3(0.52, 0.76, 0.24);

void main() {
  vec3 rd = normalize(vPos - uCam);
  vec3 inv = 1.0 / rd;
  vec3 t0 = (-uBox - uCam) * inv;
  vec3 t1 = (uBox - uCam) * inv;
  vec3 tmin = min(t0, t1);
  vec3 tmax = max(t0, t1);
  float tn = max(max(tmin.x, tmin.y), max(tmin.z, 0.0));
  float tf = min(min(tmax.x, tmax.y), tmax.z);
  if (tf <= tn) discard;
  float dt = (tf - tn) / float(STEPS);
  vec3 col = vec3(0.0);
  float acc = 0.0;
  for (int i = 0; i < STEPS; i++) {
    vec3 p = uCam + rd * (tn + (float(i) + 0.5) * dt);
    vec3 a = p - vec3(-uH, 0.0, 0.0);
    vec3 b = p - vec3(uH, 0.0, 0.0);
    float ea = exp(-K * length(a));
    float eb = exp(-K * length(b));
    // sigma: a lobe on each atom pointing at the other (an s-p mix, so a small back lobe of opposite sign)
    float sa = (S_MIX + a.x) * ea;
    float sb = (S_MIX - b.x) * eb;
    // pi: a p orbital on each atom, standing up, in the same phase
    float pa = a.y * ea;
    float pb = b.y * eb;
    float ds = 0.0;
    float dp = 0.0;
    vec3 cs = vec3(0.0);
    vec3 cp = vec3(0.0);
    if (uMode != 1.0) {
      float psi = sa + sb;
      ds = psi * psi;
      float mixed = (sa * sb > 0.0) ? 2.0 * min(abs(sa), abs(sb)) / max(abs(sa) + abs(sb), 1e-4) : 0.0;
      cs = mix(psi > 0.0 ? AMBER : CYAN, GREEN, smoothstep(0.15, 0.9, mixed));
    }
    if (uMode != 0.0) {
      float psi = pa + pb;
      dp = psi * psi;
      float mixed = (pa * pb > 0.0) ? 2.0 * min(abs(pa), abs(pb)) / max(abs(pa) + abs(pb), 1e-4) : 0.0;
      cp = mix(psi > 0.0 ? AMBER : CYAN, GREEN, smoothstep(0.15, 0.9, mixed));
    }
    float d = ds + dp;
    if (d < 1e-4) continue;
    vec3 c = (cs * ds + cp * dp) / d;
    float alpha = 1.0 - exp(-pow(d, uSoft) * 4.2 * dt);
    float lit = 0.75 + 0.5 * smoothstep(0.0, 0.5, d);
    col += (1.0 - acc) * alpha * c * lit;
    acc += (1.0 - acc) * alpha;
    if (acc > 0.97) break;
  }
  if (acc < 0.01) discard;
  gl_FragColor = vec4(col / acc, acc * 0.92);
}`;

function labelSprite(text, color) {
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 64, 34);
  const tex = new THREE.CanvasTexture(cv);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(0.8, 0.4, 1);
  sp.renderOrder = 5;
  return sp;
}

function button(text, active) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = text;
  const paint = on => {
    btn.style.cssText = `font-family:ui-monospace,monospace;font-size:10px;padding:3px 8px;cursor:pointer;border:1px solid ${on ? '#d99423' : '#3e3933'};background:${on ? '#2a2214' : '#1a1815'};color:${on ? '#d99423' : '#a59c86'};border-radius:2px;`;
  };
  paint(active);
  btn.paint = paint;
  return btn;
}

/**
 * @param {HTMLElement} view host for the 3D canvas
 * @param {HTMLElement} wrap parent that holds the controls
 * @param {{ mode?: 'sigma'|'pi'|'both' }} spec
 * @param {boolean} still reduced motion: show the last frame, flat
 * @returns {Function} teardown
 */
export function mountBondOverlap(view, wrap, spec = {}, still = false) {
  let disposed = false;
  let raf = 0;
  let teardown = () => {};
  let mode = MODES.find(m => m.id === spec.mode) || MODES[0];
  let progress = still ? 1 : 0;
  let hold = 0.5;
  let scrubbing = false;
  let syncScene = () => {};

  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;gap:4px;padding:6px 8px;background:#14120f;border-bottom:1px solid #2e2a26;flex-wrap:wrap;align-items:center;';
  const modeButtons = MODES.map(m => {
    const b = button(m.label, m.id === mode.id);
    b.addEventListener('click', () => {
      mode = m;
      progress = still ? 1 : 0;
      hold = 0.5;
      scrubbing = false;
      modeButtons.forEach(x => x.b.paint(x.m.id === mode.id));
      syncScene();
      updateStatus();
    });
    bar.appendChild(b);
    return { b, m };
  });
  const replay = button('Replay', false);
  replay.style.marginLeft = 'auto';
  replay.addEventListener('click', () => { progress = 0; hold = 0.5; scrubbing = false; syncScene(); updateStatus(); });
  bar.appendChild(replay);

  const status = document.createElement('div');
  status.style.cssText = 'padding:6px 12px;font-family:ui-monospace,monospace;font-size:11px;background:#0d0c0a;border-bottom:1px solid #24201c;display:flex;align-items:center;gap:10px;flex-wrap:wrap;';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '1000';
  slider.value = String(Math.round(progress * 1000));
  slider.setAttribute('aria-label', 'Distance between the nuclei');
  slider.style.cssText = 'flex:1;min-width:120px;accent-color:#d99423;';
  slider.addEventListener('input', () => {
    scrubbing = true;
    progress = Number(slider.value) / 1000;
    syncScene();
    updateStatus();
  });

  const sepOf = () => SEP_FAR + (SEP_BOND - SEP_FAR) * smooth(progress);

  const tagEl = document.createElement('span');
  const distEl = document.createElement('span');
  distEl.style.cssText = 'color:#dcd6cc;font-weight:600;min-width:64px;';
  const legend = document.createElement('span');
  legend.style.cssText = 'margin-left:auto;display:flex;gap:8px;font-size:10px;color:#a59c86;';
  legend.innerHTML = '<span style="color:#e59b24">■ + phase</span><span style="color:#1a99e0">■ − phase</span><span style="color:#84c23d">■ both atoms</span>';
  status.append(tagEl, distEl, slider, legend);

  function updateStatus() {
    const bonded = progress >= 0.985;
    const tag = bonded ? mode.tag : 'ORBITALS APPROACH';
    const col = bonded ? mode.tagColor : '#8c8376';
    tagEl.textContent = tag;
    tagEl.style.cssText = `display:inline-block;padding:1px 6px;background:${col}22;color:${col};border:1px solid ${col}44;font-size:10px;font-weight:700;border-radius:2px;`;
    distEl.textContent = `${Math.round(sepOf() * PM_PER_UNIT)} pm`;
    if (!scrubbing || document.activeElement !== slider) slider.value = String(Math.round(progress * 1000));
  }
  updateStatus();

  wrap.insertBefore(status, view);
  wrap.insertBefore(bar, status);

  if (still) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 240;
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    view.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const lobe = (x, y, ang, len, wid, fill) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(len * 0.25, -wid, len * 0.85, -wid, len, 0);
      ctx.bezierCurveTo(len * 0.85, wid, len * 0.25, wid, 0, 0);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.restore();
    };
    const draw = () => {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, 640, 240);
      const cy = 120;
      const xs = [[170, 470], [262, 378]];
      xs.forEach(([ax, bx], k) => {
        const off = k === 0 ? 0 : 0;
        if (mode.mode === 0 || mode.mode === 2) {
          lobe(ax, cy + off, 0, 90, 34, 'rgba(229,155,36,0.5)');
          lobe(bx, cy + off, Math.PI, 90, 34, 'rgba(229,155,36,0.5)');
        }
        if (mode.mode === 1 || mode.mode === 2) {
          for (const x of [ax, bx]) {
            lobe(x, cy, -Math.PI / 2, 80, 28, 'rgba(229,155,36,0.4)');
            lobe(x, cy, Math.PI / 2, 80, 28, 'rgba(26,153,224,0.4)');
          }
        }
        ctx.fillStyle = '#dcd6cc';
        for (const x of [ax, bx]) { ctx.beginPath(); ctx.arc(x, cy, 5, 0, Math.PI * 2); ctx.fill(); }
      });
    };
    draw();
    syncScene = draw;
    return () => { bar.remove(); status.remove(); canvas.remove(); };
  }

  let ay = 0.55;
  let ax = 0.32;
  let drag = null;
  const onDown = e => { drag = { x: e.clientX, y: e.clientY }; try { view.setPointerCapture(e.pointerId); } catch (err) { /* no capture */ } };
  const onMove = e => {
    if (!drag) return;
    ay += (e.clientX - drag.x) * 0.01;
    ax = Math.max(-1.2, Math.min(1.2, ax + (e.clientY - drag.y) * 0.01));
    drag = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => { drag = null; };
  view.addEventListener('pointerdown', onDown);
  view.addEventListener('pointermove', onMove);
  view.addEventListener('pointerup', onUp);
  view.addEventListener('pointercancel', onUp);

  const init3D = () => {
    if (disposed) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const getW = () => Math.max(240, view.clientWidth || 320);
    const getH = () => Math.max(200, view.clientHeight || 220);
    renderer.setSize(getW(), getH());
    view.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, getW() / getH(), 0.1, 100);
    camera.position.set(0, 0.6, 10.5);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xe8e2d4, 0x14120f, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(3, 5, 4);
    scene.add(sun);

    const root = new THREE.Group();
    scene.add(root);

    const nucGeo = new THREE.SphereGeometry(0.16, 20, 14);
    const nucMat = new THREE.MeshStandardMaterial({ color: 0x2a2825, roughness: 0.4, metalness: 0.5, emissive: 0x4a463f, emissiveIntensity: 0.35 });
    const nucA = new THREE.Mesh(nucGeo, nucMat);
    const nucB = new THREE.Mesh(nucGeo, nucMat);
    const tagA = labelSprite('C', '#dcd6cc');
    const tagB = labelSprite('C', '#dcd6cc');
    tagA.position.set(0, -0.42, 0);
    tagB.position.set(0, -0.42, 0);
    nucA.add(tagA);
    nucB.add(tagB);
    root.add(nucA, nucB);

    const axisGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)]);
    const axisMat = new THREE.LineBasicMaterial({ color: 0x6a6358, transparent: true, opacity: 0.55 });
    const axisLine = new THREE.Line(axisGeo, axisMat);
    root.add(axisLine);

    const uniforms = {
      uCam: { value: new THREE.Vector3() },
      uBox: { value: new THREE.Vector3(...BOX) },
      uH: { value: SEP_FAR / 2 },
      uMode: { value: mode.mode },
      uSoft: { value: 1.0 }
    };
    const volMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide
    });
    const volGeo = new THREE.BoxGeometry(BOX[0] * 2, BOX[1] * 2, BOX[2] * 2);
    const volume = new THREE.Mesh(volGeo, volMat);
    volume.renderOrder = 2;
    root.add(volume);

    const local = new THREE.Vector3();
    const apply = () => {
      const sep = sepOf();
      const h = sep / 2;
      uniforms.uH.value = h;
      uniforms.uMode.value = mode.mode;
      // the clouds are crisp while the atoms are apart and soften as they merge
      uniforms.uSoft.value = 1.25 - 0.35 * smooth(progress);
      nucA.position.set(-h, 0, 0);
      nucB.position.set(h, 0, 0);
      axisLine.scale.set(h, 1, 1);
      root.rotation.set(ax, ay, 0);
      root.updateMatrixWorld(true);
      local.copy(camera.position);
      volume.worldToLocal(local);
      uniforms.uCam.value.copy(local);
    };
    syncScene = apply;

    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
      renderer.setSize(getW(), getH());
      camera.aspect = getW() / getH();
      camera.updateProjectionMatrix();
    }) : { observe() {}, disconnect() {} };
    ro.observe(view);

    let last = performance.now();
    const frame = now => {
      if (disposed) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!scrubbing && progress < 1) {
        if (hold > 0) hold -= dt;
        else progress = Math.min(1, progress + dt / 5.5);
        updateStatus();
      }
      apply();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    frame(performance.now());

    teardown = () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      view.removeEventListener('pointerdown', onDown);
      view.removeEventListener('pointermove', onMove);
      view.removeEventListener('pointerup', onUp);
      view.removeEventListener('pointercancel', onUp);
      renderer.dispose();
      renderer.domElement.remove();
      nucGeo.dispose();
      nucMat.dispose();
      axisGeo.dispose();
      axisMat.dispose();
      volGeo.dispose();
      volMat.dispose();
      for (const sp of [tagA, tagB]) { sp.material.map.dispose(); sp.material.dispose(); }
    };
  };

  init3D();

  return () => {
    disposed = true;
    try { teardown(); } catch (err) { /* gone */ }
    bar.remove();
    status.remove();
  };
}
