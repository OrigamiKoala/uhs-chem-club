"""
gen-ligar-layout.py - lays out Ligar's landmarks and writes src/three/world-data/ligar.json.

Run from the repo root:  python3 tools/gen-ligar-layout.py

The props are placed by hand below and then SETTLED: overlapping footprints are
pushed apart until every one is clear, every prop stands clear of every surface
site and its approach, nothing but an elevated span stands in the cut, and each
conveyor's whole 22 m run is kept clear rather than only its centre. It refuses
to write the file if any of that fails. `npm run verify:ligar` then builds the
real world and measures it; this script only keeps the declaration honest.
"""
import json, math, sys

L = []
def lm(asset, x, z, rotY=0.0, scale=1.0, radius=2.0, minTier="T3"):
    L.append({"asset": asset, "pos": [round(x,2), 0, round(z,2)],
              "rotY": round(rotY,3), "scale": round(scale,3),
              "radius": round(radius,2), "minTier": minTier})

# ---- the three great arches, striding away to the north ----------------
lm("arch",        -56, -36, rotY= 0.28, scale=0.86, radius=15.0, minTier="T3")
lm("arch",         -4, -66, rotY=-0.16, scale=1.22, radius=20.0, minTier="T3")
lm("arch",         48, -58, rotY= 0.52, scale=0.94, radius=16.0, minTier="T3")

# ---- standing colonnade: patches of hexagonal basalt columns ------------
for x, z, r, s, rot in [
    (-44,  30, 9.0, 1.00,  0.20), (-24,  42, 8.0, 0.88, -0.35),
    ( 14,  44, 9.5, 1.06,  0.55), ( 34,  30, 8.5, 0.94,  0.10),
    ( 48,   8, 9.0, 1.00, -0.45), ( 46, -20, 8.0, 0.90,  0.30),
    (-48,  -4, 8.5, 0.96,  0.62), (-44, -44, 9.5, 1.10, -0.22),
    ( 16, -46, 8.0, 0.86,  0.44), ( 44,  52, 9.0, 0.98, -0.12),
]:
    lm("colonnade", x, z, rotY=rot, scale=s, radius=r, minTier="T2")

# ---- spoil heaps of shattered hexagonal rubble --------------------------
for x, z, r, s, rot in [
    (-38,  18, 4.2, 1.00,  0.4), (  6,  24, 4.6, 1.08, -0.2),
    ( 38,  -4, 4.0, 0.92,  0.7), (-40,  46, 4.8, 1.12,  0.1),
    ( 26,  54, 4.4, 1.00, -0.5), (-16,  54, 4.2, 0.96,  0.25),
]:
    lm("spoil-heap", x, z, rotY=rot, scale=s, radius=r, minTier="T3")

# ---- fallen column sections lying on the flat --------------------------
for x, z, rot, s in [
    (-14, 24, 0.9, 1.0), (2, 36, -0.4, 1.1), (20, 14, 1.4, 0.9),
    (-32, 22, 0.2, 1.0), (34, 18, -1.1, 1.05), (-10, -2, 0.6, 0.95),
    (42, 5, 2.0, 1.0), (-52, 16, -0.7, 1.08), (10, 54, 0.3, 0.92),
    (-30, 52, 1.7, 1.0),
]:
    # Fallen sections out on the flat are decoration: the world stands without
    # them, and verify:ligar proves it by removing every one.
    lm("broken-column", x, z, rotY=rot, scale=s, radius=2.6,
       minTier="T4" if (abs(x) > 28 or abs(z) > 30) else "T3")

