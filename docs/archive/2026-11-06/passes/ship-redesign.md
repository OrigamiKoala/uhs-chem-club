# The Avalon, rebuilt — plan and progress

Goal: the ship interior reads as a working starship out of a used-universe space
opera, not a set of boxes. Every room, station and function survives; the
geometry is rebuilt from a shared kit.

## What stays (the contract)
- Room ids: bridge, corridor, quarters, berth_b, comms, cargo, stairwell,
  airlock, furnace. Graph nodes: bridge, cockpit, starmap, quarters, cargo,
  comms, airlock. Routes unchanged (`SHIP_GRAPH.routeBinding`).
- `ShipInterior` API used by `stage.js`: `group`, `colliders`,
  `getActiveColliders`, `getAimTargets`, `getAimBlockers`, doors,
  `interactiveTerminals`, club / star-map / comms holos (+ open/close/toggle/
  isVisible/setVisible), `setClubHoloScale`, `updateDisplays`, `update`,
  `assertClearSightline`; exports `CLUB_BOARD_POS`, `BRIDGE_STAND`.
- `verify:ship` invariants: reachability, no sealed pockets, anchors, hatch
  markers in real doorways, nothing overlapping.

## What changes
- **Shape.** The bow is a faceted cockpit nose with a raked five-pane canopy;
  the bridge's forward corners are angled shoulders with viewports. Dead deck
  outside the outline is filled by stepped colliders.
- **Section.** Every compartment is dressed with the same profile: angled kick
  panels, a panelled wall field broken by structural ribs, an angled upper
  chamfer and a coffered ceiling with light troughs (`ship/kit.js`
  `dressRoomShell`).
- **Doors.** Split sliding pressure doors in chamfered portal frames, opening
  automatically as the player approaches; leaves retract into the bulkhead.
- **Viewports** through the outer plating in the port berths and comms.
- **Lights** are declared by the rooms (`ship.addLight`) and handed to the pool.

## Layout
- `src/three/ship-rooms.js` — deck plan data (+ `BRIDGE_OUTLINE`, windows, the
  stairwell floor hatch).
- `src/three/ship/materials.js`, `kit.js`, `hull.js`, `doors.js`, `corridor.js`.
- `src/three/ship/rooms/*.js` — one builder per compartment.
- `src/three/ship.js` — orchestrator and the public API.

## Progress
- [x] Deck plan, materials, kit, hull, doors, corridor, orchestrator (baseline
      rooms ported so verify passes) — 2026-09-26
- [x] Bridge / cockpit / star map rebuilt
- [x] Berths / comms / stairwell rebuilt
- [x] Cargo / airlock / engine room rebuilt
- [x] Graph, lighting, stage wiring, verify, CLAUDE.md — full `npm run verify` green

## Not done / for the next pass
- Visual review in the browser (the lead did not open one, per the user's rule).
- Door leaves are baked per leaf (5 meshes each); the bridge is ~50 draw calls.
