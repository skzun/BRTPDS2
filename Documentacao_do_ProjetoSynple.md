# Documentação do Projeto: Synple

## 1. Introdução e Motivação
O Synple é um aplicativo mobile nativo (Android e iOS) para gerenciamento e agendamento de reuniões. A motivação central do projeto é oferecer uma alternativa de código aberto (open-source) e totalmente gratuita (com custo zero de operação para o cliente final) aos gigantes do mercado. O sistema visa combater a complexidade de implantação de outras ferramentas de código aberto, entregando uma interface extremamente simples, fluida e amigável, permitindo o agendamento de encontros sem atritos.

## 2. Identidade Visual (Nome, Logotipo e Padrões)

### Nome e Conceito
* **Nome:** Synple
* **Significado:** Fusão de Synchronization (Sincronia) e People (Pessoas). Em português, a sonoridade remete à palavra "Simples", traduzindo o principal pilar do sistema.

### Logotipo
* **Símbolo:** Baseado no conceito de um Diagrama de Venn. Dois círculos minimalistas sobrepostos representam pessoas ou agendas distintas. A área de interseção (o ponto de encontro) forma um "S" estilizado.
* **Estilo:** Flat design geométrico, garantindo nitidez como ícone de aplicativo em qualquer smartphone.

<img width="1408" height="768" alt="Logo Synple" src="https://github.com/user-attachments/assets/03dcbf86-091f-4ae7-b668-537463db0563" />


### Paleta de Cores
* **Cor Primária (Sincronia/Confiança):** Azul Índigo (`#4F46E5`) - Usada na navegação, botões de ação e identidade.
* **Cor Secundária/Acento (Ação/Disponibilidade):** Verde Menta (`#10B981`) - Usada em ícones de sucesso, toggles e botões de nova reunião.
* **Cor de Fundo (Simplicidade):** Branco Gelo (`#F8FAFC`) - Fundo das telas, reduzindo o cansaço visual.
* **Cor de Texto (Leitura):** Cinza Carvão (`#1E293B`) - Textos principais e títulos.

### Tipografia
* **Títulos e Destaques:** Poppins (Moderna, arredondada e amigável).
* **Corpo de Texto e Interface:** Inter ou Roboto (Garante alta legibilidade em telas pequenas e leitura de horários).

## 3. Arquitetura e Tecnologias Utilizadas

A arquitetura foi desenhada para garantir o cumprimento do requisito "custo zero", utilizando tecnologias de ponta, 100% gratuitas e open-source. O aplicativo é desenvolvido com Expo para uso durante o desenvolvimento no Expo Go.

### Frontend - Mobile (React Native)
| Categoria | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **Framework** | Expo (React Native) | Simplifica a configuração e o build cross-platform (iOS/Android). |
| **Linguagem** | JavaScript | Linguagem padrão, flexível e de rápida prototipação. |
| **Navegação** | React Navigation 7.x | Padrão da comunidade. |
| **UI Components** | React Native Paper | Aceleração de desenvolvimento (Material Design 3). |
| **Calendário** | react-native-calendars | Visualização nativa de agendas. |
| **Armazenamento Local** | react-native-mmkv | Banco chave-valor ultrarrápido para armazenamento local. |

### Backend - API (Node.js)
| Categoria | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **Runtime & Framework** | Node.js 22 LTS + Express.js 5 | API REST robusta e minimalista. |
| **Banco de Dados & ORM** | PostgreSQL + Sequelize | Relacional, excelente com fusos horários e fácil integração via JavaScript. |
| **Autenticação** | Lucia Auth | Gestão de sessões moderna baseada em tokens. |
| **Validação** | Zod | Schema validation compartilhado com o frontend. |

### Infraestrutura e Servidor (Custo Zero)
* **Ambiente:** Docker com Docker Compose, orquestrando a aplicação backend e o banco de dados de forma isolada e padronizada.
* **Exposição para Internet:** Cloudflare Tunnel para gerar um link HTTPS apontando para o ambiente Docker local, zerando os custos de hospedagem em nuvem durante o desenvolvimento e avaliação.

