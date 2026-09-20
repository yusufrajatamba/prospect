// ==========================================================================
// AGENTPROSPECT PRO - DASHBOARD CONTROLLER (METRICS & STATISTICS)
// ==========================================================================

import { db } from '../database.js';
import { sendJson } from '../middleware/auth.js';

export function handleGetStats(req, res, currentUser) {
  // Aggregate prospects count
  const prospectsCountRow = db.prepare(`
    SELECT 
      COUNT(id) AS total,
      SUM(CASE WHEN temperature = 'hot' THEN 1 ELSE 0 END) AS hot_count,
      SUM(CASE WHEN temperature = 'warm' THEN 1 ELSE 0 END) AS warm_count,
      SUM(CASE WHEN temperature = 'cold' THEN 1 ELSE 0 END) AS cold_count,
      SUM(CASE WHEN stage IN ('approach', 'appointment', 'fact_finding', 'presentation', 'objection', 'closing') THEN 1 ELSE 0 END) AS active_approaches,
      SUM(CASE WHEN stage = 'issued' THEN 1 ELSE 0 END) AS closing_count
    FROM prospects 
    WHERE user_id = ?
  `).get(currentUser.id);

  // Aggregate policies APE
  const apeRow = db.prepare(`
    SELECT 
      COALESCE(SUM(ape_amount), 0) AS total_ape, 
      COUNT(id) AS policy_count 
    FROM policies 
    WHERE user_id = ? AND status != 'Lapsed'
  `).get(currentUser.id);

  // Goals
  const goals = db.prepare('SELECT * FROM agent_goals WHERE user_id = ?').get(currentUser.id) || {
    yearly_ape_target: 600000000,
    monthly_prospect_target: 20,
    daily_contacts_target: 10,
    weekly_appointments_target: 3
  };

  return sendJson(res, 200, {
    stats: {
      totalProspects: prospectsCountRow ? (prospectsCountRow.total || 0) : 0,
      hotCount: prospectsCountRow ? (prospectsCountRow.hot_count || 0) : 0,
      warmCount: prospectsCountRow ? (prospectsCountRow.warm_count || 0) : 0,
      coldCount: prospectsCountRow ? (prospectsCountRow.cold_count || 0) : 0,
      activeApproaches: prospectsCountRow ? (prospectsCountRow.active_approaches || 0) : 0,
      closingCount: prospectsCountRow ? (prospectsCountRow.closing_count || 0) : 0,
      totalAPE: apeRow ? (apeRow.total_ape || 0) : 0,
      inForcePolicyCount: apeRow ? (apeRow.policy_count || 0) : 0
    },
    goals
  });
}
