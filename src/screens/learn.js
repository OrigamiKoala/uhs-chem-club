/**
 * learn.js — The Learn road: every AP Chemistry unit as a world, in order.
 *
 * This screen is a map, not a syllabus. It shows where a world is, what it is
 * called, the one line that says what it teaches, and whether it is open. The
 * teaching happens inside the quests, which are games.
 *
 * Nothing here mentions XP, because the Learn track pays none and never appears
 * in Standings.
 */

import { stage } from '../three/stage.js';
import { pageHeader, esc } from '../ui/layout.js';
import { WORLDS } from '../learn/curriculum.js';
import { worldStatus, worldProgress, isQuestComplete, nextQuest, currentWorld, trackProgress } from '../learn/progress.js';
import { practiceKey, bindPracticeKeys } from './learn-world.js';
import { openWorldStoryModal, openCampaignStoryModal } from '../story/story-modal.js';

const STATUS_TAG = {
  open: { label: 'Open', cls: 'live' },
  complete: { label: 'Complete', cls: 'live' },
  locked: { label: 'Locked', cls: 'warn' },
  charted: { label: 'Coming soon', cls: 'locked' }
};

export function renderLearn(container) {
  if (stage.cameraRig) {
    stage.cameraRig.moveTo('starmap');
  }

  const track = trackProgress();
  const resume = currentWorld();
  const resumeStatus = resume ? worldStatus(resume) : 'charted';
  const resumeQuest = resumeStatus === 'open' ? nextQuest(resume) : null;

  container.innerHTML = `
    <div class="screen-container m-screen m-learn">
      ${pageHeader({
        art: '/art/starmap.jpg',
        video: '/video/starmap_loop.webm',
        artAlt: '',
        title: 'Learn',
        actions: `
          <button type="button" class="btn-secondary quest-btn-sm m-tap" id="learn-campaign-story-btn" title="Review Campaign Storyline & Ghost Charter" style="margin-right: 0.5rem;">📜 Story Dossier</button>
          ${resumeQuest
            ? `<a href="#/learn/${esc(resume.id)}" class="btn-primary" style="text-decoration: none;">Continue · ${esc(resume.world)}</a>`
            : ''}
        `
      })}

      <div class="learn-road">
        ${WORLDS.map(w => {
          const st = worldStatus(w);
          const tag = STATUS_TAG[st] || STATUS_TAG.charted;
          const prog = worldProgress(w);
          const enterable = st === 'open' || st === 'complete';
          return `
            <article class="plate learn-world-row learn-${st}">
              <div class="learn-world-code">
                <span class="learn-code-num">${esc(w.code)}</span>
                <span class="eyebrow">${esc(w.unit)}</span>
              </div>

              <div class="learn-world-body">
                <div class="m-head learn-world-head">
                  <h2 class="learn-world-name">${esc(w.world)}</h2>
                  <span class="tag ${tag.cls}">${tag.label}</span>
                </div>
                <div class="eyebrow learn-world-title" style="color: var(--accent-amber); font-size: 0.65rem;">ENEMY // THE FIFTH GUILD</div>
                <p class="learn-world-line">${esc(w.line)}</p>
              </div>

              <div class="learn-world-meta">
                <div class="learn-meter" aria-hidden="true">
                  ${w.quests.map(q => {
                    const built = q.status === 'live';
                    const done = built && isQuestComplete(q);
                    return `<span class="learn-pip ${done ? 'done' : built ? 'built' : ''}"></span>`;
                  }).join('')}
                </div>
                <div class="eyebrow learn-world-count">
                  ${w.questCount} quests${prog.liveTotal ? ` · ${prog.questsComplete}/${prog.liveTotal} complete` : ''}
                </div>
                <div class="learn-world-keys">
                  <button type="button" class="btn-secondary quest-btn-sm learn-story-modal-btn m-tap" data-story-world="${esc(w.id)}" title="Sector Storyline Briefing">Storyline</button>
                  ${enterable
                    ? `<a href="#/learn/${esc(w.id)}" class="btn-primary learn-enter m-tap learn-enter-btn" data-world-id="${esc(w.id)}" style="text-decoration: none;">Enter</a>`
                    : `<span class="eyebrow learn-world-blocked">${st === 'locked' ? 'Locked' : 'Coming soon'}</span>`}
                  ${practiceKey(w)}
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `;

  bindPracticeKeys(container);

  container.querySelectorAll('.learn-enter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const worldId = btn.dataset.worldId;
      if (!worldId) return;
      if (!session.hasFlag(`story_world_seen_${worldId}`)) {
        e.preventDefault();
        const w = WORLDS.find(x => x.id === worldId);
        openWorldStoryModal(w || worldId, {
          isPreLaunch: true,
          onLaunch: () => {
            session.setFlag(`story_world_seen_${worldId}`, true);
            window.location.hash = `#/learn/${worldId}`;
          }
        });
      }
    });
  });

  container.querySelectorAll('.learn-story-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const w = WORLDS.find(x => x.id === btn.dataset.storyWorld);
      if (w) {
        openWorldStoryModal(w, {
          isPreLaunch: true,
          onLaunch: () => {
            session.setFlag(`story_world_seen_${w.id}`, true);
            window.location.hash = `#/learn/${w.id}`;
          }
        });
      }
    });
  });

  container.querySelector('#learn-campaign-story-btn')?.addEventListener('click', () => {
    openCampaignStoryModal();
  });
}
