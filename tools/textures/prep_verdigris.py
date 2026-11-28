"""Grade and pack Verdigris's CC0 texture sets into public/textures/verdigris/.

Every pack: <name>_diff.jpg (sRGB albedo), <name>_nor.jpg (OpenGL normal), <name>_arm.jpg (R AO, G rough, B metal).
No albedo value reaches pure black or white. Each pack is graded close to the colour the world wants, and the
materials in `src/three/verdigris.js` (`initPacks`) multiply it by a plain grey.
Run: python3 -I prep_verdigris.py <download dir> <out dir>
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
    arm[..., 2] = 0                      # nothing photographed here is bare metal
    if rough is not None:                # (lo, hi): the roughness channel remapped into this range
        g = arm[..., 1]
        arm[..., 1] = rough[0] + (g - g.min()) / max(1e-6, g.max() - g.min()) * (rough[1] - rough[0])
    save(arm, f'{OUT}/{name}_arm.jpg', q[2])
    return lin(diff).mean(axis=(0, 1))


means = {}

# WALL (stone_brick_wall_001): rock-faced sandstone ashlar in courses. Greyed hard toward a cool, slightly green grey:
# the fort's stone after two centuries of swamp air. The waterline band is drawn in the world, not here.
d, n, a = ph('stone_brick_wall_001')
means['wall'] = pack('wall', grade(d, sat=0.28, mean=0.5, tint=(0.97, 1.0, 0.97), contrast=1.15), n, a, rough=(0.74, 0.98))

# DRESSED (stone_block_wall): large smooth-faced blocks. The copings, merlons, string courses, plinths and floors.
d, n, a = ph('stone_block_wall')
means['dressed'] = pack('dressed', grade(d, sat=0.22, mean=0.48, tint=(0.98, 1.0, 0.98), contrast=1.2), n, a, rough=(0.66, 0.95))

# PLANKS (weathered_planks): grey, weathered boards. The photo's boards run along v; it is turned a quarter turn
# (counter-clockwise) so they run along u, as the procedural boards do: across a deck, along a rail or a fascia.
# A normal map turned with its image has its vectors turned too: (x, y) -> (-y, x).
def turn(img):
    return np.ascontiguousarray(np.rot90(img, k=1))


def turn_normal(img):
    t = turn(img).copy()
    r, g = t[..., 0].copy(), t[..., 1].copy()
    t[..., 0], t[..., 1] = 1.0 - g, r
    return t


d, n, a = ph('weathered_planks')
d, n, a = turn(d), turn_normal(n), turn(a)
means['planks'] = pack('planks', grade(d, sat=0.4, mean=0.42, tint=(1.0, 0.99, 0.95), contrast=1.05), n, a, rough=(0.68, 0.97))

# BRICK (castle_brick_02_red): the vaults. Saturation brought well down: damp, lime-bloomed, in lamp light.
d, n, a = ph('castle_brick_02_red')
means['brick'] = pack('brick', grade(d, sat=0.55, mean=0.36, contrast=1.05), n, a, rough=(0.75, 0.98))

for k, v in means.items():
    print(f'{k}: linear mean {v.round(4).tolist()}')
