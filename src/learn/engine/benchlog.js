/**
 * benchlog.js — W1 Bench Log: persistent table of instrument readings.
 *
 * Records readings taken during a stage (one row per measurement/press).
 * Cleared on setStage.
 * Rows can be tapped to pin up to two for side-by-side comparison.
 * Optional compute bar (stage.log.compute) supports two-operand operations.
 * Honest-picture rule: records only what the instrument reported.
 */

import { esc } from '../../ui/layout.js';

export class BenchLog {
  /**
   * @param {HTMLElement} host
   * @param {{
   *   onPinChange?: (pinnedRows: Array<object>) => void,
   *   onSelect?: (row: object) => void
   * }} opts
   */
  constructor(host, opts = {}) {
    this.host = host;
    this.opts = opts;
    this.entries = [];
    this.pinnedIds = [];
    this.collapsed = false;
    this.config = null;
    this.seq = 0;
    this.computeOp = null;
    this.computeResult = null;

    if (typeof document !== 'undefined' && document.createElement) {
      this.container = document.createElement('div');
      this.container.className = 'lq-benchlog-panel';
      if (this.host && typeof this.host.appendChild === 'function') {
        this.host.appendChild(this.container);
      }
      this.bindEvents();
    } else {
      this.container = null;
    }

    this.render();
  }

  setStage(stage) {
    this.entries = [];
    this.pinnedIds = [];
    this.computeOp = null;
    this.computeResult = null;
    this.config = stage?.log || null;
    this.render();
  }

  /**
   * Add a reading to the log.
   * @param {object} rowData  Key-value pairs of reading, e.g. { sample: 'A', dial: '10 L', reading: '101.3 kPa' }
   */
  addEntry(rowData) {
    if (!rowData || typeof rowData !== 'object') return null;
    const id = `blog-${++this.seq}`;
    const timestamp = Date.now();
    const entry = { id, timestamp, data: { ...rowData } };
    this.entries.push(entry);
    this.render();
    return entry;
  }

  togglePin(id) {
    const idx = this.pinnedIds.indexOf(id);
    if (idx >= 0) {
      this.pinnedIds.splice(idx, 1);
    } else {
      if (this.pinnedIds.length >= 2) {
        this.pinnedIds.shift();
      }
      this.pinnedIds.push(id);
    }
    this.computeResult = null;
    this.render();
    this.opts.onPinChange?.(this.getPinnedEntries());
  }

  getPinnedEntries() {
    return this.pinnedIds.map(id => this.entries.find(e => e.id === id)).filter(Boolean);
  }

  clear() {
    this.entries = [];
    this.pinnedIds = [];
    this.computeResult = null;
    this.render();
  }

  bindEvents() {
    if (!this.container || typeof this.container.addEventListener !== 'function') return;
    this.container.addEventListener('click', e => {
      const toggle = e.target.closest?.('[data-act="toggle-collapse"]');
      if (toggle) {
        this.collapsed = !this.collapsed;
        this.render();
        return;
      }

      const row = e.target.closest?.('[data-log-id]');
      if (row) {
        const id = row.dataset.logId;
        this.togglePin(id);
        const entry = this.entries.find(it => it.id === id);
        if (entry) this.opts.onSelect?.(entry);
        return;
      }

      const opBtn = e.target.closest?.('[data-compute-op]');
      if (opBtn) {
        const op = opBtn.dataset.computeOp;
        this.runCompute(op);
        return;
      }
    });
  }

  runCompute(op) {
    const pinned = this.getPinnedEntries();
    if (pinned.length < 2) return;
    const getNum = entry => {
      if (typeof entry.data.value === 'number') return entry.data.value;
      if (typeof entry.data.reading === 'number') return entry.data.reading;
      for (const val of Object.values(entry.data)) {
        if (typeof val === 'number') return val;
        const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
        if (!isNaN(num)) return num;
      }
      return null;
    };
    const v1 = getNum(pinned[0]);
    const v2 = getNum(pinned[1]);
    if (v1 === null || v2 === null) return;
    this.computeOp = op;
    let res = null;
    if (op === 'x' || op === '*' || op === '×') res = v1 * v2;
    else if (op === '÷' || op === '/') res = v2 !== 0 ? v1 / v2 : Infinity;
    else if (op === '+') res = v1 + v2;
    else if (op === '−' || op === '-') res = v1 - v2;

    this.computeResult = res !== null ? (Math.round(res * 1000) / 1000) : null;
    this.render();
  }

