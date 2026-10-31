# Dicionário físico do PostgreSQL — Synple

Revisão: 30/10/2026. Extraído de um schema temporário criado pelo DDL atual, incluindo ALTER TABLE e índices. Não consulta dados pessoais. Reproduzir: `node Synple/scripts/generate-data-dictionary.cjs`. Requer PostgreSQL configurado e permissão de criar/remover schema temporário.

## Convenções

Cada tabela tem finalidade, todas as colunas, nulabilidade, defaults, restrições e índices reais. “Sem CHECK” significa que o domínio citado é convenção/validação da aplicação, não garantia SQL. `timestamp with time zone` corresponde a TIMESTAMPTZ e `character varying(n)` a VARCHAR(n). FKs sem ON DELETE explícito usam NO ACTION. As restrições de regra entre várias linhas são descritas separadamente na especificação.

## Tabela `users`

Contas locais/Google, preferências e desafios de ativação/recuperação.

| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Não | `gen_random_uuid()` | Identificador do registro; UUID gerado pelo PostgreSQL, exceto onde o tipo é textual. |
| `name` | `character varying(120)` | Não | — | Nome completo; cadastro limita a 120 caracteres. |
| `email` | `character varying(150)` | Não | — | E-mail de acesso; rotas normalizam com trim e minúsculas. UNIQUE é por texto, não índice LOWER(email). |
| `phone` | `character varying(20)` | Sim | — | Telefone opcional; coluna admite 20 caracteres. Formulário aplica máscara de 10/11 dígitos. |
| `password_hash` | `character varying(255)` | Não | — | Hash bcrypt, fator 10; senha em texto não é persistida nesta tabela. |
| `google_id` | `character varying(255)` | Sim | — | Identificador sub verificado no token Google; nulo para conta sem vínculo Google. |
| `system_role` | `character varying(30)` | Não | `'USER'::character varying` | Domínio aceito pela aplicação: USER ou SYSTEM_ADMIN. O DDL não possui CHECK de domínio. |
| `theme` | `character varying(10)` | Não | `'LIGHT'::character varying` | Preferência LIGHT ou DARK; validada na atualização do perfil. O DDL não possui CHECK. |
| `reset_token` | `character varying(255)` | Sim | — | SHA-256 do código de recuperação; não é o código em texto nem token de sessão. |
| `reset_token_expires` | `timestamp with time zone` | Sim | — | Validade do desafio de recuperação; 15 minutos a partir da emissão. |
| `created_at` | `timestamp with time zone` | Não | `now()` | Instante de criação no banco; TIMESTAMPTZ representa um instante, exibido no fuso escolhido pelo cliente. |
| `updated_at` | `timestamp with time zone` | Não | `now()` | Última atualização feita pela aplicação. DEFAULT NOW() só inicializa o valor; não existe trigger geral de atualização. |
| `email_verified` | `boolean` | Não | `false` | Novas contas locais começam FALSE; código correto ou Google verificado ativa. A migração inicial preserva contas antigas como TRUE. |
| `activation_hash` | `text` | Sim | — | SHA-256 do código de ativação; apagado após uso. |
| `activation_expires` | `timestamp with time zone` | Sim | — | Validade do código de ativação; 15 minutos. |

### Restrições de users

- `users_email_key`: `UNIQUE (email)`.
- `users_google_id_key`: `UNIQUE (google_id)`.
- `users_pkey`: `PRIMARY KEY (id)`.

### Índices de users

- `idx_users_email`: `CREATE INDEX idx_users_email ON users USING btree (email)`.
- `idx_users_google_id`: `CREATE UNIQUE INDEX idx_users_google_id ON users USING btree (google_id) WHERE (google_id IS NOT NULL)`.
- `users_email_key`: `CREATE UNIQUE INDEX users_email_key ON users USING btree (email)`.
- `users_google_id_key`: `CREATE UNIQUE INDEX users_google_id_key ON users USING btree (google_id)`.
- `users_pkey`: `CREATE UNIQUE INDEX users_pkey ON users USING btree (id)`.

## Tabela `organizations`

Organizações cadastradas e proprietário atual.

| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Não | `gen_random_uuid()` | Identificador do registro; UUID gerado pelo PostgreSQL, exceto onde o tipo é textual. |
| `name` | `character varying(150)` | Não | — | Nome da organização; unicidade normalizada por LOWER(TRIM(name)). |
| `document` | `character varying(18)` | Não | — | CNPJ; criação remove pontuação e exige 14 dígitos. Índice também impede equivalentes formatados. |
| `owner_id` | `uuid` | Não | — | Proprietário atual; referência a users.id, não um cargo global. |
| `status` | `character varying(20)` | Não | `'PENDING'::character varying` | PENDING, APPROVED ou REJECTED nas rotas de situação. Coluna textual sem CHECK; valores legados não são convertidos automaticamente. |
| `created_at` | `timestamp with time zone` | Não | `now()` | Instante de criação no banco; TIMESTAMPTZ representa um instante, exibido no fuso escolhido pelo cliente. |
| `updated_at` | `timestamp with time zone` | Não | `now()` | Última atualização feita pela aplicação. DEFAULT NOW() só inicializa o valor; não existe trigger geral de atualização. |

### Restrições de organizations

- `organizations_document_key`: `UNIQUE (document)`.
- `organizations_owner_id_fkey`: `FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE`.
- `organizations_pkey`: `PRIMARY KEY (id)`.

### Índices de organizations

- `idx_organizations_owner`: `CREATE INDEX idx_organizations_owner ON organizations USING btree (owner_id)`.
- `organizations_document_key`: `CREATE UNIQUE INDEX organizations_document_key ON organizations USING btree (document)`.
- `organizations_pkey`: `CREATE UNIQUE INDEX organizations_pkey ON organizations USING btree (id)`.
- `uq_org_normalized_document`: `CREATE UNIQUE INDEX uq_org_normalized_document ON organizations USING btree (regexp_replace((document)::text, '[^0-9]'::text, ''::text, 'g'::text))`.
- `uq_org_normalized_name`: `CREATE UNIQUE INDEX uq_org_normalized_name ON organizations USING btree (lower(TRIM(BOTH FROM name)))`.

## Tabela `access_requests`

Solicitações e convites de ingresso; o mesmo par organização/pessoa tem uma linha.

| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Não | `gen_random_uuid()` | Identificador do registro; UUID gerado pelo PostgreSQL, exceto onde o tipo é textual. |
| `organization_id` | `uuid` | Não | — | Organização à qual o registro pertence; referência a organizations.id. |
| `user_id` | `uuid` | Não | — | Pessoa vinculada ao registro; referência a users.id. |
| `status` | `character varying(20)` | Não | `'PENDING'::character varying` | PENDING, APPROVED, REJECTED ou REVOKED nas rotas; sem CHECK SQL. |
| `organization_role` | `character varying(30)` | Não | `'MEMBER'::character varying` | MEMBER ou COORDINATOR na organização; não é o mesmo vínculo/cargo de commission_members. |
| `created_at` | `timestamp with time zone` | Não | `now()` | Instante de criação no banco; TIMESTAMPTZ representa um instante, exibido no fuso escolhido pelo cliente. |
| `updated_at` | `timestamp with time zone` | Não | `now()` | Última atualização feita pela aplicação. DEFAULT NOW() só inicializa o valor; não existe trigger geral de atualização. |
| `invited_by` | `uuid` | Sim | — | Autor do convite. Nulo para solicitação espontânea. FK ON DELETE SET NULL. |
| `invitation_accepted` | `boolean` | Não | `true` | Convite novo usa FALSE; aceite usa TRUE e APPROVED. Solicitações espontâneas usam o default TRUE, que não significa aprovação de acesso. |

### Restrições de access_requests

- `access_requests_invited_by_fkey`: `FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL`.
- `access_requests_organization_id_fkey`: `FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE`.
- `access_requests_pkey`: `PRIMARY KEY (id)`.
- `access_requests_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`.
- `uq_access_request_org_user`: `UNIQUE (organization_id, user_id)`.

### Índices de access_requests

