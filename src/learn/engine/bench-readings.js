/**
 * bench-readings.js — The bench log, the trend plot and the stage's device,
 * mirrored onto the 3D bench.
 *
 * At every tier these three are small cards in the quest frame: the log of
 * readings taken (`benchlog.js`), the dots a dial has visited (`trendplot.js`)
 * and a drawn device such as the seesaw or the mole map (`visual-devices.js`).
 * With the bench built, a player who folds the plates away to look at the
 * instrument used to lose all three. This stands them on the plate as ONE raked
 * board beside the key bank, the way `bench-keys.js` stands the keys.
 *
 * IT IS A MIRROR AND ONLY A MIRROR. The DOM cards stay the source of truth; the
 * board repaints what they hold and records nothing of its own, so it can never
 * show a reading the instrument did not report (the honest-picture rule). It is
 * read-only: pinning two log rows to compare them stays on the card.
 *
 * Node-safe: no three.js, and no DOM access until `mirrorBenchReadings` is
 * called. `paintReadings` is a pure function over a 2D context, so `verify:learn`
 * and `verify:bench` can draw it in Node.
 */

import { activeBenchViewer, onBenchViewer } from './bench-host.js';

/** The board face, in metres, and the canvas it is painted on. */
export const BOARD = { w: 0.5, l: 0.3, px: 1024 };
BOARD.py = Math.round(BOARD.px * BOARD.l / BOARD.w);

const INK = '#d9cdb4';
const DIM = '#8c8376';
const AMBER = '#e59b24';
const GROUND = '#0d0c0a';
const RULE = '#3a352c';

/** True when a snapshot has anything to show. */
export function hasReadings(snap) {
  return Boolean(snap && ((snap.rows && snap.rows.length) || (snap.pictures && snap.pictures.length)));
}

/** Changes whenever what the board would show changes. */
export function readingsSignature(snap) {
  if (!hasReadings(snap)) return '';
  return JSON.stringify([snap.columns, snap.rows, (snap.pictures || []).map(p => p.id), snap.stamp || 0]);
}

function fit(ctx, text, maxW, size, weight = 500) {
  let s = size;
  for (let i = 0; i < 6; i++) {
    ctx.font = `${weight} ${s}px "Share Tech Mono", monospace`;
    if (ctx.measureText(text).width <= maxW) break;
    s *= 0.86;
  }
  return s;
}

function paintLog(ctx, x0, y0, w, h, snap) {
  const cols = snap.columns || [];
  const rows = snap.rows || [];
  ctx.fillStyle = INK;
  ctx.font = '600 30px "Share Tech Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`BENCH LOG (${rows.length})`, x0, y0 + 28);

  const headY = y0 + 70;
  const cw = w / Math.max(1, cols.length);
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, headY + 10); ctx.lineTo(x0 + w, headY + 10); ctx.stroke();
  cols.forEach((c, i) => {
    const s = fit(ctx, String(c.label).toUpperCase(), cw - 12, 24, 600);
    ctx.fillStyle = DIM;
    ctx.font = `600 ${s}px "Share Tech Mono", monospace`;
    ctx.fillText(String(c.label).toUpperCase(), x0 + i * cw, headY);
  });

  // The newest rows that fit, oldest at the top, so the last reading is the lowest.
  const rowH = 46;
  const fits = Math.max(1, Math.floor((y0 + h - (headY + 22)) / rowH));
  const shown = rows.slice(-fits);
  shown.forEach((r, ri) => {
    const y = headY + 22 + (ri + 1) * rowH - 12;
    const last = ri === shown.length - 1;
    cols.forEach((c, i) => {
      const text = String(r[c.key] ?? '');
      const s = fit(ctx, text, cw - 12, 32);
      ctx.fillStyle = last ? AMBER : INK;
      ctx.font = `500 ${s}px "Share Tech Mono", monospace`;
      ctx.fillText(text, x0 + i * cw, y);
    });
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, y + 12); ctx.lineTo(x0 + w, y + 12); ctx.stroke();
  });
  if (rows.length > shown.length) {
    ctx.fillStyle = DIM;
    ctx.font = '500 22px "Share Tech Mono", monospace';
    ctx.fillText(`${rows.length - shown.length} earlier on the card`, x0, y0 + h - 4);
  }
}

/**
 * Paint the whole board. `snap` is `{ columns, rows, pictures: [{ id, canvas }] }`:
 * the log as the card holds it, and the card's canvases as they are drawn now.
 * Pictures stack in the left column, the log fills the right; either alone takes
 * the full face.
 */
export function paintReadings(ctx, w, h, snap) {
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  if (!hasReadings(snap)) return;

  const pad = 26;
  const pics = snap.pictures || [];
  const hasLog = Boolean(snap.rows && snap.rows.length);
  const both = pics.length && hasLog;
  const leftW = both ? Math.round((w - pad * 3) * 0.46) : w - pad * 2;

  if (pics.length) {
    const gap = 16;
    const slot = (h - pad * 2 - gap * (pics.length - 1)) / pics.length;
    pics.forEach((p, i) => {
      const cw = p.canvas?.width || 360;
      const ch = p.canvas?.height || 120;
      const k = Math.min(leftW / cw, slot / ch);
      const dw = cw * k;
      const dh = ch * k;
      const dx = pad + (leftW - dw) / 2;
      const dy = pad + i * (slot + gap) + (slot - dh) / 2;
      ctx.fillStyle = '#0d0c0a';
      ctx.fillRect(dx, dy, dw, dh);
      if (p.canvas) ctx.drawImage(p.canvas, dx, dy, dw, dh);
      ctx.strokeStyle = RULE;
      ctx.lineWidth = 2;
      ctx.strokeRect(dx, dy, dw, dh);
    });
  }
  if (hasLog) {
    const x0 = both ? pad * 2 + leftW : pad;
    paintLog(ctx, x0, pad, w - x0 - pad, h - pad * 2, snap);
  }
}

/**
 * Mirror a frame's readings onto whichever bench viewer is live.
 *
 * @param {{readingsSnapshot: () => object}} frame
 * @returns {{dispose: () => void}}
 */
export function mirrorBenchReadings(frame) {
  if (!frame || typeof frame.readingsSnapshot !== 'function') return { dispose() {} };

  let viewer = null;
  let lastSig = null;
  let disposed = false;
  let timer = null;

  const sync = (force = false) => {
    if (disposed) return;
    const live = activeBenchViewer();
    if (live !== viewer) {
      if (viewer && !viewer.disposed) viewer.setReadings?.(null);
      viewer = live;
      lastSig = null;
    }
    if (!viewer || typeof viewer.setReadings !== 'function') return;
    const snap = frame.readingsSnapshot();
    // The pictures are canvases drawn in place, so the signature cannot see them
    // change: while one is showing, repaint every beat. The board is small.
    const sig = readingsSignature(snap);
    const live3 = hasReadings(snap);
    if (!force && sig === lastSig && !(snap.pictures && snap.pictures.length)) return;
    lastSig = sig;
    viewer.setReadings(live3 ? snap : null);
  };

  const unsubscribe = onBenchViewer(() => sync(true));
  if (typeof setInterval === 'function') timer = setInterval(sync, 300);
  sync(true);

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      if (timer) clearInterval(timer);
      unsubscribe();
      if (viewer && !viewer.disposed) viewer.setReadings?.(null);
      viewer = null;
    }
  };
}
