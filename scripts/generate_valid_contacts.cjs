const fs = require('fs');
const path = require('path');

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
    } catch(e) {
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
// 1. BACA & PARSE KONTAK YUSUF (Contacts.vcf)
// ----------------------------------------------------------------------------
const yusufVcfPath = path.join(__dirname, '..', 'Contacts.vcf');
const yusufCards = fs.readFileSync(yusufVcfPath, 'utf-8').split('BEGIN:VCARD').filter(c => c.trim().length > 0);

const seenYusuf = new Set();
const yusufList = [];

// Tambahkan kontak Yusuf Raja Tamba
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

console.log('Total kontak valid Yusuf (Contacts.vcf):', yusufList.length);

// ----------------------------------------------------------------------------
// 2. BACA & PARSE KONTAK ROSMA (00001.vcf)
// ----------------------------------------------------------------------------
const rosmaVcfPath = path.join(__dirname, '..', '00001.vcf');
const rosmaCards = fs.readFileSync(rosmaVcfPath, 'utf-8').split('BEGIN:VCARD').filter(c => c.trim().length > 0);

const seenRosma = new Set();
const rosmaList = [];

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

console.log('Total kontak valid Rosma (00001.vcf):', rosmaList.length);

// Deteksi kontak bersama (shared contacts antara Yusuf & Rosma)
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

console.log('Kontak bersama (muncul di kedua HP):', sharedCount);

// Gabungkan seluruh kontak
const combinedList = [...yusufList, ...rosmaList];
console.log('Total gabungan kontak calon nasabah:', combinedList.length);

// Simpan contacts_valid.json
fs.writeFileSync(path.join(__dirname, '..', 'contacts_valid.json'), JSON.stringify(combinedList, null, 2), 'utf-8');

// ----------------------------------------------------------------------------
// 3. GENERASI FILE CSV LENGKAP
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
    const noteText = item.isShared ? ((item.notes ? item.notes + ' | ' : '') + 'Kontak bersama ' + item.sharedWith) : item.notes;
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
    const noteText = item.isShared ? ((item.notes ? item.notes + ' | ' : '') + 'Kontak bersama ' + item.sharedWith) : item.notes;
    return [item.id, item.name, item.phone, item.owner, item.relation, item.marketCategory, item.job, item.address, item.stage, '', '-', '-', noteText, waLink, item.regDate].map(escapeCsv).join(',');
  });
  return [header.join(','), ...rows].join('\r\n');
}

// 1. File Utama Gabungan (Valid All)
fs.writeFileSync(path.join(__dirname, '..', 'Daftar_Calon_Nasabah_Valid.csv'), generateCsvNasabah(combinedList), 'utf-8');
fs.writeFileSync(path.join(__dirname, '..', 'Pipeline_Penjualan_Valid.csv'), generateCsvPipeline(combinedList), 'utf-8');
fs.writeFileSync(path.join(__dirname, '..', 'Project100_Prospek_Valid.csv'), generateCsvLegacy(combinedList), 'utf-8');

// 2. File Khusus Yusuf
fs.writeFileSync(path.join(__dirname, '..', 'Daftar_Calon_Nasabah_Yusuf.csv'), generateCsvNasabah(yusufList), 'utf-8');
fs.writeFileSync(path.join(__dirname, '..', 'Pipeline_Penjualan_Yusuf.csv'), generateCsvPipeline(yusufList), 'utf-8');

// 3. File Khusus Rosma
fs.writeFileSync(path.join(__dirname, '..', 'Daftar_Calon_Nasabah_Rosma.csv'), generateCsvNasabah(rosmaList), 'utf-8');
fs.writeFileSync(path.join(__dirname, '..', 'Pipeline_Penjualan_Rosma.csv'), generateCsvPipeline(rosmaList), 'utf-8');

console.log('\nCSV files generated successfully:');
console.log('• Daftar_Calon_Nasabah_Valid.csv (' + combinedList.length + ' baris - Gabungan)');
console.log('• Pipeline_Penjualan_Valid.csv (' + combinedList.length + ' baris - Gabungan)');
console.log('• Project100_Prospek_Valid.csv (' + combinedList.length + ' baris - Gabungan)');
console.log('• Daftar_Calon_Nasabah_Yusuf.csv (' + yusufList.length + ' baris)');
console.log('• Daftar_Calon_Nasabah_Rosma.csv (' + rosmaList.length + ' baris)');
console.log('• Pipeline_Penjualan_Yusuf.csv (' + yusufList.length + ' baris)');
console.log('• Pipeline_Penjualan_Rosma.csv (' + rosmaList.length + ' baris)');
console.log('• contacts_valid.json (' + combinedList.length + ' records)');