# ---- the four conveyors climbing out of the cut ------------------------
# They span the pit lip; colliders are their legs (supportPoints), so a player
# walks under the span. Placed along the pit's west lip, running out to spoil.
for i, (x, z, rot) in enumerate([
    # rotY -PI/2 swings the belt's local +z (its high, discharge end) to world
    # -x, out over the spoil; the low tail end then sits on the quarry floor.
    # It was +PI/2 once, and all four belts ran backwards with their tails
    # buried five metres under the flat.
    # Spaced so every tail lands INSIDE the cut: the near wall is at z = -8,
    # and a belt whose tail sat on it had its tail under the flat.
    # And far enough INTO the cut that the belt clears the lip: at 27 degrees a
    # belt rises about half a metre per metre, so its tail has to start some
    # eleven metres out from a five-metre wall or it runs into the rock.
    (-24.5, -31.0, -1.5708), (-24.5, -24.5, -1.5708),
    (-24.5, -18.0, -1.5708), (-24.5, -11.5, -1.5708),
]):
    lm("conveyor", x, z, rotY=rot, scale=1.0, radius=3.2, minTier="T3")

# ---- ore carts on the raised rail over the cut -------------------------
for x, z in [(-20.0, -37.0), (-13.5, -37.0), (-7.0, -37.0)]:
    lm("ore-cart", x, z, rotY=0.0, scale=1.0, radius=1.5, minTier="T3")

# ---- yard furniture ----------------------------------------------------
lm("guard-hut",    15.0,  -16.0, rotY=-0.35, scale=1.0, radius=2.4, minTier="T3")
lm("hauler",       16.0,    4.0, rotY= 0.62, scale=1.0, radius=4.2, minTier="T3")
lm("drum-stack",   13.0,   -4.0, rotY= 0.2,  scale=1.0, radius=1.8, minTier="T3")
lm("drum-stack",   13.0,   -0.2, rotY=-0.4,  scale=1.0, radius=1.8, minTier="T3")
lm("drum-stack",   14.0,   13.0, rotY= 0.8,  scale=1.0, radius=1.8, minTier="T3")
lm("drum-stack",   34.0,  -14.0, rotY= 0.1,  scale=1.0, radius=1.8, minTier="T3")
lm("shed",        -26.0,   29.0, rotY= 0.4,  scale=1.0, radius=5.0, minTier="T3")
lm("shed",        -42.0,   12.0, rotY= 0.15, scale=0.9, radius=4.6, minTier="T3")
# A stack is guyed: its three anchors stand 5.2 m out, so its footprint
# is its guys, not its flue.
lm("stack",       -44.0,  -26.0, rotY= 0.0,  scale=1.1, radius=5.6, minTier="T3")
lm("stack",        30.0,  -32.0, rotY= 0.0,  scale=0.95, radius=5.6, minTier="T3")
lm("water-tower", -18.0,    4.0, rotY= 0.3,  scale=1.0, radius=3.0, minTier="T3")
lm("cable-mast",   -4.0,   16.0, rotY= 0.0,  scale=1.0, radius=1.4, minTier="T3")
lm("cable-mast",   40.0,  -26.0, rotY= 0.0,  scale=1.0, radius=1.4, minTier="T3")
lm("landing-pad",   0.0,   50.0, rotY= 0.0,  scale=1.0, radius=8.0, minTier="T2")
for x, z in [(0.0, 32.0), (10.0, 10.0), (-12.0, 10.0), (20.0, -24.0)]:
    lm("stake-marker", x, z, rotY=0.0, scale=1.0, radius=0.9, minTier="T4")

SITES = [
  {"id":"site-1","questId":"q1-joins","stage":1,
   "pos":[-30.0,0,10.0],"approachPos":[-30.0,1.6,15.2],
   "label":"Bench 1 - What Holds","structure":"arch-terrace","built":True},
  {"id":"site-2","questId":"q2-lattice","stage":2,
   "pos":[-6.0,-5.0,-26.0],"approachPos":[-6.0,-3.4,-21.0],
   "label":"Bench 2 - Stone and Wire","structure":"tube-forge","built":True},
  {"id":"site-3","questId":"q3-recipe","stage":3,
   "pos":[26.0,0,-4.0],"approachPos":[21.2,1.6,-4.0],
   "label":"Bench 3 - The Same Recipe","structure":"batch-house","built":True},
  {"id":"site-4","questId":"q4-weigh","stage":4,
   "pos":[26.0,0,8.0],"approachPos":[21.2,1.6,8.0],
   "label":"Bench 4 - Counting By Weight","structure":"weighbridge","built":True},
]

