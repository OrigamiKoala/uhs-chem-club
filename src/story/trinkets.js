/**
 * trinkets.js — Quartermaster crate starting trinket definitions (d20 issue roll).
 *
 * Drawn during Session Zero Scene 3. Purely cosmetic.
 */

export const TRINKETS = [
  { id: 'trinket_1', roll: 1, name: 'Battered Brass Compass', rarity: 'common', provenance: 'Drawn from the quartermaster crate upon signing on. Needle sticks north-by-west.' },
  { id: 'trinket_2', roll: 2, name: 'Spent Filament Bulb', rarity: 'common', provenance: 'Pulled from Pylon 1\'s junction box during the refit.' },
  { id: 'trinket_3', roll: 3, name: 'Polished Slag Pebble', rarity: 'common', provenance: 'Found in the tread links of a Mineral Mining crawler.' },
  { id: 'trinket_4', roll: 4, name: 'Scratched Calibration Prism', rarity: 'common', provenance: 'Discarded by an Imperial surveyor thirty years ago.' },
  { id: 'trinket_5', roll: 5, name: 'Tarnished Guild Cog', rarity: 'common', provenance: 'Cast with the four-fold Imperial cogmark.' },
  { id: 'trinket_6', roll: 6, name: 'Woven Wire Tether', rarity: 'common', provenance: 'Braided durasteel cable from an atmospheric harvester scoop.' },
  { id: 'trinket_7', roll: 7, name: 'Sand-Scoured Lens', rarity: 'common', provenance: 'Optical glass smoothed by forty seasons of Erebus dust.' },
  { id: 'trinket_8', roll: 8, name: 'Annealed Copper Washer', rarity: 'common', provenance: 'Heat-tempered seal ring from a crucible feed tube.' },
  { id: 'trinket_9', roll: 9, name: 'Dented Pressure Valve', rarity: 'common', provenance: 'Relieved valve head stamped with inspection initials.' },
  { id: 'trinket_10', roll: 10, name: 'Engraved Throttle Shim', rarity: 'common', provenance: 'Machined alloy shim from the Avalon\'s starboard lever.' },
  { id: 'trinket_11', roll: 11, name: 'Inert Vacuum Tube', rarity: 'common', provenance: 'Cold cathode tube with intact tungsten filaments.' },
  { id: 'trinket_12', roll: 12, name: 'Obsidian Ballast Chip', rarity: 'common', provenance: 'Chipped from volcanic basalt bedrock under the foundry.' },
  { id: 'trinket_13', roll: 13, name: 'Threaded Brass Coupling', rarity: 'common', provenance: 'Heavy pipe fitting salvaged from moisture collector rig 4.' },
  { id: 'trinket_14', roll: 14, name: 'Ceramic Insulator Bead', rarity: 'common', provenance: 'Unglazed high-voltage dielectric bead from a pylon cap.' },
  { id: 'trinket_15', roll: 15, name: 'Etched Star-Chart Plate', rarity: 'common', provenance: 'Corner fragment of a brass navigation matrix.' },
  { id: 'trinket_16', roll: 16, name: 'Fossilized Brine Crystal', rarity: 'common', provenance: 'Dug from an ancient dry seabed on Erebus.' },
  { id: 'trinket_17', roll: 17, name: 'Solder Spool Charm', rarity: 'common', provenance: 'Lead-silver wire wrapped tight around a rivet core.' },
  { id: 'trinket_18', roll: 18, name: 'Phosphor Dial Ring', rarity: 'common', provenance: 'Instrument bezel with faded luminous numerals.' },
  { id: 'trinket_19', roll: 19, name: 'Hardened Alloy Cotter Pin', rarity: 'common', provenance: 'Lock pin pulled from the cargo bay main latch.' },
  { id: 'trinket_20', roll: 20, name: 'Guildmaster Chronometer Seal', rarity: 'rare', provenance: 'Gilded mechanical seal stamped with the old Imperial seal. Natural 20 roll.' }
];

export const TRINKET_TABLE = TRINKETS;

export const BACKGROUNDS = {
  salvager: {
    id: 'salvager',
    title: 'Salvager',
    flavor: "You've pulled parts from worse wrecks than this."
  },
  runaway: {
    id: 'runaway',
    title: 'Runaway',
    flavor: "Nobody asks where you came from. Good."
  },
  scholar: {
    id: 'scholar',
    title: 'Scholar',
    flavor: "You read the manuals. All of them."
  }
};

export function getTrinketForRoll(roll) {
  const r = Math.max(1, Math.min(20, Math.floor(roll)));
  return TRINKETS[r - 1] || TRINKETS[0];
}

export function getDeterministicRoll(seedString) {
  let hash = 0;
  const str = String(seedString || 'crew_novice');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
  }
  return (Math.abs(hash) % 20) + 1;
}
