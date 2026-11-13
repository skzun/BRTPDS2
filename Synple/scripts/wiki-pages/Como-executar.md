# Como executar o Synple

## Pastas e pré-requisitos

`BRTPDS2` é a raiz do repositório, onde ficam `iniciar.ps1` e `docker-compose.yml`. `BRTPDS2/Synple` contém os scripts npm; `Synple/mobile` contém Expo/EAS; `Synple/backend` contém a API.

O inicializador exige Node.js 22.13+ e Docker Desktop com Compose 2.24+. O projeto mobile usa Expo SDK 58. Instale no celular um development build compatível para Google e recursos nativos. Não há garantia de compatibilidade apenas por instalar o Expo Go.

## Opção A — preparar tudo no Windows

Abra Docker Desktop. No PowerShell, dentro de **BRTPDS2**:

```powershell
.\iniciar.ps1
```

O script prepara PostgreSQL/API no Docker, instala dependências mobile, obtém cloudflared quando necessário e inicia túneis. Se criar `.env` a partir de exemplos, preencha OAuth e SMTP antes de testar essas integrações. O script não cria credenciais Google nem contas de e-mail.

Para iniciar novamente com o ambiente pronto, dentro de **BRTPDS2**:

```powershell
docker compose up -d
cd Synple
npm run dev:tunnel
```

O comando reutiliza a API Synple disponível em 3001 ou tenta iniciar uma API local. O banco precisa estar disponível. Não inicie uma segunda API na mesma porta.

## Instalar ou reparar dependências (backend e mobile)

O backend e o mobile têm instalações separadas. Faça estes passos após baixar o projeto ou quando houver dependências ausentes. Pare as execuções antigas com Ctrl+C antes de reinstalar. `npm run backend` apenas inicia a API; não instala pacotes.

Identifique a pasta que contém **backend**, **mobile** e **package.json**. Ela é a pasta interna `Synple`; dependendo do nome escolhido ao clonar, o caminho pode terminar em `BRTPDS2\Synple` ou `Synple\Synple`. Não copie o caminho pessoal de outro computador.

**Terminal 1 — backend local:** nessa pasta interna, com PostgreSQL disponível e `backend/.env` configurado:

```powershell
npm --prefix backend ci
npm run backend
```

Mantenha o terminal aberto. **Terminal 2 — mobile:** abra outro PowerShell na mesma pasta interna e execute:

```powershell
cd mobile
npm ci
npm start
```

`npm start` usa os túneis da API e do Expo para abrir o Synple instalado (development build), inclusive em outra rede. O túnel requer cloudflared; o inicializador `iniciar.ps1` da raiz prepara esse requisito. Para usar somente a rede local, substitua `npm start` por `npm run start:local`, com celular e computador na mesma rede. Para Google, use o development build com OAuth configurado, não Expo Go.

Se o backend já estiver rodando no Docker, não execute uma segunda API com `npm run backend`. Nesse caso, mantenha banco/API do Docker ativos e execute apenas os passos do mobile; para atualizar dependências da API em Docker, execute `docker compose up -d --build backend` na pasta que contém `docker-compose.yml`.

### Erros de pacotes ausentes

- **`Cannot find module './mergeConfig'` ou arquivo ausente em `@expo/config`:** uma instalação incompleta do mobile pode causar esse erro. Na pasta `mobile`, pare o Expo, execute `npm ci` e depois `npm start`.
- **`Cannot find module 'nodemailer'`, `pdfkit` ou `google-auth-library`:** na pasta interna que contém `backend`, execute `npm --prefix backend ci` e reinicie a API com `npm run backend`.
- Reinstalar o mobile não corrige dependências do backend. Se o erro continuar, confira a saída completa da instalação e a pasta em que o comando foi executado.

`npm ci` reinstala `node_modules` usando as versões do `package-lock.json`; não altera os arquivos `.env` nem os dados do banco. Não é necessário executá-lo a cada inicialização. Se reclamar de divergência entre `package.json` e `package-lock.json`, obtenha os dois arquivos da mesma revisão do projeto em vez de apagar o lockfile.

Antes do login, confira `http://127.0.0.1:3001/api/health` no computador. O QR do Expo sozinho não garante que a API e o banco estejam funcionando.

## Opção B — rede local, API executada pelo Node

Com o PostgreSQL instalado/configurado e `Synple/backend/.env` preenchido, dentro de **Synple**, no primeiro terminal:

```powershell
npm --prefix backend ci
npm run backend
```

Mantenha esse terminal aberto. Em outro terminal, dentro de **Synple/mobile**:

