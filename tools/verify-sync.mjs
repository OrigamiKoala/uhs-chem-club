/**
 * verify-sync.mjs — the Sheet is the master copy, localStorage is the cache, and
 * the two must always converge.
 *
 * Checks:
 *   - the merge is commutative, associative and idempotent (so devices can push
 *     in any order and still agree);
 *   - union sections never lose anything, latest sections pick the newest;
 *   - `apps-script/PlayerState.gs` (evaluated here in a sandbox) merges exactly as
 *     `src/shared/statemerge.js` does;
 *   - the dev proxy serves `state/get` / `state/save` and merges on the server;
 *   - a session round-trips: build -> merge with a second device -> apply, and the
 *     result is the union with nothing dropped and nothing left to push;
 *   - signing out wipes the per-player state a shared computer must not keep;
 *   - nothing in the sync path can carry XP.
 *
 * Run with `npm run verify:sync`.
 */

import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const fail = m => { console.error(`  FAIL ${m}`); failures++; };
const ok = m => console.log(`  ok   ${m}`);

const memory = new Map();
globalThis.localStorage = {
  getItem: k => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: k => memory.delete(k),
  clear: () => memory.clear()
};
const noop = () => {};
globalThis.window = globalThis.window || { addEventListener: noop, removeEventListener: noop, location: { hash: '' }, matchMedia: () => ({ matches: false }) };

const M = await import('../src/shared/statemerge.js');
const { mergeDocs, docsEqual, emptyDoc, stableStringify } = M;

/* ---- deterministic fixtures ---- */
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = list => list[Math.floor(rnd() * list.length)];

function randomDoc() {
  const d = emptyDoc();
  d.sections.flags = { at: 1, mode: 'union', v: Object.fromEntries(['a', 'b', 'c', 'd'].filter(() => rnd() < 0.6).map(k => [k, rnd() < 0.7])) };
  d.sections.notebook = { at: 1, mode: 'union', v: ['n1', 'n2', 'n3', 'n4', 'n5'].filter(() => rnd() < 0.5) };
  d.sections.learn = { at: 1, mode: 'union', v: Object.fromEntries(['u1/q1', 'u1/q2'].filter(() => rnd() < 0.7).map(k => [k, { stages: [0, 1, 2, 3].filter(() => rnd() < 0.5), completedAt: pick(['', '2026-10-01T00:00:00Z', '2026-10-09T00:00:00Z']) }])) };
  d.sections.practice = { at: 1, mode: 'union', v: { q: Object.fromEntries(['x#0', 'x#1', 'y#0'].filter(() => rnd() < 0.7).map(k => [k, { c: Math.floor(rnd() * 5), m: Math.floor(rnd() * 3) }])), days: ['2026-10-01', '2026-10-02', '2026-10-03'].filter(() => rnd() < 0.6), runs: Math.floor(rnd() * 9) } };
  d.sections.loadout = { at: Math.floor(rnd() * 5), mode: 'latest', v: { nameplate: pick(['default', 'brass', 'etched']), pinnedPlates: [pick(['p', 'q'])] } };
  return d;
}

/* ---- merge laws ---- */
{
  let bad = 0;
  for (let i = 0; i < 400; i++) {
    const a = randomDoc(); const b = randomDoc(); const c = randomDoc();
    const ab = mergeDocs(a, b); const ba = mergeDocs(b, a);
    if (!docsEqual(ab, ba)) bad++;
    if (!docsEqual(mergeDocs(ab, c), mergeDocs(a, mergeDocs(b, c)))) bad++;
    if (!docsEqual(mergeDocs(a, a), a)) bad++;
    // Nothing is ever lost from a union section.
    const nb = new Set(ab.sections.notebook?.v || []);
    for (const id of [...(a.sections.notebook?.v || []), ...(b.sections.notebook?.v || [])]) if (!nb.has(id)) bad++;
    // Numbers only grow.
    const cr = ab.sections.practice?.v?.runs || 0;
    if (cr < Math.max(a.sections.practice?.v?.runs || 0, b.sections.practice?.v?.runs || 0)) bad++;
  }
  bad ? fail(`merge laws broken ${bad} time(s)`) : ok('merge is commutative, associative, idempotent and loses nothing (400 random triples)');
}

