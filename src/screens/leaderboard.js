/**
 * leaderboard.js — Club standings: Guilds, Crew, Your Guild, This Week.
 * Top 25 + neighbourhood (D2), dignity-preserving display, loadout chips, movement indicator.
 */

import { api } from '../api.js';
import { session } from '../session.js';
import { stage } from '../three/stage.js';
import { tierManager } from '../three/tier.js';
import { pageHeader, esc } from '../ui/layout.js';
import { COMMENDATIONS_BY_ID } from '../progression/commendations.js';

const TEAM_ACCENTS = {
  earth: 'var(--team-earth)',
  air: 'var(--team-air)',
  fire: 'var(--team-fire)',
  water: 'var(--team-water)'
};

const PROPER = { earth: 'Earth', air: 'Air', fire: 'Fire', water: 'Water' };

export async function renderLeaderboard(container) {
  if (stage.cameraRig && tierManager.currentTier !== 'T4') {
    stage.cameraRig.moveTo('comms');
  }

  const isT4 = tierManager.currentTier === 'T4';
  let activeTab = 'teams'; // 'teams' | 'crew' | 'guild' | 'week'
  let cachedData = {
    teams: null,
    crew: null,
    guild: null,
    week: null
  };
  let loading = true;
  let failed = false;
  let rankMovement = null;

  function computeMovement(myRank) {
    if (!myRank || typeof myRank.rank !== 'number') return null;
    const prev = parseInt(localStorage.getItem('avalon_last_rank'), 10);
    let movement = null;
    if (!isNaN(prev)) {
      const diff = prev - myRank.rank;
      if (diff > 0) movement = `+${diff} since last visit`;
      else if (diff < 0) movement = `${diff} since last visit`;
      else movement = 'Unchanged';
    }
    localStorage.setItem('avalon_last_rank', String(myRank.rank));
    return movement;
  }

  function render() {
    const data = cachedData[activeTab];
    const hasData = data && ((data.teams || []).length > 0 || (data.individual || []).length > 0 || (data.fullIndividual || []).length > 0);

    const tabsConfig = [
      { id: 'teams', label: 'Guilds' },
      { id: 'crew', label: 'Crew' },
      { id: 'guild', label: 'Your Guild' },
      { id: 'week', label: 'This Week' }
    ];

    const tabButtonsMarkup = (isSmall) => tabsConfig.map(t => `
      <button type="button" id="tab-${t.id}" role="tab" aria-selected="${activeTab === t.id}"
              class="btn-chip ${activeTab === t.id ? 'active' : ''}"
              style="font-size: ${isSmall ? '0.74rem' : '0.82rem'}; padding: ${isSmall ? '6px 12px' : '8px 16px'}; font-weight: 700;">
        ${t.label}
      </button>
    `).join('');

    const terminalHeaderMarkup = isT4 ? `
      <div class="terminal-header">
        <div>
          <h2 class="section-title" style="font-size: 1.15rem; margin-top: 2px;">STANDINGS</h2>
        </div>
        <button type="button" id="close-comms-terminal-btn" class="terminal-close-btn">CLOSE</button>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; flex-wrap: wrap; gap: 0.5rem;">
        <div class="lb-tabs" style="display: flex; gap: 0.4rem; flex-wrap: wrap;" role="tablist" aria-label="Standings view">
          ${tabButtonsMarkup(true)}
        </div>
        ${rankMovement ? `<div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-gold);">${esc(rankMovement)}</div>` : ''}
      </div>
    ` : pageHeader({
      art: '/art/comms.jpg',
      video: '/video/comms_loop.webm',
      artAlt: 'Comms array',
      title: 'Standings',
      actions: `
        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
          ${rankMovement ? `<span style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--accent-gold);">${esc(rankMovement)}</span>` : ''}
          <div class="lb-tabs" style="display: flex; gap: 0.4rem; flex-wrap: wrap;" role="tablist" aria-label="Standings view">
            ${tabButtonsMarkup(false)}
          </div>
        </div>
      `
    });

    container.innerHTML = `
      <div class="${isT4 ? 'in-world-terminal comms-terminal m-screen m-leaderboard' : 'screen-container m-screen m-leaderboard'}">
        ${terminalHeaderMarkup}

        ${loading && !hasData ? `
          <div class="glass-panel empty-state">
            <div class="empty-icon" aria-hidden="true">///</div>
            <div style="font-family: var(--font-mono); letter-spacing: 0.16em; color: var(--accent-amber);">Connecting to Comms Relay…</div>
          </div>
        ` : failed && !hasData ? `
          <div class="glass-panel empty-state">
            <div class="empty-icon" aria-hidden="true">///</div>
            <h2 class="section-title">Could not load standings</h2>
            <div style="margin-top: 1.25rem;"><button type="button" id="lb-retry" class="btn-secondary">Retry</button></div>
          </div>
        ` : activeTab === 'teams' ? renderTeams(data?.teams || []) : renderIndividualTable(data)}
      </div>
    `;

    tabsConfig.forEach(t => {
      container.querySelector(`#tab-${t.id}`)?.addEventListener('click', () => {
        if (activeTab !== t.id) {
          activeTab = t.id;
          if (!cachedData[activeTab]) {
            loading = true;
            render();
            fetchTab(activeTab);
          } else {
            render();
          }
        }
      });
    });

    container.querySelector('#lb-retry')?.addEventListener('click', () => {
      loading = true;
      failed = false;
      render();
      fetchTab(activeTab);
    });

    container.querySelector('#close-comms-terminal-btn')?.addEventListener('click', () => {
      const term = container.querySelector('.in-world-terminal');
      if (term) term.style.display = 'none';
    });

    // Make player rows clickable to view crew profile
    container.querySelectorAll('.lb-row[data-player-id]').forEach(row => {
      row.addEventListener('click', () => {
        const pid = row.getAttribute('data-player-id');
        if (pid) window.location.hash = `#/crew/${encodeURIComponent(pid)}`;
      });
    });
  }

  function renderTeams(rows) {
    if (!rows || rows.length === 0) {
      return `<div class="glass-panel empty-state"><div class="empty-icon" aria-hidden="true">—</div><h2 class="section-title">No guild scores yet</h2></div>`;
    }
    return `
      <div class="m-grid-1 lb-team-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem;">
        ${rows.map(t => {
          const tid = String(t.team_id || '').toLowerCase();
          const accent = TEAM_ACCENTS[tid] || 'var(--accent-amber)';
          const isMine = session.teamId === tid;
          return `
            <article class="holo-card lb-team-card" style="${isMine ? `border-left: 2px solid ${accent};` : ''}">
              <div class="m-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                <span style="font-family: var(--font-mono); font-size: 1.5rem; color: ${accent};">${String(t.rank).padStart(2, '0')}</span>
                <span class="tag">${t.active_members ?? 0}/${t.roster_size ?? 0} active</span>
              </div>
              <h2 class="lb-team-name" style="font-family: var(--font-imperial); font-size: 1.2rem; font-weight: 700; letter-spacing: 0.16em; color: ${accent}; margin-bottom: 1rem; text-transform: uppercase; text-shadow: var(--engrave);">
                ${esc(PROPER[tid] || t.name || t.team_id)} ${isMine ? '<span class="tag warn" style="vertical-align: middle;">Yours</span>' : ''}
              </h2>
              <div class="stat-row" style="justify-content: space-between;">
                <div class="stat-tile">
                  <div class="stat-label">Guild score</div>
                  <div class="stat-value">${t.team_score}</div>
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderIndividualTable(data) {
    if (!data) return '';
    const fullList = data.fullIndividual || data.individual || [];
    if (fullList.length === 0) {
      return `<div class="glass-panel empty-state"><div class="empty-icon" aria-hidden="true">—</div><h2 class="section-title">No crew members ranked in this view</h2></div>`;
    }

    const myId = session.player?.player_id;
    const myRankEntry = fullList.find(r => r.player_id === myId);
    const myRankNum = myRankEntry ? myRankEntry.rank : (data.myRank?.rank || null);

    // D2 Neighbourhood: Top 25, then divider, then 3 above and 3 below player position
    let topRows = fullList.slice(0, 25);
    let neighbourhoodRows = [];
    if (fullList.length > 25) {
      if (myRankNum && myRankNum > 28) {
        const start = Math.max(25, myRankNum - 4);
        const end = Math.min(fullList.length, myRankNum + 3);
        neighbourhoodRows = fullList.slice(start, end);
      } else if (myRankNum && myRankNum > 25) {
        topRows = fullList.slice(0, Math.min(fullList.length, myRankNum + 3));
      }
    }

    const renderRow = (row) => {
      const isMe = session.player && (session.player.player_id === row.player_id || session.player.display_name === row.display_name);
      const tid = String(row.team_id || '').toLowerCase();
      const nameplateClass = row.nameplate ? `nameplate-chip ${row.nameplate}` : '';

      const pinnedChips = (row.pinned_plates || []).slice(0, 3).map(id => {
        const c = COMMENDATIONS_BY_ID[id];
        const icon = c?.icon || '★';
        return `<span title="${esc(c?.title || id)}" style="display: inline-block; font-size: 0.72rem; color: var(--accent-gold); margin-left: 3px;">${icon}</span>`;
      }).join('');

      return `
        <tr class="lb-row" data-player-id="${esc(row.player_id)}" style="border-bottom: 1px solid var(--border-durasteel); background: ${isMe ? 'var(--plate-300)' : 'transparent'}; cursor: pointer;">
          <td class="lb-rank" style="padding: 12px; font-family: var(--font-mono); color: ${row.rank <= 3 ? 'var(--accent-amber)' : 'var(--text-muted)'};">${String(row.rank).padStart(2, '0')}</td>
          <td class="lb-player" style="padding: 12px; font-weight: 700; color: var(--text-bright);">
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
              <span class="${nameplateClass}">${esc(row.display_name)}</span>
              ${row.title ? `<span class="tag" style="font-size: 0.65rem; padding: 1px 5px; border-color: var(--accent-gold); color: var(--accent-gold);">${esc(row.title)}</span>` : ''}
              ${pinnedChips}
              ${isMe ? '<span class="tag warn">You</span>' : ''}
            </div>
          </td>
          <td class="lb-team" style="padding: 12px; font-size: 0.85rem; color: ${TEAM_ACCENTS[tid] || 'var(--text-secondary)'};">
            ${esc(PROPER[tid] || row.team_id || '—')}
          </td>
          <td class="lb-level" style="padding: 12px;">
            <span class="level-badge" style="font-size: 0.65rem;">LVL ${row.level || 1}${row.level_title ? ' ' + esc(row.level_title).toUpperCase() : ''}</span>
          </td>
          <td class="lb-xp" style="padding: 12px; text-align: right; font-family: var(--font-mono); color: var(--accent-amber);">${row.xp}</td>
        </tr>
      `;
    };

    return `
      <div class="glass-panel lb-players" style="padding: 1rem;">
        <div class="lb-table-wrap" style="overflow-x: auto;">
          <table class="lb-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-durasteel); color: var(--text-muted); font-size: 0.72rem; font-family: var(--font-mono); letter-spacing: 0.08em;">
                <th style="padding: 10px 12px;">RANK</th>
                <th style="padding: 10px 12px;">CREW MEMBER</th>
                <th style="padding: 10px 12px;">GUILD</th>
                <th style="padding: 10px 12px;">RANK TITLE</th>
                <th style="padding: 10px 12px; text-align: right;">${activeTab === 'week' ? 'WEEK XP' : 'XP'}</th>
              </tr>
            </thead>
            <tbody>
              ${topRows.map(renderRow).join('')}
              ${neighbourhoodRows.length > 0 ? `
                <tr class="lb-divider">
                  <td colspan="5" style="text-align: center; padding: 8px; color: var(--text-muted); font-family: var(--font-mono); font-size: 0.8rem; background: rgba(0,0,0,0.2);">
                    &bull; &bull; &bull;
                  </td>
                </tr>
                ${neighbourhoodRows.map(renderRow).join('')}
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function fetchTab(tab) {
    let scopeParam = tab === 'crew' ? 'all' : (tab === 'guild' ? 'guild' : (tab === 'week' ? 'week' : 'all'));
    api.getLeaderboards(scopeParam).then(res => {
      loading = false;
      if (res) {
        cachedData[tab] = res;
        if (tab === 'crew' || tab === 'teams') {
          cachedData.teams = res.teams || [];
          if (res.myRank && !rankMovement) {
            rankMovement = computeMovement(res.myRank);
          }
        }
      }
      render();
    }).catch(() => {
      loading = false;
      failed = true;
      render();
    });
  }

  // Initial load
  render();
  fetchTab('teams');
  fetchTab('crew');
}
