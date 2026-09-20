/**
 * tallow-textures.js — Procedural PBR texture set for Tallow, the salt-flat refinery.
 *
 * Tallow is not Erebus. Erebus is an amber desert at low sun; Tallow is a bleached
 * salt pan under flat overcast — the same SCOURED PLATE world, forty years further
 * into the dust, with the colour leached out of it. Everything here stays warm
 * neutral with a brown/sand bias (CLAUDE.md §4): pale bone crust, sun-faded
 * anodised plate, rust where water has stood. Never blue-black, never cyan.
 *
 * Normal maps are DERIVED from the same height field that drew the albedo, via
 * `heightToNormal`, so every bump registers with the crack or seam that caused it.
 * Generating a normal map independently of its albedo is the single most common
 * way a procedural surface reads as fake, and it is not done here.
 *
 * Nothing in this file is emissive. The only lit things on Tallow are lamps and
 * indicators, and those are built in tallow.js as geometry, not baked into a map.
 */

import * as THREE from 'three';

/* Deterministic noise: the refinery looks the same every time it is loaded. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function finish(canvas, repeat = 1, colorSpace = THREE.SRGBColorSpace) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = colorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Linear-space data map (normal, roughness, AO). Never sRGB, or it lies. */
function finishData(canvas, repeat = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Sobel a greyscale height canvas into a tangent-space normal map.
 *
 * Wraps at the edges, so a tiling albedo gets a tiling normal instead of a seam
 * that catches the light every 4 metres.
 */
export function heightToNormal(heightCanvas, strength = 2.2) {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const src = heightCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;

  const out = makeCanvas(w, h);
  const octx = out.getContext('2d', { willReadFrequently: true });
  const img = octx.createImageData(w, h);
  const d = img.data;

  const at = (x, y) => {
    const xx = ((x % w) + w) % w;
    const yy = ((y % h) + h) % h;
    return src[(yy * w + xx) * 4] / 255;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = at(x - 1, y - 1), t = at(x, y - 1), tr = at(x + 1, y - 1);
      const l = at(x - 1, y), r = at(x + 1, y);
      const bl = at(x - 1, y + 1), b = at(x, y + 1), br = at(x + 1, y + 1);

      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);

      let nx = -dx * strength;
      let ny = -dy * strength;
      const nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len;
      const nzn = nz / len;

      const i = (y * w + x) * 4;
      d[i] = Math.round((nx * 0.5 + 0.5) * 255);
      d[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      d[i + 2] = Math.round((nzn * 0.5 + 0.5) * 255);
      d[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return out;
}

/** Invert a height canvas into a roughness canvas: hollows hold dust, dust is matte. */
function heightToRoughness(heightCanvas, lo = 0.62, hi = 0.97) {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const src = heightCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  const out = makeCanvas(w, h);
  const octx = out.getContext('2d', { willReadFrequently: true });
  const img = octx.createImageData(w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    // High ground is scoured (slightly less rough); hollows are packed with dust.
    const v = src[i] / 255;
    const rough = hi - (hi - lo) * v;
    const b = Math.round(rough * 255);
    d[i] = b; d[i + 1] = b; d[i + 2] = b; d[i + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  return out;
}

/* ============================================================================
   SALT CRUST — the ground of Tallow
   A dry lakebed hardpan: polygonal desiccation cracks, salt bloom along the
   ridges, fine grit drifted into the hollows.
   ============================================================================ */

/** Voronoi-cell crack field. Returns the height canvas so normals can register. */
function saltCrustHeight(size, seed) {
  const rand = mulberry32(seed);
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.fillStyle = '#c8c8c8';
  ctx.fillRect(0, 0, size, size);

  // Cell seeds, duplicated across the wrap so cracks continue over the tile edge.
  const cells = [];
  const N = 34;
  for (let i = 0; i < N; i++) cells.push([rand() * size, rand() * size]);
  const wrapped = [];
  for (const [cx, cy] of cells) {
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) wrapped.push([cx + ox * size, cy + oy * size]);
    }
  }

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let d1 = Infinity, d2 = Infinity;
      for (const [cx, cy] of wrapped) {
        const dd = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) { d2 = dd; }
      }
      // Distance to the cell boundary: small where two cells meet, i.e. a crack.
      const edge = Math.sqrt(d2) - Math.sqrt(d1);
      const crack = Math.min(1, edge / 9);
      const plate = 0.58 + crack * 0.42;
      const i = (y * size + x) * 4;
      const v = Math.round(plate * 255);
      d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Fine grit on top of the plates, so the crust is not glassy between cracks.
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < size * 6; i++) {
    const g = 140 + Math.floor(rand() * 90);
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.fillRect(rand() * size, rand() * size, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;

  return canvas;
}

export function createSaltCrustTexture(size = 512, repeat = 26) {
  const rand = mulberry32(0x5a17);
  const height = saltCrustHeight(size, 0x5a17);
  const hData = height.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, size, size).data;

  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.createImageData(size, size);
  const d = img.data;

  // Bleached bone crust on the plates, dirty sand packed down in the cracks.
  const hi = [0xd2, 0xc9, 0xb4];   // salt bloom
  const lo = [0x7d, 0x71, 0x5e];   // grit in the fissure
  for (let i = 0; i < d.length; i += 4) {
    const t = hData[i] / 255;
    const k = Math.pow(t, 1.5);
    const n = (Math.random() - 0.5) * 12;
    d[i] = Math.max(0, Math.min(255, lo[0] + (hi[0] - lo[0]) * k + n));
    d[i + 1] = Math.max(0, Math.min(255, lo[1] + (hi[1] - lo[1]) * k + n));
    d[i + 2] = Math.max(0, Math.min(255, lo[2] + (hi[2] - lo[2]) * k + n));
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  // Mineral staining: iron-bearing brine has stood here and dried out rust-brown.
  for (let s = 0; s < 9; s++) {
    const r = 18 + rand() * 60;
    const g2 = ctx.createRadialGradient(
      rand() * size, rand() * size, r * 0.15,
      rand() * size, rand() * size, r
    );
    g2.addColorStop(0, 'rgba(126, 74, 38, 0.16)');
    g2.addColorStop(1, 'rgba(126, 74, 38, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, size, size);
  }

  return {
    map: finish(canvas, repeat),
    normalMap: finishData(heightToNormal(height, 1.5), repeat),
    roughnessMap: finishData(heightToRoughness(height, 0.74, 0.99), repeat)
  };
}

/* ============================================================================
   BLEACHED PLATE — the refinery's hull and structural panels
   Anodised durasteel that has faced the sun for four decades: the pigment has
   gone chalky, the seams hold salt, and the stencils are ghosts.
   ============================================================================ */

function bleachedPlateHeight(size, seed) {
  const rand = mulberry32(seed);
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#b4b4b4';
  ctx.fillRect(0, 0, size, size);

  // Panel seams cut in, not drawn on.
  const seams = [size * 0.5, size * 0.5];
  ctx.strokeStyle = '#3c3c3c';
  ctx.lineWidth = Math.max(2, size / 128);
  ctx.beginPath();
  ctx.moveTo(seams[0], 0); ctx.lineTo(seams[0], size);
  ctx.moveTo(0, seams[1]); ctx.lineTo(size, seams[1]);
  ctx.stroke();
  ctx.strokeRect(0, 0, size, size);

  // Rivet rows: proud of the plate, so they catch the key light.
  const step = size / 8;
  ctx.fillStyle = '#f2f2f2';
  for (let i = 0; i < 8; i++) {
    const p = step * (i + 0.5);
    for (const [rx, ry] of [[p, size * 0.06], [p, size * 0.94], [size * 0.06, p], [size * 0.94, p]]) {
      ctx.beginPath();
      ctx.arc(rx, ry, Math.max(1.5, size / 170), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Weld beads down one seam, and dents where something struck it.
  ctx.strokeStyle = '#d8d8d8';
  ctx.lineWidth = Math.max(1.5, size / 200);
  for (let y = 0; y < size; y += 5) {
    ctx.beginPath();
    ctx.moveTo(seams[0] - 3 + rand() * 2, y);
    ctx.lineTo(seams[0] + 3 - rand() * 2, y + 5);
    ctx.stroke();
  }
  for (let i = 0; i < 12; i++) {
    const g = ctx.createRadialGradient(
      rand() * size, rand() * size, 1, rand() * size, rand() * size, 6 + rand() * 14
    );
    g.addColorStop(0, 'rgba(70,70,70,0.6)');
    g.addColorStop(1, 'rgba(70,70,70,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  // Surface tooth.
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < size * 4; i++) {
    const g = 130 + Math.floor(rand() * 110);
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.fillRect(rand() * size, rand() * size, 1.2, 1.2);
  }
  ctx.globalAlpha = 1;
  return canvas;
}

/**
 * @param {string} tint base plate colour. Defaults to sun-faded sand-grey.
 * @param {string} [code] two-letter guild designator stencilled on, worn half away.
 */
export function createBleachedPlateTexture(size = 512, tint = '#9a9080', code = null, repeat = 1) {
  const rand = mulberry32(0x71ed ^ size);
  const height = bleachedPlateHeight(size, 0x71ed);
  const hData = height.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, size, size).data;

  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, size, size);

  // Modulate the flat tint by the height field so seams and rivets read as one
  // surface rather than a decal floating over a colour.
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const t = hData[i] / 255;
    const k = 0.55 + t * 0.62;
    d[i] = Math.min(255, d[i] * k);
    d[i + 1] = Math.min(255, d[i + 1] * k);
    d[i + 2] = Math.min(255, d[i + 2] * k);
  }
  ctx.putImageData(img, 0, 0);

  // Chalking: anodised pigment goes powder-pale where the sun hits hardest.
  const chalk = ctx.createLinearGradient(0, 0, size * 0.3, size);
  chalk.addColorStop(0, 'rgba(214, 206, 188, 0.22)');
  chalk.addColorStop(1, 'rgba(214, 206, 188, 0)');
  ctx.fillStyle = chalk;
  ctx.fillRect(0, 0, size, size);

  // Rust bleeding from the fasteners and standing along the lower seam.
  for (let i = 0; i < 7; i++) {
    const x = rand() * size;
    const y = rand() * size * 0.7;
    const g = ctx.createLinearGradient(x, y, x, y + 40 + rand() * 90);
    g.addColorStop(0, 'rgba(112, 58, 26, 0.34)');
    g.addColorStop(1, 'rgba(112, 58, 26, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 4, y, 7 + rand() * 9, 130);
  }

  // Salt bloom creeping out of the seams — the one thing that says salt flat.
  ctx.fillStyle = 'rgba(226, 220, 204, 0.5)';
  for (let i = 0; i < 140; i++) {
    const onVertical = rand() > 0.5;
    const along = rand() * size;
    const off = (rand() - 0.5) * 9;
    const x = onVertical ? size * 0.5 + off : along;
    const y = onVertical ? along : size * 0.5 + off;
    ctx.globalAlpha = 0.2 + rand() * 0.45;
    ctx.fillRect(x, y, 1 + rand() * 2.4, 1 + rand() * 2.4);
  }
  ctx.globalAlpha = 1;

  // Stencilled guild designator, worn to half legibility.
  if (code) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#4a4036';
    ctx.font = `700 ${Math.round(size * 0.2)}px "Share Tech Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code, size * 0.5, size * 0.26);
    // Abrade it: scrub random bites out of the paint.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    for (let i = 0; i < 90; i++) {
      ctx.beginPath();
      ctx.arc(size * (0.22 + rand() * 0.56), size * (0.16 + rand() * 0.2), 2 + rand() * 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  return {
    map: finish(canvas, repeat),
    normalMap: finishData(heightToNormal(height, 2.4), repeat),
    roughnessMap: finishData(heightToRoughness(height, 0.52, 0.93), repeat)
  };
}

/* ============================================================================
   EVAPORATOR DRUM SHELL — banded vessel plating with worn hazard striping
   ============================================================================ */

export function createDrumShellTexture(w = 512, h = 512) {
  const rand = mulberry32(0x0dd7);
  const heightC = makeCanvas(w, h);
  const hctx = heightC.getContext('2d', { willReadFrequently: true });
  hctx.fillStyle = '#a8a8a8';
  hctx.fillRect(0, 0, w, h);

  // Circumferential strake bands: the drum is rolled plate, not a tube.
  const bands = 7;
  for (let i = 0; i <= bands; i++) {
    const y = (i / bands) * h;
    hctx.fillStyle = '#e8e8e8';
    hctx.fillRect(0, y - 3, w, 6);
    hctx.fillStyle = '#4a4a4a';
    hctx.fillRect(0, y + 3, w, 2);
  }
  // Vertical stiffener ribs.
  for (let i = 0; i < 10; i++) {
    const x = (i / 10) * w;
    hctx.fillStyle = '#d0d0d0';
    hctx.fillRect(x, 0, 5, h);
  }
  hctx.globalAlpha = 0.18;
  for (let i = 0; i < w * 3; i++) {
    const g = 120 + Math.floor(rand() * 110);
    hctx.fillStyle = `rgb(${g},${g},${g})`;
    hctx.fillRect(rand() * w, rand() * h, 1.3, 1.3);
  }
  hctx.globalAlpha = 1;

  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#8e8574');
  grad.addColorStop(0.55, '#7a7161');
  grad.addColorStop(1, '#5e564a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const hData = hctx.getImageData(0, 0, w, h).data;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const k = 0.6 + (hData[i] / 255) * 0.6;
    d[i] = Math.min(255, d[i] * k);
    d[i + 1] = Math.min(255, d[i + 1] * k);
    d[i + 2] = Math.min(255, d[i + 2] * k);
  }
  ctx.putImageData(img, 0, 0);

  // Hazard striping around the service band, worn half away.
  ctx.save();
  ctx.globalAlpha = 0.42;
  const bandY = h * 0.64;
  for (let x = -h; x < w + 40; x += 34) {
    ctx.fillStyle = '#8a6a22';
    ctx.beginPath();
    ctx.moveTo(x, bandY);
    ctx.lineTo(x + 17, bandY);
    ctx.lineTo(x + 17 - 26, bandY + 26);
    ctx.lineTo(x - 26, bandY + 26);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 1;
  for (let i = 0; i < 220; i++) {
    ctx.beginPath();
    ctx.arc(rand() * w, bandY + rand() * 28, 1.5 + rand() * 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Long rust runs from the top rim, the way a drum actually weathers.
  for (let i = 0; i < 16; i++) {
    const x = rand() * w;
    const g = ctx.createLinearGradient(x, 0, x, 60 + rand() * 200);
    g.addColorStop(0, 'rgba(120, 60, 26, 0.42)');
    g.addColorStop(1, 'rgba(120, 60, 26, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 5 + rand() * 10, h);
  }

  return {
    map: finish(canvas, 1),
    normalMap: finishData(heightToNormal(heightC, 2.0), 1),
    roughnessMap: finishData(heightToRoughness(heightC, 0.58, 0.95), 1)
  };
}

/* ============================================================================
   SALVAGE CRATE — the sealed Imperial cargo waiting to be certified
   ============================================================================ */

export function createSalvageCrateTexture(size = 512, guildCode = 'MM', serial = '17-C') {
  const rand = mulberry32(hashStr(guildCode + serial));

  const heightC = makeCanvas(size, size);
  const hctx = heightC.getContext('2d', { willReadFrequently: true });
  hctx.fillStyle = '#9e9e9e';
  hctx.fillRect(0, 0, size, size);
  // Corner castings and a strapping band: the crate's structure, raised.
  hctx.fillStyle = '#e4e4e4';
  const cast = size * 0.12;
  hctx.fillRect(0, 0, cast, cast);
  hctx.fillRect(size - cast, 0, cast, cast);
  hctx.fillRect(0, size - cast, cast, cast);
  hctx.fillRect(size - cast, size - cast, cast, cast);
  hctx.fillRect(0, size * 0.46, size, size * 0.08);
  hctx.fillStyle = '#3e3e3e';
  hctx.fillRect(0, size * 0.44, size, size * 0.02);
  hctx.fillRect(0, size * 0.54, size, size * 0.02);
  // Recessed centre field.
  hctx.fillStyle = '#7a7a7a';
  hctx.fillRect(size * 0.16, size * 0.60, size * 0.68, size * 0.28);
  hctx.globalAlpha = 0.2;
  for (let i = 0; i < size * 3; i++) {
    const g = 120 + Math.floor(rand() * 110);
    hctx.fillStyle = `rgb(${g},${g},${g})`;
    hctx.fillRect(rand() * size, rand() * size, 1.3, 1.3);
  }
  hctx.globalAlpha = 1;

  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#6f6656';
  ctx.fillRect(0, 0, size, size);

  const hData = hctx.getImageData(0, 0, size, size).data;
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const k = 0.55 + (hData[i] / 255) * 0.7;
    d[i] = Math.min(255, d[i] * k);
    d[i + 1] = Math.min(255, d[i + 1] * k);
    d[i + 2] = Math.min(255, d[i + 2] * k);
  }
  ctx.putImageData(img, 0, 0);

  // Stencilled designator and serial — the crate's own filing, worn.
  ctx.save();
  ctx.globalAlpha = 0.46;
  ctx.fillStyle = '#d6cdb6';
  ctx.font = `700 ${Math.round(size * 0.17)}px "Share Tech Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(guildCode, size * 0.5, size * 0.33);
  ctx.font = `700 ${Math.round(size * 0.1)}px "Share Tech Mono", monospace`;
  ctx.fillText(serial, size * 0.5, size * 0.78);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 1;
  for (let i = 0; i < 130; i++) {
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 2 + rand() * 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Salt crusted along the bottom edge where the crate sits in the pan.
  const salt = ctx.createLinearGradient(0, size, 0, size * 0.72);
  salt.addColorStop(0, 'rgba(222, 216, 200, 0.55)');
  salt.addColorStop(1, 'rgba(222, 216, 200, 0)');
  ctx.fillStyle = salt;
  ctx.fillRect(0, size * 0.72, size, size * 0.28);

  return {
    map: finish(canvas, 1),
    normalMap: finishData(heightToNormal(heightC, 2.6), 1),
    roughnessMap: finishData(heightToRoughness(heightC, 0.58, 0.96), 1)
  };
}

/* ============================================================================
   SUB-LEVEL LAB — ribbed deck plate and scuffed bulkhead panel
   Below the crust the sun never reached, so the colour survives: this is the
   one place on Tallow that still looks like the refinery it was.
   ============================================================================ */

export function createLabDeckTexture(size = 512, repeat = 7) {
  const rand = mulberry32(0x1abd);
  const heightC = makeCanvas(size, size);
  const hctx = heightC.getContext('2d', { willReadFrequently: true });
  hctx.fillStyle = '#7e7e7e';
  hctx.fillRect(0, 0, size, size);

  // Anti-slip tread: raised ribs with dust packed in the grooves between.
  const pitch = size / 16;
  for (let i = 0; i < 16; i++) {
    hctx.fillStyle = '#dcdcdc';
    hctx.fillRect(i * pitch + 2, 0, pitch * 0.5, size);
  }
  // Plate joints every half tile.
  hctx.fillStyle = '#343434';
  hctx.fillRect(0, size * 0.5 - 2, size, 4);
  hctx.fillRect(size * 0.5 - 2, 0, 4, size);
  hctx.globalAlpha = 0.22;
  for (let i = 0; i < size * 4; i++) {
    const g = 110 + Math.floor(rand() * 120);
    hctx.fillStyle = `rgb(${g},${g},${g})`;
    hctx.fillRect(rand() * size, rand() * size, 1.4, 1.4);
  }
  hctx.globalAlpha = 1;

  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#403a33';
  ctx.fillRect(0, 0, size, size);
  const hData = hctx.getImageData(0, 0, size, size).data;
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const k = 0.5 + (hData[i] / 255) * 0.85;
    d[i] = Math.min(255, d[i] * k);
    d[i + 1] = Math.min(255, d[i + 1] * k);
    d[i + 2] = Math.min(255, d[i + 2] * k);
  }
  ctx.putImageData(img, 0, 0);

  // Traffic wear: the tread is polished flat where boots have walked for years.
  for (let i = 0; i < 5; i++) {
    const g = ctx.createRadialGradient(
      rand() * size, rand() * size, 4, rand() * size, rand() * size, 40 + rand() * 90
    );
    g.addColorStop(0, 'rgba(150, 138, 118, 0.16)');
    g.addColorStop(1, 'rgba(150, 138, 118, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  return {
    map: finish(canvas, repeat),
    normalMap: finishData(heightToNormal(heightC, 2.2), repeat),
    roughnessMap: finishData(heightToRoughness(heightC, 0.46, 0.92), repeat)
  };
}

export function createLabBulkheadTexture(size = 512, repeat = 3) {
  const rand = mulberry32(0x8c41);
  const heightC = makeCanvas(size, size);
  const hctx = heightC.getContext('2d', { willReadFrequently: true });
  hctx.fillStyle = '#a4a4a4';
  hctx.fillRect(0, 0, size, size);

  // Chamfered panel: the relieved corner is the geometry rule in paint form.
  hctx.fillStyle = '#c8c8c8';
  hctx.fillRect(size * 0.06, size * 0.06, size * 0.88, size * 0.88);
  hctx.fillStyle = '#3a3a3a';
  hctx.strokeStyle = '#3a3a3a';
  hctx.lineWidth = 3;
  hctx.strokeRect(size * 0.06, size * 0.06, size * 0.88, size * 0.88);

  // Rivet rows down both stiles.
  hctx.fillStyle = '#f0f0f0';
  for (let i = 0; i < 11; i++) {
    const y = size * (0.1 + (i / 10) * 0.8);
    for (const x of [size * 0.1, size * 0.9]) {
      hctx.beginPath();
      hctx.arc(x, y, 3, 0, Math.PI * 2);
      hctx.fill();
    }
  }
  // Conduit run across the panel.
  hctx.fillStyle = '#e0e0e0';
  hctx.fillRect(0, size * 0.72, size, size * 0.05);
  hctx.globalAlpha = 0.2;
  for (let i = 0; i < size * 3; i++) {
    const g = 120 + Math.floor(rand() * 110);
    hctx.fillStyle = `rgb(${g},${g},${g})`;
    hctx.fillRect(rand() * size, rand() * size, 1.3, 1.3);
  }
  hctx.globalAlpha = 1;

  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#4a443b';
  ctx.fillRect(0, 0, size, size);
  const hData = hctx.getImageData(0, 0, size, size).data;
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const k = 0.52 + (hData[i] / 255) * 0.8;
    d[i] = Math.min(255, d[i] * k);
    d[i + 1] = Math.min(255, d[i + 1] * k);
    d[i + 2] = Math.min(255, d[i + 2] * k);
  }
  ctx.putImageData(img, 0, 0);

  // Scuffs at shoulder height, grime pooling low.
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = '#2a251f';
  for (let i = 0; i < 26; i++) {
    ctx.lineWidth = 1 + rand() * 2;
    ctx.beginPath();
    const y = size * (0.3 + rand() * 0.4);
    ctx.moveTo(rand() * size, y);
    ctx.lineTo(rand() * size, y + (rand() - 0.5) * 12);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const grime = ctx.createLinearGradient(0, size, 0, size * 0.62);
  grime.addColorStop(0, 'rgba(24, 21, 17, 0.5)');
  grime.addColorStop(1, 'rgba(24, 21, 17, 0)');
  ctx.fillStyle = grime;
  ctx.fillRect(0, size * 0.62, size, size * 0.38);

  return {
    map: finish(canvas, repeat),
    normalMap: finishData(heightToNormal(heightC, 2.4), repeat),
    roughnessMap: finishData(heightToRoughness(heightC, 0.5, 0.9), repeat)
  };
}

/* ============================================================================
   SEALED DOOR — the two charted sites that are not built yet
   A blast door that has been dogged shut and not opened since. Its face carries
   a site number and nothing else: the world does not narrate.
   ============================================================================ */

export function createSealedDoorTexture(size = 512, siteCode = '03') {
  const rand = mulberry32(hashStr('sealed' + siteCode));
  const heightC = makeCanvas(size, size);
  const hctx = heightC.getContext('2d', { willReadFrequently: true });
  hctx.fillStyle = '#909090';
  hctx.fillRect(0, 0, size, size);

  // Three horizontal dogging bars across the leaf.
  hctx.fillStyle = '#e8e8e8';
  for (const y of [0.22, 0.5, 0.78]) hctx.fillRect(size * 0.05, size * y - 14, size * 0.9, 28);
  hctx.fillStyle = '#2e2e2e';
  for (const y of [0.22, 0.5, 0.78]) {
    hctx.fillRect(size * 0.05, size * y + 14, size * 0.9, 4);
    hctx.fillRect(size * 0.05, size * y - 18, size * 0.9, 4);
  }
  // The centre seam where the leaf would part, and heavy corner bolts.
  hctx.fillStyle = '#242424';
  hctx.fillRect(size * 0.5 - 3, 0, 6, size);
  hctx.fillStyle = '#fafafa';
  for (const [x, y] of [[0.1, 0.1], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9]]) {
    hctx.beginPath();
    hctx.arc(size * x, size * y, 8, 0, Math.PI * 2);
    hctx.fill();
  }
  hctx.globalAlpha = 0.2;
  for (let i = 0; i < size * 3; i++) {
    const g = 110 + Math.floor(rand() * 120);
    hctx.fillStyle = `rgb(${g},${g},${g})`;
    hctx.fillRect(rand() * size, rand() * size, 1.4, 1.4);
  }
  hctx.globalAlpha = 1;

  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#5c5346';
  ctx.fillRect(0, 0, size, size);
  const hData = hctx.getImageData(0, 0, size, size).data;
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const k = 0.5 + (hData[i] / 255) * 0.85;
    d[i] = Math.min(255, d[i] * k);
    d[i + 1] = Math.min(255, d[i + 1] * k);
    d[i + 2] = Math.min(255, d[i + 2] * k);
  }
  ctx.putImageData(img, 0, 0);

  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = '#cfc5ae';
  ctx.font = `700 ${Math.round(size * 0.22)}px "Share Tech Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(siteCode, size * 0.5, size * 0.42);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 1;
  for (let i = 0; i < 110; i++) {
    ctx.beginPath();
    ctx.arc(size * (0.3 + rand() * 0.4), size * (0.22 + rand() * 0.24), 2 + rand() * 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Salt has grown right up the door: nobody has opened it in a long time.
  const salt = ctx.createLinearGradient(0, size, 0, size * 0.55);
  salt.addColorStop(0, 'rgba(226, 220, 203, 0.62)');
  salt.addColorStop(1, 'rgba(226, 220, 203, 0)');
  ctx.fillStyle = salt;
  ctx.fillRect(0, size * 0.55, size, size * 0.45);

  return {
    map: finish(canvas, 1),
    normalMap: finishData(heightToNormal(heightC, 2.8), 1),
    roughnessMap: finishData(heightToRoughness(heightC, 0.55, 0.95), 1)
  };
}

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
