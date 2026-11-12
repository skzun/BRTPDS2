# Testes e evidências

Execução em 12/11/2026 no checkout `{{REVISION}}`. Resultados desta revisão:

| Verificação | Resultado |
| --- | --- |
| `npm --prefix mobile test` em Synple | 28 passaram; zero falhas |
| `npm --prefix backend test` em Synple | 51 passaram; zero falhas; PostgreSQL acessível, schemas temporários |
| `node scripts/check-source.cjs` | Sem referências livres inesperadas |
| `node scripts/validate-documentation.cjs` antes de atualizar Wiki | 42 documentos, 884 referências, 49 RFs, 33 pares fonte/SVG e 131 colunas aprovados |

O acesso ao banco foi permitido para a execução dos testes. O erro anterior EACCES era restrição de acesso do ambiente de ferramentas e não demonstrava, por si só, PostgreSQL parado. As suítes de banco usam schemas próprios e não dependem de criar contas demo na instalação do usuário; e-mails são simulados nos testes.

## Cobertura observada

- Mobile: campos, máscara, períodos, convidados, presença/atas, cache sem credenciais, módulos nativos ausentes e preflight de PDF.
- Backend: autorização e sessão, recuperação/ativação, migração repetível, gestão de membros, presença e atas transacionais, versões/unanimidade, PDFs, anexos e votações.
- Votação: voto único/alterável, opção válida, presença exigida, encerramento concorrente, preservação de resultados e relatório derivado da sessão.

## Como reproduzir

Com dependências instaladas e banco de teste acessível pelas variáveis de backend, na pasta Synple:

```powershell
npm test
node scripts/check-source.cjs
node scripts/validate-documentation.cjs
```

Use banco de desenvolvimento/teste com permissão para schemas temporários. Registre data, revisão, comandos, saídas e limitações. Não alterar contas reais para satisfazer testes.

Não foram realizados nesta revisão build/instalação de APK ou IPA, testes visuais no celular, OAuth real, entrega SMTP real, biometria ou ensaio de desempenho. As últimas mudanças de acesso sem convite e fusos de Dia todo precisam de testes específicos. Consulte [Pendências](Estado-atual-e-pendencias) e o [roteiro físico](Validacao-em-Aparelhos). Relatórios anteriores permanecem acessíveis em [Verificação do incremento 3](Verificacao-Incremento-3), com suas datas e condições.
