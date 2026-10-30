/**
 * worked.js — the pure half of a worked problem: reading what the player typed
 * and deciding whether it answers a step. No DOM, so `tools/verify-bank.mjs`
 * can drive it in Node. The player-facing half is `ui/worked-problem.js`.
 */

/** Read a typed figure: "1,660", "1.66e3", "−5.2" and "1.66 x 10^3" all parse. Anything else is NaN. */
export function parseNumber(text) {
  let t = String(text ?? '').trim().replace(/[−–]/g, '-').replace(/,/g, '').replace(/\s+/g, '');
  const sci = /^(-?\d*\.?\d+)(?:[x×*]10\^?(-?\d+))$/i.exec(t);
  if (sci) return Number(sci[1]) * 10 ** Number(sci[2]);
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return NaN;
  return Number(t);
}

/**
 * Judge one step. `given` is the typed text for a number step or the option id
 * for a choice step. Returns { ok, empty }; a blank is never a miss.
 */
export function checkStep(step, given) {
  if (step.kind === 'choice') {
    if (!given) return { ok: false, empty: true };
    return { ok: given === step.answer, empty: false };
  }
  if (String(given ?? '').trim() === '') return { ok: false, empty: true };
  const v = parseNumber(given);
  if (!isFinite(v)) return { ok: false, empty: false };
  const tol = step.tol ?? 0.01;
  const slack = Math.abs(step.answer) * tol;
  return { ok: Math.abs(v - step.answer) <= (slack || 1e-9), empty: false };
}

/** The correct answer as the player should read it. */
export function answerText(step) {
  if (step.kind === 'choice') return step.options.find(o => o.id === step.answer)?.label ?? '';
  const n = step.answer;
  const s = Math.abs(n) >= 1e5 || (n !== 0 && Math.abs(n) < 1e-3) ? n.toExponential(2) : String(Number(n.toPrecision(4)));
  return step.unit ? `${s} ${step.unit}` : s;
}
