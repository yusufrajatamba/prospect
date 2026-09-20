// ==========================================================================
// PRUPROSPECT PRO - DATABASE MANAGEMENT (SQLITE VIA NODE:SQLITE)
// ==========================================================================

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'prudential.db');

export const db = new DatabaseSync(dbPath);

export function initDatabase() {
  // 1. Table: Users (Agents)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      agent_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      agency_name TEXT,
      role TEXT DEFAULT 'Agent',
      created_at TEXT NOT NULL
    );
  `);

  // 2. Table: Prospects (Project 100)
  db.exec(`
    CREATE TABLE IF NOT EXISTS prospects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      relation TEXT,
      job TEXT,
      estimated_income TEXT,
      temperature TEXT DEFAULT 'warm',
      stage TEXT DEFAULT 'suspect',
      money_qualified INTEGER DEFAULT 1,
      authority_qualified INTEGER DEFAULT 1,
      need_qualified INTEGER DEFAULT 1,
      target_follow_up TEXT,
      last_contact_date TEXT,
      last_objection TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 3. Table: Interaction History
  db.exec(`
    CREATE TABLE IF NOT EXISTS interaction_history (
      id TEXT PRIMARY KEY,
      prospect_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      channel TEXT NOT NULL,
      response TEXT NOT NULL,
      objection TEXT,
      next_action TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 4. Table: Policies (Portofolio Polis In-Force)
  db.exec(`
    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      policy_number TEXT NOT NULL,
      holder_name TEXT NOT NULL,
      insured_name TEXT NOT NULL,
      phone TEXT,
      product_name TEXT NOT NULL,
      premium_amount REAL NOT NULL,
      frequency TEXT NOT NULL,
      due_date TEXT,
      issued_date TEXT,
      status TEXT DEFAULT 'In-Force',
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 5. Table: Agent Goals (MDRT & KASH targets legacy table)
  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      yearly_ape_target REAL DEFAULT 600000000,
      monthly_prospect_target INTEGER DEFAULT 20,
      daily_contacts_target INTEGER DEFAULT 10,
      weekly_appointments_target INTEGER DEFAULT 3,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 6. Migration: Add needs_json to prospects if not exists
  try {
    db.exec(`ALTER TABLE prospects ADD COLUMN needs_json TEXT DEFAULT '[]'`);
  } catch {
    // Column already exists
  }

  // 7. Table: Dynamic Production Goals (User can add, edit, delete, track)
  db.exec(`
    CREATE TABLE IF NOT EXISTS production_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'APE',
      target_val REAL NOT NULL,
      current_val REAL DEFAULT 0,
      unit TEXT DEFAULT 'Rp',
      period TEXT DEFAULT 'Tahunan',
      deadline TEXT,
      status TEXT DEFAULT 'Active',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 8. Table: Extensible Objection Playbook (System + User Custom)
  db.exec(`
    CREATE TABLE IF NOT EXISTS objection_playbook (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      mindset TEXT NOT NULL,
      key_insight TEXT NOT NULL,
      script TEXT NOT NULL,
      is_custom INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // 9. Table: Financial Quotes / Calculations (Audits saved for prospects)
  db.exec(`
    CREATE TABLE IF NOT EXISTS financial_quotes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      prospect_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      inputs_json TEXT NOT NULL,
      results_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed default objection playbook if empty
  seedPlaybookIfEmpty();

  // Seed default goals if empty
  seedGoalsIfEmpty();
}

function seedPlaybookIfEmpty() {
  const countObj = db.prepare('SELECT COUNT(*) as count FROM objection_playbook').get();
  if (countObj.count === 0) {
    const defaultPlaybook = [
      {
        id: 'bpjs_kantor',
        title: '"Saya sudah punya BPJS dan asuransi dari kantor"',
        category: 'Double Protection',
        mindset: 'Nasabah merasa sudah aman karena setiap bulan sudah dipotong BPJS dan ada fasilitas asuransi grup dari kantor.',
        key_insight: 'Asuransi kantor terikat pada status karyawan (hilang jika resign/PHK/pensiun). BPJS sangat bagus namun memiliki sistem rujukan berjenjang dan kamar perawatan sesuai kelas, bukan 1 bed privat.',
        script: `“Wah mantap sekali, itu artinya perusahaan tempat Bapak/Ibu bekerja sangat peduli dan bertanggung jawab terhadap kesejahteraan karyawannya!\n\nBoleh saya tanya sedikit Bapak/Ibu, fasilitas asuransi kantor tersebut berlaku selama kita masih aktif bekerja di sana, betul ya? Kira-kira kalau suatu saat kita pensiun atau memutuskan buka usaha sendiri di usia 50 tahun ke atas, apakah perlindungan itu masih ikut bersama kita?\n\nDi asuransi, semakin bertambah usia dan ada riwayat sakit, kita sudah tidak bisa lagi mendaftar baru. Nah, fungsi kartu Prudential swasta ini bukan untuk menyaingi asuransi kantor, melainkan sebagai backup permanen pribadi yang dimiliki seumur hidup, plus memberikan kenyamanan kamar 1 pasien 1 bed (privat) bebas antre rujukan jika terjadi kondisi darurat.”`
      },
      {
        id: 'no_budget',
        title: '"Belum ada alokasi budget / uangnya lagi dipakai kebutuhan lain"',
        category: 'Prioritas Finansial',
        mindset: 'Nasabah menganggap asuransi sebagai pengeluaran tambahan (beban), bukan sebagai pos penyelamat aset.',
        key_insight: 'Jika untuk membayar premi 500rb - 1jt/bulan saja terasa berat, bayangkan bagaimana jika tiba-tiba divonis sakit kritis yang membutuhkan dana ratusan juta tunai sekaligus.',
        script: `“Saya sangat mengerti Bapak/Ibu, di kondisi sekarang kita memang harus bijak mengatur pos pengeluaran keluarga.\n\nBoleh saya izin bertanya satu hal yang menggelitik? Kira-kira jika saat ini kita menyisihkan 5-10% dari penghasilan bulanan terasa agak ketat, bagaimana jika amit-amit terjadi risiko kesehatan yang mengharuskan kita mengeluarkan 100-300 juta rupiah dalam tempo 3 hari ke depan? Mana yang kira-kira jauh lebih memberatkan keuangan keluarga?\n\nDi Prudential, kita tidak perlu langsung mengambil plan yang mahal. Kita bisa mulai dari fondasi dasar yang sangat terjangkau, yang penting pintu darurat keuangan keluarga sudah terkunci dari risiko kebangkrutan medis.”`
      },
      {
        id: 'discuss_spouse',
        title: '"Mau diskusi dulu dengan suami / istri / pasangan"',
        category: 'Otoritas Keputusan',
        mindset: 'Bisa jadi keberatan yang tulus karena keputusan keuangan diambil bersama, atau alasan sopan untuk menunda.',
        key_insight: 'Dukung niat baiknya karena proteksi keluarga memang harus diketahui pasangan. Namun, tawarkan untuk menjelaskan langsung kepada pasangan agar informasinya tidak bias.',
        script: `“Luar biasa Bapak/Ibu, saya sangat setuju! Keputusan besar demi perlindungan masa depan keluarga memang wajib dibicarakan berdua dengan pasangan tercinta.\n\nAgar Bapak/Ibu tidak repot menjelaskan ulang detail teknis angka-angka dan manfaatnya ke suami/istri (yang seringkali bikin pusing kalau bukan agennya yang bicara), bagaimana kalau besok malam atau weekend ini saya sempatkan mampir ngopi 15 menit, atau kita Zoom singkat bertiga santai?\n\nDengan begitu, jika suami/istri ada pertanyaan atau keraguan, saya bisa langsung bantu jawabkan dengan jelas tanpa membebani Bapak/Ibu. Kira-kira hari Sabtu sore atau Minggu pagi yang lebih santai?”`
      },
      {
        id: 'young_healthy',
        title: '"Saya masih muda dan sehat, belum butuh asuransi"',
        category: 'Waktu & Kesehatan',
        mindset: 'Merasa tubuh bugar, jarang ke dokter, sehingga menganggap asuransi baru diperlukan saat tua.',
        key_insight: 'Asuransi adalah satu-satunya produk di dunia yang harus dibeli saat kita BELUM membutuhkannya. Saat kita sudah butuh (sudah sakit/masuk RS), asuransi sudah tidak bisa dibeli lagi berapa pun uang yang kita punya.',
        script: `“Alhamdulillah, justru saat kondisi Bapak/Ibu sedang sehat prima dan muda seperti inilah waktu yang paling tepat dan paling hemat untuk memiliki proteksi!\n\nTahukah Bapak/Ibu, di asuransi ada prinsip sederhana: Kita membeli asuransi bukan dengan uang, melainkan dengan KESEHATAN kita. Uang hanya alat pembayar preminya saja. Begitu seseorang divonis kolesterol tinggi, diabetes, atau kista, perusahaan asuransi bisa menolak atau mengecualikan penyakit tersebut seumur hidup.\n\nSelain itu, karena Bapak/Ibu masih muda, preminya saat ini adalah premi terendah yang pernah ada. Kalau kita tunggu 5 atau 10 tahun lagi, preminya akan jauh lebih tinggi untuk manfaat yang sama persis.”`
      },
      {
        id: 'syariah_halal',
        title: '"Apakah asuransi tidak riba / bagaimana hukum syariahnya?"',
        category: 'Kepatuhan Syariah',
        mindset: 'Nasabah memiliki prinsip keagamaan yang kuat dan khawatir dengan unsur ketidakpastian (gharar), judi (maysir), atau bunga (riba).',
        key_insight: 'Prudential memiliki unit Prudential Syariah mandiri resmi yang diawasi langsung oleh Dewan Syariah Nasional (DSN - MUI) dengan prinsip tolong-menolong (Ta\'awun).',
        script: `“Pertanyaan yang sangat mulia Bapak/Ibu! Ini bukti kehati-hatian kita dalam menjaga keberkahan nafkah keluarga.\n\nKabar baiknya, Prudential memiliki entitas berbadan hukum terpisah yaitu PT Prudential Sharia Life Assurance (Prudential Syariah) yang diawasi langsung oleh Dewan Pengawas Syariah dari DSN-MUI (Majelis Ulama Indonesia).\n\nDi Prudential Syariah, konsepnya bukan jual-beli risiko, melainkan Ta'awun (Tolong Menolong). Dana premi para peserta dikumpulkan ke dalam rekening Dana Tabarru'. Jika ada peserta yang mengalami musibah sakit atau meninggal, dana tersebut digunakan bersama untuk saling menolong sesama peserta secara adil, transparan, dan bebas dari unsur riba, gharar, maupun maysir.”`
      },
      {
        id: 'claim_trauma',
        title: '"Pernah dengar cerita asuransi susah klaim / agennya menghilang"',
        category: 'Reputasi & Layanan',
        mindset: 'Pernah membaca berita viral di media sosial atau punya kerabat yang klaimnya ditolak karena ketidaktahuan prosedur.',
        key_insight: '99% klaim ditolak terjadi karena 2 hal: Pre-existing condition (penyakit sudah ada sebelum daftar tapi disembunyikan/tidak jujur saat SPAJ), atau penyakit terjadi dalam masa tunggu (waiting period). Jelaskan komitmen pendampingan Anda.',
        script: `“Saya sangat memahami kekhawatiran Bapak/Ibu. Wajar sekali jika Bapak/Ibu bersikap waspada dan ingin memastikan uang yang disetorkan aman.\n\nNamun faktanya Bapak/Ibu, setiap tahunnya Prudential membayarkan klaim puluhan triliun rupiah di Indonesia secara tertib. Klaim yang bermasalah biasanya terjadi karena 2 hal: riwayat penyakit masa lalu yang tidak diisi jujur saat awal daftar, atau masih dalam masa tunggu (waiting period).\n\nItulah mengapa peran saya sebagai Tenaga Pemasar resmi berlisensi hadir di sini: tugas saya adalah memastikan sejak hari pertama semua data riwayat medis diisi secara transparan agar di kemudian hari klaim berjalan lancar tanpa celah. Dan saat ini proses klaim Rumah Sakit Rekanan Prudential sudah berbasis sistem Cashless digital via PRUForce/PRUServices.”`
      },
      {
        id: 'too_expensive',
        title: '"Preminya kemahalan per bulan"',
        category: 'Penyesuaian Anggaran',
        mindset: 'Melihat nominal premi sebagai pengeluaran hangus yang tinggi.',
        key_insight: 'Bandingkan dengan biaya gaya hidup harian atau tawarkan opsi plan dengan fitur deductible.',
        script: `“Terima kasih masukannya Bapak/Ibu. Boleh tahu, nominal yang menurut Bapak/Ibu paling nyaman di kantong setiap bulannya kira-kira di angka berapa?\n\nSeringkali premi terasa besar jika dilihat sebagai angka akumulasi tahunan. Namun jika kita cermati, premi Rp 30.000 - Rp 50.000 per hari sebenarnya setara dengan alokasi harian yang biasa kita keluarkan tanpa terasa.\n\nBedanya, di Prudential alokasi tersebut mengamankan keuangan keluarga hingga miliaran rupiah jika terjadi musibah rawat inap. Dan yang terpenting, proposal ini sangat fleksibel dan dapat kami sesuaikan tepat sesuai ketersediaan anggaran Bapak/Ibu.”`
      },
      {
        id: 'agent_resigns',
        title: '"Nanti kalau agennya berhenti / resign, polis saya bagaimana?"',
        category: 'Kontinuitas Polis',
        mindset: 'Khawatir tidak ada yang mengurus jika agen yang mengajaknya berganti profesi.',
        key_insight: 'Kontrak polis adalah antara Pemegang Polis dengan PT Prudential Life Assurance, bukan dengan pribadi agen. Kantor cabang agensi dan Customer Care Prudential selalu siap, plus sistem transfer servicing agent.',
        script: `“Pertanyaan yang sangat penting dan bijak Bapak/Ibu!\n\nPerlu kami sampaikan bahwa kontrak asuransi yang sah dibuat antara Bapak/Ibu dengan PT Prudential Life Assurance (institusi yang telah beroperasi lebih dari 175 tahun secara global). Hak manfaat perlindungan Bapak/Ibu dijamin secara hukum oleh korporasi.\n\nSecara profesional, saya mendedikasikan karier ini untuk jangka panjang dan agensi kami memiliki tim operasional yang lengkap. Selain itu, Prudential memiliki mekanisme penunjukan Servicing Agent resmi serta layanan Customer Line dan kantor agensi di seluruh kota besar di Indonesia.”`
      }
    ];

    const insertStmt = db.prepare(`
      INSERT INTO objection_playbook (id, user_id, title, category, mindset, key_insight, script, is_custom, created_at)
      VALUES (?, 'system', ?, ?, ?, ?, ?, 0, ?)
    `);

    for (const item of defaultPlaybook) {
      insertStmt.run(item.id, item.title, item.category, item.mindset, item.key_insight, item.script, new Date().toISOString());
    }
  }
}

function seedGoalsIfEmpty() {
  const countGoals = db.prepare('SELECT COUNT(*) as count FROM production_goals').get();
  if (countGoals.count === 0) {
    const insertGoal = db.prepare(`
      INSERT INTO production_goals (id, user_id, title, category, target_val, current_val, unit, period, deadline, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
    `);

    const users = db.prepare('SELECT id FROM users').all();
    for (const u of users) {
      insertGoal.run(`g-mdrt-${u.id}`, u.id, 'Kualifikasi MDRT (Million Dollar Round Table) 2026', 'MDRT', 600000000, 0, 'Rp', 'Tahunan', '2026-12-31', new Date().toISOString());
      insertGoal.run(`g-case-${u.id}`, u.id, 'Target Produksi 24 Polis Baru (Case Count)', 'Cases', 24, 0, 'Polis', 'Tahunan', '2026-12-31', new Date().toISOString());
      insertGoal.run(`g-star-${u.id}`, u.id, 'Target Star Club Trip Paris 2026', 'Trip', 250000000, 0, 'Rp', 'Tahunan', '2026-10-31', new Date().toISOString());
      insertGoal.run(`g-contact-${u.id}`, u.id, 'Aktivitas Harian: 10 Kontak / Hari', 'Contacts', 10, 0, 'Nama', 'Harian', '2026-12-31', new Date().toISOString());
    }
  }
}

function seedInitialData() {
  // No-op: Demo accounts removed
}

function _unusedLegacySeed() {

  // Agent 1 Goals
  db.prepare(`
    INSERT INTO agent_goals (id, user_id, yearly_ape_target, monthly_prospect_target, daily_contacts_target, weekly_appointments_target)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('goal_1', agent1Id, 600000000, 25, 10, 3);

  // Agent 1 Prospects
  const prospectsAgent1 = [
    {
      id: 'p-b1',
      name: 'Budi Santoso',
      phone: '081234567890',
      address: 'Menteng, Jakarta Pusat',
      relation: 'Teman Kuliah',
      job: 'Senior Software Engineer',
      income: 'Rp 20.000.000 - Rp 30.000.000',
      temp: 'hot',
      stage: 'presentation',
      target: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      lastContact: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      lastObj: 'Mau diskusikan dulu dengan pasangan/suami/istri',
      notes: 'Keluarga dengan 1 balita. Sangat peduli perlindungan rawat inap swasta bebas cashless.',
      history: [
        {
          id: 'h-b1-1',
          channel: 'WhatsApp',
          date: new Date(Date.now() - 3 * 86400000).toISOString(),
          response: 'Menyambut baik diajak ngobrol, setuju jadwalkan Zoom meeting.',
          objection: '-',
          next: 'Kirim link Zoom dan rancang simulasi PRUSolusi Sehat.'
        },
        {
          id: 'h-b1-2',
          channel: 'Zoom',
          date: new Date(Date.now() - 86400000).toISOString(),
          response: 'Presentasi ilustrasi kamar 1 bed berjalan lancar. Budi suka manfaat cashless-nya.',
          objection: 'Mau diskusikan dulu dengan pasangan/suami/istri',
          next: 'Follow up besok sore setelah Budi bincang dengan istri.'
        }
      ]
    },
    {
      id: 'p-b2',
      name: 'Siti Rahmawati',
      phone: '081398765432',
      address: 'Kebayoran Baru, Jakarta Selatan',
      relation: 'Rekan Kerja / Kantor',
      job: 'Finance Manager',
      income: 'Rp 25.000.000 - Rp 35.000.000',
      temp: 'hot',
      stage: 'closing',
      target: new Date().toISOString().split('T')[0],
      lastContact: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      lastObj: '-',
      notes: 'Sudah setuju ambil PRUCritical + PRUWarisan premi Rp 1.5jt/bln. Tinggal lengkapi foto KTP.',
      history: [
        {
          id: 'h-b2-1',
          channel: 'Kopi Darat',
          date: new Date(Date.now() - 5 * 86400000).toISOString(),
          response: 'Fact finding kebutuhan proteksi warisan untuk masa depan anak.',
          objection: 'Sudah punya BPJS & asuransi dari kantor',
          next: 'Edukasi limit asuransi kantor dan proteksi kritis jangka panjang.'
        },
        {
          id: 'h-b2-2',
          channel: 'WhatsApp',
          date: new Date(Date.now() - 2 * 86400000).toISOString(),
          response: 'Setuju proposal rekomendasi. Minta dibantu proses pengisian formulir e-SPAJ.',
          objection: '-',
          next: 'Pandu pengisian e-SPAJ hari ini via PRUForce.'
        }
      ]
    },
    {
      id: 'p-b3',
      name: 'Dimas Prasetyo',
      phone: '085712348899',
      address: 'Gading Serpong, Tangerang',
      relation: 'Komunitas / Hobi',
      job: 'Owner Coffee Shop',
      income: 'Rp 15.000.000 - Rp 25.000.000',
      temp: 'warm',
      stage: 'appointment',
      target: new Date().toISOString().split('T')[0],
      lastContact: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
      lastObj: 'Merasa masih muda & sehat, belum butuh',
      notes: 'Teman gowes sepeda. Mandiri secara finansial tapi belum punya proteksi swasta.',
      history: [
        {
          id: 'h-b3-1',
          channel: 'WhatsApp',
          date: new Date(Date.now() - 4 * 86400000).toISOString(),
          response: 'Mau ketemu ngopi di cafenya untuk ngobrol santai seputar income protection.',
          objection: 'Merasa masih muda & sehat, belum butuh',
          next: 'Janji temu ngopi hari ini jam 16:00.'
        }
      ]
    },
    {
      id: 'p-b4',
      name: 'dr. Anita Wijaya',
      phone: '081822334455',
      address: 'Kelapa Gading, Jakarta Utara',
      relation: 'Keluarga / Saudara',
      job: 'Dokter Umum',
      income: 'Rp 30.000.000+',
      temp: 'hot',
      stage: 'issued',
      target: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      lastContact: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      lastObj: '-',
      notes: 'Polis PRUSolusi Sehat Plus Pro sudah terbit. Jadwalkan delivery polis & minta 3 referensi.',
      history: [
        {
          id: 'h-b4-1',
          channel: 'Telepon',
          date: new Date(Date.now() - 10 * 86400000).toISOString(),
          response: 'Closing SPAJ dan verifikasi tele-underwriting selesai.',
          objection: '-',
          next: 'Pantau polis terbit di PRUForce.'
        }
      ]
    },
    {
      id: 'p-b5',
      name: 'Hendra Gunawan',
      phone: '081599887766',
      address: 'Bintaro Jaya, Tangerang Selatan',
      relation: 'Teman Sekolah (SD/SMP/SMA)',
      job: 'Digital Marketing Lead',
      income: 'Rp 15.000.000 - Rp 20.000.000',
      temp: 'warm',
      stage: 'fact_finding',
      target: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      lastContact: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      lastObj: 'Premi dirasa terlalu berat per bulan',
      notes: 'Mau proteksi kesehatan keluarga tapi budget bulanan dibatasi Rp 800rb - 1jt.',
      history: []
    }
  ];

  const insertProspect = db.prepare(`
    INSERT INTO prospects (
      id, user_id, name, phone, address, relation, job, estimated_income,
      temperature, stage, money_qualified, authority_qualified, need_qualified,
      target_follow_up, last_contact_date, last_objection, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertHistory = db.prepare(`
    INSERT INTO interaction_history (
      id, prospect_id, user_id, date, channel, response, objection, next_action, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  prospectsAgent1.forEach(p => {
    insertProspect.run(
      p.id,
      agent1Id,
      p.name,
      p.phone,
      p.address,
      p.relation,
      p.job,
      p.income,
      p.temp,
      p.stage,
      1, 1, 1,
      p.target,
      p.lastContact,
      p.lastObj,
      p.notes,
      new Date().toISOString()
    );

    p.history.forEach(h => {
      insertHistory.run(
        h.id,
        p.id,
        agent1Id,
        h.date,
        h.channel,
        h.response,
        h.objection,
        h.next,
        new Date().toISOString()
      );
    });
  });

  // Agent 1 Policies (Portofolio Polis In-Force)
  const insertPolicy = db.prepare(`
    INSERT INTO policies (
      id, user_id, policy_number, holder_name, insured_name, phone,
      product_name, premium_amount, frequency, due_date, issued_date, status, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPolicy.run(
    'pol-1',
    agent1Id,
    'POL-PRU-9821034',
    'dr. Anita Wijaya',
    'dr. Anita Wijaya',
    '081822334455',
    'PRUSolusi Sehat Plus Pro (Plan Diamond)',
    2400000,
    'Bulanan',
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], // 15 hari lagi
    '2026-02-15',
    'In-Force',
    'Kamar 1 Bed VIP, wilayah pertanggungan Asia Tenggara, manfaat cashless limit Rp 20 Milyar/tahun.',
    new Date().toISOString()
  );

  insertPolicy.run(
    'pol-2',
    agent1Id,
    'POL-PRU-8874129',
    'Bambang Susilo',
    'Bambang Susilo & Keluarga',
    '081122334455',
    'PRUWarisan & PRUCritical Protection',
    18000000,
    'Tahunan',
    new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], // 5 hari lagi (perlu diingatkan!)
    '2025-10-10',
    'In-Force',
    'UP Jiwa Rp 2 Milyar + Proteksi 60 Kondisi Kritis Tahap Awal sampai Akhir.',
    new Date().toISOString()
  );

  // Agent 2: Rina Amelia (Bandung)
  const agent2Id = 'usr_rina_02';
  db.prepare(`
    INSERT INTO users (id, agent_code, name, email, password, agency_name, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    agent2Id,
    'PRU-002',
    'Rina Amelia',
    'rina@prudential.id',
    'pru123',
    'KPM Pru Champion Bandung',
    'Associate Agency Director',
    new Date().toISOString()
  );

  db.prepare(`
    INSERT INTO agent_goals (id, user_id, yearly_ape_target, monthly_prospect_target, daily_contacts_target, weekly_appointments_target)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('goal_2', agent2Id, 750000000, 30, 12, 4);

  // Agent 2 Prospects (Different data!)
  insertProspect.run(
    'p-r1',
    agent2Id,
    'Ahmad Fauzi',
    '081700998877',
    'Dago, Bandung',
    'Teman Komunitas',
    'Arsitek & Desainer',
    'Rp 15.000.000 - Rp 25.000.000',
    'hot',
    'closing',
    1, 1, 1,
    new Date().toISOString().split('T')[0],
    new Date(Date.now() - 86400000).toISOString().split('T')[0],
    '-',
    'Ambil PRUCinta proteksi syariah keluarga.',
    new Date().toISOString()
  );

  insertProspect.run(
    'p-r2',
    agent2Id,
    'Dewi Lestari',
    '085611223388',
    'Buah Batu, Bandung',
    'Rekan Bisnis',
    'Owner Bakery & Cafe',
    'Rp 20.000.000 - Rp 30.000.000',
    'warm',
    'appointment',
    1, 1, 1,
    new Date(Date.now() + 86400000).toISOString().split('T')[0],
    new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    'Mau diskusi suami dulu',
    'Janji temu ngopi hari Selasa sore.',
    new Date().toISOString()
  );

  insertPolicy.run(
    'pol-r1',
    agent2Id,
    'POL-PRU-7766554',
    'Ahmad Fauzi',
    'Ahmad Fauzi',
    '081700998877',
    'PRUCinta Syariah',
    1200000,
    'Bulanan',
    new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
    '2026-01-10',
    'In-Force',
    'Polis proteksi jiwa berbasis syariah dengan manfaat pengembalian premi.',
    new Date().toISOString()
  );

  console.log('Database initialized and successfully seeded!');
}
