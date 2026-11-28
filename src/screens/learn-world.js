/**
 * learn-world.js — One Learn world: its quests, in the order they are played,
 * and its worked problems in a separate, flush-aligned tab.
 */

import { stage } from '../three/stage.js';
import { pageHeader, esc } from '../ui/layout.js';
import { getWorld, getQuest, WORLDS } from '../learn/curriculum.js';
import { benchWorked, worldDeepWorked, deepRefs } from '../learn/bank.js';
import { openWorkedProblem, isWorkedDone } from '../ui/worked-open.js';
import { worldProgress, questStatus, questProgress, nextQuest, isQuestComplete } from '../learn/progress.js';
import { canWalk, world3dFor } from '../learn/worlds3d.js';
import { openWorldPractice, worldHasPractice, practiceOfferedFlag } from '../learn/practice.js';
import { openWorldStoryModal } from '../story/story-modal.js';
import { session } from '../session.js';
import { showToast } from '../ui/toast.js';

/**
 * Open a bench on a walkable world, playing its in-world opening scene first when it has one
 * (`three/mystery/director.js`). Shared by walking up with [E] and selecting from the Quests list.
 */
function openSiteWithIntro(worldId, site) {
  const open = () => {
    if (window.location.hash.replace(/^#\/?/, '') === `learn/${worldId}`) {
      window.location.hash = `#/learn/${worldId}/${site.questId}`;
    }
  };
  const play = stage?.playIntro ? stage.playIntro(site, worldId) : Promise.resolve(false);
  play.catch(() => false).then(open);
}

let siteListenerInstalled = false;
function installSiteListener() {
  if (siteListenerInstalled) return;
  siteListenerInstalled = true;
  window.addEventListener('learn-site:interact', e => {
    const site = e.detail;
    if (!site || !site.questId) return;
    const hash = window.location.hash.slice(1).replace(/^\/+/, '');
    const parts = hash.split('/').filter(Boolean);
    if (parts[0] !== 'learn' || parts.length !== 2) return;
    const worldId = parts[1];
    if (!canWalk(worldId)) return;
    if (site.built === false) return;
    openSiteWithIntro(worldId, site);
  });
}

function maybeOfferStory(world, { returningFromBench = false } = {}) {
  if (returningFromBench) return;
  openWorldStoryModal(world);
}

function maybeOfferPractice(world) {
  if (!worldHasPractice(world)) return;
  if (session.hasFlag(practiceOfferedFlag(world.id))) return;
  session.setFlag(practiceOfferedFlag(world.id), true);
  showToast(`${world.world} is complete. Its questions are now in Practice.`, 'info');
}

/** The key that opens a world's practice set, or nothing. */
export function practiceKey(world, cls = 'btn-secondary quest-btn-sm') {
  if (!worldHasPractice(world)) return '';
  return `<button type="button" class="${cls} m-tap" data-practice-world="${esc(world.id)}">Practice</button>`;
}

/** Wire every Practice key inside `root`. Safe to call on a root with none. */
export function bindPracticeKeys(root) {
  root.querySelectorAll('[data-practice-world]').forEach(btn => {
    btn.addEventListener('click', () => {
      const w = getWorld(btn.dataset.practiceWorld);
      if (w) openWorldPractice(w);
    });
  });
}

/* ---------------------------------------------------------------
   WORKED PROBLEMS — unified list (bench + AP + Olympiad)
   --------------------------------------------------------------- */

function andList(names) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function deepNeeds(wk, world) {
  const refs = deepRefs(wk).map(r => {
    const q = getQuest(r.worldId, r.questId);
    const w = getWorld(r.worldId);
    const name = q ? (r.worldId === world.id ? q.title : `${w?.world || r.worldId}: ${q.title}`) : r.questId;
    return { name, done: q ? isQuestComplete(q) : false };
  });
  return { refs, open: refs.length > 0 && refs.every(r => r.done) };
}

/**
 * Collect every worked problem for a world into one ordered list:
 * bench worked problems in quest order, followed by AP and Olympiad problems.
 */
function collectWorked(world) {
  const items = [];
  const byId = new Map();

  for (const q of world.quests) {
    if (q.status !== 'live') continue;
    const wk = benchWorked(world, q.id);
    if (!wk) continue;
    const open = isQuestComplete(q);
    items.push({
      wk,
      tier: 'bench',
      mark: String(q.index + 1).padStart(2, '0'),
      open,
      meta: open ? `${wk.steps.length} steps` : `Clear ${q.title}`
    });
    byId.set(wk.id, wk);
  }

  const deep = worldDeepWorked(world, WORLDS)
    .sort((a, b) => (a.tier === b.tier ? 0 : a.tier === 'ap' ? -1 : 1));
  for (const wk of deep) {
    const { refs, open } = deepNeeds(wk, world);
    const mark = wk.tier === 'olympiad' ? 'OLY' : 'AP';
    const missing = refs.filter(r => !r.done).map(r => r.name);
    const meta = open
      ? `${wk.steps.length} steps${wk.tier === 'olympiad' ? ' · Beyond AP' : ''}`
      : `Clear ${andList(missing)}`;
    items.push({ wk, tier: wk.tier, mark, open, meta });
    byId.set(wk.id, wk);
  }

  return { items, byId };
}

function renderWorkedListHtml(items, { compact = false } = {}) {
  const listCls = compact ? 'learn-site-list learn-worked-list' : 'learn-quest-list learn-worked-list';
  return `
    <ul class="${listCls}" data-learn-panel="worked" hidden>
      ${items.map(({ wk, tier, mark, open, meta }) => {
        const done = isWorkedDone(wk.id);
        const rowCls = compact ? 'learn-site-row' : 'plate learn-quest-row';
        return `
          <li class="${rowCls} learn-worked-item learn-worked-${tier}${open ? '' : ' learn-locked'}">
            <span class="learn-worked-badge">${mark}</span>
            <span class="${compact ? 'learn-site-body' : 'learn-quest-body'}">
              <span class="${compact ? 'learn-site-title' : 'learn-quest-title'}">${esc(wk.title)}</span>
              <span class="${compact ? 'learn-site-line' : 'learn-quest-line'}">
                ${esc(meta)}<span class="learn-worked-done" data-worked-done="${esc(wk.id)}"${done ? '' : ' hidden'}> · Done</span>
              </span>
            </span>
            <span class="learn-row-action">
              ${open
                ? `<button type="button" class="btn-secondary${compact ? ' quest-btn-sm' : ''} learn-worked-open m-tap" data-open-worked="${esc(wk.id)}">Open</button>`
                : '<span class="learn-row-locked">Locked</span>'}
            </span>
          </li>
        `;
      }).join('')}
    </ul>
  `;
}

function renderTabsHtml(questCount, workedCount) {
  if (!workedCount) return '';
  return `
    <div class="learn-tabs" role="tablist">
      <button type="button" class="learn-tab is-active" role="tab" aria-selected="true" data-learn-tab="quests">
        Quests <span class="learn-tab-count">${questCount}</span>
      </button>
      <button type="button" class="learn-tab" role="tab" aria-selected="false" data-learn-tab="worked">
        Worked Problems <span class="learn-tab-count">${workedCount}</span>
      </button>
    </div>
  `;
}

function bindLearnTabs(root) {
  const tabs = root.querySelectorAll('[data-learn-tab]');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.learnTab;
      tabs.forEach(t => {
        const on = t.dataset.learnTab === target;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      root.querySelectorAll('[data-learn-panel]').forEach(p => {
        p.hidden = p.dataset.learnPanel !== target;
      });
    });
  });
}

