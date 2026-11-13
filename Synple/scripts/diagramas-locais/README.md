# Geração local das imagens dos diagramas revisados

Usado em 13/11/2026 para gerar os SVGs dos diagramas revisados a partir do código, sem servidor externo. Requer Python 3 e Graphviz (`dot`).

Executar a partir de `docs/Diagramas/ENTREGA_DEFINITIVA`:

```bash
S=../../../Synple/scripts/diagramas-locais
# Sequências (subconjunto PlantUML: participantes, ->, -->, alt/else/loop/end, note)
for n in seq-ata seq-pdf seq-cadastro seq-login seq-recuperacao seq-convite-org seq-transferencia \
         seq-sincronizacao seq-comando seq-votacoes seq-relatorio-participacao seq-manual-consulta; do
  python3 $S/seqsvg.py fontes/$n.puml renderizados/$n.svg
done
# Casos de uso (o .dot espelha o .puml correspondente; atores desenhados como bonecos UML)
dot -Tsvg $S/uc-incremento-3.dot -o /tmp/uc.svg && python3 $S/atores-uc.py /tmp/uc.svg renderizados/uc-incremento-3.svg G,U,P
dot -Tsvg $S/uc-incremento-3-ajustes.dot -o /tmp/uc2.svg && python3 $S/atores-uc.py /tmp/uc2.svg renderizados/uc-incremento-3-ajustes.svg G,C
# Classes
python3 $S/classes-para-dot.py fontes/classes-incremento-3.puml /tmp/cls.dot && dot -Tsvg /tmp/cls.dot -o renderizados/classes-incremento-3.svg
```

As fontes `.puml` continuam válidas no PlantUML oficial; ao alterar um diagrama, altere o `.puml` (e o `.dot` dos casos de uso) e gere a imagem novamente.
