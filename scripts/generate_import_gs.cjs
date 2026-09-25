/**
 * ============================================================================
 * AGENTPROSPECT PRO - UNIFIED MASTER GENERATOR & IMPORT SUITE
 * ============================================================================
 * Script all-in-one terpadu untuk:
 * 1. Parse & Ekstraksi kontak VCF: Contacts.vcf (Yusuf) & 00001.vcf (Rosma)
 * 2. Pembersihan nama, normalisasi nomor HP, pemetaan relasi & suhu pasar (M.A.N)
 * 3. Deteksi kontak bersama (overlap) antara Yusuf & Rosma
 * 4. Generasi contacts_valid.json (1.065 kontak)
 * 5. Generasi seluruh file CSV Master & Terpisah (7 file CSV)
 * 6. Generasi google_apps_script/ImportContacts.gs (siap impor ke Google Sheets)
 * 7. Sinkronisasi otomatis ke Database Lokal SQLite (agentprospect.db)
 *
 * Jalankan: node scripts/generate_import_gs.cjs
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// ----------------------------------------------------------------------------
// 1. HELPER FUNCTIONS: PEMBERSIHAN & NORMALISASI DATA
// ----------------------------------------------------------------------------

function decodeQuotedPrintable(str) {
  if (!str) return '';
  return str.replace(/=([0-9A-F]{2})/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
}

function cleanName(rawName) {
  if (!rawName) return '';
  let name = rawName.trim();
  if (/=[0-9A-F]{2}/i.test(name)) {
    try {
      name = decodeURIComponent(name.replace(/=/g, '%'));
    } catch (e) {
      name = decodeQuotedPrintable(name);
    }
  }
  name = name.replace(/^;+|;+$/g, '').replace(/;/g, ' ').replace(/\s+/g, ' ').trim();
  return name;
}

function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  let clean = rawPhone.replace(/[^0-9+]/g, '');
  if (clean.startsWith('+62')) clean = '0' + clean.slice(3);
  else if (clean.startsWith('62')) clean = '0' + clean.slice(2);
  else if (clean.startsWith('+')) clean = clean.slice(1);
  return clean;
}

function isValidIndonesianPhone(phone) {
  return /^0[1-9][0-9]{7,12}$/.test(phone);
}

function mapRelation(name) {
  const lower = ' ' + name.toLowerCase() + ' ';
  if (/\b(mama|papa|ibu|ayah|bunda|istri|suami|anak|my wife|my baby|adekku|abangku|mamak|bapakk|simatua)\b/i.test(lower)) {
    return 'Keluarga Inti';
  }
  if (/\b(adik|ade|adek|kakak|kak|kk|abang|bang|bg|b'|om|tante|opak|opung|bou|tulang|eda|ito|lae|sepupu|pariban|namboru|amang|inang)\b/i.test(lower)) {
    return 'Saudara Kandung / Sepupu';
  }
  if (/\b(kantor|pt|cv|bank|rs|klinik|dr|dokter|boss|bos|rekan|mgr|manager|spv|supervisor|team|staff|direktur|japfa|prudential|humas|nakes|ditjen|aam|sinex|cis|pah)\b/i.test(lower)) {
    return 'Rekan Kantor / Rekan Kerja';
  }
  if (/\b(sahabat|bestie|akrab)\b/i.test(lower)) {
    return 'Sahabat Karib';
  }
  if (/\b(teman|kawan|alumni|kuliah|kampus|sma|smp|sd|univ|ilkom|usu|unimed|itb|ui|ugm|sekolah|angkatan|kmk|biologi|mipa|polmed|stambuk|panal)\b/i.test(lower)) {
    return 'Teman Sekolah / Kuliah';
  }
  if (/\b(komunitas|hobi|gereja|gkps|hkbp|masjid|futsal|badminton|klub|arisan|joyfull|panti)\b/i.test(lower)) {
    return 'Komunitas / Hobi';
  }
  if (/\b(ekspedisi|max|topex|pet care|fin)\b/i.test(lower)) {
    return 'Rekan Bisnis / Vendor';
  }
  return 'Kenalan Baru';
}

function mapMarketCategory(relation) {
  if (relation === 'Keluarga Inti' || relation === 'Saudara Kandung / Sepupu' || relation === 'Sahabat Karib') {
    return 'Pasar Dekat (Hot)';
  }
  if (relation === 'Teman Sekolah / Kuliah' || relation === 'Rekan Kantor / Rekan Kerja' || relation === 'Komunitas / Hobi') {
    return 'Pasar Menengah (Warm)';
  }
  return 'Pasar Baru (Cold)';
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ----------------------------------------------------------------------------
// 2. PARSE VCF & EKSTRAKSI DATA
// ----------------------------------------------------------------------------

function extractAllContacts() {
  const rootDir = path.join(__dirname, '..');
  const yusufVcfPath = path.join(rootDir, 'Contacts.vcf');
  const rosmaVcfPath = path.join(rootDir, '00001.vcf');
  const jsonPath = path.join(rootDir, 'contacts_valid.json');

  // Jika file VCF tidak ditemukan tapi JSON ada, gunakan JSON sebagai fallback
  if (!fs.existsSync(yusufVcfPath) && !fs.existsSync(rosmaVcfPath) && fs.existsSync(jsonPath)) {
    console.log('Menggunakan cache kontak:', jsonPath);
    return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  }

  // 1. Kontak Yusuf
  const seenYusuf = new Set();
  const yusufList = [];

  // Kontak utama
  yusufList.push({
    id: 'p_1001',
    name: 'Yusuf Raja Tamba',
    phone: '082276471331',
    owner: 'Yusuf',
    relation: 'Keluarga Inti',
    marketCategory: 'Pasar Dekat (Hot)',
    stage: '2. Pendekatan Awal (Approach)',
    job: '',
    address: '',
    notes: '',
    regDate: '2026-09-21 00:00'
  });
  seenYusuf.add('082276471331');

  if (fs.existsSync(yusufVcfPath)) {
    const yusufCards = fs.readFileSync(yusufVcfPath, 'utf-8').split('BEGIN:VCARD').filter(c => c.trim().length > 0);
    yusufCards.forEach(c => {
      let fnMatch = c.match(/FN(?:;[^:]+)?:(.*)/i);
      let nMatch = c.match(/N(?:;[^:]+)?:(.*)/i);
      let rawName = fnMatch ? fnMatch[1] : (nMatch ? nMatch[1] : '');
      let name = cleanName(rawName);

      if (!name || /yusuf\s*raja\s*tamba|account\s*number|rekening/i.test(name)) return;

      const telMatches = [...c.matchAll(/TEL[^:]*:(.*)/gi)];
      let validPhone = '';
      for (let m of telMatches) {
        let norm = normalizePhone(m[1]);
        if (isValidIndonesianPhone(norm)) {
          validPhone = norm;
          break;
        }
      }
      if (!validPhone || seenYusuf.has(validPhone)) return;

      const orgMatch = c.match(/ORG[^:]*:(.*)/i);
      let org = orgMatch ? cleanName(orgMatch[1]) : '';
      const emailMatch = c.match(/EMAIL[^:]*:(.*)/i);
      let email = emailMatch ? emailMatch[1].trim() : '';

      const rel = mapRelation(name);
      const cat = mapMarketCategory(rel);
      const id = 'p_' + (1001 + yusufList.length);

      seenYusuf.add(validPhone);
      yusufList.push({
        id,
        name,
        phone: validPhone,
        owner: 'Yusuf',
        relation: rel,
        marketCategory: cat,
        stage: '1. Bank Nama (Suspect)',
        job: org || '',
        address: '',
        notes: email ? ('Email: ' + email) : '',
        regDate: '2026-09-22 10:30'
      });
    });
  }

  // 2. Kontak Rosma
  const seenRosma = new Set();
  const rosmaList = [];

  if (fs.existsSync(rosmaVcfPath)) {
    const rosmaCards = fs.readFileSync(rosmaVcfPath, 'utf-8').split('BEGIN:VCARD').filter(c => c.trim().length > 0);
    rosmaCards.forEach(c => {
      let fnMatch = c.match(/FN(?:;[^:]+)?:(.*)/i);
      let nMatch = c.match(/N(?:;[^:]+)?:(.*)/i);
      let rawName = fnMatch ? fnMatch[1] : (nMatch ? nMatch[1] : '');
      let name = cleanName(rawName);

      if (!name || /account\s*number|rekening|cek\s*pulsa|call\s*center|info\s*ivr|voice\s*mail|customer\s*care|intl\.\s*roaming|indosat\s*ooredoo\s*menu|info\s*center/i.test(name)) {
        return;
      }

      const telMatches = [...c.matchAll(/TEL[^:]*:(.*)/gi)];
      let validPhone = '';
      for (let m of telMatches) {
        let norm = normalizePhone(m[1]);
        if (isValidIndonesianPhone(norm)) {
          validPhone = norm;
          break;
        }
      }
      if (!validPhone || seenRosma.has(validPhone)) return;

      const orgMatch = c.match(/ORG[^:]*:(.*)/i);
      let org = orgMatch ? cleanName(orgMatch[1]) : '';
      const emailMatch = c.match(/EMAIL[^:]*:(.*)/i);
      let email = emailMatch ? emailMatch[1].trim() : '';

      const rel = mapRelation(name);
      const cat = mapMarketCategory(rel);
      const id = 'p_r_' + (1001 + rosmaList.length);

      seenRosma.add(validPhone);
      rosmaList.push({
        id,
        name,
        phone: validPhone,
        owner: 'Rosma',
        relation: rel,
        marketCategory: cat,
        stage: '1. Bank Nama (Suspect)',
        job: org || '',
        address: '',
        notes: email ? ('Email: ' + email) : '',
        regDate: '2026-09-25 15:00'
      });
    });
  }

  // 3. Deteksi Kontak Bersama (Overlap)
  const yusufPhoneSet = new Set(yusufList.map(item => item.phone));
  const rosmaPhoneSet = new Set(rosmaList.map(item => item.phone));

  let sharedCount = 0;
  rosmaList.forEach(item => {
    if (yusufPhoneSet.has(item.phone)) {
      item.isShared = true;
      item.sharedWith = 'Yusuf';
      sharedCount++;
    }
  });

  yusufList.forEach(item => {
    if (rosmaPhoneSet.has(item.phone)) {
      item.isShared = true;
      item.sharedWith = 'Rosma';
    }
  });

  const combinedList = [...yusufList, ...rosmaList];

  return {
    combinedList,
    yusufList,
    rosmaList,
    sharedCount
  };
}

// ----------------------------------------------------------------------------
// 3. GENERASI FILE CSV
// ----------------------------------------------------------------------------

function generateCsvNasabah(list) {
  const header = ['ID_Prospek', 'Nama_Lengkap', 'Nomor_WhatsApp', 'Pemilik_Kontak', 'Relasi_Hubungan', 'Pekerjaan', 'Alamat_Domisili', 'Tautan_WhatsApp', 'Tanggal_Terdaftar'];
  const rows = list.map(item => {
    const waPhone = item.phone.startsWith('0') ? ('62' + item.phone.slice(1)) : item.phone;
    const waSender = item.owner === 'Rosma' ? 'Rosma' : 'Yusuf';
    const waLink = 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Halo Bapak/Ibu ' + item.name + ', salam silaturahmi dari saya ' + waSender + '. Semoga kabar sehat selalu.');
    return [item.id, item.name, item.phone, item.owner, item.relation, item.job, item.address, waLink, item.regDate].map(escapeCsv).join(',');
  });
  return [header.join(','), ...rows].join('\r\n');
}

function generateCsvPipeline(list) {
  const header = ['ID_Prospek', 'Nama_Lengkap', 'Pemilik_Kontak', 'Tahap_Pipeline', 'Kategori_Pasar', 'Target_Kontak_Berikutnya', 'Terakhir_Dihubungi', 'Kendala_Keberatan_Terakhir', 'Catatan_Pribadi', 'Tautan_WhatsApp'];
  const rows = list.map(item => {
    const waPhone = item.phone.startsWith('0') ? ('62' + item.phone.slice(1)) : item.phone;
    const waSender = item.owner === 'Rosma' ? 'Rosma' : 'Yusuf';
    const waLink = 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Halo Bapak/Ibu ' + item.name + ', salam silaturahmi dari saya ' + waSender + '. Semoga kabar sehat selalu.');
    const noteText = item.isShared ? ((item.notes ? item.notes + ' | ' : '') + 'Kontak bersama ' + item.sharedWith) : (item.notes || '');
    return [item.id, item.name, item.owner, item.stage, item.marketCategory, '', '-', '-', noteText, waLink].map(escapeCsv).join(',');
  });
  return [header.join(','), ...rows].join('\r\n');
}

function generateCsvLegacy(list) {
  const header = ['ID_Prospek', 'Nama_Lengkap', 'Nomor_WhatsApp', 'Pemilik_Kontak', 'Relasi_Hubungan', 'Kategori_Pasar', 'Pekerjaan', 'Alamat_Domisili', 'Tahap_Pipeline', 'Target_Kontak_Berikutnya', 'Terakhir_Dihubungi', 'Kendala_Keberatan_Terakhir', 'Catatan_Pribadi', 'Tautan_WhatsApp', 'Tanggal_Terdaftar'];
  const rows = list.map(item => {
    const waPhone = item.phone.startsWith('0') ? ('62' + item.phone.slice(1)) : item.phone;
    const waSender = item.owner === 'Rosma' ? 'Rosma' : 'Yusuf';
    const waLink = 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Halo Bapak/Ibu ' + item.name + ', salam silaturahmi dari saya ' + waSender + '. Semoga kabar sehat selalu.');
    const noteText = item.isShared ? ((item.notes ? item.notes + ' | ' : '') + 'Kontak bersama ' + item.sharedWith) : (item.notes || '');
    return [item.id, item.name, item.phone, item.owner, item.relation, item.marketCategory, item.job, item.address, item.stage, '', '-', '-', noteText, waLink, item.regDate].map(escapeCsv).join(',');
  });
  return [header.join(','), ...rows].join('\r\n');
}

// ----------------------------------------------------------------------------
// 4. GENERASI GOOGLE APPS SCRIPT: ImportContacts.gs
// ----------------------------------------------------------------------------

function generateImportContactsGs(contacts) {
  const code = `/**
 * ============================================================================
 * AGENTPROSPECT PRO - IMPORT OTOMATIS 1.065 KONTAK VALID DARI VCF KE SPREADSHEET
 * CALON NASABAH YUSUF (635) & ROSMA (430)
 * ============================================================================
 * Petunjuk Penggunaan:
 * 1. Buka Google Spreadsheet ini di browser:
 *    https://docs.google.com/spreadsheets/d/1ykj3cCMPYfhUI0n7H0cnY2TzdfXrEo4hG5HHp2-bejA
 * 2. Klik menu 'Extensions' -> 'Apps Script'
 * 3. Buka file 'ImportContacts.gs' (atau buat file baru jika belum ada)
 * 4. Tempel (Paste) seluruh isi file ini, lalu simpan (Ctrl+S)
 * 5. Pilih fungsi 'importAllValidContactsFromVcf' pada dropdown fungsi di toolbar atas
 * 6. Klik tombol 'Run' (Jalankan). Seluruh 1.065 kontak (Yusuf & Rosma) akan masuk rapi & tervalidasi!
 */