- `access_requests_pkey`: `CREATE UNIQUE INDEX access_requests_pkey ON access_requests USING btree (id)`.
- `idx_access_requests_org`: `CREATE INDEX idx_access_requests_org ON access_requests USING btree (organization_id)`.
- `idx_access_requests_user`: `CREATE INDEX idx_access_requests_user ON access_requests USING btree (user_id)`.
- `uq_access_request_org_user`: `CREATE UNIQUE INDEX uq_access_request_org_user ON access_requests USING btree (organization_id, user_id)`.

## Tabela `commissions`

Comissões/grupos de uma organização.

| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Não | `gen_random_uuid()` | Identificador do registro; UUID gerado pelo PostgreSQL, exceto onde o tipo é textual. |
| `organization_id` | `uuid` | Não | — | Organização à qual o registro pertence; referência a organizations.id. |
| `name` | `character varying(120)` | Não | — | Nome da comissão; interface verifica repetição por organização. Não existe índice UNIQUE para esse nome no DDL. |
| `type` | `character varying(50)` | Não | `'Comissão'::character varying` | Categoria textual; padrão Comissão. Não há enum SQL. |
| `description` | `text` | Sim | — | Atribuições e descrição opcionais. |
| `status` | `character varying(20)` | Não | `'ACTIVE'::character varying` | ACTIVE ou INACTIVE nas rotas de edição; sem CHECK SQL. |
| `created_at` | `timestamp with time zone` | Não | `now()` | Instante de criação no banco; TIMESTAMPTZ representa um instante, exibido no fuso escolhido pelo cliente. |
| `updated_at` | `timestamp with time zone` | Não | `now()` | Última atualização feita pela aplicação. DEFAULT NOW() só inicializa o valor; não existe trigger geral de atualização. |

### Restrições de commissions

- `commissions_organization_id_fkey`: `FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE`.
- `commissions_pkey`: `PRIMARY KEY (id)`.

### Índices de commissions

- `commissions_pkey`: `CREATE UNIQUE INDEX commissions_pkey ON commissions USING btree (id)`.
- `idx_commissions_org`: `CREATE INDEX idx_commissions_org ON commissions USING btree (organization_id)`.

## Tabela `commission_members`

Associação pessoa/comissão, com cargo próprio.

| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |
| --- | --- | --- | --- | --- |
| `commission_id` | `uuid` | Não | — | Comissão à qual o registro pertence; referência a commissions.id. |
| `user_id` | `uuid` | Não | — | Pessoa vinculada ao registro; referência a users.id. |
| `role` | `character varying(20)` | Não | `'MEMBER'::character varying` | MEMBER ou COORDINATOR nas rotas. Índice parcial permite no máximo um COORDINATOR por comissão; criação/promoção/remoção controlam a existência de um coordenador. |
| `created_at` | `timestamp with time zone` | Não | `now()` | Instante de criação no banco; TIMESTAMPTZ representa um instante, exibido no fuso escolhido pelo cliente. |

### Restrições de commission_members

- `commission_members_commission_id_fkey`: `FOREIGN KEY (commission_id) REFERENCES commissions(id) ON DELETE CASCADE`.
- `commission_members_pkey`: `PRIMARY KEY (commission_id, user_id)`.
- `commission_members_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`.

### Índices de commission_members

- `commission_members_pkey`: `CREATE UNIQUE INDEX commission_members_pkey ON commission_members USING btree (commission_id, user_id)`.
- `idx_comm_members_user`: `CREATE INDEX idx_comm_members_user ON commission_members USING btree (user_id)`.
- `uq_commission_coordinator`: `CREATE UNIQUE INDEX uq_commission_coordinator ON commission_members USING btree (commission_id) WHERE ((role)::text = 'COORDINATOR'::text)`.

## Tabela `meetings`

Agendamento e pauta das reuniões de uma comissão.

| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Não | `gen_random_uuid()` | Identificador do registro; UUID gerado pelo PostgreSQL, exceto onde o tipo é textual. |
| `commission_id` | `uuid` | Não | — | Comissão à qual o registro pertence; referência a commissions.id. |
| `title` | `character varying(160)` | Não | — | Título validado na rota: não vazio, até 160 caracteres. |
| `starts_at` | `timestamp with time zone` | Não | — | Início agendado; a API exige data ISO com fuso válido. |
| `ends_at` | `timestamp with time zone` | Não | — | Término agendado, posterior ao início por CHECK SQL. |
| `agenda` | `text` | Não | — | Pauta obrigatória na rota; NOT NULL no SQL não impede texto vazio. |
| `created_by` | `uuid` | Não | — | Usuário autor; FK users.id. Produção obtém o ator da sessão. |
| `created_at` | `timestamp with time zone` | Não | `now()` | Instante de criação no banco; TIMESTAMPTZ representa um instante, exibido no fuso escolhido pelo cliente. |
| `updated_at` | `timestamp with time zone` | Não | `now()` | Última atualização feita pela aplicação. DEFAULT NOW() só inicializa o valor; não existe trigger geral de atualização. |

### Restrições de meetings

- `chk_meeting_time`: `CHECK ((ends_at > starts_at))`.
- `meetings_commission_id_fkey`: `FOREIGN KEY (commission_id) REFERENCES commissions(id) ON DELETE CASCADE`.
- `meetings_created_by_fkey`: `FOREIGN KEY (created_by) REFERENCES users(id)`.
- `meetings_pkey`: `PRIMARY KEY (id)`.

### Índices de meetings

- `idx_meetings_commission`: `CREATE INDEX idx_meetings_commission ON meetings USING btree (commission_id, starts_at)`.
- `meetings_pkey`: `CREATE UNIQUE INDEX meetings_pkey ON meetings USING btree (id)`.

## Tabela `meeting_invitations`

Convites individuais de reunião.

| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Não | `gen_random_uuid()` | Identificador do registro; UUID gerado pelo PostgreSQL, exceto onde o tipo é textual. |
| `meeting_id` | `uuid` | Não | — | Reunião à qual o registro pertence; referência a meetings.id. |
| `user_id` | `uuid` | Não | — | Pessoa vinculada ao registro; referência a users.id. |
| `status` | `character varying(20)` | Não | `'INVITED'::character varying` | INVITED, ACCEPTED ou DECLINED; domínio protegido por CHECK SQL. |
| `responded_at` | `timestamp with time zone` | Sim | — | Instante da resposta; organizador é incluído como ACCEPTED na criação. |
| `created_at` | `timestamp with time zone` | Não | `now()` | Instante de criação no banco; TIMESTAMPTZ representa um instante, exibido no fuso escolhido pelo cliente. |

### Restrições de meeting_invitations

- `meeting_invitations_meeting_id_fkey`: `FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE`.
- `meeting_invitations_pkey`: `PRIMARY KEY (id)`.
- `meeting_invitations_status_check`: `CHECK (((status)::text = ANY ((ARRAY['INVITED'::character varying, 'ACCEPTED'::character varying, 'DECLINED'::character varying])::text[])))`.
- `meeting_invitations_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`.
- `uq_meeting_invitation`: `UNIQUE (meeting_id, user_id)`.

### Índices de meeting_invitations

- `idx_meeting_invitations_user`: `CREATE INDEX idx_meeting_invitations_user ON meeting_invitations USING btree (user_id, status)`.
- `meeting_invitations_pkey`: `CREATE UNIQUE INDEX meeting_invitations_pkey ON meeting_invitations USING btree (id)`.
- `uq_meeting_invitation`: `CREATE UNIQUE INDEX uq_meeting_invitation ON meeting_invitations USING btree (meeting_id, user_id)`.

## Tabela `meeting_attendance`

Primeira entrada e saída de cada participante.

| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Não | `gen_random_uuid()` | Identificador do registro; UUID gerado pelo PostgreSQL, exceto onde o tipo é textual. |
| `meeting_id` | `uuid` | Não | — | Reunião à qual o registro pertence; referência a meetings.id. |
| `user_id` | `uuid` | Não | — | Pessoa vinculada ao registro; referência a users.id. |
| `entered_at` | `timestamp with time zone` | Sim | — | Entrada registrada pelo relógio do servidor; entrada requer convite aceito. |
| `left_at` | `timestamp with time zone` | Sim | — | Saída registrada pelo servidor; a ordem temporal é validada na rota, não por CHECK SQL. |

### Restrições de meeting_attendance

