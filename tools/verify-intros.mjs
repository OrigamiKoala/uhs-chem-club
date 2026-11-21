#!/usr/bin/env node
/**
 * verify-intros.mjs — the opening scenes and the problems standing in each world (`src/npc/intros/`,
 * `src/three/mystery/`).
 *
 *   - every scene belongs to a real, non-boss, non-Toolkit quest of its world, and asks that quest's question;
 *   - its steps are kinds the director plays, its actors and voices are that world's crew, its lines are short
 *     (at most 25 words and 2 sentences, no "!" or emoji);
 *   - every prop and effect is a kind the kit builds, every effect has the part it drives, and each one runs on
 *     and off without throwing;
 *   - every spot (`intros/spots.js`) stands clear in the world as built now: the prop by its radius off every
 *     collider and bench bay, off the crew's posts and the other props; the view, the places to stand and the
 *     walk-up start clear and reachable; the walk from the bench to the view at most 45 m;
 *   - no two worlds open their benches the same way (the set of scene shapes differs), and every world says
 *     how its own way differs (`STYLE`).
 */
const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });
const { CREW_WORLDS, walkFor } = await import('../src/npc/crews.js');
await import(`../src/three/${CREW_WORLDS[0].module}.js`);
const { INTRO_WORLDS } = await import('../src/npc/intros.js');
const { SPOTS } = await import('../src/npc/intros/spots.js');
const { QUEST_STORY } = await import('../src/story/quest-story.js');
const { makeKit, buildProp, PROP_KINDS } = await import('../src/three/mystery/props.js');
const { makeEffect, effectFits, EFFECT_KINDS } = await import('../src/three/mystery/effects.js');
const { STEP_KINDS } = await import('../src/three/mystery/director.js');
const { bayBoxes } = await import('../src/three/bench-bay.js');
const { WalkGrid, bayRects } = await import('../src/npc/crew-sim.js');

let errors = 0;
const fail = m => { errors++; console.log(`  FAIL ${m}`); };
const ok = m => console.log(`  ok   ${m}`);
const words = s => String(s).trim().split(/\s+/).length;
const sentences = s => (String(s).match(/[.!?]+(?=\s|$)/g) || []).length;
const kit = makeKit();

console.log('Opening scenes and world problems\n');

