# T3 and Below: Complete Media Generation Guide (Videos & Images)

## 1. Generation Parameters & Rules

### [VIDEO] Video Specifications
- **Engine:** Google Veo / Gemini Video (1080p, 16:9, 8s clips).
- **Mode:** Image-to-Video using source stills in `public/art/` (guarantees aesthetic lock with UI stills).
- **Loops:** Seamless (first frame = last frame, or 0.5s ffmpeg crossfade).
- **Cinematics (16s):** Two 8s clips chained (Clip B first frame = Clip A last frame).
- **Bake command:** Save raw `.mp4` to `assets-src/video/<id>.mp4`, then run `npm run bake:video`.

### [IMAGE] Image Specifications
- **Engines:** Midjourney v6 / Imagen 3 / FLUX.1 / Blockade Labs (Skybox AI).
- **Aspect Ratios:**
  - Backdrops / Stills: `16:9` (`--ar 16:9`), 1920×1080 minimum. Save to `public/art/<id>.jpg`.
  - Skyboxes: `2:1` equirectangular panorama (`--ar 2:1`), 4096×2048 downsampled to 2048×1024. Save to `public/art/skybox/<id>.jpg`.
  - Tileable PBR Textures: `1:1` (`--tile`), 1024×1024. Save to `public/art/textures/<id>.jpg`.
  - 3D Concept Stills: `1:1` or `4:3`, isolated object on neutral grey studio backdrop for Hunyuan3D/Tripo.

---

## 2. Global Style & Negative Blocks

### Universal Style Lock (Paste at START of every prompt)
```text
Cinematic film still come to life, 35mm anamorphic, shallow depth of field, heavy film grain. Used-universe science fiction: advanced machinery that has sat in desert dust for forty years and still works. Scratched, sandblasted durasteel plates with cut corners, exposed rivets, grime in the seams. Warm dark palette of sand, rust and umber. The only light sources are dim tungsten filament lamps glowing amber from inside the machines, plus cool pale starlight. Dust motes hang in the air. Slow, deliberate, weighty motion.
```

### Universal Negative Block (Paste at END of every prompt)
```text
No text, no letters, no numbers, no logos, no user interface overlays. No neon, no glowing bloom, no cyan, no holograms, no lens flares, no glossy plastic, no people's faces, no rounded consumer-electronics design.
```

---

## 3. Master Asset Roster (Videos vs Images)

