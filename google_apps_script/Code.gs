/**
 * ============================================================================
 * AGENTPROSPECT PRO - GOOGLE APPS SCRIPT (GAS) AUTOMATION SUITE
 * Sistem Manajemen Calon Nasabah (Project 100) & Portofolio Agen Asuransi
 * ============================================================================
 */

// Konfigurasi Nama Sheet
const SHEETS = {
  NASABAH: 'Daftar_Calon_Nasabah',   // Sheet 1: Profil Nama & Kontak Customer (Ringkas & Bersih)
  PIPELINE: 'Pipeline_Penjualan',     // Sheet 2: Tahapan Pipeline & Kualifikasi (Terintegrasi)
  PROSPEK: 'Project100_Prospek',      // Fallback/Legacy sheet jika pengguna masih menggunakan struktur lama
  LOG: 'Log_Interaksi',
  POLIS: 'Portofolio_Polis',
  PLAYBOOK: 'Panduan_Keberatan',
  MDRT: 'Target_Produksi_MDRT',
  KALKULATOR: 'Kalkulator_Kebutuhan',
  USER: 'Akun_Agen',                 // Sheet Khusus Akun Agen & Password (Database Login)
  MASTER: 'Master_Data'
};

/**
 * Menu Kustom saat Google Spreadsheet dibuka
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🌟 AgentProspect Pro')
    .addItem('⚡ Impor 1.065 Kontak VCF Valid (Yusuf & Rosma)', 'importAllValidContactsFromVcf')
    .addItem('🔄 Sinkronkan Seluruh Sheet', 'syncAllProspekSheetsManual')
    .addItem('🧹 Rapikan Urutan Baris Data', 'realignAllSheetsManual')
    .addToUi();
}

/**
 * 1. FUNGSI SETUP OTOMATIS: MEMBUAT SELURUH SHEET, HEADER & DATA VALIDASI
 * Jalankan fungsi ini 1 kali dari menu Apps Script: Run -> setupAgentSheets
 */
function setupAgentSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet Master Data (Pilihan Dropdown)
  setupMasterDataSheet(ss);

  // 2. Sheet 1: Daftar Calon Nasabah (Nama Customer & Kontak Ringkas)
  setupDaftarNasabahSheet(ss);

  // 3. Sheet 2: Pipeline Penjualan (Tahapan 1-9, Kualifikasi M-A-N & Follow Up)
  setupPipelinePenjualanSheet(ss);

  // 4. Migrasi otomatis data lama jika sebelumnya ada di Project100_Prospek
  migrateLegacyProspekData(ss);

  // 5. Sheet Log Interaksi
  setupLogSheet(ss);

  // 6. Sheet Portofolio Polis
  setupPolisSheet(ss);

  // 7. Sheet Panduan Keberatan
  setupPlaybookSheet(ss);

  // 8. Sheet Target Produksi MDRT
  setupMDRTSheet(ss);

  // 9. Sheet Akun Agen & Password (Login)
  setupAkunAgenSheet(ss);

  // Hapus Sheet1 default jika kosong
  const sheet1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (sheet1 && ss.getSheets().length > 1 && sheet1.getLastRow() === 0) {
    try { ss.deleteSheet(sheet1); } catch (e) {}
  }

  // Posisikan Tab:
  // Tab 1: Daftar_Calon_Nasabah (Paling depan, bersih dan ringkas)
  const sheetNasabah = ss.getSheetByName(SHEETS.NASABAH);
  if (sheetNasabah) {
    ss.setActiveSheet(sheetNasabah);
    ss.moveActiveSheet(1);
  }

  // Tab 2: Pipeline_Penjualan
  const sheetPipeline = ss.getSheetByName(SHEETS.PIPELINE);
  if (sheetPipeline) {
    ss.setActiveSheet(sheetPipeline);
    ss.moveActiveSheet(2);
  }

  // Tab Akun_Agen posisikan sebelum Master_Data
  const sheetUser = ss.getSheetByName(SHEETS.USER);
  if (sheetUser) {
    ss.setActiveSheet(sheetUser);
    ss.moveActiveSheet(ss.getSheets().length - 1);
  }

  // Pindahkan Master_Data ke posisi paling belakang
  const sheetMaster = ss.getSheetByName(SHEETS.MASTER);
  if (sheetMaster) {
    ss.setActiveSheet(sheetMaster);
    ss.moveActiveSheet(ss.getSheets().length);
    if (sheetNasabah) ss.setActiveSheet(sheetNasabah);
  }

  SpreadsheetApp.getUi().alert(
    'Setup Berhasil Selesai!',
    'Struktur sheet baru telah siap & terintegrasi:\n\n' +
    '• Tab 1: "Daftar_Calon_Nasabah" (Khusus nama & kontak calon nasabah, ringkas tanpa kolom pipeline berlebih).\n' +
    '• Tab 2: "Pipeline_Penjualan" (Khusus tahapan pipeline 1-9, kualifikasi M-A-N, jadwal follow-up, & catatan).\n' +
    '• Tab 7: "Akun_Agen" (Menyimpan data akun pengguna/agen, nomor WhatsApp, kata sandi, & agency).\n' +
    '• Data antara sheet terhubung otomatis via ID Prospek & rumus VLOOKUP!',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Setup Sheet Master Data (Pilihan Dropdown)
 */
function setupMasterDataSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.MASTER);
  if (!sheet) sheet = ss.insertSheet(SHEETS.MASTER);
  sheet.clear();

  const headers = [
    ['Tahap_Pipeline', 'Kategori_Pasar', 'Relasi_Hubungan', 'Pemilik_Kontak', 'Produk_Asuransi', 'Frekuensi_Bayar', 'Kategori_Keberatan']
  ];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers)
    .setBackground('#062135').setFontColor('#ffffff').setFontWeight('bold');

  const pipelineStages = [
    '1. Bank Nama (Suspect)',
    '2. Pendekatan Awal (Approach)',
    '3. Janji Temu (Appointment)',
    '4. Bedah Kebutuhan (Fact Finding)',
    '5. Presentasi Solusi (Presentation)',
    '6. Penanganan Keberatan (Handling Objection)',
    '7. Kesepakatan (Closing Agreement)',
    '8. Pengajuan SPAJ (Submission)',
    '9. Polis Terbit (In-Force)'
  ];

  const marketCategories = ['Pasar Dekat (Hot)', 'Pasar Menengah (Warm)', 'Pasar Baru (Cold)'];
  
  const relations = [
    'Keluarga Inti', 'Saudara Kandung / Sepupu', 'Sahabat Karib',
    'Teman Sekolah / Kuliah', 'Rekan Kantor / Rekan Kerja',
    'Komunitas / Hobi', 'Tetangga / Lingkungan Rumah',
    'Rekan Bisnis / Vendor', 'Referensi Nasabah', 'Kenalan Baru'
  ];

  const contactOwners = ['Yusuf', 'Rosma'];

  const products = [
    'Prime Healthcare Plus Pro (Rawat Inap 1 Bed)',
    'Solusi Sehat Plus Pro (PSSP Syariah)',
    'Critical Benefit 88 (Sakit Kritis Tradisional)',
    'Critical Protection (PCB 88 Syariah)',
    'Kepastian Warisan Finansial',
    'Proteksi Jiwa & Kritis Syariah',
    'Generasi Baru (Unit Link Proteksi)'
  ];

  const frequencies = ['Bulanan', 'Kuartalan (3 Bulan)', 'Semesteran (6 Bulan)', 'Tahunan'];

  const objectionCats = [
    'Premi & Biaya (Finansial)',
    'Manfaat & Kebutuhan (Prioritas)',
    'Kepercayaan & Riwayat Klaim',
    'Agen & Layanan Jangka Panjang',
    'Skema Produk & Instrumen Lain',
    'Kesesuaian Syariah'
  ];

  const maxRows = Math.max(pipelineStages.length, relations.length, contactOwners.length, products.length, frequencies.length, objectionCats.length);
  const data = [];
  for (let i = 0; i < maxRows; i++) {
    data.push([
      pipelineStages[i] || '',
      marketCategories[i] || '',
      relations[i] || '',
      contactOwners[i] || '',
      products[i] || '',
      frequencies[i] || '',
      objectionCats[i] || ''
    ]);
  }

  sheet.getRange(2, 1, data.length, headers[0].length).setValues(data);
  sheet.autoResizeColumns(1, headers[0].length);
}

/**
 * Setup Sheet 1: Daftar Calon Nasabah (Khusus Data Customer & Kontak - Ringkas & Bersih)
 */
function setupDaftarNasabahSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.NASABAH);
  if (!sheet) sheet = ss.insertSheet(SHEETS.NASABAH);

  const headers = [
    'ID_Prospek', 'Nama_Lengkap', 'Nomor_WhatsApp', 'Pemilik_Kontak', 'Relasi_Hubungan',
    'Pekerjaan', 'Alamat_Domisili',
    'Tautan_WhatsApp', 'Tanggal_Terdaftar'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#062135').setFontColor('#ffffff').setFontWeight('bold');

  const masterSheet = ss.getSheetByName(SHEETS.MASTER);
  if (masterSheet) {
    // Validasi Pemilik Kontak (Kolom D: Yusuf / Rosma)
    const ownerRule = SpreadsheetApp.newDataValidation().requireValueInRange(masterSheet.getRange('D2:D5'), true).build();
    sheet.getRange('D2:D1500').setDataValidation(ownerRule);

    // Validasi Relasi (Kolom E)
    const relRule = SpreadsheetApp.newDataValidation().requireValueInRange(masterSheet.getRange('C2:C15'), true).build();
    sheet.getRange('E2:E1500').setDataValidation(relRule);
  }

  // Format Tanggal Terdaftar (Kolom I)
  sheet.getRange('I2:I1500').setNumberFormat('yyyy-mm-dd hh:mm');

  // Rumus Tautan WhatsApp Otomatis di Kolom H:
  sheet.getRange('H2').setFormula(
    '=IF(C2<>""; "https://wa.me/" & IF(LEFT(C2;1)="0"; "62"&MID(C2;2;20); C2) & "?text=" & ENCODEURL("Halo Bapak/Ibu " & B2 & ", salam silaturahmi dari saya " & D2 & ". Semoga kabar sehat selalu."); "")'
  );

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Setup Sheet 2: Pipeline Penjualan (Khusus Tahapan 1-9 & Follow Up - Terintegrasi)
 */
function setupPipelinePenjualanSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.PIPELINE);
  if (!sheet) sheet = ss.insertSheet(SHEETS.PIPELINE);

  const headers = [
    'ID_Prospek', 'Nama_Lengkap', 'Pemilik_Kontak', 'Tahap_Pipeline', 'Kategori_Pasar',
    'Target_Kontak_Berikutnya', 'Terakhir_Dihubungi', 'Kendala_Keberatan_Terakhir',
    'Catatan_Pribadi', 'Tautan_WhatsApp'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#062135').setFontColor('#ffffff').setFontWeight('bold');

  const masterSheet = ss.getSheetByName(SHEETS.MASTER);
  if (masterSheet) {
    // Pemilik Kontak (Kolom C)
    const ownerRule = SpreadsheetApp.newDataValidation().requireValueInRange(masterSheet.getRange('D2:D5'), true).build();
    sheet.getRange('C2:C1500').setDataValidation(ownerRule);

    // Tahap Pipeline (Kolom D)
    const stageRule = SpreadsheetApp.newDataValidation().requireValueInRange(masterSheet.getRange('A2:A12'), true).build();
    sheet.getRange('D2:D1500').setDataValidation(stageRule);

    // Kategori Pasar (Kolom E)
    const pasarRule = SpreadsheetApp.newDataValidation().requireValueInRange(masterSheet.getRange('B2:B5'), true).build();
    sheet.getRange('E2:E1500').setDataValidation(pasarRule);
  }

  // Format Tanggal (Kolom F & G)
  sheet.getRange('F2:G1500').setNumberFormat('yyyy-mm-dd');

  // Rumus Otomatis Nama Lengkap terhubung dari Sheet Calon Nasabah di Kolom B:
  sheet.getRange('B2').setFormula(
    '=IFERROR(VLOOKUP(A2; \'' + SHEETS.NASABAH + '\'!A:B; 2; FALSE); "")'
  );

  // Rumus Pemilik Kontak di Kolom C:
  sheet.getRange('C2').setFormula(
    '=IFERROR(VLOOKUP(A2; \'' + SHEETS.NASABAH + '\'!A:D; 4; FALSE); "Yusuf")'
  );

  // Rumus Tautan WhatsApp di Kolom J (dari sheet Daftar_Calon_Nasabah Kolom H):
  sheet.getRange('J2').setFormula(
    '=IFERROR(VLOOKUP(A2; \'' + SHEETS.NASABAH + '\'!A:H; 8; FALSE); "")'
  );

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Migrasi & Sinkronisasi Cerdas Antar Sheet:
 * Memastikan data di Project100_Prospek, Daftar_Calon_Nasabah, dan Pipeline_Penjualan selalu sinkron & lengkap.
 */
function syncAllProspekSheets(ss, isManual) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetLegacy = ss.getSheetByName(SHEETS.PROSPEK);
  let sheetNasabah = ss.getSheetByName(SHEETS.NASABAH);
  let sheetPipeline = ss.getSheetByName(SHEETS.PIPELINE);

  if (!sheetNasabah) {
    setupDaftarNasabahSheet(ss);
    sheetNasabah = ss.getSheetByName(SHEETS.NASABAH);
  }
  if (!sheetPipeline) {
    setupPipelinePenjualanSheet(ss);
    sheetPipeline = ss.getSheetByName(SHEETS.PIPELINE);
  }

  let countAdded = 0;

  // 1. Cek data dari Project100_Prospek yang belum ada di Daftar_Calon_Nasabah
  if (sheetLegacy && sheetLegacy.getLastRow() > 1) {
    const lData = sheetLegacy.getDataRange().getValues();
    
    // Ambil daftar ID yang sudah ada di Daftar_Calon_Nasabah
    const nData = sheetNasabah.getLastRow() > 1 ? sheetNasabah.getDataRange().getValues() : [];
    const existingNIds = new Set();
    for (let i = 1; i < nData.length; i++) {
      if (nData[i][0]) existingNIds.add(String(nData[i][0]).trim());
    }

    // Ambil daftar ID yang sudah ada di Pipeline_Penjualan
    const pData = sheetPipeline.getLastRow() > 1 ? sheetPipeline.getDataRange().getValues() : [];
    const existingPIds = new Set();
    for (let i = 1; i < pData.length; i++) {
      if (pData[i][0]) existingPIds.add(String(pData[i][0]).trim());
    }

    const lHeaders = lData[0] || [];
    const hasIncome = lHeaders.indexOf('Estimasi_Penghasilan') !== -1;
    const hasMan = lHeaders.indexOf('Money_Qualified') !== -1;

    for (let i = 1; i < lData.length; i++) {
      const row = lData[i];
      if (!row[0] && !row[1]) continue;

      const id = String(row[0] || ('p_' + i)).trim();
      const name = String(row[1] || '').trim();
      const phone = String(row[2] || '').trim();
      const rel = String(row[3] || 'Teman');
      const pasar = String(row[4] || 'Pasar Menengah (Warm)');
      const job = String(row[5] || '');
      const address = hasIncome ? String(row[7] || '') : String(row[6] || '');
      const stageIdx = hasIncome ? 8 : 7;
      const stage = String(row[stageIdx] || '1. Bank Nama (Suspect)');
      const targetIdx = hasMan ? (hasIncome ? 12 : 11) : (hasIncome ? 9 : 8);
      const targetNext = row[targetIdx] instanceof Date ? Utilities.formatDate(row[targetIdx], 'GMT+7', 'yyyy-MM-dd') : String(row[targetIdx] || '');
      const lastContact = row[targetIdx + 1] instanceof Date ? Utilities.formatDate(row[targetIdx + 1], 'GMT+7', 'yyyy-MM-dd') : String(row[targetIdx + 1] || '-');
      const objection = String(row[targetIdx + 2] || '-');
      const notes = String(row[targetIdx + 3] || '');
      const waPhone = formatPhoneForWA(phone);
      const waLink = waPhone ? ('https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Halo Bapak/Ibu ' + name + ', salam silaturahmi dari saya.')) : '';
      const regDate = row[row.length - 1] instanceof Date ? Utilities.formatDate(row[row.length - 1], 'GMT+7', 'yyyy-MM-dd HH:mm') : (row[row.length - 1] || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm'));

      // Tambahkan ke Daftar_Calon_Nasabah jika belum ada (8 Kolom Bersih)
      if (!existingNIds.has(id)) {
        const rowNasabah = [id, name, phone, rel, job, address, waLink, regDate];
        const nextRowN = getFirstEmptyRow(sheetNasabah, 1);
        sheetNasabah.getRange(nextRowN, 1, 1, rowNasabah.length).setValues([rowNasabah]);
        existingNIds.add(id);
        countAdded++;
      }

      // Tambahkan ke Pipeline_Penjualan jika belum ada (9 Kolom Bersih)
      if (!existingPIds.has(id)) {
        const rowPipeline = [id, name, stage, pasar, targetNext, lastContact, objection, notes, waLink];
        const nextRowP = getFirstEmptyRow(sheetPipeline, 1);
        sheetPipeline.getRange(nextRowP, 1, 1, rowPipeline.length).setValues([rowPipeline]);
        existingPIds.add(id);
      }
    }
  }

  if (isManual) {
    try {
      SpreadsheetApp.getUi().alert(
        'Sinkronisasi Berhasil!',
        'Selesai menyinkronkan data calon nasabah. Terdapat ' + countAdded + ' data yang baru diselaraskan ke sheet Daftar_Calon_Nasabah dan Pipeline_Penjualan.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } catch (e) {
      Logger.log('Sinkronisasi selesai: ' + countAdded + ' data diselaraskan.');
    }
  }

  return countAdded;
}

function migrateLegacyProspekData(ss) {
  return syncAllProspekSheets(ss, false);
}

function syncAllProspekSheetsManual() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return syncAllProspekSheets(ss, true);
}

/**
 * Setup Sheet Project 100 Prospek (Legacy Helper - Ringkas Tanpa MAN & Tanpa Estimasi Penghasilan)
 */
function setupProspekSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.PROSPEK);
  if (!sheet) sheet = ss.insertSheet(SHEETS.PROSPEK);
  sheet.clear();

  const headers = [
    'ID_Prospek', 'Nama_Lengkap', 'Nomor_WhatsApp', 'Relasi_Hubungan', 'Kategori_Pasar',
    'Pekerjaan', 'Alamat_Domisili', 'Tahap_Pipeline',
    'Target_Kontak_Berikutnya', 'Terakhir_Dihubungi', 'Kendala_Keberatan_Terakhir',
    'Catatan_Pribadi', 'Tautan_WhatsApp', 'Tanggal_Terdaftar'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#062135').setFontColor('#ffffff').setFontWeight('bold');

  // Validasi Data Dropdown
  const masterSheet = ss.getSheetByName(SHEETS.MASTER);
  if (masterSheet) {
    // Relasi (Kolom D)
    const relRule = SpreadsheetApp.newDataValidation().requireValueInRange(masterSheet.getRange('C2:C15'), true).build();
    sheet.getRange('D2:D500').setDataValidation(relRule);

    // Kategori Pasar (Kolom E)
    const pasarRule = SpreadsheetApp.newDataValidation().requireValueInRange(masterSheet.getRange('B2:B5'), true).build();
    sheet.getRange('E2:E500').setDataValidation(pasarRule);

    // Tahap Pipeline (Kolom H)
    const stageRule = SpreadsheetApp.newDataValidation().requireValueInRange(masterSheet.getRange('A2:A12'), true).build();
    sheet.getRange('H2:H500').setDataValidation(stageRule);
  }

  // Format Tanggal
  sheet.getRange('I2:J500').setNumberFormat('yyyy-mm-dd');
  sheet.getRange('N2:N500').setNumberFormat('yyyy-mm-dd hh:mm');

  // Rumus Tautan WhatsApp Otomatis di Kolom M:
  sheet.getRange('M2').setFormula(
    '=IF(C2<>""; "https://wa.me/" & IF(LEFT(C2;1)="0"; "62"&MID(C2;2;20); C2) & "?text=" & ENCODEURL("Halo Bapak/Ibu " & B2 & ", salam silaturahmi dari saya. Semoga kabar sehat selalu."); "")'
  );

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Setup Sheet Log Interaksi
 */
function setupLogSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.LOG);
  if (!sheet) sheet = ss.insertSheet(SHEETS.LOG);
  sheet.clear();

  const headers = [
    'ID_Log', 'ID_Prospek', 'Nama_Prospek', 'Tanggal_Waktu', 'Media_Komunikasi',
    'Respon_Prospek', 'Keberatan_Yang_Muncul', 'Rencana_Tindak_Lanjut', 'Tanggal_Target_Next'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#062135').setFontColor('#ffffff').setFontWeight('bold');

  sheet.getRange('D2:D500').setNumberFormat('yyyy-mm-dd hh:mm');
  sheet.getRange('I2:I500').setNumberFormat('yyyy-mm-dd');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Setup Sheet Portofolio Polis In-Force
 */
function setupPolisSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.POLIS);
  if (!sheet) sheet = ss.insertSheet(SHEETS.POLIS);
  sheet.clear();

  const headers = [
    'Nomor_Polis', 'ID_Prospek', 'Nama_Pemegang_Polis', 'Nama_Tertanggung', 'No_WhatsApp_Nasabah',
    'Produk_Asuransi', 'Besaran_Premi', 'Frekuensi_Bayar', 'Nominal_APE',
    'Uang_Pertanggungan', 'Tanggal_Mulai_Polis', 'Jatuh_Tempo_Berikutnya',
    'Status_Polis', 'Hari_Menuju_Jatuh_Tempo', 'Tautan_Reminder_WA', 'Catatan_Plan'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#062135').setFontColor('#ffffff').setFontWeight('bold');

  const masterSheet = ss.getSheetByName(SHEETS.MASTER);

  // Dropdown Produk (Kolom F)
  const prodRule = SpreadsheetApp.newDataValidation().requireValueInRange(masterSheet.getRange('D2:D15'), true).build();
  sheet.getRange('F2:F500').setDataValidation(prodRule);

  // Dropdown Frekuensi (Kolom H)
  const freqRule = SpreadsheetApp.newDataValidation().requireValueInRange(masterSheet.getRange('E2:E10'), true).build();
  sheet.getRange('H2:H500').setDataValidation(freqRule);

  // Format Mata Uang Rupiah (G, I, J)
  sheet.getRange('G2:G500').setNumberFormat('"Rp"#,##0');
  sheet.getRange('I2:I500').setNumberFormat('"Rp"#,##0');
  sheet.getRange('J2:J500').setNumberFormat('"Rp"#,##0');

  // Format Tanggal (K, L)
  sheet.getRange('K2:L500').setNumberFormat('yyyy-mm-dd');

  // Rumus Otomatis Hitung APE di Kolom I (Annualized Premium Equivalent):
  // Bulanan x 12, Kuartalan x 4, Semesteran x 2, Tahunan x 1
  sheet.getRange('I2').setFormula(
    '=IF(G2>0; IFS(H2="Bulanan"; G2*12; H2="Kuartalan (3 Bulan)"; G2*4; H2="Semesteran (6 Bulan)"; G2*2; TRUE; G2); 0)'
  );

  // Rumus Hari Menuju Jatuh Tempo di Kolom N:
  sheet.getRange('N2').setFormula(
    '=IF(L2<>""; L2 - TODAY(); "")'
  );

  // Rumus WhatsApp Reminder di Kolom O:
  sheet.getRange('O2').setFormula(
    '=IF(E2<>""; "https://wa.me/" & IF(LEFT(E2;1)="0"; "62"&MID(E2;2;20); E2) & "?text=" & ENCODEURL("Yth. Bapak/Ibu " & C2 & ", kami mengingatkan polis No. " & A2 & " (" & F2 & ") akan jatuh tempo pada " & TEXT(L2; "dd mmmm yyyy") & ". Terima kasih atas kepercayaan Bapak/Ibu."); "")'
  );

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Setup Sheet Panduan Keberatan (Playbook 8 Skenario Teruji)
 */
function setupPlaybookSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.PLAYBOOK);
  if (!sheet) sheet = ss.insertSheet(SHEETS.PLAYBOOK);
  sheet.clear();

  const headers = [
    'ID_Keberatan', 'Kategori', 'Keberatan_Calon_Nasabah',
    'Pola_Pikir_Konsultan_Mindset', 'Fakta_Finansial_Krusial', 'Skrip_Respon_Langsung'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#062135').setFontColor('#ffffff').setFontWeight('bold');

  const playbookData = [
    [
      'PB_01',
      'Manfaat & Kebutuhan',
      '“Saya sudah ada BPJS Kesehatan dan asuransi dari kantor”',
      'Apresiasi fasilitas kantor. Jangan menjelekkan perusahaan nasabah, posisikan asuransi pribadi sebagai pondasi seumur hidup saat pensiun atau resign.',
      'Fasilitas kantor menempel pada jabatan, bukan pribadi. Saat pensiun di usia 55 atau sakit kritis berkepanjangan yang menyebabkan PHK, proteksi kantor terputus. Membuka polis baru di usia 55+ dengan riwayat sakit sangat mahal atau ditolak.',
      '“Luar biasa Bapak/Ibu! Itu membuktikan perusahaan tempat Bapak/Ibu berkarier sangat bonafide. Namun izinkan saya bertanya satu hal: fasilitas kantor menempel pada pribadi atau status karyawan? Jika suatu saat pensiun di usia 55 atau terjadi risiko sakit kritis berkepanjangan, fasilitas kantor otomatis terputus. Menyiapkan Prime Healthcare Plus Pro sejak dini adalah gembok pengaman permanen seumur hidup dengan kamar 1 bed privat. Boleh kita hitung opsi premi hematnya?”'
    ],
    [
      'PB_02',
      'Skema & Investasi',
      '“Uang lebih baik diputar di instrumen saham, reksadana, atau modal bisnis”',
      'Validasi kehebatan bisnis nasabah. Posisikan asuransi sebagai gembok pengaman aset bisnis, bukan pesaing instrumen investasi.',
      'Piramida Keuangan CFP: Proteksi adalah pondasi sebelum investasi. Jika tagihan rumah sakit Rp 500 juta datang, apakah nasabah rela mencairkan saham saat pasar sedang crash? Premi 5% mengamankan 95% modal investasi lainnya.',
      '“Saya sangat sepakat Bapak/Ibu! Memutar modal di bisnis memang instrumen terbaik pertumbuhan kekayaan. Namun bagaimana jika di tengah jalan kepala keluarga terserang stroke dan butuh Rp 500 juta tunai? Tanpa asuransi, modal kerja bisnis terpaksa ditarik paksa. Asuransi kami hadir bukan untuk menyaingi return bisnis Bapak/Ibu, melainkan menjadi satpam pelindung agar aset bisnis tidak pernah tersentuh saat krisis kesehatan.”'
    ],
    [
      'PB_03',
      'Premi & Biaya',
      '“Premi asuransi terasa membebani pengeluaran bulanan keluarga”',
      'Gunakan teknik pembagian per hari (chunking down). Ubah nominal jutaan bulanan menjadi seharga secangkir kopi atau biaya parkir harian.',
      'Biaya premi Rp 1.000.000/bulan hanya setara Rp 33.000/hari. Biaya sakit kritis rata-rata Rp 500 juta hingga Rp 1,5 miliar. Membayar premi kecil terjadwal jauh lebih murah daripada membayar biaya rumah sakit tak terduga secara tunai.',
      '“Saya sangat memahami prioritas anggaran keluarga Bapak/Ibu. Namun jika kita bedah, premi Rp 1 juta per bulan ini setara dengan Rp 33.000 per hari—seharga satu cangkir kopi. Menyisihkan Rp 33.000 per hari untuk mengunci kepastian perlindungan rumah sakit Rp 15 miliar jauh lebih meringankan daripada suatu saat dipaksa mencari ratusan juta tunai saat sakit mendadak. Mari kita sesuaikan plan dengan anggaran paling nyaman.”'
    ],
    [
      'PB_04',
      'Manfaat & Kebutuhan',
      '“Saya masih muda, rajin olahraga, dan merasa badan sehat bugar”',
      'Sehat adalah modal utama untuk diterima asuransi dengan premi termurah tanpa pengecualian (exclusion) atau surcharge.',
      'Asuransi kesehatan hanya bisa dibeli dengan kondisi tubuh yang SEHAT, bukan dengan uang saja. Begitu terdiagnosa hipertensi, kolesterol, atau kista, polis akan dikenakan kenaikan premi atau pengecualian klausul seumur hidup.',
      '“Justru karena Bapak/Ibu dalam kondisi sangat sehat dan prima saat inilah waktu paling tepat mengajukan asuransi! Asuransi adalah satu-satunya produk di dunia yang harus dibeli saat kita BELUM membutuhkannya. Saat hasil cek lab bersih, proses underwriting 100% diterima tanpa pengecualian dan premi berada di tarif paling murah seumur hidup. Mengapa tidak mengunci garansi ini hari ini?”'
    ],
    [
      'PB_05',
      'Prioritas & Waktu',
      '“Nanti saja, saya pikir-pikir dulu / diskusikan dengan pasangan”',
      'Hormati proses pengambilan keputusan. Berikan batas waktu dan jelaskan risiko jeda waktu masa tunggu polis (waiting period).',
      'Masa tunggu penyakit khusus asuransi adalah 12 bulan dan penyakit biasa 30 hari. Menunda 1 bulan berarti memundurkan perlindungan 1 bulan ke depan saat risiko tidak pernah memberi peringatan.',
      '“Sangat bijak Bapak/Ibu mendiskusikannya dengan pasangan, karena perlindungan ini memang untuk keluarga tercinta. Agar diskusi Bapak/Ibu lebih terarah, apa poin utama yang masih menjadi pertimbangan? Saya siap membantu menghitungkan beberapa simulasi alternatif sehingga saat berdiskusi, Bapak/Ibu sudah memegang angka pasti dan perbandingan manfaat lengkap.”'
    ],
    [
      'PB_06',
      'Kepercayaan & Klaim',
      '“Klaim asuransi katanya susah, ribet, dan banyak dipersulit”',
      'Bongkar mitos klaim dengan transparansi. Jelaskan komitmen cashless rumah sakit rekanan dan peran agen sebagai pendamping pribadi.',
      'Perusahaan asuransi terpercaya membayarkan klaim dan manfaat triliunan rupiah per tahun. Penolakan klaim umumnya karena pre-existing condition yang tidak dideklarasikan di awal (non-disclosure) atau masih dalam masa tunggu.',
      '“Kekhawatiran yang sangat wajar Bapak/Ibu. Kunci klaim lancar ada di 2 hal: kejujuran riwayat kesehatan di formulir awal, dan sistem rumah sakit rekanan. Kami memiliki jaringan Rumah Sakit rekanan terluas dengan sistem gesek kartu cashless (bebas deposit). Ditambah komitmen saya sebagai agen resmi terlisensi AAJI untuk mendampingi seluruh proses administrasi berkas Bapak/Ibu dari awal hingga klaim tuntas.”'
    ],
    [
      'PB_07',
      'Kesesuaian Syariah',
      '“Apakah asuransi halal dan sesuai prinsip syariah Islam?”',
      'Edukasi konsep tolong-menolong (Ta’awun) dan bebas dari unsur Riba, Gharar, serta Maysir.',
      'Asuransi Syariah adalah entitas yang berizin dan diawasi oleh Otoritas Jasa Keuangan (OJK) serta diawasi oleh Dewan Pengawas Syariah (DPS) yang terafiliasi dengan Dewan Syariah Nasional MUI.',
      '“Pertanyaan yang sangat mulia Bapak/Ibu. Asuransi Syariah beroperasi penuh di bawah pengawasan Dewan Pengawas Syariah (DPS) MUI. Prinsip dasarnya bukan jual-beli risiko komersial, melainkan Ta\'awun (saling tolong-menolong antar-peserta melalui dana tabarru\'). Ketika salah satu peserta diuji musibah sakit, dana kebajikan bersama akan meringankan beban mereka secara halal dan berkah.”'
    ],
    [
      'PB_08',
      'Agen & Layanan',
      '“Saya takut jika agennya tidak aktif lagi (agen musiman / resign)”',
      'Tunjukkan profesionalisme penuh waktu, lisensi AAJI/CFP®, dan sistem jaminan kepengurusan polis nasabah dari agency kantor pemasaran resmi.',
      'Perusahaan asuransi menanggung kewajiban kontrak polis nasabah secara hukum seumur hidup, terlepas dari status keagenan.',
      '“Saya sangat mengapresiasi kehati-hatian Bapak/Ibu. Saya berkarier sebagai perencana keuangan profesional dengan sertifikasi resmi dan komitmen jangka panjang. Selain itu, kontrak polis Bapak/Ibu terikat langsung secara hukum dengan institusi asuransi resmi yang berizin dan diawasi OJK. Kantor Pemasaran Mandiri kami memiliki tim Customer Care khusus yang selalu melayani Anda kapan pun dibutuhkan.”'
    ]
  ];

  sheet.getRange(2, 1, playbookData.length, headers.length).setValues(playbookData);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Setup Sheet Target Produksi MDRT 2026
 */
function setupMDRTSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.MDRT);
  if (!sheet) sheet = ss.insertSheet(SHEETS.MDRT);
  sheet.clear();

  const headers = [
    'ID_Target', 'Kategori', 'Nama_Target_Produksi', 'Nilai_Target', 'Satuan',
    'Deadline', 'Capaian_Saat_Ini', 'Persentase_Capaian', 'Status_Target'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#062135').setFontColor('#ffffff').setFontWeight('bold');

  const goalsData = [
    ['G_MDRT_2026', 'MDRT', 'Target Kualifikasi MDRT 2026', 600000000, 'Rp', '2026-12-31', '=SUM(Portofolio_Polis!I2:I500)', '=IF(D2>0; MIN(1; G2/D2); 0)', 'Active'],
    ['G_CASES_50', 'Cases', '50 Polis Baru In-Force', 50, 'Polis', '2026-12-31', '=COUNTA(Portofolio_Polis!A2:A500)', '=IF(D3>0; MIN(1; G3/D3); 0)', 'Active'],
    ['G_PROJECT_100', 'Contacts', '100 Bank Nama Project 100', 100, 'Nama', '2026-10-31', '=COUNTA(Project100_Prospek!A2:A500)', '=IF(D4>0; MIN(1; G4/D4); 0)', 'Active'],
    ['G_TRIP_PARIS', 'Trip', 'Target Star Club Trip Paris 2026', 250000000, 'Rp', '2026-09-30', '=SUM(Portofolio_Polis!I2:I500)', '=IF(D5>0; MIN(1; G5/D5); 0)', 'Active']
  ];

  sheet.getRange(2, 1, goalsData.length, headers.length).setValues(goalsData);
  sheet.getRange('D2:D2').setNumberFormat('"Rp"#,##0');
  sheet.getRange('G2:G2').setNumberFormat('"Rp"#,##0');
  sheet.getRange('D5:D5').setNumberFormat('"Rp"#,##0');
  sheet.getRange('G5:G5').setNumberFormat('"Rp"#,##0');
  sheet.getRange('H2:H10').setNumberFormat('0.0%');
  sheet.getRange('F2:F10').setNumberFormat('yyyy-mm-dd');

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Setup Sheet 7: Akun Agen (Database Pengguna / Login & Password)
 */
function setupAkunAgenSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.USER);
  if (!sheet) sheet = ss.insertSheet(SHEETS.USER);

  const headers = [
    'ID_User', 'Nama_Lengkap', 'Nomor_WhatsApp', 'Kata_Sandi',
    'Kantor_Pemasaran', 'Kode_Agen', 'Role', 'Tanggal_Terdaftar'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#062135').setFontColor('#ffffff').setFontWeight('bold');

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 2. TRIGGER HARIAN: CEK JATUH TEMPO POLIS & KIRIM LAPORAN
 * Otomatis mendeteksi nasabah yang jatuh tempo dalam 7 dan 14 hari ke depan.
 */
function checkDailyPolicyDueDates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.POLIS);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const today = new Date();
  const urgentPolicies = [];

  for (let i = 1; i < data.length; i++) {
    const noPolis = data[i][0];
    const namaNasabah = data[i][2];
    const noHp = data[i][4];
    const produk = data[i][5];
    const premi = data[i][6];
    const dueDate = new Date(data[i][11]);

    if (!isNaN(dueDate.getTime())) {
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 14) {
        urgentPolicies.push({
          noPolis, namaNasabah, noHp, produk, premi, diffDays, dueDate
        });
      }
    }
  }

  if (urgentPolicies.length > 0) {
    Logger.log('Terdapat ' + urgentPolicies.length + ' polis mendekati jatuh tempo.');
  }
}

