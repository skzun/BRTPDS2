# Documento de Análise de Mercado

**Projeto:** Aplicativo Mobile de Gerenciamento de Reuniões  
**Licença/Modelo:** Open-source e Custo Zero para o Cliente Final  
**Plataformas:** Android e iOS  

## 1. Visão Geral e Objetivos

O objetivo desta análise de mercado é mapear e avaliar as principais soluções de gerenciamento e agendamento de reuniões disponíveis atualmente. A partir da identificação dos pontos fortes, limitações técnicas e falhas de usabilidade dessas ferramentas, estabelece-se a base funcional e estratégica para o desenvolvimento do nosso aplicativo mobile nativo, focado em simplicidade, gratuidade e custo zero de infraestrutura.

## 2. Avaliação dos Softwares Equivalentes no Mercado

### Cal.com
* **Descrição:** Plataforma de código aberto (open-source) focada em infraestrutura e automação de agendamentos.
* **Pontos Fortes:**
  * Transparência total do código (TypeScript/Next.js), permitindo auditoria e self-hosting.
  * Arquitetura API-first, facilitando integrações com Google Calendar, Outlook e ferramentas de videoconferência.
  * Suporte a regras avançadas de disponibilidade e buffers (intervalos entre reuniões).
* **Pontos Fracos:**
  * A implantação da versão self-hosted exige conhecimentos avançados de infraestrutura (Docker, bancos de dados, chaves de API).
  * Painel administrativo complexo, o que pode gerar sobrecarga cognitiva para usuários leigos.
  * Foco primário na experiência Web, com pouca otimização nativa para dispositivos móveis.

### Calendly
* **Descrição:** Líder de mercado em automação de agendamentos e reuniões individuais (1-on-1) e corporativas.
* **Pontos Fortes:**
  * Interface (UI/UX) extremamente limpa, fluida e intuitiva, garantindo atrito próximo de zero para o convidado.
  * Algoritmo preciso de detecção e conversão automática de fusos horários.
  * Sincronização em tempo real com calendários de terceiros para evitar marcações duplicadas (overbooking).
* **Pontos Fracos:**
  * Código proprietário e modelo altamente comercial, onde funcionalidades essenciais são bloqueadas por assinaturas pagas.
  * Dependência de servidores proprietários na nuvem, retendo histórico e dados dos usuários.
  * Pouca flexibilidade para personalização profunda do fluxo por parte dos desenvolvedores.

### Doodle
* **Descrição:** Ferramenta voltada para o agendamento de reuniões em grupo por meio de votação/enquetes de horários.
* **Pontos Fortes:**
  * Resolução eficiente do problema de conflito de horários em grupos sem exigir cadastro prévio de todos os participantes.
  * Visualização gráfica simples das escolhas dos votantes.
* **Pontos Fracos:**
  * A versão gratuita possui excesso de anúncios e poluição visual.
  * A exibição de matrizes/tabelas de votação em telas de smartphones resulta em uma navegação horizontal incômoda no mobile.
  * Exige confirmação e encerramento manual por parte do organizador para agendar o evento definitivo.

### Rallly / EasyAppointments
* **Descrição:** Soluções open-source leves focadas em agendamentos simples e marcação de horários de atendimento.
* **Pontos Fortes:**
  * Código aberto e custo zero de licenciamento.
  * Proposta direta e focada exclusivamente no agendamento essencial.
* **Pontos Fracos:**
  * Ausência de aplicativo móvel nativo (funcionam apenas como aplicações web adaptadas).
  * Recursos limitados de notificação nativa (push notifications) no celular sem custos adicionais de serviços de terceiros.

## 3. Matriz Comparativa de Mercado

| Software | Modelo de Licença | Plataforma Foco | Pontos Fortes Principais | Principais Limitações |
| :--- | :--- | :--- | :--- | :--- |
| **Cal.com** | Open-Source / Freemium | Web | Flexibilidade, APIs, código aberto | Configuração complexa no self-host |
| **Calendly** | Proprietário / Pago | Web / Mobile App | UX impecável, facilidade de uso | Custos elevados, código fechado |
| **Doodle** | Proprietário / Freemium | Web / Mobile | Votação em grupo eficiente | Interface poluída e ruim no mobile |
| **Rallly** | Open-Source / Gratuito | Web | Simplicidade, foco em consenso | Sem aplicativo móvel nativo |
| **Nosso App** | Open-Source / Custo Zero | Mobile (Android/iOS) | UX mobile limpa, integração local, 100% gratuito | Em fase de definição de arquitetura |

## 4. Oportunidades e Diferenciais para o Synple

A análise das soluções avaliadas evidencia uma oportunidade para desenvolver uma solução que combine simplicidade de uso, experiência mobile, código aberto, privacidade e infraestrutura própria.
A proposta do Synple será baseada nos seguintes diferenciais:

### 4.1 Mobile-first multiplataforma
O Synple será desenvolvido especificamente para dispositivos móveis utilizando React Native CLI, com suporte a Android e iOS.
A interface será projetada considerando as características de telas menores, navegação por toque e utilização rápida durante a rotina do usuário.

### 4.2 Open-source e infraestrutura própria
O sistema será disponibilizado como software open-source e poderá ser executado em infraestrutura própria.
O backend será hospedado em servidor controlado pelo responsável pela implantação, utilizando tecnologias open-source como PostgreSQL, Redis, MinIO, Node.js e Nginx.
Dessa forma, o projeto não dependerá de serviços proprietários de nuvem para seu funcionamento básico.

### 4.3 Arquitetura offline-first
O aplicativo utilizará armazenamento local para manter os dados necessários ao funcionamento do sistema mesmo quando não houver conexão com a Internet.
As alterações realizadas offline serão armazenadas localmente e posteriormente sincronizadas com o servidor quando a conectividade estiver disponível.
Essa abordagem busca proporcionar maior continuidade de uso e reduzir a dependência de conectividade constante.

### 4.4 Comunicação integrada
Além do gerenciamento de reuniões e disponibilidade dos participantes, o Synple terá um chat associado às reuniões.
Dessa forma, informações relacionadas à organização de uma reunião poderão permanecer concentradas no próprio contexto do evento, reduzindo a necessidade de utilizar diferentes ferramentas para organizar e conversar sobre a mesma reunião.

### 4.5 Interface simples e sem anúncios
A interface será desenvolvida com foco em simplicidade, legibilidade e redução da quantidade de etapas necessárias para realizar as principais tarefas.
O aplicativo não terá anúncios como modelo de monetização, mantendo a experiência de utilização livre de publicidade.

### 4.6 Privacidade e segurança
A arquitetura será desenvolvida seguindo princípios de privacidade e segurança desde a concepção do sistema.
Entre as medidas previstas estão:

* Comunicação entre cliente e servidor protegida por HTTPS/TLS;
* Autenticação e controle de acesso;
* Validação dos dados recebidos pelo servidor;
* Armazenamento local dos dados necessários ao funcionamento offline;
* Controle de acesso aos dados das reuniões;
* Utilização de infraestrutura própria;
* Aplicação de práticas de segurança no servidor.

O armazenamento local, isoladamente, não garante conformidade com a LGPD. Os requisitos relacionados à proteção de dados deverão ser considerados durante as demais etapas de análise, desenvolvimento e implantação.
