# Padrões de desenvolvimento usados no dia a dia

1. Antes de implementar, relacionar o comportamento a requisito, regra, ator e critério de aceite. Decisão não validada com a comunidade fica explicitamente marcada.
2. Todo dado externo é validado no servidor. Nunca confiar em `userId`, papel, estado ou preço/contador informado pelo cliente. Identidade é obtida da sessão.
3. Usar SQL parametrizado. Operações com mais de uma escrita dependente usam transação, rollback e `finally` para liberar conexão. Regras concorrentes exigem lock e restrição no banco.
4. O aplicativo só informa sucesso após resposta positiva da API. Timeout não vira cadastro offline. Dados do cache nunca substituem autorização ou senha.
5. Tokens ficam em memória/SecureStore; nunca em AsyncStorage, logs, URL de sessão ou arquivo versionado. Download externo usa ticket curto e restrito.
6. Mensagem de erro informa o que falhou e o que o usuário pode fazer. Exceções SQL e configurações privadas ficam fora da resposta pública. Logs não incluem senhas, códigos ou tokens.
7. Componentes de campo usam entrada nativa não controlada; alterações externas de valor, máscaras e reset são sincronizados por ref. Testar cursor/teclado ao mudar esse contrato.
8. Toda escrita tem estado de envio e bloqueio contra toque repetido quando necessário. Atualização otimista só é aceita com rollback implementado; nos fluxos atuais, preferir confirmação e sincronização.
9. Acesso, conflito, ausência e falha interna usam respectivamente HTTP 403, 409, 404 e 500; sessão ausente/expirada usa 401 e limite excedido usa 429.
10. Cobrir casos válidos, inválidos, negados e concorrentes relevantes. Teste de banco usa schema isolado e dados fictícios; envio de e-mail é simulado. Não usar contas reais em testes.
11. Revisar migrações para preservar dados/senhas. Nunca executar seed como parte do boot normal. Seed de demonstração é uma ação explícita.
12. Conferir tema claro/escuro, leitura de tela, alvo de toque, teclado, nomes longos e falha de rede antes de entregar mudança de interface.
13. Registrar no PR problema, comportamento final, validação executada e limites reais. Conventional Commits e nomes camelCase/PascalCase complementam essas regras.

Comandos: `npm --prefix mobile test`, `npm --prefix backend test`, e `npx expo export --platform android --platform ios --platform web` dentro de `mobile`. Exportar JavaScript não substitui testar APK/IPA.
