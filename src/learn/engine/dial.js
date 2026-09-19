/**
 * dial.js — A rotary control for a bench instrument.
 *
 * A magnification setting is a thing you turn. The scope used to carry a minus
 * key, a readout and a plus key, which is a form widget wearing a bench's
 * clothes: three presses to get from 1 to 4, no sense of where in the range you
 * are, and nothing on the panel that looks like it came off a machine. This is
 * the knob instead — a milled cap with a stencilled index mark, detents cut
 * round its collar, and a 270-degree sweep from the low stop to the high one.
 *
 * It is an INSTRUMENT PART and knows nothing about chemistry, magnification or
 * whose bench it is bolted to. It reports an integer in a range; the quest
 * decides what that integer means.
 *
 * Aesthetic contract (CLAUDE.md §3, §4): machined metal, an engraved legend, a
 * filament index that is lit because the instrument is live. Nothing blooms and
 * nothing is round except the knob, which is round because knobs are.
 *
 * Three ways to turn it, because a bench instrument that only answers to a drag
 * is unusable on a trackpad and invisible to a keyboard:
 *   - drag the cap round (pointer capture, so the grip survives leaving it),
 *   - focus it and use the arrow keys, Home and End,
 *   - roll the wheel over it.
 */

/** Degrees from the top at the low stop, and the total sweep to the high stop. */
const START_DEG = -135;
const SWEEP_DEG = 270;

