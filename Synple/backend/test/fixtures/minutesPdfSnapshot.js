function minutesPdfSnapshot(overrides = {}) {
  return {
    meeting: {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Reunião de planejamento e prestação de contas',
      organizationName: 'Associação São João da Boa Esperança',
      commissionName: 'Comissão de Educação e Inclusão',
      authorName: 'Conrado Soares', editorName: 'Érica Gonçalves',
      startsAt: '2026-10-22T13:00:00Z', endsAt: '2026-10-22T14:30:00Z',
      agenda: '1. Avaliação das ações de setembro.\n2. Aprovação do orçamento e encaminhamentos.\n3. Próximas reuniões.',
    },
    minutes: {
      id: '22222222-2222-4222-8222-222222222222', version: 3, status: 'APPROVED',
      content: 'A reunião teve início às 10h, com a participação de todos os convidados.\n\nApós a apresentação do relatório, os presentes deliberaram pela aquisição de materiais para as atividades de educação. A proposta foi aprovada por unanimidade.\n\nEncaminhamentos:\n- Érica apresentará três orçamentos até a próxima reunião.\n- João ficará responsável pela comunicação às famílias.\n\nNada mais havendo a tratar, a reunião foi encerrada às 11h30.',
      createdAt: '2026-10-22T14:30:00Z', updatedAt: '2026-10-22T15:00:00Z',
      submittedAt: '2026-10-22T14:40:00Z', approvedAt: '2026-10-22T15:00:00Z',
    },
    attendance: [
      { userId: 'chair', name: 'Érica Gonçalves', enteredAt: '2026-10-22T13:00:00Z', leftAt: '2026-10-22T14:30:00Z' },
      { userId: 'member', name: 'João D’Ávila', enteredAt: '2026-10-22T13:03:00Z', leftAt: null },
    ],
    approvals: [
      { userId: 'chair', name: 'Érica Gonçalves', decision: 'APPROVED', comment: '', decidedAt: '2026-10-22T14:50:00Z' },
      { userId: 'member', name: 'João D’Ávila', decision: 'APPROVED', comment: 'Conteúdo correto; decisão registrada com transparência.', decidedAt: '2026-10-22T15:00:00Z' },
    ],
    timeZone: 'America/Sao_Paulo', generatedAt: '2026-10-22T15:10:00Z',
    ...overrides,
  };
}

module.exports = { minutesPdfSnapshot };