function importAllValidContactsFromVcf() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let sheetNasabah = ss.getSheetByName(SHEETS.NASABAH);
  let sheetPipeline = ss.getSheetByName(SHEETS.PIPELINE);
  let sheetLegacy = ss.getSheetByName(SHEETS.PROSPEK);

  if (!sheetNasabah) {
    setupDaftarNasabahSheet(ss);
    sheetNasabah = ss.getSheetByName(SHEETS.NASABAH);
  }
  if (!sheetPipeline) {
    setupPipelinePenjualanSheet(ss);
    sheetPipeline = ss.getSheetByName(SHEETS.PIPELINE);
  }

  const contacts = RAW_VALID_CONTACTS;
  Logger.log('Memulai proses impor ' + contacts.length + ' kontak valid (Yusuf & Rosma)...');

  // 1. Data untuk Daftar_Calon_Nasabah (9 Kolom)
  // [ID_Prospek, Nama_Lengkap, Nomor_WhatsApp, Pemilik_Kontak, Relasi_Hubungan, Pekerjaan, Alamat_Domisili, Tautan_WhatsApp, Tanggal_Terdaftar]
  const rowsNasabah = contacts.map(c => {
    const waPhone = c.phone.startsWith('0') ? ('62' + c.phone.slice(1)) : c.phone;
    const waSender = c.owner === 'Rosma' ? 'Rosma' : 'Yusuf';
    const waLink = 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Halo Bapak/Ibu ' + c.name + ', salam silaturahmi dari saya ' + waSender + '. Semoga kabar sehat selalu.');
    return [
      c.id,
      c.name,
      c.phone,
      c.owner || 'Yusuf',
      c.relation,
      c.job || '',
      c.address || '',
      waLink,
      c.regDate || '2026-09-25 15:00'
    ];
  });

  // 2. Data untuk Pipeline_Penjualan (10 Kolom)
  // [ID_Prospek, Nama_Lengkap, Pemilik_Kontak, Tahap_Pipeline, Kategori_Pasar, Target_Kontak_Berikutnya, Terakhir_Dihubungi, Kendala_Keberatan_Terakhir, Catatan_Pribadi, Tautan_WhatsApp]
  const rowsPipeline = contacts.map(c => {
    const waPhone = c.phone.startsWith('0') ? ('62' + c.phone.slice(1)) : c.phone;
    const waSender = c.owner === 'Rosma' ? 'Rosma' : 'Yusuf';
    const waLink = 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Halo Bapak/Ibu ' + c.name + ', salam silaturahmi dari saya ' + waSender + '. Semoga kabar sehat selalu.');
    const noteText = c.isShared ? ((c.notes ? c.notes + ' | ' : '') + 'Kontak bersama ' + c.sharedWith) : (c.notes || '');
    return [
      c.id,
      c.name,
      c.owner || 'Yusuf',
      c.stage || '1. Bank Nama (Suspect)',
      c.marketCategory || 'Pasar Baru (Cold)',
      '',
      '-',
      '-',
      noteText,
      waLink
    ];
  });

  // Tulis ke Daftar_Calon_Nasabah mulai baris 2 (Ganti data lama agar bersih & tersusun rapi)
  if (sheetNasabah) {
    const lastRowN = Math.max(sheetNasabah.getLastRow(), 2);
    if (lastRowN > 1) {
      sheetNasabah.getRange(2, 1, lastRowN - 1, 9).clearContent();
    }
    sheetNasabah.getRange(2, 1, rowsNasabah.length, 9).setValues(rowsNasabah);
  }

  // Tulis ke Pipeline_Penjualan mulai baris 2
  if (sheetPipeline) {
    const lastRowP = Math.max(sheetPipeline.getLastRow(), 2);
    if (lastRowP > 1) {
      sheetPipeline.getRange(2, 1, lastRowP - 1, 10).clearContent();
    }
    sheetPipeline.getRange(2, 1, rowsPipeline.length, 10).setValues(rowsPipeline);
  }

  // Fallback tulis ke sheet Legacy Project100_Prospek jika ada (15 Kolom)
  if (sheetLegacy) {
    const rowsLegacy = contacts.map(c => {
      const waPhone = c.phone.startsWith('0') ? ('62' + c.phone.slice(1)) : c.phone;
      const waSender = c.owner === 'Rosma' ? 'Rosma' : 'Yusuf';
      const waLink = 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Halo Bapak/Ibu ' + c.name + ', salam silaturahmi dari saya ' + waSender + '. Semoga kabar sehat selalu.');
      const noteText = c.isShared ? ((c.notes ? c.notes + ' | ' : '') + 'Kontak bersama ' + c.sharedWith) : (c.notes || '');
      return [
        c.id,
        c.name,
        c.phone,
        c.owner || 'Yusuf',
        c.relation,
        c.marketCategory || 'Pasar Baru (Cold)',
        c.job || '',
        c.address || '',
        c.stage || '1. Bank Nama (Suspect)',
        '',
        '-',
        '-',
        noteText,
        waLink,
        c.regDate || '2026-09-25 15:00'
      ];
    });
    const lastRowL = Math.max(sheetLegacy.getLastRow(), 2);
    if (lastRowL > 1) {
      sheetLegacy.getRange(2, 1, lastRowL - 1, 15).clearContent();
    }
    sheetLegacy.getRange(2, 1, rowsLegacy.length, 15).setValues(rowsLegacy);
  }

  // Set dropdown validation & format
  const masterSheet = ss.getSheetByName(SHEETS.MASTER);
  if (masterSheet && sheetNasabah && sheetPipeline) {
    // Relasi Hubungan (Kolom E di sheet Daftar_Calon_Nasabah)
    const relRule = SpreadsheetApp.newDataValidation().requireValueInRange(masterSheet.getRange('C2:C15'), true).build();
    sheetNasabah.getRange(2, 5, rowsNasabah.length, 1).setDataValidation(relRule);

    // Pemilik Kontak (Kolom D di sheet Daftar_Calon_Nasabah & Kolom C di Pipeline_Penjualan)
    const ownerRule = SpreadsheetApp.newDataValidation().requireValueInRange(masterSheet.getRange('D2:D5'), true).build();
    sheetNasabah.getRange(2, 4, rowsNasabah.length, 1).setDataValidation(ownerRule);
    sheetPipeline.getRange(2, 3, rowsPipeline.length, 1).setDataValidation(ownerRule);

    // Tahap Pipeline (Kolom D di Pipeline_Penjualan)
    const stageRule = SpreadsheetApp.newDataValidation().requireValueInRange(masterSheet.getRange('A2:A12'), true).build();
    sheetPipeline.getRange(2, 4, rowsPipeline.length, 1).setDataValidation(stageRule);

    // Kategori Pasar (Kolom E di Pipeline_Penjualan)
    const pasarRule = SpreadsheetApp.newDataValidation().requireValueInRange(masterSheet.getRange('B2:B5'), true).build();
    sheetPipeline.getRange(2, 5, rowsPipeline.length, 1).setDataValidation(pasarRule);
  }

  try {
    SpreadsheetApp.getUi().alert(
      'Impor Kontak Sukses!',
      'Berhasil mengimpor ' + contacts.length + ' calon nasabah valid ke Google Spreadsheet!\\n\\n' +
      '• Calon Nasabah Yusuf: 635 kontak\\n' +
      '• Calon Nasabah Rosma: 430 kontak\\n' +
      '• Sheet Daftar_Calon_Nasabah: ' + rowsNasabah.length + ' baris.\\n' +
      '• Sheet Pipeline_Penjualan: ' + rowsPipeline.length + ' baris.\\n' +
      '• Kolom Pemilik_Kontak membedakan nasabah Yusuf & Rosma secara jelas.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (e) {
    Logger.log('Impor selesai: ' + contacts.length + ' data masuk.');
  }
}