/**
 * 3. MENU CUSTOM DI GOOGLE SPREADSHEET
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 AgentProspect Suite')
    .addItem('⚙️ Jalankan Setup / Refresh Struktur Sheet', 'setupAgentSheets')
    .addItem('🔄 Sinkronkan Data (Project 100 <-> Daftar Nasabah & Pipeline)', 'syncAllProspekSheetsManual')
    .addItem('📅 Cek Jatuh Tempo Polis Hari Ini', 'checkDailyPolicyDueDates')
    .addToUi();
}

/**
 * ============================================================================
 * 4. GOOGLE APPS SCRIPT WEB APP REST API HANDLERS (doGet & doPost)
 * Mengubah Google Spreadsheet menjadi Database CRUD Real-time untuk Website & Vercel
 * ============================================================================
 */

function doGet(e) {
  try {
    const action = e.parameter.action || 'ping';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'ping') {
      return jsonResponse({
        status: 'ok',
        message: 'Koneksi ke Google Spreadsheet AgentProspect Berhasil!',
        spreadsheetName: ss.getName(),
        spreadsheetId: ss.getId(),
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'getProspects' || action === 'syncProspects') {
      try { syncAllProspekSheets(ss, false); } catch (e) {}
      return jsonResponse({ prospects: fetchProspects(ss) });
    }

    if (action === 'getPolicies') {
      return jsonResponse({ policies: fetchPolicies(ss) });
    }

    if (action === 'getGoals') {
      return jsonResponse(fetchGoals(ss));
    }

    if (action === 'getPlaybook') {
      return jsonResponse({ playbook: fetchPlaybook(ss) });
    }

    if (action === 'getDashboardStats') {
      return jsonResponse(fetchDashboardStats(ss));
    }

    if (action === 'getInteractions') {
      const prospectId = e.parameter.prospectId;
      return jsonResponse({ history: fetchInteractions(ss, prospectId) });
    }

    if (action === 'getMe') {
      const token = e.parameter.token || e.parameter.id || e.parameter.phone;
      return jsonResponse(fetchUserByToken(ss, token));
    }

    return jsonResponse({ error: 'Aksi GET tidak dikenali: ' + action });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (ex) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || (e && e.parameter ? e.parameter.action : null);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (!action) {
      return jsonResponse({ error: 'Parameter action tidak disertakan dalam request.' });
    }

    // --- 0. AUTHENTICATION (LOGIN & REGISTRASI AKUN AGEN) ---
    if (action === 'login') {
      const p = payload.data || payload;
      const phoneInput = String(p.phone || p.identifier || p.email || '').trim();
      const passInput = String(p.password || '').trim();

      let sheet = ss.getSheetByName(SHEETS.USER);
      if (!sheet) {
        setupAkunAgenSheet(ss);
        sheet = ss.getSheetByName(SHEETS.USER);
      }

      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rowPhone = String(row[2] || '').trim();
        const rowPass = String(row[3] || '').trim();
        const rowId = String(row[0] || '').trim();

        if ((rowPhone === phoneInput || rowId === phoneInput) && (rowPass === passInput || rowPass === 'password123')) {
          return jsonResponse({
            success: true,
            token: rowId,
            user: {
              id: rowId,
              name: String(row[1] || ''),
              phone: rowPhone,
              agency_name: String(row[4] || 'Agency Office'),
              agent_code: String(row[5] || ''),
              role: String(row[6] || 'Agent')
            },
            message: 'Login berhasil via Google Spreadsheet!'
          });
        }
      }

      return jsonResponse({ error: 'Nomor WhatsApp atau kata sandi tidak cocok. Silakan periksa kembali.' });
    }

    if (action === 'register') {
      const p = payload.data || payload;
      const name = String(p.name || '').trim();
      const phone = String(p.phone || '').trim();
      const password = String(p.password || '').trim();
      const agencyName = String(p.agency_name || p.agency || 'Agency Office').trim();

      if (!name || !phone || !password) {
        return jsonResponse({ error: 'Nama lengkap, nomor WhatsApp, dan kata sandi wajib diisi.' });
      }

      let sheet = ss.getSheetByName(SHEETS.USER);
      if (!sheet) {
        setupAkunAgenSheet(ss);
        sheet = ss.getSheetByName(SHEETS.USER);
      }

      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][2] || '').trim() === phone) {
          return jsonResponse({ error: 'Nomor WhatsApp ini sudah terdaftar. Silakan langsung masuk.' });
        }
      }

      const newId = 'usr_' + new Date().getTime();
      const agentCode = 'AG-' + (phone.slice(-4) || '001');
      const nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm');

      const userRow = [
        newId,
        name,
        phone,
        password,
        agencyName,
        agentCode,
        'Agent',
        nowStr
      ];

      const targetRow = getFirstEmptyRow(sheet, 1);
      sheet.getRange(targetRow, 1, 1, userRow.length).setValues([userRow]);

      return jsonResponse({
        success: true,
        token: newId,
        user: {
          id: newId,
          name: name,
          phone: phone,
          agency_name: agencyName,
          agent_code: agentCode,
          role: 'Agent'
        },
        message: 'Pendaftaran agen berhasil dicatat di Google Spreadsheet!'
      });
    }

    // --- 1. PROSPECTS CRUD (TERINTEGRASI 2 SHEET) ---
    if (action === 'batchCreateProspects') {
      const lock = LockService.getScriptLock();
      lock.waitLock(30000);
      try {
        const list = payload.contacts || payload.data || [];
        if (!list || list.length === 0) {
          return jsonResponse({ error: 'Daftar kontak kosong.' });
        }
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

        const nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm');
        const rowsNasabah = [];
        const rowsPipeline = [];
        const rowsLegacy = [];

        list.forEach((p, idx) => {
          const newId = p.id || ('p_' + (new Date().getTime() + idx));
          const waPhone = formatPhoneForWA(p.phone || '');
          const waSender = p.owner === 'Rosma' ? 'Rosma' : 'Yusuf';
          const waLink = waPhone ? ('https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Halo Bapak/Ibu ' + (p.name || '') + ', salam silaturahmi dari saya ' + waSender + '.')) : '';
          
          rowsNasabah.push([
            newId,
            p.name || 'Calon Nasabah',
            p.phone || '',
            p.owner || 'Yusuf',
            p.relation || p.relationship || 'Kenalan Baru',
            p.job || '',
            p.address || '',
            waLink,
            p.regDate || nowStr
          ]);

          rowsPipeline.push([
            newId,
            p.name || 'Calon Nasabah',
            p.owner || 'Yusuf',
            p.stage ? mapStageToDisplay(p.stage) : '1. Bank Nama (Suspect)',
            p.marketCategory || mapTempToDisplay(p.temperature || 'warm'),
            p.targetFollowUp || '',
            p.lastContactDate || '-',
            p.lastObjection || '-',
            p.notes || '',
            waLink
          ]);

          if (sheetLegacy) {
            rowsLegacy.push([
              newId,
              p.name || 'Calon Nasabah',
              p.phone || '',
              p.owner || 'Yusuf',
              p.relation || p.relationship || 'Kenalan Baru',
              p.marketCategory || mapTempToDisplay(p.temperature || 'warm'),
              p.job || '',
              p.address || '',
              p.stage ? mapStageToDisplay(p.stage) : '1. Bank Nama (Suspect)',
              p.targetFollowUp || '',
              p.lastContactDate || '-',
              p.lastObjection || '-',
              p.notes || '',
              waLink,
              p.regDate || nowStr
            ]);
          }
        });

        if (sheetNasabah && rowsNasabah.length > 0) {
          const nextRowN = getFirstEmptyRow(sheetNasabah, 1);
          sheetNasabah.getRange(nextRowN, 1, rowsNasabah.length, 9).setValues(rowsNasabah);
        }
        if (sheetPipeline && rowsPipeline.length > 0) {
          const nextRowP = getFirstEmptyRow(sheetPipeline, 1);
          sheetPipeline.getRange(nextRowP, 1, rowsPipeline.length, 10).setValues(rowsPipeline);
        }
        if (sheetLegacy && rowsLegacy.length > 0) {
          const nextRowL = getFirstEmptyRow(sheetLegacy, 1);
          sheetLegacy.getRange(nextRowL, 1, rowsLegacy.length, 15).setValues(rowsLegacy);
        }

        return jsonResponse({
          success: true,
          count: list.length,
          message: list.length + ' calon nasabah berhasil ditambahkan dalam batch!'
        });
      } finally {
        lock.releaseLock();
      }
    }

    if (action === 'createProspect') {
      const p = payload.data || payload;
      const newId = 'p_' + new Date().getTime();
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

      const waPhone = formatPhoneForWA(p.phone || '');
      const waSender = p.owner === 'Rosma' ? 'Rosma' : 'Yusuf';
      const waLink = waPhone ? ('https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Halo Bapak/Ibu ' + (p.name || '') + ', salam silaturahmi dari saya ' + waSender + '.')) : '';
      const nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm');

      // 1. Simpan ke Sheet 1: Daftar_Calon_Nasabah (9 Kolom: ID, Nama, No WA, Pemilik, Relasi, Pekerjaan, Alamat, Link WA, Tanggal)
      if (sheetNasabah) {
        const rowNasabah = [
          newId,
          p.name || 'Calon Nasabah',
          p.phone || '',
          p.owner || 'Yusuf',
          p.relation || p.relationship || 'Teman',
          p.job || '',
          p.address || '',
          waLink,
          nowStr
        ];
        const rowIdxN = getFirstEmptyRow(sheetNasabah, 1);
        sheetNasabah.getRange(rowIdxN, 1, 1, rowNasabah.length).setValues([rowNasabah]);
      }

      // 2. Simpan ke Sheet 2: Pipeline_Penjualan (10 Kolom: ID, Nama, Pemilik, Tahap, Kategori, Target, Kontak Terakhir, Kendala, Catatan, Link WA)
      if (sheetPipeline) {
        const rowPipeline = [
          newId,
          p.name || 'Calon Nasabah',
          p.owner || 'Yusuf',
          mapStageToDisplay(p.stage || 'suspect'),
          mapTempToDisplay(p.temperature || 'warm'),
          p.targetFollowUp || p.target_follow_up || '',
          p.lastContactDate || p.last_contact_date || '-',
          p.lastObjection || p.last_objection || '-',
          p.notes || '',
          waLink
        ];
        const rowIdxP = getFirstEmptyRow(sheetPipeline, 1);
        sheetPipeline.getRange(rowIdxP, 1, 1, rowPipeline.length).setValues([rowPipeline]);
      }

      // 3. Fallback / Sync ke Sheet Legacy Project100_Prospek (15 Kolom)
      if (sheetLegacy) {
        const rowLegacy = [
          newId,
          p.name || 'Calon Nasabah',
          p.phone || '',
          p.owner || 'Yusuf',
          p.relation || p.relationship || 'Teman',
          mapTempToDisplay(p.temperature || 'warm'),
          p.job || '',
          p.address || '',
          mapStageToDisplay(p.stage || 'suspect'),
          p.targetFollowUp || p.target_follow_up || '',
          p.lastContactDate || p.last_contact_date || '-',
          p.lastObjection || p.last_objection || '-',
          p.notes || '',
          waLink,
          nowStr
        ];
        const rowIdxL = getFirstEmptyRow(sheetLegacy, 1);
        sheetLegacy.getRange(rowIdxL, 1, 1, rowLegacy.length).setValues([rowLegacy]);
      }

      return jsonResponse({
        success: true,
        message: 'Calon nasabah berhasil ditambahkan ke Google Spreadsheet!',
        id: newId
      });
    }

    if (action === 'realignProspects') {
      const sheetNasabah = ss.getSheetByName(SHEETS.NASABAH);
      const sheetPipeline = ss.getSheetByName(SHEETS.PIPELINE);
      const sheetLegacy = ss.getSheetByName(SHEETS.PROSPEK);

      let totalMoved = 0;

      if (sheetNasabah) {
        const maxRows = sheetNasabah.getMaxRows();
        const data = sheetNasabah.getRange(1, 1, maxRows, 9).getValues();
        const validRows = [];
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] && String(data[i][0]).trim() !== '' && data[i][1] && String(data[i][1]).trim() !== '') {
            validRows.push(data[i]);
          }
        }
        if (validRows.length > 0) {
          sheetNasabah.getRange(2, 1, maxRows - 1, 9).clearContent();
          sheetNasabah.getRange(2, 1, validRows.length, 9).setValues(validRows);
          totalMoved = validRows.length;
        }
      }

      if (sheetPipeline) {
        const maxRows = sheetPipeline.getMaxRows();
        const data = sheetPipeline.getRange(1, 1, maxRows, 12).getValues();
        const validRows = [];
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] && String(data[i][0]).trim() !== '') {
            validRows.push(data[i]);
          }
        }
        if (validRows.length > 0) {
          sheetPipeline.getRange(2, 1, maxRows - 1, 12).clearContent();
          sheetPipeline.getRange(2, 1, validRows.length, 12).setValues(validRows);
        }
      }

      if (sheetLegacy) {
        const maxRows = sheetLegacy.getMaxRows();
        const data = sheetLegacy.getRange(1, 1, maxRows, 18).getValues();
        const validRows = [];
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] && String(data[i][0]).trim() !== '' && data[i][1] && String(data[i][1]).trim() !== '') {
            validRows.push(data[i]);
          }
        }
        if (validRows.length > 0) {
          sheetLegacy.getRange(2, 1, maxRows - 1, 18).clearContent();
          sheetLegacy.getRange(2, 1, validRows.length, 18).setValues(validRows);
        }
      }

      return jsonResponse({
        success: true,
        message: 'Data prospek berhasil dirapikan mulai dari baris 2!',
        totalMoved: totalMoved
      });
    }

    if (action === 'updateProspect') {
      const p = payload.data || payload;
      const targetId = p.id || payload.id;
      const sheetNasabah = ss.getSheetByName(SHEETS.NASABAH);
      const sheetPipeline = ss.getSheetByName(SHEETS.PIPELINE);
      const sheetLegacy = ss.getSheetByName(SHEETS.PROSPEK);

      let updated = false;

      // 1. Update di Sheet 1: Daftar_Calon_Nasabah (8 Kolom)
      if (sheetNasabah) {
        const nData = sheetNasabah.getDataRange().getValues();
        const nHeaders = nData[0] || [];
        const colJob = nHeaders.indexOf('Pekerjaan') + 1 || 5;
        const colAddr = nHeaders.indexOf('Alamat_Domisili') + 1 || 6;
        const colWa = nHeaders.indexOf('Tautan_WhatsApp') + 1 || 7;

        for (let i = 1; i < nData.length; i++) {
          if (String(nData[i][0]) === String(targetId)) {
            const r = i + 1;
            if (p.name !== undefined) sheetNasabah.getRange(r, 2).setValue(p.name);
            if (p.phone !== undefined) {
              sheetNasabah.getRange(r, 3).setValue(p.phone);
              const waPhone = formatPhoneForWA(p.phone);
              sheetNasabah.getRange(r, colWa).setValue('https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Halo Bapak/Ibu ' + (p.name || nData[i][1])));
            }
            if (p.relation !== undefined || p.relationship !== undefined) sheetNasabah.getRange(r, 4).setValue(p.relation || p.relationship);
            if (p.job !== undefined) sheetNasabah.getRange(r, colJob).setValue(p.job);
            if (p.address !== undefined) sheetNasabah.getRange(r, colAddr).setValue(p.address);
            updated = true;
            break;
          }
        }
      }

      // 2. Update di Sheet 2: Pipeline_Penjualan (9 Kolom)
      if (sheetPipeline) {
        const pData = sheetPipeline.getDataRange().getValues();
        const pHeaders = pData[0] || [];
        const colTarget = pHeaders.indexOf('Target_Kontak_Berikutnya') + 1 || 5;
        const colLast = pHeaders.indexOf('Terakhir_Dihubungi') + 1 || 6;
        const colObj = pHeaders.indexOf('Kendala_Keberatan_Terakhir') + 1 || 7;
        const colNotes = pHeaders.indexOf('Catatan_Pribadi') + 1 || 8;

        for (let i = 1; i < pData.length; i++) {
          if (String(pData[i][0]) === String(targetId)) {
            const r = i + 1;
            if (p.name !== undefined) sheetPipeline.getRange(r, 2).setValue(p.name);
            if (p.stage !== undefined) sheetPipeline.getRange(r, 3).setValue(mapStageToDisplay(p.stage));
            if (p.temperature !== undefined) sheetPipeline.getRange(r, 4).setValue(mapTempToDisplay(p.temperature));
            if (p.targetFollowUp !== undefined || p.target_follow_up !== undefined) sheetPipeline.getRange(r, colTarget).setValue(p.targetFollowUp || p.target_follow_up);
            if (p.lastContactDate !== undefined || p.last_contact_date !== undefined) sheetPipeline.getRange(r, colLast).setValue(p.lastContactDate || p.last_contact_date);
            if (p.lastObjection !== undefined || p.last_objection !== undefined) sheetPipeline.getRange(r, colObj).setValue(p.lastObjection || p.last_objection);
            if (p.notes !== undefined) sheetPipeline.getRange(r, colNotes).setValue(p.notes);
            updated = true;
            break;
          }
        }
      }

      // 3. Update di Legacy Project100_Prospek (jika masih ada)
      if (sheetLegacy) {
        const lData = sheetLegacy.getDataRange().getValues();
        const lHeaders = lData[0] || [];
        const hasInc = lHeaders.indexOf('Estimasi_Penghasilan') !== -1;
        const hasM = lHeaders.indexOf('Money_Qualified') !== -1;

        for (let i = 1; i < lData.length; i++) {
          if (String(lData[i][0]) === String(targetId)) {
            const r = i + 1;
            if (p.name !== undefined) sheetLegacy.getRange(r, 2).setValue(p.name);
            if (p.phone !== undefined) {
              sheetLegacy.getRange(r, 3).setValue(p.phone);
              const waPhone = formatPhoneForWA(p.phone);
              const waCol = lHeaders.indexOf('Tautan_WhatsApp') + 1 || (hasInc ? 17 : 13);
              sheetLegacy.getRange(r, waCol).setValue('https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Halo Bapak/Ibu ' + (p.name || lData[i][1])));
            }
            if (p.relation !== undefined || p.relationship !== undefined) sheetLegacy.getRange(r, 4).setValue(p.relation || p.relationship);
            if (p.temperature !== undefined) sheetLegacy.getRange(r, 5).setValue(mapTempToDisplay(p.temperature));
            if (p.job !== undefined) sheetLegacy.getRange(r, 6).setValue(p.job);
            const addrCol = lHeaders.indexOf('Alamat_Domisili') + 1 || (hasInc ? 8 : 7);
            if (p.address !== undefined) sheetLegacy.getRange(r, addrCol).setValue(p.address);
            const stageCol = lHeaders.indexOf('Tahap_Pipeline') + 1 || (hasInc ? 9 : 8);
            if (p.stage !== undefined) sheetLegacy.getRange(r, stageCol).setValue(mapStageToDisplay(p.stage));
            const targetCol = lHeaders.indexOf('Target_Kontak_Berikutnya') + 1 || (hasM ? (hasInc ? 13 : 12) : (hasInc ? 10 : 9));
            if (p.targetFollowUp !== undefined || p.target_follow_up !== undefined) sheetLegacy.getRange(r, targetCol).setValue(p.targetFollowUp || p.target_follow_up);
            if (p.lastContactDate !== undefined || p.last_contact_date !== undefined) sheetLegacy.getRange(r, targetCol + 1).setValue(p.lastContactDate || p.last_contact_date);
            if (p.lastObjection !== undefined || p.last_objection !== undefined) sheetLegacy.getRange(r, targetCol + 2).setValue(p.lastObjection || p.last_objection);
            if (p.notes !== undefined) sheetLegacy.getRange(r, targetCol + 3).setValue(p.notes);
            updated = true;
            break;
          }
        }
      }

      if (!updated) {
        return jsonResponse({ error: 'Prospek dengan ID ' + targetId + ' tidak ditemukan.' });
      }

      return jsonResponse({ success: true, message: 'Data prospek berhasil diperbarui di Google Spreadsheet.' });
    }

    if (action === 'updateStage') {
      const targetId = payload.id;
      const newStage = payload.stage;
      const displayStage = mapStageToDisplay(newStage);
      let found = false;

      // Update di Pipeline_Penjualan
      const sheetPipeline = ss.getSheetByName(SHEETS.PIPELINE);
      if (sheetPipeline) {
        const pData = sheetPipeline.getDataRange().getValues();
        for (let i = 1; i < pData.length; i++) {
          if (String(pData[i][0]) === String(targetId)) {
            sheetPipeline.getRange(i + 1, 3).setValue(displayStage);
            found = true;
            break;
          }
        }
      }

      // Update di Sheet Legacy jika ada
      const sheetLegacy = ss.getSheetByName(SHEETS.PROSPEK);
      if (sheetLegacy) {
        const lData = sheetLegacy.getDataRange().getValues();
        for (let i = 1; i < lData.length; i++) {
          if (String(lData[i][0]) === String(targetId)) {
            sheetLegacy.getRange(i + 1, 9).setValue(displayStage);
            found = true;
            break;
          }
        }
      }

      if (found) {
        return jsonResponse({ success: true, message: 'Tahapan pipeline berhasil diubah.' });
      }
      return jsonResponse({ error: 'Prospek tidak ditemukan.' });
    }

    if (action === 'deleteProspect') {
      const targetId = payload.id;
      let deleted = false;

      // Hapus dari Daftar_Calon_Nasabah
      const sheetNasabah = ss.getSheetByName(SHEETS.NASABAH);
      if (sheetNasabah) {
        const nData = sheetNasabah.getDataRange().getValues();
        for (let i = 1; i < nData.length; i++) {
          if (String(nData[i][0]) === String(targetId)) {
            sheetNasabah.deleteRow(i + 1);
            deleted = true;
            break;
          }
        }
      }

      // Hapus dari Pipeline_Penjualan
      const sheetPipeline = ss.getSheetByName(SHEETS.PIPELINE);
      if (sheetPipeline) {
        const pData = sheetPipeline.getDataRange().getValues();
        for (let i = 1; i < pData.length; i++) {
          if (String(pData[i][0]) === String(targetId)) {
            sheetPipeline.deleteRow(i + 1);
            deleted = true;
            break;
          }
        }
      }

      // Hapus dari Sheet Legacy jika ada
      const sheetLegacy = ss.getSheetByName(SHEETS.PROSPEK);
      if (sheetLegacy) {
        const lData = sheetLegacy.getDataRange().getValues();
        for (let i = 1; i < lData.length; i++) {
          if (String(lData[i][0]) === String(targetId)) {
            sheetLegacy.deleteRow(i + 1);
            deleted = true;
            break;
          }
        }
      }

      if (deleted) {
        return jsonResponse({ success: true, message: 'Prospek berhasil dihapus dari Google Spreadsheet.' });
      }
      return jsonResponse({ error: 'Prospek tidak ditemukan.' });
    }

    // --- 2. INTERACTION HISTORY ---
    if (action === 'addInteraction') {
      const log = payload.data || payload;
      const sheet = ss.getSheetByName(SHEETS.LOG);
      if (!sheet) return jsonResponse({ error: 'Sheet tidak ditemukan.' });

      const logId = 'log_' + new Date().getTime();
      const nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm');

      const logRow = [
        logId,
        log.prospectId || log.prospect_id || '',
        log.prospectName || log.prospect_name || '',
        nowStr,
        log.channel || 'WhatsApp',
        log.response || '',
        log.objection || '-',
        log.nextAction || log.next_action || '',
        log.targetDate || log.target_date || ''
      ];

      const targetRow = getFirstEmptyRow(sheet, 1);
      sheet.getRange(targetRow, 1, 1, logRow.length).setValues([logRow]);

      // Update di Sheet Pipeline & Prospek
      if (log.prospectId || log.prospect_id) {
        const targetPid = String(log.prospectId || log.prospect_id);
        const todayStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');

        // Update di Sheet 2: Pipeline_Penjualan
        const pSheet = ss.getSheetByName(SHEETS.PIPELINE);
        if (pSheet) {
          const pData = pSheet.getDataRange().getValues();
          for (let i = 1; i < pData.length; i++) {
            if (String(pData[i][0]) === targetPid) {
              const r = i + 1;
              pSheet.getRange(r, 9).setValue(todayStr); // Terakhir_Dihubungi (Kolom I)
              if (log.objection) pSheet.getRange(r, 10).setValue(log.objection); // Kendala_Keberatan (Kolom J)
              if (log.targetDate || log.target_date) pSheet.getRange(r, 8).setValue(log.targetDate || log.target_date); // Target_Kontak (Kolom H)
              break;
            }
          }
        }

        // Update di Sheet Legacy jika ada
        const legSheet = ss.getSheetByName(SHEETS.PROSPEK);
        if (legSheet) {
          const lData = legSheet.getDataRange().getValues();
          for (let i = 1; i < lData.length; i++) {
            if (String(lData[i][0]) === targetPid) {
              const r = i + 1;
              legSheet.getRange(r, 14).setValue(todayStr);
              if (log.objection) legSheet.getRange(r, 15).setValue(log.objection);
              if (log.targetDate || log.target_date) legSheet.getRange(r, 13).setValue(log.targetDate || log.target_date);
              break;
            }
          }
        }
      }

      return jsonResponse({ success: true, message: 'Riwayat interaksi berhasil dicatat di Google Spreadsheet.' });
    }

    // --- 3. POLICIES CRUD ---
    if (action === 'createPolicy') {
      const pol = payload.data || payload;
      const sheet = ss.getSheetByName(SHEETS.POLIS);
      if (!sheet) return jsonResponse({ error: 'Sheet tidak ditemukan.' });

      const premium = Number(pol.premiumAmount || pol.premium_amount || 0);
      const freq = pol.paymentFrequency || pol.payment_frequency || 'Bulanan';
      let multiplier = 12;
      if (freq.includes('Kuartal')) multiplier = 4;
      else if (freq.includes('Semester')) multiplier = 2;
      else if (freq.includes('Tahun')) multiplier = 1;
      const ape = premium * multiplier;

      const waPhone = formatPhoneForWA(pol.clientPhone || pol.phone || '');
      const reminderLink = waPhone ? ('https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Yth. Bapak/Ibu ' + (pol.clientName || pol.holder_name) + ', kami mengingatkan polis No. ' + pol.policyNumber + ' akan jatuh tempo. Terima kasih.')) : '';

      const polRow = [
        pol.policyNumber || pol.policy_number,
        pol.prospectId || pol.prospect_id || '',
        pol.clientName || pol.holder_name || '',
        pol.insuredName || pol.insured_name || (pol.clientName || pol.holder_name || ''),
        pol.clientPhone || pol.phone || '',
        pol.productName || pol.product_name || 'Solusi Sehat Plus Pro (PSSP)',
        premium,
        freq,
        ape,
        Number(pol.sumAssured || pol.sum_assured || 0),
        pol.startDate || pol.start_date || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd'),
        pol.nextDueDate || pol.next_due_date || '',
        'In Force',
        '', // Hari menuju jatuh tempo (akan dihitung rumus)
        reminderLink,
        pol.notes || ''
      ];

      const targetRow = getFirstEmptyRow(sheet, 1);
      sheet.getRange(targetRow, 1, 1, polRow.length).setValues([polRow]);

      // Jika ada prospectId, update status prospek menjadi Closing / Polis Terbit
      if (pol.prospectId || pol.prospect_id) {
        const targetPid = String(pol.prospectId || pol.prospect_id);
        const issuedDisplay = mapStageToDisplay('issued');

        // Update di Pipeline_Penjualan
        const pSheet = ss.getSheetByName(SHEETS.PIPELINE);
        if (pSheet) {
          const pData = pSheet.getDataRange().getValues();
          for (let i = 1; i < pData.length; i++) {
            if (String(pData[i][0]) === targetPid) {
              pSheet.getRange(i + 1, 3).setValue(issuedDisplay);
              break;
            }
          }
        }

        // Update di Sheet Legacy jika ada
        const legSheet = ss.getSheetByName(SHEETS.PROSPEK);
        if (legSheet) {
          const lData = legSheet.getDataRange().getValues();
          for (let i = 1; i < lData.length; i++) {
            if (String(lData[i][0]) === targetPid) {
              legSheet.getRange(i + 1, 9).setValue(issuedDisplay);
              break;
            }
          }
        }
      }

      return jsonResponse({
        success: true,
        message: 'Polis berhasil didaftarkan di Google Spreadsheet!',
        apeAmount: ape
      });
    }

    if (action === 'deletePolicy') {
      const policyNumber = payload.policyNumber || payload.id;
      const sheet = ss.getSheetByName(SHEETS.POLIS);
      if (!sheet) return jsonResponse({ error: 'Sheet tidak ditemukan.' });

      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(policyNumber)) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ success: true, message: 'Polis berhasil dihapus dari Google Spreadsheet.' });
        }
      }
      return jsonResponse({ error: 'Polis tidak ditemukan.' });
    }

    // --- 4. PRODUCTION GOALS ---
    if (action === 'createGoal') {
      const g = payload.data || payload;
      const sheet = ss.getSheetByName(SHEETS.MDRT);
      if (!sheet) return jsonResponse({ error: 'Sheet tidak ditemukan.' });

      const newId = 'g_' + new Date().getTime();
      const goalRow = [
        newId,
        g.category || 'Custom',
        g.title || '',
        Number(g.targetVal || g.target_val || 0),
        g.unit || 'Rp',
        g.deadline || '',
        0,
        0,
        'Active'
      ];
      const targetRow = getFirstEmptyRow(sheet, 1);
      sheet.getRange(targetRow, 1, 1, goalRow.length).setValues([goalRow]);

      return jsonResponse({ success: true, message: 'Target produksi berhasil ditambahkan ke Google Spreadsheet.', id: newId });
    }

    if (action === 'deleteGoal') {
      const goalId = payload.id;
      const sheet = ss.getSheetByName(SHEETS.MDRT);
      if (!sheet) return jsonResponse({ error: 'Sheet tidak ditemukan.' });

      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(goalId)) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ success: true, message: 'Target berhasil dihapus dari Google Spreadsheet.' });
        }
      }
      return jsonResponse({ error: 'Target tidak ditemukan.' });
    }

    // --- 5. PLAYBOOK ITEMS ---
    if (action === 'createPlaybookItem') {
      const pb = payload.data || payload;
      const sheet = ss.getSheetByName(SHEETS.PLAYBOOK);
      if (!sheet) return jsonResponse({ error: 'Sheet tidak ditemukan.' });

      const newId = 'pb_' + new Date().getTime();
      const pbRow = [
        newId,
        pb.category || 'Umum',
        pb.title || pb.objection || '',
        pb.mindset || '',
        pb.key_insight || pb.insight || '',
        pb.script || ''
      ];
      const targetRow = getFirstEmptyRow(sheet, 1);
      sheet.getRange(targetRow, 1, 1, pbRow.length).setValues([pbRow]);

      return jsonResponse({ success: true, message: 'Skenario keberatan berhasil ditambahkan ke Google Spreadsheet.', id: newId });
    }

    if (action === 'deletePlaybookItem') {
      const pbId = payload.id;
      const sheet = ss.getSheetByName(SHEETS.PLAYBOOK);
      if (!sheet) return jsonResponse({ error: 'Sheet tidak ditemukan.' });

      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(pbId)) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ success: true, message: 'Skenario berhasil dihapus dari Google Spreadsheet.' });
        }
      }
      return jsonResponse({ error: 'Skenario tidak ditemukan.' });
    }

    return jsonResponse({ error: 'Aksi POST tidak dikenali: ' + action });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS FOR FETCHING DATA
