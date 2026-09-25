// ==========================================================================
// AGENTPROSPECT PRO - DATABASE INITIALIZATION & SCHEMA (SQLITE)
// ==========================================================================

import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

export const db = new DatabaseSync(config.dbPath);

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

  // 2. Table: Agent Goals (MDRT & Annual Parameters)
  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      yearly_ape_target REAL DEFAULT 600000000,
      monthly_prospect_target INTEGER DEFAULT 20,
      daily_contacts_target INTEGER DEFAULT 10,
      weekly_appointments_target INTEGER DEFAULT 3,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 3. Table: Prospects (Project 100)
  db.exec(`
    CREATE TABLE IF NOT EXISTS prospects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      owner TEXT DEFAULT 'Yusuf',
      address TEXT,
      relation TEXT,
      job TEXT,
      estimated_income TEXT,
      temperature TEXT DEFAULT 'warm',
      stage TEXT DEFAULT 'suspect',
      money_qualified INTEGER DEFAULT 0,
      authority_qualified INTEGER DEFAULT 0,
      need_qualified INTEGER DEFAULT 0,
      target_follow_up TEXT,
      last_contact_date TEXT,
      last_objection TEXT,
      notes TEXT,
      needs_json TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 4. Table: Interaction History
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
      target_date TEXT,
      FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 5. Table: In-Force Policies
  db.exec(`
    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      prospect_id TEXT,
      policy_number TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      insured_name TEXT NOT NULL,
      client_phone TEXT,
      product_name TEXT NOT NULL,
      product_type TEXT NOT NULL,
      premium_amount REAL NOT NULL,
      payment_frequency TEXT NOT NULL,
      ape_amount REAL NOT NULL,
      sum_assured REAL NOT NULL,
      start_date TEXT NOT NULL,
      next_due_date TEXT NOT NULL,
      status TEXT DEFAULT 'In Force',
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 6. Table: Dynamic Production Goals
  db.exec(`
    CREATE TABLE IF NOT EXISTS production_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
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

  // 7. Table: Objection Playbook
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

  // 8. Table: Financial Calculations / Quotes
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

  // RUN AUTO-MIGRATIONS FOR PRE-EXISTING TABLES
  runMigrations();

  // SEED DEFAULT AGENTS & DATA IF NOT PRESENT
  seedInitialData();
}

function ensureColumn(table, column, definition) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = cols.some(c => c.name === column);
    if (!exists) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  } catch (err) {
    // Ignore migration error if already exists
  }
}

function runMigrations() {
  // 0. Users Migrations
  ensureColumn('users', 'phone', 'TEXT');

  // 1. Policies Table Migrations
  ensureColumn('policies', 'ape_amount', 'REAL DEFAULT 0');
  ensureColumn('policies', 'product_type', "TEXT DEFAULT 'Proteksi'");
  ensureColumn('policies', 'sum_assured', 'REAL DEFAULT 0');
  ensureColumn('policies', 'start_date', 'TEXT');
  ensureColumn('policies', 'next_due_date', 'TEXT');
  ensureColumn('policies', 'client_name', 'TEXT');
  ensureColumn('policies', 'client_phone', 'TEXT');
  ensureColumn('policies', 'payment_frequency', "TEXT DEFAULT 'Monthly'");
  ensureColumn('policies', 'prospect_id', 'TEXT');
  ensureColumn('policies', 'claim_history', 'TEXT');

  // 2. Interaction History Migrations
  ensureColumn('interaction_history', 'target_date', 'TEXT');

  // 3. Prospects Migrations
  ensureColumn('prospects', 'updated_at', 'TEXT');
  ensureColumn('prospects', 'needs_json', "TEXT DEFAULT '[]'");
  ensureColumn('prospects', 'owner', "TEXT DEFAULT 'Yusuf'");

  // 4. Data Backfill
  try {
    db.exec(`
      UPDATE policies SET client_name = COALESCE(client_name, holder_name, 'Nasabah') WHERE client_name IS NULL;
      UPDATE policies SET client_phone = COALESCE(client_phone, phone, '-') WHERE client_phone IS NULL;
      UPDATE policies SET start_date = COALESCE(start_date, issued_date, created_at, '2026-01-01') WHERE start_date IS NULL;
      UPDATE policies SET next_due_date = COALESCE(next_due_date, due_date, '2026-10-01') WHERE next_due_date IS NULL;
      UPDATE policies SET payment_frequency = COALESCE(payment_frequency, frequency, 'Monthly') WHERE payment_frequency IS NULL;
      UPDATE policies SET ape_amount = CASE 
        WHEN payment_frequency = 'Monthly' THEN premium_amount * 12
        WHEN payment_frequency = 'Quarterly' THEN premium_amount * 4
        WHEN payment_frequency = 'Semi-Annually' THEN premium_amount * 2
        ELSE premium_amount
      END WHERE ape_amount = 0 OR ape_amount IS NULL;
      UPDATE prospects SET updated_at = created_at WHERE updated_at IS NULL;
    `);
  } catch (err) {
    // Ignore sync error if columns already match
  }
}

function seedInitialData() {
  // No-op: Demo accounts removed
}

function _unusedLegacySeed() {
  // Demo seed removed
}

export function resetAllProspectAndPolicyData() {
  try {
    db.exec(`
      DELETE FROM prospects;
      DELETE FROM interaction_history;
      DELETE FROM policies;
      DELETE FROM financial_quotes;
      UPDATE production_goals SET current_val = 0;
    `);
    console.log('[DATABASE] Clean wipe completed: 0 prospects, 0 policies, 0 quotes, current_val reset to 0.');
  } catch (err) {
    console.error('[DATABASE] Reset error:', err);
  }
}

function seedDefaultPlaybook(now) {
  const defaultPlaybook = [
    {
      id: 'pb_01',
      user_id: 'system',
      title: '“Saya sudah ada BPJS Kesehatan dan asuransi dari kantor”',
      category: 'Manfaat & Kebutuhan',
      mindset: 'Apresiasi fasilitas yang dimiliki. Jangan menjelekkan kantor, posisikan asuransi pribadi sebagai pelindung permanen saat pensiun, resign, atau terjadi PHK karena sakit berat.',
      key_insight: 'Fasilitas kantor menempel pada jabatan, bukan pribadi. Saat pensiun atau sakit kritis berkepanjangan yang menyebabkan PHK, fasilitas kesehatan kantor otomatis terputus. Membuka polis baru di usia 55+ tahun dengan riwayat sakit sangat mahal atau ditolak.',
      script: `“Luar biasa Bapak/Ibu! Itu membuktikan perusahaan tempat Bapak/Ibu berkarier sangat bonafide dan peduli pada karyawannya.

Namun izinkan saya bertanya satu hal: fasilitas asuransi kantor tersebut menempel pada nama Bapak/Ibu secara pribadi, atau menempel pada status jabatan karyawan?

Jika suatu saat Bapak/Ibu pensiun di usia 55 atau terjadi risiko sakit kritis berkepanjangan yang menyebabkan PHK, proteksi kantor tentu terputus. Di usia 55+ tahun atau setelah ada riwayat sakit, membuka asuransi baru biayanya sangat tinggi atau bahkan ditolak. Karena itu, para profesional bijak menyiapkan asuransi kesehatan kamar 1 bed privat sebagai 'pondasi pribadi' seumur hidup. Boleh kita hitung opsi premi hematnya?”`,
      is_custom: 0
    },
    {
      id: 'pb_02',
      user_id: 'system',
      title: '“Uang lebih baik diputar di instrumen saham, reksadana, atau modal bisnis”',
      category: 'Skema & Investasi',
      mindset: 'Calon nasabah adalah investor cerdas. Validasi kehebatan bisnis mereka, posisikan asuransi sebagai sistem proteksi gembok pengaman agar aset investasi tidak terpaksa dicairkan paksa (forced liquidation).',
      key_insight: 'Piramida Keuangan CFP: Proteksi adalah pondasi sebelum investasi. Jika tagihan rumah sakit Rp 500 juta datang, apakah nasabah rela menjual saham saat pasar sedang crash? Alokasi premi 5% mengamankan 95% portofolio investasi lainnya.',
      script: `“Saya sangat sepakat dengan prinsip Bapak/Ibu! Memutar uang di bisnis atau pasar modal memang instrumen terbaik untuk pertumbuhan kekayaan.

Namun izinkan saya berbagi sudut pandang perencana keuangan: ketika Bapak/Ibu membangun gedung komersial senilai puluhan miliar, apakah merasa perlu memasang instalasi pemadam kebakaran dan pintu darurat?

Tentu ya. Bisnis Bapak/Ibu adalah gedungnya, dan asuransi adalah sistem pemadam kebakarannya. Kita tidak ingin saat musibah medis datang dengan tagihan Rp 500 juta, Bapak/Ibu terpaksa menjual aset saham atau menarik modal kerja di saat harga sedang turun. Cukup sisihkan 5% cashflow, maka 95% aset lainnya terlindungi seutuhnya.”`,
      is_custom: 0
    },
    {
      id: 'pb_03',
      user_id: 'system',
      title: '“Premi terasa mahal / Sedang belum ada anggaran alokasi asuransi”',
      category: 'Premi & Biaya',
      mindset: 'Nasabah memandang premi sebagai pos belanja konsumtif, bukan pengungkit risiko (financial leverage). Tunjukkan rasio perbandingan antara biaya premi kecil vs tagihan rumah sakit besar.',
      key_insight: 'Jika menyisihkan premi Rp 30.000 - Rp 50.000 sehari terasa berat, maka menanggung sendiri biaya rumah sakit Rp 100 juta - 300 juta tunai dalam tempo 24 jam adalah kebangkrutan finansial.',
      script: `“Saya sangat memahami Bapak/Ibu. Mengelola arus kas keluarga memang membutuhkan kehati-hatian dalam setiap pos pengeluaran.

Namun mari kita telaah bersama: jika untuk menyisihkan premi Rp 30.000 hingga Rp 50.000 per hari—setara secangkir kopi—kita merasa perlu berpikir panjang, bayangkan betapa beratnya beban keluarga jika tiba-tiba pihak rumah sakit meminta deposit tunai Rp 100 juta dalam 24 jam karena tindakan operasi darurat?

Asuransi hadir bukan untuk menambah beban belanja, melainkan memindahkan risiko ratusan juta tersebut ke perusahaan asuransi dengan premi terukur yang disesuaikan dengan kapasitas Bapak/Ibu saat ini.”`,
      is_custom: 0
    },
    {
      id: 'pb_04',
      user_id: 'system',
      title: '“Premi hangus kalau saya sehat walafiat / Merasa rugi ikut asuransi”',
      category: 'Premi & Biaya',
      mindset: 'Calon nasabah menginginkan jaminan modal kembali. Tawarkan solusi produk tradisional atau Syariah yang memiliki fitur Guaranteed Return of Premium.',
      key_insight: 'Kita membeli helm atau tabung pemadam api bukan berharap terjadi kecelakaan, melainkan demi ketenangan pikiran. Selain itu, tersedia program proteksi syariah di mana premi dikembalikan 100% bila nasabah sehat hingga akhir masa pertanggungan.',
      script: `“Sangat wajar jika Bapak/Ibu berpikir demikian. Kabar baiknya, industri asuransi modern telah bertransformasi!

Tersedia program asuransi syariah khusus: jika selama masa perlindungan 20 tahun Bapak/Ibu senantiasa diberikan kesehatan prima oleh Tuhan Yang Maha Esa, maka 100% total premi yang telah disetorkan akan dikembalikan utuh tanpa potongan.

Artinya, jika terjadi risiko, keluarga menerima Uang Pertanggungan hingga miliaran rupiah. Jika sehat walafiat, seluruh uang kembali 100%. Jadi tidak ada istilah uang hangus. Boleh kita hitung simulasinya?”`,
      is_custom: 0
    },
    {
      id: 'pb_05',
      user_id: 'system',
      title: '“Klaim asuransi katanya dipersulit dan banyak syarat tersembunyi”',
      category: 'Kepercayaan & Klaim',
      mindset: 'Pahami kekhawatiran nasabah akibat berita miring. Edukasikan prinsip keterbukaan penuh (Utmost Good Faith) dan tunjukkan integritas pembayaran klaim perusahaan asuransi jiwa terpercaya.',
      key_insight: 'Industri asuransi jiwa terpercaya membayarkan klaim puluhan triliun rupiah setiap tahunnya. Mayoritas klaim tertunda disebabkan karena adanya riwayat medis terdahulu yang tidak dideklarasikan saat pendaftaran (pre-existing condition) atau masa tunggu polis.',
      script: `“Saya sangat berterima kasih Bapak/Ibu telah menyampaikan kekhawatiran ini secara terbuka. Berita klaim yang dipersulit seringkali membuat kita ragu.

Faktanya, industri asuransi jiwa membayarkan klaim dan manfaat puluhan triliun rupiah setiap tahunnya kepada ratusan ribu keluarga di Indonesia.

Penolakan klaim umumnya terjadi hanya karena dua hal: ada riwayat penyakit yang disembunyikan saat mendaftar, atau klaim diajukan pada masa tunggu awal polis. Tugas saya sebagai konsultan resmi Bapak/Ibu adalah memastikan pengisian Surat Pengajuan Asuransi Jiwa (SPAJ) dilakukan secara 100% jujur dan transparan, sehingga saat risiko terjadi, hak klaim Bapak/Ibu dijamin cair lancar tanpa kendala hukum.”`,
      is_custom: 0
    },
    {
      id: 'pb_06',
      user_id: 'system',
      title: '“Saya masih muda, rajin olahraga, dan sehat walafiat”',
      category: 'Manfaat & Kebutuhan',
      mindset: 'Validasi gaya hidup sehat nasabah. Edukasikan bahwa asuransi adalah satu-satunya produk di dunia yang harus dibeli saat kita belum membutuhkannya.',
      key_insight: 'Asuransi tidak bisa dibeli di ranjang rumah sakit. Saat tubuh sudah divonis penyakit, perusahaan asuransi manapun di dunia tidak akan bersedia menanggung risiko tersebut. Membeli saat muda memberikan premi termurah sepanjang usia.',
      script: `“Luar biasa! Gaya hidup sehat dan rajin berolahraga adalah aset termahal yang Bapak/Ibu miliki saat ini.

Namun tahukah Bapak/Ibu, asuransi adalah satu-satunya instrumen di dunia yang hanya bisa dibeli saat kita sehat dan belum membutuhkannya?

Ketika seseorang sudah divonis kanker, jantung, atau stroke, berapapun uang yang disiapkan, tidak ada perusahaan asuransi yang bersedia menerima pengajuan polis baru. Membuka polis di usia prima saat ini mengunci premi paling murah dengan penerimaan medis 100% tanpa pengecualian.”`,
      is_custom: 0
    },
    {
      id: 'pb_07',
      user_id: 'system',
      title: '“Apakah asuransi sesuai dengan kaidah hukum Syariah?”',
      category: 'Syariah',
      mindset: 'Tunjukkan penghormatan pada prinsip spiritual nasabah. Jelaskan akad Tabarru (tolong-menolong) yang diawasi langsung oleh Dewan Syariah Nasional MUI.',
      key_insight: 'Asuransi Syariah beroperasi secara terpisah dengan izin OJK dan Dewan Pengawas Syariah (DPS) DSN-MUI. Menggunakan akad hibah tolong-menolong (Ta’awun), bebas dari unsur Riba, Gharar, dan Maisir, serta memiliki fitur wakaf manfaat asuransi.',
      script: `“Pertanyaan yang sangat mulia Bapak/Ibu. Sebagai Muslim, memastikan setiap ikhtiar finansial kita sesuai syariat adalah kewajiban utama.

Asuransi Syariah diawasi langsung oleh Dewan Syariah Nasional Majelis Ulama Indonesia (DSN-MUI). Sistem kami tidak menggunakan jual-beli risiko, melainkan akad Tabarru’ di mana seluruh peserta saling menolong saat ada saudara peserta lain tertimpa musibah.

Bahkan, polis asuransi syariah dilengkapi fitur Wakaf Manfaat Asuransi resmi ke lembaga nazhir bersertifikasi BWI, sehingga menjadi amal jariyah yang pahalanya terus mengalir abadi.”`,
      is_custom: 0
    },
    {
      id: 'pb_08',
      user_id: 'system',
      title: '“Bagaimana kalau agen yang melayani saya berhenti atau resign di kemudian hari?”',
      category: 'Agen & Pelayanan',
      mindset: 'Tunjukkan komitmen profesionalitas jangka panjang dan sistem korporasi asuransi yang memiliki perlindungan nasabah berlapis.',
      key_insight: 'Kontrak polis dibuat antara nasabah dengan korporasi asuransi jiwa berizin OJK, bukan perorangan agen. Perusahaan asuransi memiliki Customer Line resmi, kantor agensi di seluruh kota, dan sistem penunjukan Servicing Agent otomatis.',
      script: `“Kekhawatiran yang sangat masuk akal Bapak/Ibu. Banyak nasabah merasa cemas jika agen mereka tidak aktif lagi.

Perlu kami sampaikan bahwa kontrak asuransi yang sah dibuat antara Bapak/Ibu dengan perusahaan asuransi jiwa resmi yang berizin dan diawasi oleh Otoritas Jasa Keuangan (OJK). Hak manfaat perlindungan Bapak/Ibu dijamin secara hukum oleh korporasi.

Secara profesional, saya mendedikasikan karier ini untuk jangka panjang dan agensi kami memiliki tim operasional yang lengkap. Selain itu, perusahaan asuransi memiliki mekanisme penunjukan Servicing Agent resmi serta kantor layanan di seluruh kota besar di Indonesia.”`,
      is_custom: 0
    }
  ];

  const insertPbStmt = db.prepare(`
    INSERT INTO objection_playbook (id, user_id, title, category, mindset, key_insight, script, is_custom, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  defaultPlaybook.forEach(pb => {
    insertPbStmt.run(pb.id, pb.user_id, pb.title, pb.category, pb.mindset, pb.key_insight, pb.script, pb.is_custom, now);
  });
}
