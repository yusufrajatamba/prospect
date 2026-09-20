// ==========================================================================
// AGENTPROSPECT PRO - POLICY CONTROLLER (IN-FORCE CONTRACTS)
// ==========================================================================

import { db } from '../database.js';
import { sendJson, parseJsonBody } from '../middleware/auth.js';

export function handleListPolicies(req, res, currentUser) {
  const rawPolicies = db.prepare(`
    SELECT * FROM policies 
    WHERE user_id = ? 
    ORDER BY start_date DESC
  `).all(currentUser.id);

  const policies = rawPolicies.map(p => ({
    ...p,
    holder_name: p.client_name || p.holder_name || '',
    insured_name: p.insured_name || p.client_name || '',
    phone: p.client_phone || p.phone || '',
    frequency: p.payment_frequency || p.frequency || 'Bulanan',
    due_date: p.next_due_date || p.due_date || '',
    issued_date: p.start_date || p.issued_date || '',
    claim_history: p.claim_history || '',
    status: p.status || 'In Force'
  }));

  return sendJson(res, 200, { policies });
}

export async function handleCreatePolicy(req, res, currentUser) {
  const body = await parseJsonBody(req);
  const prospect_id = body.prospect_id || null;
  const policy_number = body.policy_number;
  const client_name = body.client_name || body.holder_name;
  const insured_name = body.insured_name || client_name;
  const client_phone = body.client_phone || body.phone || '';
  const product_name = body.product_name;
  const product_type = body.product_type || 'Proteksi';
  const premium_amount = body.premium_amount;
  const payment_frequency = body.payment_frequency || body.frequency || 'Bulanan';
  const sum_assured = body.sum_assured || 0;
  const start_date = body.start_date || body.issued_date || new Date().toISOString().split('T')[0];
  const next_due_date = body.next_due_date || body.due_date || '';
  const claim_history = body.claim_history || '';
  const notes = body.notes || '';

  if (!policy_number || !client_name || !product_name || !premium_amount) {
    return sendJson(res, 400, { error: 'Lengkapi seluruh data wajib pendaftaran polis.' });
  }

  // Calculate APE (Annualized Premium Equivalent)
  const premium = parseFloat(premium_amount) || 0;
  let multiplier = 1;
  const freq = payment_frequency.toLowerCase();
  if (freq.includes('month') || freq.includes('bulan')) multiplier = 12;
  else if (freq.includes('quarter') || freq.includes('triwulan') || freq.includes('kuartal')) multiplier = 4;
  else if (freq.includes('semi') || freq.includes('semester')) multiplier = 2;
  else multiplier = 1;

  const apeAmount = premium * multiplier;
  const newPolicyId = `pol_${Date.now()}`;
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO policies (
        id, user_id, prospect_id, policy_number, holder_name, client_name, insured_name, phone, client_phone,
        product_name, product_type, premium_amount, frequency, payment_frequency, ape_amount,
        sum_assured, issued_date, start_date, due_date, next_due_date, claim_history, status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'In-Force', ?, ?)
    `).run(
      newPolicyId,
      currentUser.id,
      prospect_id,
      policy_number,
      client_name,
      client_name,
      insured_name,
      client_phone,
      client_phone,
      product_name,
      product_type,
      premium,
      payment_frequency,
      payment_frequency,
      apeAmount,
      parseFloat(sum_assured) || 0,
      start_date,
      start_date,
      next_due_date,
      next_due_date,
      claim_history,
      notes,
      now
    );

    // If linked to a prospect, advance stage to 'issued'
    if (prospect_id) {
      db.prepare(`
        UPDATE prospects SET stage = 'issued', updated_at = ? 
        WHERE id = ? AND user_id = ?
      `).run(now, prospect_id, currentUser.id);
    }

    return sendJson(res, 201, {
      message: 'Polis berhasil didaftarkan ke portofolio nasabah!',
      id: newPolicyId,
      ape: apeAmount
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return sendJson(res, 409, { error: 'Nomor polis sudah terdaftar di sistem.' });
    }
    return sendJson(res, 500, { error: 'Gagal mendaftarkan polis: ' + err.message });
  }
}

export async function handleUpdatePolicy(req, res, currentUser, policyId) {
  const existing = db.prepare('SELECT id FROM policies WHERE id = ? AND user_id = ?').get(policyId, currentUser.id);
  if (!existing) {
    return sendJson(res, 404, { error: 'Polis tidak ditemukan.' });
  }

  const body = await parseJsonBody(req);
  const { status, next_due_date, claim_history, notes, premium_amount, payment_frequency } = body;

  let apeAmount = null;
  if (premium_amount !== undefined) {
    const premium = parseFloat(premium_amount) || 0;
    let multiplier = 1;
    const freq = (payment_frequency || 'Monthly').toLowerCase();
    if (freq.includes('month') || freq.includes('bulan')) multiplier = 12;
    else if (freq.includes('quarter') || freq.includes('triwulan')) multiplier = 4;
    else if (freq.includes('semi') || freq.includes('semester')) multiplier = 2;
    apeAmount = premium * multiplier;
  }

  db.prepare(`
    UPDATE policies SET
      status = COALESCE(?, status),
      next_due_date = COALESCE(?, next_due_date),
      claim_history = COALESCE(?, claim_history),
      notes = COALESCE(?, notes),
      premium_amount = COALESCE(?, premium_amount),
      payment_frequency = COALESCE(?, payment_frequency),
      ape_amount = COALESCE(?, ape_amount)
    WHERE id = ? AND user_id = ?
  `).run(
    status ?? null,
    next_due_date ?? null,
    claim_history ?? null,
    notes ?? null,
    premium_amount !== undefined ? parseFloat(premium_amount) : null,
    payment_frequency ?? null,
    apeAmount,
    policyId,
    currentUser.id
  );

  return sendJson(res, 200, { message: 'Data polis berhasil diperbarui.' });
}

export function handleDeletePolicy(req, res, currentUser, policyId) {
  const info = db.prepare('DELETE FROM policies WHERE id = ? AND user_id = ?').run(policyId, currentUser.id);
  if (info.changes === 0) {
    return sendJson(res, 404, { error: 'Polis tidak ditemukan.' });
  }
  return sendJson(res, 200, { message: 'Polis berhasil dihapus dari register.' });
}
