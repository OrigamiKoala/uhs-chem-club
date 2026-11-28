"""Grade and pack Teeter's CC0 texture sets into public/textures/teeter/.

Every pack: <name>_diff.jpg (sRGB albedo), <name>_nor.jpg (OpenGL normal), <name>_arm.jpg (R AO, G rough, B metal).
No albedo value reaches pure black or white. Each pack is graded close to the colour the world wants, and the
materials in `src/three/teeter.js` (`initPacks`) multiply it by a plain grey (or the ground's vertex paint).
Run: python3 -I prep_teeter.py <download dir> <out dir>
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


def grade(rgb, sat, mean, tint=(1, 1, 1), contrast=1.0, lo=0.04, hi=0.9):
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


def pack(name, diff, nor, arm, q=(80, 74, 70), rough=None):
    save(diff, f'{OUT}/{name}_diff.jpg', q[0])
    save(nor, f'{OUT}/{name}_nor.jpg', q[1])
    arm = arm.copy()
    arm[..., 2] = 0                      # nothing on the terraces is bare metal
    if rough is not None:                # (lo, hi): the roughness channel remapped into this range
        g = arm[..., 1]
        arm[..., 1] = rough[0] + (g - g.min()) / max(1e-6, g.max() - g.min()) * (rough[1] - rough[0])
    save(arm, f'{OUT}/{name}_arm.jpg', q[2])
    return lin(diff).mean(axis=(0, 1))


means = {}

# GROUND (dry_mud_field_001): packed, trodden clay with grit. Pale and nearly neutral: the vertex paint sets its colour.
d, n, a = ph('dry_mud_field_001')
means['ground'] = pack('ground', grade(d, sat=0.22, mean=0.74, contrast=1.25, hi=0.93), n, a, rough=(0.78, 1.0))

# WALL (sandstone_blocks_05): coursed, rock-faced limestone blocks. Cream-grey, a little cooler than the sandstone.
d, n, a = ph('sandstone_blocks_05')
means['wall'] = pack('wall', grade(d, sat=0.42, mean=0.66, tint=(0.99, 0.99, 0.97), contrast=1.1), n, a, rough=(0.72, 0.98))

# FLAGS (sandstone_blocks_08): large dressed slabs, laid as the rooms' floors.
d, n, a = ph('sandstone_blocks_08')
means['flags'] = pack('flags', grade(d, sat=0.35, mean=0.55, contrast=1.15), n, a, rough=(0.6, 0.92))

# SETTS (square_cobblestone): the stair's worn stone setts. Greyed and lifted toward the terraces' limestone.
d, n, a = ph('square_cobblestone')
means['setts'] = pack('setts', grade(d, sat=0.3, mean=0.62, tint=(1.02, 1.0, 0.96), contrast=1.15), n, a, rough=(0.6, 0.95))

# TIMBER (weathered_planks): grey, weathered boards for fences, joists, ties and the barrow.
d, n, a = ph('weathered_planks')
means['timber'] = pack('timber', grade(d, sat=0.45, mean=0.52, tint=(1.0, 0.98, 0.94), contrast=1.0), n, a, rough=(0.7, 0.98))

# BRICK (medieval_red_brick): the rooms' vaults and jack arches. Saturation brought down: salt and damp.
d, n, a = ph('medieval_red_brick')
means['brick'] = pack('brick', grade(d, sat=0.65, mean=0.36, contrast=1.05), n, a, rough=(0.75, 0.98))

for k, v in means.items():
    print(f'{k}: linear mean {v.round(4).tolist()}')