- `meeting_attendance_meeting_id_fkey`: `FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE`.
- `meeting_attendance_pkey`: `PRIMARY KEY (id)`.
- `meeting_attendance_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`.
- `uq_meeting_attendance`: `UNIQUE (meeting_id, user_id)`.

### Índices de meeting_attendance

- `idx_meeting_attendance_meeting`: `CREATE INDEX idx_meeting_attendance_meeting ON meeting_attendance USING btree (meeting_id)`.
- `meeting_attendance_pkey`: `CREATE UNIQUE INDEX meeting_attendance_pkey ON meeting_attendance USING btree (id)`.
- `uq_meeting_attendance`: `CREATE UNIQUE INDEX uq_meeting_attendance ON meeting_attendance USING btree (meeting_id, user_id)`.

## Tabela `meeting_minutes`

Conteúdo e versão atual da ata, com conjunto de aprovadores fixado na submissão.

| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Não | `gen_random_uuid()` | Identificador do registro; UUID gerado pelo PostgreSQL, exceto onde o tipo é textual. |
| `meeting_id` | `uuid` | Não | — | Reunião à qual o registro pertence; referência a meetings.id. |
| `content` | `text` | Não | — | Texto não vazio por CHECK; a rota limita a 50.000 caracteres. |
| `status` | `character varying(20)` | Não | `'DRAFT'::character varying` | DRAFT, IN_REVIEW, APPROVED ou REJECTED por CHECK. |
| `version` | `integer` | Não | `1` | Inteiro positivo; incrementado ao corrigir uma revisão/rejeição. Não há tabela de histórico completo de versões. |
| `required_approver_ids` | `uuid[]` | Não | `'{}'::uuid[]` | Array UUID dos presentes que precisam decidir na versão. Elementos não têm FK individual; integridade adicional é mantida pelas rotas. |
| `created_by` | `uuid` | Não | — | Autor inicial; FK users.id, sem cascata. |
| `updated_by` | `uuid` | Não | — | Último responsável pela alteração; FK users.id, sem cascata. |
| `submitted_at` | `timestamp with time zone` | Sim | — | Instante da submissão atual, ou nulo em rascunho. |
| `approved_at` | `timestamp with time zone` | Sim | — | Instante em que a unanimidade foi atingida, ou nulo. |
| `created_at` | `timestamp with time zone` | Não | `now()` | Instante de criação no banco; TIMESTAMPTZ representa um instante, exibido no fuso escolhido pelo cliente. |
| `updated_at` | `timestamp with time zone` | Não | `now()` | Última atualização feita pela aplicação. DEFAULT NOW() só inicializa o valor; não existe trigger geral de atualização. |

### Restrições de meeting_minutes

- `chk_minutes_reviewers`: `CHECK ((((status)::text = 'DRAFT'::text) OR (cardinality(required_approver_ids) > 0)))`.
- `meeting_minutes_content_check`: `CHECK ((length(TRIM(BOTH FROM content)) > 0))`.
- `meeting_minutes_created_by_fkey`: `FOREIGN KEY (created_by) REFERENCES users(id)`.
- `meeting_minutes_meeting_id_fkey`: `FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE`.
- `meeting_minutes_meeting_id_key`: `UNIQUE (meeting_id)`.
- `meeting_minutes_pkey`: `PRIMARY KEY (id)`.
- `meeting_minutes_status_check`: `CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'IN_REVIEW'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))`.
- `meeting_minutes_updated_by_fkey`: `FOREIGN KEY (updated_by) REFERENCES users(id)`.
- `meeting_minutes_version_check`: `CHECK ((version > 0))`.
- `uq_meeting_minutes_id_meeting`: `UNIQUE (id, meeting_id)`.

### Índices de meeting_minutes

- `meeting_minutes_meeting_id_key`: `CREATE UNIQUE INDEX meeting_minutes_meeting_id_key ON meeting_minutes USING btree (meeting_id)`.
- `meeting_minutes_pkey`: `CREATE UNIQUE INDEX meeting_minutes_pkey ON meeting_minutes USING btree (id)`.
- `uq_meeting_minutes_id_meeting`: `CREATE UNIQUE INDEX uq_meeting_minutes_id_meeting ON meeting_minutes USING btree (id, meeting_id)`.

## Tabela `meeting_minutes_approvals`