| ID | Media Type | Category | Source / Target | Status | Role / Trigger Screen |
|---|---|---|---|---|---|
| `guild_mining` | **[VIDEO]** | 8s Loop | `public/art/factions.jpg` | **MISSING** | Onboarding: Earth Guild card (`onboarding.js`) |
| `guild_air` | **[VIDEO]** | 8s Loop | `public/art/factions_fleet.jpg` | **MISSING** | Onboarding: Air Guild card (`onboarding.js`) |
| `guild_fire` | **[VIDEO]** | 8s Loop | `public/art/factions.jpg` | **MISSING** | Onboarding: Fire Guild card (`onboarding.js`) |
| `guild_water` | **[VIDEO]** | 8s Loop | `public/art/hero_desert_outpost.jpg` | **MISSING** | Onboarding: Water Guild card (`onboarding.js`) |
| `quarters_loop` | **[VIDEO]** | 8s Loop | `public/art/quarters.jpg` | **MISSING** | Crew Quarters & berths header (`quarters.js`) |
| `tallow_basin` | **[IMAGE]** | 16:9 Backdrop | `public/art/tallow_basin.jpg` | **MISSING** | Learn World 01 (Tallow) 2D backdrop (`learn-world.js`) |
| `ligar_arches` | **[IMAGE]** | 16:9 Backdrop | `public/art/ligar_arches.jpg` | **MISSING** | Learn World 02 (Ligar) 2D backdrop (`learn-world.js`) |
| `pyros_forge` | **[IMAGE]** | 16:9 Backdrop | `public/art/pyros_forge.jpg` | **MISSING** | Sector 02 (Pyros Prime) 2D star chart backdrop |
| `cryo_tundra` | **[IMAGE]** | 16:9 Backdrop | `public/art/cryo_tundra.jpg` | **MISSING** | Sector 03 (Cryo-Haven) 2D star chart backdrop |
| `aetheria_gas` | **[IMAGE]** | 16:9 Backdrop | `public/art/aetheria_gas.jpg` | **MISSING** | Sector 04 (Aetheria) 2D star chart backdrop |
| `skybox_erebus` | **[IMAGE]** | 2:1 Panorama | `public/art/skybox/erebus.jpg` | **MISSING** | 360° sky for Erebus (T3/T2 crop) |
| `skybox_tallow` | **[IMAGE]** | 2:1 Panorama | `public/art/skybox/tallow.jpg` | **MISSING** | 360° sky for Tallow (T3/T2 crop) |
| `skybox_ligar` | **[IMAGE]** | 2:1 Panorama | `public/art/skybox/ligar.jpg` | **MISSING** | 360° sky for Ligar (T3/T2 crop) |
| `tex_desert_grit` | **[IMAGE]** | 1:1 PBR Texture | `public/art/textures/desert_grit.jpg` | **MISSING** | Seamless ground albedo for Erebus |
| `tex_durasteel_deck` | **[IMAGE]** | 1:1 PBR Texture | `public/art/textures/durasteel_deck.jpg` | **MISSING** | Seamless ribbed durasteel ship deck |
| `tex_bulkhead_panel`| **[IMAGE]** | 1:1 PBR Texture | `public/art/textures/bulkhead_panel.jpg` | **MISSING** | Seamless anodised wall bulkhead |
| `concept_charge_pylon` | **[IMAGE]** | 1:1 3D Concept | `public/art/concept/pylon.jpg` | **MISSING** | Input for image-to-3D pylon model |
| `concept_survey_lander`| **[IMAGE]** | 1:1 3D Concept | `public/art/concept/lander.jpg` | **MISSING** | Input for image-to-3D lander model |
| `cockpit_loop` | **[VIDEO]** | 8s Loop | `public/art/cockpit.jpg` | Baked | Landing banner, Bridge header, T3 Cockpit CRT |
| `crucible_loop` | **[VIDEO]** | 8s Loop | `public/art/crucible.jpg` | Baked | Bridge reactor CRT, Learn World header |
| `starmap_loop` | **[VIDEO]** | 8s Loop | `public/art/starmap.jpg` | Baked | Star Map 2D header, Learn Hub header |
| `comms_loop` | **[VIDEO]** | 8s Loop | `public/art/comms.jpg` | Baked | Standings / Fleet Comms header (`leaderboard.js`) |
| `cargo_loop` | **[VIDEO]** | 8s Loop | `public/art/cargo.jpg` | Baked | Inventory header (`inventory.js`) |
| `airlock_loop` | **[VIDEO]** | 8s Loop | `public/art/airlock.jpg` | Baked | Airlock node, Quarters fallback |
| `vess_transmission` | **[VIDEO]** | 8s Loop | *(Text-to-video)* | Baked | Diegetic CRT transmission inset (`transmission.js`) |
| `cold_open` | **[VIDEO]** | Cine (8s) | `public/art/cockpit.jpg` | Baked | First visit wake-up (`onboarding.js`) |
| `launch` | **[VIDEO]** | Cine (8s) | `public/art/bridge.jpg` | Baked | Session Zero end, Sector 01 launch |
| `erebus_descent` | **[VIDEO]** | Cine (16s) | `public/art/hero_desert_outpost.jpg` | Baked | First entry to Sector 01 Erebus |
| `gardens_reveal` | **[VIDEO]** | Cine (8s) | `public/art/hero_desert_outpost.jpg` | Baked | Sector 01 intro before Stage 1 |
| `pylon_wake` | **[VIDEO]** | Cine (8s) | `public/art/crucible.jpg` | Baked | Milestone clears (Stages 7, 10, 15) |
| `gardens_restored` | **[VIDEO]** | Cine (16s) | `public/art/hero_desert_outpost.jpg` | Baked | Stage 20 cleared (Erebus restored) |
| `item_award` | **[VIDEO]** | Cine (8s) | `public/art/cargo.jpg` | Baked | First quest cosmetic item unsealed |

---

## 4. Prompts: Missing Videos [ACTION REQUIRED]

