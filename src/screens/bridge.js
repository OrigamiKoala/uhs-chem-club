/**
 * bridge.js — Command Bridge dashboard & 3D Helm Terminal (T4)
 *
 * Implements:
 * - In T4: in-world tactical helm terminal overlay with 3D bridge view and Star Map integration.
 * - In lower tiers: full-screen bridge dashboard page.
 */

import { session, levelProgress, levelTitle } from "../session.js";
import { stage } from "../three/stage.js";
import { pageHeader, statRow, esc } from "../ui/layout.js";
import { TOTAL_STAGES, TOTAL_QUEST_XP } from "../quest3d/evaluator.js";
import { renderGardensMap } from "../ui/gardens-map.js";
import { QUEST1_STORY } from "../story/quest1.js";
import { tierManager } from "../three/tier.js";
import { playCinematic } from "../ui/cinematic.js";

let unsubscribeBridge = null;
let bridgeHoloListener = null;
let bridgeHoloOpenListener = null;

export function renderBridge(container) {
  if (unsubscribeBridge) {
    unsubscribeBridge();
    unsubscribeBridge = null;
  }
  if (bridgeHoloListener) {
    window.removeEventListener("club-holo:close", bridgeHoloListener);
    bridgeHoloListener = null;
  }
  if (bridgeHoloOpenListener) {
    window.removeEventListener("club-holo:open", bridgeHoloOpenListener);
    bridgeHoloOpenListener = null;
  }

  if (stage.cameraRig && tierManager.currentTier !== "T4") {
    stage.cameraRig.moveTo("bridge");
  }

  function stagesCleared() {
    const prog = (session.progress || []).find(p => p.quest_id === "q1");
    let reached = prog && typeof prog.stage_reached === "number" ? Number(prog.stage_reached) : 0;
    try {
      const local = parseInt(localStorage.getItem("avalon_q1_stage_reached"), 10);
      if (!isNaN(local)) reached = Math.max(reached, local);
    } catch (e) { }
    return Math.max(0, Math.min(reached, TOTAL_STAGES));
  }

  function getBridgeTransmission(cleared) {
    if (cleared >= TOTAL_STAGES) {
      return QUEST1_STORY.debrief.lines[0];
    }
    if (cleared === 0) {
      const tid = session.teamId || "neutral";
      return QUEST1_STORY.guildOpeners[tid] || QUEST1_STORY.guildOpeners.neutral;
    }
    const pylon = QUEST1_STORY.pylons[cleared];
    return pylon?.transmission || "Pylon " + (cleared + 1) + " awaits connection. Check the gauges before you commit.";
  }

  function render() {
    const p = session.player || {};
    const t = session.team || {};
    const activeEv = session.events ? session.events[session.teamId] : null;
    const prog = levelProgress(session.xp || 0);
    const cleared = stagesCleared();
    const isComplete = cleared >= TOTAL_STAGES;
    const currentPylonNum = Math.min(cleared + 1, TOTAL_STAGES);
    const transmissionText = getBridgeTransmission(cleared);
    const isT4 = tierManager.currentTier === "T4";

    if (isT4) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="screen-container m-screen m-bridge">
        ${pageHeader({
      art: "/art/bridge.jpg",
      video: "/video/cockpit_loop.webm",
      eyebrow: esc(t.name || t.team_id || "Unassigned") + " Guild",
      title: esc(p.display_name || "Explorer"),
      actions: statRow([
        { label: "Total XP", value: `${session.xp || 0}` },
        { label: "Level", value: `${prog.level} · ${levelTitle(prog.level)}`, plain: true },
        { label: "To next level", value: `${Math.max(0, prog.needed - prog.into)} XP`, plain: true }
      ])
    })}

        <div id="bridge-announcement-panel" class="glass-panel" style="margin-bottom: 1.25rem; border-left: 2px solid var(--accent-amber); padding: 0.9rem 1.15rem; ${session.hasFlag('clubHoloClosed') ? 'display: none;' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <div style="font-family: var(--font-display); font-size: 0.95rem; font-weight: 700; color: var(--accent-amber);">UHS Chemistry Club</div>
              <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-bright); margin-top: 2px;">Next meeting Tuesday 9/29 in 702</div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary);">
                ← Star Map · Standings →
              </div>
              <button type="button" id="bridge-announcement-close" class="btn-chip" style="font-size: 0.72rem; padding: 2px 8px; color: var(--accent-amber); border-color: rgba(217, 148, 35, 0.4); cursor: pointer;" title="Close [X]">Close [X]</button>
            </div>
          </div>
        </div>

        <div class="m-grid-1 bridge-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem;">
          <section class="glass-panel">
            <div class="panel-banner bridge-quest-banner" style="height: 130px;">
              <video class="banner-video" poster="/art/crucible.jpg" playsinline autoplay loop muted preload="none">
                <source src="/video/crucible_loop.webm" type="video/webm">
              </video>
              <img src="/art/crucible.jpg" alt="The reaction chamber" loading="lazy" />
            </div>

            <div class="m-head" style="display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <span class="tag ${isComplete ? "live" : "warn"}">${isComplete ? "Complete" : cleared > 0 ? "Underway" : "Sealed"}</span>
            </div>

            <h2 class="section-title">The Charge Gardens</h2>
            <p class="page-sub" style="margin-bottom: 1.1rem;">Find what pulls. Draw the line.</p>

            <div style="margin-bottom: 1.25rem;">
              ${renderGardensMap({ clearedCount: cleared, currentStageIdx: isComplete ? null : cleared })}
            </div>

            ${statRow([
      { label: "Stages", value: `${cleared} / ${TOTAL_STAGES}`, plain: true },
      { label: "Quest XP", value: TOTAL_QUEST_XP },
      { label: "Run time", value: "~30 min", plain: true }
    ])}

            <a href="#/quest" class="btn-primary bridge-quest-cta" style="width: 100%; text-decoration: none; margin-top: 1.25rem;">
              ${isComplete ? "Replay Gardens" : cleared > 0 ? `Continue Stage ${currentPylonNum}` : "Start Stage 1"}
            </a>
          </section>

          <section class="glass-panel">
            <span class="eyebrow">Guild Conditions</span>
            <h2 class="section-title" style="margin-top: 0.4rem;">
              ${activeEv ? esc(activeEv.name) : "All Clear"}
            </h2>
            ${activeEv && activeEv.description ? `<p class="page-sub" style="margin-bottom: 1rem;">${esc(activeEv.description)}</p>` : '<div style="margin-bottom: 1rem;"></div>'}

            ${activeEv ? `
              <div style="margin-bottom: 1.25rem;">
                <span class="tag ${activeEv.polarity === "bad" ? "danger" : activeEv.polarity === "good" ? "live" : ""}">
                  ${esc(String(activeEv.polarity || "neutral").toUpperCase())}
                </span>
              </div>
            ` : ""}

            <div style="border-top: 1px solid var(--border-durasteel); padding-top: 1.25rem; margin-top: 1.25rem;">
              <div class="bridge-decks" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <a href="#/starmap" class="btn-secondary" style="font-size: 0.72rem; text-decoration: none;">Star Map</a>
                <a href="#/leaderboard" class="btn-secondary" style="font-size: 0.72rem; text-decoration: none;">Standings</a>
                <a href="#/inventory" class="btn-secondary" style="font-size: 0.72rem; text-decoration: none;">Inventory</a>
                <a href="#/quarters" class="btn-secondary" style="font-size: 0.72rem; text-decoration: none;">Crew</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    container.querySelector(".bridge-quest-cta")?.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await playCinematic("launch");
      } catch (err) { }
      window.location.hash = "#/quest";
    });

    const panel = container.querySelector("#bridge-announcement-panel");
    const closeBtn = container.querySelector("#bridge-announcement-close");
    closeBtn?.addEventListener("click", () => {
      if (panel) panel.style.display = "none";
      session.setFlag("clubHoloClosed", true);
      stage.closeClubHolo?.();
    });

    if (bridgeHoloListener) {
      window.removeEventListener("club-holo:close", bridgeHoloListener);
    }
    bridgeHoloListener = () => {
      const p = container.querySelector("#bridge-announcement-panel");
      if (p) p.style.display = "none";
    };
    window.addEventListener("club-holo:close", bridgeHoloListener);

    if (bridgeHoloOpenListener) {
      window.removeEventListener("club-holo:open", bridgeHoloOpenListener);
    }
    bridgeHoloOpenListener = () => {
      const p = container.querySelector("#bridge-announcement-panel");
      if (p) p.style.display = "";
    };
    window.addEventListener("club-holo:open", bridgeHoloOpenListener);
  }

  render();

  unsubscribeBridge = session.subscribe(() => {
    if (!window.location.hash.includes("bridge")) {
      if (unsubscribeBridge) unsubscribeBridge();
      unsubscribeBridge = null;
      if (bridgeHoloListener) {
        window.removeEventListener("club-holo:close", bridgeHoloListener);
        bridgeHoloListener = null;
      }
      if (bridgeHoloOpenListener) {
        window.removeEventListener("club-holo:open", bridgeHoloOpenListener);
        bridgeHoloOpenListener = null;
      }
      return;
    }
    render();
  });
}
