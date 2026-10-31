# Tecnologias e versões — Synple

Revisão: 30/10/2026. Faixas vêm dos manifests; versões resolvidas vêm dos lockfiles versionados. Não representam prova de instalação em outro PC.

## mobile

| Dependência direta | Faixa declarada | Resolvida no lockfile | Uso |
| --- | --- | --- | --- |
| `@react-native-async-storage/async-storage` | `2.2.0` | `2.2.0` | Aplicação |
| `@react-native-google-signin/google-signin` | `^16.1.5` | `16.2.0` | Aplicação |
| `expo` | `~57.0.24` | `57.0.31` | Aplicação |
| `expo-auth-session` | `~57.0.15` | `57.0.15` | Aplicação |
| `expo-build-properties` | `~57.0.22` | `57.0.22` | Aplicação |
| `expo-dev-client` | `~57.0.20` | `57.0.20` | Aplicação |
| `expo-local-authentication` | `~57.0.3` | `57.0.3` | Aplicação |
| `expo-secure-store` | `~57.0.4` | `57.0.4` | Aplicação |
| `expo-splash-screen` | `~57.0.9` | `57.0.9` | Aplicação |
| `expo-status-bar` | `~57.0.1` | `57.0.1` | Aplicação |
| `expo-web-browser` | `~57.0.3` | `57.0.3` | Aplicação |
| `react` | `19.2.3` | `19.2.3` | Aplicação |
| `react-dom` | `19.2.3` | `19.2.3` | Aplicação |
| `react-native` | `0.86.3` | `0.86.3` | Aplicação |
| `react-native-safe-area-context` | `~5.7.0` | `5.7.0` | Aplicação |
| `react-native-web` | `^0.21.2` | `0.21.4` | Aplicação |
| `@expo/ngrok` | `^4.1.3` | `4.1.3` | Desenvolvimento |

## backend

| Dependência direta | Faixa declarada | Resolvida no lockfile | Uso |
| --- | --- | --- | --- |
| `bcryptjs` | `^2.4.3` | `2.4.3` | Aplicação |
| `cors` | `^2.8.5` | `2.8.6` | Aplicação |
| `dotenv` | `^16.4.7` | `16.6.1` | Aplicação |
| `express` | `^4.21.2` | `4.22.3` | Aplicação |
| `google-auth-library` | `^11.3.0` | `11.3.0` | Aplicação |
| `nodemailer` | `^10.0.10` | `10.3.1` | Aplicação |
| `pdfkit` | `^0.20.2` | `0.20.2` | Aplicação |
| `pg` | `^8.13.1` | `8.23.0` | Aplicação |

## Plataforma e infraestrutura

| Item | Configuração/requisito | Evidência |
| --- | --- | --- |
| Node.js | Mínimo 22.13; imagem backend node:22-alpine (tag flutuante, patch não fixado) | README, Dockerfile e compatibilidade Expo SDK 57 |
| Android | 7.0/API 24 ou superior | app.json, expo-build-properties.minSdkVersion=24 |
| iOS | 16.4 ou superior | app.json, deploymentTarget=16.4 |
| PostgreSQL | Imagem postgres:16-alpine; versão menor não fixada | Ambos os docker-compose.yml |
| Docker Compose | 2.24+ para env_file opcional | README e configuração Compose |
| JavaScript | Código mobile/backend; não há TypeScript no código da aplicação | Arquivos .js/.cjs |
| Testes | node:test incluído no Node.js | Scripts npm test |
| Cloudflared | Executável externo; versão não fixada pelo repositório | iniciar.ps1 e scripts/dev-tunnel.js |
| EAS CLI | Comandos com latest; versão efetiva depende da execução | README e eas.json |

Não há Sequelize, Lucia Auth, JWT de sessão, WatermelonDB, Redis, MinIO, TanStack Query, Zustand, React Native Paper ou React Navigation nas dependências atuais. Não confundir ID token Google com o token opaco de sessão do Synple.

Referências: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [ciclo PostgreSQL](https://www.postgresql.org/support/versioning/). Manter PostgreSQL 16 é uma escolha compatível com dados existentes e suporte até novembro de 2028; tags flutuantes exigem registrar a versão efetiva em cada execução de teste/implantação.