/* ---- latest-mode ---- */
{
  const a = { v: 1, sections: { loadout: { at: 5, mode: 'latest', v: { nameplate: 'old' } } } };
  const b = { v: 1, sections: { loadout: { at: 9, mode: 'latest', v: { nameplate: 'new' } } } };
  const m = mergeDocs(a, b);
  m.sections.loadout.v.nameplate === 'new' && m.sections.loadout.at === 9
    ? ok('a "latest" section takes the newer whole (never a blend of two loadouts)')
    : fail('latest-mode section did not take the newer value');
}

/* ---- the Apps Script copy merges identically ---- */
{
  const code = fs.readFileSync(path.join(root, 'apps-script/PlayerState.gs'), 'utf8');
  const sandbox = { Db: {}, JSON, Object, Array, Math, Number, String, console };
  vm.createContext(sandbox);
  vm.runInContext(code + '\nthis.__merge = stateMergeDocs_; this.__PlayerState = PlayerState;', sandbox);
  let bad = 0;
  for (let i = 0; i < 300; i++) {
    const a = randomDoc(); const b = randomDoc();
    const here = mergeDocs(a, b);
    const there = JSON.parse(JSON.stringify(sandbox.__merge(a, b)));
    if (stableStringify(here) !== stableStringify(there)) bad++;
  }
  bad ? fail(`PlayerState.gs merges differently from statemerge.js in ${bad} of 300 cases`) : ok('PlayerState.gs merges exactly as src/shared/statemerge.js does (300 random pairs)');

  // PlayerState.save() end to end against an in-memory Db.
  const rows = [];
  sandbox.Db.findOne = (_t, pred) => rows.find(pred) || null;
  sandbox.Db.append = (_t, r) => rows.push({ ...r });
  sandbox.Db.update = (_t, pred, upd) => { rows.filter(pred).forEach(r => Object.assign(r, upd)); return 1; };
  const first = sandbox.__PlayerState.save('p1', { v: 1, sections: { notebook: { at: 1, mode: 'union', v: ['a'] } } });
  const second = sandbox.__PlayerState.save('p1', { v: 1, sections: { notebook: { at: 2, mode: 'union', v: ['b'] } } });
  const got = JSON.parse(JSON.stringify(second.sections.notebook.v)).sort().join(',');
  got === 'a,b' && rows.length === 1
    ? ok('PlayerState.save merges a second device\'s save into the first (one row per player)')
    : fail(`PlayerState.save lost data or duplicated a row: ${got}, ${rows.length} row(s)`);
  let threw = false;
  try { sandbox.__PlayerState.save('p1', null); } catch (e) { threw = e && e.code === 'BAD_REQUEST'; }
  threw ? ok('PlayerState.save refuses an empty document') : fail('PlayerState.save accepted an empty document');
}

