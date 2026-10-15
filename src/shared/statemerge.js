/**
 * statemerge.js — the merge rule for a player's synced state.
 *
 * The Google Sheet is the master copy and localStorage is the fast cache; both
 * ends hold the same document and reconcile it with this function. It lives in
 * a file of its own with no imports so the client, the dev proxy and
 * `tools/verify-sync.mjs` all run exactly one implementation, and
 * `apps-script/PlayerState.gs` carries a line-for-line copy that
 * `verify:sync` evaluates and compares against this one.
 *
 * A document is `{ v: 1, sections: { <name>: { at, mode, v } } }`.
 *
 *   mode 'union'   — what a player has DONE. Merging never removes anything:
 *                    arrays are unioned, booleans OR together, numbers take the
 *                    larger, strings take the larger (a total order, so the two
 *                    ends cannot flip-flop on a conflict). A stage cleared on a
 *                    phone and one cleared on a laptop both survive.
 *   mode 'latest'  — what a player CHOSE (a loadout, a volume). The section
 *                    with the later `at` wins whole, because a union of two
 *                    loadouts is a loadout nobody picked.
 *
 * The merge is commutative, associative and idempotent, which is what lets
 * every device push whenever it likes and still converge.
 */

export const STATE_VERSION = 1;

/** Sheets cells hold 50,000 characters; stay well under it. */
export const STATE_MAX_CHARS = 42000;

export function emptyDoc() {
  return { v: STATE_VERSION, sections: {} };
}

function isPlainObject(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function itemKey(x) {
  return typeof x === 'object' && x !== null ? 'o:' + stableStringify(x) : typeof x + ':' + String(x);
}

/** JSON with sorted keys, so two equal objects always serialise alike. */
export function stableStringify(x) {
  if (Array.isArray(x)) return '[' + x.map(stableStringify).join(',') + ']';
  if (isPlainObject(x)) {
    return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + stableStringify(x[k])).join(',') + '}';
  }
  return JSON.stringify(x === undefined ? null : x);
}

export function unionMerge(a, b) {
  if (a === undefined || a === null) return b === undefined ? null : b;
  if (b === undefined || b === null) return a;
  if (Array.isArray(a) && Array.isArray(b)) {
    const seen = {};
    const out = [];
    const all = a.concat(b);
    for (let i = 0; i < all.length; i++) {
      const k = itemKey(all[i]);
      if (!Object.prototype.hasOwnProperty.call(seen, k)) {
        seen[k] = true;
        out.push(all[i]);
      }
    }
    // Numbers (stage indices) read best sorted; everything else keeps the
    // order it was first seen in, which for the notebook is discovery order.
    if (out.length && out.every(v => typeof v === 'number')) out.sort((x, y) => x - y);
    return out;
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const out = {};
    const keys = Object.keys(a).concat(Object.keys(b));
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (Object.prototype.hasOwnProperty.call(out, k)) continue;
      out[k] = unionMerge(a[k], b[k]);
    }
    return out;
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') return a || b;
  if (typeof a === 'number' && typeof b === 'number') return a > b ? a : b;
  if (typeof a === 'string' && typeof b === 'string') return a > b ? a : b;
  // Mismatched shapes: keep a value that is not an empty string.
  return stableStringify(a) >= stableStringify(b) ? a : b;
}

export function mergeSection(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  const mode = a.mode === 'latest' || b.mode === 'latest' ? 'latest' : 'union';
  const atA = Number(a.at) || 0;
  const atB = Number(b.at) || 0;
  if (mode === 'latest') {
    let pick;
    if (atA !== atB) pick = atA > atB ? a : b;
    else pick = stableStringify(a.v) >= stableStringify(b.v) ? a : b;
    return { at: Math.max(atA, atB), mode, v: pick.v };
  }
  return { at: Math.max(atA, atB), mode, v: unionMerge(a.v, b.v) };
}

export function mergeDocs(a, b) {
  const out = emptyDoc();
  const sa = (a && a.sections) || {};
  const sb = (b && b.sections) || {};
  const names = Object.keys(sa).concat(Object.keys(sb));
  for (let i = 0; i < names.length; i++) {
    const n = names[i];
    if (Object.prototype.hasOwnProperty.call(out.sections, n)) continue;
    out.sections[n] = mergeSection(sa[n], sb[n]);
  }
  return out;
}

/** Canonical form for comparison: arrays are sets (order is display, not data). */
function canon(x) {
  if (Array.isArray(x)) return x.map(canon).map(stableStringify).sort();
  if (isPlainObject(x)) {
    const o = {};
    for (const k of Object.keys(x).sort()) o[k] = canon(x[k]);
    return o;
  }
  return x === undefined ? null : x;
}

export function docsEqual(a, b) {
  const strip = d => {
    const s = {};
    const src = (d && d.sections) || {};
    for (const k of Object.keys(src)) s[k] = { m: src[k].mode, v: canon(src[k].v) };
    return stableStringify(s);
  };
  return strip(a) === strip(b);
}
