/**
 * models.js — the people the crews are made of. Pure data, no THREE: the runtime loader
 * (`three/npc/figures.js`) and the model build (`tools/npc/build-models.mjs`) both read it.
 *
 * Every body is a Microsoft Rocketbox avatar (MIT, © 2020 Microsoft; notice in
 * `public/models/npc/LICENSE-rocketbox.txt`), converted by `tools/npc/build-models.mjs` into
 *   public/models/npc/<id>.glb        desktop: full mesh, 2048 colour on body and head
 *   public/models/npc/<id>.lite.glb   handset: half the triangles, 512 textures
 * and the motion into one clip file per skeleton (`clips-m.glb`, `clips-f.glb`), shared by every body of
 * that skeleton. `manifest.json` (written by the build) records each clip's length and, for a walk, the
 * ground speed its feet were captured at, so a walker's clip runs at the speed it is moving.
 */

export const NPC_MODEL_DIR = '/models/npc';

/** Rocketbox source folder (under Assets/Avatars/<group>, Professions unless named) → the id the game uses. */
export const NPC_MODELS = Object.freeze([
  { id: 'crew-f101', source: 'Construction_Female_01', prefix: 'f101', skeleton: 'f' },
  { id: 'crew-m111', source: 'Construction_Male_01', prefix: 'm111', skeleton: 'm' },
  { id: 'crew-m102', source: 'Construction_Male_03', prefix: 'm102', skeleton: 'm' },
  { id: 'crew-m104', source: 'Construction_Male_05', prefix: 'm104', skeleton: 'm' },
  { id: 'crew-m107', source: 'Construction_Male_07', prefix: 'm107', skeleton: 'm' },
  { id: 'watch-m171', source: 'Security_Male_01', prefix: 'm171', skeleton: 'm' },
  // Added for the other worlds' crews (2026-11-19): more trades, lab coats and everyday clothes.
  { id: 'crew-m101', source: 'Construction_Male_02', prefix: 'm101', skeleton: 'm' },
  { id: 'crew-m103', source: 'Construction_Male_04', prefix: 'm103', skeleton: 'm' },
  { id: 'crew-m108', source: 'Construction_Male_08', prefix: 'm108', skeleton: 'm' },
  { id: 'fire-m138', source: 'Fire_Male_01', prefix: 'm138', skeleton: 'm' },
  { id: 'fire-m134', source: 'Fire_Male_03', prefix: 'm134', skeleton: 'm' },
  { id: 'yard-m106', source: 'Gardener_Male_01', prefix: 'm106', skeleton: 'm' },
  { id: 'hand-m112', source: 'Delivery_Male_01', prefix: 'm112', skeleton: 'm' },
  { id: 'hand-m110', source: 'Wood_Male_01', prefix: 'm110', skeleton: 'm' },
  { id: 'lab-f152', source: 'Medical_Female_01', prefix: 'f152', skeleton: 'f' },
  { id: 'lab-f153', source: 'Medical_Female_02', prefix: 'f153', skeleton: 'f' },
  { id: 'medic-f154', source: 'Medical_Female_03', prefix: 'f154', skeleton: 'f' },
  { id: 'lab-m154', source: 'Medical_Male_02', prefix: 'm154', skeleton: 'm' },
  { id: 'lab-m162', source: 'Medical_Male_04', prefix: 'm162', skeleton: 'm' },
  { id: 'pilot-f168', source: 'Pilot_Female_01', prefix: 'f168', skeleton: 'f' },
  { id: 'pilot-m167', source: 'Pilot_Male_03', prefix: 'm167', skeleton: 'm' },
  { id: 'town-f004', source: 'Female_Adult_04', group: 'Adults', prefix: 'f004', skeleton: 'f' },
  { id: 'town-f009', source: 'Female_Adult_09', group: 'Adults', prefix: 'f009', skeleton: 'f' },
  { id: 'town-f019', source: 'Female_Adult_13', group: 'Adults', prefix: 'f019', skeleton: 'f' },
  { id: 'town-f017', source: 'Female_Adult_14', group: 'Adults', prefix: 'f017', skeleton: 'f' },
  { id: 'town-f018', source: 'Female_Adult_15', group: 'Adults', prefix: 'f018', skeleton: 'f' },
  { id: 'town-m009', source: 'Male_Adult_05', group: 'Adults', prefix: 'm009', skeleton: 'm' },
  { id: 'town-m007', source: 'Male_Adult_12', group: 'Adults', prefix: 'm007', skeleton: 'm' }
]);

/**
 * The clips, by the name the runtime asks for. `walk` clips were captured moving (their travel is taken
 * off the root by the build and kept as `speed` in the manifest); the rest stand in place.
 */
export const NPC_CLIPS = Object.freeze({
  m: {
    walk: 'all_animations_max_motextr_xy/m_walk_neutral_01',
    walkSlow: 'all_animations_max_motextr_xy/m_walk_slow_01',
    idle: 'all_animations_max_motextr_static/m_idle_neutral_01',
    idleShift: 'all_animations_max_motextr_static/m_idle_neutral_02',
    look: 'all_animations_max_motextr_static/m_idle_look_around_01',
    talk: 'all_animations_max_motextr_static/m_gestic_talk_neutral_01'
  },
  f: {
    walk: 'all_animations_max_motextr_xy/f_walk_neutral_01',
    walkSlow: 'all_animations_max_motextr_xy/f_walk_slow_01',
    idle: 'all_animations_max_motextr_static/f_idle_neutral_01',
    idleShift: 'all_animations_max_motextr_static/f_idle_neutral_02',
    look: 'all_animations_max_motextr_static/f_idle_look_around_01',
    talk: 'all_animations_max_motextr_static/f_gestic_talk_neutral_01'
  }
});

export const npcModel = id => NPC_MODELS.find(m => m.id === id) || null;