// 1. Data.
const shapes = new Map();
let scenes = 0;
for (const iw of INTRO_WORLDS) {
  const cfg = CREW_WORLDS.find(w => w.key === iw.key);
  if (!cfg) { fail(`${iw.key}: not a crew world`); continue; }
  if (!iw.style || words(iw.style) < 6) fail(`${iw.key}: STYLE must say how this world opens its benches`);
  const crew = new Set(cfg.crew.map(c => c.id));
  const sig = new Set();
  for (const [questId, intro] of Object.entries(iw.intros)) {
    const key = `${iw.worldId}/${questId}`;
    const st = QUEST_STORY[key];
    if (!st) { fail(`${key}: no such quest`); continue; }
    if (questId.startsWith('boss-')) fail(`${key}: a boss opens on its fight, not a scene`);
    if (st.role === 'Toolkit' || !st.mystery) fail(`${key}: has no question to ask`);
    if (!intro.steps?.length) { fail(`${key}: no steps`); continue; }
    if (!intro.steps.some(s => s.ask)) fail(`${key}: never asks its question`);
    for (const s of intro.steps) {
      if (!STEP_KINDS.includes(s.do)) fail(`${key}: unknown step "${s.do}"`);
      for (const who of [s.who, s.lookAt, s.at].filter(v => typeof v === 'string')) {
        if (who.startsWith('npc:') || who.startsWith('voice:')) {
          const id = who.split(':')[1];
          if (!crew.has(id)) fail(`${key}: "${who}" is not one of ${iw.key}'s crew`);
        }
      }
      for (const line of s.lines || []) {
        if (words(line) > 25 || sentences(line) > 2) fail(`${key}: line over 25 words or 2 sentences: "${line}"`);
        if (/!/.test(line) || /\p{Extended_Pictographic}/u.test(line)) fail(`${key}: line carries "!" or an emoji: "${line}"`);
      }
    }
    const usesNpc = intro.steps.filter(s => String(s.who || '').startsWith('npc:'));
    if (usesNpc.some(s => s.do === 'say') && !usesNpc.some(s => s.do === 'place')) fail(`${key}: a crew member speaks in the scene without being placed in it`);
    // The question split into lines must fit the card too.
    for (const part of st.mystery.match(/[^.?]+[.?]+/g) || []) if (words(part) > 25) fail(`${key}: question sentence over 25 words`);
    if (!PROP_KINDS.includes(intro.prop?.kind)) { fail(`${key}: unknown prop "${intro.prop?.kind}"`); continue; }
    if (intro.trail && !['prints', 'salt', 'tar'].includes(intro.trail)) fail(`${key}: unknown trail "${intro.trail}"`);
    sig.add(intro.steps.map(s => s.do).join('>'));
    scenes++;
  }
  shapes.set(iw.key, [...sig].sort().join('|'));
  // Props and effects, built and run both ways.
  const defs = [...Object.entries(iw.intros).map(([q, i]) => [q, i.prop]), ...(iw.symptom?.props || []).map((p, i) => [`symptom ${i}`, p])];
  for (const [label, def] of defs) {
    if (!def || !PROP_KINDS.includes(def.kind)) { if (def) fail(`${iw.key} ${label}: unknown prop "${def.kind}"`); continue; }
    let prop;
    try { prop = buildProp(kit, def.kind, def.opts || {}); } catch (err) { fail(`${iw.key} ${label}: prop throws: ${err.message}`); continue; }
    for (const e of def.effects || []) {
      if (!EFFECT_KINDS.includes(e.kind)) { fail(`${iw.key} ${label}: unknown effect "${e.kind}"`); continue; }
      if (!effectFits(prop, e)) fail(`${iw.key} ${label}: effect "${e.kind}" has no part "${e.part || e.at}" on a ${def.kind}`);
      try {
        const fx = makeEffect(kit, prop, e);
        for (let k = 0; k < 40; k++) fx.update(0.05, k * 0.05, k < 25);
      } catch (err) { fail(`${iw.key} ${label}: effect "${e.kind}" throws: ${err.message}`); }
    }
  }
  if (iw.symptom?.lamps && !['sputter', 'dim'].includes(iw.symptom.lamps)) fail(`${iw.key}: unknown lamp symptom "${iw.symptom.lamps}"`);
  if (!iw.symptom || (!iw.symptom.lamps && !(iw.symptom.props || []).length)) fail(`${iw.key}: the world's own trouble is not shown`);
}
ok(`${scenes} scenes across ${INTRO_WORLDS.length} worlds: real quests, known steps, the world's own crew, short lines, every one asks its question`);

const seen = new Map();
for (const [key, sig] of shapes) {
  if (seen.has(sig)) fail(`${key} opens its benches the same way as ${seen.get(sig)}`);
  else seen.set(sig, key);
}
const styles = new Set(INTRO_WORLDS.map(w => w.style));
if (styles.size !== INTRO_WORLDS.length) fail('two worlds share a STYLE line');
ok('no two worlds open their benches the same way');

