import re,sys,html
src=open(sys.argv[1],encoding='utf8').read().splitlines()
title='';pk=None;classes={};order=[];pkgs={};rels=[];cur=None
for raw in src:
    l=raw.strip()
    if not l or l.startswith(('@','!','skinparam')): continue
    if l.startswith('title '): title=l[6:];continue
    m=re.match(r'package "([^"]+)" \{',l)
    if m: pk=m.group(1);pkgs[pk]=[];continue
    m=re.match(r'class (\w+)(?: <<(\w+)>>)?\s*(\{)?$',l)
    if m:
        n=m.group(1);classes[n]={'st':m.group(2),'attr':[],'ops':[]};order.append(n)
        (pkgs[pk] if pk else pkgs.setdefault(None,[])).append(n)
        cur=n if m.group(3) else None;continue
    if l=='}':
        if cur: cur=None
        else: pk=None
        continue
    if cur:
        (classes[cur]['ops'] if '(' in l or l.startswith(('+ POST','+ GET','+ PATCH'))  else classes[cur]['attr']).append(l);continue
    m=re.match(r'(\w+)\s+(<\|--|\*--|\.\.>)\s+(?:"([^"]+)"\s+)?(\w+)(?:\s*:\s*(.*))?$',l)
    if m: rels.append(m.groups());continue
    raise SystemExit('nao suportado: '+l)
e=lambda s:html.escape(s)
out=['digraph C {','rankdir=TB; nodesep=0.4; ranksep=0.7; newrank=true;',
 f'graph [fontname="DejaVu Sans", fontsize=15, label="{e(title)}", labelloc=t];',
 'node [shape=plain, fontname="DejaVu Sans", fontsize=10];','edge [fontname="DejaVu Sans", fontsize=9, color="#334155"];']
def node(n):
    c=classes[n];head=(f'<FONT POINT-SIZE="9">«{e(c["st"])}»</FONT><BR/>' if c['st'] else '')+f'<B>{e(n)}</B>'
    rows=f'<TR><TD BGCOLOR="#E2E8F0">{head}</TD></TR>'
    a='<BR ALIGN="LEFT"/>'.join(e(x) for x in c['attr']); o='<BR ALIGN="LEFT"/>'.join(e(x) for x in c['ops'])
    rows+=f'<TR><TD ALIGN="LEFT" BALIGN="LEFT">{a}{"<BR ALIGN=\"LEFT\"/>" if a else " "}</TD></TR>'
    rows+=f'<TR><TD ALIGN="LEFT" BALIGN="LEFT">{o}{"<BR ALIGN=\"LEFT\"/>" if o else " "}</TD></TR>'
    return f'{n} [label=<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="5" BGCOLOR="#F8FAFC" COLOR="#334155">{rows}</TABLE>>];'
for i,(p,ns) in enumerate(pkgs.items()):
    if p: out.append(f'subgraph cluster_{i} {{ label="{e(p)}"; style="rounded,dashed"; color="#64748B"; fontsize=12;')
    out+= [node(n) for n in ns]
    if p: out.append('}')
for a,k,mult,b,lab in rels:
    L=f', label="{e(lab)}"' if lab else ''
    if k=='<|--': out.append(f'{b} -> {a} [arrowhead=empty, arrowsize=1.3{L}];')
    elif k=='*--': out.append(f'{a} -> {b} [dir=back, arrowtail=diamond, arrowhead=none{", headlabel=\""+e(mult)+"\"" if mult else ""}{L}];')
    else: out.append(f'{a} -> {b} [style=dashed, arrowhead=vee{L}];')
out.append('}')
open(sys.argv[2],'w',encoding='utf8').write('\n'.join(out))
