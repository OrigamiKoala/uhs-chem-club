/**
 * crew-profile.js — Public crew member profile screen (#/crew/:playerId)
 * Purely read-only dossier; no stage history or hint stats (dignity rule §4.4).
 */

import { api } from '../api.js';
import { stage } from '../three/stage.js';
import { tierManager } from '../three/tier.js';
import { pageHeader, esc } from '../ui/layout.js';
import { renderRankPlate } from '../ui/rank-plate.js';
import { renderCommendationPlate } from '../ui/commendation-plate.js';
import { COMMENDATIONS_BY_ID } from '../progression/commendations.js';

export async function renderCrewProfile(container, params = {}) {
  if (stage.cameraRig && tierManager.currentTier !== 'T4') {
    stage.cameraRig.moveTo('comms');
  }

  const playerId = params.playerId;
  if (!playerId) {
    window.location.hash = '#/leaderboard';
    return;
  }

  const isT4 = tierManager.currentTier === 'T4';
  container.innerHTML = `
    <div class="${isT4 ? 'in-world-terminal m-screen m-profile' : 'screen-container m-screen m-profile'}" style="max-width: 780px;">
      <div style="padding: 2rem; text-align: center; font-family: var(--font-mono); color: var(--text-muted);">
        ACCESSING CREW ROSTER ARCHIVE...
      </div>
    </div>
  `;

  let profile;
  try {
    profile = await api.getProfile(playerId);
  } catch (err) {
    container.innerHTML = `
      <div class="${isT4 ? 'in-world-terminal m-screen m-profile' : 'screen-container m-screen m-profile'}" style="max-width: 780px;">
        <div style="padding: 2rem; text-align: center;">
          <h2 style="font-family: var(--font-display); color: var(--accent-red); margin-bottom: 1rem;">RECORD NOT FOUND</h2>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem;">The requested crew record could not be retrieved from the manifest.</p>
          <a href="#/leaderboard" class="btn-secondary" style="text-decoration: none;">Return to Standings</a>
        </div>
      </div>
    `;
    return;
  }

  let avatar = { suitColor: 'default', helmet: 'mark1', visor: 'gold', skin: 'medium' };
  try {
    if (profile.avatar_json) avatar = JSON.parse(profile.avatar_json);
  } catch (e) {}

  const headerMarkup = isT4 ? `
    <div class="terminal-header">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <a href="#/leaderboard" class="btn-secondary" style="font-size: 0.75rem; text-decoration: none; padding: 0.25rem 0.6rem;">&larr; STANDINGS</a>
        <h2 class="section-title" style="font-size: 1.15rem; margin: 0;">CREW DOSSIER</h2>
      </div>
      <button type="button" onclick="window.location.hash='#/leaderboard'" class="terminal-close-btn">CLOSE</button>
    </div>
  ` : pageHeader({
    art: '/art/comms.jpg',
    artAlt: '',
    title: 'Crew Dossier',
    actions: `<a href="#/leaderboard" class="btn-secondary" style="text-decoration: none;">&larr; Standings</a>`
  });

  const pinnedList = Array.isArray(profile.pinned_plates) ? profile.pinned_plates : [];
  const pinnedCards = pinnedList
    .map(id => COMMENDATIONS_BY_ID[id])
    .filter(Boolean)
    .map(comm => renderCommendationPlate(comm, { earned: true, showRoad: true }))
    .join('');

  const counts = profile.commendation_counts || { campaign: 0, craft: 0, learn: 0, crew: 0, season: 0 };
  const watchStreak = profile.watch?.streak || 1;

  container.innerHTML = `
    <div class="${isT4 ? 'in-world-terminal m-screen m-profile' : 'screen-container m-screen m-profile'}" style="max-width: 780px;">
      ${headerMarkup}

      <div class="holo-card" style="margin-bottom: 1.5rem; text-align: center; padding: 2rem 1.5rem;">
        <div class="quarters-avatar" style="width: 110px; height: 110px; margin: 0 auto 1.25rem; background: var(--plate-100); border: 1px solid var(--border-durasteel); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 2px 14px rgba(0,0,0,0.9);">
          <svg viewBox="0 0 100 100" width="80" height="80">
            <circle cx="50" cy="45" r="28" fill="#1f1d1a" stroke="#393430" stroke-width="2"/>
            <ellipse cx="50" cy="46" rx="20" ry="14" fill="${avatar.visor === 'gold' ? '#c39a63' : avatar.visor === 'green' ? '#6f8f3f' : '#9c5423'}" opacity="0.85"/>
            <path d="M 38 40 Q 50 36 62 40" stroke="rgba(233,224,208,0.25)" stroke-width="1.5" fill="none"/>
            <path d="M 22 90 Q 50 68 78 90 L 78 100 L 22 100 Z" fill="${(avatar.suitColor === 'fire' || avatar.suitColor === 'ignis') ? '#9c5423' : (avatar.suitColor === 'earth' || avatar.suitColor === 'terra') ? '#8a7148' : (avatar.suitColor === 'water' || avatar.suitColor === 'thalassa') ? '#3f7d76' : '#75818a'}"/>
          </svg>
        </div>

        <div class="nameplate-plate ${esc(profile.nameplate || 'default')}" style="display: inline-block; padding: 0.4rem 1.2rem; border-radius: 4px; margin-bottom: 0.5rem;">
          <div style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-bright); text-shadow: var(--engrave);">
            ${esc(profile.display_name)}
          </div>
        </div>

        <div style="display: flex; justify-content: center; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem;">
          <span class="eyebrow" style="color: var(--accent-amber);">${esc(profile.team_id ? profile.team_id.toUpperCase() : 'AVALON')} GUILD</span>
          ${profile.title ? `<span class="tag" style="background: var(--plate-200); border: 1px solid var(--accent-gold); color: var(--accent-gold); font-family: var(--font-mono); font-size: 0.75rem;">${esc(profile.title)}</span>` : ''}
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">&bull; Watch Streak: ${watchStreak} ${watchStreak === 1 ? 'week' : 'weeks'}</span>
        </div>

        <div style="display: flex; justify-content: center; margin-top: 0.75rem;">
          ${renderRankPlate(profile.level, profile.xp, { compact: false })}
        </div>
      </div>

      <!-- Pinned Plates -->
      <div class="holo-card" style="margin-bottom: 1.5rem;">
        <h3 class="section-title" style="font-size: 0.95rem; margin-bottom: 1rem; color: var(--accent-gold);">PINNED COMMENDATIONS</h3>
        ${pinnedCards ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem;">
            ${pinnedCards}
          </div>
        ` : `
          <p style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted); margin: 0;">No commendations pinned to active dress.</p>
        `}
      </div>

      <!-- Service Records (Totals) -->
      <div class="m-grid-1" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem;">
        <div class="holo-card" style="text-align: center; padding: 1rem 0.5rem;">
          <div style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 700; color: var(--accent-gold);">${counts.campaign}</div>
          <div class="eyebrow" style="font-size: 0.68rem; margin-top: 0.25rem;">Campaign</div>
        </div>
        <div class="holo-card" style="text-align: center; padding: 1rem 0.5rem;">
          <div style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 700; color: var(--accent-gold);">${counts.craft}</div>
          <div class="eyebrow" style="font-size: 0.68rem; margin-top: 0.25rem;">Craft</div>
        </div>
        <div class="holo-card" style="text-align: center; padding: 1rem 0.5rem;">
          <div style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 700; color: var(--accent-gold);">${counts.learn}</div>
          <div class="eyebrow" style="font-size: 0.68rem; margin-top: 0.25rem;">Learn</div>
        </div>
        <div class="holo-card" style="text-align: center; padding: 1rem 0.5rem;">
          <div style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 700; color: var(--accent-gold);">${counts.crew}</div>
          <div class="eyebrow" style="font-size: 0.68rem; margin-top: 0.25rem;">Crew</div>
        </div>
        <div class="holo-card" style="text-align: center; padding: 1rem 0.5rem;">
          <div style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 700; color: var(--accent-gold);">${profile.field_manual_count || 0}/20</div>
          <div class="eyebrow" style="font-size: 0.68rem; margin-top: 0.25rem;">Field Manual</div>
        </div>
      </div>
    </div>
  `;
}
