/**
 * starmap.js — Sector cartography & integrated 3D mission hub (T4)
 *
 * In T4, integrates quest briefings, 20-pylon status map, and launch sequence directly
 * into the in-world Star Map Holo-Terminal overlay, preserving 3D navigation and orrery vista.
 */

import { stage } from "../three/stage.js";
import { session } from "../session.js";
import { pageHeader, esc } from "../ui/layout.js";
import { TOTAL_STAGES } from "../quest3d/evaluator.js";
import { playCinematic } from "../ui/cinematic.js";
import { renderGardensMap } from "../ui/gardens-map.js";
import { QUEST1_STORY } from "../story/quest1.js";
import { tierManager } from "../three/tier.js";

const SECTORS = [
  {
    code: "01",
    world: "Erebus",
    place: "Desert world",
    quest: "The Charge Gardens",
    line: "Find what pulls. Draw the line.",
    status: "live"
  },
  {
    code: "02",
    world: "Pyros Prime",
    place: "Volcanic forge",
    quest: "The Forge Line",
    line: "No charts.",
    status: "locked"
  },
  {
    code: "03",
    world: "Cryo-Haven",
    place: "Ice tundra",
    quest: "The Lattice",
    line: "No charts.",
    status: "locked"
  },
  {
    code: "04",
    world: "Aetheria",
    place: "Gas giant",
    quest: "The Swing",
    line: "No charts.",
    status: "locked"
  }
];

