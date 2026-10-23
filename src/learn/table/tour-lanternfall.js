/**
 * tour-lanternfall.js — the Tour's words for Lanternfall's instruments and pieces (kits `optics`, `cloud`, `shells`, `pes`, `trends`, `cuvette`).
 *
 * Merged into the shared tables by `tour.js`. Keys are `<kit>:<kind>`. Each step is in the Tour's three beats (what it is, what to do
 * with it, what it tells you), in everyday words, and says how a tool works and never which move solves a stage. A word a quest has not
 * earned by the stage the step is shown on is not used (`verify:table` checks), so a step that is shown early says "the distance from one
 * crest to the next" and not "wavelength".
 */

export const LANTERNFALL_TOUR = {
  fixtures: {
    /* ---- optics ---- */
    'optics:wave': { title: 'Screen', text: 'A screen has a holder for a lamp. Drag a lamp into the holder and the screen draws that lamp\'s light as a wave, with the distance from one crest to the next and the number of crests that pass each second printed above it. A "Colour" dial, where there is one, tunes the lamp from red toward violet.', dials: false },
    'optics:ruler': { title: 'Ruler', text: 'The ruler runs from the smallest waves to the largest, and each tick is ten times the last. Drag a source into its holder and the ruler marks how long that source\'s waves are, from one crest to the next.' },
    'optics:pulse': { title: 'Pulse timer', text: 'A rail with a holder for a lamp at one end and marks along it. Stand a lamp in the holder and a detector on each of two marks, then press "{run}". The timer prints the gap between the two detectors and how long the pulse of light took to cross it.', dials: false },
    'optics:band': { title: 'Prism and band', text: 'Drag a source into the socket and the prism spreads its light into a band, with a scale of nanometres under it. A band lit from end to end holds every colour; a band lit in only a few places holds only those colours. Where a slot says "Alongside", a glass strip slid beside the band lights the lines of the strip that fall on a line of the band.' },
    'optics:cell': { title: 'Photocell', text: 'Light shines on a metal plate in the holder, and the electrons it knocks loose run into the counting cup. The cup counts how many leave each second and the meter shows the speed of the fastest. Turn the dials to change the light, then read the cup and the meter.' },
    'optics:ladder': { title: 'Energy ladder', text: 'The rungs are the only energies the electron of a hydrogen atom can have, and it starts on the lowest. Drag the electron to another rung. When it drops, the strip beside it records the light that leaves, and the rungs crowd closer together as they climb.', dials: false },
    'optics:lines': { title: 'Lines strip', text: 'This strip writes down the light each drop of the electron gives out, as lines on the same scale as the band. A climb gives out nothing, so nothing is written.', dials: false },
    'optics:plaque': { title: null, text: 'A printed plate of facts. You only read it; there is nothing to press.' },
    'optics:marker': { title: 'Reading', text: 'Use the dial to set the number you have worked out. Whatever it reads when you press Submit is your answer.', dials: false },

    /* ---- cloud ---- */
    'cloud:cloud': { title: 'Plate', text: 'The plate shows where a probe finds an electron. Set the "Exposure" dial to one, fifty or five hundred shots, then press "{run}": every shot leaves a dot, and the dots from earlier shots stay. Where a slot sits beside the plate, a film laid in it counts the dots inside its outline.', dials: false },
    'cloud:view': { title: 'View', text: 'The View turns and tilts every cloud on the table at once, so you can look at a cloud from another side. A "Slice" switch, where there is one, keeps only the dots in a thin slab through the middle of the cloud.', dials: false },
    'cloud:wavering': { title: 'Ring track', text: 'A circular track. Drag a string onto it and the string is drawn round the ring, lap after lap, so you can see whether the laps land on each other or pile up in a band.' }
  },
  pieces: {
    /* ---- optics ---- */
    'optics:lamp': ['Lamps', 'Each lamp gives light of one colour. Drag it into a holder to switch it on; it glows in its own colour while it is in one.'],
    'optics:source': ['Sources', 'Each source sends out waves that are not light you can see: a radio mast, an oven, an X-ray tube. Drag it into the ruler\'s holder to read how long its waves are.'],
    'optics:detector': ['Detectors', 'A detector notes the moment a pulse of light reaches it. Drag one onto a mark of the rail; with two on the rail, the timer measures the pulse between them.'],
    'optics:plate': ['Metal plates', 'Each plate is a different metal. Drag one into the photocell\'s holder to see what light does to it.'],
    'optics:tube': ['Gas tubes', 'Each tube holds a glowing gas. Drag one into the socket and the prism shows the light it gives out.'],
    'optics:filament': ['Filament', 'A hot wire that glows. Drag it into the socket to see the light of a hot solid.'],
    'optics:cell': ['Gas cells', 'A cell of cool gas. Drag it into the cell holder, in front of the filament, to see what the gas does to the filament\'s light.'],
    'optics:strip': ['Reference strips', 'Each glass strip has the lines of one gas printed on it. Drag one into the alongside slot; the lines that fall on a line of the band light up.'],
    'optics:chip': ['Line chips', 'Each chip carries one line, as a wavelength. Drag it into the probe slot to ask the ladder which drop could make it.'],
    'optics:electron': ['Electron', 'The electron of the atom. Drag it up or down the ladder from rung to rung.'],

    /* ---- cloud ---- */
    'cloud:cloud': ['Clouds', 'Each card shows the dots that many probe shots left for one electron. Turn the View to see it from another side, then drag the card where it belongs.'],
    'cloud:tile': ['Strings', 'Each string has its own wavelength, printed on it. Drag one onto the track to see whether it closes into one ring.'],
    'cloud:film': ['Films', 'Each film is an outline cut from clear plastic, and all of them cover the same area. Lay one on the plate and it counts the dots inside its outline.']
  }
};