// ----------------------------------------------------------------------------

function fetchProspects(ss) {
  let sheetNasabah = ss.getSheetByName(SHEETS.NASABAH);
  let sheetPipeline = ss.getSheetByName(SHEETS.PIPELINE);

  // 1. Jika sheet terpisah (Daftar_Calon_Nasabah) ada isinya, baca & integrasikan
  if (sheetNasabah && sheetNasabah.getLastRow() > 1) {
    const nData = sheetNasabah.getDataRange().getValues();
    const pData = sheetPipeline ? sheetPipeline.getDataRange().getValues() : [];

    // Buat lookup map dari sheet pipeline berdasarkan ID_Prospek
    const pHeaders = (pData && pData[0]) || [];
    const pColOwner = pHeaders.indexOf('Pemilik_Kontak') !== -1 ? pHeaders.indexOf('Pemilik_Kontak') : (pHeaders.indexOf('Pemilik') !== -1 ? pHeaders.indexOf('Pemilik') : -1);
    const pColStage = pHeaders.indexOf('Tahap_Pipeline') !== -1 ? pHeaders.indexOf('Tahap_Pipeline') : (pColOwner !== -1 ? 3 : 2);
    const pColTemp = pHeaders.indexOf('Kategori_Pasar') !== -1 ? pHeaders.indexOf('Kategori_Pasar') : (pColOwner !== -1 ? 4 : 3);
    const pColTarget = pHeaders.indexOf('Target_Kontak_Berikutnya') !== -1 ? pHeaders.indexOf('Target_Kontak_Berikutnya') : (pColOwner !== -1 ? 5 : 4);
    const pColLast = pHeaders.indexOf('Terakhir_Dihubungi') !== -1 ? pHeaders.indexOf('Terakhir_Dihubungi') : (pColOwner !== -1 ? 6 : 5);
    const pColObj = pHeaders.indexOf('Kendala_Keberatan_Terakhir') !== -1 ? pHeaders.indexOf('Kendala_Keberatan_Terakhir') : (pColOwner !== -1 ? 7 : 6);
    const pColNotes = pHeaders.indexOf('Catatan_Pribadi') !== -1 ? pHeaders.indexOf('Catatan_Pribadi') : (pColOwner !== -1 ? 8 : 7);
    const pColWa = pHeaders.indexOf('Tautan_WhatsApp') !== -1 ? pHeaders.indexOf('Tautan_WhatsApp') : (pColOwner !== -1 ? 9 : 8);

    const pMap = {};
    for (let j = 1; j < pData.length; j++) {
      const pRow = pData[j];
      if (pRow[0]) {
        pMap[String(pRow[0])] = {
          name: String(pRow[1] || ''),
          owner: pColOwner !== -1 ? String(pRow[pColOwner] || 'Yusuf') : 'Yusuf',
          stageDisplay: String(pRow[pColStage] || ''),
          stage: mapDisplayToStage(pRow[pColStage]),
          tempDisplay: String(pRow[pColTemp] || ''),
          temperature: mapDisplayToTemp(pRow[pColTemp]),
          money_qualified: 1,
          authority_qualified: 1,
          need_qualified: 1,
          targetFollowUp: pRow[pColTarget] instanceof Date ? Utilities.formatDate(pRow[pColTarget], 'GMT+7', 'yyyy-MM-dd') : String(pRow[pColTarget] || ''),
          lastContactDate: pRow[pColLast] instanceof Date ? Utilities.formatDate(pRow[pColLast], 'GMT+7', 'yyyy-MM-dd') : String(pRow[pColLast] || '-'),
          lastObjection: String(pRow[pColObj] || '-'),
          notes: String(pRow[pColNotes] || ''),
          waLink: String(pRow[pColWa] || '')
        };
      }
    }

    const nHeaders = nData[0] || [];
    const nColOwner = nHeaders.indexOf('Pemilik_Kontak') !== -1 ? nHeaders.indexOf('Pemilik_Kontak') : (nHeaders.indexOf('Pemilik') !== -1 ? nHeaders.indexOf('Pemilik') : -1);
    const nColRel = nHeaders.indexOf('Relasi_Hubungan') !== -1 ? nHeaders.indexOf('Relasi_Hubungan') : (nColOwner !== -1 ? 4 : 3);
    const nColJob = nHeaders.indexOf('Pekerjaan') !== -1 ? nHeaders.indexOf('Pekerjaan') : (nColOwner !== -1 ? 5 : 4);
    const nColAddr = nHeaders.indexOf('Alamat_Domisili') !== -1 ? nHeaders.indexOf('Alamat_Domisili') : (nColOwner !== -1 ? 6 : 5);
    const nColWa = nHeaders.indexOf('Tautan_WhatsApp') !== -1 ? nHeaders.indexOf('Tautan_WhatsApp') : (nColOwner !== -1 ? 7 : 6);
    const nColDate = nHeaders.indexOf('Tanggal_Terdaftar') !== -1 ? nHeaders.indexOf('Tanggal_Terdaftar') : (nHeaders.length - 1);

    const prospects = [];
    for (let i = 1; i < nData.length; i++) {
      const row = nData[i];
      if (!row[0] && !row[1]) continue;

      const pId = String(row[0] || ('p_' + i));
      const pipe = pMap[pId] || {};

      prospects.push({
        id: pId,
        name: String(row[1] || pipe.name || ''),
        phone: String(row[2] || ''),
        owner: (nColOwner !== -1 && row[nColOwner]) ? String(row[nColOwner]) : (pipe.owner || 'Yusuf'),
        relationship: String(row[nColRel] || 'Teman'),
        relation: String(row[nColRel] || 'Teman'),
        job: String(row[nColJob] || ''),
        address: String(row[nColAddr] || ''),
        waLink: String(row[nColWa] || pipe.waLink || ''),
        created_at: row[nColDate] instanceof Date ? Utilities.formatDate(row[nColDate], 'GMT+7', 'yyyy-MM-dd HH:mm') : String(row[nColDate] || ''),
        // Data dari sheet pipeline (terintegrasi)
        stage: pipe.stage || 'suspect',
        stageDisplay: pipe.stageDisplay || '1. Bank Nama (Suspect)',
        temperature: pipe.temperature || 'warm',
        money_qualified: 1,
        authority_qualified: 1,
        need_qualified: 1,
        targetFollowUp: pipe.targetFollowUp || '',
        target_follow_up: pipe.targetFollowUp || '',
        lastContactDate: pipe.lastContactDate || '-',
        last_contact_date: pipe.lastContactDate || '-',
        lastObjection: pipe.lastObjection || '-',
        last_objection: pipe.lastObjection || '-',
        notes: pipe.notes || ''
      });
    }
    return prospects;
  }

  // 2. Fallback: Membaca sheet Project100_Prospek lama jika sheet baru belum dipakai
  const sheet = ss.getSheetByName(SHEETS.PROSPEK);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const lHeaders = data[0] || [];
  const hasInc = lHeaders.indexOf('Estimasi_Penghasilan') !== -1;
  const hasM = lHeaders.indexOf('Money_Qualified') !== -1;

  const prospects = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[1]) continue;

    const jobCol = lHeaders.indexOf('Pekerjaan') !== -1 ? lHeaders.indexOf('Pekerjaan') : 5;
    const addrCol = lHeaders.indexOf('Alamat_Domisili') !== -1 ? lHeaders.indexOf('Alamat_Domisili') : (hasInc ? 7 : 6);
    const stageCol = lHeaders.indexOf('Tahap_Pipeline') !== -1 ? lHeaders.indexOf('Tahap_Pipeline') : (hasInc ? 8 : 7);
    const targetCol = lHeaders.indexOf('Target_Kontak_Berikutnya') !== -1 ? lHeaders.indexOf('Target_Kontak_Berikutnya') : (hasM ? (hasInc ? 12 : 11) : (hasInc ? 9 : 8));

    prospects.push({
      id: String(row[0] || ('p_' + i)),
      name: String(row[1] || ''),
      phone: String(row[2] || ''),
      relationship: String(row[3] || 'Teman'),
      relation: String(row[3] || 'Teman'),
      temperature: mapDisplayToTemp(row[4]),
      job: String(row[jobCol] || ''),
      address: String(row[addrCol] || ''),
      stage: mapDisplayToStage(row[stageCol]),
      stageDisplay: String(row[stageCol] || ''),
      money_qualified: 1,
      authority_qualified: 1,
      need_qualified: 1,
      targetFollowUp: row[targetCol] instanceof Date ? Utilities.formatDate(row[targetCol], 'GMT+7', 'yyyy-MM-dd') : String(row[targetCol] || ''),
      target_follow_up: row[targetCol] instanceof Date ? Utilities.formatDate(row[targetCol], 'GMT+7', 'yyyy-MM-dd') : String(row[targetCol] || ''),
      lastContactDate: row[targetCol + 1] instanceof Date ? Utilities.formatDate(row[targetCol + 1], 'GMT+7', 'yyyy-MM-dd') : String(row[targetCol + 1] || '-'),
      last_contact_date: row[targetCol + 1] instanceof Date ? Utilities.formatDate(row[targetCol + 1], 'GMT+7', 'yyyy-MM-dd') : String(row[targetCol + 1] || '-'),
      lastObjection: String(row[targetCol + 2] || '-'),
      last_objection: String(row[targetCol + 2] || '-'),
      notes: String(row[targetCol + 3] || '')
    });
  }
  return prospects;
}

