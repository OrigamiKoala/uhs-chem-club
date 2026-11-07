#!/usr/bin/env python3
"""Rewrites play-text words inside JS string literals (never code, never comments). Usage: rewrite-play-text.py file..."""
import re, sys, json

RULES = [
  (r'\bSqueeze\b', 'Piston'), (r'\bsqueezing\b', 'compressing'), (r'\bsqueezed\b', 'compressed'), (r'\bsqueezes\b', 'compresses'), (r'\bsqueeze\b', 'compress'),
  (r'\bPress and tank\b', 'Piston and tank'), (r'\bpress and the tank\b', 'piston and the tank'), (r'\bpress and tank\b', 'piston and tank'),
  (r'\bthe room each\b', 'the space each'), (r'\bMost room\b', 'Most space'), (r'\bLeast room\b', 'Least space'), (r'\bmore room between\b', 'more space between'),
  (r'(?<!into the )\broom\b(?! temperature)', 'volume'),
  (r'\ba grip\b', 'an attraction'), (r'\bA grip\b', 'An attraction'), (r'\bgrips\b', 'attractions'), (r'\bgrip\b', 'attraction'), (r'\bGrips\b', 'Attractions'), (r'\bGrip\b', 'Attraction'),
  (r'\bREADER\b', 'ANALYZER'), (r'\breader\b', 'analyzer'), (r'\bReader\b', 'Analyzer'),
  (r'\bcrank\b', 'pull dial'), (r'\bCrank\b', 'Pull dial'),
  (r'\bbalance pan\b', 'balance'), (r'\bpan\b', 'balance'), (r'\bPan\b', 'Balance'),
  (r'\bSalted Pot\b', 'Salted Flask'), (r'\bsalted pot\b', 'salted flask'), (r'\bpot\b', 'flask'),
  (r'\bTins\b', 'Samples'), (r'\btins\b', 'samples'), (r'\bTin\b', 'Sample'), (r'\btin\b', 'sample'),
  (r'\bNumber marker\b', 'Number dial'), (r'\bmarker\b', 'number dial'), (r'\bMarker\b', 'Number dial'),
  (r'(?<!pressure )(?<!Pressure )\bgauge\b', 'pressure gauge'), (r'(?<!pressure )(?<!Pressure )\bGauge\b', 'Pressure gauge'),
  (r'each pushes with its own pressure', 'each exerts its own pressure'), (r'only pushes the same molecules closer', 'only moves the same molecules closer'), (r'where the air pushes less', 'where the outside pressure is lower'),
]
SKIP_LINE = re.compile(r'^\\b$')
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
