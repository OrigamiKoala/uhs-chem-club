/**
 * inventory.js — Cargo Hold and Item Consumption screen
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { showToast } from '../ui/toast.js';

export async function renderInventory(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('cargo');
  }

  let inventory = [];
  try {
    const me = await api.getMe();
    session.setUserData(me);
    inventory = me.inventory || [];
  } catch (e) {}

  const ITEM_CATALOG = {
    hint_chip: { name: 'Hint Chip', flavor: 'Decompiled scanner diagnostic module.', rarity: 'common', effect: 'Free sensor hint' },
    spare_coolant: { name: 'Spare Coolant', flavor: 'Cryogenic reserve canister.', rarity: 'common', effect: 'Restores one lost attempt' },
    overclock_module: { name: 'Overclock Module', flavor: 'Bypasses standard safety thresholds.', rarity: 'rare', effect: '×1.25 XP on one quest' },
    deflector_plate: { name: 'Deflector Plate', flavor: 'Ablative particle shield segment.', rarity: 'rare', effect: 'Negates one bad team event' },
    scanner_upgrade: { name: 'Scanner Upgrade', flavor: 'Wideband spectrographic lens.', rarity: 'rare', effect: 'Unlocks numeric density telemetry' },
    star_chart: { name: 'Star Chart', flavor: 'Navigational survey of abandoned sectors.', rarity: 'epic', effect: 'Skip one stage at half XP' },
    resonance_key: { name: 'Resonance Key', flavor: 'Vibrating crystal matrix attuned to alien locks.', rarity: 'epic', effect: 'Direct +50 XP surge' }
  };

  function render() {
    container.innerHTML = `
      <div class="screen-container">
        <div class="glass-panel" style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h2 class="holo-title" style="margin-bottom: 0;">Inventory</h2>
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--accent-amber);">
              Capacity: ${inventory.length} / 8
            </div>
          </div>
        </div>

        ${inventory.length === 0 ? `
          <div class="glass-panel" style="text-align: center; padding: 3rem 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 1rem;">📦</div>
            <h3 style="font-family: var(--font-display); font-size: 1.25rem; color: #fff; margin-bottom: 0.5rem;">No Items</h3>
            <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 420px; margin: 0 auto 1.5rem;">
              Items are earned by completing quests and events.
            </p>
            <a href="#/starmap" class="btn-primary" style="text-decoration: none;">View Quests</a>
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
            ${inventory.map(inv => {
              const def = ITEM_CATALOG[inv.item_id] || { name: inv.item_id, flavor: 'Consumable item', rarity: 'common', effect: 'Consumable' };
              const rarityColor = def.rarity === 'epic' ? 'var(--accent-purple)' : def.rarity === 'rare' ? 'var(--accent-cyan)' : 'var(--text-secondary)';
              return `
                <div class="holo-card" style="border-color: ${rarityColor};">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <div>
                      <span style="font-family: var(--font-mono); font-size: 0.65rem; text-transform: uppercase; color: ${rarityColor}; letter-spacing: 0.1em;">
                        ${def.rarity.toUpperCase()}
                      </span>
                      <h3 style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; color: #fff; margin-top: 0.2rem;">
                        ${def.name}
                      </h3>
                    </div>
                    <span class="xp-badge" style="font-size: 0.8rem; font-weight: bold; color: var(--accent-amber);">
                      x${inv.qty}
                    </span>
                  </div>

                  <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.5;">
                    ${def.flavor}
                  </p>

                  <div style="background: rgba(3, 7, 18, 0.6); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 8px 12px; font-size: 0.75rem; color: var(--accent-cyan); margin-bottom: 1.25rem;">
                    <strong>EFFECT:</strong> ${def.effect}
                  </div>

                  <button type="button" class="btn-primary use-item-btn" data-item-id="${inv.item_id}" style="width: 100%; font-size: 0.8rem; padding: 8px 16px;">
                    Use Item
                  </button>
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
          showToast(res.effect?.message || 'Item activated.', 'success');
          const me = await api.getMe();
          session.setUserData(me);
          inventory = me.inventory || [];
          render();
        } catch (err) {
          showToast(err.message || 'Activation failed', 'error');
          btn.disabled = false;
          btn.textContent = 'Use Item';
        }
      });
    });
  }

  render();
}