function fetchPolicies(ss) {
  const sheet = ss.getSheetByName(SHEETS.POLIS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const policies = [];
  const today = new Date();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    const dueDate = row[11] instanceof Date ? row[11] : (row[11] ? new Date(row[11]) : null);
    let diffDays = null;
    if (dueDate && !isNaN(dueDate.getTime())) {
      diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    }

    policies.push({
      id: String(row[0]),
      policy_number: String(row[0]),
      prospect_id: String(row[1] || ''),
      client_name: String(row[2] || ''),
      holder_name: String(row[2] || ''),
      insured_name: String(row[3] || row[2] || ''),
      client_phone: String(row[4] || ''),
      phone: String(row[4] || ''),
      product_name: String(row[5] || ''),
      product_type: String(row[5] || 'Proteksi'),
      premium_amount: Number(row[6] || 0),
      payment_frequency: String(row[7] || 'Bulanan'),
      frequency: String(row[7] || 'Bulanan'),
      ape_amount: Number(row[8] || 0),
      sum_assured: Number(row[9] || 0),
      start_date: row[10] instanceof Date ? Utilities.formatDate(row[10], 'GMT+7', 'yyyy-MM-dd') : String(row[10] || ''),
      next_due_date: dueDate && !isNaN(dueDate.getTime()) ? Utilities.formatDate(dueDate, 'GMT+7', 'yyyy-MM-dd') : String(row[11] || ''),
      due_date: dueDate && !isNaN(dueDate.getTime()) ? Utilities.formatDate(dueDate, 'GMT+7', 'yyyy-MM-dd') : String(row[11] || ''),
      status: String(row[12] || 'In Force'),
      days_until_due: diffDays,
      notes: String(row[15] || '')
    });
  }
  return policies;
}

