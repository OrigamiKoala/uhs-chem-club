#!/usr/bin/env python3
"""Rewrites play-text words inside JS string literals (never code, never comments). Usage: rewrite-play-text.py file..."""
import re, sys, json

RULES = [
  (r'\bratio rig\b', 'expression board'), (r'\bRatio rig\b', 'Expression board'),
  (r'\brigs\b', 'boards'), (r'\brig\b', 'board'), (r'\bRig\b', 'Board'),
  (r'\btiles\b', 'cards'), (r'\btile\b', 'card'), (r'\bTiles\b', 'Cards'), (r'\bTile\b', 'Card'),
  (r'\bchips\b', 'formula cards'), (r'\bchip\b', 'formula card'), (r'\bChips\b', 'Formula cards'), (r'\bChip\b', 'Formula card'),
  (r'\bpour window\b', 'particle window'), (r'\bPour window\b', 'Particle window'),
  (r'\bcounting lens\b', 'particle counter'), (r'\blens\b', 'counter'),
  (r'\bstrengths\b', 'concentrations'), (r'\bstrength\b', 'concentration'), (r'\bStrength\b', 'Concentration'),
]
SKIP_LINE = re.compile(r'What Sets Strength|acid whose strength|acid strength|strength of an acid')
IDLIKE = re.compile(r'^[a-z0-9_.:#\-/]+$')

def fix(text):
    if IDLIKE.match(text) or not re.search(r'[A-Za-z]', text): return text
    for a, b in RULES: text = re.sub(a, b, text)
    return text

def transform(src):
    out = []; i = 0; n = len(src)
    def string(q, i):
        j = i + 1; buf = []
        while j < n:
            c = src[j]
            if c == '\\': buf.append(src[j:j+2]); j += 2; continue
            if q == '`' and c == '$' and j + 1 < n and src[j+1] == '{':
                out.append(q if not buf and False else '')  # placeholder
                break
            if c == q: break
            buf.append(c); j += 1
        return j, ''.join(buf)
    while i < n:
        c = src[i]
        if c == '/' and src[i:i+2] == '//':
            j = src.find('\n', i); j = n if j < 0 else j; out.append(src[i:j]); i = j; continue
        if c == '/' and src[i:i+2] == '/*':
            j = src.find('*/', i) + 2; out.append(src[i:j]); i = j; continue
        if c in '\'"':
            j = i + 1; buf = []
            while j < n and src[j] != c:
                if src[j] == '\\': buf.append(src[j:j+2]); j += 2; continue
                if src[j] == '\n': break
                buf.append(src[j]); j += 1
            lit = ''.join(buf)
            # a regex-ish or code string with a quote char in prose is fine; keep line guard
            ls = src.rfind('\n', 0, i) + 1; le = src.find('\n', i); le = n if le < 0 else le
            out.append(c + (lit if SKIP_LINE.search(src[ls:le]) else fix(lit)) + (src[j] if j < n else '')); i = j + 1; continue
        if c == '`':
            out.append('`'); i += 1; buf = []
            while i < n and src[i] != '`':
                if src[i] == '\\': buf.append(src[i:i+2]); i += 2; continue
                if src[i] == '$' and src[i+1:i+2] == '{':
                    out.append(fix(''.join(buf))); buf = []
                    depth = 0; j = i + 1
                    while j < n:
                        if src[j] == '{': depth += 1
                        elif src[j] == '}':
                            depth -= 1
                            if depth == 0: break
                        j += 1
                    inner = src[i+2:j]
                    out.append('${' + transform(inner) + '}'); i = j + 1; continue
                buf.append(src[i]); i += 1
            ls = src.rfind('\n', 0, i) + 1
            out.append(''.join(buf) if SKIP_LINE.search(src[ls:i]) else fix(''.join(buf))); out.append('`'); i += 1; continue
        out.append(c); i += 1
    return ''.join(out)

for path in sys.argv[1:]:
    s = open(path, encoding='utf8').read()
    if path.endswith('.json'):
        def walk(v):
            if isinstance(v, str): return fix(v)
            if isinstance(v, list): return [walk(x) for x in v]
            if isinstance(v, dict): return {k: walk(x) if k not in ('id', 'calc', 'quest', 'kind') else x for k, x in v.items()}
            return v
        t = json.dumps(walk(json.loads(s)), ensure_ascii=False, indent=2) + '\n'
    else:
        t = transform(s)
    if t != s:
        open(path, 'w', encoding='utf8').write(t); print('rewrote', path)
