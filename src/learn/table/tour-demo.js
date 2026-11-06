/**
 * tour-demo.js — the Tour shows a tool being used instead of describing it.
 *
 * A demo is a tiny real table (`createTable`) and a script of the actions a student would take, played in a loop on a canvas inside the Tour
 * step: a cursor drags a piece to its place, presses a key, taps a vessel, and the table answers exactly as the bench does, because it is
 * drawn by `drawTable` with the kit's own painters and moved by the model's own reducer. Nothing here is a picture of the tool.
 *
 *   addTourDemo('<kit>:<step key>', () => ({ table, steps, loop }))   ('*' for a step every kit has)
 *   steps: [{ at, action, drag?: {piece, to}, press?: fixtureId, tap?: {x, y} }]   `at` is seconds into the loop; `action` is a model action
 *          (`{ run: id }`, `{ place: {piece, to} }`, `{ setDial: {...} }`, `{ flip: id }`); `drag` and `press` and `tap` draw the hand for
 *          the second before `at`.
 * With reduced motion the step shows the table after its last action, still.
 */

const REG = new Map();
export const addTourDemo = (key, build) => { REG.set(key, build); };
export const demoFor = (kit, key) => {
  const build = REG.get(`${kit}:${key}`) || REG.get(`*:${key}`);
  return build ? { build } : undefined;
};
export const hasTourDemo = (kit, key) => Boolean(demoFor(kit, key));

const LEAD = 0.9;
const ease = k => k * k * (3 - 2 * k);

/** Play `demo` on `canvas` until the returned stop function is called. */
export async function playTourDemo(canvas, demo) {
  const [T2D, MODEL, LAYOUT] = await Promise.all([import('../engine/table2d.js'), import('./model.js'), import('./layout.js')]);
  const d = await demo.build();
  const ctx = canvas.getContext('2d');
  const w = canvas.width; const h = canvas.height;
  const { sc, ox, oy } = T2D.fit(w, h, d.table.bounds);
  const U = p => ({ x: ox + p.x * sc, y: oy + p.y * sc });
  const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  let stopped = false; let raf = 0;
  const cache = [d.table];
  const stateAfter = n => {
    while (cache.length <= n) cache.push(MODEL.apply(cache[cache.length - 1], d.steps[cache.length - 1].action));
    return cache[n];
  };
  const fixtureSpot = id => {
    const f = d.table.fixtures[id];
    const r = f && LAYOUT.fixtureLayout(f).run;
    return r ? { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 } : { ...f.at };
  };
  const frame = now => {
    if (stopped) return;
    const clockAll = (now - t0) / 1000;
    const t = reduced ? d.loop : clockAll % d.loop;
    let n = 0; while (n < d.steps.length && d.steps[n].at <= t) n++;
    const st = stateAfter(n);
    const shown = {};
    for (const p of Object.values(st.pieces)) shown[p.id] = { ...p.at };
    let hand = null; let pressing = false;
    d.steps.forEach((s, i) => {
      if (reduced || t < s.at - LEAD || t > s.at + 0.3) return;
      const k = Math.min(1, Math.max(0, (t - (s.at - LEAD)) / LEAD));
      if (s.drag) {
        const from = d.table.pieces[s.drag.piece].at;
        const pos = { x: from.x + (s.drag.to.x - from.x) * ease(k), y: from.y + (s.drag.to.y - from.y) * ease(k) };
        if (t < s.at) { shown[s.drag.piece] = pos; hand = pos; } else hand = s.drag.to;
      } else if (s.press) {
        const to = fixtureSpot(s.press); const from = { x: to.x - 14, y: to.y + 10 };
        hand = { x: from.x + (to.x - from.x) * ease(k), y: from.y + (to.y - from.y) * ease(k) };
        pressing = t >= s.at - 0.1;
      } else if (s.tap) {
        const to = s.tap; const from = { x: to.x - 12, y: to.y + 9 };
        hand = { x: from.x + (to.x - from.x) * ease(k), y: from.y + (to.y - from.y) * ease(k) };
        pressing = t >= s.at - 0.1;
      }
      void i;
    });
    T2D.drawTable(ctx, w, h, st, { shown, clock: reduced ? 0 : clockAll, scope: 'tour:' });
    if (hand) {
      const q = U(hand);
      ctx.fillStyle = pressing ? '#e59b24' : '#dcd6cc';
      ctx.strokeStyle = '#100f0c';
      ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x + 9, q.y + 14); ctx.lineTo(q.x + 3.5, q.y + 12); ctx.lineTo(q.x, q.y + 18); ctx.closePath();
      ctx.fill(); ctx.stroke();
      if (pressing) { ctx.strokeStyle = '#e59b24'; ctx.beginPath(); ctx.arc(q.x, q.y, 8, 0, Math.PI * 2); ctx.stroke(); }
    }
    if (!reduced) raf = requestAnimationFrame(frame);
  };
  const t0 = performance.now();
  frame(t0);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}

