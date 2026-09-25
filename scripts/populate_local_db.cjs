const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, '..', 'agentprospect.db');
const db = new DatabaseSync(dbPath);

// Pastikan kolom owner ada di database
try {
  const cols = db.prepare('PRAGMA table_info(prospects)').all();
  if (!cols.some(c => c.name === 'owner')) {
    db.exec("ALTER TABLE prospects ADD COLUMN owner TEXT DEFAULT 'Yusuf'");
  }
} catch (e) {}

const contacts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'contacts_valid.json'), 'utf-8'));

// Check or create default users: Yusuf & Rosma
let userYusuf = db.prepare('SELECT id FROM users WHERE name LIKE ? LIMIT 1').get('%Yusuf%');
let userId = userYusuf ? userYusuf.id : 'usr_yusuf';
if (!userYusuf) {
  db.prepare(`
    INSERT INTO users (id, agent_code, name, email, password, agency_name, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, 'AG-001', 'Yusuf Raja Tamba', 'yusuf@prudential.co.id', 'password123', 'Prudential Agency', 'Agent', '2026-09-21 00:00:00');
}

// Clear old prospects
db.prepare('DELETE FROM prospects').run();

const insertStmt = db.prepare(`
  INSERT INTO prospects (
    id, user_id, name, phone, owner, address, relation, job, estimated_income,
    temperature, stage, money_qualified, authority_qualified, need_qualified,
    target_follow_up, last_contact_date, last_objection, notes, needs_json,
    created_at, updated_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?
  )
`);

let countYusuf = 0;
let countRosma = 0;

for (const c of contacts) {
  let temp = 'warm';
  if (c.marketCategory && c.marketCategory.includes('Hot')) temp = 'hot';
  else if (c.marketCategory && c.marketCategory.includes('Cold')) temp = 'cold';

  let stage = 'suspect';
  if (c.stage && c.stage.includes('Pendekatan')) stage = 'approach';

  const owner = c.owner || 'Yusuf';
  if (owner === 'Rosma') countRosma++;
  else countYusuf++;

  const notesWithShared = c.isShared ? ((c.notes ? c.notes + ' | ' : '') + 'Kontak bersama ' + c.sharedWith) : (c.notes || '');

  insertStmt.run(
    c.id,
    userId,
    c.name,
    c.phone,
    owner,
    c.address || '',
    c.relation,
    c.job || '',
    '',
    temp,
    stage,
    1, 1, 1,
    '',
    '-',
    '-',
    notesWithShared,
    '[]',
    c.regDate || '2026-09-25 15:00:00',
    c.regDate || '2026-09-25 15:00:00'
  );
}

console.log('Successfully inserted ' + (countYusuf + countRosma) + ' prospects into local SQLite database agentprospect.db!');
console.log('• Yusuf prospects: ' + countYusuf);
console.log('• Rosma prospects: ' + countRosma);
