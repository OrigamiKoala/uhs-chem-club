/**
 * recorder.js — The paper strip: every reading the player takes, kept.
 *
 * Today `setReadout` replaces the last reading, so a trend has to be held in
 * the head. The recorder keeps one row per run, `{x, y, label}`, and never
 * invents one: a row exists because the player ran something, and its numbers
 * come from the kit's own planner (`kit.run`). Plots are drawn from the rows by
 * `trendplot.js`; `table2d.js` draws the strip itself.
 *
 * A straightedge is a tool laid across the rows, which is how "extrapolate to
 * zero pressure" and a calibration line become things done by hand. It is data
 * here (two end points, or two rows by index) so a stage can grade the line the
 * player laid; the line it reports is plain two-point arithmetic.
 *
 * Pure. Every function returns a new recorder.
 */

/** Where the strip sits on the table when a stage does not say: the top-right corner. */
export const RECORDER_BOX = { at: { x: 84, y: 10 }, size: { w: 30, h: 18 } };

export const emptyRecorder = (box = null) => ({
  rows: [],
  tool: null,
  box: { at: { ...(box?.at || RECORDER_BOX.at) }, size: { ...(box?.size || RECORDER_BOX.size) } }
});

const finite = v => typeof v === 'number' && Number.isFinite(v);

/** Append one reading. A row that is not a real measurement is refused. */
export function append(rec, row) {
  if (!row || !finite(row.x) || !finite(row.y)) return rec;
  return {
    ...rec,
    rows: [...rec.rows, { x: row.x, y: row.y, label: String(row.label ?? '') }]
  };
}

/**
 * Lay (or lift) the straightedge. `tool` is `{kind:'straightedge', through:[i,j]}`
 * for two rows, `{kind:'straightedge', a:{x,y}, b:{x,y}}` for a free line, or
 * null to lift it.
 */
export function lay(rec, tool) {
  if (!tool) return { ...rec, tool: null };
  if (tool.kind !== 'straightedge') return rec;
  if (Array.isArray(tool.through)) {
    const [i, j] = tool.through;
    if (!rec.rows[i] || !rec.rows[j] || i === j) return rec;
    return { ...rec, tool: { kind: 'straightedge', through: [i, j] } };
  }
  if (tool.a && tool.b && finite(tool.a.x) && finite(tool.a.y) && finite(tool.b.x) && finite(tool.b.y)) {
    return { ...rec, tool: { kind: 'straightedge', a: { ...tool.a }, b: { ...tool.b } } };
  }
  return rec;
}

/** The two end points of the laid straightedge, or null. */
export function endsOf(rec) {
  const t = rec.tool;
  if (!t || t.kind !== 'straightedge') return null;
  if (t.through) {
    const a = rec.rows[t.through[0]];
    const b = rec.rows[t.through[1]];
    return a && b ? { a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } } : null;
  }
  return { a: t.a, b: t.b };
}

/** The line through the laid straightedge, `y = slope x + intercept`, or null. */
export function lineOf(rec) {
  const e = endsOf(rec);
  if (!e || e.a.x === e.b.x) return null;
  const slope = (e.b.y - e.a.y) / (e.b.x - e.a.x);
  return { slope, intercept: e.a.y - slope * e.a.x };
}

/** Where the line reads `y` at `x`. */
export const readY = (line, x) => (line ? line.slope * x + line.intercept : null);

/** The `x` at which the line reads `y`; null for a flat line. */
export const readX = (line, y) => (line && line.slope !== 0 ? (y - line.intercept) / line.slope : null);
