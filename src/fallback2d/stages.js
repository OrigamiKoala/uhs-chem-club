/**
 * fallback2d/stages.js — DOM-only inputs for Tier 1 (Non-WebGL fallback)
 * Generates the EXACT same payload contract as the 3D viewer!
 */

import { ANCHOR_DEFINITIONS } from '../quest3d/anchors.js';

export function renderFallbackInputs(container, stageConfig, kind, onPayloadChange) {
  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'fallback-controls form-group';

  if (kind === 'pick') {
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = 'Select Target Location:';

    const select = document.createElement('select');
    select.className = 'form-select';
    select.innerHTML = '<option value="">-- Choose target anchor --</option>';

    const anchors = stageConfig.anchors || [];
    for (const aId of anchors) {
      const opt = document.createElement('option');
      opt.value = aId;
      opt.textContent = `${aId} — ${ANCHOR_DEFINITIONS[aId]?.label || aId}`;
      select.appendChild(opt);
    }

    select.addEventListener('change', () => {
      onPayloadChange({ anchors: select.value ? [select.value] : [] });
    });

    wrap.appendChild(label);
    wrap.appendChild(select);
  } else if (kind === 'pick_multi') {
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = 'Select All Applicable Anchors:';
    wrap.appendChild(label);

    const anchors = stageConfig.anchors || [];
    const selected = new Set();

    for (const aId of anchors) {
      const row = document.createElement('label');
      row.className = 'choice-option';
      row.style.margin = '4px 0';
      row.innerHTML = `<input type="checkbox" value="${aId}"> <span>${aId}: ${ANCHOR_DEFINITIONS[aId]?.label || aId}</span>`;

      const input = row.querySelector('input');
      input.addEventListener('change', () => {
        if (input.checked) selected.add(aId);
        else selected.delete(aId);
        onPayloadChange({ anchors: Array.from(selected) });
      });

      wrap.appendChild(row);
    }
  } else if (kind === 'arrow') {
    wrap.innerHTML = `
      <label class="form-label">Route Electron Flow Arrow:</label>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <select id="arrow-from" class="form-select" style="flex:1;">
          <option value="">-- Donor (From) --</option>
          ${(stageConfig.anchors || []).map(a => `<option value="${a}">${a} (${ANCHOR_DEFINITIONS[a]?.label || a})</option>`).join('')}
        </select>
        <span style="color:var(--accent-cyan); font-weight:bold;">➔</span>
        <select id="arrow-to" class="form-select" style="flex:1;">
          <option value="">-- Recipient (To) --</option>
          ${(stageConfig.anchors || []).map(a => `<option value="${a}">${a} (${ANCHOR_DEFINITIONS[a]?.label || a})</option>`).join('')}
        </select>
      </div>
    `;

    const fromSel = wrap.querySelector('#arrow-from');
    const toSel = wrap.querySelector('#arrow-to');

    const update = () => {
      if (fromSel.value && toSel.value) {
        onPayloadChange({ from: fromSel.value, to: toSel.value });
      }
    };
    fromSel.addEventListener('change', update);
    toSel.addEventListener('change', update);
  } else if (kind === 'chain') {
    wrap.innerHTML = `
      <label class="form-label">Multi-Step Reaction Cascade:</label>
      <div style="margin-bottom:0.5rem; font-size:0.85rem; color:var(--text-secondary);">Step 1: Attack Arrow</div>
      <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.75rem;">
        <select id="step1-from" class="form-select" style="flex:1;">
          <option value="">-- From --</option>
          ${(stageConfig.anchors || []).map(a => `<option value="${a}">${a}</option>`).join('')}
        </select>
        <span>➔</span>
        <select id="step1-to" class="form-select" style="flex:1;">
          <option value="">-- To --</option>
          ${(stageConfig.anchors || []).map(a => `<option value="${a}">${a}</option>`).join('')}
        </select>
      </div>
      <div style="margin-bottom:0.5rem; font-size:0.85rem; color:var(--text-secondary);">Step 2: Departure Arrow</div>
      <div style="display:flex; gap:0.5rem; align-items:center;">
        <select id="step2-from" class="form-select" style="flex:1;">
          <option value="">-- From --</option>
          ${(stageConfig.anchors || []).map(a => `<option value="${a}">${a}</option>`).join('')}
        </select>
        <span>➔</span>
        <select id="step2-to" class="form-select" style="flex:1;">
          <option value="">-- To --</option>
          ${(stageConfig.anchors || []).map(a => `<option value="${a}">${a}</option>`).join('')}
        </select>
      </div>
    `;

    const updateChain = () => {
      const s1f = wrap.querySelector('#step1-from').value;
      const s1t = wrap.querySelector('#step1-to').value;
      const s2f = wrap.querySelector('#step2-from').value;
      const s2t = wrap.querySelector('#step2-to').value;

      if (s1f && s1t && s2f && s2t) {
        onPayloadChange({
          steps: [
            { from: s1f, to: s1t },
            { from: s2f, to: s2t }
          ]
        });
      }
    };

    wrap.querySelectorAll('select').forEach(s => s.addEventListener('change', updateChain));
  } else if (kind === 'rank') {
    const items = [...(stageConfig.items || [])];
    const renderList = () => {
      wrap.innerHTML = '<label class="form-label">Order from Most Polarized to Most Symmetric:</label>';
      items.forEach((it, idx) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'rank-item';
        itemDiv.innerHTML = `
          <span>${idx + 1}. ${it.label}</span>
          <div class="rank-arrows">
            <button type="button" class="rank-btn" ${idx === 0 ? 'disabled' : ''} data-up="${idx}">▲</button>
            <button type="button" class="rank-btn" ${idx === items.length - 1 ? 'disabled' : ''} data-down="${idx}">▼</button>
          </div>
        `;
        wrap.appendChild(itemDiv);
      });

      wrap.querySelectorAll('[data-up]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.getAttribute('data-up'));
          const temp = items[i];
          items[i] = items[i - 1];
          items[i - 1] = temp;
          renderList();
          onPayloadChange({ order: items.map(x => x.id) });
        });
      });

      wrap.querySelectorAll('[data-down]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.getAttribute('data-down'));
          const temp = items[i];
          items[i] = items[i + 1];
          items[i + 1] = temp;
          renderList();
          onPayloadChange({ order: items.map(x => x.id) });
        });
      });
    };

    renderList();
    onPayloadChange({ order: items.map(x => x.id) });
  }

  container.appendChild(wrap);
}
