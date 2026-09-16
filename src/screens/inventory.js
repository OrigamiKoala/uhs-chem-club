/**
 * inventory.js — Cargo Hold & Spice Manifest screen (Star Wars / Dune freight bay)
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { showToast } from '../ui/toast.js';
import { pageHeader, emptyState } from '../ui/layout.js';

export function renderInventory(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('cargo');
  }

  let inventory = session.inventory || [];

  // `usable` marks the items that actually do something today. The rest are trophies —
  // saying so is better than a Deploy button that promises an effect and delivers nothing.
  const ITEM_CATALOG = {
    resonance_key: { name: 'Spice Resonance Matrix', rarity: 'epic', usable: true, effect: 'Deploy for +50 XP.' },
    hint_chip: { name: 'Logic Core', rarity: 'common', usable: false, effect: 'Trophy.' },
    spare_coolant: { name: 'Cryo-Coolant Canister', rarity: 'common', usable: false, effect: 'Trophy.' },
    overclock_module: { name: 'Smelter Overclock Unit', rarity: 'rare', usable: false, effect: 'Trophy.' },
    deflector_plate: { name: 'Ablative Durasteel Shield', rarity: 'rare', usable: false, effect: 'Trophy.' },
    scanner_upgrade: { name: 'Sensor Array', rarity: 'rare', usable: false, effect: 'Trophy.' },
    star_chart: { name: 'Smuggler Star Route Map', rarity: 'epic', usable: false, effect: 'Trophy.' }
  };

  function render() {
    container.innerHTML = `
      <div class="screen-container">
        ${pageHeader({
          art: '/art/cargo.jpg',
          artAlt: '',
          eyebrow: 'Cargo manifest',
          title: 'Inventory',
          actions: `<span class="tag">${inventory.length} / 8 slots</span>`
        })}

        ${inventory.length === 0 ? `
          ${emptyState({
            icon: '[ ]',
            title: 'Hold empty',
            body: 'Finish Sector 01.',
            action: '<a href="#/quest" class="btn-primary" style="text-decoration: none;">Sector 01</a>'
          })}
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
            ${inventory.map(inv => {
              const def = ITEM_CATALOG[inv.item_id] || { name: inv.item_id, rarity: 'common', effect: 'Trophy.', usable: false };
              const rarityColor = def.rarity === 'epic' ? 'var(--accent-amber)' : def.rarity === 'rare' ? 'var(--accent-gold)' : 'var(--text-muted)';
              return `
                <div class="holo-card" style="${def.usable ? 'border-left: 2px solid var(--accent-amber);' : ''} display: flex; flex-direction: column;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.9rem;">
                    <div>
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
                      <button type="button" class="btn-primary use-item-btn" data-item-id="${inv.item_id}" style="width: 100%; font-size: 0.7rem; padding: 9px 16px; min-height: 38px;">
                        Deploy
                      </button>
                    ` : `
                      <div class="eyebrow" style="text-align: center; padding: 10px 0;">Trophy</div>
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
        btn.textContent = 'Deploying…';

        try {
          const res = await api.useItem(itemId);
          showToast(res.effect?.message || 'Deployed.', 'success');
          const me = await api.getMe();
          session.setUserData(me);
          inventory = me.inventory || [];
          render();
        } catch (err) {
          showToast(err.message || 'Deployment failed.', 'error');
          btn.disabled = false;
          btn.textContent = 'Deploy';
        }
      });
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