  /** The columns the table shows: the stage's own, or every key a reading carried. */
  columns() {
    const declaredCols = this.config?.columns;
    if (Array.isArray(declaredCols) && declaredCols.length) {
      return declaredCols.map(c => typeof c === 'string' ? { key: c, label: c } : c);
    }
    const keys = new Set();
    this.entries.forEach(e => {
      Object.keys(e.data).forEach(k => {
        if (k !== 'raw' && k !== 'id' && !k.startsWith('_')) keys.add(k);
      });
    });
    return Array.from(keys).map(k => ({ key: k, label: k.toUpperCase() }));
  }

  /** What the table holds right now, as plain data: the 3D bench's board repaints from this. */
  snapshot() {
    return { columns: this.columns().map(c => ({ key: c.key, label: c.label })), rows: this.entries.map(e => ({ ...e.data })) };
  }

  render() {
    if (!this.container) return;
    if (this.entries.length === 0) {
      this.container.innerHTML = '';
      this.container.classList?.add('empty');
      return;
    }
    this.container.classList?.remove('empty');

    const cols = this.columns();

    const pinned = this.getPinnedEntries();

    let computeHtml = '';
    if (this.config?.compute && Array.isArray(this.config.compute)) {
      computeHtml = `
        <div class="lq-benchlog-compute">
          <span class="lq-benchlog-compute-label">COMPARE:</span>
          ${this.config.compute.map(op => `
            <button type="button" class="btn-secondary quest-btn-sm lq-log-op ${this.computeOp === op ? 'active' : ''}" data-compute-op="${esc(op)}">${esc(op)}</button>
          `).join('')}
          ${this.computeResult !== null ? `<span class="lq-log-result">= ${this.computeResult}</span>` : ''}
        </div>
      `;
    }

    let pinnedBoxHtml = '';
    if (pinned.length === 2) {
      pinnedBoxHtml = `
        <div class="lq-benchlog-pinned">
          <div class="lq-pinned-row">
            <span class="lq-pinned-tag">PIN 1</span>
            ${cols.map(c => `<span class="lq-pinned-val"><strong>${esc(c.label)}:</strong> ${esc(String(pinned[0].data[c.key] ?? ''))}</span>`).join('')}
          </div>
          <div class="lq-pinned-row">
            <span class="lq-pinned-tag">PIN 2</span>
            ${cols.map(c => `<span class="lq-pinned-val"><strong>${esc(c.label)}:</strong> ${esc(String(pinned[1].data[c.key] ?? ''))}</span>`).join('')}
          </div>
          ${computeHtml}
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="lq-benchlog">
        <div class="lq-benchlog-head">
          <span class="lq-benchlog-title">BENCH LOG (${this.entries.length})</span>
          <button type="button" class="btn-secondary quest-btn-sm lq-benchlog-toggle" data-act="toggle-collapse" aria-expanded="${!this.collapsed}">
            ${this.collapsed ? 'Expand Log' : 'Collapse Log'}
          </button>
        </div>
        ${pinnedBoxHtml}
        <div class="lq-benchlog-body ${this.collapsed ? 'collapsed' : ''}">
          <table class="lq-benchlog-table">
            <thead>
              <tr>
                <th class="col-pin" aria-label="Pin"></th>
                ${cols.map(c => `<th>${esc(c.label)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${this.entries.map(e => {
                const isPinned = this.pinnedIds.includes(e.id);
                return `
                  <tr data-log-id="${esc(e.id)}" class="${isPinned ? 'pinned' : ''}" role="button" tabindex="0" title="Tap to pin comparison">
                    <td class="col-pin">${isPinned ? '[PIN]' : '·'}</td>
                    ${cols.map(c => `<td>${esc(String(e.data[c.key] ?? ''))}</td>`).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}
