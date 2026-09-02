# Incremento 1 — Organizações e usuários

## Objetivo

Entregar, no aplicativo mobile Synple, o ciclo inicial de cadastro e controle de acesso: organizações entram em análise pelo administrador do sistema; usuários criam conta e solicitam entrada em uma organização; o administrador organizacional decide a solicitação.

## Requisitos funcionais implementados

| ID | Requisito | Implementação no aplicativo |
| --- | --- | --- |
| RF01 | Cadastrar organização | Formulário com nome e CNPJ; a organização inicia com estado `PENDING`. |
| RF02 | Autorizar ou rejeitar organização | Visão **Sistema** exibe ações para registros pendentes. |
| RF03 | Revogar organização autorizada | Visão **Sistema** permite revogar uma organização aprovada. |
| RF04 | Gerenciar organizações | Listagem mostra nome, CNPJ e situação de cada registro. |
| RF05 | Cadastrar usuário | Formulário com nome e e-mail, com bloqueio de e-mails repetidos. |
| RF06 | Solicitar acesso | Usuário ativo escolhe uma organização aprovada e cria solicitação pendente. |
| RF07 | Aprovar ou rejeitar solicitação | Visão **Organização** lista solicitações pendentes e disponibiliza as decisões. |
| RF08 | Gerenciar usuários da organização | Acessos aprovados são mostrados na área de usuários da organização. |
| RF09 | Cadastrar comissão | Administrador escolhe a organização, informa nome e descrição e cria o grupo de trabalho. |
| RF10 | Gerenciar comissões | A lista permite selecionar e excluir comissões da organização. |
| RF11 | Gerenciar equipe da comissão | Membros da organização podem ser incluídos ou removidos da comissão selecionada. |
| RF12 | Alterar dados pessoais | Usuário ativo altera nome, e-mail e telefone. |
| RF13 | Trocar senha | Tela valida nova senha e confirmação antes de registrar a alteração local de demonstração. |
| RF14 | Recuperar conta | Solicitação de recuperação é registrada e informa o e-mail de destino. |
| RF15 | Definir tema | Preferência claro/escuro é persistida por usuário. |
| RF16 | Consultar status operacional | Painel mostra API, banco de dados e notificações como subsistemas. |
| RF17 | Reinicializar subsistema | Administrador pode iniciar a reinicialização individual de cada subsistema. |
| RF18 | Consultar relatórios | Painel consolida quantidades de usuários, organizações, comissões e acessos pendentes. |
| RF19 | Setup e reset do sistema | Painel executa setup inicial e permite resetar dados locais na visão de Sistema. |

## Regras de negócio

1. Nome e CNPJ são obrigatórios para a organização, e o CNPJ não pode ser repetido.
2. Toda organização nova possui o estado `PENDING`; apenas o administrador do sistema pode alterá-la para `APPROVED`, `REJECTED` ou `REVOKED`.
3. Nome e e-mail são obrigatórios para criar uma conta; o e-mail deve conter `@` e ser único.
4. Apenas organizações `APPROVED` aparecem como destino de uma solicitação de acesso.
5. Um usuário não pode ter duas solicitações ativas para a mesma organização.
6. O administrador da organização pode aprovar ou rejeitar solicitações pendentes; somente solicitações aprovadas compõem a lista de membros.
7. Uma comissão pertence a uma única organização e seu nome deve ser único nessa organização.
8. Somente membros da organização podem ser incluídos na equipe de uma comissão; a mesma pessoa não pode ser incluída duas vezes.
9. O e-mail pessoal permanece único após uma alteração de perfil.
10. A nova senha precisa ter pelo menos seis caracteres e ser igual à confirmação. Nesta entrega, a alteração é simulada localmente; a proteção real será feita no backend com Bcrypt.
11. A recuperação de conta não envia e-mail nesta etapa: ela registra a solicitação localmente. O envio real depende da integração do serviço de autenticação.

## Escopo técnico desta entrega

O cliente está em `Synple/mobile`, construído em **JavaScript com Expo (React Native)** e executável pelo Expo Go. O estado é persistido no aparelho com `@react-native-async-storage/async-storage`, permitindo demonstrar o fluxo sem backend.

## Identidade visual aplicada

O aplicativo utiliza o símbolo de dois círculos sobrepostos com um **S** central, conforme a identidade do Synple. A tela de abertura mostra a marca em fundo branco-gelo, e o ícone do aplicativo para instalação utiliza a versão em bloco índigo. A paleta foi aplicada no cabeçalho, botões e seleções: índigo `#4B43CF`, branco-gelo `#F7F8FC`, cinza de leitura `#64748B` e verde menta para confirmações.

As três visões de demonstração (Sistema, Organização e Usuário) representam papéis que, na integração completa, serão fornecidos pela autenticação e pelas permissões do backend. Nesta etapa elas foram mantidas no mesmo dispositivo para permitir a avaliação de todos os requisitos funcionais.

## Dados persistidos

O aplicativo armazena localmente, na chave `@synple:incremento-1`, as coleções:

- `organizations`: `id`, `name`, `document`, `ownerId`, `status`;
- `users`: `id`, `name`, `email`;
- `accessRequests`: `id`, `organizationId`, `userId`, `status`.
- `commissions`: `id`, `organizationId`, `name`, `description`, `status`;
- `commissionMembers`: associação entre comissão e usuário;
- `system`: estado de inicialização e situação dos subsistemas;
- preferências e informações pessoais associadas a cada registro de `users`.

Há dois registros de demonstração, incluindo uma organização e uma solicitação pendentes. O botão **Restaurar dados de demonstração** apaga apenas o conteúdo local desta etapa e recarrega esses registros.

## Como executar

```bash
cd Synple/mobile
npm install
npm start
```

Em seguida, leia o QR Code pelo Expo Go. Este projeto utiliza **Expo SDK 54**, compatível com o Expo Go que suporta SDK 54. Para testar fora da mesma rede, execute `npx expo start --tunnel --clear`.

Para avaliar rapidamente: abra **Organizações** e selecione a visão **Sistema** para autorizar o Coletivo Horizonte; em **Usuários**, cadastre ou selecione um usuário; em **Acessos**, envie uma solicitação e mude para a visão **Organização** para aprová-la. Em **Comissões**, crie o grupo de trabalho e defina sua equipe. Em **Perfil**, teste atualização de dados, senha, recuperação e tema. Em **Sistema**, consulte o relatório e simule o reinício de subsistemas.

## Próxima integração

O armazenamento local será substituído/espelhado por API Express e PostgreSQL. A autorização dos papéis passará a ser aplicada no servidor, com senhas protegidas por Bcrypt, sessões gerenciadas por Lucia Auth e validações Zod, conforme a arquitetura atualizada do projeto.
