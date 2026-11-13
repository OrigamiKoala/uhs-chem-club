/**
 * quicklight-textures.js — Procedural PBR surfaces for Quicklight, the storm-belt refinery.
 */

import * as THREE from 'three';

function makeCanvas(size = 128) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

function texFrom(canvas, repeat = [1, 1], srgb = true) {
  if (!canvas) return null;
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return t;
}

export function stormBasalt(size = 128, repeat = [18, 18]) {
  const c = makeCanvas(size);
  if (c) {
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#333942';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 650; i++) {
      const x = (i * 53) % size;
      const y = (i * 97) % size;
      const v = 44 + (i % 24);
      ctx.fillStyle = `rgb(${v},${v + 5},${v + 12})`;
      ctx.fillRect(x, y, 3, 3);
    }
  }
  return {
    map: texFrom(c, repeat, true),
    roughness: 0.9,
    metalness: 0.08
  };
}

export function catwalkPlate(size = 128, repeat = [2, 16]) {
  const c = makeCanvas(size);
  if (c) {
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#474f5c';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#2d323b';
    ctx.lineWidth = 2;
    for (let y = 0; y < size; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#d99423';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);
  }
  return {
    map: texFrom(c, repeat, true),
    roughness: 0.58,
    metalness: 0.55
  };
}

export function pourConcrete(size = 128, repeat = [3, 3]) {
  const c = makeCanvas(size);
  if (c) {
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#5b6069';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 400; i++) {
      const x = (i * 41) % size;
      const y = (i * 79) % size;
      ctx.fillStyle = i % 2 ? '#50555e' : '#656b75';
      ctx.fillRect(x, y, 2, 2);
    }
  }
  return {
    map: texFrom(c, repeat, true),
    roughness: 0.85,
    metalness: 0.05
  };
}
