const fs = require('fs');
const path = require('path');

const contacts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'contacts_valid.json'), 'utf-8'));

let code = `/**
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

fs.writeFileSync(path.join(__dirname, '..', 'google_apps_script', 'ImportContacts.gs'), code, 'utf-8');
console.log('google_apps_script/ImportContacts.gs written! Size:', fs.statSync(path.join(__dirname, '..', 'google_apps_script', 'ImportContacts.gs')).size);