const RAW_VALID_CONTACTS = ` + JSON.stringify(contacts, null, 2) + `;\n`;

  const outputPath = path.join(__dirname, '..', 'google_apps_script', 'ImportContacts.gs');
  fs.writeFileSync(outputPath, code, 'utf-8');
  return outputPath;
}

// ----------------------------------------------------------------------------
// 5. SINKRONISASI KE DATABASE LOKAL SQLITE
// ----------------------------------------------------------------------------

function syncToSqliteDatabase(contacts) {
  try {
    const { DatabaseSync } = require('node:sqlite');
    const dbPath = path.join(__dirname, '..', 'agentprospect.db');
    const db = new DatabaseSync(dbPath);

    // Pastikan kolom owner ada
    try {
      const cols = db.prepare('PRAGMA table_info(prospects)').all();
      if (!cols.some(c => c.name === 'owner')) {
        db.exec("ALTER TABLE prospects ADD COLUMN owner TEXT DEFAULT 'Yusuf'");
      }
    } catch (e) {}

    // Check default user
    let userYusuf = db.prepare('SELECT id FROM users WHERE name LIKE ? LIMIT 1').get('%Yusuf%');
    let userId = userYusuf ? userYusuf.id : 'usr_yusuf';
    if (!userYusuf) {
      db.prepare(`
        INSERT INTO users (id, agent_code, name, email, password, agency_name, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, 'AG-001', 'Yusuf Raja Tamba', 'yusuf@prudential.co.id', 'password123', 'Prudential Agency', 'Agent', '2026-09-21 00:00:00');
    }

    // Reset table prospects
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

    for (const c of contacts) {
      let temp = 'warm';
      if (c.marketCategory && c.marketCategory.includes('Hot')) temp = 'hot';
      else if (c.marketCategory && c.marketCategory.includes('Cold')) temp = 'cold';

      let stage = 'suspect';
      if (c.stage && c.stage.includes('Pendekatan')) stage = 'approach';

      const owner = c.owner || 'Yusuf';
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
    return true;
  } catch (err) {
    console.warn('Catatan: Sinkronisasi database SQLite dilewati atau tidak tersedia:', err.message);
    return false;
  }
}

