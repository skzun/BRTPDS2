# Synple — documentação do projeto

Aplicativo de gestão de organizações, comissões e reuniões, com presença, atas, votações e relatório individual. Versão configurada do mobile: **2.0.0**. Revisão documental: **13/11/2026**.

O aplicativo utiliza uma API Node.js e PostgreSQL. Login, consultas e alterações precisam desses serviços em execução. A versão configurada não comprova que o APK instalado seja dessa versão.

## Comece aqui

- [Instalar e iniciar o app](Como-executar)
- [Manual do usuário](Manual-do-usuario)
- [Login com Google](Login-com-Google)
- [E-mail e recuperação](Email-e-Recuperacao)
- [Contas e demonstração](Usuarios-de-Teste)

## Documentação técnica

- [Especificação (Incremento 1): requisitos, casos de uso e RNFs](Especificacao)
- [Reuniões, presença e atas (Incremento 2)](Reunioes-e-Atas)
- [Votações, relatório e manual (Incremento 3)](Votacoes-Relatorio-e-Manual)
- [Matriz dos 49 requisitos](Rastreabilidade)
- [Diagramas](Diagramas), [classes](Dicionario-de-Classes) e [banco de dados](Dicionario-do-Banco)
- [Interfaces](Interface-e-UX), [arquitetura](Arquitetura-e-Tecnologias), [padrões de código](Padroes-de-Codigo) e [análise de mercado](Analise-de-Mercado)
- [Testes](Testes) e [validação em aparelhos](Validacao-em-Aparelhos)
- [Estado atual e pendências](Estado-atual-e-pendencias)

## Como contribuir

Abra uma issue descrevendo o problema ou a proposta, crie um branch a partir de `main` e envie um pull request com testes (`npm test` em `Synple/mobile` e `Synple/backend`). Siga os [padrões de código](Padroes-de-Codigo) e mantenha a documentação em `docs/` junto com a mudança.

## Manutenção

Os documentos técnicos ficam em `BRTPDS2/docs`; o código em `BRTPDS2/Synple`. A Wiki é uma publicação dessas fontes, com orientações operacionais e uma revisão do estado atual. Consulte o [mapa de pastas](Organizacao-do-Projeto).

Referência do código revisado: [{{REVISION}}]({{SOURCE}}). Resultados de verificações anteriores têm suas próprias datas e não substituem validação da versão instalada. Testes físicos em aparelhos e entrevistas com usuários ainda não foram registrados.
