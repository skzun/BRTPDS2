> Registro histórico, anterior às correções atuais. Para o estado verificado, consulte [Entrega do incremento 3](../../docs/ENTREGA_INCREMENTO_3.md).

# Verificação das correções — 30/10/2026

## Executado nesta revisão

- Backend: `npm test`, **35 testes aprovados**, zero falhas/ignorados. Novos testes usam HTTP real, PostgreSQL em schema temporário e envio de e-mail simulado; não enviam mensagens reais.
- Mobile: `npm test`, **23 testes aprovados**, zero falhas/ignorados, incluindo limpeza de credenciais do cache.
- Exportação JavaScript/Hermes para Android, iOS e Web com `npx expo export --platform android --platform ios --platform web`. Não equivale a gerar/instalar APK ou IPA.
- Configuração nativa: `npx expo config --type prebuild --json` processada sem erro após instalar SecureStore, LocalAuthentication e BuildProperties.
- Migração aplicada ao banco local com `npm run migrate`; dados e hashes de senha preservados. A suíte também verifica reaplicação idempotente em schema isolado.
- Compose da raiz validado por `docker compose config --quiet`; script PowerShell conferido pelo parser. Não foi executada uma inicialização completa do Docker/túneis neste ambiente durante a revisão.
- Inspeção de referências de JavaScript com `node scripts/check-source.cjs`: nenhuma referência livre inesperada no aplicativo.

Os testes de segurança cobrem acesso anônimo, rejeição da antiga senha alternativa, token armazenado como hash, tentativa de editar outra conta, restrição administrativa, ativação e uso único de código, expiração, falha de SMTP sem criar conta, sincronização filtrada, data estável, unicidade normalizada, transferência real de proprietário, criação transacional de comissão, aceite de convite pelo destinatário, ticket de PDF restrito à rota, limitação de tentativas e revogação no logout.

## Dependências

Aplicadas atualizações compatíveis com `npm audit fix --ignore-scripts`.

- Backend: auditoria terminou com zero vulnerabilidades conhecidas no momento da execução.
- Mobile: restam **11 alertas** (6 baixos, 2 moderados e 3 altos), envolvendo deepmerge/configuração do Expo, zod/CLI e uuid usado pelo ngrok. O npm sugere downgrade incompatível do Expo para parte deles e não fornece correção para a cadeia ngrok/uuid. Não foi aplicado `--force` nem uma troca de SDK sem migração. Esses alertas exigem acompanhamento dos mantenedores e análise específica antes de publicação; os testes funcionais não comprovam ausência de vulnerabilidades.

## Não executado / não comprovado

- Novo APK/IPA instalado em aparelhos físicos, ícone no launcher, teclado, biometria e autenticação Google com credenciais reais.
- Envio real de e-mail de ativação/recuperação.
- Avaliação manual de concorrentes e entrevistas/validação com a comunidade.
- Medições de desempenho, acessibilidade em aparelhos, avaliação subjetiva da interface e revisão de implantação de produção.

Executar o roteiro de [CORRECOES_AVALIACAO.md](CORRECOES_AVALIACAO.md), preenchendo evidências reais. O relatório anterior de incremento 2 é histórico; a contagem acima corresponde à revisão atual.
