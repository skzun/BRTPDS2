-- ============================================================================
-- SCRIPT DE CARGA INICIAL (SEED) PARA POSTGRESQL (BANCO_SYNPLE)
-- Senhas criptografadas com Bcrypt (fator de custo 10)
-- ============================================================================

-- 1. Inserção de Usuários de Demonstração
-- admin@synple.com  | Senha: Admin@123  (SYSTEM_ADMIN)
-- marina@synple.com | Senha: Marina@123 (USER / Admin Org)
-- joao@synple.com   | Senha: Joao@123   (USER)
INSERT INTO users (id, name, email, phone, password_hash, system_role, theme)
VALUES 
    ('28ee851b-0a0b-4e82-9a5d-ad99b1376b96', 'Administrador do Sistema', 'admin@synple.com', '(11) 99999-1111', '$2a$10$jrfnRAGn7EzmxTw2o2m83.bxDlfJVfmwgMtpb16V7A2r2sw.45t8O', 'SYSTEM_ADMIN', 'LIGHT'),
    ('57f5f0b3-b1e4-4214-8cbb-e6b5a9649a11', 'Marina Costa', 'marina@synple.com', '(11) 99999-0000', '$2a$10$dr4R.yfnXlV1SpYi06/4YuWJxV0mVLoDQqE2m6wbwdXHFaw4VUsWu', 'USER', 'LIGHT'),
    ('aeb3f224-9f3a-46d3-a7d2-bb36ed5325aa', 'João Silva', 'joao@synple.com', '(11) 98888-2222', '$2a$10$Yo4RtzgLGfxZhv2mq.AIsuAzj9Af95J8WypRkIQrdXJ6hQoOIPZ6m', 'USER', 'LIGHT')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- 2. Inserção de Organizações pertencentes à Marina Costa
INSERT INTO organizations (id, name, document, owner_id, status)
VALUES 
    ('79ec9eb3-f240-4abb-9058-0b62a8214ffc', 'Estúdio Aurora', '12.345.678/0001-90', '57f5f0b3-b1e4-4214-8cbb-e6b5a9649a11', 'APPROVED'),
    ('a33c7a25-5312-449a-b9b5-7d67ad385061', 'Coletivo Horizonte', '98.765.432/0001-10', '57f5f0b3-b1e4-4214-8cbb-e6b5a9649a11', 'APPROVED')
ON CONFLICT (document) DO UPDATE SET status = 'APPROVED';

-- 3. Inserção de Solicitação de Acesso (João Silva -> Estúdio Aurora)
INSERT INTO access_requests (id, organization_id, user_id, status, organization_role)
VALUES 
    ('372f4fa9-f8a8-451d-b36c-f9f931d21971', '79ec9eb3-f240-4abb-9058-0b62a8214ffc', 'aeb3f224-9f3a-46d3-a7d2-bb36ed5325aa', 'PENDING', 'MEMBER')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 4. Inserção de Comissão Inicial (Comunicação)
INSERT INTO commissions (id, organization_id, name, type, description, status)
VALUES 
    ('8446990d-a90c-40e3-890b-b0a379ce6668', '79ec9eb3-f240-4abb-9058-0b62a8214ffc', 'Comunicação', 'Comissão', 'Divulgação e relacionamento com a comunidade.', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 5. Inserção de Membro da Comissão (Marina como Coordenadora)
INSERT INTO commission_members (commission_id, user_id, role)
VALUES 
    ('8446990d-a90c-40e3-890b-b0a379ce6668', '57f5f0b3-b1e4-4214-8cbb-e6b5a9649a11', 'COORDINATOR')
ON CONFLICT (commission_id, user_id) DO NOTHING;

-- 6. Monitoramento de Subsistemas do Sistema
INSERT INTO system_subsystems (id, name, status, last_check)
VALUES 
    ('api', 'API e Autenticação (Node.js/Express)', 'ONLINE', NOW()),
    ('database', 'Banco de Dados (PostgreSQL 18 - Banco_synple)', 'ONLINE', NOW()),
    ('notifications', 'Serviço de Notificações e Fila', 'ONLINE', NOW())
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, last_check = NOW();
