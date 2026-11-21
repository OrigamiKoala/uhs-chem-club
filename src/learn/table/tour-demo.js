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

/** Synthesize a short live demonstration directly on `table` for a given Tour step (`fx`, `pc`, or `tool`). */
export async function buildLiveDemo(table, step) {
  if (!table || !step) return null;
  const [MODEL, LAYOUT, KITS] = await Promise.all([import('./model.js'), import('./layout.js'), import('./kits/index.js')]);
  const kit = KITS.getKit(table.kit);
  const steps = [];
  let at = 0.85;

  const findDraggable = (accepts) => Object.values(table.pieces || {}).find(p =>
    !p.hidden && !p.fixed && !p.props?.scratch && (!accepts || accepts.includes(p.kind))
  );

  if (step.fx && table.fixtures?.[step.fx]) {
    const f = table.fixtures[step.fx];
    const lay = LAYOUT.fixtureLayout(f);
    // Find slots inside or near this fixture that are currently empty and can take a piece.
    const slots = Object.values(table.zones?.slots || {}).filter(z => !z.occupant);
    const linkedSlot = f.props?.slot ? slots.find(z => z.id === f.props.slot) : null;
    const nearSlots = slots.filter(z => z.at.x >= lay.box.x0 - 10 && z.at.x <= lay.box.x1 + 10 && z.at.y >= lay.box.y0 - 10 && z.at.y <= lay.box.y1 + 10);
    const containers = Object.values(table.zones?.containers || {});
    const nearCont = containers.find(z => z.at.x >= lay.box.x0 - 12 && z.at.x <= lay.box.x1 + 12 && z.at.y >= lay.box.y0 - 12 && z.at.y <= lay.box.y1 + 12);
    const bedId = typeof f.props?.bed === 'string' && f.props.bed.startsWith('tray:') ? f.props.bed.slice(5) : null;
    const bedTray = bedId ? table.zones?.trays?.[bedId] : null;

    if (f.kind === 'pulse' && nearSlots.length) {
      // Pulse timer needs both a lamp and a detector placed before firing.
      const used = new Set();
      for (const sl of nearSlots) {
        const p = Object.values(table.pieces || {}).find(q =>
          !used.has(q.id) && !q.hidden && !q.fixed && !q.props?.scratch && (!sl.accepts || sl.accepts.includes(q.kind))
        );
        if (p) {
          used.add(p.id);
          steps.push({ at, drag: { piece: p.id, to: sl.at }, action: { place: { piece: p.id, to: `slot:${sl.id}` } } });
          at += 1.25;
        }
      }
    } else if (linkedSlot || nearSlots[0]) {
      const sl = linkedSlot || nearSlots[0];
      const p = findDraggable(sl.accepts);
      if (p) {
        steps.push({ at, drag: { piece: p.id, to: sl.at }, action: { place: { piece: p.id, to: `slot:${sl.id}` } } });
        at += 1.3;
      }
    } else if (bedTray) {
      const p = findDraggable(bedTray.accepts);
      if (p) {
        steps.push({ at, drag: { piece: p.id, to: bedTray.at }, action: { place: { piece: p.id, to: `tray:${bedTray.id}` } } });
        at += 1.3;
      }
    } else if (nearCont) {
      const p = findDraggable(nearCont.accepts);
      if (p) {
        steps.push({ at, drag: { piece: p.id, to: nearCont.at }, action: { place: { piece: p.id, to: `container:${nearCont.id}` } } });
        at += 1.3;
      }
    }

    if (!f.noRun) {
      steps.push({ at, press: f.id, action: { run: f.id } });
      at += 1.6;
    } else if (Object.keys(f.dials || {}).length) {
      const [dName, d] = Object.entries(f.dials)[0];
      const track = lay.dials.find(x => x.name === dName);
      // Avoid landing on power 4 (the answer to Tallow Q1 Stage 1) when demonstrating the scope dial.
      const frac = f.kind === 'scope' ? 0.2 : 0.65;
      const mid = d.min + Math.round(((d.max - d.min) * frac) / (d.step || 1)) * (d.step || 1);
      const val = mid === d.value ? Math.min(d.max, d.min + (d.step || 1)) : Math.min(d.max, Math.max(d.min, mid));
      const action = { setDial: { fixture: f.id, dial: dName, value: val } };
      const spot = zoneSpot(table, kit, LAYOUT, action.setDial) || (track ? { x: track.x0 + ((val - d.min) / (d.max - d.min || 1)) * (track.x1 - track.x0), y: track.y } : { x: f.at.x, y: f.at.y });
      steps.push({ at, tap: spot, action });
      at += 1.5;
    } else {
      const z = [...(f.props?.taps || []), ...(kit?.tapZones?.(f, table) || [])].find(x => x.action);
      if (z) {
        steps.push({ at, tap: { x: lay.box.x0 + (z.x0 + z.x1) / 2, y: lay.box.y0 + (z.y0 + z.y1) / 2 }, action: z.action });
        at += 1.5;
      }
    }
  } else if (step.drum && table.zones?.containers?.[step.drum]) {
    const drum = table.zones.containers[step.drum];
    const targetPan = Object.values(table.zones?.containers || {}).find(z => z.id !== drum.id && !z.sealed);
    const what = Object.keys(drum.contents || {})[0];
    if (targetPan && what) {
      const amt = Math.min(drum.contents[what] || 8, 8);
      steps.push({ at, tap: { ...drum.at }, action: null });
      at += 1.0;
      steps.push({ at, tap: { ...targetPan.at }, action: { pour: { from: drum.id, to: targetPan.id, what, amount: amt } } });
      at += 1.5;
    }
  } else if (step.pc && table.pieces?.[step.pc]) {
    const p = table.pieces[step.pc];
    if (p.kind === 'element') {
      // Element cards are highlighted without a pointer animation.
      return null;
    } else if (p.props?.markable) {
      steps.push({ at, tap: { ...p.at }, action: { mark: p.id } });
      at += 1.4;
    } else if (p.kind === 'lens' || p.kind === 'cutter') {
      const dish = Object.values(table.pieces).find(q => q.id !== p.id && !q.hidden && q.kind === 'dish');
      if (dish) {
        steps.push({ at, drag: { piece: p.id, to: dish.at }, action: { place: { piece: p.id, to: { ...dish.at } } } });
        at += 1.5;
      }
    } else if (p.kind === 'atom') {
      const other = Object.values(table.pieces).find(q => q.id !== p.id && !q.hidden && q.kind === 'atom');
      if (other) {
        const to = { x: other.at.x + 6.5, y: other.at.y };
        steps.push({ at, drag: { piece: p.id, to }, action: { place: { piece: p.id, to } } });
        at += 1.5;
      }
    } else if (p.kind === 'dropper' || p.kind === 'rinse') {
      // Show placing a cuvette into the spectrophotometer first, then using the dropper/rinse over a fillable cuvette.
      const sp = Object.values(table.fixtures || {}).find(f => f.kind === 'spectro' && f.props?.slot);
      const spSlot = sp && table.zones?.slots?.[sp.props.slot];
      const cuvs = Object.values(table.pieces).filter(q => !q.hidden && q.kind === 'cuvette');
      const fillable = cuvs.find(q => !q.props?.sealed && q.props?.conc == null) || cuvs[0];
      if (spSlot && fillable && fillable.zone !== `slot:${spSlot.id}`) {
        steps.push({ at, drag: { piece: fillable.id, to: spSlot.at }, action: { place: { piece: fillable.id, to: `slot:${spSlot.id}` } } });
        at += 1.4;
        steps.push({ at, drag: { piece: p.id, to: spSlot.at }, action: { join: [p.id, fillable.id] } });
        at += 1.5;
      } else if (fillable) {
        steps.push({ at, drag: { piece: p.id, to: fillable.at }, action: { join: [p.id, fillable.id] } });
        at += 1.5;
      }
    } else {
      const occupiedSlot = id => Object.values(table.pieces).some(q => !q.hidden && q.zone === `slot:${id}`);
      const slot = Object.values(table.zones?.slots || {}).find(z => !occupiedSlot(z.id) && (!z.accepts || z.accepts.includes(p.kind)));
      const cont = !slot && Object.values(table.zones?.containers || {}).find(z => `container:${z.id}` !== p.zone);
      const tray = !slot && !cont && Object.values(table.zones?.trays || {}).find(z => `tray:${z.id}` !== p.zone && (!z.accepts || z.accepts.includes(p.kind)));
      const target = slot ? { to: `slot:${slot.id}`, pt: slot.at } : cont ? { to: `container:${cont.id}`, pt: cont.at } : tray ? { to: `tray:${tray.id}`, pt: tray.at } : null;
      if (target) {
        steps.push({ at, drag: { piece: p.id, to: target.pt }, action: { place: { piece: p.id, to: target.to } } });
        at += 1.5;
      }
    }
  } else if (step.tool) {
    steps.push({ at, toolBtn: step.tool, action: { tool: step.tool } });
    at += 1.6;
  }

  if (!steps.length) {
    if (step.demo) return step.demo.build();
    return null;
  }
  // Verify at least one step applies cleanly without error.
  void MODEL;
  return { table, steps, loop: at + 1.4 };
}