Decisão atual por pessoa/ata, vinculada à versão lida.

| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Não | `gen_random_uuid()` | Identificador do registro; UUID gerado pelo PostgreSQL, exceto onde o tipo é textual. |
| `minutes_id` | `uuid` | Não | — | Ata decidida; participa da FK composta (minutes_id, meeting_id). |
| `meeting_id` | `uuid` | Não | — | Reunião à qual o registro pertence; referência a meetings.id. |
| `user_id` | `uuid` | Não | — | Pessoa vinculada ao registro; referência a users.id. |
| `version` | `integer` | Não | — | Versão que a pessoa leu; SQL exige positivo e rota exige igualdade com a versão atual. |
| `decision` | `character varying(20)` | Não | — | APPROVED ou REJECTED por CHECK. |
| `comment` | `character varying(2000)` | Não | `''::character varying` | Comentário até 2.000 caracteres; rejeição exige texto na rota. |
| `decided_at` | `timestamp with time zone` | Não | `now()` | Instante da decisão registrado pelo servidor. |

### Restrições de meeting_minutes_approvals

- `fk_minutes_approval_meeting`: `FOREIGN KEY (minutes_id, meeting_id) REFERENCES meeting_minutes(id, meeting_id) ON DELETE CASCADE`.
- `meeting_minutes_approvals_decision_check`: `CHECK (((decision)::text = ANY ((ARRAY['APPROVED'::character varying, 'REJECTED'::character varying])::text[])))`.
- `meeting_minutes_approvals_pkey`: `PRIMARY KEY (id)`.
- `meeting_minutes_approvals_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`.
- `meeting_minutes_approvals_version_check`: `CHECK ((version > 0))`.
- `uq_minutes_approval_user`: `UNIQUE (minutes_id, user_id)`.

### Índices de meeting_minutes_approvals

- `idx_minutes_approvals_meeting`: `CREATE INDEX idx_minutes_approvals_meeting ON meeting_minutes_approvals USING btree (meeting_id)`.
- `meeting_minutes_approvals_pkey`: `CREATE UNIQUE INDEX meeting_minutes_approvals_pkey ON meeting_minutes_approvals USING btree (id)`.
- `uq_minutes_approval_user`: `CREATE UNIQUE INDEX uq_minutes_approval_user ON meeting_minutes_approvals USING btree (minutes_id, user_id)`.

## Tabela `system_subsystems`

Tabela legada de estados de subsistemas; não comprova disponibilidade real.

| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |
| --- | --- | --- | --- | --- |
| `id` | `character varying(50)` | Não | — | Chave textual do subsistema. |
| `name` | `character varying(100)` | Não | — | Nome descritivo. |
| `status` | `character varying(20)` | Não | `'ONLINE'::character varying` | Estado textual legado, padrão ONLINE; não usar como prova de serviço ativo. |
| `last_check` | `timestamp with time zone` | Não | `now()` | Instante salvo no registro; sem monitor ativo associado a esta tabela. |

### Restrições de system_subsystems

- `system_subsystems_pkey`: `PRIMARY KEY (id)`.

### Índices de system_subsystems

- `system_subsystems_pkey`: `CREATE UNIQUE INDEX system_subsystems_pkey ON system_subsystems USING btree (id)`.

## Tabela `auth_sessions`

Sessões opacas emitidas após autenticação.

| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |
| --- | --- | --- | --- | --- |
| `token_hash` | `text` | Não | — | SHA-256 de token aleatório de 32 bytes. PK; o token bruto só é devolvido ao cliente. |
| `user_id` | `uuid` | Não | — | Pessoa vinculada ao registro; referência a users.id. |
| `expires_at` | `timestamp with time zone` | Não | — | Sessão válida por sete dias; conferida a cada requisição privada. |

### Restrições de auth_sessions

- `auth_sessions_pkey`: `PRIMARY KEY (token_hash)`.
- `auth_sessions_user_id_fkey`: `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`.

### Índices de auth_sessions

- `auth_sessions_pkey`: `CREATE UNIQUE INDEX auth_sessions_pkey ON auth_sessions USING btree (token_hash)`.
- `idx_auth_sessions_user`: `CREATE INDEX idx_auth_sessions_user ON auth_sessions USING btree (user_id)`.