function bindWorkedKeys(root, worked, { before, after } = {}) {
  root.querySelectorAll('[data-open-worked]').forEach(btn => {
    btn.addEventListener('click', () => {
      const wk = worked.byId.get(btn.dataset.openWorked);
      if (!wk) return;
      before?.();
      openWorkedProblem(wk, {
        onClose: () => {
          if (isWorkedDone(wk.id)) {
            root.querySelectorAll(`[data-worked-done="${CSS.escape(wk.id)}"]`).forEach(el => {
              el.hidden = false;
            });
          }
          after?.();
        }
      });
    });
  });
}

function renderQuestRowHtml(world, q, nextId, { compact = false } = {}) {
  const st = questStatus(world, q);
  const qp = questProgress(q);
  const enterable = st === 'open' || st === 'complete';
  const isNext = enterable && !qp.complete && q.id === nextId;
  const rowCls = compact ? 'learn-site-row' : 'plate learn-quest-row';
  const btnCls = isNext ? 'btn-primary' : 'btn-secondary';
  const sizeCls = compact ? ' quest-btn-sm' : '';
  const openCls = compact ? ' learn-site-open' : ' learn-enter';
  const progNote = !qp.complete && qp.cleared ? ` · ${qp.cleared}/${qp.total}` : '';

  return `
    <li class="${rowCls} learn-${st}${isNext ? ' is-next' : ''}">
      <span class="${compact ? 'learn-site-index' : 'learn-quest-index'}">${String(q.index + 1).padStart(2, '0')}</span>
      <span class="${compact ? 'learn-site-body' : 'learn-quest-body'}">
        <span class="${compact ? 'learn-site-title' : 'learn-quest-title'}">
          ${esc(q.title)}${q.beyondAp ? ' <span class="tag tag-dim learn-tag-xs">Beyond AP</span>' : ''}
        </span>
        <span class="${compact ? 'learn-site-line' : 'learn-quest-line'}">${esc(q.line)}${progNote ? `<span class="learn-quest-prog">${progNote}</span>` : ''}</span>
      </span>
      <span class="learn-row-action">
        ${enterable
          ? `<a href="#/learn/${esc(world.id)}/${esc(q.id)}" data-quest-id="${esc(q.id)}" class="${btnCls}${sizeCls}${openCls} m-tap" style="text-decoration: none;">${qp.complete ? 'Replay' : 'Play'}</a>`
          : `<span class="learn-row-locked">${st === 'locked' ? 'Locked' : 'Coming soon'}</span>`}
      </span>
    </li>
  `;
}

