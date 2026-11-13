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
    'optics:cell': { title: 'Photocell', text: 'Light shines on a metal plate in the holder, knocking electrons loose toward the collector. Read "Electrons Per Second" to see how many leave and "Fastest Electron" for their speed. Turn the dials to change the light.' },
    'optics:ladder': { title: 'Energy ladder', text: 'The rungs are the only energies the electron of a hydrogen atom can have, and it starts on the lowest. Drag the electron to another rung. When it drops, the strip beside it records the light that leaves, and the rungs crowd closer together as they climb.', dials: false },
    'optics:lines': { title: 'Lines strip', text: 'This strip writes down the light each drop of the electron gives out, as lines on the same scale as the band. A climb gives out nothing, so nothing is written.', dials: false },
    'optics:marker': { title: 'Reading', text: 'Use the dial to set the number you have worked out. Whatever it reads when you press Submit is your answer.', dials: false },

    /* ---- cloud ---- */
    'cloud:cloud': { title: 'Plate', text: 'The plate shows where a probe finds an electron. Set the "Number of shots" dial to one, fifty or five hundred shots, then press "{run}": every shot leaves a dot, and the dots from earlier shots stay. Where a slot sits beside the plate, a film laid in it counts the dots inside its outline.', dials: false },
    'cloud:view': { title: 'View and slice', text: 'The View turns and tilts every cloud on the table at once, or drag the picture to turn freely. A "Slice" switch keeps only the dots in a thin slab through the middle, letting you find the empty plane between lobes.', dials: false },
    'shells:shelf': { title: 'Orbital energy ladder', text: 'A ladder of orbitals arranged by energy, lowest at the bottom (1s, 2s, 2p). Each box represents an orbital where electrons can live.', dials: false },
    'shells:finder': { title: 'Quantum selector', text: 'Three dials that select an orbital: shell n (energy floor), subshell l (shape: 0 for s, 1 for p), and orbital ml (orientation). Turn a dial to light the matching orbital.', dials: false },
    'shells:well': { title: 'Energy well', text: 'Tests whether the atom is in its lowest energy state. Press "{run}" to check if any electrons can fall to a lower row.', dials: false },
    'shells:magnet': {
      title: f => (f.props?.sample != null ? 'Sample magnet' : f.props?.rack ? 'Rack magnet' : 'Magnet'),
      text: f => (f.props?.sample != null
        ? 'A magnet reads how hard something is pulled. Press "{run}" to read the pull of the real sample. The number it prints is how hard that element\'s atoms pull on a magnet.'
        : 'This magnet reads the pull of the electrons on the rack. Press "{run}" to read their pull. Unpaired electrons add to the pull, and paired electrons cancel.'),
      dials: false
    },
    'shells:marker': { title: 'Marker', text: 'Use the dial to set the number you have counted. Whatever it reads when you press Submit is your answer.', dials: false },
    'pes:pes': { title: 'Chamber and strip', text: 'Put a specimen card in the holder and press "{run}". Light knocks electrons off the atom, and each lands on the strip at the energy it took to remove it; electrons removed at the same energy pile up. A "Light energy" dial, where there is one, sets how strong the light is, and a light only takes off the electrons it has enough energy for.', dials: false },
    'pes:build': { title: 'Build an atom', text: 'Set the Protons and Electrons dials to build an atom. The peaks that atom would make are drawn over the strip as outlines, so you can see whether they cover the specimen\'s piles.', dials: false },
    'pes:writer': { title: 'Page of rows', text: 'Each dial is one row of an atom, lowest energy at the top. Set it to the number of electrons you think that row holds.', dials: false },
    'trends:spring': { title: 'Spring gauge', text: 'Put an atom in the holder, choose the electron with the "Electron" dial, and press "{run}". The gauge tugs that electron and prints the pull, with the charge in the middle of the atom, the electrons in between and the charge the electron really feels.', dials: false },
    'trends:sizer': { title: 'Size gauge', text: 'Put an atom in the holder and its radius is laid along a scale. Where a "{run}" key is on the gauge, press it to read the radius.', dials: false },
    'trends:gain': { title: 'Atom gauge', text: 'Put an atom in the holder and press "{run}". The gauge prints one reading for that atom, and the reading stays on the gauge until you measure another atom.', dials: false },
    'trends:strip': { title: 'Electron Remover', text: 'Put an atom in the holder and press "{run}". The electron remover takes off the outermost electron and prints what that required in energy. Press again to take off the next.', dials: false },
    'cuvette:spectro': { title: 'Spectrometer', text: 'Slide a cuvette into the optical beam. The spectrometer shines light through it and prints the reading.', dials: false },
    'cuvette:marker': { title: 'Reading', text: 'Use the dial to set the number you have worked out.', dials: false },
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
    'shells:box': ['Orbitals', 'Each box is one orbital. The arrows inside show the electrons placed in it.'],
    'shells:up': ['Add Up tool', 'Drag or tap this tool onto an orbital box to place an electron pointing up.'],
    'shells:down': ['Add Down tool', 'Drag or tap this tool onto an orbital box to place an electron pointing down.'],
    'shells:lift': ['Remove tool', 'Drag or tap this tool onto an orbital box to take an electron out of it.'],
    'shells:etok': ['Electron cards', 'Each card is an electron with its four numbers. Drag it onto the ladder to stand in its orbital.'],
    'shells:ccard': ['Written forms', 'Each card is a way of writing down an arrangement of electrons. Drag one into the slot to say which one you think the rack reads.'],
    'pes:spec': ['Specimens', 'Each card is a sample of one kind of atom. Put it in the holder and fire the light at it; the card keeps a printout of what its strip showed.'],
    'trends:atom': ['Atom cards', 'Each card is a model of one atom drawn to scale, so a bigger atom is a bigger circle. Drag it into a gauge, onto the rail or into a tray.'],
    'trends:electron': ['Add Electron', 'Drag it onto an atom card to put one more electron on that atom.'],
    'cuvette:cuvette': ['Cuvettes', 'Glass sample cells holding solutions. Slide one into the optical beam to read it.'],
    'cuvette:chip': ['Colour chips', 'Wavelength markers for visible colors. Place one in the slot to identify absorbed light.'],
    'cuvette:dropper': ['Cu²⁺ Stock', 'Dropper of concentrated stock solution. Lay it on a cuvette to add 2.0 mmol/L of dissolved solute.'],
    'cuvette:rinse': ['Rinse', 'Pure solvent bottle. Lay it on a cuvette to rinse it back to 0.0 mmol/L.'],
    'cloud:tile': ['Strings', 'Each string has its own wavelength, printed on it. Drag one onto the track to see whether it closes into one ring.'],
    'cloud:film': ['Films', 'Each film is an outline cut from clear plastic, and all of them cover the same area. Lay one on the plate and it counts the dots inside its outline.']
  }
};
