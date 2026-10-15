/**
 * slate.js — W3 The Formula Slate.
 *
 * Equation template with empty slots for unit-carrying calculation.
 * The player fills slots from logged readings or constants; the slate
 * computes the result once all slots are validly assigned.
 */

import { esc } from '../../ui/layout.js';

export class FormulaSlate {
  /**
   * @param {HTMLElement} host
   * @param {{
   *   stage?: object,
   *   onApply?: (resultValue: number, resultUnit: string) => void,
   *   onError?: (message: string) => void
   * }} opts
   */
  constructor(host, opts = {}) {
    this.host = host;
    this.opts = opts;
    this.config = null;
    this.slots = {}; // slotId -> { value, unit, label }
    this.activeSlotId = null;
    this.result = null;
    this.resultUnit = '';

    if (typeof document !== 'undefined' && document.createElement) {
      this.container = document.createElement('div');
      this.container.className = 'lq-slate-panel';
      if (this.host && typeof this.host.appendChild === 'function') {
        this.host.appendChild(this.container);
      }
      this.bindEvents();
    } else {
      this.container = null;
    }

    if (opts.stage) this.setStage(opts.stage);
    else this.render();
  }

  setStage(stage) {
    this.config = stage?.slate || null;
    this.slots = {};
    this.activeSlotId = null;
    this.result = null;
    this.resultUnit = this.config?.targetUnit || '';

    // Pre-populate constant slots
    if (this.config?.slots) {
      for (const s of this.config.slots) {
        if (s.constant && s.value !== undefined) {
          this.slots[s.id] = { value: s.value, unit: s.unit, label: s.label || s.id };
        }
      }
    }
    this.render();
  }

  bindEvents() {
    if (!this.container || typeof this.container.addEventListener !== 'function') return;
    this.container.addEventListener('click', e => {
      const slotBtn = e.target.closest?.('[data-slot-id]');
      if (slotBtn) {
        const id = slotBtn.dataset.slotId;
        const slotCfg = (this.config?.slots || []).find(s => s.id === id);
        if (slotCfg && !slotCfg.constant) {
          this.activeSlotId = (this.activeSlotId === id) ? null : id;
          this.render();
        }
        return;
      }

      const constBtn = e.target.closest?.('[data-constant-val]');
      if (constBtn) {
        const val = parseFloat(constBtn.dataset.constantVal);
        const unit = constBtn.dataset.constantUnit || '';
        const label = constBtn.dataset.constantLabel || '';
        this.fillActiveSlot(val, unit, label);
        return;
      }

      const applyBtn = e.target.closest?.('[data-act="slate-apply"]');
      if (applyBtn && this.result !== null) {
        this.opts.onApply?.(this.result, this.resultUnit);
        return;
      }
    });
  }

  /**
   * Called when player fills a slot with a value and unit.
   */
  fillActiveSlot(value, unit, label = '') {
    if (!this.config || !this.config.slots) return;

    if (!this.activeSlotId) {
      const unfilled = this.config.slots.find(s => !s.constant && !this.slots[s.id]);
      if (unfilled) this.activeSlotId = unfilled.id;
      else return;
    }

    const slotCfg = this.config.slots.find(s => s.id === this.activeSlotId);
    if (!slotCfg) return;

    // Unit validation
    if (unit && slotCfg.unit) {
      const allowed = slotCfg.allowUnits || [slotCfg.unit];
      if (!allowed.includes(unit)) {
        const err = `Slot ${slotCfg.label || slotCfg.id} expects ${slotCfg.unit}, received ${unit}.`;
        this.opts.onError?.(err);
        return;
      }
    }

    this.slots[this.activeSlotId] = { value, unit: unit || slotCfg.unit, label: label || String(value) };
    this.activeSlotId = null;

    this.evaluate();
    this.render();
  }

  evaluate() {
    if (!this.config || !this.config.slots) return;
    const allFilled = this.config.slots.every(s => this.slots[s.id] && this.slots[s.id].value !== undefined);
    if (!allFilled) {
      this.result = null;
      return;
    }

    const values = {};
    for (const s of this.config.slots) {
      values[s.id] = this.slots[s.id].value;
    }

    if (typeof this.config.evaluate === 'function') {
      try {
        const res = this.config.evaluate(values);
        this.result = typeof res === 'number' ? Math.round(res * 1000) / 1000 : res;
      } catch (err) {
        this.result = null;
      }
    }
  }

  render() {
    if (!this.container) return;
    if (!this.config) {
      this.container.innerHTML = '';
      this.container.classList?.add('hidden');
      return;
    }
    this.container.classList?.remove('hidden');

    const template = this.config.template || '';
    const slots = this.config.slots || [];
    const constants = this.config.constants || [];

    const hasSci = Object.values(this.slots).some(s => Math.abs(s.value) >= 1e6 || (Math.abs(s.value) > 0 && Math.abs(s.value) <= 1e-4));

    this.container.innerHTML = `
      <div class="lq-slate">
        <div class="lq-slate-head">
          <span class="lq-slate-title">FORMULA SLATE</span>
          <span class="lq-slate-target">${esc(this.config.target || '')} ${this.resultUnit ? `[${esc(this.resultUnit)}]` : ''}</span>
        </div>
        <div class="lq-slate-body">
          <div class="lq-slate-slots">
            ${slots.map(s => {
              const filled = this.slots[s.id];
              const isActive = this.activeSlotId === s.id;
              return `
                <div class="lq-slate-slot ${filled ? 'filled' : 'empty'} ${isActive ? 'active' : ''} ${s.constant ? 'constant' : ''}"
                     data-slot-id="${esc(s.id)}" role="button" tabindex="0" title="${s.constant ? 'Constant' : 'Tap to select slot'}">
                  <span class="lq-slot-label">${esc(s.label || s.id)}</span>
                  <span class="lq-slot-val">${filled ? esc(String(filled.value)) : '—'}</span>
                  <span class="lq-slot-unit">${esc(filled?.unit || s.unit || '')}</span>
                </div>
              `;
            }).join('')}
          </div>
          ${constants.length ? `
            <div class="lq-slate-constants">
              <span class="lq-slate-const-label">CONSTANTS:</span>
              ${constants.map(c => `
                <button type="button" class="btn-secondary quest-btn-sm lq-slate-const-btn"
                        data-constant-val="${c.value}" data-constant-unit="${esc(c.unit || '')}" data-constant-label="${esc(c.label || '')}">
                  ${esc(c.label || c.id)} = ${c.value} ${esc(c.unit || '')}
                </button>
              `).join('')}
            </div>
          ` : ''}
          <div class="lq-slate-calc">
            <span class="lq-slate-formula">${esc(template)}</span>
            ${this.result !== null ? `
              <div class="lq-slate-result-box">
                <span class="lq-slate-res">= <strong>${esc(String(this.result))}</strong> ${esc(this.resultUnit)}</span>
                <button type="button" class="btn-primary quest-btn-sm lq-slate-apply" data-act="slate-apply">Use Value</button>
              </div>
            ` : ''}
          </div>
          ${hasSci ? `<div class="lq-slate-gloss">10^n denotes scientific powers of 10.</div>` : ''}
        </div>
      </div>
    `;
  }
}
