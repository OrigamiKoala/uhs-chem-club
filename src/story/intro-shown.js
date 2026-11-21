/**
 * intro-shown.js — which quest's opening scene (`three/mystery/director.js`) has just asked its question, so the
 * bench does not ask it again on its question card (`ui/case-open.js`). Pure, no DOM.
 */
let last = null;

/** The scene for `key` ('<world>/<quest>') has just played. */
export function noteIntro(key) { last = key; }

/** True once, when the scene for `key` has just played. */
export function consumeIntro(key) {
  const hit = last === key;
  if (hit) last = null;
  return hit;
}
