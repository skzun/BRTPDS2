# Synple

Aplicativo de gestão de organizações, comissões e reuniões da disciplina Projeto e Desenvolvimento de Sistemas II — IFSP Câmpus Barretos.

## Funcionalidades

- Cadastro, login por senha ou Google e recuperação de senha por código enviado por e-mail.
- Aprovação de organizações, gestão de acessos, membros e comissões.
- Reuniões com convites, aceite/recusa, entrada/saída e lista de presença.
- Atas com versões, aprovação por todos os presentes e exportação em PDF.
- Perfil, temas claro/escuro e painel do administrador com métricas reais do servidor.

## Tecnologias

| Camada | Implementação |
| --- | --- |
| Aplicativo | Expo SDK 57, React Native, React e JavaScript; Android, iOS e Web |
| Dados locais | AsyncStorage; reuniões e atas dependem da API |
| API e banco | Node.js, Express 4 e PostgreSQL |
| Google | Google Sign-In nativo e validação de identidade no backend |
| E-mail e PDF | Nodemailer/SMTP e PDFKit |
| Desenvolvimento | Docker Compose, EAS Build e túneis Cloudflare/Expo |

## Executar em outro computador

Instale Node.js/npm, Git e Docker Desktop. Para túneis no Windows, instale também:

```powershell
winget install --id Cloudflare.cloudflared --exact
```

Reabra o terminal. Clone o repositório e entre na pasta `Synple`. Os comandos abaixo são executados nessa pasta:

```powershell
cd Synple
Copy-Item backend/.env.example backend/.env
Copy-Item mobile/.env.example mobile/.env
```

Preencha os arquivos locais com os Client IDs Google e a configuração SMTP do backend para recuperação de senha. Não sobrescreva `.env` já configurados. Veja o [manual completo](Synple/GUIA_USO_E_INICIALIZACAO.md), a [configuração Google](Synple/LOGIN_COM_GOOGLE.md) e a [configuração de e-mail](Synple/backend/EMAIL_RECOVERY_SETUP.md).

Com Docker Desktop aberto:

```powershell
npm --prefix mobile install
docker compose up -d --build
Invoke-RestMethod http://localhost:3001/api/health
```

Escolha um comando para abrir o app:

```powershell
# Na mesma rede Wi-Fi
npm --prefix mobile run start:dev-client

# Em outra rede: túneis da API e do Metro
npm run dev:tunnel
```

Para login Google, instale o **development build do Synple** no celular e abra o QR atual nele. Mantenha o terminal aberto. O Expo Go não contém o módulo nativo Google; para testar as demais telas, use `npm --prefix mobile run start:go` na mesma rede ou `npm run dev:tunnel:go` em outra rede.

O Quick Tunnel Cloudflare usado no projeto é gratuito e temporário. `npx expo start --tunnel` sozinho publica somente o Metro. Se ocorrer `spawn cloudflared.exe ENOENT`, instale o Cloudflared, reabra o terminal e confira `cloudflared --version`.

### Gerar development build Android

Com conta Expo autenticada e projeto EAS configurado:

```powershell
cd mobile
npx eas-cli build --platform android --profile development
```

O build na nuvem dispensa Android SDK local. O pacote e o SHA-1 da assinatura precisam corresponder ao cliente OAuth Android. Veja o [guia Google](Synple/LOGIN_COM_GOOGLE.md).

### Atualizar e encerrar

Após atualizar o projeto, reinstale dependências alteradas e reconstrua a API com `docker compose up -d --build`. Para backend executado diretamente pelo Node, use `npm --prefix backend install` e reinicie a API. A inicialização aplica as migrações; `npm run migrate` permite aplicá-las separadamente com conexão ao banco configurada.

`Ctrl+C` encerra Expo/túneis. `docker compose down` encerra os containers. A opção `-v` apaga o banco persistido. `init-db` prepara dados de demonstração e pode redefinir suas credenciais; use migrações nas atualizações de instalações existentes.

## Dados compartilhados

Cada PostgreSQL local mantém seus próprios dados. Para usar as mesmas contas, organizações, reuniões e atas, todos precisam acessar a mesma API/banco. Uma pessoa pode iniciar `npm run dev:tunnel` e compartilhar o QR com celulares que tenham o development build compatível. Para distribuição permanente, hospede API e banco e configure uma URL HTTPS estável no app.

## Painel do administrador

Entre como administrador do sistema e abra **Sistema**. O painel consulta nome/versão da API, PID, ambiente, host, tempo online, memória, conexões HTTP/TCP, pool e métricas do PostgreSQL a cada 15 segundos. Uploads aparecem como **não implementados**. Após reiniciar a API ou expirar a sessão administrativa, entre novamente. Em Docker, PID e host pertencem ao container; a memória corresponde ao ambiente visto pelo processo.

Os botões de setup, reinício de subsistemas e reset da demonstração atuam no estado local do app. O monitoramento consulta o servidor real. As demais rotas ainda têm limitações de autenticação/autorização descritas na especificação do incremento 2, que precisam ser resolvidas antes de uma implantação pública.

## Documentação e diagramas

| Documento | Conteúdo |
| --- | --- |
| [Manual de uso e inicialização](Synple/GUIA_USO_E_INICIALIZACAO.md) | Instalação, uso e solução de problemas |
| [Documentação do software](Synple/DOCUMENTACAO_SOFTWARE.md) | Arquitetura e funcionamento |
| [Incremento 1](docs/incremento-1-especificacao-completa.md) | Especificação acadêmica de organizações, usuários e comissões |
| [Incremento 2](Synple/docs/INCREMENTO_2.md) | Reuniões, presença, atas, aprovação, PDF e limitações |
| [Diagramas do incremento 1](docs/Diagramas/Incremento_1.md) | Casos de uso, implantação e modelo relacional |
| [Diagramas do incremento 2](docs/Diagramas/Incremento_2.md) | Casos de uso, estados, classes, modelo relacional e sequências |
| [Docker](Synple/COMO_RODAR_DOCKER.md) | API e banco em containers |
| [Roteiro de avaliação](Synple/docs/VERIFICACAO_INCREMENTO_2.md) | Evidências do incremento 2 |

## Estrutura

```text
BRTPDS2/
├── README.md
├── docs/Diagramas/         # Os dois incrementos
└── Synple/
    ├── backend/           # API, PostgreSQL, SMTP e PDF
    ├── mobile/            # Aplicativo Expo/React Native
    ├── scripts/           # Inicialização e túneis
    ├── docs/              # Especificação atual do incremento 2
    └── docker-compose.yml
```