/* ---- the Apps Script router and schema carry the new tab and routes ---- */
{
  const main = fs.readFileSync(path.join(root, 'apps-script/Main.gs'), 'utf8');
  const db = fs.readFileSync(path.join(root, 'apps-script/Db.gs'), 'utf8');
  const players = fs.readFileSync(path.join(root, 'apps-script/Players.gs'), 'utf8');
  /'state\/get'/.test(main) && /'state\/save'/.test(main) ? ok('Main.gs routes state/get and state/save (auth required)') : fail('Main.gs is missing the state routes');
  /PlayerState:\s*\['player_id', 'data', 'updated_at'\]/.test(db) ? ok('Db.gs declares the PlayerState tab') : fail('Db.gs is missing the PlayerState tab');
  /state: state/.test(players) ? ok('Players.getMe returns the synced state in the same round trip') : fail('Players.getMe does not return state');
  const ps = fs.readFileSync(path.join(root, 'apps-script/PlayerState.gs'), 'utf8');
  /xp/i.test(ps.replace(/\/\*[\s\S]*?\*\//g, '')) ? fail('PlayerState.gs mentions XP outside its header') : ok('PlayerState.gs carries no XP');
}

/* ---- the dev proxy ---- */
{
  const proxy = (await import('../api/[...route].js')).default;
  const call = async (p, body) => {
    let out = '';
    const res = { statusCode: 0, setHeader: noop, end: s => { out = s; } };
    await proxy({ method: 'POST', url: `/api/${p}`, headers: {}, body, query: { route: p.split('/') } }, res);
    return JSON.parse(out);
  };
  const reg = await call('auth/register', { email: 'sync@example.com', password: 'correct-horse-9', displayName: 'SyncTest' });
  const token = reg.data && reg.data.token;
  if (!token) {
    fail(`could not register a mock player (${JSON.stringify(reg).slice(0, 120)})`);
  } else {
    const a = await call('state/save', { token, state: { v: 1, sections: { notebook: { at: 1, mode: 'union', v: ['one'] } } } });
    const b = await call('state/save', { token, state: { v: 1, sections: { notebook: { at: 2, mode: 'union', v: ['two'] } } } });
    const g = await call('state/get', { token });
    const ids = (g.data?.state?.sections?.notebook?.v || []).slice().sort().join(',');
    a.ok && b.ok && ids === 'one,two' ? ok('dev proxy serves state/get + state/save and merges on the server') : fail(`dev proxy state routes wrong: ${JSON.stringify(g).slice(0, 160)}`);
    const me = await call('player/me', { token });
    me.data?.state?.sections?.notebook ? ok('player/me carries the synced state') : fail('player/me does not carry state');
    const anon = await call('state/get', {});
    anon.ok === false && anon.error?.code === 'UNAUTHORIZED' ? ok('state routes refuse an anonymous caller') : fail('state/get answered an anonymous caller');
  }
}

/* ---- a session round trip across two "devices" ---- */
{
  const { session } = await import('../src/session.js');
  session.clear();
  session.setFlag('story_world_seen_unit01', true);
  session.recordNotebookMany(['campaign:0', 'campaign:1']);
  session.recordLearnStage('unit01', 'q1-grain', 0);
  session.practice = { q: { 'q1-grain#0': { c: 2, m: 0 } }, days: ['2026-10-14'], runs: 1, stars: {}, best: {} };

  const otherDevice = {
    v: 1,
    sections: {
      notebook: { at: 5, mode: 'union', v: ['campaign:1', 'world:unit01:0'] },
      learn: { at: 5, mode: 'union', v: { 'unit01/q1-grain': { stages: [1], completedAt: '' }, 'unit01/q2-core': { stages: [0], completedAt: '' } } },
      practice: { at: 5, mode: 'union', v: { q: { 'q1-grain#0': { c: 1, m: 1 }, 'q1-grain#1': { c: 1, m: 0 } }, days: ['2026-10-13'], runs: 2 } },
      flags: { at: 5, mode: 'union', v: { found_tallow_marker: true } }
    }
  };
  let dirtied = 0;
  session.stateDirtyHook = () => { dirtied++; };
  const merged = session.applyRemoteState(otherDevice);

  const nb = session.getNotebook().slice().sort().join(',');
  nb === 'campaign:0,campaign:1,world:unit01:0' ? ok('notebook = union of both devices') : fail(`notebook after merge: ${nb}`);
  const l = session.learn;
  l['unit01/q1-grain'].stages.slice().sort().join(',') === '0,1' && l['unit01/q2-core']
    ? ok('learn stages from both devices are kept') : fail('learn stages were not unioned');
  session.practice.q['q1-grain#0'].c === 2 && session.practice.q['q1-grain#0'].m === 1 && session.practice.runs === 2 && session.practice.days.length === 2
    ? ok('practice counters only grow and days union') : fail(`practice merge wrong: ${JSON.stringify(session.practice)}`);
  session.hasFlag('found_tallow_marker') && session.hasFlag('story_world_seen_unit01') ? ok('flags union') : fail('flags were not unioned');
  dirtied > 0 ? ok('local-only progress asks for a push after a pull') : fail('a pull that left the server behind did not ask for a push');
  docsEqual(session.buildStateDoc(), merged) ? ok('after applying, the device and the merged document agree (no push loop)') : fail('device and merged document disagree after apply');

  // Applying the merged result as the server's answer is a fixed point.
  dirtied = 0;
  session.lastRemoteState = null;
  session.applyRemoteState(merged);
  dirtied === 0 ? ok('re-applying the server\'s own answer asks for nothing') : fail('applying the merged document again still wants a push');

  // An edit made after a pull must read as a change (the merge must not alias the server's copy).
  {
    session.lastRemoteState = null;
    session.applyRemoteState({ v: 1, sections: { practice: { at: 3, mode: 'union', v: { q: { 'only-remote#0': { c: 1, m: 0 } }, days: [], runs: 0 } } } });
    const before = JSON.stringify(session.lastRemoteState);
    session.practice.q['only-remote#0'].c += 1;
    session.getNotebook().push('late-entry');
    JSON.stringify(session.lastRemoteState) === before && !docsEqual(session.buildStateDoc(), session.lastRemoteState)
      ? ok('editing after a pull does not alter the remembered server copy, so the push is not skipped')
      : fail('the server copy aliases live state: an edit after a pull would never be pushed');
    session.getNotebook().pop();
  }

  // Per-device UI toggles never travel, in either direction.
  session.applyRemoteState({ v: 1, sections: { flags: { at: 9, mode: 'union', v: { staleHoloClosed: true } } } });
  session.flags.staleHoloClosed ? fail('a hologram toggle from the server was adopted') : ok('a hologram toggle in the server\'s copy is ignored');
  const doc = session.buildStateDoc();
  session.setFlag('commsHoloClosed', true);
  const doc2 = session.buildStateDoc();
  'commsHoloClosed' in (doc2.sections.flags.v) ? fail('a hologram toggle was synced') : ok('per-device hologram toggles are not synced');

  // Sign-out wipes what a shared computer must not hand on.
  session.clear();
  session.getNotebook().length === 0 && Object.keys(session.practice).length === 0 && !session.hasFlag('found_tallow_marker')
    ? ok('sign-out clears notebook, practice and flags from the device') : fail('sign-out left per-player state behind');
}

/* ---- guest mode: localStorage only, nothing reaches the Sheet ---- */
{
  const { session } = await import('../src/session.js');
  const { apiCall } = await import('../src/api.js');
  const { sync } = await import('../src/sync.js');
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts = {}) => {
    calls.push({ url, body: JSON.parse(opts.body || '{}') });
    return { json: async () => ({ ok: true, data: {} }) };
  };

  session.clear();
  session.startGuest();
  session.isGuest && session.isSignedIn && session.player?.display_name === 'Guest'
    ? ok('"Continue as Guest" signs in a local guest') : fail('startGuest did not produce a signed-in guest');

  session.addXp(25);
  session.recordProgress('q1', 1);
  session.recordNotebook('guest:entry');
  const me = await apiCall('player/me');
  me && me.player === session.player && me.xp === undefined
    ? ok('player/me is answered locally and cannot roll back XP') : fail('guest player/me wrong');
  let refused = null;
  try { await apiCall('state/save', { state: session.buildStateDoc() }); } catch (e) { refused = e; }
  refused?.code === 'GUEST_LOCAL' ? ok('guest state/save is refused locally') : fail('guest state/save was not refused');
  try { await apiCall('quest/grade', { questId: 'q1', stageIndex: 0, payload: {} }); } catch (e) {}
  try { await apiCall('learn/stage', { worldId: 'unit01', questId: 'q1-grain', stageIndex: 0 }); } catch (e) {}
  await sync.push();
  calls.length === 0 ? ok('a guest sends no account call and no sync push over the network') : fail(`guest reached the network: ${calls.map(c => c.url).join(', ')}`);
  await apiCall('leaderboard');
  calls.length === 1 && calls[0].url === '/api/leaderboard' && calls[0].body.token === undefined
    ? ok('guest public reads go out without a token') : fail('guest public read carried a token or went astray');
  const comp1 = await apiCall('quest/complete', { questId: 'q1' });
  const comp2 = await apiCall('quest/complete', { questId: 'q1' });
  !comp1.alreadyCompleted && comp2.alreadyCompleted ? ok('guest quest completion is banked once') : fail('guest quest completion is not idempotent');

  session.clear();
  !session.isGuest && session.getNotebook().length === 0 && session.xp === 0 && localStorage.getItem('avalon_notebook') === null
    ? ok('guest sign-out clears the live per-player keys') : fail('guest sign-out left live state behind');
  session.setToken('real-account-token');
  session.loadPlayerState();
  session.getNotebook().length === 0 ? ok('a real account after a guest starts clean') : fail('guest state leaked into a real account');
  session.clear();
  session.startGuest();
  session.hasNotebookEntry('guest:entry') && session.xp === 25 && session.progress.some(p => p.quest_id === 'q1')
    ? ok('continuing as guest again restores the parked save') : fail(`guest save not restored (xp ${session.xp})`);
  session.clear();
  globalThis.fetch = realFetch;
}

/* ---- no XP in the sync path ---- */
{
  for (const f of ['src/sync.js', 'src/shared/statemerge.js']) {
    const src = fs.readFileSync(path.join(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    /addXp|gradeStage|completeQuest|recordProgress/.test(src) ? fail(`${f} touches the XP rails`) : ok(`${f} never touches the XP rails`);
  }
}

if (failures) { console.log(`\nSYNC FAILED (${failures})`); process.exit(1); }
console.log('\nSYNC OK');
process.exit(0);
