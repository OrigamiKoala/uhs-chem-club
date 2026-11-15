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
    'optics:wave': { title: 'Screen', text: 'Drag a lamp into the holder to draw its light wave.', dials: false },
    'optics:ruler': { title: 'Ruler', text: 'Drag a source into the holder to mark its wave length.' },
    'optics:pulse': { title: 'Pulse timer', text: 'Place a lamp and two detectors on the rail, then press "{run}".', dials: false },
    'optics:band': { title: 'Prism & band', text: 'Drag a source into the socket to spread its light into a band.' },
    'optics:cell': { title: 'Photocell', text: 'Turn the dials to change the light and watch the electron readings.' },
    'optics:ladder': { title: 'Energy ladder', text: 'Drag the electron between rungs; drops record light on the strip.', dials: false },
    'optics:lines': { title: 'Lines strip', text: 'Records the light given out when the electron drops.', dials: false },
    'optics:marker': { title: 'Reading', text: 'Drag the dial to your answer.', dials: false },

    /* ---- cloud ---- */
    'cloud:cloud': { title: 'Plate', text: 'Pick shots and press "{run}" to map where the electron lands.', dials: false },
    'cloud:view': { title: 'View & slice', text: 'Drag to turn the cloud; toggle "Slice" to cut through the middle.', dials: false },
    'shells:shelf': { title: 'Orbital ladder', text: 'Orbitals stacked by energy, lowest at the bottom.', dials: false },
    'shells:finder': { title: 'Quantum selector', text: 'Turn the n, l, and ml dials to highlight an orbital.', dials: false },
    'shells:well': { title: 'Energy well', text: 'Press "{run}" to test if electrons can fall to a lower row.', dials: false },
    'shells:magnet': {
      title: f => (f.props?.sample != null ? 'Sample magnet' : f.props?.rack ? 'Rack magnet' : 'Magnet'),
      text: () => 'Press "{run}" to measure the magnetic pull.',
      dials: false
    },
    'shells:marker': { title: 'Marker', text: 'Drag the dial to your count.', dials: false },
    'pes:pes': { title: 'Chamber & strip', text: 'Place a specimen in the holder, then press "{run}".', dials: false },
    'pes:build': { title: 'Build an atom', text: 'Set Protons and Electrons to overlay outlines on the strip.', dials: false },
    'pes:writer': { title: 'Page of rows', text: 'Set each dial to the number of electrons in that row.', dials: false },
    'trends:spring': { title: 'Spring gauge', text: 'Place an atom, pick an electron, and press "{run}" to measure pull.', dials: false },
    'trends:sizer': { title: 'Size gauge', text: 'Place an atom in the holder to measure its radius.', dials: false },
    'trends:gain': { title: 'Atom gauge', text: 'Place an atom in the holder and press "{run}".', dials: false },
    'trends:strip': { title: 'Electron Remover', text: 'Place an atom and press "{run}" to remove its outer electron.', dials: false },
    'cuvette:spectro': { title: 'Spectrometer', text: 'Slide a cuvette into the beam to read it.', dials: false },
    'cuvette:marker': { title: 'Reading', text: 'Drag the dial to your answer.', dials: false },
    'trends:levels': { title: 'Subshell ladder', text: 'Compares 1s, 2s, and 2p levels; outer electrons are amber.', dials: false },
    'cloud:wavestrip': { title: 'Wavefunction strip', text: 'Drag the Probe dial to read ψ and dot counts along the line.', dials: false },
    'cloud:wavering': { title: 'Ring track', text: 'Drag a wave onto the ring to see if its laps stay in step.' }
  },
  pieces: {
    /* ---- optics ---- */
    'optics:lamp': ['Lamps', 'Drag a lamp into a holder to switch it on.'],
    'optics:source': ['Sources', 'Drag a source into the holder to test its waves.'],
    'optics:detector': ['Detectors', 'Drag two detectors onto rail marks to time a pulse.'],
    'optics:plate': ['Metal plates', 'Drag a plate into the photocell holder.'],
    'optics:tube': ['Gas tubes', 'Drag a tube into the socket to see its light.'],
    'optics:filament': ['Filament', 'Drag the filament into the socket to light it.'],
    'optics:cell': ['Gas cells', 'Drag a cell into the holder in front of the filament.'],
    'optics:strip': ['Reference strips', 'Drag a strip into the alongside slot to match lines.'],
    'optics:chip': ['Line chips', 'Drag a chip into the probe slot to test it.'],
    'optics:electron': ['Electron', 'Drag the electron up or down the ladder.'],

    /* ---- cloud ---- */
    'cloud:cloud': ['Clouds', 'Turn the View to inspect, then sort the cloud.'],
    'shells:box': null,
    'shells:up': ['Add Up', 'Drag or tap onto an orbital box to add an up electron.'],
    'shells:down': ['Add Down', 'Drag or tap onto an orbital box to add a down electron.'],
    'shells:lift': ['Remove', 'Drag or tap onto an orbital box to remove an electron.'],
    'shells:etok': ['Electron cards', 'Drag onto the ladder to place in its orbital.'],
    'shells:ccard': null,
    'pes:spec': ['Specimens', 'Drag into the holder and fire; the card keeps its strip.'],
    'trends:atom': ['Atom cards', 'Drag into a gauge, onto the rail, or into a tray.'],
    'trends:electron': ['Add Electron', 'Drag onto an atom card to add one electron.'],
    'cuvette:cuvette': ['Cuvettes', 'Slide a cuvette into the optical beam to read it.'],
    'cuvette:chip': ['Colour chips', 'Place in the slot to identify absorbed light.'],
    'cuvette:dropper': ['Cu²⁺ Stock', 'Lay on a cuvette to add 2.0 mmol/L solute.'],
    'cuvette:rinse': ['Rinse', 'Lay on a cuvette to rinse it to 0.0 mmol/L.'],
    'cloud:tile': ['Strings', 'Drag onto the ring track to test if it closes.'],
    'cloud:film': ['Films', 'Lay on the plate to count dots inside its outline.']
  }
};