export function renderStarMap(container) {
  if (stage.cameraRig && tierManager.currentTier !== "T4") {
    stage.cameraRig.moveTo("starmap");
  }

  const canPlay = Boolean(session.token && session.player);
  const isT4 = tierManager.currentTier === "T4";

  function stagesCleared() {
    const prog = (session.progress || []).find(p => p.quest_id === "q1");
    let reached = prog && typeof prog.stage_reached === "number" ? Number(prog.stage_reached) : 0;
    try {
      const local = parseInt(localStorage.getItem("avalon_q1_stage_reached"), 10);
      if (!isNaN(local)) reached = Math.max(reached, local);
    } catch (e) {}
    return Math.max(0, Math.min(reached, TOTAL_STAGES));
  }

  const cleared = stagesCleared();
  const isComplete = cleared >= TOTAL_STAGES;
  const transmissionText = cleared >= TOTAL_STAGES
    ? QUEST1_STORY.debrief.lines[0]
    : cleared === 0
    ? (QUEST1_STORY.guildOpeners[session.teamId || "neutral"] || QUEST1_STORY.guildOpeners.neutral)
    : (QUEST1_STORY.pylons[cleared]?.transmission || "Pylon " + (cleared + 1) + " awaits connection. Check the gauges before you commit.");

  if (isT4) {
    // Integrated in-world 3D Star Map & Quest Command Terminal
    container.innerHTML = `
      <div class="in-world-terminal starmap-terminal">
        <div class="terminal-header">
          <div>
            <span class="eyebrow lit">// TACTICAL HOLO-TABLE //</span>
            <h2 class="section-title" style="font-size: 1.15rem; margin-top: 2px;">STAR MAP & MISSION CARTOGRAPHY</h2>
          </div>
          <button type="button" id="close-terminal-btn" class="terminal-close-btn">[X] FREE WALK</button>
        </div>

        <!-- Integrated Active Quest: Sector 01 (The Charge Gardens) -->
        <section class="glass-panel" style="margin-bottom: 1.2rem; padding: 1.1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span class="eyebrow lit">PRIMARY OBJECTIVE · SECTOR 01</span>
            <span class="tag ${isComplete ? "live" : "warn"}">${isComplete ? "RESOLVED" : cleared > 0 ? "UNDERWAY" : "STANDBY"}</span>
          </div>

          <h3 style="font-family: var(--font-imperial); font-size: 1.2rem; color: var(--text-bright); text-transform: uppercase; margin-bottom: 0.2rem;">
            EREBUS — THE CHARGE GARDENS
          </h3>
          <p style="font-size: 0.82rem; color: var(--accent-gold); margin-bottom: 0.8rem;">
            "Find what pulls. Draw the line."
          </p>

          <div style="padding: 0.7rem; background: var(--plate-100); border: 1px solid var(--border-durasteel); border-left: 2px solid var(--accent-amber); margin-bottom: 0.9rem;">
            <div class="eyebrow lit" style="font-size: 0.6rem; margin-bottom: 0.25rem;">VESS // TRANSMISSION</div>
            <p style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-primary); margin: 0; line-height: 1.4;">
              "${esc(transmissionText)}"
            </p>
          </div>

          ${renderGardensMap({ clearedCount: cleared, compact: true })}

          <div style="margin-top: 1rem;">
            <button type="button" id="launch-sector1-btn" class="btn-primary" style="width: 100%; min-height: 42px; font-size: 0.85rem; letter-spacing: 0.12em;">
              ${canPlay ? (isComplete ? "EXPLORE THE CHARGE GARDENS [SECTOR 01]" : `DISEMBARK TO EREBUS · PYLON ${cleared + 1}`) : "LAUNCH FREE SIMULATION"}
            </button>
          </div>
        </section>

        <!-- Charted Sectors Grid -->
        <div class="eyebrow" style="margin-bottom: 0.5rem; letter-spacing: 0.12em;">SECTOR ARCHIVE</div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem;">
          ${SECTORS.map(s => {
            const isLive = s.status === "live";
            return `
              <div class="holo-card" style="padding: 0.8rem; ${isLive ? "border-color: var(--accent-amber);" : "opacity: 0.5;"}">
                <div style="display: flex; justify-content: space-between; font-size: 0.65rem; margin-bottom: 0.2rem;">
                  <span class="eyebrow ${isLive ? "lit" : ""}">SEC ${s.code}</span>
                  <span class="tag ${isLive ? "live" : "locked"}">${isLive ? "OPEN" : "LOCKED"}</span>
                </div>
                <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-bright);">${s.world}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">${s.quest}</div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    container.querySelector("#close-terminal-btn")?.addEventListener("click", () => {
      const term = container.querySelector(".in-world-terminal");
      if (term) term.style.display = "none";
    });
  } else {
    // Lower Tiers (T1, T2, T3) Standard 2D Page
    container.innerHTML = `
      <div class="screen-container m-screen m-starmap">
        ${pageHeader({
          art: "/art/starmap.jpg",
          video: "/video/starmap_loop.webm",
          artAlt: "",
          eyebrow: "Charted sectors",
          title: "Star Map",
          actions: canPlay
            ? `<button type="button" id="launch-sector1-btn" class="btn-primary">Sector 01</button>`
            : `<a href="#/register" class="btn-primary" style="text-decoration: none;">Create Account</a>`
        })}

        <div class="m-grid-1 sector-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
          ${SECTORS.map(s => {
            const isLive = s.status === "live";
            return `
              <article class="holo-card sector-card" style="${isLive ? "" : "opacity: 0.5;"} display: flex; flex-direction: column;">
                <div class="m-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.9rem;">
                  <span class="eyebrow ${isLive ? "lit" : ""}">Sector ${s.code}</span>
                  <span class="tag ${isLive ? "live" : "locked"}">${isLive ? "Open" : "No Charts"}</span>
                </div>

                <h2 class="sector-world" style="font-family: var(--font-imperial); font-size: 1.25rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: ${isLive ? "var(--text-bright)" : "var(--text-secondary)"}; text-shadow: var(--engrave);">
                  ${s.world}
                </h2>
                <div class="eyebrow" style="margin-top: 4px;">${s.place}</div>

                <div style="height: 1px; background: var(--border-durasteel); margin: 0.9rem 0;"></div>

                <div style="font-family: var(--font-display); font-size: 0.85rem; letter-spacing: 0.1em; text-transform: uppercase; color: ${isLive ? "var(--accent-gold)" : "var(--text-muted)"}; margin-bottom: 0.3rem;">
                  ${s.quest}
                </div>
                <p style="font-size: 0.86rem; color: var(--text-secondary); margin-bottom: 1.25rem; line-height: 1.5;">
                  ${s.line}
                </p>

                <div style="margin-top: auto;">
                  ${isLive ? `
                    <button type="button" class="btn-primary sector-enter-btn m-tap" style="width: 100%; font-size: 0.7rem; padding: 9px 14px; min-height: 38px;">
                      ${canPlay ? `Enter · ${TOTAL_STAGES} stages` : "Free puzzle"}
                    </button>
                  ` : `
                    <div class="eyebrow" style="text-align: center; padding: 10px 0; color: var(--text-muted);">No Charts</div>
                  `}
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  async function handleSector01Enter() {
    if (!canPlay) {
      window.location.hash = "#/demo";
      return;
    }

    const hasLaunched = localStorage.getItem("avalon_sector01_launched") === "true";
    if (!hasLaunched) {
      try {
        localStorage.setItem("avalon_sector01_launched", "true");
        await playCinematic("launch");
      } catch (e) {}
    }
    window.location.hash = "#/quest";
  }

  container.querySelector("#launch-sector1-btn")?.addEventListener("click", handleSector01Enter);
  container.querySelectorAll(".sector-enter-btn").forEach(b => {
    b.addEventListener("click", handleSector01Enter);
  });
}
