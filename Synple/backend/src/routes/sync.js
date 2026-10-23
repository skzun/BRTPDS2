const express = require('express');
const db = require('../db/connection');

function createSyncRouter(db) {
  const router = express.Router();

  // GET /api/sync - Sincronização completa de dados com o app mobile
  router.get('/', async (req, res) => {
    try {
      const usersRes = await db.query('SELECT id, name, email, phone, system_role as "systemRole", theme FROM users ORDER BY created_at;');
      const orgsRes = await db.query('SELECT id, name, document, owner_id as "ownerId", status FROM organizations ORDER BY created_at;');
      const reqsRes = await db.query('SELECT id, organization_id as "organizationId", user_id as "userId", status, organization_role as "organizationRole" FROM access_requests ORDER BY created_at;');
      const commsRes = await db.query('SELECT id, organization_id as "organizationId", name, type, description, status FROM commissions ORDER BY created_at;');
      const membersRes = await db.query('SELECT commission_id as "commissionId", user_id as "userId", role FROM commission_members;');
      const meetingsRes = await db.query('SELECT id, commission_id as "commissionId", title, starts_at as "startsAt", ends_at as "endsAt", agenda, created_by as "createdBy" FROM meetings ORDER BY starts_at;');
      const invitationsRes = await db.query('SELECT id, meeting_id as "meetingId", user_id as "userId", status, responded_at as "respondedAt" FROM meeting_invitations;');
      const attendanceRes = await db.query('SELECT id, meeting_id as "meetingId", user_id as "userId", entered_at as "enteredAt", left_at as "leftAt" FROM meeting_attendance;');
      const minutesRes = await db.query(`SELECT id, meeting_id AS "meetingId", content, status, version,
        required_approver_ids AS "requiredApproverIds", created_by AS "createdBy", updated_by AS "updatedBy",
        submitted_at AS "submittedAt", approved_at AS "approvedAt", created_at AS "createdAt", updated_at AS "updatedAt"
        FROM meeting_minutes ORDER BY created_at;`);
      const approvalsRes = await db.query(`SELECT id, minutes_id AS "minutesId", meeting_id AS "meetingId", user_id AS "userId",
        version, decision, comment, decided_at AS "decidedAt" FROM meeting_minutes_approvals ORDER BY decided_at;`);
      const subsRes = await db.query('SELECT id, name, status FROM system_subsystems;');

      return res.json({
        users: usersRes.rows,
        organizations: orgsRes.rows,
        accessRequests: reqsRes.rows,
        commissions: commsRes.rows,
        commissionMembers: membersRes.rows,
        meetings: meetingsRes.rows,
        meetingInvitations: invitationsRes.rows,
        meetingAttendance: attendanceRes.rows,
        meetingMinutes: minutesRes.rows,
        meetingMinutesApprovals: approvalsRes.rows,
        system: {
          initialized: true,
          initializedAt: new Date().toISOString(),
          subsystems: subsRes.rows,
        },
      });
    } catch (err) {
      console.error('Erro no endpoint /api/sync:', err);
      return res.status(500).json({ error: 'Falha ao sincronizar dados com o PostgreSQL.' });
    }
  });

  return router;
}

module.exports = createSyncRouter(db);
module.exports.createSyncRouter = createSyncRouter;