### 1. `guild_mining` [VIDEO] (Earth Guild · Mineral Mining)
- **Type:** `[VIDEO]` (8s seamless loop, muted)
- **Source still:** `public/art/factions.jpg`
- **Output:** `assets-src/video/guild_mining.mp4`
```text
Cinematic film still come to life, 35mm anamorphic, shallow depth of field, heavy film grain. Used-universe science fiction: advanced machinery that has sat in desert dust for forty years and still works. Scratched, sandblasted durasteel plates with cut corners, exposed rivets, grime in the seams. Warm dark palette of sand, rust and umber. The only light sources are dim tungsten filament lamps glowing amber from inside the machines, plus cool pale starlight. Dust motes hang in the air. Slow, deliberate, weighty motion.

A colossal tracked mining crawler grinding slowly across a rust-red canyon floor. Its heavy drill arm turns slowly and throws up curtains of fine dust, with tiny amber work lamps glowing on its hull. Wide shot, slow lateral pan, heat shimmer in the canyon. Seamless loop.

No text, no letters, no numbers, no logos, no user interface overlays. No neon, no glowing bloom, no cyan, no holograms, no lens flares, no glossy plastic, no people's faces, no rounded consumer-electronics design.
```

### 2. `guild_air` [VIDEO] (Air Guild · Atmospheric Harvesters)
- **Type:** `[VIDEO]` (8s seamless loop, muted)
- **Source still:** `public/art/factions_fleet.jpg`
- **Output:** `assets-src/video/guild_air.mp4`
```text
Cinematic film still come to life, 35mm anamorphic, shallow depth of field, heavy film grain. Used-universe science fiction: advanced machinery that has sat in desert dust for forty years and still works. Scratched, sandblasted durasteel plates with cut corners, exposed rivets, grime in the seams. Warm dark palette of sand, rust and umber. The only light sources are dim tungsten filament lamps glowing amber from inside the machines, plus cool pale starlight. Dust motes hang in the air. Slow, deliberate, weighty motion.

Tall skeletal harvester towers rise from the swirling cloud tops of a banded gas giant. Their long intake scoops trail through pale ochre and amber cloud bands, and a small boxy tug ship drifts slowly past in the distance. Slow aerial drift, majestic scale. Seamless loop.

No text, no letters, no numbers, no logos, no user interface overlays. No neon, no glowing bloom, no cyan, no holograms, no lens flares, no glossy plastic, no people's faces, no rounded consumer-electronics design.
```

### 3. `guild_fire` [VIDEO] (Fire Guild · Thermal Smelters)
- **Type:** `[VIDEO]` (8s seamless loop, muted)
- **Source still:** `public/art/factions.jpg`
- **Output:** `assets-src/video/guild_fire.mp4`
```text
Cinematic film still come to life, 35mm anamorphic, shallow depth of field, heavy film grain. Used-universe science fiction: advanced machinery that has sat in desert dust for forty years and still works. Scratched, sandblasted durasteel plates with cut corners, exposed rivets, grime in the seams. Warm dark palette of sand, rust and umber. The only light sources are dim tungsten filament lamps glowing amber from inside the machines, plus cool pale starlight. Dust motes hang in the air. Slow, deliberate, weighty motion.

Inside an enormous industrial foundry carved into black volcanic rock, a massive cylindrical crucible slowly tips and pours molten orange liquid metal into a stone channel. Sparks drift through darkness, heavy heat shimmer rises, silhouetted overhead gantries. Slow dolly shot. Seamless loop.

No text, no letters, no numbers, no logos, no user interface overlays. No neon, no glowing bloom, no cyan, no holograms, no lens flares, no glossy plastic, no people's faces, no rounded consumer-electronics design.
```

### 4. `guild_water` [VIDEO] (Water Guild · Moisture Extraction)
- **Type:** `[VIDEO]` (8s seamless loop, muted)
- **Source still:** `public/art/hero_desert_outpost.jpg`
- **Output:** `assets-src/video/guild_water.mp4`
```text
Cinematic film still come to life, 35mm anamorphic, shallow depth of field, heavy film grain. Used-universe science fiction: advanced machinery that has sat in desert dust for forty years and still works. Scratched, sandblasted durasteel plates with cut corners, exposed rivets, grime in the seams. Warm dark palette of sand, rust and umber. The only light sources are dim tungsten filament lamps glowing amber from inside the machines, plus cool pale starlight. Dust motes hang in the air. Slow, deliberate, weighty motion.

A lonely field of tall, slender moisture-collecting towers standing in a pale desert basin at dawn. Drops of condensation slowly drip from a condenser vane into a dented steel tank. Two pale suns sit low on the dusty horizon, desert wind blowing sand across the ground. Static wide shot. Seamless loop.

No text, no letters, no numbers, no logos, no user interface overlays. No neon, no glowing bloom, no cyan, no holograms, no lens flares, no glossy plastic, no people's faces, no rounded consumer-electronics design.
```

