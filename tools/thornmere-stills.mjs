/**
 * thornmere-stills.mjs — a reading aid, not a check: draws Thornmere's tabletops to PNG files with the game's own `drawTable`, so a stage
 * can be looked at without the game. Needs a canvas for Node, which the project does not depend on: install `@napi-rs/canvas` anywhere and
 * point CANVAS_MODULE at it.
 *
 *   CANVAS_MODULE=/path/to/node_modules/@napi-rs/canvas/index.js node tools/thornmere-stills.mjs <quest> <outDir> [stage ...] [--w 812] [--h 375]
 *
 * For each stage it writes four pictures: as the stage opens, part-way through the miss script's last action, after the miss script, and
 * after the solution script. Each stage's check result is printed for the miss and for the solution.
 */
import { installDomShim } from './lib/dom-shim.mjs';
installDomShim({ tier: 'T1' });
const { createCanvas } = await import(process.env.CANVAS_MODULE);
const fs = await import('node:fs');
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? Number(args.splice(i, 2)[1]) : d; };
const W = flag('w', 812); const H = flag('h', 375);
const [quest, out, ...only] = args;
await import('../src/learn/table/kits/index.js');
const { drawTable } = await import('../src/learn/engine/table2d.js');
const MODEL = await import('../src/learn/table/model.js');
const mod = await import(`../src/learn/quests/unit13/${quest}.js`);
fs.mkdirSync(out, { recursive: true });

const shot = (state, name, clock) => {
  const cv = createCanvas(W, H);
  const ctx = cv.getContext('2d');
  drawTable(ctx, W, H, state, { clock });
  fs.writeFileSync(`${out}/${name}.png`, cv.toBuffer('image/png'));
};
const play = (t, script) => { let cur = t; for (const step of script) for (const a of MODEL.expandStep(cur, step, 'direct')) cur = MODEL.apply(cur, a); return cur; };

mod.STAGES.forEach((st, i) => {
  if (only.length && !only.includes(String(i + 1))) return;
  const t0 = MODEL.createTable(st.table, st.title);
  const n = String(i + 1).padStart(2, '0');
  // The painters keep the time a change began: draw once before the change so the next picture is part-way through it.
  shot(t0, `${quest}-${n}-a-open`, 1);
  const miss = play(t0, mod.MISSES[i] || []);
  shot(miss, `${quest}-${n}-b-miss-moving`, 1.1);
  shot(miss, `${quest}-${n}-b-miss-moving`, 1.75);
  shot(miss, `${quest}-${n}-c-miss`, 60);
  const sol = play(t0, mod.SOLUTIONS[i] || []);
  shot(t0, `${quest}-${n}-a-open`, 61);
  shot(sol, `${quest}-${n}-d-solved-moving`, 61.1);
  shot(sol, `${quest}-${n}-d-solved-moving`, 62.6);
  shot(sol, `${quest}-${n}-e-solved`, 200);
  const cm = st.check({ table: miss }); const cs = st.check({ table: sol });
  console.log(`${quest} ${i + 1} "${st.title}"\n   prompt: ${st.prompt}\n   miss:   ${cm.ok ? 'PASSES (wrong)' : cm.msg}${cm.notYet ? ' (not yet)' : ''}\n   solved: ${cs.ok ? 'ok' : 'REFUSED: ' + cs.msg}`);
});
