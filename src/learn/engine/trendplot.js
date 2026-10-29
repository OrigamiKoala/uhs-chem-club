/**
 * trendplot.js — W2 Paired readouts and Trend Plot.
 *
 * Drops a dot at (dial quantity, response) as settings are visited.
 * Never draws a fitted line — the player's dots make the shape.
 * Big paired readouts format two quantities side by side.
 */

import { esc } from '../../ui/layout.js';

export class TrendPlot {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{
   *   xLabel?: string, yLabel?: string,
   *   xUnit?: string, yUnit?: string,
   *   xMin?: number, xMax?: number,
   *   yMin?: number, yMax?: number,
   *   xTicks?: number, yTicks?: number
   * }} spec
   */
  constructor(canvas, spec = {}) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext?.('2d') || null;
    this.spec = {
      xLabel: 'X', yLabel: 'Y',
      xUnit: '', yUnit: '',
      xMin: 0, xMax: 100,
      yMin: 0, yMax: 100,
      xTicks: 4, yTicks: 4,
      ...spec
    };
    this.points = [];
    this.overlay = null;
    this.draw();
  }

  setSpec(spec) {
    this.spec = { ...this.spec, ...spec };
    this.draw();
  }

  addPoint(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') return;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (!this.points.some(p => Math.abs(p.x - x) < 1e-6 && Math.abs(p.y - y) < 1e-6)) {
      this.points.push({ x, y, active: true });
    }
    this.points.forEach((p, i) => { p.active = i === this.points.length - 1; });
    this.draw();
  }

  clear() {
    this.points = [];
    this.draw();
  }

  /** Where data (x, y) lands on the canvas, in canvas px (for a line laid over the dots). */
  pxOf(x, y) {
    const w = this.canvas?.width || 0;
    const h = this.canvas?.height || 0;
    const k = (this.spec.fontPx || 9) / 9;
    const padL = 36 * k, padB = 26 * k, padR = 12 * k, padT = 16 * k;
    const pw = w - padL - padR;
    const ph = h - padT - padB;
    const { xMin, xMax, yMin, yMax } = this.spec;
    return {
      x: padL + ((x - xMin) / Math.max(1e-9, xMax - xMin)) * pw,
      y: padT + ph - ((y - yMin) / Math.max(1e-9, yMax - yMin)) * ph
    };
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (!w || !h) return;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d0c0a';
    ctx.fillRect(0, 0, w, h);

    // `fontPx` is the tick label's size: a strip painted on a table is seen small, so it asks for a bigger one and every margin follows.
    const k = (this.spec.fontPx || 9) / 9;
    const padL = 36 * k;
    const padB = 26 * k;
    const padR = 12 * k;
    const padT = 16 * k;
    const pw = w - padL - padR;
    const ph = h - padT - padB;

    const { xMin, xMax, yMin, yMax, xLabel, yLabel, xUnit, yUnit } = this.spec;
    const xSpan = Math.max(1e-9, xMax - xMin);
    const ySpan = Math.max(1e-9, yMax - yMin);

    // Axes
    ctx.strokeStyle = '#2e2a26';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + ph);
    ctx.lineTo(padL + pw, padT + ph);
    ctx.stroke();

    // Grid ticks
    ctx.fillStyle = '#6b625a';
    ctx.font = `${Math.round(9 * k)}px monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const yTicks = this.spec.yTicks || 4;
    for (let i = 0; i <= yTicks; i++) {
      const yVal = yMin + (ySpan * i) / yTicks;
      const yPos = padT + ph - (ph * i) / yTicks;
      ctx.fillText(this.spec.yDigits ? yVal.toFixed(this.spec.yDigits) : String(Math.round(yVal)), padL - 4 * k, yPos);
      ctx.strokeStyle = '#1a1816';
      ctx.beginPath();
      ctx.moveTo(padL, yPos);
      ctx.lineTo(padL + pw, yPos);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xTicks = this.spec.xTicks || 4;
    for (let i = 0; i <= xTicks; i++) {
      const xVal = xMin + (xSpan * i) / xTicks;
      const xPos = padL + (pw * i) / xTicks;
      ctx.fillText(this.spec.xDigits ? xVal.toFixed(this.spec.xDigits) : String(Math.round(xVal)), xPos, padT + ph + 4 * k);
      ctx.strokeStyle = '#1a1816';
      ctx.beginPath();
      ctx.moveTo(xPos, padT);
      ctx.lineTo(xPos, padT + ph);
      ctx.stroke();
    }

    // Axis Labels
    ctx.fillStyle = '#b8afa0';
    ctx.textAlign = 'center';
    ctx.fillText(`${xLabel}${xUnit ? ' (' + xUnit + ')' : ''}`, padL + pw / 2, padT + ph + 14 * k);

    // The vertical axis is named above its top.
    if (yLabel) {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${yLabel}${yUnit ? ' (' + yUnit + ')' : ''}`, 4 * k, 2 * k);
    }

    // Points
    for (const p of this.points) {
      const px = padL + ((p.x - xMin) / xSpan) * pw;
      const py = padT + ph - ((p.y - yMin) / ySpan) * ph;
      if (px < padL || px > padL + pw || py < padT || py > padT + ph) continue;

      ctx.fillStyle = p.active ? '#d99423' : '#6f8f3f';
      ctx.beginPath();
      ctx.arc(px, py, (p.active ? 4 : 3) * k, 0, Math.PI * 2);
      ctx.fill();
      if (p.active) {
        ctx.strokeStyle = '#dcd6cc';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    // Whatever the owner lays over the dots (the tabletop's straightedge).
    if (typeof this.overlay === 'function') this.overlay(ctx, this);
  }
}

/** Render markup for Paired Readouts */
export function pairedReadoutMarkup(left, right) {
  if (!left || !right) return '';
  return `
    <div class="lq-paired-readouts">
      <div class="lq-paired-item">
        <span class="lq-paired-label">${esc(left.label)}</span>
        <span class="lq-paired-val">${esc(String(left.value))} ${left.unit ? `<small>${esc(left.unit)}</small>` : ''}</span>
      </div>
      <div class="lq-paired-sep" aria-hidden="true">&harr;</div>
      <div class="lq-paired-item">
        <span class="lq-paired-label">${esc(right.label)}</span>
        <span class="lq-paired-val">${esc(String(right.value))} ${right.unit ? `<small>${esc(right.unit)}</small>` : ''}</span>
      </div>
    </div>
  `;
}