### 5. `quarters_loop` [VIDEO] (Crew Quarters · Berth A / B)
- **Type:** `[VIDEO]` (8s seamless loop, muted)
- **Source still:** `public/art/quarters.jpg`
- **Output:** `assets-src/video/quarters_loop.mp4`
```text
Cinematic film still come to life, 35mm anamorphic, shallow depth of field, heavy film grain. Used-universe science fiction: advanced machinery that has sat in desert dust for forty years and still works. Scratched, sandblasted durasteel plates with cut corners, exposed rivets, grime in the seams. Warm dark palette of sand, rust and umber. The only light sources are dim tungsten filament lamps glowing amber from inside the machines, plus cool pale starlight. Dust motes hang in the air. Slow, deliberate, weighty motion.

A cramped crew bunk cabin: fold-down steel cot with coarse blanket, personal footlocker, small thick circular porthole with distant stars sliding past very slowly. A dim tungsten reading lamp mounted to the bulkhead flickers once softly. Dust motes floating in stillness. Seamless loop.

No text, no letters, no numbers, no logos, no user interface overlays. No neon, no glowing bloom, no cyan, no holograms, no lens flares, no glossy plastic, no people's faces, no rounded consumer-electronics design.
```

---

## 5. Prompts: Missing Images [ACTION REQUIRED]

### 5.1 Screen Backdrops & Stills [IMAGE] (16:9, Midjourney / Imagen 3)

#### 1. `tallow_basin` [IMAGE] (Learn Unit 01 · Tallow 2D Backdrop)
- **Type:** `[IMAGE]` (16:9 still, 1920×1080)
- **Target:** `public/art/tallow_basin.jpg`
- **Prompt:**
```text
Cinematic film still, 35mm anamorphic, shallow depth of field, heavy film grain. Used-universe science fiction: advanced machinery that has sat in desert dust for forty years and still works. Scratched, sandblasted durasteel plates with cut corners, exposed rivets, grime in the seams. Warm dark palette of bone-white, sand, rust and umber.

Wide landscape shot of the blinding salt basins of planet Tallow. Bleached white salt flats stretch to a low horizon under a hazy pale amber sky. In the middle ground, five industrial salvage lab benches and rusted hopper gantries stand half-buried in salt crust. Weathered tracked vehicle ruts cut through the hardpan. Distant skeletal extraction towers silhouette against the pale horizon.

No text, no letters, no numbers, no logos, no user interface overlays. No neon, no glowing bloom, no cyan, no holograms, no lens flares, no glossy plastic, no people's faces, no rounded consumer-electronics design. --ar 16:9
```

#### 2. `ligar_arches` [IMAGE] (Learn Unit 02 · Ligar 2D Backdrop)
- **Type:** `[IMAGE]` (16:9 still, 1920×1080)
- **Target:** `public/art/ligar_arches.jpg`
- **Prompt:**
```text
Cinematic film still, 35mm anamorphic, shallow depth of field, heavy film grain. Used-universe science fiction: advanced machinery that has sat in desert dust for forty years and still works. Scratched, sandblasted durasteel plates with cut corners, exposed rivets, grime in the seams. Warm dark palette of dark basalt, amber rust, and deep charcoal.

Landscape of planet Ligar: an iron-sand plain dominated by monumental hexagonal basalt column clusters rising out of the ground like stepped terraces. Towering natural arches of raw smoky quartz crystal lattice span across the dark sky overhead, catching dim amber light from industrial work lamps bolted to stone pylons. Below, four cased field lab benches sit on a sunken quarry stone floor.

No text, no letters, no numbers, no logos, no user interface overlays. No neon, no glowing bloom, no cyan, no holograms, no lens flares, no glossy plastic, no people's faces, no rounded consumer-electronics design. --ar 16:9
```

