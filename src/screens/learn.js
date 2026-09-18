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

const STATUS_TAG = {
  open: { label: 'Open', cls: 'live' },
  complete: { label: 'Complete', cls: 'live' },
  locked: { label: 'Sealed', cls: 'warn' },
  charted: { label: 'No Charts', cls: 'locked' }
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
        eyebrow: `${track.worldsCharted} worlds charted · ${track.questsLive} of ${track.questsCharted} built`,
        title: 'Learn',
        subtitle: 'Ten worlds, walked in order. Each one is a course unit you play through.',
        actions: resumeQuest
          ? `<a href="#/learn/${esc(resume.id)}" class="btn-primary" style="text-decoration: none;">Continue · ${esc(resume.world)}</a>`
          : ''
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
                <div class="eyebrow learn-world-place">${esc(w.place)}</div>
                <div class="learn-world-title">${esc(w.title)}</div>
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
                  ${w.questCount} quests${prog.liveTotal ? ` · ${prog.questsComplete}/${prog.liveTotal} done` : ''}
                </div>
                ${enterable
                  ? `<a href="#/learn/${esc(w.id)}" class="btn-primary learn-enter m-tap" style="text-decoration: none;">Enter</a>`
                  : `<span class="eyebrow learn-world-blocked">${st === 'locked' ? 'Finish the world before' : 'Not yet built'}</span>`}
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