/**
 * A demo made from a real stage: its table, and its scripted solution played as a student would play it (pieces dragged to where they go,
 * keys pressed, an answer tapped). `max` keeps the first few actions and the last, so a long run is shown by its start.
 */
export async function stageDemo(load, index, { max = 4, gap = 1.6 } = {}) {
  const [MODEL, LAYOUT, mod, KITS] = await Promise.all([import('./model.js'), import('./layout.js'), load(), import('./kits/index.js')]);
  const stage = mod.STAGES[index];
  const table = MODEL.createTable(stage.table, stage.title);
  const kit = KITS.getKit(table.kit);
  let actions = (mod.SOLUTIONS?.[index] || []).slice();
  if (actions.length > max) actions = [...actions.slice(0, max - 1), actions[actions.length - 1]];
  const where = to => {
    const [kind, id] = String(to).split(':');
    if (kind === 'slot') return table.zones.slots?.[id]?.at || null;
    if (kind === 'tray') return table.zones.trays?.[id]?.at || null;
    return null;
  };
  const steps = [];
  let at = 1.0;
  for (const action of actions) {
    const s = { at, action };
    if (action.place?.piece && table.pieces[action.place.piece]) {
      const to = where(action.place.to);
      if (to) s.drag = { piece: action.place.piece, to };
    } else if (action.run) {
      s.press = typeof action.run === 'string' ? action.run : action.run.fixture;
    } else if (action.setDial) {
      const a = action.setDial;
      const pick = Object.values(table.fixtures).find(f => f.props?.pick && f.props.pick.fixture === a.fixture && (f.props.pick.cols ? f.props.pick.cols.some(c => c.value === a.value) : f.props.pick.value === a.value));
      if (pick) {
        const box = LAYOUT.fixtureLayout(pick).box;
        const col = pick.props.pick.cols?.find(c => c.value === a.value);
        s.tap = { x: col ? box.x0 + (col.x0 + col.x1) / 2 : (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2 };
      } else if (zoneSpot(table, kit, LAYOUT, a)) {
        s.tap = zoneSpot(table, kit, LAYOUT, a);
      } else {
        const f = table.fixtures[a.fixture];
        const t = f && LAYOUT.fixtureLayout(f).dials.find(x => x.name === a.dial);
        const d = f?.dials?.[a.dial];
        if (t && d) s.tap = { x: t.x0 + ((a.value - d.min) / (d.max - d.min || 1)) * (t.x1 - t.x0), y: t.y };
      }
    }
    steps.push(s);
    at += gap;
  }
  return { table, steps, loop: at + 1.8 };
}

/** Where a hand touches to set `a.dial` of `a.fixture` by a tap zone (a supply, a burner, a band of the graph, the piston), or null. */
function zoneSpot(table, kit, LAYOUT, a) {
  for (const f of Object.values(table.fixtures)) {
    const box = LAYOUT.fixtureLayout(f).box;
    for (const z of [...(f.props?.taps || []), ...(kit?.tapZones?.(f, table) || [])]) {
      if ((z.fixture || f.id) !== a.fixture || z.dial !== a.dial) continue;
      if (z.value != null && z.value !== a.value) continue;
      if (z.value == null && !z.drag && !(z.step > 0)) continue;
      return { x: box.x0 + (z.x0 + z.x1) / 2, y: box.y0 + (z.y0 + z.y1) / 2 };
    }
    // A resting particle in a mechanism view (`kit.hotspots`) that sets this dial: the hand touches it.
    const mine = (kit?.hotspots?.(f, table) || []).filter(h => h.action.setDial?.fixture === a.fixture && h.action.setDial.dial === a.dial);
    const h = mine.find(q => q.action.setDial.value === a.value) || mine[0];
    if (h) return { x: h.x, y: h.y };
  }
  return null;
}
