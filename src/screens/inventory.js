/**
 * inventory.js — Cargo Hold & Spice Manifest screen (Star Wars / Dune freight bay)
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { showToast } from '../ui/toast.js';

export function renderInventory(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('cargo');
  }

  let inventory = session.inventory || [];

  const ITEM_CATALOG = {
    hint_chip: { name: 'Scanner Logic Core', flavor: 'Decompiled deep-space sensor telemetry module.', rarity: 'common', effect: 'Free chemical sensor hint' },
    spare_coolant: { name: 'Cryo-Coolant Canister', flavor: 'Heavy insulated freon containment vessel.', rarity: 'common', effect: 'Restores one failed synthesis attempt' },
    overclock_module: { name: 'Smelter Overclock Unit', flavor: 'Bypasses catalyst thermal governors.', rarity: 'rare', effect: '×1.25 XP surge on active quest' },
    deflector_plate: { name: 'Ablative Durasteel Shield', flavor: 'Reinforced plating with anti-dust seal.', rarity: 'rare', effect: 'Negates adverse environmental event' },
    scanner_upgrade: { name: 'Spectrographic Sensor Array', flavor: 'Optical diffraction lens for charge analysis.', rarity: 'rare', effect: 'Unlocks numeric electron density data' },
    star_chart: { name: 'Smuggler Star Route Map', flavor: 'Worn navigational holocron of old mining routes.', rarity: 'epic', effect: 'Bypass single stage at half XP' },
    resonance_key: { name: 'Spice Resonance Matrix', flavor: 'Vibrating crystal matrix attuned to guild vaults.', rarity: 'epic', effect: 'Instantaneous +50 XP surge' }
  };

  function render() {
    container.innerHTML = `
      <div class="screen-container">
        <div class="glass-panel" style="margin-bottom: 1.5rem; border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.94);">
          <!-- Cargo Bay Banner -->
          <div style="position: relative; border-radius: 2px; overflow: hidden; margin-bottom: 1.25rem; border: 1px solid var(--border-durasteel); height: 140px;">
            <img src="/art/cargo.jpg" alt="Cargo Hold" style="width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) brightness(0.85);" />
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 20%, rgba(12, 13, 17, 0.9) 100%);"></div>
            <div style="position: absolute; bottom: 8px; left: 12px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-amber); letter-spacing: 0.12em;">
              [ CARGO HOLD // SPICE FREIGHT BAY // SEC-04 ]
            </div>
            <div style="position: absolute; bottom: 8px; right: 12px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-green);">
              ● GANTRY CRANE OPERATIONAL
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h2 style="font-family: var(--font-imperial); font-size: 1.6rem; letter-spacing: 0.12em; color: #fffdf7; margin-bottom: 0.2rem;">
                Cargo Bay & Gear Manifest
              </h2>
              <p style="font-family: var(--font-main); font-size: 0.9rem; color: var(--text-secondary);">
                Tactical hardware canisters, chemical catalysts, and field survival consumables.
              </p>
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--accent-amber); padding: 4px 10px; background: #111318; border: 1px solid var(--border-durasteel); border-radius: var(--radius-sm);">
              CAPACITY: ${inventory.length} / 8 SLOTS
            </div>
          </div>
        </div>

        ${inventory.length === 0 ? `
          <div class="glass-panel" style="text-align: center; padding: 3.5rem 1.5rem; border-color: var(--border-durasteel); background: rgba(18, 20, 26, 0.94);">
            <div style="font-size: 2.5rem; margin-bottom: 0.8rem; filter: grayscale(0.5);">📦</div>
            <h3 style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; color: #fffdf7; margin-bottom: 0.5rem;">
              Cargo Hold Depleted
            </h3>
            <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 440px; margin: 0 auto 1.5rem; font-family: var(--font-main);">
              No active modules or spice canisters in storage. Gear is salvaged by completing planetary synthesis quests and surviving regional events.
            </p>
            <a href="#/starmap" class="btn-primary" style="text-decoration: none;">
              Deploy to Sector Quests
            </a>
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
            ${inventory.map(inv => {
              const def = ITEM_CATALOG[inv.item_id] || { name: inv.item_id, flavor: 'Consumable module', rarity: 'common', effect: 'Consumable' };
              const rarityColor = def.rarity === 'epic' ? 'var(--accent-amber)' : def.rarity === 'rare' ? 'var(--accent-gold)' : 'var(--text-secondary)';
              return `
                <div class="holo-card" style="border-color: ${rarityColor}; background: #14161c;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <div>
                      <span style="font-family: var(--font-mono); font-size: 0.65rem; text-transform: uppercase; color: ${rarityColor}; letter-spacing: 0.12em;">
                        [ ${def.rarity.toUpperCase()} MODULE ]
                      </span>
                      <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; color: #fffdf7; margin-top: 0.2rem;">
                        ${def.name}
                      </h3>
                    </div>
                    <span class="xp-badge" style="font-size: 0.8rem; font-weight: bold; color: var(--accent-amber);">
                      x${inv.qty}
                    </span>
                  </div>

                  <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.45; font-family: var(--font-main);">
                    ${def.flavor}
                  </p>

                  <div style="background: #111317; border: 1px solid var(--border-durasteel); border-radius: var(--radius-sm); padding: 8px 12px; font-size: 0.75rem; color: var(--accent-amber); margin-bottom: 1.25rem; font-family: var(--font-mono);">
                    <strong>EFFECT:</strong> ${def.effect}
                  </div>

                  <button type="button" class="btn-primary use-item-btn" data-item-id="${inv.item_id}" style="width: 100%; font-size: 0.8rem; padding: 8px 16px;">
                    Deploy Module
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
        btn.textContent = 'Deploying...';

        try {
          const res = await api.useItem(itemId);
          showToast(res.effect?.message || 'Module deployed.', 'success');
          const me = await api.getMe();
          session.setUserData(me);
          inventory = me.inventory || [];
          render();
        } catch (err) {
          showToast(err.message || 'Deployment failed', 'error');
          btn.disabled = false;
          btn.textContent = 'Deploy Module';
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