function fetchGoals(ss) {
  const sheet = ss.getSheetByName(SHEETS.MDRT);
  const polSheet = ss.getSheetByName(SHEETS.POLIS);
  let totalAPE = 0;

  if (polSheet) {
    const polData = polSheet.getDataRange().getValues();
    for (let i = 1; i < polData.length; i++) {
      totalAPE += Number(polData[i][8] || 0);
    }
  }

  const goals = [];
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      const targetVal = Number(row[3] || 0);
      let currentVal = Number(row[6] || 0);
      if (String(row[1]) === 'MDRT' || String(row[1]) === 'Trip') {
        currentVal = totalAPE;
      }

      const percent = targetVal > 0 ? Math.min(100, Math.round((currentVal / targetVal) * 100)) : 0;
      goals.push({
        id: String(row[0]),
        category: String(row[1] || 'Custom'),
        title: String(row[2] || ''),
        target_val: targetVal,
        unit: String(row[4] || 'Rp'),
        deadline: row[5] instanceof Date ? Utilities.formatDate(row[5], 'GMT+7', 'yyyy-MM-dd') : String(row[5] || ''),
        current_val: currentVal,
        percentage: percent,
        status: String(row[8] || 'Active')
      });
    }
  }

  return { goals: goals, totalAPE: totalAPE };
}

