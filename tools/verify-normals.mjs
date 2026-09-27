/**
 * verify-normals.mjs — A raised thing on a normal map reads as raised.
 *
 * three.js reads a tangent-space normal map OpenGL-style: red is +u, green is
 * +v, and a CanvasTexture's default flipY puts canvas row 0 at v = 1, so +v is
 * canvas UP. `heightToNormal` once wrote green the other way round (DirectX
 * style), and every rivet, pebble, bolt head and stone in the product rendered
 * pressed in — Erebus's stones read as craters. The Erebus rebuild then worked
 * round it locally with a negative `normalScale.y` and a flipped channel in its
 * triplanar shader, which is exactly how a sign bug becomes permanent: fix the
 * generator and the workarounds invert those surfaces straight back.
 *
 * So two checks:
 *
 * 1. BEHAVIOURAL. A dome is drawn into a height field, put through both
 *    generators (`pbr-kit.js` and the copy in `tallow-textures.js`), and the
 *    normal on each flank is taken through the tangent frame three.js uses on a
 *    PlaneGeometry (T = +x world = +u, B = +y world = +v). Every flank must lean
 *    AWAY from the dome's centre, which is what "raised" means to the light.
 *
 * 2. SOURCE. No material may compensate: no negative component in a
 *    `normalScale`, and no shader negating a sampled normal's y.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installDomShim } from './lib/dom-shim.mjs';

installDomShim();

let failures = 0;
const fail = (msg) => { console.log(`  FAIL ${msg}`); failures++; };
const ok = (msg) => console.log(`  ok   ${msg}`);

console.log('Normal maps\n');

const kit = await import('../src/three/materials/pbr-kit.js');
const tallow = await import('../src/three/materials/tallow-textures.js');

/* ------------------------------------------------------- a dome reads raised */

const N = 64, C = N / 2, R = 14;
const dome = new Float32Array(N * N);
for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    const d = Math.hypot(x - C, y - C) / R;
    dome[y * N + x] = d < 1 ? 0.2 + 0.6 * Math.sqrt(1 - d * d) : 0.2;
  }
}
const heightCanvas = kit.writeField({ data: dome, w: N, h: N });

// Where a flank pixel sits in CANVAS pixels, and which way its normal must lean
// in TANGENT space (+x = canvas right, +y = canvas up, because of flipY).
const FLANKS = [
  { name: 'right flank', dx: +8, dy: 0, lean: [+1, 0] },
  { name: 'left flank', dx: -8, dy: 0, lean: [-1, 0] },
  { name: 'top flank', dx: 0, dy: -8, lean: [0, +1] },
  { name: 'bottom flank', dx: 0, dy: +8, lean: [0, -1] }
];

function checkGenerator(label, normalCanvas) {
  const px = normalCanvas.getContext('2d').getImageData(0, 0, N, N).data;
  const before = failures;
  for (const f of FLANKS) {
    const i = ((C + f.dy) * N + (C + f.dx)) * 4;
    const tx = px[i] / 127.5 - 1, ty = px[i + 1] / 127.5 - 1, tz = px[i + 2] / 127.5 - 1;
    if (tz <= 0) { fail(`${label}: ${f.name} normal points into the surface`); continue; }
    // On a PlaneGeometry facing +z the TBN frame is the identity, so the world
    // normal is the tangent normal; lean is its projection on the outward axis.
    const lean = tx * f.lean[0] + ty * f.lean[1];
    if (lean < 0.1) {
      fail(`${label}: the ${f.name} of a dome leans ${lean < 0 ? 'toward' : 'nowhere near away from'} ` +
        `its centre (${lean.toFixed(2)}) — a raised feature would read as a dimple`);
    }
  }
  if (failures === before) ok(`${label}: every flank of a dome leans away from its centre`);
}

checkGenerator('pbr-kit heightToNormal', kit.heightToNormal(heightCanvas, 2.2));
checkGenerator('tallow-textures heightToNormal', tallow.heightToNormal(heightCanvas, 2.2));

/* ------------------------------------------------------- nothing compensates */

const root = fileURLToPath(new URL('../src/', import.meta.url));
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js')) files.push(p);
  }
})(root);

const before = failures;
const NUM = String.raw`[\w.()*+/ ]+`;
const PATTERNS = [
  [new RegExp(String.raw`normalScale\s*(?::|=)\s*new\s+THREE\.Vector2\(\s*(-${NUM}|${NUM},\s*-)`), 'a negative normalScale'],
  [new RegExp(String.raw`normalScale\.set\(\s*(-${NUM}|${NUM},\s*-)`), 'a negative normalScale'],
  [/normalScale\.[xy]\s*(?:=\s*-|\*=\s*-)/, 'a negative normalScale'],
  [/\b(\w+)\.y\s*=\s*-\s*\1\.y\b/, 'a shader negating a normal\'s y']
];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, n) => {
    for (const [re, what] of PATTERNS) {
      if (re.test(line)) {
        fail(`${relative(root, file)}:${n + 1} carries ${what} — the maps are OpenGL-style now; ` +
          `a compensation inverts the surface back to dimples`);
      }
    }
  });
}
if (failures === before) ok(`no material in ${files.length} source files compensates for an inverted green channel`);

console.log(failures ? `\n${failures} failure(s)` : '\nAll normal-map checks pass.');
process.exit(failures ? 1 : 0);
