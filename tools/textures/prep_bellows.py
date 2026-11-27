"""Grade and pack Bellows' CC0 texture sets into public/textures/bellows/.

Every pack: <name>_diff.jpg (sRGB albedo), <name>_nor.jpg (OpenGL normal), <name>_arm.jpg (R AO, G rough, B metal).
Each albedo is graded toward the paint its procedural map carried (the material colour stays white, so the photo
sets the tone); saturation is cut so a green or blue source reads as the works' grey-white paint, and no value
reaches pure black or white.
Run: python3 -I prep_bellows.py <dl dir> <out dir>
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


def hex_rgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)], dtype=np.float32)


def grade(rgb, sat, paint, contrast=1.0, lo=0.035, hi=0.9, keep_warm=0.0):
    """Desaturate, set contrast, then move the mean onto `paint` (hex, sRGB). `keep_warm` keeps that share of the
    source's own colour (rust) instead of tinting it toward the paint."""
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    out = lum[..., None] + (rgb - lum[..., None]) * sat
    m = out.mean()
    out = (out - m) * contrast + m
    target = hex_rgb(paint)
    tinted = out / out.mean(axis=(0, 1)) * target
    out = tinted * (1 - keep_warm) + out * (target.mean() / out.mean()) * keep_warm
    return np.clip(out, lo, hi)


def pack(name, diff, nor, ao, rough, metal, q=(80, 78, 74)):
    save(diff, f'{OUT}/{name}_diff.jpg', q[0])
    save(nor, f'{OUT}/{name}_nor.jpg', q[1])
    save(np.stack([ao, rough, metal], -1), f'{OUT}/{name}_arm.jpg', q[2])


def ph(asset):
    d = f'{DL}/{asset}'
    return load(f'{d}/{asset}_diff_1k.jpg'), load(f'{d}/{asset}_nor_gl_1k.jpg'), load(f'{d}/{asset}_arm_1k.jpg')


# TREAD (metal_plate, 0.5 m): the deck's diamond plate. Galvanised grey; most of the rust taken out.
diff, nor, arm = ph('metal_plate')
pack('tread', grade(diff, sat=0.1, paint='#8c9198', contrast=0.62, keep_warm=0.1), nor, arm[..., 0],
     np.clip(arm[..., 1] * 0.95, 0.25, 1), arm[..., 2])

# PLATE (blue_metal_plate, 2.5 m): welded painted plate for the sphere, its skirt and the gondola. Paint is not metal:
# metalness 0, and chalked matte (roughness 0.45-1) by sun and thin air. Low contrast: the source's large blotches
# repeat as a checker on the sphere otherwise.
diff, nor, arm = ph('blue_metal_plate')
pack('plate', grade(diff, sat=0.08, paint='#b9bfc7', contrast=0.38, hi=0.84), nor, arm[..., 0],
     np.clip(arm[..., 1] * 0.55 + 0.45, 0, 1), arm[..., 2] * 0)

# RIVET (metal_plate_02, 2.0 m): bolted steel plate for the holder's shell, the deck edges, the Compressor.
diff, nor, arm = ph('metal_plate_02')
pack('rivet', grade(diff, sat=0.3, paint='#a9b1bb', contrast=0.9, keep_warm=0.35), nor, arm[..., 0], arm[..., 1],
     arm[..., 2])

# RIBBED (factory_wall, 3.0 m): ribbed sheet for the cold box casing; the green paint taken to grey-white, metalness 0.
diff, nor, arm = ph('factory_wall')
pack('ribbed', grade(diff, sat=0.06, paint='#bac0c7', contrast=0.85, hi=0.86), nor, arm[..., 0],
     np.clip(arm[..., 1] * 0.6 + 0.35, 0, 1), arm[..., 2] * 0)

# CONCRETE (concrete_slab_wall, 2.3 m): board-formed lifts for the plinth. The material colour (0xb6b8bc)
# multiplies it, so it is graded light.
diff, nor, arm = ph('concrete_slab_wall')
pack('concrete', grade(diff, sat=0.25, paint='#e2e2e0', contrast=1.1, hi=0.95), nor, arm[..., 0], arm[..., 1],
     arm[..., 2] * 0)

# PAINT (green_metal_rust, 1.0 m): the dark painted steel of legs, rails and frames; chips and rust kept faint.
diff, nor, arm = ph('green_metal_rust')
pack('paint', grade(diff, sat=0.18, paint='#4a5462', contrast=1.1, keep_warm=0.3), nor, arm[..., 0], arm[..., 1],
     arm[..., 2])

for f in sorted(os.listdir(OUT)):
    print(f, os.path.getsize(f'{OUT}/{f}'))