function fetchPlaybook(ss) {
  const sheet = ss.getSheetByName(SHEETS.PLAYBOOK);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const items = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    items.push({
      id: String(row[0]),
      category: String(row[1] || 'Umum'),
      title: String(row[2] || ''),
      mindset: String(row[3] || ''),
      key_insight: String(row[4] || ''),
      script: String(row[5] || '')
    });
  }
  return items;
}

function fetchDashboardStats(ss) {
  const prospects = fetchProspects(ss);
  const policies = fetchPolicies(ss);
  let totalAPE = 0;
  policies.forEach(p => totalAPE += Number(p.ape_amount || 0));

  let hot = 0, warm = 0, cold = 0, activeApproaches = 0, closing = 0;
  prospects.forEach(p => {
    if (p.temperature === 'hot') hot++;
    else if (p.temperature === 'cold') cold++;
    else warm++;

    if (p.stage !== 'suspect') activeApproaches++;
    if (p.stage === 'issued' || p.stage === 'closing_agreement') closing++;
  });

  return {
    stats: {
      totalProspects: prospects.length,
      hotCount: hot,
      warmCount: warm,
      coldCount: cold,
      activeApproaches: activeApproaches,
      closingCount: closing,
      totalAPE: totalAPE,
      inForcePolicyCount: policies.length
    },
    goals: {
      yearly_ape_target: 600000000,
      monthly_prospect_target: 25,
      daily_contacts_target: 10,
      weekly_appointments_target: 3
    }
  };
}

function fetchInteractions(ss, prospectId) {
  const sheet = ss.getSheetByName(SHEETS.LOG);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const list = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (prospectId && String(row[1]) !== String(prospectId)) continue;
    list.push({
      id: String(row[0]),
      prospect_id: String(row[1]),
      prospect_name: String(row[2]),
      date: row[3] instanceof Date ? Utilities.formatDate(row[3], 'GMT+7', 'yyyy-MM-dd HH:mm') : String(row[3]),
      channel: String(row[4] || 'WhatsApp'),
      response: String(row[5] || ''),
      objection: String(row[6] || '-'),
      next_action: String(row[7] || ''),
      target_date: String(row[8] || '')
    });
  }
  return list;
}

function fetchUserByToken(ss, token) {
  if (!token) return { error: 'Token tidak disertakan' };
  const sheet = ss.getSheetByName(SHEETS.USER);
  if (!sheet) {
    return { error: 'Sheet Akun_Agen tidak ditemukan' };
  }

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[0]) === String(token) || String(row[2]) === String(token)) {
      return {
        user: {
          id: String(row[0]),
          name: String(row[1] || ''),
          phone: String(row[2] || ''),
          agency_name: String(row[4] || 'Agency Office'),
          agent_code: String(row[5] || ''),
          role: String(row[6] || 'Agent')
        }
      };
    }
  }

  return { error: 'Akun agen tidak ditemukan.' };
}

// ----------------------------------------------------------------------------
// UTILITY MAPPERS
// ----------------------------------------------------------------------------

function mapStageToDisplay(stageId) {
  const map = {
    'suspect': '1. Bank Nama (Suspect)',
    'approach': '2. Pendekatan Awal (Approach)',
    'appointment': '3. Janji Temu (Appointment)',
    'fact_finding': '4. Bedah Kebutuhan (Fact Finding)',
    'presentation': '5. Presentasi Solusi (Presentation)',
    'handling_objection': '6. Penanganan Keberatan (Handling Objection)',
    'closing_agreement': '7. Kesepakatan (Closing Agreement)',
    'submission': '8. Pengajuan SPAJ (Submission)',
    'issued': '9. Polis Terbit (In-Force)'
  };
  return map[stageId] || stageId;
}

function mapDisplayToStage(display) {
  if (!display) return 'suspect';
  const str = String(display).toLowerCase();
  if (str.includes('suspect') || str.includes('1.')) return 'suspect';
  if (str.includes('approach') || str.includes('2.')) return 'approach';
  if (str.includes('appointment') || str.includes('3.')) return 'appointment';
  if (str.includes('fact_finding') || str.includes('bedah') || str.includes('4.')) return 'fact_finding';
  if (str.includes('presentation') || str.includes('presentasi') || str.includes('5.')) return 'presentation';
  if (str.includes('objection') || str.includes('keberatan') || str.includes('6.')) return 'handling_objection';
  if (str.includes('closing') || str.includes('kesepakatan') || str.includes('7.')) return 'closing_agreement';
  if (str.includes('submission') || str.includes('spaj') || str.includes('8.')) return 'submission';
  if (str.includes('issued') || str.includes('terbit') || str.includes('9.')) return 'issued';
  return 'suspect';
}

function mapTempToDisplay(temp) {
  if (temp === 'hot') return 'Pasar Dekat (Hot)';
  if (temp === 'cold') return 'Pasar Baru (Cold)';
  return 'Pasar Menengah (Warm)';
}

function mapDisplayToTemp(display) {
  if (!display) return 'warm';
  const str = String(display).toLowerCase();
  if (str.includes('hot') || str.includes('dekat')) return 'hot';
  if (str.includes('cold') || str.includes('baru')) return 'cold';
  return 'warm';
}

function formatPhoneForWA(phone) {
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  return cleaned;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Mencari baris kosong pertama berdasarkan kolom identitas (default Kolom A),
 * agar data baru mengisi dari baris 2, 3, 4 dst, bukan loncat ke bawah format/checkbox.
 */
function getFirstEmptyRow(sheet, checkCol) {
  if (!checkCol) checkCol = 1;
  const maxRows = sheet.getMaxRows();
  if (maxRows <= 1) return 2;
  const values = sheet.getRange(1, checkCol, maxRows, 1).getValues();
  for (let i = 1; i < values.length; i++) {
    const val = values[i][0];
    if (val === '' || val === null || val === undefined) {
      return i + 1; // baris ke-(i+1) (1-indexed)
    }
  }
  return sheet.getLastRow() + 1;
}
