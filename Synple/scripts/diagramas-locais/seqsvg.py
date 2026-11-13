"""Renderiza o subconjunto de PlantUML usado nos diagramas de sequência do Synple em SVG.
Suporta: title, actor/participant/database, ->, -->, autonumber, alt/else/end, loop/end,
note right of X : texto. Uso: python3 seqsvg.py entrada.puml saida.svg"""
import re, sys, html

FONT = 13
CW = 7.0  # largura média de caractere (px) para estimar texto
LH = 17

def tw(s):
    return max(len(l) for l in s.split('\n')) * CW

def esc(s):
    return html.escape(s, quote=True)

def parse(path):
    src = open(path, encoding='utf8').read().splitlines()
    title = ''
    parts = []  # (alias, label, kind)
    events = []
    for raw in src:
        l = raw.strip()
        if not l or l.startswith(('@', '!', 'skinparam', 'hide', "'")):
            continue
        if l == 'autonumber':
            continue
        if l.startswith('title '):
            title = l[6:].strip(); continue
        m = re.match(r'^(actor|participant|database)\s+(?:"([^"]+)"|(\S+))(?:\s+as\s+(\S+))?$', l)
        if m:
            kind, q, b, alias = m.groups()
            label = (q or b).replace('\\n', '\n')
            parts.append((alias or (q or b), label, kind)); continue
        m = re.match(r'^(alt|loop|opt)\s*(.*)$', l)
        if m:
            events.append(('open', m.group(1), m.group(2))); continue
        m = re.match(r'^else\s*(.*)$', l)
        if m:
            events.append(('else', m.group(1))); continue
        if l == 'end':
            events.append(('end',)); continue
        m = re.match(r'^note\s+(right|left)\s+of\s+(\S+)\s*:\s*(.*)$', l)
        if m:
            events.append(('note', m.group(2), m.group(3))); continue
        m = re.match(r'^(\S+)\s*(-->|->)\s*(\S+)\s*:\s*(.*)$', l)
        if m:
            a, arrow, b, txt = m.groups()
            events.append(('msg', a, b, arrow == '-->', txt.replace('\\n', '\n'))); continue
        raise SystemExit(f'{path}: linha não suportada: {l}')
    return title, parts, events

