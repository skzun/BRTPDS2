const express = require('express');
const db = require('../db/connection');
const { scopeSnapshot } = require('../services/security');

function createSyncRouter(db) {
  const router = express.Router();

  // GET /api/sync - Sincronização completa de dados com o app mobile
  router.get('/', async (req, res) => {
    try {
      const usersRes = await db.query('SELECT id, name, email, phone, system_role as "systemRole", theme FROM users ORDER BY created_at;');
      const orgsRes = await db.query('SELECT id, name, document, owner_id as "ownerId", status FROM organizations ORDER BY created_at;');
      const reqsRes = await db.query('SELECT id, organization_id as "organizationId", user_id as "userId", status, organization_role as "organizationRole", invited_by AS "invitedBy", invitation_accepted AS "invitationAccepted" FROM access_requests ORDER BY created_at;');
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
      const meetingVotesRes = await db.query(`SELECT id, meeting_id AS "meetingId", question, status,
        created_by AS "createdBy", created_at AS "createdAt", closed_at AS "closedAt" FROM meeting_votes ORDER BY created_at;`);
      const meetingVoteOptionsRes = await db.query(`SELECT o.id, o.vote_id AS "voteId", v.meeting_id AS "meetingId", o.label, o.position
        FROM meeting_vote_options o JOIN meeting_votes v ON v.id = o.vote_id ORDER BY o.vote_id, o.position;`);
      const meetingVoteTalliesRes = await db.query(`SELECT v.meeting_id AS "meetingId", b.vote_id AS "voteId", b.option_id AS "optionId", COUNT(*)::int AS count
        FROM meeting_vote_ballots b JOIN meeting_votes v ON v.id = b.vote_id
        GROUP BY v.meeting_id, b.vote_id, b.option_id;`);
      const meetingVoteOwnBallotsRes = req.auth?.id
        ? await db.query(`SELECT b.id, b.vote_id AS "voteId", v.meeting_id AS "meetingId", b.option_id AS "optionId",
            b.user_id AS "userId", b.cast_at AS "castAt" FROM meeting_vote_ballots b
            JOIN meeting_votes v ON v.id = b.vote_id WHERE b.user_id = $1 ORDER BY b.cast_at;`, [req.auth.id])
        : { rows: [] };
      const subsRes = await db.query('SELECT id, name, status FROM system_subsystems;');

      const metadata = await db.query('SELECT initialized_at FROM system_metadata WHERE id = TRUE');
      const snapshot = {
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
        meetingVotes: meetingVotesRes.rows,
        meetingVoteOptions: meetingVoteOptionsRes.rows,
        meetingVoteTallies: meetingVoteTalliesRes.rows,
        meetingVoteOwnBallots: meetingVoteOwnBallotsRes.rows,
        system: {
          initialized: true,
          initializedAt: metadata.rows[0]?.initialized_at,
          subsystems: [{ id: 'api', name: 'API', status: 'ONLINE' }, { id: 'database', name: 'PostgreSQL', status: 'ONLINE' }],
        },
      };
      return res.json(req.auth ? scopeSnapshot(snapshot, req.auth) : snapshot);
    } catch (err) {
      console.error('Erro no endpoint /api/sync:', err);
      return res.status(500).json({ error: 'Falha ao sincronizar dados com o PostgreSQL.' });
    }
  });

  return router;
}

module.exports = createSyncRouter(db);
module.exports.createSyncRouter = createSyncRouter;
