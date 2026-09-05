const INITIAL_DATA = {
  organizations: [
    { id: 'org-aurora', name: 'Estúdio Aurora', document: '12.345.678/0001-90', status: 'APPROVED', ownerId: 'user-admin' },
    { id: 'org-horizonte', name: 'Coletivo Horizonte', document: '98.765.432/0001-10', status: 'APPROVED', ownerId: 'user-admin' },
  ],
  users: [
    { id: 'user-admin', name: 'Marina Costa', email: 'marina@synple.app', phone: '(11) 99999-0000', theme: 'LIGHT' },
    { id: 'user-visitante', name: 'João Silva', email: 'joao@email.com', phone: '', theme: 'LIGHT' },
  ],
  accessRequests: [{ id: 'request-1', organizationId: 'org-aurora', userId: 'user-visitante', status: 'PENDING' }],
  commissions: [{ id: 'commission-1', organizationId: 'org-aurora', name: 'Comunicação', description: 'Divulgação e relacionamento com a comunidade.', status: 'ACTIVE' }],
  commissionMembers: [{ commissionId: 'commission-1', userId: 'user-admin' }],
  system: {
    initialized: true,
    initializedAt: '2026-09-01T00:00:00.000Z',
    subsystems: [
      { id: 'api', name: 'API e autenticação', status: 'ONLINE' },
      { id: 'database', name: 'Banco de dados', status: 'ONLINE' },
      { id: 'notifications', name: 'Notificações', status: 'ONLINE' },
    ],
  },
};

module.exports = { INITIAL_DATA };