def render(path, out):
    title, parts, events = parse(path)
    idx = {p[0]: i for i, p in enumerate(parts)}
    n = len(parts)
    # largura mínima entre colunas adjacentes conforme mensagens
    boxw = [max(90, tw(p[1]) + 24) for p in parts]
    gap = [0.0] * n  # gap[i] = distância entre centro i e i+1
    for i in range(n - 1):
        gap[i] = (boxw[i] + boxw[i + 1]) / 2 + 30
    selfw = [0.0] * n
    num = 0
    for e in events:
        if e[0] == 'msg':
            num += 1
            a, b = idx[e[1]], idx[e[2]]
            w = tw(f'{num}  ' + e[4]) + 30
            if a == b:
                selfw[a] = max(selfw[a], w + 40)
                continue
            lo, hi = min(a, b), max(a, b)
            cur = sum(gap[lo:hi])
            if cur < w:
                extra = (w - cur) / (hi - lo)
                for k in range(lo, hi):
                    gap[k] += extra
        elif e[0] == 'note':
            a = idx[e[1]]
            selfw[a] = max(selfw[a], tw(e[2]) + 40)
    for i in range(n - 1):
        gap[i] = max(gap[i], selfw[i] + 20)
    x = [0.0] * n
    x[0] = 20 + boxw[0] / 2
    for i in range(1, n):
        x[i] = x[i - 1] + gap[i - 1]
    width = x[-1] + max(boxw[-1] / 2, selfw[-1]) + 30
    out_el = []
    y = 20
    if title:
        out_el.append(f'<text x="{width/2:.0f}" y="{y+14}" text-anchor="middle" font-size="15" font-weight="bold">{esc(title)}</text>')
        y += 36
    headh = max(len(p[1].split('\n')) for p in parts) * LH + 16
    top = y + (26 if any(p[2] == 'actor' for p in parts) else 0)

    def head(i, yy):
        alias, label, kind = parts[i]
        lines = label.split('\n')
        bw = boxw[i]
        s = []
        if kind == 'actor':
            cx = x[i]; s.append(f'<circle cx="{cx}" cy="{yy-20}" r="6" fill="#fff" stroke="#334155"/>'
                                f'<path d="M{cx} {yy-14} v12 M{cx-9} {yy-10} h18 M{cx} {yy-2} l-8 10 M{cx} {yy-2} l8 10" stroke="#334155" fill="none"/>')
            for k, t in enumerate(lines):
                s.append(f'<text x="{cx}" y="{yy+22+k*LH}" text-anchor="middle">{esc(t)}</text>')
            return ''.join(s)
        fill = '#EEF2FF' if kind == 'database' else '#F8FAFC'
        rx = 12 if kind == 'database' else 4
        s.append(f'<rect x="{x[i]-bw/2}" y="{yy}" width="{bw}" height="{headh}" rx="{rx}" fill="{fill}" stroke="#334155"/>')
        for k, t in enumerate(lines):
            s.append(f'<text x="{x[i]}" y="{yy+8+LH*(k+1)-4+(headh-16-LH*len(lines))/2}" text-anchor="middle">{esc(t)}</text>')
        return ''.join(s)

    for i in range(n):
        out_el.append(head(i, top))
    y = top + headh + 24
    body = []
    frames = []  # stack de [kind, label, y0, else_ys, depth]
    num = 0
    for e in events:
        if e[0] == 'msg':
            num += 1
            a, b = idx[e[1]], idx[e[2]]
            dash = ' stroke-dasharray="6 4"' if e[3] else ''
            lines = e[4].split('\n')
            label = f'{num}  ' + lines[0]
            if a == b:
                xa = x[a]
                for k, t in enumerate([label] + lines[1:]):
                    body.append(f'<text x="{xa+8}" y="{y+k*LH}">{esc(t)}</text>')
                yy = y + 6 + (len(lines) - 1) * LH
                body.append(f'<path d="M{xa} {yy} h30 v14 h-30" fill="none" stroke="#334155"{dash} marker-end="url(#ah)"/>')
                y = yy + 30
            else:
                xa, xb = x[a], x[b]
                tx = min(xa, xb) + 10
                for k, t in enumerate([label] + lines[1:]):
                    body.append(f'<text x="{tx}" y="{y+k*LH}">{esc(t)}</text>')
                yy = y + 6 + (len(lines) - 1) * LH
                body.append(f'<line x1="{xa}" y1="{yy}" x2="{xb}" y2="{yy}" stroke="#334155"{dash} marker-end="url(#ah)"/>')
                y = yy + 22
        elif e[0] == 'note':
            a = idx[e[1]]; t = e[2]
            w = tw(t) + 16
            body.append(f'<rect x="{x[a]+12}" y="{y-12}" width="{w}" height="24" fill="#FEF9C3" stroke="#A16207"/>'
                        f'<text x="{x[a]+20}" y="{y+4}">{esc(t)}</text>')
            y += 30
        elif e[0] == 'open':
            frames.append([e[1], e[2], y - 4, [], len(frames)])
            y += 26
        elif e[0] == 'else':
            frames[-1][3].append((y - 4, e[1]))
            y += 26
        elif e[0] == 'end':
            kind, lab, y0, elses, depth = frames.pop()
            x0 = 12 + depth * 6; x1 = width - 12 - depth * 6
            g = [f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y-y0}" fill="none" stroke="#64748B"/>',
                 f'<path d="M{x0} {y0} h{len(kind)*CW+16} v12 l-6 6 h-{len(kind)*CW+10} z" fill="#E2E8F0" stroke="#64748B"/>',
                 f'<text x="{x0+6}" y="{y0+14}" font-weight="bold">{kind}</text>',
                 f'<text x="{x0+len(kind)*CW+24}" y="{y0+14}" fill="#334155">[{esc(lab)}]</text>']
            for ey, el in elses:
                g.append(f'<line x1="{x0}" y1="{ey}" x2="{x1}" y2="{ey}" stroke="#64748B" stroke-dasharray="5 4"/>'
                         f'<text x="{x0+8}" y="{ey+14}" fill="#334155">[{esc(el)}]</text>')
            body.insert(0, ''.join(g))
            y += 10
    bottom = y + 6
    for i in range(n):
        out_el.insert(0, f'<line x1="{x[i]}" y1="{top+headh}" x2="{x[i]}" y2="{bottom}" stroke="#94A3B8" stroke-dasharray="5 5"/>')
    height = bottom + 20
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width:.0f}" height="{height:.0f}" viewBox="0 0 {width:.0f} {height:.0f}" '
           f'font-family="DejaVu Sans, Arial, sans-serif" font-size="{FONT}" fill="#0F172A">'
           '<defs><marker id="ah" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">'
           '<path d="M0 0 L10 5 L0 10 z" fill="#334155"/></marker></defs>'
           f'<rect width="100%" height="100%" fill="white"/>' + ''.join(out_el) + ''.join(body) + '</svg>\n')
    open(out, 'w', encoding='utf8').write(svg)

if __name__ == '__main__':
    render(sys.argv[1], sys.argv[2])
