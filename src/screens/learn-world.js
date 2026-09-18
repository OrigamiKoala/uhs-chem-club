/**
 * learn-world.js — One Learn world: its quests, in the order they are played.
 *
 * A quest here is a game with its own module. This screen only decides which are
 * open and hands the player into them.
 */

import { stage } from '../three/stage.js';
import { pageHeader, esc } from '../ui/layout.js';
import { getWorld, ARENAS } from '../learn/curriculum.js';
import { worldStatus, worldProgress, questStatus, questProgress, nextQuest } from '../learn/progress.js';

const STATUS_TAG = {
  open: { label: 'Open', cls: 'live' },
  complete: { label: 'Complete', cls: 'live' },
  locked: { label: 'Sealed', cls: 'warn' },
  charted: { label: 'No Charts', cls: 'locked' }
};

export function renderLearnWorld(container, params = {}) {
  const world = getWorld(params.worldId);

  if (!world) {
    window.location.hash = '#/learn';
    return;
  }

  if (stage.cameraRig) {
    stage.cameraRig.moveTo('starmap');
  }

  const wStatus = worldStatus(world);
  const prog = worldProgress(world);
  const resume = nextQuest(world);

  container.innerHTML = `
    <div class="screen-container m-screen m-learn-world">
      ${pageHeader({
        art: '/art/crucible.jpg',
        video: '/video/crucible_loop.webm',
        artAlt: '',
        eyebrow: `${esc(world.unit)} · ${esc(world.place)}`,
        title: esc(world.world),
        subtitle: esc(world.line),
        actions: `<a href="#/learn" class="btn-secondary" style="text-decoration: none;">All Worlds</a>`
      })}

      <section class="glass-panel learn-world-brief">
        <div class="m-head learn-brief-head">
          <span class="eyebrow lit">${esc(world.title)}</span>
          <span class="tag ${(STATUS_TAG[wStatus] || STATUS_TAG.charted).cls}">${(STATUS_TAG[wStatus] || STATUS_TAG.charted).label}</span>
        </div>
        <p class="learn-brief-body">${esc(world.brief)}</p>
        <div class="eyebrow learn-brief-count">
          ${world.questCount} quests charted${prog.liveTotal ? ` · ${prog.questsComplete} of ${prog.liveTotal} built quests complete` : ' · none built yet'}
        </div>
      </section>

      <div class="learn-quest-list">
        ${world.quests.map(q => {
          const st = questStatus(world, q);
          const tag = STATUS_TAG[st] || STATUS_TAG.charted;
          const qp = questProgress(q);
          const arena = ARENAS[q.arena]?.label || '';
          const enterable = st === 'open' || st === 'complete';
          const isResume = resume && resume.id === q.id;
          return `
            <article class="plate learn-quest-row learn-${st}">
              <div class="learn-quest-index">${String(q.index + 1).padStart(2, '0')}</div>

              <div class="learn-quest-body">
                <div class="m-head learn-quest-head">
                  <h2 class="learn-quest-title">${esc(q.title)}</h2>
                  <span class="tag ${tag.cls}">${tag.label}</span>
                </div>
                <p class="learn-quest-line">${esc(q.line)}</p>
                <div class="eyebrow learn-quest-meta">
                  ${esc(arena)}${q.stageCount ? ` · ${q.stageCount} stages` : ''}${qp.complete ? ' · cleared' : qp.cleared ? ` · ${qp.cleared}/${qp.total}` : ''}
                </div>
              </div>

              <div class="learn-quest-action">
                ${enterable
                  ? `<a href="#/learn/${esc(world.id)}/${esc(q.id)}" class="btn-primary learn-enter m-tap" style="text-decoration: none;">${qp.complete ? 'Replay' : isResume ? 'Begin' : 'Open'}</a>`
                  : `<span class="eyebrow learn-quest-blocked">${st === 'locked' ? 'Clear the one before' : 'Not yet built'}</span>`}
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
