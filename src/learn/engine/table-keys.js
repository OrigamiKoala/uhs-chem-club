/**
 * table-keys.js — The keys under a tabletop: the stage's tools, and the keys
 * that belong to what is in the hand (Flip, Smaller, Larger) or still out in the
 * field (a fetch key, in a view that has no field point to walk to).
 *
 * One implementation for both views. The drawn tabletop puts the row under its
 * canvas; the built one puts it in the foot dock (`frame.js` table mode). Every
 * key dispatches one reducer action, and every label says what it does, so none
 * carries a legend. `pointer-events: auto` is the stylesheet's (`.lq-tool`).
 */

import { getKit } from '../table/kits/index.js';
import { toolDef } from '../table/tools.js';
import { contextKeys } from '../table/gestures.js';
import { escText } from './plates.js';

export class TableKeys {
  /**
   * @param {HTMLElement} host where the row is appended
   * @param {(action: object) => void} onAction
   * @param {{skipFetch?: (pointId: string) => boolean}} [o] fetch keys to leave out (a world has the point)
   */
  constructor(host, onAction, o = {}) {
    this.host = host;
    this.onAction = onAction;
    this.skipFetch = o.skipFetch || null;
    this.bar = null;
    this.keys = [];
    this.state = null;
  }

  render(state, toolIds) {
    this.state = state;
    const host = this.host;
    if (!host || !state) return;
    if (!this.bar || this.bar.parentElement !== host) {
      const bar = document.createElement('div');
      bar.className = 'table-tools lq-tool-row';
      host.appendChild(bar);
      this.bar = bar;
      bar.addEventListener('click', e => {
        const btn = e.target.closest?.('[data-table-key]');
        if (!btn || btn.disabled) return;
        const key = this.keys.find(k => k.id === btn.dataset.tableKey);
        const action = key?.action(this.state);
        if (action) this.onAction?.(action);
      });
    }
    const kit = getKit(state.kit);
    const keys = [];
    for (const id of toolIds || []) {
      const def = toolDef(kit, id);
      if (!def) continue;
      keys.push({
        id: `tool:${id}`, label: def.label,
        on: Boolean(def.active?.(state)),
        enabled: def.enabled ? def.enabled(state) : true,
        action: s => def.press(s)
      });
    }
    for (const k of contextKeys(state, kit)) {
      if (k.id.startsWith('fetch:') && this.skipFetch?.(k.id.slice(6))) continue;
      keys.push({ id: k.id, label: k.label, on: false, enabled: k.enabled, action: () => k.action });
    }
    this.keys = keys;
    this.bar.innerHTML = keys.map(k =>
      `<button type="button" class="btn-secondary quest-btn-sm lq-tool${k.on ? ' selected' : ''}" data-table-key="${escText(k.id)}" aria-pressed="${k.on}"${k.enabled ? '' : ' disabled'}>${escText(k.label)}</button>`
    ).join('');
  }

  dispose() {
    this.bar?.remove?.();
    this.bar = null;
    this.keys = [];
  }
}