## 4. Padrões de Interface (UI/UX)
O aplicativo aplica a filosofia de Clean Design, reduzindo a carga cognitiva:

* **Navegação Principal (Bottom Tabs):** Quatro abas (Início, Calendário, Nova Reunião, Perfil). O ícone ativo destaca-se em Azul Índigo.
* **Tela de Cadastro/Login:** Fundo Branco Gelo, logotipo centralizado e botão primário ("Entrar") em Azul Índigo com texto branco.
* **Dashboard (Início):** Cartões (cards) resumindo as próximas reuniões. Um botão flutuante (FAB) no canto inferior direito em Verde Menta para criação rápida de eventos.
* **Agendamento (Calendário):** Uso de blocos de botões para horários. Horários livres selecionados ficam em Azul Índigo; horários conflitantes assumem tom cinza inativo.
* **Feedback:** Mensagens de sucesso com ícones Verde Menta; erros utilizando cores quentes suaves (laranja/vermelho claro) para não gerar ansiedade no usuário.

## 5. Padrões de Nomenclatura e Boas Práticas de Código
As “regras" para o desenvolvimento e versionamento são:

* **Variáveis e Funções:** `camelCase` (ex: `formatDate`, `getMeetings`).
* **Componentes React / Telas:** `PascalCase`. Telas devem conter o sufixo apropriado (ex: `MeetingCard.jsx`, `LoginScreen.jsx`).
* **Constantes Globais:** `UPPER_SNAKE_CASE` (ex: `API_BASE_URL`).
* **Arquivos Utilitários:** `kebab-case` (ex: `date-utils.js`).
* **Versionamento (Git):** Uso obrigatório do padrão Conventional Commits (ex: `feat: adiciona componente de calendário`, `fix: corrige fuso horário`).

## 6. Proposta de Testes e Documentação
A estabilidade do sistema será comprovada através de automação e relatórios:

* **Testes Unitários:** Utilização do Vitest para testar lógicas de negócios, validadores (Zod) e utilitários de fuso horário, garantindo que as regras funcionem de forma isolada.
* **Testes de Integração:** Uso do Supertest no Backend para simular chamadas HTTP e validar as operações de leitura e escrita no PostgreSQL.
* **Testes de Componentes:** Uso da React Native Testing Library no Frontend para garantir a renderização correta de botões e fluxos vitais.
* **Documentação dos Resultados:** A cobertura de código (coverage) gerada pelas ferramentas será exportada em formato HTML/texto e consolidada na pasta `/docs` do repositório, servindo como evidência das validações realizadas durante o ciclo de desenvolvimento.

## 7. Requisitos Não Funcionais
* **Usabilidade:** O aplicativo adota a "Regra dos 3 Cliques": o fluxo principal de iniciar o agendamento de uma reunião não deve exigir mais que três interações a partir do Dashboard.
* **Segurança:** Utilização do Lucia Auth para gestão de tokens criptografados. Senhas devem ser "hasheadas" no PostgreSQL (ex: Argon2/Bcrypt) e tokens de sessão no celular protegidos via biblioteca MMKV, impedindo vazamentos locais.
* **Disponibilidade:** Adoção de uma estratégia Offline-First parcial (leitura). Utilizando o armazenamento local, o usuário poderá visualizar sua agenda atualizada mesmo quando estiver momentaneamente sem internet.
* **Desempenho:** Tempo de abertura inicial (cold start) do aplicativo inferior a 2 segundos na maioria dos dispositivos intermediários.
* **Gratuidade e Licenciamento:** Todo o ecossistema foi pensado para exigir recursos de máquina local e ferramentas abertas (Open Source / MIT), isentando tanto os desenvolvedores quanto os clientes de mensalidades de servidor, serviços de terceiros ou custos de publicação nas lojas de aplicativos, conforme os requisitos acadêmicos.
