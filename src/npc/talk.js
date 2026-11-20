/**
 * talk.js — what a crew member says when the player talks to them. Pure: no THREE, no DOM, no session.
 *
 * `talkFor(def, ctx)` picks one line set. Sets unlocked by progress come first (a clue the player holds,
 * then a bench they cleared, latest declared first), then the member's everyday sets; `ctx.turn` (how many
 * times this member has been talked to this visit) walks through the pool, so talking again moves on.
 *
 * A member with a `task` speaks for it while it is open:
 *   no state   → the ask; the state becomes 'asked'
 *   'asked'    → the reminder
 *   'carrying' → the thanks; the state becomes 'done' and the task's note is filed
 *   'done'     → everyday lines again
 * The caller applies `next` (the task's new state) and files the note; this module only decides.
 */

export const TASK_FLAG = id => `npc_task_${id}`;

/**
 * @param {object} def   a crew declaration
 * @param {{ cleared?: Set<string>, clues?: Set<string>, turn?: number, tasks?: object, taskState?: string }} ctx
 * @returns {{ lines: string[], task?: { id: string, next: string, note?: object } }}
 */
export function talkFor(def, ctx = {}) {
  const task = def.task && ctx.tasks ? ctx.tasks[def.task] : null;
  if (task) {
    const state = ctx.taskState || null;
    if (!state) return { lines: task.ask, task: { id: task.id, next: 'asked' } };
    if (state === 'asked') return { lines: task.remind, task: { id: task.id, next: 'asked' } };
    if (state === 'carrying') return { lines: task.thanks, task: { id: task.id, next: 'done', note: task.note } };
  }
  const pool = [];
  const t = def.talk || {};
  for (const [clue, sets] of Object.entries(t.afterClue || {}).reverse()) if (ctx.clues?.has(clue)) pool.push(...sets);
  for (const [quest, sets] of Object.entries(t.afterBench || {}).reverse()) if (ctx.cleared?.has(quest)) pool.push(...sets);
  pool.push(...(t.default || []));
  if (!pool.length) return { lines: [] };
  return { lines: pool[(ctx.turn || 0) % pool.length] };
}

/** Every line a crew file can say, for the checks. */
export function allLines(crew, tasks) {
  const out = [];
  for (const def of crew) {
    const t = def.talk || {};
    for (const set of t.default || []) out.push(...set.map(l => ({ who: def.id, l })));
    for (const sets of Object.values(t.afterBench || {})) for (const set of sets) out.push(...set.map(l => ({ who: def.id, l })));
    for (const sets of Object.values(t.afterClue || {})) for (const set of sets) out.push(...set.map(l => ({ who: def.id, l })));
  }
  for (const task of Object.values(tasks || {})) {
    for (const k of ['ask', 'remind', 'thanks']) out.push(...task[k].map(l => ({ who: task.giver, l })));
    out.push({ who: task.giver, l: task.note.text });
  }
  return out;
}
