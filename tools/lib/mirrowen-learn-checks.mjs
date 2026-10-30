/**
 * mirrowen-learn-checks.mjs — what `verify:learn` holds Mirrowen (unit06) to, beyond the rules every quest keeps.
 *
 * One file per bench in `tools/lib/mirrowen/<questId>.mjs`, found by name, so two benches never edit the same file. A bench file exports
 *
 *   export const LEAKS = { <stage number, 1-based>: [regexes a refusal may not carry] };
 *   export async function check(c)   // c = { q, mod, TABLE, MD, near, same, holds, start, done, run }
 *
 * `LEAKS` are applied here to every refusal and to the blank refusal of each stage: a miss may name what the table shows, never the
 * rule that reads it. `check` recomputes every graded figure from an INDEPENDENT source (a hand-worked value, the CRC or the CED), never
 * from the same code that produced it.
 *
 * Called once from `verify-learn.mjs` with the shared helpers: { TABLE, getQuest, fail, ok, sentenceLiterals }
 */

import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export async function checkMirrowen({ TABLE, getQuest, fail, ok, sentenceLiterals }) {
  let bad = 0;
  const f = msg => { bad++; fail(msg); };
  const MD = await import('../../src/learn/engine/matterdata.js');
  const files = readdirSync(join(here, 'mirrowen')).filter(n => n.endsWith('.mjs')).sort();
  const near = (a, b, tol, what) => { if (!(Math.abs(a - b) <= tol)) f(`${what}: graded ${a}, the real figure is ${Number(b).toFixed(4)}`); };
  const same = (a, b, what) => { if (String(a) !== String(b)) f(`${what}: graded ${a}, the real answer is ${b}`); };
  const holds = (cond, what) => { if (!cond) f(what); };

  /* ---- the tables themselves, held to values worked by hand or read from the CRC ---- */
  near(MD.vaporPressure('H2O', 25), 3.17, 0.05, 'matterdata: water at 25 °C (kPa)');
  near(MD.boilingPoint('H2O', 60), 85.95, 0.3, 'matterdata: water at 60 kPa boils at 85.95 °C');
  near(MD.heatToReach(18.015, -10, 110), 54928.9, 1, 'matterdata: 18.015 g of ice at −10 °C to steam at 110 °C (J)');
  near(MD.molarity(5.85, 58.44, 0.25), 0.4003, 0.001, 'matterdata: 5.85 g of NaCl in 250 mL');
  near(MD.stockVolume(2.0, 0.5, 100), 25, 1e-9, 'matterdata: M1V1 = M2V2');

  for (const file of files) {
    const id = file.replace(/\.mjs$/, '');
    const q = getQuest('unit06', id);
    const mod = q && q.status === 'live' ? await q.module() : null;
    if (!mod) continue; // a chart entry that is not live yet has nothing to check
    const bench = await import(`./mirrowen/${file}`);
    const start = (m, i) => TABLE.createTable(m.STAGES[i].table, m.STAGES[i].title);
    const run = (t, script) => TABLE.runScript(t, script);
    const done = (m, i) => TABLE.runScript(start(m, i), m.SOLUTIONS[i], { strict: true });
    for (const [n, rxs] of Object.entries(bench.LEAKS || {})) {
      const i = Number(n) - 1;
      const st = mod.STAGES[i];
      if (!st) { f(`unit06/${id}: LEAKS names stage ${n}, which does not exist`); continue; }
      const texts = new Set(sentenceLiterals(st.check));
      const miss = st.check(mod.stateFor(i, mod.MISSES[i] || []));
      if (miss?.msg) texts.add(miss.msg);
      const blank = st.check(mod.stateFor(i, {}));
      if (blank?.msg) texts.add(blank.msg);
      for (const t of texts) for (const rx of rxs) if (rx.test(t)) f(`unit06/${id} stage ${n}: a refusal carries the rule the stage is asking for (${rx}) in "${t.slice(0, 90)}"`);
    }
    await bench.check({ q: `unit06/${id}`, mod, TABLE, MD, near, same, holds, start, done, run, fail: f });
  }
  return bad;
}
