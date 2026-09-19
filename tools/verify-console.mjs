/**
 * verify-console.mjs — The Charge Gardens console, measured in the glass.
 *
 * The user's rule for the T4 chamber is arithmetic, so it is checked as
 * arithmetic: ONE surface, sitting LOW, covering no more than a quarter of the
 * height of the view, so three quarters of the glass is always the chamber and
 * the molecule the stage is asking about is never behind a panel.
 *
 * `fitConsole` is pure and is the same function the live mount calls, so this
 * measures the console that actually ships rather than a model of it.
 */

// console.js reaches the tier probe, which reaches the session store, which
// reads localStorage at module load. One shim, installed before the import.
const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });

const THREE = await import('three');
const { fitConsole, measureConsole } = await import('../src/quest3d/console.js');

let failures = 0;
const fail = (msg) => { console.log(`  FAIL ${msg}`); failures++; };
const ok = (msg) => console.log(`  ok   ${msg}`);

console.log('Charge Gardens console — one desk, low, under a quarter of the glass\n');

// Every shape of glass the product claims to support, from a 375 px phone in
// landscape up to an ultrawide monitor. Vertical field is the stage camera's.
const VIEWPORTS = [
  [3840, 2160], [2560, 1440], [1920, 1080], [1680, 1050], [1600, 900],
  [1440, 900], [1366, 768], [1280, 1024], [1200, 1600], [1024, 1366],
  [960, 540], [900, 1600], [812, 375], [667, 375]
];

let worstH = 0;
let worstW = 0;

for (const [W, H] of VIEWPORTS) {
  const cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
  cam.updateProjectionMatrix();

  const { w, y } = fitConsole(cam);
  const m = measureConsole(cam, w, y);

  const hPct = (m.hSpan / 2) * 100;
  const wPct = (m.wSpan / 2) * 100;
  worstH = Math.max(worstH, hPct);
  worstW = Math.max(worstW, wPct);

  const label = `${W}x${H}`;

  // 1. THE CEILING. A quarter of the height, with a hair of numerical slack.
  if (hPct > 25.2) fail(`${label}: the console covers ${hPct.toFixed(1)}% of the view height (max 25%)`);

  // 2. It stays inside the glass, top and bottom and both sides.
  if (m.minY < -1.0) fail(`${label}: the front lip hangs ${(-1 - m.minY).toFixed(3)} below the glass`);
  if (m.maxX > 1.0 || m.minX < -1.0) fail(`${label}: the fascia runs off the side of the glass`);

  // 3. IT IS LOW. Its top edge must sit in the bottom third, or it is a panel
  //    across the middle of the chamber again.
  if (m.maxY > -0.33) fail(`${label}: the console's top edge reaches ${m.maxY.toFixed(2)} NDC — it must stay below -0.33`);

  // 4. The chamber keeps the rest. Nothing above the desk is covered by it.
  const clear = ((1 - m.maxY) / 2) * 100;
  if (clear < 66) fail(`${label}: only ${clear.toFixed(1)}% of the glass is left for the chamber`);
}

if (!failures) {
  ok(`${VIEWPORTS.length} viewports: one desk, worst case ${worstH.toFixed(1)}% of the height and ${worstW.toFixed(1)}% of the width`);
  ok('the chamber keeps at least two thirds of the glass at every aspect');
}

console.log(`\n${failures === 0 ? 'CONSOLE OK' : failures + ' PROBLEM(S) FOUND'}`);
process.exit(failures === 0 ? 0 : 1);
