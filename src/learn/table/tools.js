/**
 * tools.js — The tools a table stage can list in `table.tools`.
 *
 * A tool is something the player picks up and lays on the work: a straightedge
 * across the recorder's points; later a ruler, a protractor, a balance, a
 * stopwatch (kits supply those through `kit.tools`). A tool def is
 *
 *   label                 what its key says
 *   press(state) -> action|null   the action pressing it dispatches
 *   active?(state)        true while it is laid (the key shows pressed)
 *   enabled?(state)       false while there is nothing to lay it on
 *   probe(state) -> action[]      a short script that puts the table where the
 *                                 tool has something to do and then presses it;
 *                                 `verify:table` holds every tool a stage lists
 *                                 to "changes the state or the picture"
 *
 * Pure: a def returns actions, it never touches the table.
 */

export const BUILTIN_TOOLS = {
  straightedge: {
    label: 'Straightedge',
    press(state) {
      if (state.recorder.tool) return { lay: null };
      const n = state.recorder.rows.length;
      return n >= 2 ? { lay: { kind: 'straightedge', through: [0, n - 1] } } : null;
    },
    active: state => Boolean(state.recorder.tool),
    enabled: state => state.recorder.rows.length >= 2 || Boolean(state.recorder.tool),
    probe(state) {
      // Two readings at the two ends of the first fixture's first dial, then lay it.
      const out = [];
      const f = Object.values(state.fixtures).find(x => Object.keys(x.dials).length);
      if (state.recorder.rows.length < 2 && f) {
        const [name, d] = Object.entries(f.dials)[0];
        out.push({ setDial: { fixture: f.id, dial: name, value: d.min } }, { run: f.id });
        out.push({ setDial: { fixture: f.id, dial: name, value: d.max } }, { run: f.id });
      }
      const rows = state.recorder.rows.length + out.filter(a => a.run).length;
      out.push({ lay: { kind: 'straightedge', through: [0, rows - 1] } });
      return out;
    }
  }
};

/** The def for tool `id` on a table of kit `kit`, or null. A kit's own tool wins. */
export function toolDef(kit, id) {
  return kit?.tools?.[id] || BUILTIN_TOOLS[id] || null;
}
