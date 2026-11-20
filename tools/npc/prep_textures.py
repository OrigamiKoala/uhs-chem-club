"""
prep_textures.py - Rocketbox textures, made ready for glTF. Run by build-models.mjs (needs Pillow).

  python3 tools/npc/prep_textures.py <rocketbox Assets/Avatars/Professions/<Source>/Textures> <out dir> <prefix>

Rocketbox ships each material as three 2048 (or smaller) TGAs: colour, normal and specular. glTF wants
colour, normal and a metal/rough map, so for every material part this writes:

  <part>_color.png / .lite.png    colour (RGBA when the source has alpha: hair, lashes, visor mesh)
  <part>_normal.png / .lite.png   tangent-space normal, unchanged in sense
  <part>_orm.png / .lite.png      R = 1 (no occlusion), G = roughness, B = 0 (no metal)

Roughness comes from the specular map: a brighter specular is a shinier surface. Rocketbox's specular
runs 0..200; it is mapped to roughness 0.95 (matt cloth, skin pores) .. 0.35 (helmet shell, visor).

Sizes: the desktop body and head keep 2048 colour (the face and the coat are what a player looks at);
everything else is smaller. The handset set is 512 colour, 256 normal, 128 roughness.
"""
import os
import sys
from PIL import Image

src, out, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)

BIG = {'body', 'head'}


def size_for(part, kind, lite):
    if lite:
        return {'color': 512, 'normal': 256, 'orm': 128}[kind]
    if kind == 'color':
        return 2048 if part in BIG else 1024
    if kind == 'normal':
        return 1024 if part in BIG else 512
    return 512


def fit(im, edge):
    w, h = im.size
    s = min(1.0, edge / max(w, h))
    if s >= 1.0:
        return im
    return im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)


import re
# <prefix>_<part>_<color|normal|specular>[_<variant>].tga; a part may ship only colour variants (Medical_Female_03's
# body comes as _color_blue), in which case the first variant is the colour.
MAP = re.compile(re.escape(prefix) + r'_(.+?)_(color|normal|specular)(?:_[A-Za-z0-9]+)?\.tga$')
files = sorted(os.listdir(src))
parts = sorted({m.group(1) for f in files for m in [MAP.match(f)] if m})
for part in parts:
    base = os.path.join(src, f'{prefix}_{part}')
    color_file = base + '_color.tga'
    if not os.path.exists(color_file):
        variants = [f for f in files if f.startswith(f'{prefix}_{part}_color_') and f.endswith('.tga')]
        color_file = os.path.join(src, variants[0])
    color = Image.open(color_file)
    has_alpha = color.mode == 'RGBA' and color.getextrema()[3][0] < 250
    color = color.convert('RGBA' if has_alpha else 'RGB')
    # A few parts ship colour only (an alpha card, say): a flat normal and no specular (matt) stand in.
    normal = Image.open(base + '_normal.tga').convert('RGB') if os.path.exists(base + '_normal.tga') else Image.new('RGB', color.size, (128, 128, 255))
    spec = Image.open(base + '_specular.tga').convert('L') if os.path.exists(base + '_specular.tga') else Image.new('L', color.size, 0)
    rough = spec.point(lambda v: int(round(255 * max(0.35, min(0.95, 0.95 - 0.6 * (v / 200.0))))))
    orm = Image.merge('RGB', (Image.new('L', spec.size, 255), rough, Image.new('L', spec.size, 0)))
    for lite in (False, True):
        tag = '.lite' if lite else ''
        fit(color, size_for(part, 'color', lite)).save(os.path.join(out, f'{part}_color{tag}.png'))
        fit(normal, size_for(part, 'normal', lite)).save(os.path.join(out, f'{part}_normal{tag}.png'))
        fit(orm, size_for(part, 'orm', lite)).save(os.path.join(out, f'{part}_orm{tag}.png'))
    print(f'{prefix}_{part}: {color.size[0]}x{color.size[1]}{" alpha" if has_alpha else ""}')