## Tabela `auth_rate_limits`

Contadores persistentes de limitação por endpoint/IP e, quando fornecido, e-mail.

| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |
| --- | --- | --- | --- | --- |
| `key` | `text` | Não | — | SHA-256 da chave de limitação; PK. |
| `attempts` | `integer` | Não | — | Quantidade de tentativas na janela; incrementada por UPSERT atômico. |
| `expires_at` | `timestamp with time zone` | Não | — | Fim da janela de 900 segundos; a primeira tentativa posterior reinicia o contador. |

### Restrições de auth_rate_limits

- `auth_rate_limits_pkey`: `PRIMARY KEY (key)`.

### Índices de auth_rate_limits

- `auth_rate_limits_pkey`: `CREATE UNIQUE INDEX auth_rate_limits_pkey ON auth_rate_limits USING btree (key)`.

## Tabela `system_metadata`

Marco de inicialização da instalação.

| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |
| --- | --- | --- | --- | --- |
| `id` | `boolean` | Não | `true` | Booleano TRUE, PK e CHECK(id). Impede mais de uma linha, mas SQL isolado não impede tabela vazia. |
| `initialized_at` | `timestamp with time zone` | Não | `now()` | Instante da primeira aplicação desta migração. Não recupera uma data histórica desconhecida de instalação antiga. |

### Restrições de system_metadata

- `system_metadata_id_check`: `CHECK (id)`.
- `system_metadata_pkey`: `PRIMARY KEY (id)`.

### Índices de system_metadata

- `system_metadata_pkey`: `CREATE UNIQUE INDEX system_metadata_pkey ON system_metadata USING btree (id)`.

## Tabela `download_tickets`

Autorização curta para abrir PDF em navegador sem expor o Bearer token.

| Coluna | Tipo SQL | Aceita NULL | Default | Significado/domínio |
| --- | --- | --- | --- | --- |
| `token_hash` | `text` | Não | — | SHA-256 do ticket aleatório; PK. |
| `session_hash` | `text` | Não | — | Sessão à qual o ticket pertence; FK auth_sessions.token_hash com cascata. |
| `path` | `text` | Não | — | Caminho de uma rota de PDF, conferido na autenticação do ticket. |
| `expires_at` | `timestamp with time zone` | Não | — | Validade de 60 segundos. Ticket não é de uso único; pode ser reutilizado na mesma rota até expirar/revogar a sessão. |

### Restrições de download_tickets

- `download_tickets_pkey`: `PRIMARY KEY (token_hash)`.
- `download_tickets_session_hash_fkey`: `FOREIGN KEY (session_hash) REFERENCES auth_sessions(token_hash) ON DELETE CASCADE`.

### Índices de download_tickets

- `download_tickets_pkey`: `CREATE UNIQUE INDEX download_tickets_pkey ON download_tickets USING btree (token_hash)`.

## Limites e integridade entre camadas

- Não existem triggers gerais de updated_at. Rotas precisam atualizar o campo explicitamente.
- E-mail é normalizado nas rotas, mas UNIQUE(email) não equivale a UNIQUE(LOWER(email)).
- Não existe UNIQUE de nome de comissão por organização. A interface faz uma verificação; não é garantia concorrente do banco.
- O índice parcial de coordenador garante no máximo um. O mínimo de um depende das operações transacionais e da migração que atribui o proprietário quando não há coordenador.
- O array required_approver_ids não tem FKs por elemento. Regras de versão, presença, unanimidade e preservação de aprovadores são implementadas nas rotas.
- Ordem entrada/saída é validada na API; meeting_attendance não tem CHECK temporal.
- Expiração de códigos, sessões, limites e tickets é conferida pela aplicação; registros expirados não somem apenas por terem expires_at.
- Exclusões seguem as FKs reais listadas. Excluir organização pode apagar comissões, reuniões e registros em cascata; não documentar uma proteção histórica geral que a rota não implementa.
- O comentário de cabeçalho do DDL cita PostgreSQL 12+, mas a configuração suportada/testada pelo projeto é PostgreSQL 16; esse comentário não certifica compatibilidade com outras versões.