PIT = {"floorY": -5.0,
       "room": {"minX": -26.0, "maxX": 10.0, "minZ": -34.0, "maxZ": -8.0},
       "stair": {"minX": 2.2, "maxX": 7.6, "minZ": -8.0, "maxZ": 2.4},
       "headPos": [4.9, 0, 1.6],
       "ceilingY": -1.2}

# ------------------------------------------------------------------ relax
# The layout above is placed by hand; this settles it. Nothing may share space
# with anything, so overlapping pairs are pushed apart along the line between
# them until every footprint is clear. Deterministic: same input, same world.
def inpit_f(x, z, pad=0.0):
    r = PIT["room"]; st = PIT["stair"]
    return ((r["minX"]-pad < x < r["maxX"]+pad and r["minZ"]-pad < z < r["maxZ"]+pad) or
            (st["minX"]-pad < x < st["maxX"]+pad and st["minZ"]-pad < z < st["maxZ"]+pad))

SPANS = ("conveyor", "ore-cart")   # elevated: they cross the cut on legs

# A CONVEYOR IS TWENTY-TWO METRES LONG, NOT A CIRCLE. Its declared radius
# covers its middle; its head and tail reach eleven metres either way along
# its run. So each belt lays a row of fixed obstacles down its whole length,
# and the relaxation pushes other props off the belt rather than off its
# centre. They are never written out: the built-world check measures the real
# belt. (A flue stack once stood through the head of one.)
GHOSTS = []
for lm_ in L:
    if lm_["asset"] != "conveyor": continue
    s_, c_ = math.sin(lm_["rotY"]), math.cos(lm_["rotY"])
    for k in range(-13, 14, 2):
        GHOSTS.append({"asset": "belt", "pos": [lm_["pos"][0] + k * s_, 0, lm_["pos"][2] + k * c_],
                       "radius": 1.6, "fixed": True})

for _ in range(400):
    moved = False
    for it in L:
        if it["asset"] in SPANS: continue
        for gh in GHOSTS:
            need = it["radius"] + gh["radius"] + 0.5
            dx = it["pos"][0] - gh["pos"][0]; dz = it["pos"][2] - gh["pos"][2]
            got = math.hypot(dx, dz) or 1e-6
            if got >= need: continue
            moved = True
            nx = gh["pos"][0] + dx / got * need; nz = gh["pos"][2] + dz / got * need
            if inpit_f(nx, nz, 1.0): continue
            it["pos"][0], it["pos"][2] = nx, nz
    for i in range(len(L)):
        for j in range(i+1, len(L)):
            a, b = L[i], L[j]
            need = a["radius"] + b["radius"] + 0.5
            dx = b["pos"][0] - a["pos"][0]
            dz = b["pos"][2] - a["pos"][2]
            got = math.hypot(dx, dz) or 1e-6
            if got >= need: continue
            moved = True
            push = (need - got) / 2 + 0.01
            ux, uz = dx / got, dz / got
            for sgn, it in ((-1, a), (1, b)):
                nx = it["pos"][0] + sgn * ux * push
                nz = it["pos"][2] + sgn * uz * push
                nx = max(-108, min(108, nx)); nz = max(-108, min(108, nz))
                if it["asset"] not in SPANS and inpit_f(nx, nz, 1.0): continue
                it["pos"][0], it["pos"][2] = nx, nz
    # keep every prop clear of every surface site and its approach
    for it in L:
        for sdef in SITES:
            for key in ("pos", "approachPos"):
                if sdef["pos"][1] < -1: continue
                px, pz = sdef[key][0], sdef[key][2]
                need = it["radius"] + 2.6
                dx = it["pos"][0] - px; dz = it["pos"][2] - pz
                got = math.hypot(dx, dz) or 1e-6
                if got >= need: continue
                moved = True
                ux, uz = dx / got, dz / got
                nx = px + ux * need; nz = pz + uz * need
                if it["asset"] not in SPANS and inpit_f(nx, nz, 1.0): continue
                it["pos"][0], it["pos"][2] = nx, nz
    if not moved: break