// 2. Spots, against each world as it is built now.
let spotsChecked = 0;
for (const iw of INTRO_WORLDS) {
  const cfg = CREW_WORLDS.find(w => w.key === iw.key);
  const mod = await import(`../src/three/${cfg.module}.js`);
  const world = new mod[cfg.className](null);
  const grid = new WalkGrid(world, bayRects(world, bayBoxes), walkFor(cfg.key, world));
  const S = SPOTS[iw.key];
  if (!S) { fail(`${iw.key}: no spots (run tools/npc/pick-spots.mjs)`); continue; }
  const posts = Object.values(cfg.posts).map(p => p.pos);
  const placed = [];
  const check = (label, spot, def) => {
    const R = buildProp(kit, def.kind, def.opts || {}).radius;
    const [x, z] = spot.pos;
    if (grid.blockedAt(x, z, R + 0.15)) fail(`${iw.key} ${label}: the prop at (${x}, ${z}) stands in a wall, a bay or off the ground`);
    for (const p of posts) if (Math.hypot(p[0] - x, p[1] - z) < R + 0.6) fail(`${iw.key} ${label}: the prop stands on a crew post`);
    for (const o of placed) if (Math.hypot(o.x - x, o.z - z) < o.R + R + 0.5) fail(`${iw.key} ${label}: the prop overlaps ${o.label}`);
    placed.push({ x, z, R, label });
    spotsChecked++;
    return R;
  };
  for (const [questId, intro] of Object.entries(iw.intros)) {
    const spot = S.quests?.[questId];
    if (!spot) { fail(`${iw.key}/${questId}: no spot`); continue; }
    check(questId, spot, intro.prop);
    const site = world.data.sites.find(s => s.questId === questId);
    const a = site.approachPos || site.pos;
    const path = grid.path([a[0], a[2]], spot.view);
    if (!path) fail(`${iw.key}/${questId}: no walk from the bench to the view`);
    else {
      let len = 0;
      for (let i = 1; i < path.length; i++) len += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
      if (len > 45) fail(`${iw.key}/${questId}: the walk to the view is ${len.toFixed(1)} m (at most 45)`);
    }
    const uses = new Set(intro.steps.flatMap(s => [s.at, s.to, s.face, s.lookAt]).filter(Boolean));
    if (intro.steps.some(s => s.do === 'vanish')) uses.add('exit');
    for (const name of ['view', 'stand', 'stand2', 'meet', 'exit']) {
      if (name !== 'view' && !uses.has(name)) continue;
      const p = spot[name];
      if (!p) { fail(`${iw.key}/${questId}: no "${name}" point`); continue; }
      if (grid.blockedAt(p[0], p[1], 0.25)) fail(`${iw.key}/${questId}: the "${name}" point is not clear`);
      if (name !== 'view' && !grid.path(p, spot.view)) fail(`${iw.key}/${questId}: the "${name}" point cannot reach the view`);
    }
    if (intro.trail && !(spot.trail?.length >= 3)) fail(`${iw.key}/${questId}: a trail scene with no trail`);
    // Two people placed by the problem never stand on one spot, and nobody walks up from inside the prop.
    if (uses.has('stand2') && Math.hypot(spot.stand[0] - spot.stand2[0], spot.stand[1] - spot.stand2[1]) < 1.0) fail(`${iw.key}/${questId}: "stand" and "stand2" are the same place`);
    if (uses.has('meet') && Math.hypot(spot.meet[0] - spot.pos[0], spot.meet[1] - spot.pos[1]) < buildProp(kit, intro.prop.kind, intro.prop.opts || {}).radius + 0.5) fail(`${iw.key}/${questId}: "meet" is inside the prop`);
    if (Math.hypot(spot.view[0] - spot.pos[0], spot.view[1] - spot.pos[1]) > 12) fail(`${iw.key}/${questId}: the view is ${Math.hypot(spot.view[0] - spot.pos[0], spot.view[1] - spot.pos[1]).toFixed(1)} m from the problem (at most 12)`);
  }
  (iw.symptom?.props || []).forEach((def, i) => {
    const spot = S.world?.[i];
    if (!spot) { fail(`${iw.key} symptom ${i}: no spot`); return; }
    check(`symptom ${i}`, spot, def);
  });
}
ok(`${spotsChecked} props stand clear of walls, bays, posts and each other; every scene's walk is reachable and short`);

