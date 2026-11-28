"""Grade and pack Brinewire's CC0 texture sets into public/textures/brinewire/.

Every pack: <name>_diff.jpg (sRGB albedo), <name>_nor.jpg (OpenGL normal), <name>_arm.jpg (R AO, G rough, B metal).
No albedo value reaches pure black or white. Each pack is graded to a near-neutral tone; the materials in
`src/three/brinewire.js` (`initPacks`) tint it to their own paint (old colour over the pack's linear mean, printed here).
Download the Poly Haven 1K JPGs (`<asset>/<asset>_{diff,nor_gl,arm}_1k.jpg`) into one folder, then run:
    python3 -I prep_brinewire.py <download dir> <out dir>
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


def lum(rgb):
    return rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


def grade(rgb, sat, mean, tint=(1, 1, 1), contrast=1.0, lo=0.04, hi=0.9):
    l = lum(rgb)
    out = l[..., None] + (rgb - l[..., None]) * sat
    m = out.mean()
    out = (out - m) * contrast + m
    out = out * (mean / out.mean())
    out = out * np.array(tint, dtype=np.float32)
    return np.clip(out, lo, hi)


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def ph(asset):
    d = f'{DL}/{asset}'
    return load(f'{d}/{asset}_diff_1k.jpg'), load(f'{d}/{asset}_nor_gl_1k.jpg'), load(f'{d}/{asset}_arm_1k.jpg')


def pack(name, diff, nor, arm, q=(80, 74, 70), rough=None, metal=0.0):
    save(diff, f'{OUT}/{name}_diff.jpg', q[0])
    save(nor, f'{OUT}/{name}_nor.jpg', q[1])
    arm = arm.copy()
    arm[..., 2] = metal                  # painted steel and concrete are not bare metal
    if rough is not None:                # (lo, hi): the roughness channel remapped into this range
        g = arm[..., 1]
        arm[..., 1] = rough[0] + (g - g.min()) / max(1e-6, g.max() - g.min()) * (rough[1] - rough[0])
    save(arm, f'{OUT}/{name}_arm.jpg', q[2])
    return lin(diff).mean(axis=(0, 1))


means = {}

# BOARD (wood_textured_concrete): board-marked cast concrete, the barrage's two great faces and the walls over a drop.
d, n, a = ph('wood_textured_concrete')
means['board'] = pack('board', grade(d, sat=0.35, mean=0.56, contrast=1.15), n, a, rough=(0.78, 0.98))

# WALL (concrete_wall_006): stained cast concrete with tie holes, the parapets, piers, copings, vaults and rooms.
d, n, a = ph('concrete_wall_006')
means['wall'] = pack('wall', grade(d, sat=0.4, mean=0.54, contrast=1.2), n, a, rough=(0.74, 0.98))

# PAVE (concrete_floor_worn_001): a trodden slab, the walks' paving, the deck and the rooms' floors.
d, n, a = ph('concrete_floor_worn_001')
means['pave'] = pack('pave', grade(d, sat=0.3, mean=0.56, contrast=1.3), n, a, rough=(0.62, 0.95))

# BLOCK (concrete_block_wall): the gate houses' blockwork. Lifted from its dark wet look.
d, n, a = ph('concrete_block_wall')
means['block'] = pack('block', grade(d, sat=0.35, mean=0.54, contrast=0.85), n, a, rough=(0.8, 1.0))

# ROCK (rock_face): bedded sandstone on the headlands and the beds. Nearly neutral: the ground's vertex paint colours it.
d, n, a = ph('rock_face')
means['rock'] = pack('rock', grade(d, sat=0.22, mean=0.6, contrast=1.25, hi=0.93), n, a, rough=(0.82, 1.0))

# STEEL (rusty_painted_metal): painted steel with rust run down from the laps. The red paint is taken to a neutral grey
# the material tints to its own paint; the rust (dark, where the paint has gone) keeps a little of its brown.
d, n, a = ph('rusty_painted_metal')
l = lum(d)
paint = (0.55 + (l - l.mean()) * 0.45)[..., None] * np.ones(3, dtype=np.float32)
rust = grade(d, sat=0.5, mean=0.36)
mask = (1 - smooth(0.1, 0.3, l))[..., None] * 0.45
steel = np.clip(paint * (1 - mask) + rust * mask, 0.04, 0.9)
means['steel'] = pack('steel', grade(steel, sat=1.0, mean=0.5, contrast=1.0), n, a, rough=(0.55, 0.95))

# PATINA (green_metal_rust): green-painted sheet with rust spots, the copper gone green. Saturation halved: the
# material tints it to its own green.
d, n, a = ph('green_metal_rust')
means['patina'] = pack('patina', grade(d, sat=0.45, mean=0.42, contrast=1.1), n, a, rough=(0.5, 0.9))

# ROOF (worn_corrugated_iron): the gate houses' and the cage's roof sheet. Greyed; the profile is in its normal map.
d, n, a = ph('worn_corrugated_iron')
means['roof'] = pack('roof', grade(d, sat=0.3, mean=0.48, contrast=1.1), n, a, rough=(0.5, 0.9))

for k, v in means.items():
    print(f'{k}: linear mean {v.round(4).tolist()}')