#### 3. `pyros_forge` [IMAGE] (Campaign Sector 02 · Pyros Prime Backdrop)
- **Type:** `[IMAGE]` (16:9 still, 1920×1080)
- **Target:** `public/art/pyros_forge.jpg`
- **Prompt:**
```text
Cinematic film still, 35mm anamorphic, shallow depth of field, heavy film grain. Used-universe science fiction: advanced machinery that has sat in desert dust for forty years and still works. Scratched, sandblasted durasteel plates with cut corners, exposed rivets, grime in the seams. Warm dark palette of volcanic obsidian, iron slag, and glowing amber-orange.

Volcanic refinery caldera on Pyros Prime: dark basalt cliffs terraced with heavy smelter machinery and rusty steel sluices carrying molten orange slag. Thick black smoke plumes drift through a sulfur-tinted atmosphere. Overhead gantries and conveyor trusses span the cavernous gorge, lit by warm tungsten floodlamps.

No text, no letters, no numbers, no logos, no user interface overlays. No neon, no glowing bloom, no cyan, no holograms, no lens flares, no glossy plastic, no people's faces, no rounded consumer-electronics design. --ar 16:9
```

#### 4. `cryo_tundra` [IMAGE] (Campaign Sector 03 · Cryo-Haven Backdrop)
- **Type:** `[IMAGE]` (16:9 still, 1920×1080)
- **Target:** `public/art/cryo_tundra.jpg`
- **Prompt:**
```text
Cinematic film still, 35mm anamorphic, shallow depth of field, heavy film grain. Used-universe science fiction: advanced machinery that has sat in desert dust for forty years and still works. Scratched, sandblasted durasteel plates with cut corners, exposed rivets, grime in the seams. Warm dark palette: pale frozen gravel, frost-rimed rust, umber and muted bronze, dim warm sodium lamps.

Permafrost tundra on Cryo-Haven: a vast barren landscape of frozen gravel and black rock fissures. Deep ice crevasses, but machinery remains heavy industrial steel coated in frost and blowing rime. An abandoned communications relay station with guyed antenna masts stands battered by wind, warm sodium beacon pulsing amber against a dim stormy twilight sky.

No text, no letters, no numbers, no logos, no user interface overlays. No neon, no glowing bloom, no cyan, no holograms, no lens flares, no glossy plastic, no people's faces, no rounded consumer-electronics design. --ar 16:9
```

#### 5. `aetheria_gas` [IMAGE] (Campaign Sector 04 · Aetheria Backdrop)
- **Type:** `[IMAGE]` (16:9 still, 1920×1080)
- **Target:** `public/art/aetheria_gas.jpg`
- **Prompt:**
```text
Cinematic film still, 35mm anamorphic, shallow depth of field, heavy film grain. Used-universe science fiction: advanced machinery that has sat in desert dust for forty years and still works. Scratched, sandblasted durasteel plates with cut corners, exposed rivets, grime in the seams. Warm dark palette of deep amber, ochre, umber, and muted brass cloud layers.

Upper cloud decks of gas giant Aetheria: massive swirling bands of dense ochre and amber atmospheric clouds under a dim distant star. A solitary floating aerostat station — modular durasteel hulls held aloft by thermal ballast cells and stabilizer fins — drifts through the cloud canyons, trailing tether cables into the depth.

No text, no letters, no numbers, no logos, no user interface overlays. No neon, no glowing bloom, no cyan, no holograms, no lens flares, no glossy plastic, no people's faces, no rounded consumer-electronics design. --ar 16:9
```

---

### 5.2 360° Equirectangular Skyboxes [IMAGE] (2:1 Ratio, Blockade Labs / Midjourney)

#### 1. `skybox_erebus` [IMAGE] (Erebus 360° Sky)
- **Type:** `[IMAGE]` (2:1 equirectangular panorama, 4096×2048)
- **Target:** `public/art/skybox/erebus.jpg`
- **Prompt:**
```text
360 degree equirectangular panorama, 2:1 aspect ratio, seamless left-right wrap, horizon on the vertical midline. Used-universe science fiction aesthetic, warm palette.

Erebus: a desert world at low sun. Dust-laden amber sky grading to deep umber at zenith, a banded gas giant low on the horizon taking up 20 degrees of arc with its ring system edge-on, one small pale moon, distant mesa silhouettes along the horizon line, suspended dust reducing contrast with distance. No ground plane detail below -20 degrees elevation (covered by terrain). No sun disc in frame. No stars on the day side.

No text, no watermark, no vignette, no neon, no people, no lens flare. --ar 2:1
```

