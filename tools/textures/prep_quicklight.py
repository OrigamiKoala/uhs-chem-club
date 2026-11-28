"""Grade and pack Quicklight's CC0 texture sets into public/textures/quicklight/.

Every pack: <name>_diff.jpg (sRGB albedo), <name>_nor.jpg (OpenGL normal), <name>_arm.jpg (R AO, G rough, B metal).
No albedo value reaches pure black or white. Each pack is graded near-neutral and to a known mean, and the materials
in `src/three/quicklight.js` (`initPacks`) multiply it by a plain grey or a paint colour (or the ground's vertex paint).
Run: python3 -I prep_quicklight.py <download dir> <out dir>
"""
import sys, os
import numpy as np
from PIL import Image

DL, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
SIZE = 1024


def load(p, mode='RGB'):
    return np.asarray(Image.open(p).convert(mode).resize((SIZE, SIZE), Image.LANCZOS), dtype=np.float32) / 255.0


def save(a, p, q):
    a = np.clip(a * 255.0 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(a).save(p, quality=q, optimize=True, progressive=True)


def grade(rgb, sat, mean, tint=(1, 1, 1), contrast=1.0, lo=0.035, hi=0.9):
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    out = lum[..., None] + (rgb - lum[..., None]) * sat
    m = out.mean()
    out = (out - m) * contrast + m
    out = out * (mean / out.mean())
    out = out * np.array(tint, dtype=np.float32)
    return np.clip(out, lo, hi)


def lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def ph(asset):
    d = f'{DL}/{asset}'
    return load(f'{d}/{asset}_diff_1k.jpg'), load(f'{d}/{asset}_nor_gl_1k.jpg'), load(f'{d}/{asset}_arm_1k.jpg')


def remap(g, lo, hi):
    return lo + (g - g.min()) / max(1e-6, g.max() - g.min()) * (hi - lo)


def pack(name, diff, nor, arm, q=(80, 74, 70), rough=None, metal=0.0):
    save(diff, f'{OUT}/{name}_diff.jpg', q[0])
    save(nor, f'{OUT}/{name}_nor.jpg', q[1])
    arm = arm.copy()
    arm[..., 2] = arm[..., 2] * metal          # 0: paint, concrete and rock are not metal
    if rough is not None:                       # (lo, hi): the roughness channel remapped into this range
        arm[..., 1] = remap(arm[..., 1], *rough)
    save(arm, f'{OUT}/{name}_arm.jpg', q[2])
    return lin(diff).mean(axis=(0, 1))


means = {}

# LAVA (rock_3, 1.5 m): rough, pitted rock face, read as the vesicular top of a basalt flow. Lifted to a mid grey and
# nearly neutral: the ground's vertex paint (black flow top, the front's banded section) sets the colour; the photo gives
# the relief and the pits.
d, n, a = ph('rock_3')
means['lava'] = pack('lava', grade(d, sat=0.15, mean=0.58, tint=(0.95, 1.0, 1.07), contrast=1.15, hi=0.92), n, a, rough=(0.7, 0.98))

# GRAVEL (gravel_stones, 2.0 m): crushed stone rolled flat: the plant's yard between the units and the flare yard.
d, n, a = ph('gravel_stones')
means['gravel'] = pack('gravel', grade(d, sat=0.2, mean=0.6, contrast=1.1, hi=0.92), n, a, rough=(0.75, 1.0))

# SLAB (brushed_concrete_2, 2.5 m): broom-finished hardstanding. Pale, neutral to a touch cool (the photo's brown cast
# taken out); the paving's vertex paint darkens it.
d, n, a = ph('brushed_concrete_2')
means['slab'] = pack('slab', grade(d, sat=0.12, mean=0.66, tint=(0.98, 1.0, 1.02), contrast=1.15), n, a, rough=(0.72, 0.97))

# WALL (concrete_wall_006, 2.0 m): cast concrete with panel joints and tie holes. Cool grey (the photo's brown cast
# taken out), the stains kept as value only.
d, n, a = ph('concrete_wall_006')
means['wall'] = pack('wall', grade(d, sat=0.12, mean=0.6, tint=(0.98, 1.0, 1.03), contrast=1.1), n, a, rough=(0.7, 0.97))

# STEEL (metal_plate_02, 2.0 m): weathered plate with welds and rust. Its own metalness halved: it is painted steel
# gone to bare in places. Tinted per material (steel, dark steel, rusted, rail).
d, n, a = ph('metal_plate_02')
means['steel'] = pack('steel', grade(d, sat=0.5, mean=0.5, contrast=1.05), n, a, rough=(0.4, 0.9), metal=0.5)

# PAINT (green_metal_rust, 1.0 m): painted plate, scratched, rust at the scratches. The green taken out (graded to
# neutral) so one map serves the red pumps and the pale aluminium jacketing; their colour is the material's.
d, n, a = ph('green_metal_rust')
lum = d @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
rust = np.clip((d[..., 0] - d[..., 1]) * 4.0, 0, 1)[..., None]      # where the rust shows through, keep it warm
grey = np.repeat(lum[..., None], 3, -1)
mixd = grey * (1 - rust) + d * rust
means['paint'] = pack('paint', grade(mixd, sat=0.6, mean=0.62, contrast=1.2, hi=0.93), n, a, rough=(0.38, 0.85))

# SHEET (corrugated_iron_02, 2.7 m): galvanised corrugated sheet for the analyser bunker's arch and the roofs.
d, n, a = ph('corrugated_iron_02')
means['sheet'] = pack('sheet', grade(d, sat=0.4, mean=0.5, contrast=1.05), n, a, rough=(0.45, 0.92), metal=0.6)

for k, v in means.items():
    print(f'{k}: linear mean {v.round(4).tolist()}')
