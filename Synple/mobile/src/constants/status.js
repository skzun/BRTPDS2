const STATUS_LABELS = { PENDING: 'Pendente', APPROVED: 'Aprovado', REJECTED: 'Rejeitado', REVOKED: 'Revogado' };
const SUBSYSTEM_LABELS = { ONLINE: 'Operacional', RESTARTING: 'Reiniciando' };
const COMMISSION_STATUS_LABELS = { ACTIVE: 'Ativa', INACTIVE: 'Inativa' };
const COMMISSION_TYPES = ['Comissão', 'Grupo de Trabalho', 'Comitê', 'Outro'];
const COMMISSION_ROLE_LABELS = { COORDINATOR: 'Coordenador(a)', MEMBER: 'Membro' };

module.exports = { COMMISSION_ROLE_LABELS, COMMISSION_STATUS_LABELS, COMMISSION_TYPES, STATUS_LABELS, SUBSYSTEM_LABELS };