#### 2. `skybox_tallow` [IMAGE] (Tallow 360° Sky)
- **Type:** `[IMAGE]` (2:1 equirectangular panorama, 4096×2048)
- **Target:** `public/art/skybox/tallow.jpg`
- **Prompt:**
```text
360 degree equirectangular panorama, 2:1 aspect ratio, seamless left-right wrap, horizon on the vertical midline. Used-universe science fiction aesthetic, muted high-key palette.

Tallow: a blinding salt-basin world. Hazy bone-white and pale cream sky with faint dust rings overhead. Distant low limestone ridges and extraction towers silhouetted along the flat horizon line. Flat, even, bleached atmospheric light. No ground plane detail below -20 degrees elevation. No direct sun flare.

No text, no watermark, no vignette, no neon, no people, no lens flare. --ar 2:1
```

#### 3. `skybox_ligar` [IMAGE] (Ligar 360° Sky)
- **Type:** `[IMAGE]` (2:1 equirectangular panorama, 4096×2048)
- **Target:** `public/art/skybox/ligar.jpg`
- **Prompt:**
```text
360 degree equirectangular panorama, 2:1 aspect ratio, seamless left-right wrap, horizon on the vertical midline. Used-universe science fiction aesthetic, dark twilight palette.

Ligar: a dark volcanic world at deep twilight. Charcoal and deep indigo sky grading to muted bronze at the horizon line. Distant silhouettes of towering basalt columns and crystal arch spans breaking the skyline. Faint distant nebula dust visible in upper zenith. No ground detail below -20 degrees elevation.

No text, no watermark, no vignette, no neon, no people, no lens flare. --ar 2:1
```

---

### 5.3 Tileable PBR Textures [IMAGE] (1:1 Seamless, Midjourney / FLUX)

Derive Normal / Roughness / AO passes locally in Blender from the generated albedo maps.

#### 1. `tex_desert_grit` [IMAGE] (Desert Ground Albedo)
- **Type:** `[IMAGE]` (1:1 seamless tileable, 1024×1024)
- **Target:** `public/art/textures/desert_grit.jpg`
- **Prompt:**
```text
Seamless tileable PBR albedo texture, 1024x1024, orthographic top-down, even flat lighting with no baked shadows and no baked highlights, tiles perfectly on all four edges. Wind-rippled coarse desert grit with scattered dark basalt gravel and fine ochre sand filling the hollows. Matte finish, high surface detail. --tile --ar 1:1
```

#### 2. `tex_durasteel_deck` [IMAGE] (Ship Deck Plating Albedo)
- **Type:** `[IMAGE]` (1:1 seamless tileable, 1024×1024)
- **Target:** `public/art/textures/durasteel_deck.jpg`
- **Prompt:**
```text
Seamless tileable PBR albedo texture, 1024x1024, orthographic top-down, even flat lighting with no baked shadows and no baked highlights, tiles perfectly on all four edges. Worn ribbed durasteel deck plating with anti-slip chevron tread, scratched bare metal on ridges, and dry orange dust caked into the grooves. --tile --ar 1:1
```

#### 3. `tex_bulkhead_panel` [IMAGE] (Wall Bulkhead Albedo)
- **Type:** `[IMAGE]` (1:1 seamless tileable, 1024×1024)
- **Target:** `public/art/textures/bulkhead_panel.jpg`
- **Prompt:**
```text
Seamless tileable PBR albedo texture, 1024x1024, orthographic top-down, even flat lighting with no baked shadows and no baked highlights, tiles perfectly on all four edges. Scuffed anodised durasteel bulkhead panel with flush rivet rows, chamfered seam lines, and ghosted industrial stencilling worn away by desert grit. --tile --ar 1:1
```

---

### 5.4 3D Model Concept Stills [IMAGE] (1:1 Isolated Subject for Image-to-3D)

Framing rule for all concept stills:
*Single object centred, full object in frame with margin on all sides, three-quarter view slightly above eye level, plain neutral mid-grey studio background, soft ground shadow.*

