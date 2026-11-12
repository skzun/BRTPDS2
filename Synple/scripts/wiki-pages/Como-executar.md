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

## Opção B — rede local, API executada pelo Node

Com o PostgreSQL instalado/configurado e `Synple/backend/.env` preenchido, dentro de **Synple**, no primeiro terminal:

```powershell
npm --prefix backend install
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
