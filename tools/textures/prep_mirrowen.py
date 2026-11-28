"""Grade and pack Mirrowen's CC0 texture sets (Poly Haven) into public/textures/mirrowen/.

Every pack: <name>_diff.jpg (sRGB albedo), <name>_nor.jpg (OpenGL normal), <name>_arm.jpg (R AO, G rough, B metal).
Painted steel and sheet are graded to a neutral light grey so the material's paint colour sets the tone; stone, board
and brick keep a little of their own colour. No albedo value reaches pure black or white.
Run: python3 -I prep_mirrowen.py <dl dir> <out dir>
Prints each albedo's mean in linear light, which `mirrowen.js` divides the paint colours by.
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


def grade(rgb, sat, mean, tint=(1, 1, 1), contrast=1.0, lo=0.04, hi=0.92):
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    out = lum[..., None] + (rgb - lum[..., None]) * sat
    m = out.mean()
    out = (out - m) * contrast + m
    out = out * (mean / out.mean())
    out = out * np.array(tint, dtype=np.float32)
    return np.clip(out, lo, hi)


def lin_mean(rgb):
    l = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    return l.reshape(-1, 3).mean(0)


def pack(name, diff, nor, arm, metal=1.0, q=(74, 70, 66)):
    save(diff, f'{OUT}/{name}_diff.jpg', q[0])
    save(nor, f'{OUT}/{name}_nor.jpg', q[1])
    a = arm.copy()
    a[..., 2] = a[..., 2] * metal
    save(a, f'{OUT}/{name}_arm.jpg', q[2])
    print(f'{name}: linear mean', np.round(lin_mean(diff), 3))


def ph(asset):
    d = f'{DL}/{asset}'
    return load(f'{d}/{asset}_diff_1k.jpg'), load(f'{d}/{asset}_nor_gl_1k.jpg'), load(f'{d}/{asset}_arm_1k.jpg')


# SETTS (square_cobblestone): dressed granite setts; the brown of the photo taken down to a cool grey.
d, n, a = ph('square_cobblestone')
pack('setts', grade(d, sat=0.18, mean=0.52, tint=(0.98, 1.0, 1.02), contrast=1.15), n, a, metal=0)

# SNOW (snow_01): wind-packed snow, a trace of cold blue, never pure white.
d, n, a = ph('snow_01')
pack('snow', grade(d, sat=0.1, mean=0.84, tint=(0.985, 1.0, 1.015), contrast=1.3, hi=0.94), n, a, metal=0)

# GRANITE (granite_wall): rough-faced coursed blocks; grey with a trace of the stone's warmth.
d, n, a = ph('granite_wall')
pack('granite', grade(d, sat=0.22, mean=0.56, contrast=1.1), n, a, metal=0)

# CONCRETE (concrete_wall_004): shuttered concrete with its lift joints; neutral grey.
d, n, a = ph('concrete_wall_004')
pack('concrete', grade(d, sat=0.12, mean=0.6, contrast=1.25), n, a, metal=0)

# PLATE (blue_metal_plate): welded painted plate; neutral so the ship's paint is the material colour.
d, n, a = ph('blue_metal_plate')
pack('plate', grade(d, sat=0.0, mean=0.74, contrast=0.8), n, a)

# DECK (metal_plate_02): worn deck plate with its weld lines; a dark neutral.
d, n, a = ph('metal_plate_02')
pack('deck', grade(d, sat=0.2, mean=0.55, contrast=1.0), n, a)

# RUST (rusty_metal_04): paint flaking off rusted steel; rust kept, cold air dulls it a little.
d, n, a = ph('rusty_metal_04')
pack('rust', grade(d, sat=0.7, mean=0.5, contrast=1.0), n, a)

# BOARDS (weathered_brown_planks): weathered board, silvered brown.
d, n, a = ph('weathered_brown_planks')
pack('boards', grade(d, sat=0.55, mean=0.55, contrast=1.1), n, a, metal=0)

# ROOF (corrugated_iron_02): dark profiled sheet; neutral so the paint colour tints it.
d, n, a = ph('corrugated_iron_02')
pack('roof', grade(d, sat=0.0, mean=0.66, contrast=1.3), n, a)

# BRICK (red_brick_03): red brick in lime mortar; saturation brought down a little for the cold light.
d, n, a = ph('red_brick_03')
pack('brick', grade(d, sat=0.8, mean=0.42, contrast=1.05), n, a, metal=0)

total = 0
for f in sorted(os.listdir(OUT)):
    if f.endswith('.jpg'):
        s = os.path.getsize(f'{OUT}/{f}')
        total += s
        print(f, s)
print('total', total)
