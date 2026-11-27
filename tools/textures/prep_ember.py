"""Grade and pack Ember Reach's CC0 texture sets into public/textures/ember/.

Every pack: <name>_diff.jpg (sRGB albedo), <name>_nor.jpg (OpenGL normal), <name>_arm.jpg (R AO, G rough, B metal).
No albedo value reaches pure black or white. The ground packs (cinder, basalt) are multiplied by the terrain's vertex
paint in the ground shader, which divides by the mean given here (MEANS, mirrored in `src/three/ember/terrain.js`), so
their mean only sets contrast, not tone. The shell packs (concrete, brick, sheet) set the tone themselves.
Run: python3 -I prep_ember.py <download dir> <out dir>
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


def grade(rgb, sat, mean, tint=(1, 1, 1), contrast=1.0, lo=0.03, hi=0.88):
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    out = lum[..., None] + (rgb - lum[..., None]) * sat
    m = out.mean()
    out = (out - m) * contrast + m
    out = out * (mean / out.mean())
    out = out * np.array(tint, dtype=np.float32)
    return np.clip(out, lo, hi)


def ph(asset):
    d = f'{DL}/{asset}'
    return load(f'{d}/{asset}_diff_1k.jpg'), load(f'{d}/{asset}_nor_gl_1k.jpg'), load(f'{d}/{asset}_arm_1k.jpg')


def pack(name, diff, nor, arm, metal=True, q=(80, 78, 72)):
    save(diff, f'{OUT}/{name}_diff.jpg', q[0])
    save(nor, f'{OUT}/{name}_nor.jpg', q[1])
    if not metal:
        arm = arm.copy()
        arm[..., 2] = 0
    save(arm, f'{OUT}/{name}_arm.jpg', q[2])
    return diff.mean(axis=(0, 1))


means = {}

# CINDER (rocky_gravel): crushed red and black scoria. Half the saturation kept so the red grains survive the paint.
d, n, a = ph('rocky_gravel')
means['cinder'] = pack('cinder', grade(d, sat=0.55, mean=0.5, contrast=1.15), n, a, metal=False)

# BASALT (rock_face_04): broken dark rock with grit in the joints; nearly grey so the strata paint sets the colour.
# (dark_rock was tried first: its pale joint dust reads as marble veins at any distance.)
d, n, a = ph('rock_face_04')
means['basalt'] = pack('basalt', grade(d, sat=0.3, mean=0.3, contrast=1.1, hi=0.62), n, a, metal=False)

# CONCRETE (concrete_layers_02): board-formed lifts; warmed a little toward the cinder dust that coats it.
d, n, a = ph('concrete_layers_02')
means['concrete'] = pack('concrete', grade(d, sat=0.5, mean=0.5, tint=(1.04, 1.0, 0.94), contrast=1.1), n, a, metal=False)

# BRICK (factory_brick): fired refractory brick; saturation brought down, soot and heat have dulled it.
d, n, a = ph('factory_brick')
means['brick'] = pack('brick', grade(d, sat=0.7, mean=0.36, contrast=1.05), n, a, metal=False)

# SHEET (corrugated_iron_02): painted profiled steel; neutral so the material colour (the paint) tints it.
d, n, a = ph('corrugated_iron_02')
means['sheet'] = pack('sheet', grade(d, sat=0.3, mean=0.62, contrast=1.2), n, a)

for k, v in means.items():
    print(k, 'mean rgb', np.round(v, 3).tolist())
for f in sorted(os.listdir(OUT)):
    print(f, os.path.getsize(f'{OUT}/{f}'))