export function renderLearnWorld(container, params = {}) {
  const world = getWorld(params.worldId);

  if (!world) {
    window.location.hash = '#/learn';
    return;
  }

  if (canWalk(world.id)) {
    installSiteListener();
    const w3d = world3dFor(world.id);
    const fromQuest = sessionStorage.getItem('avalon_learn_last_site');
    const flewIn = Boolean(stage.consumeVoyageArrival?.());
    w3d.enter(stage, flewIn ? null : (fromQuest || null));
    sessionStorage.removeItem('avalon_learn_last_site');
    w3d.syncProgress(stage, questId => {
      const q = world.quests.find(x => x.id === questId);
      return q ? isQuestComplete(q) : false;
    });
    const nq = nextQuest(world) || world.quests[0];
    const targetSite = nq ? w3d.siteForQuest(nq.id) : null;
    if (targetSite) {
      const at = targetSite.approachPos || targetSite.pos;
      stage.setWorldWaypoint({ x: at[0], z: at[2], label: targetSite.label, siteId: targetSite.id });
    }
    renderWalkHud(container, world);
    bindPracticeKeys(container);
    maybeOfferPractice(world);
    return;
  }

  if (stage.cameraRig) {
    stage.cameraRig.moveTo('starmap');
  }

  const prog = worldProgress(world);
  const nq = nextQuest(world);
  const worked = collectWorked(world);

  container.innerHTML = `
    <div class="screen-container m-screen m-learn-world">
      ${pageHeader({
        art: '/art/crucible.jpg',
        video: '/video/crucible_loop.webm',
        artAlt: '',
        title: esc(world.world),
        subtitle: `${esc(world.unit)} · ${esc(world.title)}${prog.liveTotal ? ` · ${prog.questsComplete}/${prog.liveTotal}` : ''}`,
        actions: `
          ${practiceKey(world, 'btn-secondary learn-head-link')}
          <a href="#/learn" class="btn-secondary learn-head-link" style="text-decoration: none;">All Worlds</a>
        `
      })}

      ${renderTabsHtml(world.quests.length, worked.items.length)}

      <ul class="learn-quest-list" data-learn-panel="quests">
        ${world.quests.map(q => renderQuestRowHtml(world, q, nq?.id)).join('')}
      </ul>

      ${worked.items.length ? renderWorkedListHtml(worked.items) : ''}
    </div>
  `;

  bindLearnTabs(container);
  bindPracticeKeys(container);
  bindWorkedKeys(container, worked);
  maybeOfferPractice(world);
  maybeOfferStory(world, { returningFromBench: Boolean(sessionStorage.getItem('avalon_learn_last_site')) });
}

/**
 * The HUD worn while walking a Learn world, plus the Quests / Worked Problems modal.
 * The modal scrim is a direct sibling of `.learn-walk-hud` so its z-index stacks cleanly
 * above the HUD and canvas.
 */