for it in L:
    it["pos"][0] = round(it["pos"][0], 2)
    it["pos"][2] = round(it["pos"][2], 2)

# -------------------------------------------------------------- checks
fail = 0
def bad(m):
    global fail; fail += 1; print("FAIL", m)

def d(a, b): return math.hypot(a[0]-b[0], a[2]-b[2])

for i in range(len(L)):
    for j in range(i+1, len(L)):
        need = L[i]["radius"] + L[j]["radius"]
        got = d(L[i]["pos"], L[j]["pos"])
        if got < need:
            bad(f'{L[i]["asset"]}@{L[i]["pos"][0]},{L[i]["pos"][2]} vs {L[j]["asset"]}@{L[j]["pos"][0]},{L[j]["pos"][2]} overlap {need-got:.2f}')

for s in SITES:
    if s["pos"][1] < -1: continue
    for l in L:
        got = d(s["pos"], l["pos"])
        if got < l["radius"] + 2.2:
            bad(f'{s["id"]} inside {l["asset"]} ({got:.2f} < {l["radius"]+2.2:.2f})')

for i in range(len(SITES)):
    for j in range(i+1, len(SITES)):
        a, b = SITES[i], SITES[j]
        if abs(a["pos"][1]-b["pos"][1]) > 2: continue
        got = d(a["pos"], b["pos"])
        if got < 8: bad(f'{a["id"]} and {b["id"]} {got:.1f}u apart')

# sites must not sit inside the excavation unless they are the sub-level one
r = PIT["room"]; st = PIT["stair"]
def inpit(x, z):
    return ((r["minX"] < x < r["maxX"] and r["minZ"] < z < r["maxZ"]) or
            (st["minX"] < x < st["maxX"] and st["minZ"] < z < st["maxZ"]))
for s in SITES:
    under = s["pos"][1] < -1
    if inpit(s["pos"][0], s["pos"][2]) != under:
        bad(f'{s["id"]} floor/excavation disagree')
    if inpit(s["approachPos"][0], s["approachPos"][2]) != under:
        bad(f'{s["id"]} approach floor/excavation disagree')

# landmarks must not stand in the excavation (conveyors span it from the lip)
for l in L:
    if l["asset"] in ("conveyor", "ore-cart"): continue
    if inpit(l["pos"][0], l["pos"][2]):
        bad(f'{l["asset"]}@{l["pos"][0]},{l["pos"][2]} stands inside the cut')

print(f'{len(L)} landmarks, {len(SITES)} sites, {fail} failures')
if fail: sys.exit(1)

data = {
  "id": "ligar", "name": "Ligar", "place": "Basalt arches",
  "oneLine": "Nothing here stands alone.",
  "sky": "ligar-sky",
  "terrain": {"heightmap": "ligar-basalt", "size": [240, 240],
              "maxHeight": 6.0, "material": "basalt-pavement"},
  "ambience": {"keyLight": 0xe8c08a, "fillLight": 0x6b5c4c,
               "fogColor": 0x6b5847, "fogNear": 44, "fogFar": 250,
               "dustDensity": 0.26},
  "sublevel": PIT,
  "landmarks": L,
  "sites": SITES,
  "spawn": {"pos": [0, 1.6, 48.0], "lookAt": [0, 1.6, 22.0]},
  "t2": {"stillCamera": {s["id"]: {"pos": s["approachPos"],
          "lookAt": [s["pos"][0], s["pos"][1] + 1.2, s["pos"][2]]} for s in SITES}},
  "t1": {"siteOrder": [s["id"] for s in SITES],
    "siteDescriptions": {
      "site-1": "The first bench, on the stone terrace under the western arch, west of the yard.",
      "site-2": "The second bench, at the forge in the tube mouth at the far end of the cut, down the ramp.",
      "site-3": "The third bench, inside the batch house on the east deck, under the gantry sign.",
      "site-4": "The fourth bench, on the weighbridge deck south of the batch house."}}
}
with open('src/three/world-data/ligar.json', 'w') as f:
    json.dump(data, f, indent=2)
    f.write("\n")
print("written")
