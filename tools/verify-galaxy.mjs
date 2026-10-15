/**
 * verify-galaxy.mjs — the star map's chart is laid out, hit and DRAWN in Node.
 *
 * A chart that overlaps its own worlds, hides one off the edge, cannot be
 * tapped, or throws on the phone's canvas size is a blank screen in a
 * student's hands, so each of those is a failure here.
 *
 * Run with `npm run verify:galaxy`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeCtx } from './lib/ctx-stub.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const fail = m => { console.error(`  FAIL ${m}`); failures++; };
const ok = m => console.log(`  ok   ${m}`);

const G = await import('../src/ui/galaxy-map.js');
const { WORLDS } = await import('../src/learn/curriculum.js');
const { EPISODES } = await import('../src/story/saga.js');

const list = [{ id: 'erebus', act: 'act1' }, ...WORLDS.map(w => ({ id: w.id, act: EPISODES[w.id]?.act || 'act1' }))];
const systems = G.layoutSystems(list);
const lanes = G.layoutLanes(systems);

/* ---- layout ---- */
{
  systems.length === 15 ? ok('15 systems: Erebus and the fourteen Learn worlds') : fail(`expected 15 systems, got ${systems.length}`);
  lanes.length === systems.length - 1 ? ok('one jump lane between each pair on the road') : fail('lane count wrong');

  let min = Infinity;
  for (let i = 0; i < systems.length; i++) for (let j = i + 1; j < systems.length; j++) {
    min = Math.min(min, Math.hypot(systems[i].x - systems[j].x, systems[i].y - systems[j].y));
  }
  min >= 60 ? ok(`no two worlds closer than ${Math.round(min)} units`) : fail(`two worlds only ${Math.round(min)} units apart`);

  const out = systems.filter(s => s.x < 70 || s.x > G.GALAXY_W - 70 || s.y < 50 || s.y > G.GALAXY_H - 50);
  out.length ? fail(`worlds too near the edge: ${out.map(s => s.id)}`) : ok('every world sits inside the chart with room for its label');

  // Nothing sits on the reactor at the core.
  const nearCore = systems.filter(s => Math.hypot((s.x - G.CORE.x) / 1.42, (s.y - G.CORE.y) / 0.95) < 70);
  nearCore.length ? fail(`worlds inside the core: ${nearCore.map(s => s.id)}`) : ok('no world sits inside the reactor at the core');

  // The road runs rim to core: radius falls along it.
  const radii = systems.map(s => Math.hypot((s.x - G.CORE.x) / 1.42, (s.y - G.CORE.y) / 0.95));
  radii[0] > radii[radii.length - 1] + 100 && radii[0] > 250 ? ok('Erebus is on the rim and Cinder Halo is nearest the core') : fail('the road does not run rim to core');

  const a = JSON.stringify(G.layoutSystems(list));
  a === JSON.stringify(G.layoutSystems(list)) ? ok('layout is deterministic (the same chart on every machine)') : fail('layout is not deterministic');
}

/* ---- every world has a look ---- */
{
  const missing = list.filter(s => !G.WORLD_LOOK[s.id]).map(s => s.id);
  missing.length ? fail(`worlds with no planet look: ${missing}`) : ok('every system has its own planet palette');
  const kinds = new Set(list.map(s => G.lookFor(s.id).kind));
  kinds.size === list.length ? ok('no two worlds share a surface painter') : fail('two worlds share a surface kind');
}

/* ---- hit testing, at the phone view and the wide view ---- */
for (const [w, h] of [[340, 280], [960, 560]]) {
  const fit = G.fitScale(w, h);
  const views = [
    { k: fit, cx: G.GALAXY_W / 2, cy: G.GALAXY_H / 2 },
    G.clampView({ k: fit * 3, cx: systems[7].x, cy: systems[7].y }, w, h)
  ];
  let bad = 0;
  views.forEach((view, vi) => {
    for (const s of systems) {
      const p = G.worldToScreen(view, w, h, s.x, s.y);
      if (p.x < 0 || p.y < 0 || p.x > w || p.y > h) continue; // off screen at this zoom
      const hit = G.hitSystem(systems, view, w, h, p.x, p.y);
      if (!hit || hit.id !== s.id) bad++;
    }
    // round trip
    const s = systems[3];
    const p = G.worldToScreen(view, w, h, s.x, s.y);
    const back = G.screenToWorld(view, w, h, p.x, p.y);
    if (Math.hypot(back.x - s.x, back.y - s.y) > 1e-6) bad++;
  });
  bad ? fail(`${w}x${h}: ${bad} hit-test failure(s)`) : ok(`${w}x${h}: every visible world is tappable at its own centre, and screen <-> world round-trips`);

  const pr = G.planetPx(views[0], w, h);
  pr >= 5 ? ok(`${w}x${h}: a planet is ${pr.toFixed(1)} px at full view (never a speck)`) : fail('planet too small to tap');
}

