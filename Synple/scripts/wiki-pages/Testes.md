# Testes e evidências

## Execução de 13/11/2026

Checkout `{{REVISION}}`, PostgreSQL 16 local, schemas temporários, sem e-mail real.

| Verificação | Resultado |
| --- | --- |
| `npm test` em `Synple/mobile` | 28 passaram; zero falhas |
| `node --test test/voting.test.js test/meetings.test.js` em `Synple/backend` | 30 de 32 passaram. As 2 falhas (PDF da ata e PDF da lista de presença) vêm do substituto de `pdfkit` usado no teste; passaram com a biblioteca real em 11–12/11 |
| `node Synple/scripts/validate-documentation.cjs` | 42 documentos, 978 referências, 49 RFs, 34 pares fonte/SVG e 131 colunas aprovados |

O `node_modules` versionado no Git está incompleto (faltam `pdfkit`, `nodemailer` e `google-auth-library`). Para rodar tudo, execute `npm ci` em `Synple/backend` e `Synple/mobile` antes dos testes.

Votação conferida: validação de pergunta e 2–8 opções; somente gestor abre/encerra; exige presença; troca de voto sem duplicar; identidade forjada e opção de outra votação recusadas; concorrência entre votos e encerramento; resultado visível ao convidado histórico e oculto a estranhos. Convites conferidos: agendamento deduplica convidados e recusa pessoas fora da comissão; aceitar/recusar; resposta bloqueada após o término; entrada só durante a reunião; edição redefine convites.

## Execução de 12/11/2026

Resultados desta revisão:

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
