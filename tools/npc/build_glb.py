"""
build_glb.py - Blender side of the crew model build. Run by build-models.mjs, never by hand:

  Blender -b --factory-startup --python tools/npc/build_glb.py -- avatar <fbx> <prepdir> <prefix> <out.glb> <out.lite.glb>
  Blender -b --factory-startup --python tools/npc/build_glb.py -- clips <out.glb> <name>=<fbx> [<name>=<fbx> ...]

AVATAR: imports the Rocketbox FBX, drops the Biped footstep helper, rebuilds every material as a plain
glTF PBR material from the prepared textures (colour, normal, metal/rough; alpha where the colour has it)
and exports the mesh and its skeleton with no animation. The lite file is the same body with the mesh
decimated to half and the handset textures.

CLIPS: imports each clip's FBX, moves its action onto the first clip's skeleton as one NLA track named
for the clip, and exports the skeleton with one glTF animation per track. A clip captured moving
(`walk*`) has its travel taken off the root (the armature object's horizontal location) so it plays in
place; how far it travelled per second is printed as `SPEED <name> <m/s> <seconds>` for the manifest.
Every clip prints `CLIP <name> <seconds>`.
"""
import bpy
import os
import sys

argv = sys.argv[sys.argv.index('--') + 1:]
mode = argv[0]


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_fbx(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=path)
    return [o for o in bpy.data.objects if o not in before]


def drop_helpers(objs):
    for o in list(objs):
        if o.type == 'EMPTY':
            bpy.data.objects.remove(o, do_unlink=True)


def fcurves_of(action):
    """Every F-curve of an action, layered (Blender 4.4+) or flat."""
    out = []
    layers = getattr(action, 'layers', None)
    if layers:
        for layer in layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    out.extend(bag.fcurves)
    if not out and hasattr(action, 'fcurves'):
        out.extend(action.fcurves)
    return out


def remove_fcurve(action, fc):
    layers = getattr(action, 'layers', None)
    if layers:
        for layer in layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    if fc in list(bag.fcurves):
                        bag.fcurves.remove(fc)
                        return
    action.fcurves.remove(fc)


def image(path, non_color=False):
    img = bpy.data.images.load(path)
    if non_color:
        img.colorspace_settings.name = 'Non-Color'
    return img


def make_material(name, prep, part, lite):
    tag = '.lite' if lite else ''
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    outp = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], outp.inputs['Surface'])

    col = nt.nodes.new('ShaderNodeTexImage')
    col.image = image(os.path.join(prep, f'{part}_color{tag}.png'))
    nt.links.new(col.outputs['Color'], bsdf.inputs['Base Color'])
    if col.image.channels == 4 and col.image.depth >= 32:
        nt.links.new(col.outputs['Alpha'], bsdf.inputs['Alpha'])

    nrm = nt.nodes.new('ShaderNodeTexImage')
    nrm.image = image(os.path.join(prep, f'{part}_normal{tag}.png'), non_color=True)
    nmap = nt.nodes.new('ShaderNodeNormalMap')
    nt.links.new(nrm.outputs['Color'], nmap.inputs['Color'])
    nt.links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])

    orm = nt.nodes.new('ShaderNodeTexImage')
    orm.image = image(os.path.join(prep, f'{part}_orm{tag}.png'), non_color=True)
    sep = nt.nodes.new('ShaderNodeSeparateColor')
    nt.links.new(orm.outputs['Color'], sep.inputs['Color'])
    nt.links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
    nt.links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])
    return mat


def export(path, objs, animations):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    kw = dict(
        filepath=path, export_format='GLB', use_selection=True,
        export_yup=True, export_apply=False, export_skins=True,
        export_image_format='WEBP', export_image_quality=85,
        export_materials='EXPORT', export_extras=False,
        export_animations=animations,
    )
    if animations:
        kw.update(
            export_animation_mode='NLA_TRACKS', export_force_sampling=True,
            export_optimize_animation_size=False, export_reset_pose_bones=True,
            export_frame_step=1,
        )
    bpy.ops.export_scene.gltf(**kw)


