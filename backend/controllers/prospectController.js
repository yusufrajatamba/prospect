// ==========================================================================
// PRUPROSPECT PRO - PROSPECT CONTROLLER (PROJECT 100)
// ==========================================================================

import { db } from '../database.js';
import { sendJson, parseJsonBody } from '../middleware/auth.js';

export function handleListProspects(req, res, currentUser) {
  const prospects = db.prepare(`
    SELECT * FROM prospects 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).all(currentUser.id);

  const historyStmt = db.prepare(`
    SELECT id, date, channel, response, objection, next_action, target_date 
    FROM interaction_history 
    WHERE prospect_id = ? AND user_id = ? 
    ORDER BY date DESC
  `);

  const enriched = prospects.map(p => {
    const history = historyStmt.all(p.id, currentUser.id);
    let parsedNeeds = [];
    try {
      parsedNeeds = JSON.parse(p.needs_json || '[]');
    } catch {
      parsedNeeds = [];
    }

    return {
      id: p.id,
      name: p.name,
      phone: p.phone,
      address: p.address,
      relation: p.relation,
      job: p.job,
      estimatedIncome: p.estimated_income,
      temperature: p.temperature,
      stage: p.stage,
      needs: parsedNeeds,
      qualifications: {
        money: Boolean(p.money_qualified),
        authority: Boolean(p.authority_qualified),
        need: Boolean(p.need_qualified)
      },
      targetFollowUp: p.target_follow_up,
      lastContactDate: p.last_contact_date || '-',
      lastObjection: p.last_objection || '-',
      notes: p.notes,
      history
    };
  });

  return sendJson(res, 200, { prospects: enriched });
}

export async function handleCreateProspect(req, res, currentUser) {
  const body = await parseJsonBody(req);
  const {
    name, phone, address, relation, job, estimatedIncome,
    temperature, stage, qualifications, targetFollowUp, notes, needs
  } = body;

  if (!name || !phone) {
    return sendJson(res, 400, { error: 'Nama calon nasabah dan nomor WhatsApp wajib diisi.' });
  }

  const id = `p_${Date.now()}`;
  const now = new Date().toISOString();
  const needsJson = JSON.stringify(needs || []);

  db.prepare(`
    INSERT INTO prospects (
      id, user_id, name, phone, address, relation, job, estimated_income,
      temperature, stage, money_qualified, authority_qualified, need_qualified,
      target_follow_up, last_contact_date, last_objection, notes, needs_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '-', '-', ?, ?, ?, ?)
  `).run(
    id,
    currentUser.id,
    name,
    phone,
    address ?? '',
    relation ?? 'Lainnya',
    job ?? '',
    estimatedIncome ?? '',
    temperature ?? 'warm',
    stage ?? 'suspect',
    qualifications?.money ? 1 : 0,
    qualifications?.authority ? 1 : 0,
    qualifications?.need ? 1 : 0,
    targetFollowUp ?? null,
    notes ?? '',
    needsJson,
    now,
    now
  );

  return sendJson(res, 201, {
    message: 'Calon nasabah berhasil ditambahkan ke database!',
    id
  });
}

export async function handleUpdateProspect(req, res, currentUser, prospectId) {
  const existing = db.prepare('SELECT id FROM prospects WHERE id = ? AND user_id = ?').get(prospectId, currentUser.id);
  if (!existing) {
    return sendJson(res, 404, { error: 'Data calon nasabah tidak ditemukan.' });
  }

  const body = await parseJsonBody(req);
  const {
    name, phone, address, relation, job, estimatedIncome,
    temperature, stage, qualifications, targetFollowUp, notes, needs
  } = body;

  const now = new Date().toISOString();
  const needsJson = needs !== undefined ? JSON.stringify(needs) : null;

  db.prepare(`
    UPDATE prospects SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      address = COALESCE(?, address),
      relation = COALESCE(?, relation),
      job = COALESCE(?, job),
      estimated_income = COALESCE(?, estimated_income),
      temperature = COALESCE(?, temperature),
      stage = COALESCE(?, stage),
      money_qualified = COALESCE(?, money_qualified),
      authority_qualified = COALESCE(?, authority_qualified),
      need_qualified = COALESCE(?, need_qualified),
      target_follow_up = COALESCE(?, target_follow_up),
      notes = COALESCE(?, notes),
      needs_json = COALESCE(?, needs_json),
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(
    name ?? null,
    phone ?? null,
    address ?? null,
    relation ?? null,
    job ?? null,
    estimatedIncome ?? null,
    temperature ?? null,
    stage ?? null,
    qualifications ? (qualifications.money ? 1 : 0) : null,
    qualifications ? (qualifications.authority ? 1 : 0) : null,
    qualifications ? (qualifications.need ? 1 : 0) : null,
    targetFollowUp ?? null,
    notes ?? null,
    needsJson ?? null,
    now,
    prospectId,
    currentUser.id
  );

  return sendJson(res, 200, { message: 'Data calon nasabah berhasil diperbarui.' });
}

export function handleDeleteProspect(req, res, currentUser, prospectId) {
  const info = db.prepare('DELETE FROM prospects WHERE id = ? AND user_id = ?').run(prospectId, currentUser.id);
  if (info.changes === 0) {
    return sendJson(res, 404, { error: 'Calon nasabah tidak ditemukan atau bukan milik Anda.' });
  }
  return sendJson(res, 200, { message: 'Calon nasabah berhasil dihapus dari database.' });
}

export async function handleUpdateStage(req, res, currentUser, prospectId) {
  const body = await parseJsonBody(req);
  const { stage } = body;

  if (!stage) {
    return sendJson(res, 400, { error: 'Tahap baru wajib ditentukan.' });
  }

  const existing = db.prepare('SELECT id FROM prospects WHERE id = ? AND user_id = ?').get(prospectId, currentUser.id);
  if (!existing) {
    return sendJson(res, 404, { error: 'Calon nasabah tidak ditemukan.' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE prospects SET stage = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(stage, now, prospectId, currentUser.id);

  return sendJson(res, 200, { message: 'Tahap pipeline nasabah berhasil diperbarui!' });
}

export async function handleAddInteraction(req, res, currentUser, prospectId) {
  const body = await parseJsonBody(req);
  const { channel, date, response, objection, nextAction, targetDate } = body;

  if (!response) {
    return sendJson(res, 400, { error: 'Catatan respon calon nasabah wajib diisi.' });
  }

  const existing = db.prepare('SELECT id FROM prospects WHERE id = ? AND user_id = ?').get(prospectId, currentUser.id);
  if (!existing) {
    return sendJson(res, 404, { error: 'Calon nasabah tidak ditemukan.' });
  }

  const newLogId = `log_${Date.now()}`;
  const now = new Date().toISOString();
  const contactDate = date || now;

  db.prepare(`
    INSERT INTO interaction_history (id, prospect_id, user_id, date, channel, response, objection, next_action, target_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newLogId,
    prospectId,
    currentUser.id,
    contactDate,
    channel || 'WhatsApp',
    response,
    objection ?? '',
    nextAction ?? '',
    targetDate ?? null
  );

  db.prepare(`
    UPDATE prospects SET
      last_contact_date = ?,
      last_objection = COALESCE(?, last_objection),
      target_follow_up = COALESCE(?, target_follow_up),
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(
    contactDate.split('T')[0],
    objection && objection !== '-' ? objection : null,
    targetDate || null,
    now,
    prospectId,
    currentUser.id
  );

  return sendJson(res, 201, { message: 'Catatan interaksi tersimpan!', id: newLogId });
}