// 3. Every scene played start to finish, headless: the real world, its crew on their walk grid, the problem props
// standing (`MysterySite`), a stand-in camera, and each line card read through as soon as it opens.
{
  const THREE = await import('three');
  // The shim's elements answer `querySelector` with nothing; the line card and the bars need something to write to.
  const el = () => {
    const e = document.createElement('div');
    const kids = new Map();
    e.querySelector = sel => { if (!kids.has(sel)) kids.set(sel, el()); return kids.get(sel); };
    e.append = (...c) => c.forEach(x => e.appendChild(x));
    return e;
  };
  const make = document.createElement;
  document.createElement = tag => (String(tag).toLowerCase() === 'canvas' ? make(tag) : Object.assign(make(tag), {
    querySelector: function (sel) { this._q = this._q || new Map(); if (!this._q.has(sel)) this._q.set(sel, el()); return this._q.get(sel); },
    append: function (...c) { c.forEach(x => this.appendChild(x)); }
  }));
  document.head = document.head || el();
  document.body.append = (...c) => c.forEach(x => document.body.appendChild(x));
  globalThis.requestAnimationFrame = globalThis.requestAnimationFrame || (() => 0);
  const { MysterySite } = await import('../src/three/mystery/site.js');
  const { Director } = await import('../src/three/mystery/director.js');
  const { CrewSim } = await import('../src/npc/crew-sim.js');
  const { simPostsOf } = await import('../src/npc/crews.js');
  const { isLineCardOpen, advanceLineCard } = await import('../src/ui/npc-card.js');
  let played = 0, longest = 0;
  for (const iw of INTRO_WORLDS) {
    const cfg = CREW_WORLDS.find(w => w.key === iw.key);
    const mod = await import(`../src/three/${cfg.module}.js`);
    const world = new mod[cfg.className](null);
    world.mystery = new MysterySite(world, iw.key);
    for (const c of world.mystery.colliders) world.colliders.push(c);
    const grid = new WalkGrid(world, bayRects(world, bayBoxes), walkFor(cfg.key, world));
    world.crew = { grid, sim: new CrewSim(grid, cfg.crew, simPostsOf(cfg.posts)), bodies: new Map(cfg.crew.map(c => [c.id, { ready: true }])) };
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 500);
    const stage = { camera, fpsControls: null };
    const director = new Director(stage);
    for (const questId of Object.keys(iw.intros)) {
      const site = world.data.sites.find(s => s.questId === questId);
      const a = site.approachPos || site.pos;
      camera.position.set(a[0], world.getTerrainHeight(a[0], a[2]) + 1.6, a[2]);
      camera.lookAt(site.pos[0], camera.position.y - 0.4, site.pos[2]);
      if (!director.canPlay(world, iw.worldId, questId)) { fail(`${iw.key}/${questId}: the scene cannot play`); continue; }
      let done = false, frames = 0, nan = false;
      director.play(world, site, iw.worldId, questId).then(() => { done = true; });
      while (!done && !director.ending && frames < 30 * 240) {
        director.update(1 / 30);
        world.mystery.update(1 / 30);
        if (isLineCardOpen() && frames % 20 === 0) advanceLineCard();
        if (![camera.position.x, camera.position.y, camera.position.z].every(Number.isFinite)) nan = true;
        frames++;
        await new Promise(r => setImmediate(r));
      }
      // The fade at the end waits on a real timer.
      for (let k = 0; k < 200 && !done; k++) await new Promise(r => setTimeout(r, 10));
      if (frames >= 30 * 240) { fail(`${iw.key}/${questId}: the scene never reached its end`); director.skip(); }
      if (!done) { fail(`${iw.key}/${questId}: the scene never ended`); director.skip(); continue; }
      if (nan) fail(`${iw.key}/${questId}: the view went to NaN`);
      if (Math.hypot(camera.position.x - a[0], camera.position.z - a[2]) > 0.5) fail(`${iw.key}/${questId}: the player was not put back at the bench`);
      if (world.crew.sim.members.some(m => m.scripted)) fail(`${iw.key}/${questId}: a crew member was left in the scene`);
      if (world.mystery.held) fail(`${iw.key}/${questId}: the problem was left held`);
      if (frames > 30 * 45) fail(`${iw.key}/${questId}: the scene runs ${Math.round(frames / 30)} s before its lines are read (at most 45): ${(director.trace || []).join(', ')}`);
      played++;
      longest = Math.max(longest, frames / 30);
      if (process.argv.includes('--times')) console.log(`       ${iw.key}/${questId}: ${(frames / 30).toFixed(1)} s with lines read at once`);
    }
  }
  ok(`${played} scenes played through headless (longest ${longest.toFixed(0)} s of walking and looking): each ends with the player back at the bench and the crew back on schedule`);
}

if (errors) { console.log(`\nINTROS FAILED (${errors} errors)`); process.exit(1); }
console.log('\nIntros verified.');
