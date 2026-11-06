/**
 * kits/cell-attach.js — gives every stage of a Brinewire quest its mechanism view: the model is added under the stage's table, watching the
 * fixtures that have a builder (`cell-scenes.js`). A predict stage has no instrument, so it gets a fixed lead-in (`demos[index]`, a name from
 * `demoSpec`) that runs with no controls. Called once, at the end of each quest module.
 */
import { withScene, withSceneInside } from './cell-scene.js';
import { hasBuilder, demoSpec } from './cell-scenes.js';

const ORDER = k => (k === 'cellprobe' ? 0 : 1);

export function attachScenes(stages, { demos = {}, skip = [], placement = null, compact = [], right = [], inside = [], foe = false, own = {} } = {}) {
  stages.forEach((st, i) => {
    if (!st.table || skip.includes(i) || st.table.fixtures?.some(f => f.kind === 'cellscene')) return;
    const fx = st.table.fixtures || [];
    if (st.predict) {
      const demo = demoSpec(demos[i]);
      if (demo) { st.table = withScene(st.table, [], { demo, title: 'Lead-in', placement }); st.leadIn = true; }
      return;
    }
    const insideNow = inside.includes(i);
    const ledgers = fx.filter(f => f.kind === 'cellledger').map(f => f.id);
    const watch = ledgers.length ? ledgers.slice(0, 2) : fx.filter(f => hasBuilder(f.kind)).sort((a, b) => ORDER(a.kind) - ORDER(b.kind)).map(f => f.id);
    if (insideNow) {
      const t = withSceneInside(st.table, watch.length ? watch : [], { demo: watch.length ? null : demoSpec(demos[i]), foe, ...(own[i] || {}) });
      if (t) st.table = t; else console.warn(`no room inside the table of stage ${i + 1}`);
      return;
    }
    if (watch.length || own[i]) st.table = withScene(st.table, watch, { placement: right.includes(i) ? 'right' : compact.includes(i) ? 'below' : placement, compact: compact.includes(i), ...(own[i] || {}) });
  });
}
