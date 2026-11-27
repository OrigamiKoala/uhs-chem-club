"""Grade and pack Lanternfall's CC0 texture sets into public/textures/lanternfall/.

Every pack: <name>_diff.jpg (sRGB albedo), <name>_nor.jpg (OpenGL normal), <name>_arm.jpg (R AO, G rough, B metal).
Albedos are graded toward a neutral, mid-light grey so the material's own colour (or the vertex paint) sets the tone,
exactly as the procedural maps they replace did; no value reaches pure black or white.
Run: python3 -I prep_lanternfall.py <dl dir> <out dir>
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


def pack(name, diff, nor, ao, rough, metal, q=(80, 78, 74)):
    save(diff, f'{OUT}/{name}_diff.jpg', q[0])
    save(nor, f'{OUT}/{name}_nor.jpg', q[1])
    arm = np.stack([ao, rough, metal], -1)
    save(arm, f'{OUT}/{name}_arm.jpg', q[2])


def ph(asset):
    d = f'{DL}/{asset}'
    diff = load(f'{d}/{asset}_diff_1k.jpg')
    nor = load(f'{d}/{asset}_nor_gl_1k.jpg')
    arm = load(f'{d}/{asset}_arm_1k.jpg')
    return diff, nor, arm


# SNOW (ambientCG Snow010A): wind-packed snow. Near white, a trace of cold blue, never pure white.
d = f'{DL}/Snow010A/Snow010A_1K-JPG'
diff = load(f'{d}_Color.jpg')
diff = grade(diff, sat=0.12, mean=0.86, tint=(0.985, 1.0, 1.01), contrast=1.6, hi=0.94)
pack('snow', diff, load(f'{d}_NormalGL.jpg'), load(f'{d}_AmbientOcclusion.jpg', 'L'),
     load(f'{d}_Roughness.jpg', 'L'), np.zeros((SIZE, SIZE), np.float32))

# ROCK (Poly Haven rock_face_03): grey, so the gneiss bands painted per vertex and the stones' colours stay the tone.
diff, nor, arm = ph('rock_face_03')
pack('rock', grade(diff, sat=0.12, mean=0.62, contrast=1.15), nor, arm[..., 0], arm[..., 1], arm[..., 2] * 0)

# TILL (Poly Haven gray_rocks): moraine cobbles; red-brown fines and the odd green leaf taken out.
diff, nor, arm = ph('gray_rocks')
pack('till', grade(diff, sat=0.18, mean=0.6, contrast=1.1), nor, arm[..., 0], arm[..., 1], arm[..., 2] * 0)

# TIMBER (Poly Haven wood_planks_grey): weathered boards; graded toward a pale warm grey (the material colour browns it).
diff, nor, arm = ph('wood_planks_grey')
pack('timber', grade(diff, sat=0.4, mean=0.62, tint=(1.04, 1.0, 0.95), contrast=1.2), nor, arm[..., 0], arm[..., 1], arm[..., 2] * 0)

# SHEET (Poly Haven corrugated_iron_03): painted profiled sheet with its fixing rows; neutral so the paint colour tints it.
diff, nor, arm = ph('corrugated_iron_03')
pack('sheet', grade(diff, sat=0.25, mean=0.72, contrast=1.3), nor, arm[..., 0], arm[..., 1], arm[..., 2])

# PLATE (Poly Haven rusty_metal_02): worn steel plate; rust kept but brought down (cold, dry air rusts slowly).
diff, nor, arm = ph('rusty_metal_02')
pack('plate', grade(diff, sat=0.28, mean=0.66, contrast=0.9), nor, arm[..., 0], arm[..., 1], arm[..., 2])

for f in sorted(os.listdir(OUT)):
    print(f, os.path.getsize(f'{OUT}/{f}'))
