// ==========================================================================
// AGENTPROSPECT PRO - GOAL CONTROLLER (DYNAMIC PRODUCTION GOALS & MDRT)
// ==========================================================================

import { db } from '../database.js';
import { sendJson, parseJsonBody } from '../middleware/auth.js';

export function handleListGoals(req, res, currentUser) {
  // Aggregate real-time APE from in-force policies
  const apeRow = db.prepare(`
    SELECT COALESCE(SUM(ape_amount), 0) AS total_ape, COUNT(id) AS case_count 
    FROM policies 
    WHERE user_id = ? AND status != 'Lapsed'
  `).get(currentUser.id);

  const totalAPE = apeRow ? apeRow.total_ape : 0;
  const caseCount = apeRow ? apeRow.case_count : 0;

  // Aggregate contact count from prospects
  const contactRow = db.prepare(`
    SELECT COUNT(id) as count FROM prospects WHERE user_id = ?
  `).get(currentUser.id);
  const totalContacts = contactRow ? contactRow.count : 0;

  const goals = db.prepare(`
    SELECT * FROM production_goals 
    WHERE user_id = ? 
    ORDER BY created_at ASC
  `).all(currentUser.id);

  // Calculate live progress for each goal
  const enrichedGoals = goals.map(g => {
    let currentVal = g.current_val || 0;
    const cat = (g.category || '').toUpperCase();

    if (cat === 'MDRT' || cat === 'APE' || cat.includes('APE')) {
      currentVal = totalAPE;
    } else if (cat === 'CASES' || cat === 'POLIS' || cat.includes('POLIS')) {
      currentVal = caseCount;
    } else if (cat === 'CONTACTS' || cat === 'PROSPEK' || cat.includes('PROJECT')) {
      currentVal = totalContacts;
    }

    const percentage = g.target_val > 0 ? Math.round((currentVal / g.target_val) * 100) : 0;

    return {
      id: g.id,
      title: g.title,
      category: g.category,
      target_val: g.target_val,
      current_val: currentVal,
      percentage,
      unit: g.unit || 'Rp',
      period: g.period || 'Tahunan',
      deadline: g.deadline || '-',
      status: g.status || 'Active'
    };
  });

  return sendJson(res, 200, {
    goals: enrichedGoals,
    totalAPE,
    caseCount,
    totalContacts
  });
}

export async function handleCreateGoal(req, res, currentUser) {
  const body = await parseJsonBody(req);
  const { title, category, target_val, unit, period, deadline } = body;

  if (!title || target_val === undefined || target_val === null) {
    return sendJson(res, 400, { error: 'Judul target dan nilai sasaran wajib diisi.' });
  }

  const newGoalId = `g_${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO production_goals (id, user_id, title, category, target_val, current_val, unit, period, deadline, status, created_at)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, 'Active', ?)
  `).run(
    newGoalId,
    currentUser.id,
    title,
    category || 'Kustom',
    parseFloat(target_val) || 0,
    unit || 'Rp',
    period || 'Tahunan',
    deadline || '2026-12-31',
    now
  );

  return sendJson(res, 201, {
    message: 'Target produksi baru berhasil ditambahkan!',
    id: newGoalId
  });
}

export async function handleUpdateGoal(req, res, currentUser, goalId) {
  const existing = db.prepare('SELECT id FROM production_goals WHERE id = ? AND user_id = ?').get(goalId, currentUser.id);
  if (!existing) {
    return sendJson(res, 404, { error: 'Target tidak ditemukan.' });
  }

  const body = await parseJsonBody(req);
  const { title, category, target_val, current_val, unit, period, deadline, status } = body;

  db.prepare(`
    UPDATE production_goals SET
      title = COALESCE(?, title),
      category = COALESCE(?, category),
      target_val = COALESCE(?, target_val),
      current_val = COALESCE(?, current_val),
      unit = COALESCE(?, unit),
      period = COALESCE(?, period),
      deadline = COALESCE(?, deadline),
      status = COALESCE(?, status)
    WHERE id = ? AND user_id = ?
  `).run(
    title ?? null,
    category ?? null,
    target_val !== undefined ? parseFloat(target_val) : null,
    current_val !== undefined ? parseFloat(current_val) : null,
    unit ?? null,
    period ?? null,
    deadline ?? null,
    status ?? null,
    goalId,
    currentUser.id
  );

  return sendJson(res, 200, { message: 'Target produksi berhasil diperbarui.' });
}

export function handleDeleteGoal(req, res, currentUser, goalId) {
  const info = db.prepare('DELETE FROM production_goals WHERE id = ? AND user_id = ?').run(goalId, currentUser.id);
  if (info.changes === 0) {
    return sendJson(res, 404, { error: 'Target tidak ditemukan.' });
  }
  return sendJson(res, 200, { message: 'Target produksi berhasil dihapus.' });
}