```powershell
npm install
npm run start:local
```

Esse script detecta o IP e executa Expo em modo development client. Confira o IP escolhido se houver VPN/VirtualBox. Celular e computador devem estar na mesma rede, sem isolamento entre dispositivos. Se a API já estiver no Docker, use-a sem executar `npm run backend` novamente.

## Verificar antes de entrar

No computador, abra `http://127.0.0.1:3001/api/health`. Na rede local, abra no navegador do celular `http://IP_DO_COMPUTADOR:3001/api/health`, substituindo pelo IPv4 atual. A resposta deve confirmar API e banco disponíveis. Uma resposta DEGRADED indica dependência com problema.

O QR do Expo sozinho não inicia PostgreSQL nem valida Google. Sem backend, login, lista administrativa, aprovação e reuniões não conseguem consultar/persistir dados. `EACCES` em uma ferramenta pode significar restrição de acesso; isoladamente não prova que o servidor esteja parado.

## Outra rede ou 4G

Dentro de **Synple**, com banco disponível e cloudflared instalado:

```powershell
npm run dev:tunnel
```

O script cria um túnel da API e outro do Expo, injeta `EXPO_PUBLIC_API_URL` na execução e mostra o QR. Abra o QR atual no development build do Synple. Deixe o computador e o terminal ligados. Endereços de túnel mudam entre execuções. No campo Enter URL manually, use a URL HTTP/HTTPS do Metro exibida no terminal.

## Gerar uma build

Dentro de **Synple/mobile**, onde está `package.json` com Expo:

```powershell
npx eas-cli build --profile development --platform android
```

Executar EAS dentro de `Synple` causa erro de pacote Expo ausente. A configuração atual declara versão 2.0.0, versionamento remoto no EAS e incremento automático apenas no perfil production. O development build abre o JavaScript servido pelo Metro; alterações só de JavaScript podem ser carregadas por ele. Alterar módulos nativos exige outra build. APK independente exige URL de API estável configurada na compilação; produção não deve depender de Quick Tunnel. O perfil production pode gerar AAB para loja, não necessariamente APK instalável.

## Problemas frequentes

| Sintoma | Verificação/ação |
| --- | --- |
| Organizações/reuniões não aparecem | Confirmar backend, banco, login correto e atualizar dados; ver também [limitações de acesso](Estado-atual-e-pendencias). |
| `EADDRINUSE` em 3001 ou 8081 | Encerrar a execução antiga com Ctrl+C ou reutilizar a API; identificar o processo antes de encerrá-lo. |
| `spawn cloudflared.exe ENOENT` | Executar o inicializador da raiz, que instala o binário, ou instalar cloudflared e reabrir o terminal. |
| `iniciar.ps1` não encontrado | Executar na raiz BRTPDS2; em Synple usar `..\iniciar.ps1`. |
| Docker não encontrado | Instalar/abrir Docker Desktop e reabrir o terminal. |
| Google abre, mas login falha | Conferir API e depois pacote/SHA-1/cliente Web conforme o [guia Google](Login-com-Google). |

Logs Docker são consultados na raiz com `docker compose logs backend`. Após alterações no backend em imagem Docker, executar `docker compose up -d --build backend`; para API Node, parar com Ctrl+C e iniciar novamente. Para encerrar containers preservando volumes: `docker compose down`. Não usar remoção de volumes como procedimento normal.


## Dados de demonstração automáticos

Ao executar `iniciar.ps1` na raiz do repositório, o inicializador prepara banco/API no Docker e carrega a demonstração somente se não houver usuários. Instalações existentes preservam suas contas, senhas e organizações. A carga é transacional: se falhar, não deixa dados parcialmente inseridos e o inicializador interrompe a abertura do mobile.

| Conta | Senha inicial |
| --- | --- |
| admin@synple.com | Admin@123 |
| marina@synple.com | Marina@123 |
| joao@synple.com | Joao@123 |

Inclui Estúdio Aurora, Coletivo Horizonte, comissão Comunicação coordenada pela Marina e solicitação pendente de acesso do João. São exemplos fictícios para desenvolvimento/aula, não uma cópia dos cadastros reais de outro computador. As senhas são públicas de demonstração.

Para preparar a demonstração manualmente, com o Docker ativo, na raiz:

```powershell
docker compose exec -T backend node src/db/init-db.js --if-empty
```

Esse comando também ignora a carga se já houver usuários. Não apague volumes para atualizar o projeto. `docker compose up` sozinho apenas prepara a API e aplica migrações; a carga automática de demonstração é feita pelo `iniciar.ps1`.