function renderWalkHud(container, world) {
  const prog = worldProgress(world);
  const worked = collectWorked(world);
  const nq = nextQuest(world);
  const total = prog.liveTotal || world.questCount;
  const isCollapsed = sessionStorage.getItem('avalon_learn_hud_collapsed') === '1';

  container.innerHTML = `
    <div class="learn-walk-hud${isCollapsed ? ' collapsed' : ''}" data-world="${esc(world.id)}">
      <div class="learn-walk-card learn-walk-card-expanded">
        <div class="learn-walk-header">
          <a href="#/learn" class="btn-secondary quest-btn-sm learn-walk-back" style="text-decoration: none;">All Worlds</a>
          <span class="eyebrow lit">${esc(world.unit.toUpperCase())}</span>
          <button type="button" class="btn-secondary quest-btn-sm learn-walk-toggle" aria-label="Collapse HUD" title="Collapse HUD">−</button>
        </div>

        <div class="learn-walk-identity">
          <span class="learn-walk-name">${esc(world.world)}</span>
          <span class="learn-walk-count">${prog.questsComplete}/${total}</span>
        </div>
        <div class="learn-walk-topic">${esc(world.title)}</div>

        <div class="learn-walk-keys">
          <button type="button" class="btn-secondary quest-btn-sm learn-sites-trigger m-tap" id="learn-sites-trigger">Quests</button>
          ${practiceKey(world)}
        </div>

        <div class="learn-walk-hint">WASD · Drag · E</div>
      </div>

      <div class="learn-walk-card learn-walk-card-collapsed">
        <button type="button" class="btn-secondary quest-btn-sm learn-walk-expand m-tap" id="learn-walk-expand" aria-label="Expand HUD" title="Expand HUD">
          + ${esc(world.world)} · ${prog.questsComplete}/${total}
        </button>
      </div>
    </div>

    <div class="learn-sites-popup-scrim hidden" id="learn-sites-popup-scrim">
      <div class="in-world-terminal learn-sites-terminal" role="dialog" aria-modal="true" aria-labelledby="learn-sites-popup-title">
        <div class="terminal-header learn-sites-head">
          <div class="learn-sites-title-block">
            <h2 id="learn-sites-popup-title" class="section-title learn-sites-heading">${esc(world.world)}</h2>
            <span class="learn-sites-sub">${esc(world.unit)} · ${esc(world.title)}${world.beyondAp ? ' · Beyond AP' : ''}</span>
          </div>
          <div class="learn-sites-head-actions">
            ${total ? `<span class="learn-sites-count">${prog.questsComplete}/${total}</span>` : ''}
            <button type="button" id="close-sites-popup-btn" class="terminal-close-btn" aria-label="Close quests panel">Close</button>
          </div>
        </div>

        ${renderTabsHtml(world.quests.length, worked.items.length)}

        <ul class="learn-site-list" data-learn-panel="quests">
          ${world.quests.map(q => renderQuestRowHtml(world, q, nq?.id, { compact: true })).join('')}
        </ul>

        ${worked.items.length ? renderWorkedListHtml(worked.items, { compact: true }) : ''}

        ${worldHasPractice(world) ? `
          <div class="learn-sites-foot">
            ${practiceKey(world)}
          </div>
        ` : ''}
      </div>
    </div>
  `;

  const hud = container.querySelector('.learn-walk-hud');
  const toggleBtn = container.querySelector('.learn-walk-toggle');
  const expandBtn = container.querySelector('#learn-walk-expand');

  const setCollapsed = (collapsed) => {
    hud?.classList.toggle('collapsed', collapsed);
    sessionStorage.setItem('avalon_learn_hud_collapsed', collapsed ? '1' : '0');
  };

  toggleBtn?.addEventListener('click', () => setCollapsed(true));
  expandBtn?.addEventListener('click', () => setCollapsed(false));

  const scrim = container.querySelector('#learn-sites-popup-scrim');
  const openSitesBtn = container.querySelector('#learn-sites-trigger');
  const closeSitesBtn = container.querySelector('#close-sites-popup-btn');

  const openSitesPopup = () => {
    if (stage.director?.active) return;
    if (scrim) {
      scrim.classList.remove('hidden');
      closeSitesBtn?.focus?.();
    }
  };

  const closeSitesPopup = () => {
    if (scrim) {
      scrim.classList.add('hidden');
      openSitesBtn?.focus?.();
    }
  };

  openSitesBtn?.addEventListener('click', openSitesPopup);
  bindLearnTabs(scrim);
  bindWorkedKeys(scrim, worked, {
    before: () => scrim?.classList.add('hidden'),
    after: () => { if (scrim) { scrim.classList.remove('hidden'); closeSitesBtn?.focus?.(); } }
  });
  closeSitesBtn?.addEventListener('click', closeSitesPopup);

  container.querySelectorAll('.learn-site-open').forEach(link => {
    link.addEventListener('click', (e) => {
      const questId = link.dataset.questId;
      if (!questId) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const w3d = world3dFor(world.id);
      const site = w3d?.siteForQuest(questId);
      if (!site || site.built === false) return;
      e.preventDefault();
      if (stage.director?.active) return;
      if (scrim) scrim.classList.add('hidden');
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      stage.setWorldWaypoint?.(null);
      if (site.approachPos && site.pos) w3d.enter(stage, null, site.approachPos, site.pos);
      else w3d.enter(stage, site.id);
      openSiteWithIntro(world.id, site);
    });
  });

  scrim?.addEventListener('click', (e) => {
    if (e.target === scrim) closeSitesPopup();
  });

  const onKeydown = (e) => {
    if (e.key === 'Escape' && scrim && !scrim.classList.contains('hidden')) {
      closeSitesPopup();
    }
  };
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('hashchange', () => window.removeEventListener('keydown', onKeydown), { once: true });
}
