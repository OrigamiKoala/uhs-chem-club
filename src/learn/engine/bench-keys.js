/**
 * bench-keys.js — The frame's tool keys, mirrored onto the 3D bench.
 *
 * At T4 every Learn instrument is a real object the player is standing at,
 * and the tools that drive it ("Fire Beam", "Press Together", "Tip Sample",
 * the "View" keys) have to be real keys on it — not buttons on a page floating
 * over it. But the quest modules build those keys as DOM buttons in the
 * frame's `.lq-controls`, attach their handlers there, and are identical on
 * every tier. So the DOM stays the single source of truth and this is a
 * physical MIRROR of it: it reads the buttons, hands the bench a description
 * of them (`BenchViewer3D.setKeys`), and a press on a key on the bench clicks
 * the real button. Nothing in quest copy or quest handlers changes, and a
 * stage grades identically whichever key the player pressed.
 *
 * Node-safe: no three.js, and no DOM access until `mirrorBenchKeys` is called.
 * `verify:learn` imports every quest module, which imports the frame, which
 * imports this.
 */

import { activeBenchViewer, onBenchViewer } from './bench-host.js';

/** Set on the controls element while its keys are standing on the bench. */
const ON_BENCH = 'lq-keys-on-bench';

/** A key's own legend: its direct text, never a child's (a badge is a child). */
function ownText(btn) {
  let out = '';
  for (const n of btn.childNodes || []) {
    if (n.nodeType === 3) out += ` ${n.nodeValue}`;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/** Whatever a key carries in a child element: the tester's charges. */
function badgeText(btn) {
  const parts = [];
  for (const c of btn.children || []) {
    const t = (c.textContent || '').replace(/\s+/g, ' ').trim();
    if (t) parts.push(t);
  }
  return parts.join(' ');
}

function groupLabel(el) {
  const aria = el.getAttribute?.('aria-label');
  if (aria && aria.trim()) return aria.trim();
  const lab = el.querySelector?.('.form-label');
  const t = (lab?.textContent || '').replace(/\s+/g, ' ').trim();
  return t || null;
}

/**
 * Read the keys a stage is offering, in DOM order, grouped as the frame groups
 * them. The drawn power dial and the key legend are not keys.
 */
function readKeys(controlsEl) {
  const groups = [];
  const byEl = new Map();
  const buttons = new Map();
  const loose = { label: null, keys: [] };
  let looseAt = -1;

  const all = controlsEl.querySelectorAll ? controlsEl.querySelectorAll('button') : [];
  let n = 0;
  for (const btn of all) {
    if (btn.closest?.('.lq-dial') || btn.closest?.('.lq-tool-notes')) continue;
    const label = ownText(btn);
    if (!label) continue;
    const id = `k${n++}`;
    buttons.set(id, btn);
    const badge = badgeText(btn);
    const key = {
      id,
      label,
      badge: badge || undefined,
      disabled: Boolean(btn.disabled),
      lit: Boolean(
        btn.classList?.contains('lit') || btn.classList?.contains('selected') ||
        btn.getAttribute?.('aria-pressed') === 'true'
      )
    };

    const grp = btn.closest?.('[role="group"]');
    if (grp && grp !== controlsEl && controlsEl.contains?.(grp)) {
      let rec = byEl.get(grp);
      if (!rec) {
        rec = { label: groupLabel(grp), keys: [] };
        byEl.set(grp, rec);
        groups.push(rec);
      }
      rec.keys.push(key);
    } else {
      if (looseAt < 0) { looseAt = groups.length; groups.push(loose); }
      loose.keys.push(key);
    }
  }
  return { groups: groups.filter(g => g.keys.length), buttons };
}

/**
 * Mirror a frame's tool keys onto whichever bench viewer is live.
 *
 * @param {HTMLElement} controlsEl the frame's `.lq-controls`
 * @returns {{dispose: () => void}}
 */
export function mirrorBenchKeys(controlsEl) {
  if (!controlsEl) return { dispose() {} };

  let viewer = null;
  let buttons = new Map();
  let disposed = false;
  let pending = false;

  const onPress = id => {
    const btn = buttons.get(id);
    // A button the stage has since re-rendered away is not pressed.
    if (!btn || btn.disabled || btn.isConnected === false) return;
    btn.click();
  };

  const setClass = on => {
    const has = controlsEl.classList?.contains(ON_BENCH);
    if (on && !has) controlsEl.classList.add(ON_BENCH);
    else if (!on && has) controlsEl.classList.remove(ON_BENCH);
  };

  const sync = () => {
    pending = false;
    if (disposed) return;
    const live = activeBenchViewer();
    if (live !== viewer) {
      // The stage rebuilt its instrument, or it went away: take the keys off
      // the old one before they go on the new one.
      if (viewer && !viewer.disposed) viewer.setKeys?.([]);
      viewer = live;
    }
    if (!viewer || typeof viewer.setKeys !== 'function') {
      buttons = new Map();
      setClass(false);
      return;
    }
    const read = readKeys(controlsEl);
    buttons = read.buttons;
    viewer.setKeys(read.groups, onPress);
    // The power dial is on the bench too (`buildPowerDial`), so a plate that
    // carries one has handed its control over even when it has no keys.
    setClass(read.groups.length > 0 || Boolean(controlsEl.querySelector?.('.lq-dial')));
  };

  const schedule = () => {
    if (pending || disposed) return;
    pending = true;
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(sync);
    else if (typeof queueMicrotask === 'function') queueMicrotask(sync);
    else Promise.resolve().then(sync);
  };

  // Our own class change is an attribute mutation on the observed element;
  // ignoring `class` on the element itself keeps the mirror from feeding
  // itself, while a key lighting up (a class on a BUTTON) still re-syncs.
  let observer = null;
  if (typeof MutationObserver === 'function') {
    observer = new MutationObserver(records => {
      for (const r of records) {
        if (r.type === 'attributes' && r.target === controlsEl) continue;
        schedule();
        return;
      }
    });
    observer.observe(controlsEl, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'disabled', 'aria-pressed']
    });
  }

  const unsubscribe = onBenchViewer(() => schedule());
  sync();

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      observer?.disconnect();
      unsubscribe();
      if (viewer && !viewer.disposed) viewer.setKeys?.([]);
      viewer = null;
      buttons = new Map();
      setClass(false);
    }
  };
}