#### 1. `concept_charge_pylon` [IMAGE]
- **Type:** `[IMAGE]` (1:1 concept still)
- **Target:** `public/art/concept/pylon.jpg`
- **Prompt:**
```text
Cinematic product-catalogue framing. Used-universe science fiction. Scratched, sandblasted durasteel with cut chamfered corners, exposed rivets, grime in the seams. Warm dark palette of sand, rust, umber. Single object centred, full object in frame with margin, three-quarter view slightly above eye level, plain mid-grey seamless background, soft ground shadow.

A derelict alien power pylon four metres tall: a tapered ceramic-and-durasteel mast on a splayed three-footed base half-buried in desert grit, a banded collar of cooling fins at two-thirds height, a dark inspection recess at chest height with a single dead amber indicator inside it, and a cracked dish crown. Weathered by four decades of abrasive sand.

No text, no letters, no logos, no neon, no people, no UI overlays. --ar 1:1
```

#### 2. `concept_survey_lander` [IMAGE]
- **Type:** `[IMAGE]` (1:1 concept still)
- **Target:** `public/art/concept/lander.jpg`
- **Prompt:**
```text
Cinematic product-catalogue framing. Used-universe science fiction. Scratched, sandblasted durasteel with cut chamfered corners, exposed rivets, grime in the seams. Warm dark palette of sand, rust, umber. Single object centred, full object in frame with margin, three-quarter view slightly above eye level, plain mid-grey seamless background, soft ground shadow.

A squat four-legged short-range descent craft: wedge fuselage, scorched heat-shield underbelly, a folded boarding ramp at the rear, two external cargo cradles, hull plating in worn sand-brown with stencilled two-letter guild designator markings worn to half legibility. Landed, ramp down, no crew.

No text, no letters, no logos, no neon, no people, no UI overlays. --ar 1:1
```

---

## 6. Reference: Existing Baked Assets [COMPLETED]

### Existing Baked Videos [VIDEO]
- `cockpit_loop` [VIDEO] — `public/video/cockpit_loop.{webm,mp4,jpg}` (Landing, Bridge, Cockpit CRT)
- `crucible_loop` [VIDEO] — `public/video/crucible_loop.{webm,mp4,jpg}` (Bridge reactor, Learn world)
- `starmap_loop` [VIDEO] — `public/video/starmap_loop.{webm,mp4,jpg}` (Star Map 2D, Learn hub)
- `comms_loop` [VIDEO] — `public/video/comms_loop.{webm,mp4,jpg}` (Standings / Fleet Comms)
- `cargo_loop` [VIDEO] — `public/video/cargo_loop.{webm,mp4,jpg}` (Inventory)
- `airlock_loop` [VIDEO] — `public/video/airlock_loop.{webm,mp4,jpg}` (Airlock node)
- `vess_transmission` [VIDEO] — `public/video/vess_transmission.{webm,mp4,jpg}` (CRT comms inset)
- `cold_open` [VIDEO] — `public/video/cold_open.{webm,mp4,jpg}` (First visit wake-up)
- `launch` [VIDEO] — `public/video/launch.{webm,mp4,jpg}` (Launch to Sector 01)
- `erebus_descent` [VIDEO] — `public/video/erebus_descent.{webm,mp4,jpg}` (Arrival at Erebus)
- `gardens_reveal` [VIDEO] — `public/video/gardens_reveal.{webm,mp4,jpg}` (Pre-stage 1 pylon field)
- `pylon_wake` [VIDEO] — `public/video/pylon_wake.{webm,mp4,jpg}` (Milestone clears 7, 10, 15)
- `gardens_restored` [VIDEO] — `public/video/gardens_restored.{webm,mp4,jpg}` (Stage 20 grid restoration)
- `item_award` [VIDEO] — `public/video/item_award.{webm,mp4,jpg}` (First quest cosmetic crate unseal)

### Existing Stills [IMAGE]
- `public/art/cockpit.jpg` [IMAGE]
- `public/art/bridge.jpg` [IMAGE]
- `public/art/crucible.jpg` [IMAGE]
- `public/art/starmap.jpg` [IMAGE]
- `public/art/comms.jpg` [IMAGE]
- `public/art/cargo.jpg` [IMAGE]
- `public/art/quarters.jpg` [IMAGE]
- `public/art/airlock.jpg` [IMAGE]
- `public/art/factions.jpg` [IMAGE]
- `public/art/factions_fleet.jpg` [IMAGE]
- `public/art/hero_cockpit.jpg` [IMAGE]
- `public/art/hero_desert_outpost.jpg` [IMAGE]
- `public/art/durasteel_plate.jpg` [IMAGE]
- `public/art/durasteel_cockpit_pbr.jpg` [IMAGE]
