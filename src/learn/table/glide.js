/**
 * glide.js — A dial's knob follows the hand while it is dragged.
 *
 * A dragged dial still only takes its steps (the value is snapped as the hand moves, `snapDial`),
 * but its knob rides with the pointer between them, and settles on the nearest step when let go.
 * `gestures.js` sets the one dial being dragged; the two views draw its knob from `knobFrac`. A picture
 * the hand drags directly (a piston, a vessel wall, a fulcrum) is drawn from `glideValue`, the unsnapped
 * value; what the bench reads and grades is always the dial's own snapped `value`.
 */

let live = null;

/** The dial at `fixture`/`dial` is being dragged; its knob stands at `frac` (0..1) along its track. */
export function setGlide(fixture, dial, frac, value) { live = { fixture, dial, frac, value }; }

/** The drag is over: every knob stands at its dial's value again. */
export function clearGlide() { const had = Boolean(live); live = null; return had; }

/** Where along its track (0..1) a dial's knob is drawn right now. */
export function knobFrac(fixtureId, name, d) {
  if (live && live.fixture === fixtureId && live.dial === name) return live.frac;
  return d.max === d.min ? 0 : (d.value - d.min) / (d.max - d.min);
}

/** The value a dragged dial's picture is drawn at right now: where the hand is, between steps; else the dial's value. */
export function glideValue(f, name) {
  const d = f?.dials?.[name];
  if (!d) return undefined;
  if (live && live.fixture === f.id && live.dial === name) return live.value ?? d.min + live.frac * (d.max - d.min);
  return d.value;
}

/** The unsnapped value of a dial the hand is dragging right now, or null when it is not being dragged. */
export function gliding(f, name) {
  if (!live || !f || live.fixture !== f.id || live.dial !== name) return null;
  return glideValue(f, name);
}
