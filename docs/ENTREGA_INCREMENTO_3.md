# Entrega do Incremento 3 — estado verificado

Revisão: 06/11/2026, America/Sao_Paulo. Este documento registra o estado do checkout após as correções, sem afirmar publicação de commit, instalação em celulares ou validação com a comunidade.

## O que foi corrigido

- Datas: backend rejeita início passado, término inválido, convite após término e presença fora do período. A validação devolve todos os erros de campo.
- Reuniões: edição antes do início e sem presença, nova confirmação dos convidados, modo dia todo, local e detalhes opcionais.
- Interface: formulário separado da lista, cartões recolhidos e abas Presença/Arquivos/Votações/Ata; erros por campo; seletores de data/hora quando presentes no build; rolagem do campo focado com teclado.
- Presença: biometria local no autorregistro; código temporário como alternativa; registro pelo gestor com alvo explícito e auditoria de ator/método. Biometria não é atestado remoto e código não prova proximidade física.
- Arquivos: PDF, PNG, JPEG e TXT de até 5 MB, dez por reunião; apenas gestor envia, convidados/gestor baixam; conteúdo não é distribuído pelo snapshot.
- PDF da lista de presença independente da ata, com fontes Unicode, convidados e horários.
- Recuperação: oito caracteres no cliente/servidor e formato de e-mail validado.
- Testes: todas as suítes de banco usam schemas isolados; não dependem das contas reais de demonstração.
- Documentação: modelos, dicionários, versões, requisitos declarativos, fichas e sequências; a análise de mercado descreve a arquitetura efetivamente implementada.

## Evidências automatizadas

| Verificação | Resultado observado |
| --- | --- |
| Backend: `npm --prefix Synple/backend test` | 42 testes aprovados, zero falhas; schemas temporários e SMTP simulado |
| Mobile: `npm --prefix Synple/mobile test` | 27 testes aprovados, zero falhas |
| Dependências: `expo install --check` | Compatíveis com SDK 58; conferência repetida após instalações finais |
| Referências: `node Synple/scripts/check-source.cjs` | Sem referências livres inesperadas |
| Exportação Expo Android/iOS/web | Pacotes gerados; a exportação JavaScript não equivale a APK/IPA instalado |
| Documentação: `node Synple/scripts/validate-documentation.cjs` | 49 RFs; 33 fontes/SVGs; 131 colunas; referências conferidas |
| Migração | Schema novo e reaplicação testados sem apagar dados/senhas |
| Build nativo | Consultar a seção final deste documento; não confundir tentativa/resultado com instalação |

Os testes novos cobrem os quatro defeitos temporais reproduzidos na inspeção, edição/dia todo/detalhes, operação por gestor, código expirado/incorreto, anexos privados/inválidos, PDF de presença, voto único/alterável, bloqueio após fechamento, relatório privado e ticket restrito à rota.

Dependências: backend sem alertas conhecidos na instalação executada; mobile ainda apresentou sete alertas moderados no npm. Não foi aplicado `npm audit fix --force` por poder trocar versões de SDK incompatíveis. Isso deve ser avaliado antes de publicação de produção.

## Rastreabilidade para os slides

| Exigência | Implementação e evidência |
| --- | --- |
| Presidente cria ata e presentes aprovam/reprovam | RF02.07–RF02.09; teste de unanimidade, versões, rejeição e concorrência |
| Votações independentes | RF03.01–RF03.03; testes de elegibilidade, opção única e encerramento |
| Relatório individual | RF03.04; filtro da sessão com teste de tentativa de outra identidade |
| Manual digital | RF03.05; tela local com instruções atualizadas |
| Expo SDK 58 | package.json/lockfile, validação Expo e exportação multiplataforma |
| Casos de uso, classes/métodos, relacional e dicionários | [Índice de diagramas](Diagramas/Diagramas_Casos_de_Uso.md), [classes](dicionario-classes.md), [banco](dicionario-banco-dados.md) |
| RFs e RNFs | [Especificação consolidada](incremento-1-especificacao-completa.md), tabela declarativa, fichas e critérios |
| Melhorias das avaliações anteriores | RF03.06–RF03.11; fluxo de reuniões/presença/arquivos e regressões correspondentes |

## Executar para a demonstração

Na raiz, com Node.js 22.13+ e Docker Desktop:

```powershell
.\iniciar.ps1
```

O padrão é o Synple instalado (development build SDK 58), com túneis externos para Expo e API. As dependências novas exigem **reinstalar um build atualizado**; recarregar JavaScript não acrescenta módulos ao APK/IPA antigo.

Em `Synple/mobile`, para gerar pelo serviço EAS com a conta da equipe:

```powershell
npx.cmd eas-cli@latest build --platform android --profile development
npx.cmd eas-cli@latest build --platform ios --profile development
```

Esses comandos exigem acesso às contas/credenciais correspondentes; não foram apresentados como builds remotos já realizados.

## Aceite em aparelhos e evidências externas

Preencher [VALIDACAO_EM_APARELHOS.md](VALIDACAO_EM_APARELHOS.md) com aparelho, versão do build, passos, resultado e evidência.

Ainda requerem execução/evidência real: Android/iOS físicos, ícone após instalação/atualização, teclado e seletores nativos, claro/escuro/fonte ampliada, biometria cancelada e disponível, seleção/abertura de arquivos, login Google com assinatura correta, recebimento de ativação/recuperação por SMTP, avaliação manual de concorrentes, entrevistas e validação com a comunidade.

O formulário institucional específico não foi fornecido no checkout; as fichas incluem ator, gatilho, pré-condição, entradas, passos, alternativas, pós-condição e contrato. Confirmar equivalência com o modelo do professor antes da entrega. Não inventar entrevistas, aceite de pessoas ou testes em aparelhos.

## Limites de operação definidos

- Reinício de processos e backup/restauração ficam no operador/Docker. A interface consulta disponibilidade e oferece “Limpar cache e sair”; não simula reinício ou restauração.
- PostgreSQL 16 foi mantido para preservar dados existentes; não houve troca de versão principal sem migração planejada.
- Sem login offline, chat, assinatura digital ou comprovação de proximidade física pelo código de presença.
- Túneis são para desenvolvimento/demonstração, com endereços temporários.