function escText(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Where the index mark points for `value`, in degrees clockwise from the top. */
export function angleFor(value, min, max) {
  const span = Math.max(1, max - min);
  const t = (Math.min(max, Math.max(min, value)) - min) / span;
  return START_DEG + t * SWEEP_DEG;
}

/** The detent `angle` lands on, clamped to the stops. Pure, so it is testable. */
export function valueForAngle(deg, min, max) {
  const span = Math.max(1, max - min);
  const clamped = Math.min(START_DEG + SWEEP_DEG, Math.max(START_DEG, deg));
  return min + Math.round(((clamped - START_DEG) / SWEEP_DEG) * span);
}

/**
 * The markup for one dial. Paint it afterwards with `paintDial`, and wire it
 * with `bindDial`; both take the element this returns as the root's descendant.
 *
 * @param {{label: string, min?: number, max?: number, value?: number,
 *          id?: string, unit?: string}} opts
 */
export function dialMarkup(opts) {
  const min = opts.min ?? 1;
  const max = opts.max ?? 6;
  const value = opts.value ?? min;
  const id = opts.id || 'lq-dial';
  const detents = [];
  for (let v = min; v <= max; v++) {
    detents.push(
      `<i class="lq-knob-detent" data-detent="${v}" style="transform: rotate(${angleFor(v, min, max)}deg)"></i>`
    );
  }
  return `
    <div class="lq-dial" data-dial="${escText(id)}">
      <span class="form-label" id="${escText(id)}-label">${escText(opts.label)}</span>
      <div class="lq-knob-mount">
        <span class="lq-knob-detents" aria-hidden="true">${detents.join('')}</span>
        <div
          class="lq-knob"
          role="slider"
          tabindex="0"
          aria-labelledby="${escText(id)}-label"
          aria-valuemin="${min}"
          aria-valuemax="${max}"
          aria-valuenow="${value}"
          aria-valuetext="${escText(opts.label)} ${value} of ${max}"
        >
          <span class="lq-knob-cap" aria-hidden="true">
            <i class="lq-knob-index"></i>
          </span>
        </div>
      </div>
      <span class="lq-dial-segs" aria-hidden="true">
        ${Array.from({ length: max - min + 1 }, (_, i) => `<i data-seg="${min + i}"></i>`).join('')}
      </span>
      <span class="lq-dial-value" aria-hidden="true">${value}</span>
    </div>
  `;
}

/** Turn the cap, light the segments and update the readout to match `value`. */
export function paintDial(host, value, opts = {}) {
  const min = opts.min ?? 1;
  const max = opts.max ?? 6;
  const root = host?.querySelector?.('.lq-dial');
  if (!root) return;

  const knob = root.querySelector('.lq-knob');
  const cap = root.querySelector('.lq-knob-cap');
  if (cap) cap.style.transform = `rotate(${angleFor(value, min, max)}deg)`;
  if (knob) {
    knob.setAttribute('aria-valuenow', String(value));
    const label = root.querySelector('.form-label')?.textContent || 'Power';
    knob.setAttribute('aria-valuetext', `${label} ${value} of ${max}`);
  }
  root.querySelectorAll('[data-seg]').forEach(seg => {
    seg.classList.toggle('lit', Number(seg.dataset.seg) <= value);
  });
  root.querySelectorAll('[data-detent]').forEach(d => {
    d.classList.toggle('lit', Number(d.dataset.detent) <= value);
  });
  const readout = root.querySelector('.lq-dial-value');
  if (readout) readout.textContent = String(value);
}

/**
 * Wire the dial in `host`. `onChange(value)` fires only when the detent the cap
 * rests on actually changes, so a drag across one position is one click of the
 * instrument rather than sixty.
 *
 * @returns {() => void} a teardown, for a control panel that is re-rendered.
 */
export function bindDial(host, opts) {
  const min = opts.min ?? 1;
  const max = opts.max ?? 6;
  const onChange = opts.onChange || (() => {});
  const knob = host?.querySelector?.('.lq-knob');
  if (!knob) return () => {};

  const current = () => Number(knob.getAttribute('aria-valuenow')) || min;
  const emit = next => {
    const v = Math.min(max, Math.max(min, next));
    if (v === current()) return;
    onChange(v);
  };

  /** The detent the pointer is asking for, from where it sits around the cap. */
  const valueAt = e => {
    const box = knob.getBoundingClientRect();
    const dx = e.clientX - (box.left + box.width / 2);
    const dy = e.clientY - (box.top + box.height / 2);
    // Dead zone at the spindle: an angle read from two pixels off centre is
    // noise, and it would make the cap snap about under a resting thumb.
    if (Math.hypot(dx, dy) < box.width * 0.18) return null;
    const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    return valueForAngle(deg, min, max);
  };

  let turning = false;

  const onDown = e => {
    if (e.button !== undefined && e.button !== 0) return;
    turning = true;
    knob.focus();
    // The grip has to survive the pointer leaving the cap, or a fast turn stops
    // dead at the rim. Capture is also what keeps the drag off the world behind.
    try { knob.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
    e.stopPropagation();
    const v = valueAt(e);
    if (v !== null) emit(v);
  };

  const onMove = e => {
    if (!turning) return;
    e.preventDefault();
    e.stopPropagation();
    const v = valueAt(e);
    if (v !== null) emit(v);
  };

  const onUp = e => {
    if (!turning) return;
    turning = false;
    try { knob.releasePointerCapture(e.pointerId); } catch (err) {}
  };

  const onWheel = e => {
    e.preventDefault();
    emit(current() + (e.deltaY < 0 ? 1 : -1));
  };

  const onKey = e => {
    let next = null;
    switch (e.key) {
      case 'ArrowUp': case 'ArrowRight': next = current() + 1; break;
      case 'ArrowDown': case 'ArrowLeft': next = current() - 1; break;
      case 'Home': next = min; break;
      case 'End': next = max; break;
      case 'PageUp': next = current() + 1; break;
      case 'PageDown': next = current() - 1; break;
      default: return;
    }
    e.preventDefault();
    emit(next);
  };

  knob.addEventListener('pointerdown', onDown);
  knob.addEventListener('pointermove', onMove);
  knob.addEventListener('pointerup', onUp);
  knob.addEventListener('pointercancel', onUp);
  knob.addEventListener('wheel', onWheel, { passive: false });
  knob.addEventListener('keydown', onKey);

  return () => {
    knob.removeEventListener('pointerdown', onDown);
    knob.removeEventListener('pointermove', onMove);
    knob.removeEventListener('pointerup', onUp);
    knob.removeEventListener('pointercancel', onUp);
    knob.removeEventListener('wheel', onWheel);
    knob.removeEventListener('keydown', onKey);
  };
}