if mode == 'avatar':
    fbx, prep, prefix, out_full, out_lite = argv[1:6]
    for lite, out in ((False, out_full), (True, out_lite)):
        reset()
        objs = import_fbx(fbx)
        drop_helpers(objs)
        arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
        meshes = [o for o in bpy.data.objects if o.type == 'MESH']
        if arm.animation_data:
            arm.animation_data_clear()
        for a in list(bpy.data.actions):
            bpy.data.actions.remove(a)
        for me_obj in meshes:
            if me_obj.animation_data:
                me_obj.animation_data_clear()
            for slot in me_obj.material_slots:
                old = slot.material
                part = old.name[len(prefix) + 1:] if old and old.name.startswith(prefix + '_') else None
                if part is None:
                    raise SystemExit(f'unexpected material {old.name if old else None}')
                slot.material = make_material(f'{prefix}_{part}', prep, part, lite)
            if lite:
                bpy.context.view_layer.objects.active = me_obj
                dec = me_obj.modifiers.new('decimate', 'DECIMATE')
                dec.ratio = 0.5
                dec.use_collapse_triangulate = True
                while me_obj.modifiers.find('decimate') > 0:
                    bpy.ops.object.modifier_move_up(modifier='decimate')
                bpy.ops.object.modifier_apply(modifier='decimate')
            tris = sum(len(p.vertices) - 2 for p in me_obj.data.polygons)
            print(f'MESH {me_obj.name} tris={tris} lite={lite}')
        export(out, [arm, *meshes], animations=False)
        print(f'WROTE {out} {os.path.getsize(out)}')

elif mode == 'clips':
    out = argv[1]
    pairs = [a.split('=', 1) for a in argv[2:]]
    reset()
    base = None
    for name, fbx in pairs:
        objs = import_fbx(fbx)
        # The importer sets the scene's rate from the file (Rocketbox: 30 fps); read it after.
        fps = bpy.context.scene.render.fps / bpy.context.scene.render.fps_base
        arm = next(o for o in objs if o.type == 'ARMATURE')
        act = arm.animation_data.action if arm.animation_data else None
        if act is None:
            raise SystemExit(f'{fbx}: no action on the armature')
        act.name = name
        act.use_fake_user = True
        f0, f1 = act.frame_range
        seconds = (f1 - f0) / fps
        # Take the travel off the root: the armature object's location in Blender's ground plane (x, y).
        for fc in list(fcurves_of(act)):
            if fc.data_path == 'location' and fc.array_index in (0, 1):
                ks = [k.co[1] for k in fc.keyframe_points]
                travel = ks[-1] - ks[0]
                if name.startswith('walk') and fc.array_index == 1:
                    print(f'SPEED {name} {abs(travel) / seconds:.4f} {seconds:.4f}')
                remove_fcurve(act, fc)
        print(f'CLIP {name} {seconds:.4f}')
        if base is None:
            base = arm
            others = [o for o in objs if o is not arm]
        else:
            others = objs
        for o in others:
            if o.animation_data:
                o.animation_data_clear()
            bpy.data.objects.remove(o, do_unlink=True)
    # Footstep and helper actions are not the body's.
    for a in list(bpy.data.actions):
        if a.name not in {n for n, _ in pairs}:
            bpy.data.actions.remove(a)
    base.animation_data_create()
    base.animation_data.action = None
    for name, _ in pairs:
        act = bpy.data.actions[name]
        track = base.animation_data.nla_tracks.new()
        track.name = name
        strip = track.strips.new(name, int(act.frame_range[0]), act)
        if hasattr(strip, 'action_slot') and getattr(act, 'slots', None):
            strip.action_slot = act.slots[0]
        track.mute = False
    export(out, [base], animations=True)
    print(f'WROTE {out} {os.path.getsize(out)}')
