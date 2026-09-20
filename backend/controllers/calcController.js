// ==========================================================================
// AGENTPROSPECT PRO - FINANCIAL CALCULATION / QUOTES CONTROLLER
// ==========================================================================

import { db } from '../database.js';
import { sendJson, parseJsonBody } from '../middleware/auth.js';

export async function handleSaveCalculation(req, res, currentUser) {
  const body = await parseJsonBody(req);
  const { prospect_id, type, title, inputs, results } = body;

  if (!type || !title || !results) {
    return sendJson(res, 400, { error: 'Tipe kalkulasi, judul, dan hasil perhitungan wajib diisi.' });
  }

  const newQuoteId = `quote_${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO financial_quotes (id, user_id, prospect_id, type, title, inputs_json, results_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newQuoteId,
    currentUser.id,
    prospect_id || null,
    type,
    title,
    JSON.stringify(inputs || {}),
    JSON.stringify(results || {}),
    now
  );

  return sendJson(res, 201, {
    message: 'Hasil analisa finansial berhasil disimpan ke database!',
    id: newQuoteId
  });
}

export function handleListCalculations(req, res, currentUser, url) {
  const prospectId = url.searchParams.get('prospect_id');
  let quotes;
  if (prospectId) {
    quotes = db.prepare(`
      SELECT * FROM financial_quotes 
      WHERE user_id = ? AND prospect_id = ? 
      ORDER BY created_at DESC
    `).all(currentUser.id, prospectId);
  } else {
    quotes = db.prepare(`
      SELECT * FROM financial_quotes 
      WHERE user_id = ? 
      ORDER BY created_at DESC LIMIT 50
    `).all(currentUser.id);
  }

  const enrichedQuotes = quotes.map(q => ({
    id: q.id,
    prospect_id: q.prospect_id,
    type: q.type,
    title: q.title,
    inputs: JSON.parse(q.inputs_json || '{}'),
    results: JSON.parse(q.results_json || '{}'),
    created_at: q.created_at
  }));

  return sendJson(res, 200, { quotes: enrichedQuotes });
}
