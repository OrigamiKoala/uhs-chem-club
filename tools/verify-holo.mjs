/**
 * verify-holo.mjs — Two rules about the ship's screens that nothing else checks.
 *
 * ONE KEY, ONE OWNER. `X` opens and closes a holographic projection. It stopped
 * working because TWO handlers were bound to it — `FpsControls.onKeyDown` and
 * the window listener in `stage.js` — so every press toggled the board twice,
 * open and shut inside one frame, and the key read as dead. Nothing about that
 * is visible in a diff of either file alone, so it is asserted here: the walk
 * controls must declare no `KeyX` case at all.
 *
 * THE BOARD NEVER INVENTS TELEMETRY. Avalon is pre-launch — there are no real
 * accounts, no XP and no play data (PRODUCT.md) — and the comms CRT used to
 * fall back to four hardcoded guild totals whenever it was handed nothing. A
 * student reading a fully populated season off an instrument that has never
 * seen a submission is being lied to by the product. The board now says it has
 * no telemetry, and these checks keep it that way.
 *
 * Source-level, deliberately. Both rules are about what the code is ALLOWED to
 * contain; a runtime probe of a canvas would pass right up until somebody added
 * the fallback back.
 */

import { readFileSync } from 'node:fs';

let failures = 0;
const fail = (msg) => { console.log(`  FAIL ${msg}`); failures++; };
const ok = (msg) => console.log(`  ok   ${msg}`);

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

console.log('Holograms and the comms board\n');

/* ------------------------------------------------------- one key, one owner */

const fps = read('../src/three/fps-controls.js');
if (/case\s+["']KeyX["']/.test(fps)) {
  fail('fps-controls.js binds KeyX — the hologram key belongs to stage.js alone, ' +
    'and two handlers cancel each other out');
}
if (/onToggleHolo\s*\(/.test(fps) || /this\.onCloseHolo\s*\(/.test(fps)) {
  fail('fps-controls.js still calls a hologram callback');
}

const stage = read('../src/three/stage.js');
const xListeners = (stage.match(/e\.code === "KeyX"|e\.key === "x"/g) || []).length;
if (xListeners === 0) fail('stage.js no longer listens for the hologram key at all');
if (!/if \(e\.repeat\) return;/.test(stage)) {
  fail('stage.js does not ignore auto-repeat — holding X would strobe the board');
}
for (const fn of ['toggleAnyHolo', 'toggleClubHolo', 'toggleStarmapHolo']) {
  if (!stage.includes(`${fn}(`)) fail(`stage.js has no ${fn}`);
}
if (!failures) ok('the hologram key has exactly one owner, and ignores auto-repeat');

/* ------------------------------------------------- the board invents nothing */

const before = failures;
const textures = read('../src/three/materials/textures.js');
const standings = textures.slice(
  textures.indexOf('export function createCommsStandingsTexture'),
  textures.indexOf('export function createCargoManifestTexture')
);
if (!standings) fail('createCommsStandingsTexture is gone');

if (/defaultTeams/.test(standings)) {
  fail('createCommsStandingsTexture carries a default team table — a board with no ' +
    'data must say so, not make a season up');
}
// A literal score, or a literal guild name, is data that came from nowhere.
// Canvas coordinates are numbers too, so the check is on what the number is
// FOR rather than on the number itself.
if (/(?:team_)?score\s*:\s*\d/.test(standings)) {
  fail('createCommsStandingsTexture assigns a literal score');
}
if (/name\s*:\s*['"][A-Z]/.test(standings)) {
  fail('createCommsStandingsTexture names a guild of its own');
}
for (const guild of ['THERMAL SMELTERS', 'MINERAL MINING', 'MOISTURE RIGS', 'ATMOSPHERIC HARVESTERS']) {
  if (standings.includes(guild)) fail(`createCommsStandingsTexture hardcodes "${guild}"`);
}
if (!/NO GUILD TELEMETRY/.test(standings)) {
  fail('createCommsStandingsTexture says nothing when it has no rows');
}

const ship = read('../src/three/ship.js');
if (!/createCommsStandingsTexture\(\[\], ''\)/.test(ship)) {
  fail('the comms screen is not built empty — it must start with no rows and be ' +
    'filled by updateDisplays once the real board arrives');
}

// The figures must come from the leaderboard route, which is the same
// computation Standings reads (mean of active members, never a sum).
if (!/api\.getLeaderboards\(\)/.test(stage)) {
  fail('stage.js does not fetch the real leaderboard for the comms board');
}
if (/\{ name: 'Earth', score:/.test(stage)) {
  fail('stage.js still carries an invented guild score table');
}
if (failures === before) {
  ok('the comms board shows the real standings, or admits it has none');
}

console.log(`\n${failures === 0 ? 'HOLO OK' : failures + ' PROBLEM(S) FOUND'}`);
process.exit(failures === 0 ? 0 : 1);
