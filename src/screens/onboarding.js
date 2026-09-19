/**
 * onboarding.js — Step 2 & 3: Session Zero Scenes 2 & 3.
 *
 * Scene 2: Choose your Guild & Meet your Party.
 * Scene 3: The Oath (hold-to-commit) & The Roll (d20 cosmetic trinket issue).
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { showToast } from '../ui/toast.js';
import { stepRail, esc } from '../ui/layout.js';
import { playCinematic } from '../ui/cinematic.js';
import { soundscape } from '../audio/soundscape.js';
import { TRINKETS, getTrinketForRoll, getDeterministicRoll } from '../story/trinkets.js';
import { createTransmissionElement } from '../ui/transmission.js';

const TEAM_INFO = {
  earth: {
    title: 'Earth',
    guild: 'Mineral Mining Guild',
    accent: 'var(--team-earth)',
    mark: 'MM',
    pitch: '"Tear down the stone, pull the ore. High ground, heavy haul."',
    video: '/video/guild_mining.webm',
    poster: '/art/factions.jpg'
  },
  air: {
    title: 'Air',
    guild: 'Atmospheric Harvesters',
    accent: 'var(--team-air)',
    mark: 'AH',
    pitch: '"Ride the cloud tops. Thin air, light feet, quick moves."',
    video: '/video/guild_air.webm',
    poster: '/art/factions_fleet.jpg'
  },
  fire: {
    title: 'Fire',
    guild: 'Thermal Smelters',
    accent: 'var(--team-fire)',
    mark: 'TS',
    pitch: '"Tame the crucible. Iron in the blood, fire in the seams."',
    video: '/video/guild_fire.webm',
    poster: '/art/factions.jpg'
  },
  water: {
    title: 'Water',
    guild: 'Moisture Extraction',
    accent: 'var(--team-water)',
    mark: 'ME',
    pitch: '"Desert dawn collector rigs. Every drop counts double."',
    video: '/video/guild_water.webm',
    poster: '/art/hero_desert_outpost.jpg'
  }
};

const DEFAULT_TEAMS = [
  { team_id: 'earth', name: 'Earth', cap: 12, available: 12 },
  { team_id: 'air', name: 'Air', cap: 12, available: 12 },
  { team_id: 'fire', name: 'Fire', cap: 12, available: 12 },
  { team_id: 'water', name: 'Water', cap: 12, available: 12 }
];

const TEAM_ALIAS = { terra: 'earth', zephyr: 'air', ignis: 'fire', thalassa: 'water' };
const PROPER_NAMES = { earth: 'Earth', air: 'Air', fire: 'Fire', water: 'Water' };

function normalizeTeams(list) {
  if (!list || !Array.isArray(list) || list.length === 0) return DEFAULT_TEAMS;
  return list.map(t => {
    const tid = TEAM_ALIAS[String(t.team_id || '').toLowerCase()] || String(t.team_id || '').toLowerCase();
    return {
      ...t,
      team_id: tid,
      name: PROPER_NAMES[tid] || t.name || tid
    };
  });
}

export async function renderOnboarding(container) {
  // A player who already holds a guild slot has nothing to join. Sending them
  // on rather than drawing the picker is what keeps the join screen from
  // sitting over the bridge after an assignment that cannot happen.
  if (session.teamId) {
    container.innerHTML = '';
    window.location.hash = '#/bridge';
    return;
  }

  if (stage.cameraRig) {
    stage.cameraRig.moveTo('cockpit');
  }

  // The cold open is awaited, so the route can change underneath this render.
  // Anything drawn after that would be a screen the router never asked for and
  // never clears — it would sit on top of wherever the player actually went.
  const routeAtEntry = window.location.hash;
  const routeChanged = () => window.location.hash !== routeAtEntry;

  // Play Cold Open during onboarding
  if (!session.hasFlag('cinematic_cold_open')) {
    session.setFlag('cinematic_cold_open', true);
    await playCinematic('cold_open');
    if (routeChanged()) return;
  }

  let step = 2; // 2 = Guild Picker & Party, 3 = Oath & d20 Roll
  let selectedTeam = session.teamId || 'fire';
  let teamsData = normalizeTeams(session.teams && session.teams.length > 0 ? session.teams : DEFAULT_TEAMS);
  const rosterCache = new Map();
  let activeTransmission = null;
  let currentTransmissionMode = 'intro'; // 'intro' | 'guild'

  const VESS_INTRO_TEXT = "Quartermaster Vess here — I run crew logistics and keep this forty-year-old hauler flying through the black. Review the four rival guilds below, choose your crew, and report back to seal your oath.";

  // Determine user background from session or localStorage
  let userBg = session.player?.background || 'salvager';
  try {
    const bg = localStorage.getItem('avalon_pending_bg');
    if (bg) userBg = bg;
  } catch (e) {}

  async function fetchRoster(tid) {
    if (rosterCache.has(tid)) {
      if (selectedTeam === tid) updateRosterSection();
      return;
    }
    try {
      const res = await api.getTeamRoster(tid);
      if (res && Array.isArray(res.members)) {
        rosterCache.set(tid, res.members);
      } else {
        rosterCache.set(tid, []);
      }
    } catch (e) {
      if (!rosterCache.has(tid)) rosterCache.set(tid, []);
    }
    if (selectedTeam === tid) {
      updateRosterSection();
    }
  }

  function renderRosterListHtml(members) {
    if (!members) {
      return `
        <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted); padding: 0.5rem 0;">
          Syncing guild roster…
        </div>
      `;
    }
    if (members.length === 0) {
      return `
        <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted); padding: 0.5rem 0;">
          You are the first to report for this shift.
        </div>
      `;
    }
    return `
      <div class="party-roster-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;">
        ${members.slice(0, 8).map(m => {
          const trId = m.trinket || 'trinket_1';
          const trDef = TRINKETS.find(x => x.id === trId) || TRINKETS[0];
          return `
            <div style="display: flex; align-items: center; gap: 0.6rem; padding: 4px 8px; background: var(--plate-100); border: 1px solid var(--border-durasteel);">
              <span style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--accent-amber);">[+]</span>
              <div class="party-roster-name" style="overflow: hidden;">
                <div style="font-family: var(--font-display); font-size: 0.84rem; font-weight: 600; color: var(--text-bright); text-overflow: ellipsis; white-space: nowrap;">${esc(m.display_name)}</div>
                <div style="font-family: var(--font-mono); font-size: 0.62rem; color: var(--text-muted); text-overflow: ellipsis; white-space: nowrap;">${esc(trDef.name)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function updateRosterSection() {
    const activeMeta = TEAM_INFO[selectedTeam] || TEAM_INFO.fire;
    const members = rosterCache.get(selectedTeam);

    const titleEl = container.querySelector('#party-manifest-title');
    if (titleEl) titleEl.textContent = `YOUR PARTY · ${activeMeta.title.toUpperCase()} CREW`;

    const countEl = container.querySelector('#party-manifest-count');
    if (countEl) countEl.textContent = members ? `${members.length} Signed On` : 'Syncing…';

    const listEl = container.querySelector('#party-manifest-list');
    if (listEl) listEl.innerHTML = renderRosterListHtml(members);
  }

  function updateTransmissionButtons() {
    const btnIntro = container.querySelector('#btn-vess-intro');
    const btnGuild = container.querySelector('#btn-guild-briefing');
    const meta = TEAM_INFO[selectedTeam] || TEAM_INFO.fire;

    if (btnIntro) {
      const isIntro = currentTransmissionMode === 'intro';
      btnIntro.className = `tag ${isIntro ? 'live' : ''}`;
      btnIntro.style.borderColor = isIntro ? 'var(--accent-amber)' : 'var(--border-durasteel)';
      btnIntro.style.color = isIntro ? 'var(--accent-gold)' : 'var(--text-muted)';
    }
    if (btnGuild) {
      const isGuild = currentTransmissionMode === 'guild';
      btnGuild.className = `tag ${isGuild ? 'live' : ''}`;
      btnGuild.textContent = `GUILD BRIEFING · ${meta.title.toUpperCase()}`;
      btnGuild.style.borderColor = isGuild ? meta.accent : 'var(--border-durasteel)';
      btnGuild.style.color = isGuild ? 'var(--text-bright)' : 'var(--text-muted)';
    }
  }

  function selectGuild(tid) {
    if (tid === selectedTeam && currentTransmissionMode === 'guild') return;
    selectedTeam = tid;
    currentTransmissionMode = 'guild';
    soundscape.playToggleClack();

    const activeMeta = TEAM_INFO[selectedTeam] || TEAM_INFO.fire;

    // 1. Instant card selection update
    container.querySelectorAll('.team-card').forEach(btn => {
      const bTid = btn.getAttribute('data-team');
      const isSel = bTid === selectedTeam;
      btn.classList.toggle('selected', isSel);
      btn.setAttribute('aria-checked', String(isSel));
      const bMeta = TEAM_INFO[bTid] || {};
      btn.style.borderLeftColor = isSel ? bMeta.accent : '';
    });

    // 2. Instant transmission update
    if (activeTransmission) {
      activeTransmission.update({
        speaker: `VESS // ${activeMeta.title.toUpperCase()} BRIEFING`,
        badge: `${activeMeta.mark} · GUILD BRIEFING`,
        subtitle: activeMeta.guild.toUpperCase(),
        text: activeMeta.pitch,
        accentColor: activeMeta.accent
      });
    }
    updateTransmissionButtons();

    // 3. Instant roster update
    updateRosterSection();

    // 4. Background fetch if not in cache
    fetchRoster(selectedTeam);
  }

  function render() {
    if (step === 2) {
      renderScene2();
    } else {
      renderScene3();
    }
  }

  function renderScene2() {
    if (activeTransmission?.destroy) {
      activeTransmission.destroy();
      activeTransmission = null;
    }

    const activeMeta = TEAM_INFO[selectedTeam] || TEAM_INFO.fire;
    const members = rosterCache.get(selectedTeam);

    container.innerHTML = `
      <div class="screen-container m-screen m-onboarding" style="max-width: 760px;">
        <div class="m-topbar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
          ${stepRail(2)}
          <a href="#/bridge" id="skip-to-bridge-link" class="eyebrow m-skip" style="text-decoration: none; color: var(--text-muted);">Skip</a>
        </div>

        <div class="glass-panel">
          <!-- Guild Cards Grid -->
          <div role="radiogroup" aria-label="Guild" class="guild-grid"
               style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem;">
            ${teamsData.map(t => {
              const isFull = (t.available !== undefined && t.available <= 0);
              const isSelected = selectedTeam === t.team_id;
              const meta = TEAM_INFO[t.team_id] || { title: t.name, guild: '', accent: 'var(--accent-amber)', mark: '--' };

              return `
                <button type="button"
                     class="choice-option team-card ${isSelected ? 'selected' : ''} ${isFull ? 'disabled' : ''}"
                     role="radio"
                     aria-checked="${isSelected}"
                     ${isFull ? 'disabled aria-disabled="true"' : ''}
                     data-team="${t.team_id}"
                     style="flex-direction: column; align-items: flex-start; text-align: left; padding: 0.9rem; opacity: ${isFull ? 0.4 : 1}; cursor: ${isFull ? 'not-allowed' : 'pointer'}; ${isSelected ? `border-left-color: ${meta.accent};` : ''}">
                  <div class="m-head" style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 0.35rem;">
                    <span style="display: flex; align-items: baseline; gap: 0.4rem;">
                      <span aria-hidden="true" style="font-family: var(--font-mono); font-size: 0.68rem; color: ${meta.accent};">${meta.mark}</span>
                      <span style="font-family: var(--font-imperial); font-weight: 700; font-size: 0.96rem; letter-spacing: 0.14em; text-transform: uppercase; color: ${meta.accent}; text-shadow: var(--engrave);">${meta.title}</span>
                    </span>
                    <span class="tag ${isFull ? 'danger' : 'live'}" style="font-size: 0.58rem; padding: 2px 6px;">
                      ${isFull ? 'Full' : `${t.available ?? 12} open`}
                    </span>
                  </div>
                  <span class="eyebrow" style="font-size: 0.62rem; line-height: 1.2;">${meta.guild}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Party Manifest Roster -->
          <div id="party-manifest-card" class="m-subpanel" style="background: var(--plate-200); border: 1px solid var(--border-durasteel); padding: 1rem; margin-bottom: 1.5rem;">
            <div class="m-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; border-bottom: 1px solid var(--border-durasteel); padding-bottom: 0.4rem;">
              <span id="party-manifest-title" class="eyebrow lit">MEMBERS · ${activeMeta.title.toUpperCase()}</span>
              <span id="party-manifest-count" class="eyebrow">${members ? `${members.length} members` : 'Loading…'}</span>
            </div>
            <div id="party-manifest-list">
              ${renderRosterListHtml(members)}
            </div>
          </div>

          <div class="m-cta-row" style="display: flex; justify-content: flex-end;">
            <button type="button" id="proceed-to-oath-btn" class="btn-primary" ${!selectedTeam ? 'disabled' : ''}>
              Join Guild
            </button>
          </div>
        </div>
      </div>
    `;

    // Mount Vess transmission
    const initialText = currentTransmissionMode === 'intro' ? VESS_INTRO_TEXT : activeMeta.pitch;
    const initialSpeaker = currentTransmissionMode === 'intro' ? 'VESS // QUARTERMASTER' : `VESS // ${activeMeta.title.toUpperCase()} BRIEFING`;
    const initialBadge = currentTransmissionMode === 'intro' ? 'SCENE 02 · AVALON COMMS' : `${activeMeta.mark} · GUILD BRIEFING`;
    const initialSubtitle = currentTransmissionMode === 'intro' ? 'STATION: SALVAGE HAULER AVALON // CREW LOGISTICS' : activeMeta.guild.toUpperCase();
    const initialAccent = currentTransmissionMode === 'intro' ? 'var(--accent-amber)' : activeMeta.accent;

    activeTransmission = createTransmissionElement({
      speaker: initialSpeaker,
      badge: initialBadge,
      subtitle: initialSubtitle,
      text: initialText,
      variant: 'hero',
      accentColor: initialAccent
    });
    container.querySelector('#onboarding-transmission-slot')?.appendChild(activeTransmission.element);

    container.querySelector('#skip-to-bridge-link')?.addEventListener('click', () => {
      if (activeTransmission?.destroy) activeTransmission.destroy();
    });

    container.querySelector('#btn-vess-intro')?.addEventListener('click', () => {
      currentTransmissionMode = 'intro';
      soundscape.playToggleClack();
      if (activeTransmission) {
        activeTransmission.update({
          speaker: 'VESS // QUARTERMASTER',
          badge: 'SCENE 02 · AVALON COMMS',
          subtitle: 'STATION: SALVAGE HAULER AVALON // CREW LOGISTICS',
          text: VESS_INTRO_TEXT,
          accentColor: 'var(--accent-amber)'
        });
      }
      updateTransmissionButtons();
    });

    container.querySelector('#btn-guild-briefing')?.addEventListener('click', () => {
      currentTransmissionMode = 'guild';
      soundscape.playToggleClack();
      const meta = TEAM_INFO[selectedTeam] || TEAM_INFO.fire;
      if (activeTransmission) {
        activeTransmission.update({
          speaker: `VESS // ${meta.title.toUpperCase()} BRIEFING`,
          badge: `${meta.mark} · GUILD BRIEFING`,
          subtitle: meta.guild.toUpperCase(),
          text: meta.pitch,
          accentColor: meta.accent
        });
      }
      updateTransmissionButtons();
    });

    container.querySelector('#btn-cold-open')?.addEventListener('click', () => {
      playCinematic('cold_open');
    });

    container.querySelectorAll('.team-card:not(.disabled)').forEach(el => {
      el.addEventListener('click', () => {
        const tid = el.getAttribute('data-team');
        selectGuild(tid);
      });
    });

    container.querySelector('#proceed-to-oath-btn')?.addEventListener('click', () => {
      step = 3;
      render();
    });
  }

  // Background prefetch rosters for all guilds
  ['earth', 'air', 'fire', 'water'].forEach(tid => fetchRoster(tid));

  function renderScene3() {
    if (activeTransmission?.destroy) {
      activeTransmission.destroy();
      activeTransmission = null;
    }

    const activeMeta = TEAM_INFO[selectedTeam] || TEAM_INFO.fire;
    const seed = session.player?.player_id || session.player?.display_name || 'novice_crew';
    const roll = getDeterministicRoll(seed);
    const awardedTrinket = getTrinketForRoll(roll);

    container.innerHTML = `
      <div class="screen-container m-screen m-onboarding m-oath" style="max-width: 620px;">
        <div class="m-topbar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
          ${stepRail(3)}
          <a href="#/bridge" id="skip-to-bridge-link-3" class="eyebrow m-skip" style="text-decoration: none; color: var(--text-muted);">Skip</a>
        </div>

        <div class="glass-panel">
          <!-- Hold-to-Commit Keycap -->
          <div id="oath-section" class="oath-section" style="text-align: center; margin: 1.5rem 0 2rem;">
            <div class="eyebrow" style="margin-bottom: 0.8rem;">HOLD TO CONFIRM</div>
            <div style="position: relative; max-width: 260px; margin: 0 auto;">
              <button type="button" id="hold-oath-btn" class="btn-primary" style="width: 100%; padding: 16px 0; font-size: 1.1rem; letter-spacing: 0.18em; position: relative; overflow: hidden;">
                <span id="hold-fill-bar" style="position: absolute; inset: 0; background: rgba(255,255,255,0.22); width: 0%; transition: width 0.05s linear;"></span>
                <span style="position: relative; z-index: 2;">CONFIRM</span>
              </button>
            </div>
          </div>

          <!-- Item Roll (Revealed after hold) -->
          <div id="roll-section" class="hidden roll-section" style="text-align: center; padding: 1.5rem 0;">
            <div class="eyebrow lit" style="margin-bottom: 1rem;">STARTER ITEM</div>

            <!-- CSS 3D Die Container -->
            <div class="die-stage" style="perspective: 600px; width: 100px; height: 100px; margin: 0 auto 1.5rem;">
              <div id="d20-cube" class="die-cube rolling" style="width: 80px; height: 80px; margin: 10px auto; background: var(--plate-200); border: 2px solid var(--accent-amber); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(0,0,0,0.8);">
                <span id="d20-value" style="font-family: var(--font-mono); font-size: 2rem; font-weight: 700; color: var(--accent-amber);">?</span>
              </div>
            </div>

            <!-- Trinket Reveal Card -->
            <div id="trinket-reveal-card" class="hidden m-subpanel" style="text-align: left; background: var(--plate-200); border: 1px solid var(--border-durasteel); border-left: 2px solid ${awardedTrinket.rarity === 'rare' ? 'var(--accent-gold)' : 'var(--accent-amber)'}; padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
              <div class="m-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <span class="eyebrow" style="color: ${awardedTrinket.rarity === 'rare' ? 'var(--accent-gold)' : 'var(--text-muted)'};">${awardedTrinket.rarity.toUpperCase()}</span>
              </div>
              <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-bright); margin-bottom: 0.35rem;">
                ${awardedTrinket.name}
              </h3>
            </div>

            <button type="button" id="launch-cta-btn" class="btn-primary hidden" style="width: 100%; padding: 12px 0;">
              Continue to Bridge
            </button>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#skip-to-bridge-link-3')?.addEventListener('click', () => {
      if (activeTransmission?.destroy) activeTransmission.destroy();
    });

    // Hold-to-commit handler
    const holdBtn = container.querySelector('#hold-oath-btn');
    const fillBar = container.querySelector('#hold-fill-bar');
    const oathSection = container.querySelector('#oath-section');
    const rollSection = container.querySelector('#roll-section');

    let holdStart = 0;
    let holdTimer = null;

    function startHold() {
      holdStart = Date.now();
      soundscape.playKeyCapThunk();
      holdTimer = setInterval(() => {
        const elapsed = Date.now() - holdStart;
        const pct = Math.min(100, (elapsed / 1000) * 100);
        if (fillBar) fillBar.style.width = `${pct}%`;

        if (pct >= 100) {
          clearInterval(holdTimer);
          holdTimer = null;
          soundscape.playBondSnap();
          oathSection.classList.add('hidden');
          rollSection.classList.remove('hidden');
          triggerD20Roll();
        }
      }, 30);
    }

    function cancelHold() {
      if (holdTimer) {
        clearInterval(holdTimer);
        holdTimer = null;
      }
      if (fillBar) fillBar.style.width = '0%';
    }

    holdBtn.addEventListener('mousedown', startHold);
    holdBtn.addEventListener('touchstart', startHold, { passive: true });
    window.addEventListener('mouseup', cancelHold);
    window.addEventListener('touchend', cancelHold);

    function triggerD20Roll() {
      const valEl = container.querySelector('#d20-value');
      const dieCube = container.querySelector('#d20-cube');
      const trinketCard = container.querySelector('#trinket-reveal-card');
      const launchBtn = container.querySelector('#launch-cta-btn');

      let ticks = 0;
      const rollInterval = setInterval(() => {
        ticks++;
        soundscape.playToggleClack();
        if (valEl) valEl.textContent = String(Math.floor(Math.random() * 20) + 1);

        if (ticks >= 14) {
          clearInterval(rollInterval);
          dieCube.classList.remove('rolling');
          if (valEl) valEl.textContent = String(roll);
          soundscape.playPylonWake();

          trinketCard.classList.remove('hidden');
          launchBtn.classList.remove('hidden');

          if (activeTransmission) {
            activeTransmission.update({
              speaker: 'VESS // QUARTERMASTER',
              badge: 'AWARD CONFIRMED',
              subtitle: 'QUARTERMASTER CRATE // ISSUE DRAWN',
              text: '"Quartermaster crate unsealed. You earned this."'
            });
          }
        }
      }, 80);

      launchBtn.addEventListener('click', async () => {
        // The screen goes whatever the answer is. Leaving it up after a refused
        // assignment stranded the player on a picker that could do nothing.
        const leave = () => {
          if (activeTransmission?.destroy) activeTransmission.destroy();
          activeTransmission = null;
          container.innerHTML = '';
          if (window.location.hash === '#/bridge') {
            window.dispatchEvent(new HashChangeEvent('hashchange'));
          } else {
            window.location.hash = '#/bridge';
          }
        };

        if (activeTransmission?.destroy) activeTransmission.destroy();
        launchBtn.disabled = true;
        launchBtn.textContent = 'Launching…';

        // The slot may have been claimed on another device since this screen
        // was drawn. Asking again would only earn an ALREADY_ASSIGNED.
        if (session.teamId) {
          leave();
          return;
        }

        try {
          const res = await api.claimTeam(selectedTeam, {
            suitColor: selectedTeam,
            helmet: 'mark1',
            visor: 'gold',
            skin: 'medium'
          }, userBg, awardedTrinket.id);

          session.setUserData(res, { trustXp: false });
          session.setFlag('sessionZeroDone', true);

          // Play launch cinematic
          await playCinematic('launch');
          leave();
        } catch (err) {
          if (err?.code === 'ALREADY_ASSIGNED') {
            // The server knows the guild this player is on and the client does
            // not. Pull it, so the bridge opens on the right livery.
            try {
              const me = await api.getMe();
              session.setUserData(me);
            } catch (e) {}
            session.setFlag('sessionZeroDone', true);
            showToast('You are already signed on to a guild.', 'info');
          } else {
            showToast(err.message || 'Error saving assignment.', 'error');
          }
          leave();
        }
      });
    }
  }

  // Cleanup active transmission when navigating away
  const onRouteCleanup = () => {
    if (activeTransmission?.destroy) activeTransmission.destroy();
    window.removeEventListener('hashchange', onRouteCleanup);
  };
  window.addEventListener('hashchange', onRouteCleanup);

  render();
}
