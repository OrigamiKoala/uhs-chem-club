/**
 * verify-lanternfall-learn.mjs — Lanternfall's stages, recomputed.
 *
 * EVERY FIGURE A LANTERNFALL STAGE GRADES AGAINST IS RECOMPUTED FROM THE REAL TABLES. An answer authored as a literal can drift from
 * the instrument that teaches it; one recomputed here from `lightdata.js`, `orbitals.js` and `electrons.js` cannot. This is the part of
 * `verify:learn` that knows each Lanternfall quest by its stages. It was moved out of `tools/verify-learn.mjs` on 2026-10-23, when the nine
 * benches and the boss were cut to one click each (the old checks are kept in `archive/2026-10-23/tools/`), so that a change to a
 * Lanternfall stage is a change to one file.
 *
 * It also holds the rules this world adds to the standing ones (see `lanternfallRules`): a miss message names what the table shows and
 * never gives the reasoning back, and a predict stage holds the guess alone.
 */

const IDS = ['q1-wave', 'q2-photon', 'q3-lines', 'q4-cloud', 'q5-numbers', 'q6-filling', 'q7-pes', 'q8-trends', 'q9-absorb', 'boss-eater'];

export async function verifyLanternfallLearn({ getQuest, TABLE, fail, ok, count, quests }) {
  const before = count();
  const D = await import('../../src/learn/engine/lightdata.js');
  const mods = {};
  for (const id of IDS) {
    const q = getQuest('unit02', id);
    mods[id] = q ? await q.module?.() : null;
  }
  const near = (a, b, tol, what) => { if (Math.abs(a - b) > tol) fail(`${what}: graded ${a}, the real figure is ${Number(b).toFixed(3)}`); };
  const same = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${what}: graded ${JSON.stringify(a)}, the real answer is ${JSON.stringify(b)}`); };
  const holds = (c, what) => { if (!c) fail(what); };
  /** The helpers a quest's checks share: the stage's opening table and the table its solution leaves. */
  const rig = (q) => ({
    start: i => TABLE.createTable(q.STAGES[i].table, q.STAGES[i].title),
    end: i => TABLE.runScript(TABLE.createTable(q.STAGES[i].table, q.STAGES[i].title), q.SOLUTIONS[i], { strict: true }),
    miss: i => TABLE.runScript(TABLE.createTable(q.STAGES[i].table, q.STAGES[i].title), q.MISSES[i], { strict: true }),
    run: (i, script) => TABLE.runScript(TABLE.createTable(q.STAGES[i].table, q.STAGES[i].title), script, { strict: true })
  });
  const env = { D, TABLE, near, same, holds, rig, fail };

  const checks = await Promise.all(IDS.map(async id => {
    try { return [id, (await import(`./lanternfall/${id}.mjs`)).default]; } catch (err) { return [id, null]; }
  }));
  for (const [id, fn] of checks) {
    if (!mods[id]) continue;
    if (!fn) { fail(`unit02/${id}: tools/lib/lanternfall/${id}.mjs has no recomputation of this quest's graded figures`); continue; }
    await fn(mods[id], env);
  }

  lanternfallRules({ mods, TABLE, fail, holds, rig });
  if (count() === before) ok('Lanternfall quests: each stage\'s graded figures agree with the planners');
}

/* ------------------------------------------------------------------
   THE RULES THIS WORLD ADDS (problems doc T3, T4, T2/T5, U2, U3)
   ------------------------------------------------------------------ */

/**
 * Words that mean a miss message is giving the reasoning back. A miss names what the table shows that disagrees ("Beacon 1 has more
 * crests passing each second") or says nothing; it never says why a thing is so, and it never says what to do.
 */
const REASONING = /\b(because|therefore|which means|that means|so that|this is why|the reason|must be|has to be|should be|you need|you should|try |look for|remember)\b/i;

function lanternfallRules({ mods, TABLE, fail, holds, rig }) {
  for (const [id, q] of Object.entries(mods)) {
    if (!q) continue;
    const r = rig(q);
    q.STAGES.forEach((st, i) => {
      const label = `unit02/${id} stage ${i + 1}`;
      // T4: every message a miss can show (the scripted miss, an untouched bench, and every sentence the check can produce).
      const msgs = new Set();
      try { const m = st.check(q.stateFor(i, q.MISSES[i] || [])); if (m && !m.ok && m.msg) msgs.add(m.msg); } catch { /* checked elsewhere */ }
      try { const m = st.check(q.stateFor(i, {})); if (m && !m.ok && m.msg) msgs.add(m.msg); } catch { /* checked elsewhere */ }
      for (const m of msgs) if (REASONING.test(m)) fail(`${label}: a miss message gives reasoning or a route back ("${m.slice(0, 80)}")`);
      const src = String(st.check);
      for (const lit of src.match(/'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g) || []) {
        const s = lit.slice(1, -1);
        if (/\s/.test(s) && REASONING.test(s) && !/^\s*$/.test(s)) fail(`${label}: a check() message gives reasoning or a route back ("${s.slice(0, 80)}")`);
      }
      // T5 and the predict-first rule: a predict stage holds the guess alone, and the stage after it brings the instrument.
      if (st.predict) {
        const t = r.start(i);
        holds(Boolean(t.prediction) || Object.values(t.pieces).some(p => p.kind === 'model' || p.kind === 'card' || p.kind === 'ccard' || p.kind === 'etok'), `${label}: a predict stage with nothing to guess with`);
        holds(!Object.values(t.fixtures).some(f => !f.noRun || Object.keys(f.dials).length), `${label}: a predict stage has a runnable or adjustable instrument on the table`);
        holds(!t.tools.length, `${label}: a predict stage carries a tool`);
        holds(i < q.STAGES.length - 1, `${label}: a predict stage with no stage after it to test the guess`);
        const next = q.STAGES[i + 1];
        holds(next && !next.predict && Object.values(r.start(i + 1).fixtures).length > 0, `${label}: the stage after a predict stage must bring the instrument`);
        holds(typeof next?.prompt === 'string', `${label}: the test stage has no prompt`);
        holds(st.check(q.stateFor(i, {})).ok === false, `${label}: a predict stage can be submitted blank`);
      } else {
        const t = r.start(i);
        if (t.prediction) fail(`${label}: asks for a prediction token on a stage that is not a predict stage`);
      }
      // U3: no field stage that carries what the bench already holds; none on a boss; at most one a quest.
      const fetches = Object.keys(r.start(i).fetch || {});
      if (fetches.length) fail(`${label}: sends the player to a field point (Lanternfall's field points were cut: each carried a copy of what the bench held)`);
    });
    // T7: a bench keeps the stages that carry a distinct idea, and at most one prediction pair per three stages (never every stage).
    const predicts = q.STAGES.filter(s => s.predict).length;
    if (!id.startsWith('boss-')) {
      holds(q.STAGES.length >= 3 && q.STAGES.length <= 6, `unit02/${id}: ${q.STAGES.length} stages (a bench keeps 3 to 6)`);
      holds(predicts >= 1, `unit02/${id}: no predict stage on the quest's click`);
      holds(predicts * 2 <= q.STAGES.length, `unit02/${id}: a prediction on too many stages`);
    } else {
      holds(predicts === 0, `unit02/${id}: a boss phase is a predict stage`);
    }
  }
}
