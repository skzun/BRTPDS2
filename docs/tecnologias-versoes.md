# Tecnologias e versões — Synple

Revisão: 06/11/2026. Faixas vêm dos manifests; versões resolvidas vêm dos lockfiles versionados. Não representam prova de instalação em outro PC ou de build publicado.

## mobile

| Dependência direta | Faixa declarada | Resolvida no lockfile | Uso |
| --- | --- | --- | --- |
| `@react-native-async-storage/async-storage` | `2.2.0` | `2.2.0` | Aplicação |
| `@react-native-google-signin/google-signin` | `^16.1.5` | `16.2.0` | Aplicação |
| `expo` | `^58.0.23` | `58.0.23` | Aplicação |
| `expo-auth-session` | `~58.0.17` | `58.0.17` | Aplicação |
| `expo-build-properties` | `~58.0.12` | `58.0.12` | Aplicação |
| `expo-dev-client` | `~58.0.18` | `58.0.18` | Aplicação |
| `expo-local-authentication` | `~58.0.2` | `58.0.2` | Aplicação |
| `expo-secure-store` | `~58.0.2` | `58.0.2` | Aplicação |
| `expo-splash-screen` | `~58.0.13` | `58.0.13` | Aplicação |
| `expo-status-bar` | `~58.0.4` | `58.0.4` | Aplicação |
| `expo-web-browser` | `~58.0.7` | `58.0.7` | Aplicação |
| `react` | `^19.3.0` | `19.3.0` | Aplicação |
| `react-dom` | `^19.3.0` | `19.3.0` | Aplicação |
| `react-native` | `^0.88.0` | `0.88.0` | Aplicação |
| `react-native-safe-area-context` | `~5.11.1` | `5.11.1` | Aplicação |
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
| Node.js | Mínimo 22.13; imagem backend node:22-alpine (tag flutuante, patch não fixado) | README, Dockerfile e compatibilidade Expo SDK 58 |
| Android | 7.0/API 24 ou superior | app.json, expo-build-properties.minSdkVersion=24 |
| iOS | 16.4 ou superior | app.json, deploymentTarget=16.4 |
| PostgreSQL | Imagem postgres:16-alpine; versão menor não fixada | Ambos os docker-compose.yml |
| Docker Compose | 2.24+ para env_file opcional | README e configuração Compose |
| JavaScript | Código mobile/backend; não há TypeScript no código da aplicação | Arquivos .js/.cjs |
| Testes | node:test incluído no Node.js | Scripts npm test |
| Cloudflared | Executável externo; versão não fixada pelo repositório | iniciar.ps1 e scripts/dev-tunnel.js |
| EAS CLI | Comandos com latest; versão efetiva depende da execução | README e eas.json |

Não há Sequelize, Lucia Auth, JWT de sessão, WatermelonDB, Redis, MinIO, TanStack Query, Zustand, React Native Paper ou React Navigation nas dependências atuais. Não confundir ID token Google com o token opaco de sessão do Synple.

Referências: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [upgrade Expo](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/), [ciclo PostgreSQL](https://www.postgresql.org/support/versioning/). SDK 58 usa React Native 0.88, React 19.3 e Node 22.13 ou superior. As faixas do manifesto e versões do lockfile foram alinhadas às recomendações oficiais consultadas em 06/11/2026. PostgreSQL 16 permanece para compatibilidade com os dados existentes.
