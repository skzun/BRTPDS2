import re,sys
src,dst,names=sys.argv[1],sys.argv[2],sys.argv[3].split(',')
s=open(src,encoding='utf8').read()
def fix(m):
    g=m.group(0); t=re.search(r'<title>(.*?)</title>',g).group(1)
    if t not in names: return g
    xs=re.findall(r'<text[^>]*x="([-\d.]+)" y="([-\d.]+)"',g)
    x=float(xs[0][0]); y=float(xs[0][1])-16
    fig=(f'<circle cx="{x}" cy="{y-40}" r="7" fill="white" stroke="#334155" stroke-width="1.4"/>'
         f'<path d="M{x} {y-33} v18 M{x-12} {y-27} h24 M{x} {y-15} l-10 13 M{x} {y-15} l10 13" stroke="#334155" stroke-width="1.4" fill="none"/>')
    return g.replace('</g>',fig+'</g>')
s=re.sub(r'<g id="node\d+" class="node">.*?</g>',fix,s,flags=re.S)
open(dst,'w',encoding='utf8').write(s)
