// ==========================================================================
// AGENTPROSPECT PRO - AUTH CONTROLLER
// ==========================================================================

import { db } from '../database.js';
import { sendJson, parseJsonBody, authenticate } from '../middleware/auth.js';

export async function handleLogin(req, res) {
  const body = await parseJsonBody(req);
  const { phone, email, identifier, password } = body;
  const loginKey = (phone || identifier || email || '').trim();

  if (!loginKey || !password) {
    return sendJson(res, 400, { error: 'Nomor telepon / WhatsApp dan kata sandi wajib diisi.' });
  }

  const user = db.prepare(`
    SELECT * FROM users 
    WHERE phone = ? OR email = ? OR agent_code = ?
  `).get(loginKey, loginKey, loginKey);

  if (!user || user.password !== password) {
    return sendJson(res, 401, { error: 'Nomor telepon atau kata sandi tidak cocok dengan akun terdaftar.' });
  }

  const safeUser = {
    id: user.id,
    agent_code: user.agent_code || `AG-${user.phone ? user.phone.slice(-4) : '001'}`,
    name: user.name,
    phone: user.phone || '',
    email: user.email || '',
    agency_name: user.agency_name || 'Agency Office',
    role: user.role || 'Agent'
  };

  return sendJson(res, 200, {
    token: user.id,
    user: safeUser,
    message: 'Otentikasi agen berhasil!'
  });
}

export async function handleRegister(req, res) {
  const body = await parseJsonBody(req);
  let { name, phone, password, agency_name, agent_code, email } = body;

  name = (name || '').trim();
  phone = (phone || '').trim();
  password = (password || '').trim();
  agency_name = (agency_name || 'Agency Office').trim();

  if (!name || !phone || !password) {
    return sendJson(res, 400, { error: 'Nama lengkap, nomor telepon/WhatsApp, dan kata sandi wajib diisi.' });
  }

  // Cek apakah nomor telepon sudah terdaftar
  const existingPhone = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existingPhone) {
    return sendJson(res, 409, { error: 'Nomor telepon ini sudah terdaftar. Silakan langsung masuk.' });
  }

  const userId = `usr_${Date.now()}`;
  const generatedCode = agent_code || `AG-${phone.slice(-4)}`;
  const userEmail = email || `${phone}@agentprospect.id`;
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, agent_code, name, email, phone, password, agency_name, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Agent', ?)
  `).run(userId, generatedCode, name, userEmail, phone, password, agency_name, createdAt);

  // Buat default goals untuk agen baru
  db.prepare(`
    INSERT OR IGNORE INTO agent_goals (id, user_id, yearly_ape_target, monthly_prospect_target, daily_contacts_target, weekly_appointments_target)
    VALUES (?, ?, 600000000, 20, 10, 3)
  `).run(`goal_${Date.now()}`, userId);

  const newUser = {
    id: userId,
    agent_code: generatedCode,
    name,
    phone,
    email: userEmail,
    agency_name,
    role: 'Agent'
  };

  return sendJson(res, 201, {
    token: userId,
    user: newUser,
    message: 'Pendaftaran agen berhasil!'
  });
}

export function handleGetMe(req, res) {
  const user = authenticate(req);
  if (!user) {
    return sendJson(res, 401, { error: 'Sesi konsultan telah kedaluwarsa atau tidak sah.' });
  }
  return sendJson(res, 200, {
    user: {
      id: user.id,
      agent_code: user.agent_code || '',
      name: user.name,
      phone: user.phone || '',
      email: user.email || '',
      agency_name: user.agency_name || 'Agency Office',
      role: user.role || 'Agent'
    }
  });
}