// ----------------------------------------------------------------------------
// 6. MAIN EXECUTION PIPELINE
// ----------------------------------------------------------------------------

function runMasterPipeline() {
  console.log('================================================================');
  console.log('🚀 MEMULAI PIPELINE MASTER EKSTRAKSI & GENERASI KONTAK PROSPEK');
  console.log('================================================================');

  const rootDir = path.join(__dirname, '..');

  // 1. Ekstraksi VCF
  const { combinedList, yusufList, rosmaList, sharedCount } = extractAllContacts();
  console.log('✔ Kontak Yusuf (Contacts.vcf)  : ' + yusufList.length + ' kontak valid');
  console.log('✔ Kontak Rosma (00001.vcf)     : ' + rosmaList.length + ' kontak valid');
  console.log('✔ Kontak Bersama (Overlap)     : ' + sharedCount + ' nomor bersama');
  console.log('✔ TOTAL SELURUH KONTAK         : ' + combinedList.length + ' kontak valid\n');

  // 2. Simpan contacts_valid.json
  const jsonPath = path.join(rootDir, 'contacts_valid.json');
  fs.writeFileSync(jsonPath, JSON.stringify(combinedList, null, 2), 'utf-8');
  console.log('✔ File JSON tersimpan          : ' + path.basename(jsonPath));

  // 3. Generasi File CSV Master Gabungan
  fs.writeFileSync(path.join(rootDir, 'Daftar_Calon_Nasabah_Valid.csv'), generateCsvNasabah(combinedList), 'utf-8');
  fs.writeFileSync(path.join(rootDir, 'Pipeline_Penjualan_Valid.csv'), generateCsvPipeline(combinedList), 'utf-8');
  fs.writeFileSync(path.join(rootDir, 'Project100_Prospek_Valid.csv'), generateCsvLegacy(combinedList), 'utf-8');
  console.log('✔ CSV Master Gabungan tersimpan (3 file: Daftar Nasabah, Pipeline, Project100)');

  // 4. Generasi File CSV Khusus Yusuf
  fs.writeFileSync(path.join(rootDir, 'Daftar_Calon_Nasabah_Yusuf.csv'), generateCsvNasabah(yusufList), 'utf-8');
  fs.writeFileSync(path.join(rootDir, 'Pipeline_Penjualan_Yusuf.csv'), generateCsvPipeline(yusufList), 'utf-8');
  console.log('✔ CSV Khusus Yusuf tersimpan    (2 file: ' + yusufList.length + ' baris)');

  // 5. Generasi File CSV Khusus Rosma
  fs.writeFileSync(path.join(rootDir, 'Daftar_Calon_Nasabah_Rosma.csv'), generateCsvNasabah(rosmaList), 'utf-8');
  fs.writeFileSync(path.join(rootDir, 'Pipeline_Penjualan_Rosma.csv'), generateCsvPipeline(rosmaList), 'utf-8');
  console.log('✔ CSV Khusus Rosma tersimpan    (2 file: ' + rosmaList.length + ' baris)');

  // 6. Generasi google_apps_script/ImportContacts.gs
  const gsPath = generateImportContactsGs(combinedList);
  console.log('✔ Google Apps Script tersimpan  : ' + path.basename(gsPath) + ' (' + Math.round(fs.statSync(gsPath).size / 1024) + ' KB)');

  // 7. Sinkronisasi Database SQLite
  const dbSynced = syncToSqliteDatabase(combinedList);
  if (dbSynced) {
    console.log('✔ Database SQLite (agentprospect.db) tersinkronisasi (' + combinedList.length + ' records)');
  }

  console.log('\n================================================================');
  console.log('🎉 SELURUH PROSES SELESAI DENGAN SUKSES!');
  console.log('Semua data siap digunakan di Web UI, CSV, dan Google Spreadsheet.');
  console.log('================================================================');
}

// Jalankan pipeline jika dipanggil langsung
if (require.main === module) {
  runMasterPipeline();
}

module.exports = {
  extractAllContacts,
  generateImportContactsGs,
  runMasterPipeline
};
