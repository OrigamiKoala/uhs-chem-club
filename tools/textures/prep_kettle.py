"""Grade and pack Kettle's CC0 texture sets into public/textures/kettle/.

Every pack: <name>_diff.jpg (sRGB albedo), <name>_nor.jpg (OpenGL normal), <name>_arm.jpg (R AO, G rough, B metal).
No albedo value reaches pure black or white. The ground's packs (crust, slag) are multiplied by the terrain's vertex
paint, so they are graded near neutral. The building's packs are tinted per material in `src/three/kettle.js`
(`initPacks`), which divides each material's old paint by the pack's LINEAR mean printed here.
Run: python3 -I prep_kettle.py <download dir> <out dir>
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


def pack(name, diff, nor, arm, metal=False, q=(80, 76, 70)):
    save(diff, f'{OUT}/{name}_diff.jpg', q[0])
    save(nor, f'{OUT}/{name}_nor.jpg', q[1])
    arm = arm.copy()
    if not metal:
        arm[..., 2] = 0
    save(arm, f'{OUT}/{name}_arm.jpg', q[2])
    return lin(diff).mean(axis=(0, 1))


means = {}

# CRUST (dry_ground_01): baked desert crust in small plates. Nearly neutral and pale: the vertex paint sets its colour.
d, n, a = ph('dry_ground_01')
means['crust'] = pack('crust', grade(d, sat=0.2, mean=0.8, contrast=1.3, hi=0.93), n, a)

# SLAG (gravel_stones): dark angular stone. Graded to a mean of 0.5 so the ground shader (x 1.9) and the road's
# material colour set the tone.
d, n, a = ph('gravel_stones')
means['slag'] = pack('slag', grade(d, sat=0.25, mean=0.5, contrast=1.2), n, a)

# CONCRETE (concrete_floor_worn_001): a trowelled floor worn smooth; warmed a little toward the works' dust.
d, n, a = ph('concrete_floor_worn_001')
means['concrete'] = pack('concrete', grade(d, sat=0.4, mean=0.45, tint=(1.03, 1.0, 0.95), contrast=1.35), n, a)

# BRICK (red_brick_03): industrial common brick. Saturation and value brought down: a century of soot.
d, n, a = ph('red_brick_03')
means['brick'] = pack('brick', grade(d, sat=0.72, mean=0.3, contrast=1.05), n, a)

# SHEET (corrugated_iron_02): profiled steel, near neutral so each material's paint tints it.
d, n, a = ph('corrugated_iron_02')
means['sheet'] = pack('sheet', grade(d, sat=0.35, mean=0.5, contrast=1.2), n, a, metal=True)

# METAL (metal_plate_02): worn, corroded plate; kept browner, as rust is.
d, n, a = ph('metal_plate_02')
means['metal'] = pack('metal', grade(d, sat=0.5, mean=0.42, contrast=1.1), n, a, metal=True)

for k, v in means.items():
    print(k, 'linear mean rgb', np.round(v, 4).tolist())
total = 0
for f in sorted(os.listdir(OUT)):
    if f.endswith('.jpg'):
        total += os.path.getsize(f'{OUT}/{f}')
        print(f, os.path.getsize(f'{OUT}/{f}'))
print('total', total)
