/**
 * fallback2d/stages.js — DOM-only inputs for Tier 1 (Non-WebGL fallback)
 * Generates the EXACT same payload contract as the 3D viewer!
 */

import { ANCHOR_DEFINITIONS } from '../quest3d/anchors.js';

/**
 * Turn an anchor id into a clear readable label for Tier 1 dropdowns.
 */
function describeAnchor(anchorId, stageConfig, indexByType) {
  const region = (stageConfig.regions || []).find(r => r.id === anchorId);
  const def = ANCHOR_DEFINITIONS[anchorId];
  const type = region?.type || def?.type || (String(anchorId).startsWith('red') ? 'red' : 'blue');
  const pos = region?.pos || def?.pos || [0, 0, 0];

  const horizontal = pos[0] < -0.7 ? 'left' : pos[0] > 0.7 ? 'right' : 'middle';
  const vertical = pos[1] > 0.6 ? 'upper ' : pos[1] < -0.6 ? 'lower ' : '';

  const n = (indexByType[type] = (indexByType[type] || 0) + 1);
  const name = `${type === 'red' ? 'Red' : 'Blue'} zone ${n}`;
  return `${name} — ${vertical}${horizontal}`;
}

/** Build <option> markup for a set of anchors. */
function anchorOptions(anchors, stageConfig) {
  const counters = {};
  return anchors.map(a => `<option value="${a}">${describeAnchor(a, stageConfig, counters)}</option>`).join('');
}

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
    const all = stageConfig.anchors || [];
    const typeOf = (a) => (stageConfig.regions || []).find(r => r.id === a)?.type
      || ANCHOR_DEFINITIONS[a]?.type
      || (String(a).startsWith('red') ? 'red' : 'blue');
    const redAnchors = all.filter(a => typeOf(a) === 'red');
    const blueAnchors = all.filter(a => typeOf(a) !== 'red');

    wrap.innerHTML = `
      <label class="form-label">Connect a red zone to a blue zone</label>
      <div class="fallback-arrow-row" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
        <select id="arrow-from" class="form-select" style="flex:1; min-width: 150px;" aria-label="Start of the arrow">
          <option value="">-- Start (red) --</option>
          ${anchorOptions(redAnchors.length > 0 ? redAnchors : all, stageConfig)}
        </select>
        <span class="fallback-arrow-glyph" style="color: var(--text-muted); font-family: var(--font-mono);" aria-hidden="true">&rarr;</span>
        <select id="arrow-to" class="form-select" style="flex:1; min-width: 150px;" aria-label="End of the arrow">
          <option value="">-- End (blue) --</option>
          ${anchorOptions(blueAnchors.length > 0 ? blueAnchors : all, stageConfig)}
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
  } else if (kind === 'multi_arrow') {
    const steps = stageConfig.steps || [{ order: 1 }, { order: 2 }];
    const anchors = stageConfig.anchors || [];
    wrap.innerHTML = `
      <label class="form-label">Put the steps in order</label>
      ${steps.map((st, i) => `
        <div class="fallback-step" style="margin-bottom: 0.6rem; background: var(--plate-100); padding: 9px; border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-amber);">
          <div class="eyebrow" style="color: var(--accent-amber); margin-bottom: 5px;">
            Step ${st.order || (i + 1)}
          </div>
          <div class="fallback-arrow-row" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <select class="form-select multi-step-from" data-order="${st.order || (i + 1)}" style="flex:1; min-width: 150px;" aria-label="Step ${st.order || (i + 1)} start">
              <option value="">-- Start --</option>
              ${anchorOptions(anchors, stageConfig)}
            </select>
            <span class="fallback-arrow-glyph" style="color: var(--text-muted); font-family: var(--font-mono);" aria-hidden="true">&rarr;</span>
            <select class="form-select multi-step-to" data-order="${st.order || (i + 1)}" style="flex:1; min-width: 150px;" aria-label="Step ${st.order || (i + 1)} end">
              <option value="">-- End --</option>
              ${anchorOptions(anchors, stageConfig)}
            </select>
          </div>
        </div>
      `).join('')}
    `;

    const updateMulti = () => {
      const froms = wrap.querySelectorAll('.multi-step-from');
      const tos = wrap.querySelectorAll('.multi-step-to');
      const arrows = [];
      for (let i = 0; i < froms.length; i++) {
        const order = Number(froms[i].getAttribute('data-order')) || (i + 1);
        const fVal = froms[i].value;
        const tVal = tos[i].value;
        if (fVal && tVal) {
          arrows.push({ from: fVal, to: tVal, order });
        }
      }
      onPayloadChange({ arrows });
    };

    wrap.querySelectorAll('select').forEach(s => s.addEventListener('change', updateMulti));
  } else if (kind === 'chain') {
    wrap.innerHTML = `
      <label class="form-label">Reaction cascade</label>
      <div style="margin-bottom:0.5rem; font-size:0.85rem; color:var(--text-secondary);">Step 1: Attack Arrow</div>
      <div class="fallback-arrow-row" style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.75rem;">
        <select id="step1-from" class="form-select" style="flex:1;">
          <option value="">-- From --</option>
          ${(stageConfig.anchors || []).map(a => `<option value="${a}">${a}</option>`).join('')}
        </select>
        <span class="fallback-arrow-glyph" style="color: var(--text-muted); font-family: var(--font-mono);" aria-hidden="true">&rarr;</span>
        <select id="step1-to" class="form-select" style="flex:1;">
          <option value="">-- To --</option>
          ${(stageConfig.anchors || []).map(a => `<option value="${a}">${a}</option>`).join('')}
        </select>
      </div>
      <div style="margin-bottom:0.5rem; font-size:0.85rem; color:var(--text-secondary);">Step 2: Departure Arrow</div>
      <div class="fallback-arrow-row" style="display:flex; gap:0.5rem; align-items:center;">
        <select id="step2-from" class="form-select" style="flex:1;">
          <option value="">-- From --</option>
          ${(stageConfig.anchors || []).map(a => `<option value="${a}">${a}</option>`).join('')}
        </select>
        <span class="fallback-arrow-glyph" style="color: var(--text-muted); font-family: var(--font-mono);" aria-hidden="true">&rarr;</span>
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
