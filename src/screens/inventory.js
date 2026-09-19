/**
 * inventory.js — Cargo Hold & Spice Manifest screen (Star Wars / Dune freight bay)
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { tierManager } from '../three/tier.js';
import { showToast } from '../ui/toast.js';
import { pageHeader, emptyState, esc } from '../ui/layout.js';

export function renderInventory(container) {
  if (stage.cameraRig && tierManager.currentTier !== 'T4') {
    stage.cameraRig.moveTo('cargo');
  }

  const isT4 = tierManager.currentTier === 'T4';
  let inventory = session.inventory || [];

  // `usable` marks the items that actually do something today. The rest are trophies —
  // saying so is better than a Deploy button that promises an effect and delivers nothing.
  const ITEM_CATALOG = {
    resonance_key: { name: 'Resonance Matrix', rarity: 'epic', usable: true, effect: '+50 XP on use.' },
    hint_chip: { name: 'Logic Core', rarity: 'common', usable: false, effect: 'Item.' },
    spare_coolant: { name: 'Cryo-Coolant', rarity: 'common', usable: false, effect: 'Item.' },
    overclock_module: { name: 'Overclock Unit', rarity: 'rare', usable: false, effect: 'Item.' },
    deflector_plate: { name: 'Durasteel Shield', rarity: 'rare', usable: false, effect: 'Item.' },
    scanner_upgrade: { name: 'Sensor Array', rarity: 'rare', usable: false, effect: 'Item.' },
    star_chart: { name: 'Star Route Map', rarity: 'epic', usable: false, effect: 'Item.' }
  };

  function render() {
    const trinketData = session.player?.trinket || session.trinket || null;

    const terminalHeader = isT4 ? `
      <div class="terminal-header">
        <div>
          <h2 class="section-title" style="font-size: 1.15rem; margin-top: 2px;">INVENTORY</h2>
        </div>
        <button type="button" id="close-inv-terminal-btn" class="terminal-close-btn">CLOSE</button>
      </div>
    ` : pageHeader({
      art: '/art/cargo.jpg',
      video: '/video/cargo_loop.webm',
      artAlt: '',
      title: 'Inventory',
      actions: `<span class="tag">${inventory.length} / 8 slots</span>`
    });

    container.innerHTML = `
      <div class="${isT4 ? 'in-world-terminal inventory-terminal' : 'screen-container m-screen m-inventory'}">
        ${terminalHeader}

        ${trinketData ? `
          <div class="glass-panel inv-locker" style="margin-bottom: 1.5rem; padding: 1.1rem 1.25rem; border-left: 2px solid var(--accent-gold);">
            <div class="m-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
              <span class="eyebrow lit" style="color: var(--accent-gold);">STARTER TRINKET</span>
            </div>
            <div style="display: flex; gap: 1.2rem; align-items: center; flex-wrap: wrap;">
              <div style="font-family: var(--font-mono); font-size: 1.1rem; color: var(--accent-gold); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: var(--plate-300); border: 1px solid var(--border-durasteel);">
                #${trinketData.roll || '20'}
              </div>
              <div class="inv-locker-text" style="flex: 1; min-width: 200px;">
                <div style="font-family: var(--font-display); font-size: 1.05rem; font-weight: 600; color: var(--text-bright); text-transform: uppercase; letter-spacing: 0.1em;">
                  ${esc(trinketData.name)}
                </div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">
                  ${esc(trinketData.desc)}
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        ${inventory.length === 0 ? `
          ${emptyState({
            icon: '[ ]',
            title: 'No items',
            body: 'Complete stages to earn items.',
            action: '<a href="#/quest" class="btn-primary" style="text-decoration: none;">Stages</a>'
          })}
        ` : `
          <div class="m-grid-1 inv-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
            ${inventory.map(inv => {
              const def = ITEM_CATALOG[inv.item_id] || { name: inv.item_id, rarity: 'common', effect: 'Item.', usable: false };
              const rarityColor = def.rarity === 'epic' ? 'var(--accent-amber)' : def.rarity === 'rare' ? 'var(--accent-gold)' : 'var(--text-muted)';
              return `
                <div class="holo-card inv-card" style="${def.usable ? 'border-left: 2px solid var(--accent-amber);' : ''} display: flex; flex-direction: column;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.9rem;">
                    <div class="inv-card-title">
                      <span class="eyebrow" style="color: ${rarityColor};">${def.rarity}</span>
                      <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-bright); margin-top: 0.3rem; text-shadow: var(--engrave);">
                        ${def.name}
                      </h3>
                    </div>
                    <span class="tag">x${inv.qty}</span>
                  </div>

                  <div style="font-family: var(--font-mono); font-size: 0.74rem; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 1.25rem;">
                    ${def.effect}
                  </div>

                  <div style="margin-top: auto;">
                    ${def.usable ? `
                      <button type="button" class="btn-primary use-item-btn m-tap" data-item-id="${inv.item_id}" style="width: 100%; font-size: 0.7rem; padding: 9px 16px; min-height: 38px;">
                        Use
                      </button>
                    ` : `
                      <div class="eyebrow" style="text-align: center; padding: 10px 0;">Item</div>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    container.querySelectorAll('.use-item-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const itemId = btn.getAttribute('data-item-id');
        btn.disabled = true;
        btn.textContent = 'Using…';

        try {
          const res = await api.useItem(itemId);
          showToast(res.effect?.message || 'Item used.', 'success');
          const me = await api.getMe();
          session.setUserData(me);
          inventory = me.inventory || [];
          render();
        } catch (err) {
          showToast(err.message || 'Use item failed.', 'error');
          btn.disabled = false;
          btn.textContent = 'Use';
        }
      });
    });

    container.querySelector('#close-inv-terminal-btn')?.addEventListener('click', () => {
      const term = container.querySelector('.in-world-terminal');
      if (term) term.style.display = 'none';
    });
  }

  render();

  api.getMe().then(me => {
    if (me) {
      session.setUserData(me);
      inventory = me.inventory || [];
      if (container.querySelector('.glass-panel')) {
        render();
      }
    }
  }).catch(() => {});
}