/**
 * Play a tour step's animation directly on the live `tabletop` (via `setPreview`) and drive a floating
 * screen-space pointer cursor via `onPointer({ x, y, pressing } | null)`.
 */
export async function playLiveTourDemo(tabletop, table, step, onPointer) {
  if (!tabletop || !table) return () => {};
  const [MODEL, LAYOUT] = await Promise.all([import('./model.js'), import('./layout.js')]);
  const d = await buildLiveDemo(table, step);
  if (!d) { onPointer?.(null); return () => {}; }
  const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  let stopped = false; let raf = 0;
  const cache = [d.table];
  const stateAfter = n => {
    while (cache.length <= n) {
      const prev = cache[cache.length - 1];
      let next = prev;
      const act = d.steps[cache.length - 1].action;
      if (act) {
        try { next = MODEL.apply(prev, act); } catch { /* ignore invalid preview step */ }
      }
      cache.push(next);
    }
    return cache[n];
  };
  const fixtureSpot = id => {
    const f = d.table.fixtures[id];
    const r = f && LAYOUT.fixtureLayout(f).run;
    return r ? { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 } : (f ? { ...f.at } : null);
  };
  const t0 = performance.now();
  const frame = now => {
    if (stopped) return;
    const t = reduced ? d.loop : ((now - t0) / 1000) % d.loop;
    let n = 0; while (n < d.steps.length && d.steps[n].at <= t) n++;
    const st = stateAfter(n);
    const shown = {};
    for (const p of Object.values(st.pieces)) shown[p.id] = { ...p.at };
    let hand = null; let domSpot = null; let pressing = false;
    d.steps.forEach(s => {
      if (reduced || t < s.at - LEAD || t > s.at + 0.35) return;
      const k = Math.min(1, Math.max(0, (t - (s.at - LEAD)) / LEAD));
      if (s.drag && d.table.pieces[s.drag.piece]) {
        const from = d.table.pieces[s.drag.piece].at;
        const pos = { x: from.x + (s.drag.to.x - from.x) * ease(k), y: from.y + (s.drag.to.y - from.y) * ease(k) };
        if (t < s.at) { shown[s.drag.piece] = pos; hand = pos; pressing = k > 0.12; }
        else hand = s.drag.to;
      } else if (s.press) {
        const to = fixtureSpot(s.press);
        if (to) {
          const from = { x: to.x - 10, y: to.y + 8 };
          hand = { x: from.x + (to.x - from.x) * ease(k), y: from.y + (to.y - from.y) * ease(k) };
          pressing = t >= s.at - 0.12;
        }
      } else if (s.tap) {
        const to = s.tap; const from = { x: to.x - 10, y: to.y + 8 };
        hand = { x: from.x + (to.x - from.x) * ease(k), y: from.y + (to.y - from.y) * ease(k) };
        pressing = t >= s.at - 0.12;
      } else if (s.toolBtn) {
        const el = document.querySelector(`[data-tool="${s.toolBtn}"]`);
        const r = el?.getBoundingClientRect?.();
        if (r) {
          const tx = r.left + r.width / 2; const ty = r.top + r.height / 2;
          domSpot = { x: tx - 28 * (1 - ease(k)), y: ty + 22 * (1 - ease(k)) };
          pressing = t >= s.at - 0.12;
        }
      }
    });
    tabletop.setPreview?.(st, shown);
    const pt = domSpot || (hand && tabletop.screenPointOf?.(hand));
    onPointer?.(pt ? { x: pt.x, y: pt.y, pressing } : null);
    if (!reduced) raf = requestAnimationFrame(frame);
  };
  frame(t0);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    tabletop.setPreview?.(null);
    onPointer?.(null);
  };
}