/* ---- draw it ---- */
{
  const states = ['complete', 'open', 'locked', 'charted'];
  const nodes = systems.map((s, i) => {
    const w = WORLDS.find(x => x.id === s.id);
    return {
      ...s, code: w ? w.code : 'SEC 01', name: w ? w.world : 'Erebus', place: w ? w.place : 'Desert world',
      state: states[i % 4],
      quests: (w ? w.quests : [{ id: 'x' }]).map((q, n) => ({ done: n % 2 === 0, live: true }))
    };
  });
  for (const [w, h, label] of [[340, 280, 'phone'], [960, 560, 'wide']]) {
    const fit = G.fitScale(w, h);
    for (const [vlabel, view] of [
      ['whole map', { k: fit, cx: G.GALAXY_W / 2, cy: G.GALAXY_H / 2 }],
      ['zoomed in', G.clampView({ k: fit * 4.2, cx: systems[4].x, cy: systems[4].y }, w, h)],
      ['zoomed far', G.clampView({ k: fit * 9, cx: systems[14].x, cy: systems[14].y }, w, h)]
    ]) {
      const ctx = makeCtx(w, h);
      let threw = null;
      try {
        G.drawGalaxy(ctx, { nodes, lanes, view, w, h, time: 1234, animate: true, selectedId: nodes[4].id, hoverId: nodes[6].id, acts: [{ id: 'act1', label: 'Act I' }, { id: 'act4', label: 'Act IV' }] });
      } catch (e) { threw = e; }
      const st = ctx.stats;
      if (threw) fail(`${label} ${vlabel}: draw threw ${threw.stack?.split('\n')[1] || threw}`);
      else if (st.nan) fail(`${label} ${vlabel}: ${st.nan} NaN coordinate(s)`);
      else if (st.calls < (vlabel === 'whole map' ? 400 : 150)) fail(`${label} ${vlabel}: only ${st.calls} draw calls`);
      else ok(`${label} ${vlabel}: drawn (${st.calls} calls, no NaN)`);
      if (label === 'wide' && vlabel === 'whole map') {
        const names = nodes.filter(n => st.text.includes(n.name.toUpperCase()));
        names.length === nodes.length ? ok('wide whole map prints every world\'s name') : fail(`names missing from the wide chart: ${nodes.filter(n => !st.text.includes(n.name.toUpperCase())).map(n => n.name)}`);
      }
    }
  }
}

/* ---- the screen wires it, and it cannot pay XP ---- */
{
  const star = fs.readFileSync(path.join(root, 'src/screens/starmap.js'), 'utf8');
  /mountGalaxyMap/.test(star) && /galaxyPanel\(\)/.test(star) ? ok('the star map screen mounts the chart') : fail('starmap.js does not mount the chart');
  /tabRow\("learn"\)/.test(star) ? ok('the Story tab (the chart) is the one that opens') : fail('the chart is not the default tab');
  for (const f of ['src/ui/galaxy-map.js']) {
    const src = fs.readFileSync(path.join(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    /addXp|gradeStage|completeQuest|recordProgress|api\.|session\./.test(src) ? fail(`${f} reads or writes game state`) : ok(`${f} reads no game state of its own`);
    /shadowBlur|shadowColor/.test(src) ? fail(`${f} draws a glow`) : ok(`${f} draws no glow`);
  }
}

if (failures) { console.log(`\nGALAXY FAILED (${failures})`); process.exit(1); }
console.log('\nGALAXY OK');
process.exit(0);
