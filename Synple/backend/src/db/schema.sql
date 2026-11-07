-- ============================================================================
-- SCRIPT DDL: ESQUEMA OFICIAL DE BANCO DE DADOS POSTGRESQL (SYNPLE)
-- Compatível com PostgreSQL 12+ (utiliza gen_random_uuid() nativo)
-- ============================================================================

-- 1. Tabela: users (Usuários da plataforma)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    system_role VARCHAR(30) NOT NULL DEFAULT 'USER',
    theme VARCHAR(10) NOT NULL DEFAULT 'LIGHT',
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrações automáticas para colunas de recuperação de senha em bancos existentes
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- 2. Tabela: organizations (Organizações / Empresas / Coletivos)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    document VARCHAR(18) NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela: access_requests (Solicitações de Acesso a Organizações)
CREATE TABLE IF NOT EXISTS access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    organization_role VARCHAR(30) NOT NULL DEFAULT 'MEMBER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_access_request_org_user UNIQUE (organization_id, user_id)
);

-- 4. Tabela: commissions (Comissões e Grupos de Trabalho)
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'Comissão',
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabela: commission_members (Membros de Comissões)
CREATE TABLE IF NOT EXISTS commission_members (
    commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (commission_id, user_id)
);

-- 6. Reuniões das comissões, convites e presença dos participantes
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    agenda TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_meeting_time CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS meeting_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED', 'ACCEPTED', 'DECLINED')),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_meeting_invitation UNIQUE (meeting_id, user_id)
);

CREATE TABLE IF NOT EXISTS meeting_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entered_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    CONSTRAINT uq_meeting_attendance UNIQUE (meeting_id, user_id)
);

-- Evolução aditiva: preserva reuniões e presenças existentes.
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS all_day BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS location VARCHAR(300) NOT NULL DEFAULT '';
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS details VARCHAR(4000) NOT NULL DEFAULT '';
ALTER TABLE meeting_attendance ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES users(id);
ALTER TABLE meeting_attendance ADD COLUMN IF NOT EXISTS method VARCHAR(20) NOT NULL DEFAULT 'SELF';
CREATE TABLE IF NOT EXISTS meeting_attendance_codes (
    meeting_id UUID PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS meeting_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    content BYTEA NOT NULL CHECK (octet_length(content) BETWEEN 1 AND 5242880),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meeting_attachments_meeting ON meeting_attachments(meeting_id);

-- 7. Atas com lista de aprovadores congelada no envio para revisão.
CREATE TABLE IF NOT EXISTS meeting_minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(TRIM(content)) > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED')),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    required_approver_ids UUID[] NOT NULL DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_meeting_minutes_id_meeting UNIQUE (id, meeting_id),
    CONSTRAINT chk_minutes_reviewers CHECK (status = 'DRAFT' OR CARDINALITY(required_approver_ids) > 0)
);

CREATE TABLE IF NOT EXISTS meeting_minutes_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    minutes_id UUID NOT NULL,
    meeting_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version INTEGER NOT NULL CHECK (version > 0),
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED')),
    comment VARCHAR(2000) NOT NULL DEFAULT '',
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_minutes_approval_meeting FOREIGN KEY (minutes_id, meeting_id)
      REFERENCES meeting_minutes(id, meeting_id) ON DELETE CASCADE,
    CONSTRAINT uq_minutes_approval_user UNIQUE (minutes_id, user_id)
);

-- Votações independentes da aprovação de atas (Incremento 3).
CREATE TABLE IF NOT EXISTS meeting_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    question VARCHAR(500) NOT NULL CHECK (LENGTH(TRIM(question)) > 0),
    status VARCHAR(10) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    CONSTRAINT uq_meeting_votes_id_meeting UNIQUE (id, meeting_id)
);

CREATE TABLE IF NOT EXISTS meeting_vote_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vote_id UUID NOT NULL REFERENCES meeting_votes(id) ON DELETE CASCADE,
    label VARCHAR(160) NOT NULL CHECK (LENGTH(TRIM(label)) > 0),
    position SMALLINT NOT NULL CHECK (position > 0),
    CONSTRAINT uq_meeting_vote_option_position UNIQUE (vote_id, position),
    CONSTRAINT uq_meeting_vote_option_id_vote UNIQUE (id, vote_id)
);

CREATE TABLE IF NOT EXISTS meeting_vote_ballots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vote_id UUID NOT NULL REFERENCES meeting_votes(id) ON DELETE CASCADE,
    option_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cast_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_meeting_vote_ballot_option FOREIGN KEY (option_id, vote_id)
      REFERENCES meeting_vote_options(id, vote_id) ON DELETE CASCADE,
    CONSTRAINT uq_meeting_vote_ballot_user UNIQUE (vote_id, user_id)
);

-- 9. Tabela: system_subsystems (Monitoramento de Subsistemas Operacionais)
CREATE TABLE IF NOT EXISTS system_subsystems (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ONLINE',
    last_check TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para otimização de consultas relacionais
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_org ON access_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_user ON access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_org ON commissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_comm_members_user ON commission_members(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_commission ON meetings(commission_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_meeting_invitations_user ON meeting_invitations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_meeting ON meeting_attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_minutes_approvals_meeting ON meeting_minutes_approvals(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_votes_meeting ON meeting_votes(meeting_id, created_at);
CREATE INDEX IF NOT EXISTS idx_meeting_vote_ballots_vote ON meeting_vote_ballots(vote_id);

-- Segurança: migração preserva contas existentes; novos cadastros exigem ativação.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_expires TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE TABLE IF NOT EXISTS auth_rate_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at TIMESTAMPTZ NOT NULL);
CREATE TABLE IF NOT EXISTS system_metadata (id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id), initialized_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
INSERT INTO system_metadata (id) VALUES (TRUE) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS download_tickets (
 token_hash TEXT PRIMARY KEY, session_hash TEXT NOT NULL REFERENCES auth_sessions(token_hash) ON DELETE CASCADE,
 path TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS invitation_accepted BOOLEAN NOT NULL DEFAULT TRUE;

-- Os índices recusam duplicidades antigas sem apagar dados; resolver os conflitos antes de migrar.
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_normalized_document ON organizations ((regexp_replace(document, '[^0-9]', '', 'g')));
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_normalized_name ON organizations ((LOWER(TRIM(name))));
-- Instalações antigas sem coordenador passam a ter o proprietário como responsável.
INSERT INTO commission_members (commission_id, user_id, role)
SELECT c.id, o.owner_id, 'COORDINATOR' FROM commissions c JOIN organizations o ON o.id = c.organization_id
WHERE NOT EXISTS (SELECT 1 FROM commission_members cm WHERE cm.commission_id = c.id AND cm.role = 'COORDINATOR')
ON CONFLICT (commission_id, user_id) DO UPDATE SET role = 'COORDINATOR';
CREATE UNIQUE INDEX IF NOT EXISTS uq_commission_coordinator ON commission_members (commission_id) WHERE role = 'COORDINATOR';
